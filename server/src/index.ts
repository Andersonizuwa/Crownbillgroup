import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import helmet from 'helmet';
import { generalRateLimiter } from './middleware/security.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import tradeRoutes from './routes/trade.routes';
import { priceSimulator } from './lib/priceSimulator';


const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173', // Vite default
  'http://localhost:8080', // Provided origin
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Limit body size
app.use(cookieParser());
app.use(generalRateLimiter);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Auth Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/trades', tradeRoutes);


app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start price simulator for live market data
  priceSimulator.start(5000); // Update prices every 5 seconds
  console.log('💹 Live price simulator started');
});