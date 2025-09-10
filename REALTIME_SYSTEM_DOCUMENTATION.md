# NestFest Real-time System Documentation

## Overview

The NestFest real-time system provides comprehensive live event functionality supporting 10,000+ concurrent users. The system includes live voting, event management, Shark Tank mode, performance monitoring, and advanced fraud detection.

## Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   WebSocket     │    │   Backend       │
│   Components    │◄──►│   Server        │◄──►│   Services      │
│                 │    │   (Socket.io)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Real-time     │    │   Performance   │    │   Fraud         │
│   UI Updates    │    │   Monitor       │    │   Detection     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                                 ▼
                    ┌─────────────────┐
                    │   Redis Cache   │
                    │   & Pub/Sub     │
                    └─────────────────┘
```

### Technology Stack

- **WebSocket Server**: Socket.io with Redis adapter for horizontal scaling
- **Performance Monitoring**: Custom monitoring system with metrics collection
- **Fraud Detection**: Real-time pattern analysis and anomaly detection  
- **Frontend**: React with real-time hooks and components
- **Caching**: Redis for session management and pub/sub messaging
- **Database**: Supabase for persistent data storage

## Features

### 1. Live Voting System

**Location**: `src/components/real-time/LiveVotingInterface.tsx`

- **Real-time vote casting** with instant feedback
- **Live result updates** with smooth animations
- **Voting momentum tracking** and trend analysis
- **Fraud detection alerts** and vote blocking
- **Multiple voting types**: Simple, Quadratic, Ranked, Approval
- **Optimistic updates** with error rollback

```typescript
// Example usage
<LiveVotingInterface
  competition={competition}
  submissions={submissions}
  votingBudget={budget}
  showMomentum={true}
  showFraudAlerts={isAdmin}
  onVoteSubmitted={handleVoteSubmitted}
/>
```

### 2. Event Day Management

**Location**: `src/components/real-time/EventDayManager.tsx`

- **Live event sessions** with presentation management
- **Real-time audience engagement** (reactions, heat maps)
- **Synchronized countdown timers**
- **Live leaderboards** with ranking updates
- **Admin controls** for event flow management
- **Emergency controls** and overrides

```typescript
// Example usage
<EventDayManager
  session={eventSession}
  submissions={submissions}
  isAdmin={true}
  showAudienceView={false}
/>
```

### 3. Shark Tank Mode

**Location**: `src/components/real-time/SharkTankMode.tsx`

- **Live deal making** during presentations
- **Real-time judge offer tracking**
- **Audience investment pool** simulation
- **Interactive pitch evaluation**
- **Deal negotiation workflows**
- **Investment tracking** and analytics

```typescript
// Example usage
<SharkTankMode
  session={sharkTankSession}
  currentSubmission={activeSubmission}
  judges={judges}
  isJudge={user.role === 'judge'}
  isAdmin={user.role === 'admin'}
/>
```

### 4. Live Dashboard

**Location**: `src/components/real-time/LiveDashboard.tsx`

- **Real-time analytics** and metrics visualization
- **Live notifications** and alerts
- **Activity feeds** and status updates
- **Performance monitoring** dashboards
- **System health indicators**
- **Geographic voting patterns**
- **Sentiment analysis** displays

```typescript
// Example usage
<LiveDashboard
  competition={competition}
  showSystemHealth={isAdmin}
  showGeographics={true}
  showSentiment={true}
/>
```

## Performance & Scalability

### Performance Monitor

**Location**: `src/lib/real-time/performance-monitor.ts`

- **Message batching** for efficient broadcasting
- **Connection pooling** and load balancing
- **Rate limiting** for socket events
- **Memory and CPU monitoring**
- **Automatic scaling** recommendations
- **Performance analytics** and reporting

### Fraud Detection

**Location**: `src/lib/real-time/fraud-detector.ts`

- **Suspicious voting pattern** detection
- **Rapid voting anomaly** detection
- **Duplicate vote prevention**
- **Bot activity identification**
- **IP-based analysis**
- **Behavioral pattern analysis**
- **Real-time alert generation**

### Load Testing

**Location**: `load-test.js`

Comprehensive load testing script that:
- Simulates 10,000+ concurrent users
- Tests voting throughput and latency
- Validates fraud detection effectiveness
- Monitors system stability
- Generates detailed performance reports

```bash
# Run load test
node load-test.js 10000 60000  # 10k users for 60 seconds
```

## WebSocket API

### Connection Events

```javascript
// Client connection with authentication
const socket = io('http://localhost:8080', {
  auth: { token: jwtToken }
});

// Connection status
socket.on('connect', () => {
  console.log('Connected to real-time server');
});
```

### Room Management

```javascript
// Join competition room
socket.emit('join_competition', { competitionId });

// Join event session
socket.emit('join_session', { sessionId });
```

### Voting Events

```javascript
// Cast vote
socket.emit('cast_vote', {
  competitionId,
  submissionId,
  voteType: 'simple',
  voteData: { value: 5 }
});

// Listen for vote updates
socket.on('vote_update', (update) => {
  // Handle real-time vote count updates
});

// Vote acknowledgment
socket.on('vote_acknowledged', (response) => {
  // Vote successfully processed
});

// Vote errors
socket.on('vote_error', (error) => {
  // Handle voting errors
});
```

### Event Management

```javascript
// Send reaction during presentation
socket.emit('send_reaction', {
  sessionId,
  submissionId,
  reactionType: 'clap',
  intensity: 8,
  coordinates: { x: 400, y: 300 }
});

// Admin controls
socket.emit('admin_control', {
  type: 'presentation_control',
  data: { action: 'next', sessionId }
});
```

### Shark Tank Events

```javascript
// Make offer
socket.emit('shark_tank_offer', {
  sessionId,
  submissionId,
  judgeId: user.id,
  offerType: 'equity',
  amount: 100000,
  equityPercentage: 15,
  conditions: ['Board seat', 'Monthly reports']
});

// Respond to offer
socket.emit('offer_response', {
  offerId,
  response: 'accepted'
});
```

## Configuration

### Environment Variables

```env
# WebSocket Configuration
WEBSOCKET_URL=http://localhost:8080
NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:8080

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Performance Settings
MESSAGE_BATCH_SIZE=10
MESSAGE_BATCH_DELAY=100
MAX_CONNECTIONS_PER_SERVER=10000
HEALTH_CHECK_INTERVAL=30000

# Security Settings
FRAUD_DETECTION_ENABLED=true
FRAUD_SENSITIVITY=medium
FRAUD_ALERT_THRESHOLD=70
FRAUD_BLOCK_THRESHOLD=80

# Rate Limiting
RATE_LIMIT_VOTES_PER_MINUTE=10
RATE_LIMIT_REACTIONS_PER_MINUTE=30

# System Thresholds
MEMORY_THRESHOLD=80
CPU_THRESHOLD=80
ERROR_RATE_THRESHOLD=5
LATENCY_THRESHOLD=1000
```

## Deployment

### Production Setup

1. **Redis Cluster**: Deploy Redis cluster for high availability
2. **Load Balancers**: Configure load balancers for WebSocket servers
3. **Horizontal Scaling**: Run multiple server instances
4. **Monitoring**: Set up comprehensive monitoring and alerting
5. **CDN**: Use CDN for static assets and reduce latency

### Docker Configuration

```dockerfile
# WebSocket Server
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["node", "src/app/api/websocket/route.js"]
```

### Scaling Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  websocket-server:
    build: .
    ports:
      - "8080-8083:8080"
    environment:
      - REDIS_URL=redis://redis:6379
      - SERVER_REGION=us-east-1
    depends_on:
      - redis
    deploy:
      replicas: 4

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - websocket-server
```

## Monitoring & Analytics

### System Health Metrics

- **Connection count**: Current active connections
- **Message throughput**: Messages processed per second
- **Response latency**: Average response times
- **Error rates**: System error percentages
- **Memory usage**: Server memory consumption
- **CPU usage**: Server CPU utilization
- **Redis health**: Cache system status

### Fraud Detection Metrics

- **Suspicious votes**: Flagged voting patterns
- **Blocked votes**: Votes prevented by fraud detection
- **Alert frequency**: Fraud alerts per hour
- **False positive rate**: Incorrectly flagged legitimate votes
- **Detection accuracy**: Confirmed fraud vs. total alerts

### Performance Benchmarks

- **Target**: 10,000+ concurrent connections
- **Vote throughput**: 1,000+ votes per second
- **Response latency**: <500ms average
- **Uptime**: 99.9% availability
- **Error rate**: <1% system errors
- **Fraud detection**: <5% false positives

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check JWT token validity
   - Verify user permissions
   - Monitor server capacity

2. **High Latency**
   - Enable message batching
   - Optimize database queries
   - Check Redis performance

3. **Fraud False Positives**
   - Adjust detection thresholds
   - Review user behavior patterns
   - Update fraud rules

4. **Memory Issues**
   - Clean up stale connections
   - Optimize data structures
   - Increase server resources

### Debug Commands

```bash
# Check WebSocket server status
curl http://localhost:8080/api/websocket

# Monitor Redis connections
redis-cli monitor

# Check system resources
htop
free -h
df -h

# View application logs
tail -f logs/websocket-server.log
```

## Security Considerations

### Authentication & Authorization
- JWT token validation for all connections
- Role-based access control for features
- Session management with Redis

### Rate Limiting
- Per-user voting rate limits
- IP-based connection limits
- Event-specific rate limiting

### Data Protection
- Input validation and sanitization
- XSS and CSRF protection
- Secure WebSocket connections (WSS)

### Fraud Prevention
- Real-time pattern analysis
- Behavioral anomaly detection
- IP reputation checking
- Bot activity identification

## Future Enhancements

### Planned Features
- **Machine Learning**: Advanced fraud detection using ML models
- **Geographic Analytics**: Enhanced location-based insights
- **Voice Integration**: Voice reactions and commands
- **Mobile Optimization**: Native mobile app support
- **AI Moderation**: Automated content moderation
- **Blockchain Integration**: Immutable voting records

### Scalability Improvements
- **Microservices**: Break down into smaller services
- **Event Sourcing**: Implement event-driven architecture
- **Edge Computing**: Deploy servers closer to users
- **Auto-scaling**: Dynamic resource allocation
- **Multi-region**: Global server distribution

## Support & Maintenance

### Regular Tasks
- Monitor system health metrics
- Update fraud detection rules
- Clean up old connection data
- Performance optimization reviews
- Security vulnerability assessments

### Contact Information
- **Development Team**: dev@nestfest.com
- **System Admin**: admin@nestfest.com
- **Emergency Contact**: emergency@nestfest.com

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready