import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { register, login, magicLink, resetPasswordRequest, resetPassword } from './auth.controller';
import { getProfile, updateProfile, getWallet } from './user.controller';
import { authenticateToken } from './auth';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: 'http://localhost:8080', // Matches your Vite frontend port
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Auth Routes
app.post('/api/v1/auth/register', register);
app.post('/api/v1/auth/login', login);
app.post('/api/v1/auth/magic-link', magicLink);
app.post('/api/v1/auth/reset-password-request', resetPasswordRequest);
app.post('/api/v1/auth/reset-password', resetPassword);

// User Routes
app.get('/api/v1/user/profile', authenticateToken, getProfile);
app.put('/api/v1/user/profile', authenticateToken, updateProfile);
app.get('/api/v1/user/wallet', authenticateToken, getWallet);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});