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
import settingsRoutes from './routes/settings.routes';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:8080', 'http://localhost:8081', 'http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Auth & User Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1', settingsRoutes);

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