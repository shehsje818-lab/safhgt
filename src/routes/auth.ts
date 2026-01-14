import { Router, Response } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/config.js';
import { AuthRequest } from '../middleware/auth.js';

const router = Router();

// Discord OAuth callback
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
