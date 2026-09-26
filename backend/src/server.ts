import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import { SimulationEngine } from './services/simulationEngine.js';
import { DbStore } from './services/dbStore.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || '*';

// Socket.io initialization with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'NCPOR Polar Expedition Logistics & Asset Management Backend',
    timestamp: new Date().toISOString(),
    stations_active: 2,
    connectivity: DbStore.getInstance().getSatelliteState().status
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] Polar telemetry client connected: ${socket.id}`);

  // Send immediate bootstrap snapshot
  const store = DbStore.getInstance();
  socket.emit('telemetry:bootstrap', {
    simulation: store.getSimulationState(),
    satellite: store.getSatelliteState(),
    stations: store.getStations()
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Attach socket server to simulation engine
const simEngine = SimulationEngine.getInstance();
simEngine.setSocketServer(io);
simEngine.start();

// Start Server
server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`  NCPOR POLAR LOGISTICS & ASSET MANAGEMENT SYSTEM (PROTOTYPE)   `);
  console.log(`  Indian Antarctic Expeditions: Maitri - Bharati - Cape Town    `);
  console.log(`  Backend listening on http://localhost:${PORT}                 `);
  console.log(`  WebSocket live telemetry active on ws://localhost:${PORT}     `);
  console.log(`================================================================`);
});

export { app, server, io };
