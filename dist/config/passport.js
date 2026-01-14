import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { User, UserRole } from '../models/User.js';
import { config } from './config.js';
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    }
    catch (err) {
        done(err);
    }
});
passport.use(new DiscordStrategy({
    clientID: config.DISCORD_CLIENT_ID,
    clientSecret: config.DISCORD_CLIENT_SECRET,
    callbackURL: config.DISCORD_CALLBACK_URL,
    scope: ['identify', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ discordId: profile.id });
        if (!user) {
            user = new User({
                discordId: profile.id,
                username: profile.username,
                email: profile.email,
                avatar: profile.avatar,
                role: UserRole.DEFAULT
            });
            await user.save();
        }
        else {
            // Update user info
            user.username = profile.username;
            user.email = profile.email;
            user.avatar = profile.avatar;
            await user.save();
        }
        done(null, user);
    }
    catch (err) {
        done(err);
    }
}));
export default passport;
