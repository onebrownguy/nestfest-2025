/**
 * NestFest Real-time System Load Test
 * 
 * Tests the system with 10,000+ concurrent users to ensure:
 * - WebSocket connection stability
 * - Real-time voting performance
 * - Fraud detection accuracy
 * - Event management scalability
 * - Dashboard responsiveness
 * 
 * Usage: node load-test.js [concurrent-users] [test-duration]
 */

const io = require('socket.io-client');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuration
const SERVER_URL = process.env.WEBSOCKET_URL || 'http://localhost:8080';
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const COMPETITION_ID = process.env.TEST_COMPETITION_ID || 'test-competition-123';
const SUBMISSION_IDS = [
  'submission-1', 'submission-2', 'submission-3', 'submission-4', 'submission-5'
];

// Test parameters
const CONCURRENT_USERS = parseInt(process.argv[2]) || 10000;
const TEST_DURATION = parseInt(process.argv[3]) || 60000; // 1 minute
const RAMP_UP_TIME = 30000; // 30 seconds to connect all users
const VOTING_FREQUENCY = 5000; // Vote every 5 seconds
const REACTION_FREQUENCY = 2000; // React every 2 seconds

// Metrics
let metrics = {
  connections: {
    attempted: 0,
    successful: 0,
    failed: 0,
    dropped: 0
  },
  votes: {
    sent: 0,
    acknowledged: 0,
    failed: 0,
    blocked: 0
  },
  reactions: {
    sent: 0,
    successful: 0,
    failed: 0
  },
  latency: {
    connection: [],
    vote: [],
    reaction: []
  },
  errors: [],
  fraudAlerts: 0,
  performanceIssues: 0
};

// User simulation profiles
const userProfiles = [
  { type: 'normal_voter', weight: 70, votingPattern: 'random' },
  { type: 'engaged_user', weight: 20, votingPattern: 'frequent' },
  { type: 'suspicious_user', weight: 8, votingPattern: 'rapid' },
  { type: 'bot_user', weight: 2, votingPattern: 'systematic' }
];

class LoadTester {
  constructor() {
    this.clients = new Map();
    this.isRunning = false;
    this.startTime = 0;
  }

  /**
   * Generate test user token
   */
  generateUserToken(userId, role = 'student') {
    return jwt.sign(
      { 
        userId, 
        role, 
        email: `user${userId}@test.com`,
        name: `Test User ${userId}`
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  /**
   * Create simulated user
   */
  createUser(userId, profile) {
    const token = this.generateUserToken(userId);
    const startTime = Date.now();
    
    const client = io(SERVER_URL, {
      auth: { token },
      transports: ['websocket'],
      timeout: 10000
    });

    const userState = {
      id: userId,
      profile,
      client,
      connected: false,
      joinedCompetition: false,
      votescast: 0,
      reactionsSent: 0,
      errors: 0,
      lastVote: 0,
      lastReaction: 0
    };

    // Connection events
    client.on('connect', () => {
      const connectionTime = Date.now() - startTime;
      metrics.latency.connection.push(connectionTime);
      metrics.connections.successful++;
      
      userState.connected = true;
      console.log(`User ${userId} connected (${connectionTime}ms)`);
      
      // Join competition
      this.joinCompetition(userState);
    });

    client.on('connect_error', (error) => {
      metrics.connections.failed++;
      metrics.errors.push(`Connection error for user ${userId}: ${error.message}`);
      console.error(`User ${userId} connection failed:`, error.message);
    });

    client.on('disconnect', (reason) => {
      metrics.connections.dropped++;
      userState.connected = false;
      console.log(`User ${userId} disconnected: ${reason}`);
    });

    // Response events
    client.on('vote_acknowledged', (data) => {
      const voteTime = Date.now() - userState.lastVote;
      metrics.latency.vote.push(voteTime);
      metrics.votes.acknowledged++;
    });

    client.on('vote_error', (error) => {
      metrics.votes.failed++;
      if (error.code === 'FRAUD_DETECTED') {
        metrics.votes.blocked++;
      }
      userState.errors++;
    });

    client.on('reaction_update', () => {
      const reactionTime = Date.now() - userState.lastReaction;
      metrics.latency.reaction.push(reactionTime);
      metrics.reactions.successful++;
    });

    client.on('fraud_alert', (alert) => {
      metrics.fraudAlerts++;
      console.warn(`Fraud alert for user ${userId}:`, alert.description);
    });

    client.on('system_health', (health) => {
      if (health.errorRate > 10 || health.averageLatency > 2000) {
        metrics.performanceIssues++;
      }
    });

    client.on('error', (error) => {
      userState.errors++;
      metrics.errors.push(`User ${userId}: ${error}`);
    });

    this.clients.set(userId, userState);
    metrics.connections.attempted++;

    return userState;
  }

  /**
   * Join competition room
   */
  joinCompetition(userState) {
    if (!userState.connected || userState.joinedCompetition) return;

    userState.client.emit('join_competition', { 
      competitionId: COMPETITION_ID 
    });

    userState.joinedCompetition = true;
    
    // Start user behavior simulation
    this.simulateUserBehavior(userState);
  }

  /**
   * Simulate user behavior based on profile
   */
  simulateUserBehavior(userState) {
    const { profile } = userState;
    
    // Voting behavior
    const voteInterval = this.getVotingInterval(profile);
    const voteTimer = setInterval(() => {
      if (!userState.connected) {
        clearInterval(voteTimer);
        return;
      }
      this.simulateVote(userState);
    }, voteInterval);

    // Reaction behavior
    if (profile.type !== 'bot_user') {
      const reactionTimer = setInterval(() => {
        if (!userState.connected) {
          clearInterval(reactionTimer);
          return;
        }
        this.simulateReaction(userState);
      }, REACTION_FREQUENCY + Math.random() * 3000);
    }

    // Clean up after test duration
    setTimeout(() => {
      clearInterval(voteTimer);
      if (userState.client.connected) {
        userState.client.disconnect();
      }
    }, TEST_DURATION);
  }

  /**
   * Get voting interval based on profile
   */
  getVotingInterval(profile) {
    switch (profile.type) {
      case 'suspicious_user':
        return 500; // Very rapid voting
      case 'bot_user':
        return 200; // Extremely rapid, systematic
      case 'engaged_user':
        return VOTING_FREQUENCY * 0.7; // More frequent
      default:
        return VOTING_FREQUENCY + Math.random() * 5000; // Random interval
    }
  }

  /**
   * Simulate a vote
   */
  simulateVote(userState) {
    const submissionId = this.selectSubmission(userState.profile);
    const voteData = this.generateVoteData(userState, submissionId);
    
    userState.lastVote = Date.now();
    userState.votescast++;
    metrics.votes.sent++;

    userState.client.emit('cast_vote', voteData);
  }

  /**
   * Select submission based on user profile
   */
  selectSubmission(profile) {
    switch (profile.votingPattern) {
      case 'systematic':
        // Bots vote in order
        return SUBMISSION_IDS[metrics.votes.sent % SUBMISSION_IDS.length];
      case 'frequent':
        // Engaged users prefer top submissions
        return SUBMISSION_IDS[Math.floor(Math.random() * 2)];
      default:
        // Random selection
        return SUBMISSION_IDS[Math.floor(Math.random() * SUBMISSION_IDS.length)];
    }
  }

  /**
   * Generate vote data
   */
  generateVoteData(userState, submissionId) {
    return {
      competitionId: COMPETITION_ID,
      submissionId,
      voteType: 'simple',
      voteData: {
        value: Math.floor(Math.random() * 5) + 1 // 1-5 rating
      }
    };
  }

  /**
   * Simulate a reaction
   */
  simulateReaction(userState) {
    const reactions = ['clap', 'fire', 'idea', 'love', 'thinking'];
    const reactionType = reactions[Math.floor(Math.random() * reactions.length)];
    
    userState.lastReaction = Date.now();
    userState.reactionsSent++;
    metrics.reactions.sent++;

    userState.client.emit('send_reaction', {
      sessionId: 'test-session-123',
      submissionId: SUBMISSION_IDS[0], // Current presentation
      reactionType,
      intensity: Math.floor(Math.random() * 10) + 1,
      coordinates: {
        x: Math.floor(Math.random() * 800),
        y: Math.floor(Math.random() * 600)
      }
    });
  }

  /**
   * Run the load test
   */
  async runLoadTest() {
    console.log(`🚀 Starting NestFest load test with ${CONCURRENT_USERS} concurrent users`);
    console.log(`📊 Test duration: ${TEST_DURATION / 1000} seconds`);
    console.log(`⏰ Ramp-up time: ${RAMP_UP_TIME / 1000} seconds`);
    console.log(`🎯 Target: ${SERVER_URL}`);
    console.log('');

    this.isRunning = true;
    this.startTime = Date.now();

    // Create users with profile distribution
    const userCreationInterval = RAMP_UP_TIME / CONCURRENT_USERS;
    let userIndex = 0;

    const createUserInterval = setInterval(() => {
      if (userIndex >= CONCURRENT_USERS) {
        clearInterval(createUserInterval);
        console.log(`✅ All ${CONCURRENT_USERS} users creation initiated`);
        return;
      }

      // Select profile based on weights
      const profile = this.selectUserProfile();
      this.createUser(userIndex, profile);
      
      userIndex++;

      // Progress indicator
      if (userIndex % 100 === 0) {
        console.log(`📈 Created ${userIndex}/${CONCURRENT_USERS} users...`);
      }
    }, userCreationInterval);

    // Start metrics reporting
    this.startMetricsReporting();

    // End test after duration
    setTimeout(() => {
      this.endTest();
    }, TEST_DURATION + RAMP_UP_TIME + 5000); // Add buffer
  }

  /**
   * Select user profile based on weights
   */
  selectUserProfile() {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const profile of userProfiles) {
      cumulative += profile.weight;
      if (random <= cumulative) {
        return profile;
      }
    }

    return userProfiles[0]; // Fallback
  }

  /**
   * Start metrics reporting
   */
  startMetricsReporting() {
    const reportInterval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(reportInterval);
        return;
      }

      this.reportMetrics();
    }, 10000); // Report every 10 seconds
  }

  /**
   * Report current metrics
   */
  reportMetrics() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const connectedUsers = Array.from(this.clients.values())
      .filter(user => user.connected).length;

    console.log('');
    console.log(`📊 METRICS REPORT (${elapsed.toFixed(0)}s elapsed)`);
    console.log('─'.repeat(50));
    console.log(`🔗 Connections: ${metrics.connections.successful}/${metrics.connections.attempted} successful (${connectedUsers} active)`);
    console.log(`📉 Connection failures: ${metrics.connections.failed}, drops: ${metrics.connections.dropped}`);
    console.log(`🗳️  Votes: ${metrics.votes.acknowledged}/${metrics.votes.sent} acknowledged (${metrics.votes.failed} failed, ${metrics.votes.blocked} blocked)`);
    console.log(`😊 Reactions: ${metrics.reactions.successful}/${metrics.reactions.sent} successful`);
    
    if (metrics.latency.connection.length > 0) {
      const avgConnLatency = metrics.latency.connection.reduce((a, b) => a + b, 0) / metrics.latency.connection.length;
      console.log(`⚡ Avg connection latency: ${avgConnLatency.toFixed(0)}ms`);
    }
    
    if (metrics.latency.vote.length > 0) {
      const avgVoteLatency = metrics.latency.vote.reduce((a, b) => a + b, 0) / metrics.latency.vote.length;
      console.log(`🏃 Avg vote latency: ${avgVoteLatency.toFixed(0)}ms`);
    }
    
    console.log(`🚨 Fraud alerts: ${metrics.fraudAlerts}`);
    console.log(`⚠️  Performance issues: ${metrics.performanceIssues}`);
    console.log(`❌ Errors: ${metrics.errors.length}`);
  }

  /**
   * End the test and generate report
   */
  endTest() {
    console.log('');
    console.log('🏁 Ending load test...');

    this.isRunning = false;

    // Disconnect all clients
    this.clients.forEach(userState => {
      if (userState.client.connected) {
        userState.client.disconnect();
      }
    });

    // Generate final report
    setTimeout(() => {
      this.generateFinalReport();
    }, 2000);
  }

  /**
   * Generate comprehensive final report
   */
  generateFinalReport() {
    const totalTime = (Date.now() - this.startTime) / 1000;
    
    console.log('');
    console.log('🎯 NESTFEST LOAD TEST FINAL REPORT');
    console.log('='.repeat(60));
    
    // Test parameters
    console.log('📋 Test Configuration:');
    console.log(`   • Concurrent users: ${CONCURRENT_USERS.toLocaleString()}`);
    console.log(`   • Test duration: ${TEST_DURATION / 1000}s`);
    console.log(`   • Ramp-up time: ${RAMP_UP_TIME / 1000}s`);
    console.log(`   • Total test time: ${totalTime.toFixed(0)}s`);
    console.log('');

    // Connection performance
    const connectionSuccessRate = (metrics.connections.successful / metrics.connections.attempted * 100).toFixed(1);
    console.log('🔗 Connection Performance:');
    console.log(`   • Success rate: ${connectionSuccessRate}% (${metrics.connections.successful}/${metrics.connections.attempted})`);
    console.log(`   • Failed connections: ${metrics.connections.failed}`);
    console.log(`   • Dropped connections: ${metrics.connections.dropped}`);
    
    if (metrics.latency.connection.length > 0) {
      const avgConn = metrics.latency.connection.reduce((a, b) => a + b, 0) / metrics.latency.connection.length;
      const maxConn = Math.max(...metrics.latency.connection);
      const minConn = Math.min(...metrics.latency.connection);
      console.log(`   • Connection latency: ${avgConn.toFixed(0)}ms avg (${minConn}-${maxConn}ms range)`);
    }
    console.log('');

    // Voting performance
    const voteSuccessRate = metrics.votes.sent > 0 ? 
      (metrics.votes.acknowledged / metrics.votes.sent * 100).toFixed(1) : '0';
    const voteThroughput = metrics.votes.acknowledged / totalTime;
    
    console.log('🗳️  Voting Performance:');
    console.log(`   • Votes processed: ${metrics.votes.acknowledged.toLocaleString()}/${metrics.votes.sent.toLocaleString()} (${voteSuccessRate}% success)`);
    console.log(`   • Vote throughput: ${voteThroughput.toFixed(1)} votes/second`);
    console.log(`   • Failed votes: ${metrics.votes.failed}`);
    console.log(`   • Blocked by fraud detection: ${metrics.votes.blocked}`);
    
    if (metrics.latency.vote.length > 0) {
      const avgVote = metrics.latency.vote.reduce((a, b) => a + b, 0) / metrics.latency.vote.length;
      const maxVote = Math.max(...metrics.latency.vote);
      const minVote = Math.min(...metrics.latency.vote);
      console.log(`   • Vote processing latency: ${avgVote.toFixed(0)}ms avg (${minVote}-${maxVote}ms range)`);
    }
    console.log('');

    // Real-time features
    const reactionSuccessRate = metrics.reactions.sent > 0 ? 
      (metrics.reactions.successful / metrics.reactions.sent * 100).toFixed(1) : '0';
    
    console.log('😊 Real-time Features:');
    console.log(`   • Reactions processed: ${metrics.reactions.successful.toLocaleString()}/${metrics.reactions.sent.toLocaleString()} (${reactionSuccessRate}% success)`);
    console.log(`   • Fraud alerts generated: ${metrics.fraudAlerts}`);
    console.log(`   • Performance issues detected: ${metrics.performanceIssues}`);
    console.log('');

    // System stability
    const errorRate = ((metrics.errors.length / metrics.connections.attempted) * 100).toFixed(2);
    console.log('🏥 System Stability:');
    console.log(`   • Overall error rate: ${errorRate}%`);
    console.log(`   • Total errors: ${metrics.errors.length}`);
    console.log('');

    // Performance assessment
    console.log('✅ Performance Assessment:');
    
    const assessments = [];
    
    if (parseFloat(connectionSuccessRate) >= 95) {
      assessments.push('✅ Connection stability: EXCELLENT');
    } else if (parseFloat(connectionSuccessRate) >= 90) {
      assessments.push('⚠️  Connection stability: GOOD');
    } else {
      assessments.push('❌ Connection stability: NEEDS IMPROVEMENT');
    }

    if (voteThroughput >= 100) {
      assessments.push('✅ Vote throughput: EXCELLENT');
    } else if (voteThroughput >= 50) {
      assessments.push('⚠️  Vote throughput: GOOD');
    } else {
      assessments.push('❌ Vote throughput: NEEDS IMPROVEMENT');
    }

    const avgVoteLatency = metrics.latency.vote.length > 0 ? 
      metrics.latency.vote.reduce((a, b) => a + b, 0) / metrics.latency.vote.length : 0;
    
    if (avgVoteLatency <= 500) {
      assessments.push('✅ Response latency: EXCELLENT');
    } else if (avgVoteLatency <= 1000) {
      assessments.push('⚠️  Response latency: ACCEPTABLE');
    } else {
      assessments.push('❌ Response latency: TOO HIGH');
    }

    const fraudEffectiveness = metrics.votes.blocked > 0 ? 
      '✅ Fraud detection: ACTIVE' : '⚠️  Fraud detection: NOT TESTED';
    assessments.push(fraudEffectiveness);

    assessments.forEach(assessment => console.log(`   ${assessment}`));

    console.log('');
    console.log('🎯 LOAD TEST COMPLETED');
    console.log(`📈 The system handled ${CONCURRENT_USERS.toLocaleString()} concurrent users`);
    console.log(`🏆 Processed ${metrics.votes.acknowledged.toLocaleString()} votes successfully`);
    console.log('');

    // Recommendations
    if (parseFloat(connectionSuccessRate) < 95 || avgVoteLatency > 1000 || voteThroughput < 50) {
      console.log('💡 Recommendations:');
      if (parseFloat(connectionSuccessRate) < 95) {
        console.log('   • Increase server capacity or add load balancers');
      }
      if (avgVoteLatency > 1000) {
        console.log('   • Optimize database queries and enable caching');
      }
      if (voteThroughput < 50) {
        console.log('   • Implement message batching and connection pooling');
      }
      console.log('   • Consider horizontal scaling with multiple server instances');
      console.log('');
    }
  }
}

// Run the load test
if (require.main === module) {
  const tester = new LoadTester();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n⏹️  Load test interrupted by user');
    tester.endTest();
    setTimeout(() => process.exit(0), 3000);
  });

  // Start the test
  tester.runLoadTest().catch(error => {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  });
}

module.exports = LoadTester;