const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const bodyParser = require('body-parser');
const path = require('path');

const {
  createWorkspaceSchema,
  startDeploySchema,
  startRollbackSchema,
  addSecretSchema,
  deleteSecretSchema,
  updateSecretSchema
} = require('./schemas');

const app = express();
app.use(bodyParser.json());

// --- 로컬 인메모리 DB (Firebase 대체) ---
const db = {
  workspaces: [
    { id: 'ws-1', name: 'My Local Workspace', description: 'Local testing environment', members: ['local-user'], createdAt: new Date() }
  ],
  plants: [],
  secrets: [],
  globalLogs: []
};

// --- Health Check API ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Deplight Local Backend is running' });
});

// 2. API 및 Webhook 라우트 (Mock)
app.post('/webhook/slack-command', async (req, res) => {
  const plant = db.plants.find(p => p.version === 'CJ_ENM');
  if (!plant) return res.status(404).send('Plant not found');

  plant.status = 'DEPLOYING';
  plant.aiInsight = 'AI가 Slack 명령을 분석 중입니다...';
  io.emit('plant-update', { id: plant.id, status: 'DEPLOYING' });
  res.send('Slack command received.');
});

// --- Socket.io 서버 생성 ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- 로컬 전용 소켓 인증 미들웨어 (모두 허용) ---
io.use((socket, next) => {
  socket.user = { email: 'local-user@example.com', uid: 'local-user' };
  next();
});

io.on('connection', (socket) => {
  console.log(`[Local Mode] User connected: ${socket.user.email}`);

  socket.on('get-my-workspaces', () => {
    console.log(`[Local Mode] Sending workspaces list to ${socket.user.email}`);
    socket.emit('workspaces-list', db.workspaces);
  });

  socket.on('join-workspace', (workspaceId) => {
    socket.join(workspaceId);
    const plants = db.plants.filter(p => p.workspaceId === workspaceId);
    socket.emit('current-shelf', plants);
  });

  socket.on('start-deploy', (data) => {
    const newPlant = {
      id: `plant-${Date.now()}`,
      workspaceId: data.workspaceId,
      ownerUid: socket.user.uid,
      gitUrl: data.gitUrl,
      name: data.version || 'New Local App',
      version: data.version || 'v1.0.0',
      status: 'DEPLOYING',
      aiInsight: '로컬 시뮬레이션 배포 시작...',
      lastDeployedAt: { toDate: () => new Date() }, // Firebase Timestamp 모방
      createdAt: new Date(),
    };
    db.plants.push(newPlant);
    socket.emit('new-plant', newPlant);
    io.to(data.workspaceId).emit('current-shelf', db.plants.filter(p => p.workspaceId === data.workspaceId));

    // 시뮬레이션 시작
    runFakeDeploy(newPlant.id, data.workspaceId);
  });

  socket.on('disconnect', () => {
    console.log(`[Local Mode] User disconnected`);
  });
});

async function runFakeDeploy(plantId, workspaceId) {
  const plant = db.plants.find(p => p.id === plantId);
  const steps = ['Git Clone', 'AI Analysis', 'Build', 'Deploy'];
  
  for (let i = 0; i < steps.length; i++) {
    await new Promise(r => setTimeout(r, 1500));
    const msg = `${steps[i]} 진행 중...`;
    io.to(workspaceId).emit('pipeline-update', {
      id: plantId,
      message: msg,
      overallProgress: (i + 1) * 25
    });
    io.emit('new-log', { id: plantId, log: { time: new Date(), message: msg, status: 'INFO' } });
  }

  plant.status = 'HEALTHY';
  plant.aiInsight = '로컬 배포 완료!';
  io.to(workspaceId).emit('plant-update', { id: plantId, status: 'HEALTHY' });
}

const PORT = 8081;
server.listen(PORT, '0.0.0.0', () => console.log(`🚀 Deplight LOCAL 서버 실행: ${PORT}번 포트 (Firebase 미사용)`));
