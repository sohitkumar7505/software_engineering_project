import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import plannerRoutes from './routes/plannerRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5002;
const host = process.env.HOST || '127.0.0.1';

connectDB();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Server is running.' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/planner', plannerRoutes);
app.use('/api/v1/chat', chatRoutes);

const server = app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});

server.on('error', (error) => {
  console.error('Server startup error:', error.message);
  process.exit(1);
});
