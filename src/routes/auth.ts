import { Router, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/config.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Discord OAuth callback (GET - from Discord redirect)
router.get(
  '/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req: AuthRequest, res: Response) => {
    const user = req.user;
    const token = jwt.sign(
      { userId: user._id, discordId: user.discordId },
      config.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(`${config.FRONTEND_URL}?token=${token}&user=${JSON.stringify({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      joinedAt: user.joinedAt
    })}`);
  }
);

// Discord OAuth callback (POST - for frontend API calls)
// This handles the actual code exchange from Discord
router.post(
  '/discord/callback',
  async (req: AuthRequest, res: Response) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'No authorization code provided' });
      }

      // Exchange code for access token
      const response = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: config.DISCORD_CLIENT_ID,
          client_secret: config.DISCORD_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: config.DISCORD_CALLBACK_URL,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await response.json() as any;

      // Get user info from Discord
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const discordUser = await userResponse.json() as any;

      // Find or create user in database
      let user = await User.findOne({ discordId: discordUser.id });
      
      if (!user) {
        user = new User({
          discordId: discordUser.id,
          username: discordUser.username,
          email: discordUser.email,
          avatar: discordUser.avatar,
          role: 'member'
        });
        await user.save();
      } else {
        // Update user info
        user.username = discordUser.username;
        user.email = discordUser.email;
        user.avatar = discordUser.avatar;
        await user.save();
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, discordId: user.discordId },
        config.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          joinedAt: user.joinedAt
        }
      });
    } catch (err: any) {
      console.error('Discord callback error:', err);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }
);

// Get Discord OAuth URL
router.get('/discord/url', (req: AuthRequest, res: Response) => {
  const clientID = config.DISCORD_CLIENT_ID;
  const redirectURL = encodeURIComponent(config.DISCORD_CALLBACK_URL);
  const scope = encodeURIComponent('identify email');
  const url = `https://discord.com/api/oauth2/authorize?client_id=${clientID}&redirect_uri=${redirectURL}&response_type=code&scope=${scope}`;
  res.json({ url });
});

// Get current user
router.get('/me', async (req: AuthRequest, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as any;
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      joinedAt: user.joinedAt
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout
router.post('/logout', (req: AuthRequest, res: Response) => {
  req.logout((err: any) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;
