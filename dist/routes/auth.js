import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { config } from '../config/config.js';
const router = Router();
// Discord OAuth callback (GET - from Discord redirect)
router.get('/discord/callback', async (req, res) => {
    try {
        const { code } = req.query;
        console.log('=== DISCORD CALLBACK GET ===');
        console.log('Query params:', req.query);
        console.log('Code received:', code ? 'YES' : 'NO');
        if (!code) {
            console.log('ERROR: No code provided');
            return res.status(400).json({ error: 'No authorization code provided' });
        }
        // Try multiple redirect URIs (might be frontend or server)
        const redirectUris = [
            config.DISCORD_CALLBACK_URL,
            `${config.FRONTEND_URL}/auth/discord/callback`
        ];
        let tokenData = null;
        let lastError = '';
        for (const redirectUri of redirectUris) {
            try {
                console.log(`Trying redirect_uri: ${redirectUri}`);
                const body = new URLSearchParams({
                    client_id: config.DISCORD_CLIENT_ID,
                    client_secret: config.DISCORD_CLIENT_SECRET,
                    code: code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri,
                });
                const response = await fetch('https://discord.com/api/oauth2/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: body,
                });
                const responseText = await response.text();
                console.log(`Response status for ${redirectUri}:`, response.status);
                console.log(`Response:`, responseText);
                if (response.ok) {
                    tokenData = JSON.parse(responseText);
                    console.log(`✅ Success with redirect_uri: ${redirectUri}`);
                    break;
                }
                else {
                    lastError = responseText;
                }
            }
            catch (err) {
                console.log(`Failed with ${redirectUri}:`, err.message);
            }
        }
        if (!tokenData) {
            console.error('❌ All redirect URIs failed. Last error:', lastError);
            return res.status(500).json({ error: `Discord error: ${lastError}` });
        }
        // Get user info from Discord
        console.log('Fetching user info from Discord...');
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });
        if (!userResponse.ok) {
            console.error('❌ Failed to get Discord user info');
            return res.status(500).json({ error: 'Failed to get user info' });
        }
        const discordUser = await userResponse.json();
        console.log('✅ Got Discord user:', discordUser.username);
        // Find or create user in database
        console.log('Looking up user in database...');
        let user = await User.findOne({ discordId: discordUser.id });
        if (!user) {
            console.log('Creating new user...');
            user = new User({
                discordId: discordUser.id,
                username: discordUser.username,
                email: discordUser.email,
                avatar: discordUser.avatar,
                role: 'member'
            });
            await user.save();
            console.log('✅ User created');
        }
        else {
            console.log('✅ User found, updating...');
            user.username = discordUser.username;
            user.email = discordUser.email;
            user.avatar = discordUser.avatar;
            await user.save();
        }
        // Generate JWT token
        const jwtToken = jwt.sign({ userId: user._id, discordId: user.discordId }, config.JWT_SECRET, { expiresIn: '7d' });
        console.log('✅ Generated JWT token');
        // Redirect to frontend with token
        const redirectUrl = `${config.FRONTEND_URL}?token=${jwtToken}&user=${encodeURIComponent(JSON.stringify({
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            role: user.role,
            joinedAt: user.joinedAt
        }))}`;
        console.log('✅ Redirecting to:', config.FRONTEND_URL);
        res.redirect(redirectUrl);
    }
    catch (err) {
        console.error('❌ Discord callback error:', err.message);
        console.error(err);
        res.status(500).json({ error: 'Auth failed: ' + err.message });
    }
});
// Discord OAuth callback (POST - for frontend API calls)
router.post('/discord/callback', async (req, res) => {
    try {
        const { code } = req.body;
        console.log('=== DISCORD CALLBACK POST ===');
        console.log('Code received:', code ? 'YES' : 'NO');
        if (!code) {
            return res.status(400).json({ error: 'No authorization code provided' });
        }
        // Try multiple redirect URIs
        const redirectUris = [
            config.DISCORD_CALLBACK_URL,
            `${config.FRONTEND_URL}/auth/discord/callback`
        ];
        let tokenData = null;
        let lastError = '';
        for (const redirectUri of redirectUris) {
            try {
                console.log(`Trying redirect_uri: ${redirectUri}`);
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
                        redirect_uri: redirectUri,
                    }),
                });
                const responseText = await response.text();
                console.log(`Response status for ${redirectUri}:`, response.status);
                console.log(`Response:`, responseText);
                if (response.ok) {
                    tokenData = JSON.parse(responseText);
                    console.log(`✅ Success with redirect_uri: ${redirectUri}`);
                    break;
                }
                else {
                    lastError = responseText;
                }
            }
            catch (err) {
                console.log(`Failed with ${redirectUri}:`, err.message);
            }
        }
        if (!tokenData) {
            console.error('❌ All redirect URIs failed. Last error:', lastError);
            return res.status(500).json({ error: `Discord error: ${lastError}` });
        }
        // Get user info from Discord
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });
        if (!userResponse.ok) {
            throw new Error('Failed to fetch user info');
        }
        const discordUser = await userResponse.json();
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
        }
        else {
            user.username = discordUser.username;
            user.email = discordUser.email;
            user.avatar = discordUser.avatar;
            await user.save();
        }
        const token = jwt.sign({ userId: user._id, discordId: user.discordId }, config.JWT_SECRET, { expiresIn: '7d' });
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
    }
    catch (err) {
        console.error('Discord callback error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
});
// Get Discord OAuth URL
router.get('/discord/url', (req, res) => {
    const clientID = config.DISCORD_CLIENT_ID;
    const redirectURL = encodeURIComponent(config.DISCORD_CALLBACK_URL);
    const scope = encodeURIComponent('identify email');
    const url = `https://discord.com/oauth2/authorize?client_id=${clientID}&response_type=code&redirect_uri=${redirectURL}&scope=${scope}`;
    res.json({ url });
});
// Get current user
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const decoded = jwt.verify(token, config.JWT_SECRET);
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
    }
    catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});
// Logout
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});
export default router;
