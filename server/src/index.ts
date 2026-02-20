import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import tradeRoutes from './routes/trade.routes';
import adminRoutes from './routes/admin.routes';
import investmentRoutes from './routes/investment.routes';
import algoRoutes from './routes/algo.routes';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:8081'], // Matches your Vite frontend port
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Auth & User Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);

// Trading & Holdings Routes
app.use('/api/v1/trades', tradeRoutes);

// Admin Routes
app.use('/api/v1/admin', adminRoutes);

// Investment Routes
app.use('/api/v1/investments', investmentRoutes);

// Algo Application Routes
app.use('/api/v1/algo', algoRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});