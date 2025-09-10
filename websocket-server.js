/**
 * WebSocket Server for NestFest Real-time Features
 * 
 * This standalone server handles all WebSocket connections for:
 * - Live voting updates
 * - Event day management
 * - Real-time dashboards
 * - Shark Tank mode interactions
 */

const { createServer } = require('http');
const { Server } = require('socket.io');

const PORT = process.env.WEBSOCKET_PORT || 8081;

// Create HTTP server
const httpServer = createServer();

// Configure Socket.IO with CORS and Firefox compatibility
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:3000', 'http://192.168.0.138:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: false, // Set to false for Firefox compatibility
    allowedHeaders: ['content-type']
  },
  transports: ['polling', 'websocket'], // Start with polling
  allowEIO3: true, // Allow older protocol versions
  pingTimeout: 60000, // Longer timeout for Firefox
  pingInterval: 25000,
  upgradeTimeout: 10000,
  allowUpgrades: true // Allow transport upgrades
});

// Connection counter
let connectionCount = 0;
const rooms = new Map();

// Middleware for authentication (simplified for development)
io.use((socket, next) => {
  // For development, accept all connections without authentication
  socket.userId = socket.handshake.auth?.userId || `dev_user_${Date.now()}`;
  console.log(`Authentication middleware: userId=${socket.userId}`);
  next(); // Always accept connection in development
});

// Handle connection errors
io.on('connect_error', (error) => {
  console.error('Connection error:', error);
});

// Handle connections
io.on('connection', (socket) => {
  connectionCount++;
  console.log(`✅ User connected: ${socket.userId} (ID: ${socket.id}) (Total: ${connectionCount})`);

  // Send initial connection status immediately
  socket.emit('connection_status', {
    status: 'connected',
    userId: socket.userId,
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
  
  // Log all events for debugging
  socket.onAny((eventName, ...args) => {
    console.log(`📥 Event received: ${eventName}`, args);
  });

  // Join competition room
  socket.on('join_competition', ({ competitionId }) => {
    socket.join(`competition:${competitionId}`);
    socket.emit('joined_room', { room: `competition:${competitionId}` });
    console.log(`User ${socket.userId} joined competition:${competitionId}`);
  });

  // Join event session
  socket.on('join_session', ({ sessionId }) => {
    socket.join(`session:${sessionId}`);
    socket.emit('joined_room', { room: `session:${sessionId}` });
    console.log(`User ${socket.userId} joined session:${sessionId}`);
  });

  // Handle voting
  socket.on('cast_vote', (voteData) => {
    console.log(`Vote received from ${socket.userId}:`, voteData);
    
    // Acknowledge vote
    socket.emit('vote_acknowledged', {
      success: true,
      voteId: `vote_${Date.now()}`,
      timestamp: new Date().toISOString()
    });

    // Broadcast vote update to room
    const room = `competition:${voteData.competitionId}`;
    io.to(room).emit('vote_update', {
      submissionId: voteData.submissionId,
      voteType: voteData.voteType,
      newCount: Math.floor(Math.random() * 100) + 1, // Mock vote count
      timestamp: new Date().toISOString()
    });
  });

  // Handle reactions during presentations
  socket.on('send_reaction', (reactionData) => {
    const room = `session:${reactionData.sessionId}`;
    io.to(room).emit('reaction_received', {
      userId: socket.userId,
      ...reactionData,
      timestamp: new Date().toISOString()
    });
  });

  // Shark Tank offers
  socket.on('shark_tank_offer', (offerData) => {
    const room = `session:${offerData.sessionId}`;
    io.to(room).emit('new_offer', {
      offerId: `offer_${Date.now()}`,
      judgeId: socket.userId,
      ...offerData,
      timestamp: new Date().toISOString()
    });
  });

  // Admin controls
  socket.on('admin_control', (controlData) => {
    if (controlData.type === 'presentation_control') {
      const room = `session:${controlData.data.sessionId}`;
      io.to(room).emit('presentation_update', {
        action: controlData.data.action,
        timestamp: new Date().toISOString()
      });
    }
  });

  // System health ping
  socket.on('ping', () => {
    socket.emit('pong', {
      timestamp: new Date().toISOString(),
      connections: connectionCount
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    connectionCount--;
    console.log(`❌ User disconnected: ${socket.userId} (${reason}) (Total: ${connectionCount})`);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`
🚀 NestFest WebSocket Server Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Port: ${PORT}
🔗 URL: ws://localhost:${PORT}
📊 Status: Ready for connections
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  io.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, closing server...');
  io.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});