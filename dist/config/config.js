import dotenv from 'dotenv';
dotenv.config();
export const config = {
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/fakepixel',
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    DISCORD_CALLBACK_URL: process.env.DISCORD_CALLBACK_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV || 'development',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8080',
    SERVER_PORT: parseInt(process.env.SERVER_PORT || '3000', 10)
};
export const validateConfig = () => {
    const required = ['DISCORD_CLIENT_ID', 'DISCORD_CLIENT_SECRET', 'DISCORD_CALLBACK_URL', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};
