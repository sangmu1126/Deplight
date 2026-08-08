const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const bodyParser = require('body-parser');
const path = require('path');
const admin = require('firebase-admin');

const {
  createWorkspaceSchema,
  startDeploySchema,
  startRollbackSchema,
  addSecretSchema,
  deleteSecretSchema,
  updateSecretSchema
} = require('./schemas');

const GitHubService = require('./github_service');

// Initialize GitHub service (GitHub token from environment variable)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
let githubService = null;

if (GITHUB_TOKEN) {
  try {
    githubService = new GitHubService(GITHUB_TOKEN);
    console.log('✅ GitHub Service initialized successfully');
  } catch (error) {
    console.error('⚠️ Failed to initialize GitHub Service:', error.message);
  }
} else {
  console.warn('⚠️  No GITHUB_TOKEN found. Real deployments will not work.');
}

// Firebase Admin SDK 초기화
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  // Cloud Run 환경: 자동으로 기본 인증 정보 사용 (파일 필요 없음)
  admin.initializeApp();
}

// Firestore DB 인스턴스
const db = admin.firestore();

const app = express();
app.use(bodyParser.json());

// 2. API 및 Webhook 라우트 (기존 로직 유지 - 'CJ_ENM' 앱을 직접 찾음)
app.post('/webhook/slack-command', async (req, res) => {
  try {
    const plantQuery = await db.collection('plants').where('version', '==', 'CJ_ENM').limit(1).get();
    if (plantQuery.empty) return res.status(404).send('Plant not found');

    const plantDoc = plantQuery.docs[0];
    const plantRef = plantDoc.ref;
    const plantData = plantDoc.data();

    if (plantData.status === 'DEPLOYING' || plantData.status === 'ROLLBACK') {
      return res.status(409).send('Action already in progress.');
    }

    await plantRef.update({ status: 'DEPLOYING', aiInsight: 'AI가 Slack 명령을 분석 중입니다...' });
    io.emit('plant-update', { id: plantDoc.id, status: 'DEPLOYING', aiInsight: 'AI가 Slack 명령을 분석 중입니다...' });
    emitLog(plantDoc.id, 'SYSTEM', 'Slack 명령에 의해 배포 시작');
    runFakeSelfHealingDeploy(plantDoc.id, false);
    res.send('Slack command received. Deployment started.');
  } catch (err) {
    console.error("Slack Webhook Error:", err);
    res.status(500).send('Internal Server Error');
  }
});

// 3. React 빌드 결과 정적 경로
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 4. "catch-all" 라우트
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// --- Socket.io 서버 생성 ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// (★★★★★ 수정 ★★★★★: "PaaS 겨울잠" 시뮬레이션 - 'Unicef_dev' 앱을 직접 찾음)
setInterval(async () => {
  try {
    const query = db.collection('plants')
      .where('version', '==', 'Unicef_dev')
      .where('status', '==', 'HEALTHY');

    const snapshot = await query.get();
    if (snapshot.empty) return;

    snapshot.forEach(doc => {
      doc.ref.update({ status: 'SLEEPING', updatedAt: new Date() });
      console.log(`Hibernation: ${doc.id} 앱을 "SLEEPING" 상태로 변경합니다.`);

      // (중요) 해당 plant가 속한 workspaceId를 가져와서 '그 방'에만 알림
      const workspaceId = doc.data().workspaceId;
      if (workspaceId) {
        io.to(workspaceId).emit('plant-update', { id: doc.id, status: 'SLEEPING' });
      }
    });
  } catch (err) {
    console.error("Hibernation Error:", err);
  }
}, 60000);

// Socket.io 연결 미들웨어: (토큰 검증 - 수정 없음)
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication Error: No token provided'));
    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.user = decodedToken;
    next();
  } catch (err) {
    console.error('Socket Auth Error:', err.message);
    next(new Error('Authentication Error'));
  }
});

// (★★★★★ 수정 ★★★★★: 'connection' 로직 전체 변경)
io.on('connection', (socket) => {
  console.log(`[${socket.user.email}] 님이 접속했습니다. (UID: ${socket.user.uid})`);
  const userUid = socket.user.uid;

  // 현재 이 소켓이 구독 중인 Firestore 리스너(onSnapshot)를 저장할 변수
  let unsubscribeShelfListener = null;

  // (신규) 1. 클라이언트가 "내가 속한 워크스페이스 목록 줘" 요청
  socket.on('get-my-workspaces', async () => {
    try {
      // 'members' 배열에 내 UID가 포함된 워크스페이스 쿼리
      const query = db.collection('workspaces').where('members', 'array-contains', userUid);
      const snapshot = await query.get();
      const workspaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 'WorkspaceSelectionPage'에 표시할 목록 전송
      socket.emit('workspaces-list', workspaces);
    } catch (err) {
      console.error('Error getting workspaces:', err);
      socket.emit('error-message', '워크스페이스 목록 로딩 실패');
    }
  });

  // (신규) 2. 클라이언트가 "이 워크스페이스에 들어갈래" 요청
  socket.on('join-workspace', async (workspaceId) => {
    try {
      // (보안) 이 사용자가 이 워크스페이스의 멤버인지 확인
      const wsDoc = await db.collection('workspaces').doc(workspaceId).get();
      if (!wsDoc.exists || !wsDoc.data().members.includes(userUid)) {
        return socket.emit('error-message', '워크스페이스 접근 권한이 없습니다.');
      }

      // 1. (중요) 이 사용자를 'workspaceId' 이름을 가진 방(Room)에 입장시킴
      socket.join(workspaceId);
      console.log(`[${socket.user.email}] 님이 '${wsDoc.data().name}' 워크스페이스(${workspaceId})에 입장했습니다.`);

      // 2. 이 방에 입장하는 즉시, 이 방에 해당하는 Plant 목록을 실시간(onSnapshot) 감시
      const query = db.collection('plants').where('workspaceId', '==', workspaceId);

      // 3. (중요) onSnapshot으로 실시간 감시 시작
      unsubscribeShelfListener = query.onSnapshot(snapshot => {
        const plants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // (중요) 'io.emit' (전체)이 아닌 'to(workspaceId)' (이 방에만) 전송
        io.to(workspaceId).emit('current-shelf', plants);
      }, err => {
        console.error(`Shelf Snapshot Error (WS: ${workspaceId}):`, err);
        socket.emit('error-message', '앱 목록을 불러오는 데 실패했습니다.');
      });

    } catch (err) {
      console.error('Error joining workspace:', err);
    }
  });

  socket.on('create-workspace', async (data) => {
    try {
      // 1. 스키마 검증
      const payload = createWorkspaceSchema.parse(data);

      // 2. (보안) 현재 사용자가 관리자(Admin)인지 확인 (예시)
      // const userDoc = await admin.auth().getUser(userUid);
      // if (userDoc.customClaims?.role !== 'admin') {
      //   return socket.emit('error-message', '워크스페이스 생성 권한이 없습니다.');
      // }

      // 3. Firestore에 새 워크스페이스 문서 생성
      const newWorkspace = {
        name: payload.name,
        description: payload.description,
        type: payload.type,
        ownerUid: userUid,
        members: [userUid], // 생성자를 첫 멤버로 자동 추가
        createdAt: new Date(),
      };
      const docRef = await db.collection('workspaces').add(newWorkspace);

      // 4. (중요) 목록을 새로고침하도록 요청
      // 'get-my-workspaces'를 다시 요청하라고 클라이언트에게 알림
      socket.emit('workspaces-updated'); // (클라이언트는 이 이벤트를 받으면 'get-my-workspaces'를 다시 emit해야 함)
      console.log(`[${socket.user.email}] 님이 '${payload.name}' 워크스페이스 생성`);

    } catch (err) {
      console.error('Create Workspace Error:', err);
      // Zod 에러 메시지를 클라이언트로 전송
      socket.emit('error-message', err.errors ? err.errors[0].message : '워크스페이스 생성 실패');
    }
  });

  // (수정) 3. 'start-deploy' - workspaceId를 받아야 함
// 'start-deploy' 핸들러 리팩토링
  socket.on('start-deploy', async (data) => {
    try {
      // 1. 스키마 검증
      const payload = startDeploySchema.parse(data);
      const { workspaceId, gitUrl, version, description } = payload;
      const { isWakeUp, id: plantIdToWake } = data; // (isWakeUp은 스키마에 없음)

      // 2. (보안) 멤버십 확인 (기존 로직)
      const wsDoc = await db.collection('workspaces').doc(workspaceId).get();
      if (!wsDoc.exists || !wsDoc.data().members.includes(userUid)) {
        return emitLog(0, 'SYSTEM_ERROR', '배포 권한이 없습니다.', 0, socket);
      }

      if (isWakeUp) {
        // ... (기존 "겨울잠" 깨우기 로직)
      } else {
        // 3. "새 씨앗 심기" (검증된 payload 사용)
        const newPlant = {
          workspaceId: workspaceId,
          ownerUid: userUid,
          gitUrl: gitUrl, // (검증됨)
          plantType: 'pot',
          version: version || `New_App_v1`,
          description: description || '새 배포입니다...',
          status: 'DEPLOYING',
          aiInsight: 'AI가 배포를 분석 중입니다...',
          health: '알 수 없음',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const docRef = await db.collection('plants').add(newPlant);
        socket.emit('new-plant', { id: docRef.id, ...newPlant });

        // Real GitHub deployment if available, otherwise fake
        if (githubService) {
          runRealGitHubDeploy(docRef.id, gitUrl, version, false);
        } else {
          runFakeSelfHealingDeploy(docRef.id, false);
        }
      }
    } catch (err) {
      console.error('Start Deploy Error:', err);
      socket.emit('error-message', err.errors ? err.errors[0].message : '배포 요청 실패');
    }
  });

// 'start-rollback' 핸들러 리팩토링: 보안 강화
  socket.on('start-rollback', async (data) => {
    try {
      // 1. 스키마 검증
      const payload = startRollbackSchema.parse(data);
      const plantRef = db.collection('plants').doc(payload.plantId);
      const doc = await plantRef.get();

      // 2. (보안) 
      if (!doc.exists) {
        return emitLog(0, 'SYSTEM_ERROR', '앱을 찾을 수 없습니다.', 0, socket);
      }
      
      // 이 plant가 속한 workspace의 멤버인지 확인하는 로직
      const wsDoc = await db.collection('workspaces').doc(doc.data().workspaceId).get();
      if (!wsDoc.exists || !wsDoc.data().members.includes(userUid)) {
        return emitLog(0, 'SYSTEM_ERROR', '롤백 권한이 없습니다.', 0, socket);
      }
      
      const plantData = { id: doc.id, ...doc.data() };
      // 다른 작업 진행 중인지 확인
      if (plantData.status === 'DEPLOYING' || plantData.status === 'ROLLBACK') {
        return emitLog(plantData.id, 'SYSTEM_ERROR', '이미 다른 작업이 진행 중입니다.', 0, socket);
      }
      runFakeRollback(plantData);

    } catch (err) {
      console.error('Rollback Error:', err);
      socket.emit('error-message', err.errors ? err.errors[0].message : '롤백 요청 실패');
    }
  });

  // 'SettingsPage'가 로드될 때 시크릿 '목록' 요청
  socket.on('get-secrets', async (workspaceId) => {
    try {
      // 1. (보안) 멤버십 확인
      const wsDoc = await db.collection('workspaces').doc(workspaceId).get();
      if (!wsDoc.exists || !wsDoc.data().members.includes(userUid)) {
        return socket.emit('error-message', '시크릿 조회 권한이 없습니다.');
      }
      
      // 2. 'secrets' 서브컬렉션의 '문서 ID 목록'을 가져옴
      const secretsSnapshot = await db.collection('workspaces')
                                  .doc(workspaceId)
                                  .collection('secrets')
                                  .get();
      
      // 3. (중요) '값(value)'은 절대 보내지 않습니다.
      //    '이름(key)', '설명', '생성일'만 보냅니다.
      const secretsList = secretsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          name: doc.id, // 문서 ID가 Secret 이름
          description: data.description,
          createdAt: data.createdAt,
        };
      });
      
      // 4. 클라이언트(SettingsPage)로 목록 전송
      socket.emit('secrets-list', secretsList);
      
    } catch (err) {
      console.error('Get Secrets Error:', err);
      socket.emit('error-message', '시크릿 목록 로딩 실패');
    }
  });

  // (★★★★★ 신규 ★★★★★)
  // 'SettingsPage'에서 '삭제' 버튼 클릭 시
  socket.on('delete-secret', async (data) => {
    try {
      // 1. 스키마 검증
      const payload = deleteSecretSchema.parse(data);
      
      // 2. (보안) 멤버십 확인
      const wsDoc = await db.collection('workspaces').doc(payload.workspaceId).get();
      if (!wsDoc.exists || !wsDoc.data().members.includes(userUid)) {
        return socket.emit('error-message', '시크릿 삭제 권한이 없습니다.');
      }
      
      // 3. 'secrets' 서브컬렉션에서 해당 문서 삭제
      await db.collection('workspaces')
              .doc(payload.workspaceId)
              .collection('secrets')
              .doc(payload.name)
              .delete();
              
      socket.emit('secret-deleted-success', `${payload.name} 시크릿이 삭제되었습니다.`);
      // (목록 갱신을 위해 클라이언트에게 'get-secrets'를 다시 요청하라고 알릴 수 있음)
      socket.emit('secrets-updated');

    } catch (err) {
      console.error('Delete Secret Error:', err);
      socket.emit('error-message', err.errors ? err.errors[0].message : '시크릿 삭제 실패');
    }
  });

  // (★★★★★ 신규 ★★★★★)
  // 'SettingsPage'에서 '수정' 버튼 클릭 시 (보통은 삭제->새로 추가를 권장)
  socket.on('update-secret', async (data) => {
    try {
      // 1. 스키마 검증
      const payload = updateSecretSchema.parse(data);
      
      // 2. (보안) 멤버십 확인
      const wsDoc = await db.collection('workspaces').doc(payload.workspaceId).get();
      if (!wsDoc.exists || !wsDoc.data().members.includes(userUid)) {
        return socket.emit('error-message', '시크릿 수정 권한이 없습니다.');
      }
      
      // 3. 'secrets' 서브컬렉션에서 해당 문서 업데이트
      await db.collection('workspaces')
              .doc(payload.workspaceId)
              .collection('secrets')
              .doc(payload.name)
              .update({
                value: payload.value, // (★★실제로는 암호화 필요★★)
                updatedAt: new Date(),
                updatedBy: userUid,
              });
              
      socket.emit('secret-updated-success', `${payload.name} 시크릿이 수정되었습니다.`);
      socket.emit('secrets-updated'); // 목록 갱신 신호

    } catch (err) {
      console.error('Update Secret Error:', err);
      socket.emit('error-message', err.errors ? err.errors[0].message : '시크릿 수정 실패');
    }
  });

  // 'NewSecretDialog'를 위한 핸들러
  socket.on('add-secret', async (data) => {
    try {
      // 1. 스키마 검증
      const payload = addSecretSchema.parse(data);
      
      // 2. (보안) 멤버십 확인
      const wsDoc = await db.collection('workspaces').doc(payload.workspaceId).get();
      if (!wsDoc.exists || !wsDoc.data().members.includes(userUid)) {
        return socket.emit('error-message', '시크릿 추가 권한이 없습니다.');
      }
      
      // 3. (로직)
      //    (중요) 실제로는 값을 암호화해야 합니다. (예: Google Secret Manager)
      //    (여기서는 Firestore에 'secrets' 서브컬렉션을 만든다고 가정)
      await db.collection('workspaces')
              .doc(payload.workspaceId)
              .collection('secrets')
              .doc(payload.name) // (시크릿 이름으로 문서 ID 사용)
              .set({
                value: payload.value, // (★★실제로는 절대 이렇게 평문 저장하면 안 됩니다★★)
                description: payload.description,
                createdAt: new Date(),
                createdBy: userUid,
              });
              
      socket.emit('secret-added-success', `${payload.name} 시크릿이 추가되었습니다.`);
      
    } catch (err) {
      console.error('Add Secret Error:', err);
      socket.emit('error-message', err.errors ? err.errors[0].message : '시크릿 추가 실패');
    }
  });

  // (수정) 5. 'slack-reaction' - 방(Room)에 전파
  socket.on('slack-reaction', async (data) => {
    const plantRef = db.collection('plants').doc(data.id);
    const emoji = data.emoji || '🚀';
    try {
      await plantRef.update({ reactions: admin.firestore.FieldValue.arrayUnion(emoji) });
      const updatedDoc = await plantRef.get();
      const plantData = updatedDoc.data();

      // (★★★★★) 이 plant가 속한 workspaceId를 가져와서 '그 방'에만 전파
      if (plantData.workspaceId) {
        io.to(plantData.workspaceId).emit('reaction-update', { id: data.id, reactions: plantData.reactions, emoji });
      }
    } catch (err) { console.error("Reaction update error:", err); }
  });

  // (수정) 6. 전역 이벤트들 (metrics, traffic, run-command) - 전체(io) 또는 개인(socket)에게 전송
  const globalTrafficSources = ['Tokyo', 'Seoul', 'London', 'San Francisco', 'Singapore'];
  const globalRef = db.collection('system').doc('global');

  const metricsInterval = setInterval(() => {
    const newMetrics = { cpu: 5.0 + Math.random() * 5, mem: 128.0 + Math.random() * 20 };
    globalRef.set({ currentMetrics: newMetrics }, { merge: true });
    io.emit('metrics-update', newMetrics); // (전체 전송)
  }, 1000);

  const trafficInterval = setInterval(() => {
    const location = globalTrafficSources[Math.floor(Math.random() * globalTrafficSources.length)];
    const newLog = { time: new Date(), message: `200 OK - /api/ping from ${location}`, status: 'TRAFFIC_HIT' };
    globalRef.collection('globalLogs').add(newLog);
    io.emit('new-log', { id: 0, log: newLog }); // (전체 전송)
  }, 1500);

  socket.on('run-command', (cmd) => {
    emitLog(0, 'COMMAND', cmd, 0, socket); // (개인에게만 전송)
    setTimeout(() => {
      let response = `zsh: command not found: ${cmd}`;
      let status = 'CONSOLE_ERROR';
      if (cmd.startsWith('kubectl get pods')) {
        status = 'CONSOLE';
        response = `(모든 파드 목록...)\ndeplight-v1-blue-pod-abc12   1/1     Running\n...`;
      }
      emitLog(0, status, response, 0, socket); // (개인에게만 전송)
    }, 1000);
  });

  // (수정) 7. 연결 종료 시 Firestore 리스너 해제
  socket.on('disconnect', () => {
    if (unsubscribeShelfListener) {
      unsubscribeShelfListener(); // (중요) 실시간 리스너 중지
    }
    clearInterval(metricsInterval);
    clearInterval(trafficInterval);
    console.log(`[${socket.user.email}] 님이 접속 종료했습니다.`);
  });
});


// (★★★★★ 수정 ★★★★★: emitLog - Firestore 서브컬렉션에 로그 저장)
async function emitLog(deployId, status, message, delay = 0, socket = null) {
  const newLog = {
    time: new Date(),
    message,
    status
  };

  setTimeout(async () => {
    if (deployId !== 0) {
      try {
        await db.collection('plants').doc(deployId).collection('logs').add(newLog);
      } catch (e) { console.error("Log write error:", e); }
    }

    // socket이 있으면 socket(개인)에게, 없으면 io(전체)에게 전송
    const emitter = socket || io;
    emitter.emit('new-log', { id: deployId, log: newLog });

    // // 상태 업데이트는 해당 plant가 속한 '방(Room)'에만 전송
    // if (!status.startsWith('CONSOLE') && status !== 'COMMAND' && status !== 'TRAFFIC_HIT') {
    //   if (deployId !== 0) {
    //     try {
    //       const doc = await db.collection('plants').doc(deployId).get();
    //       const workspaceId = doc.data().workspaceId;
    //       if (workspaceId) {
    //         io.to(workspaceId).emit('status-update', { id: deployId, status, message });
    //       }
    //     } catch (e) { }
    //   }
    // }
    // if (status === 'AI_INSIGHT') {
    //   if (deployId !== 0) {
    //     try {
    //       const doc = await db.collection('plants').doc(deployId).get();
    //       const workspaceId = doc.data().workspaceId;
    //       if (workspaceId) {
    //         io.to(workspaceId).emit('ai-insight', { id: deployId, message });
    //       }
    //     } catch (e) { }
    //   }
    // }
  }, delay);
}

async function runFakeSelfHealingDeploy(deployId, isWakeUp = false) {
  const plantRef = db.collection('plants').doc(deployId);
  
  // AWS 파이프라인 단계 정의
  const pipelineSteps = [
    { id: 'git_clone', name: 'Git Clone & Setup', status: 'pending', progress: 0 },
    { id: 'ai_analysis', name: 'AI Code Analysis', status: 'pending', progress: 0 },
    { id: 'docker_build', name: 'Docker Build', status: 'pending', progress: 0 },
    { id: 'ecr_push', name: 'ECR Push', status: 'pending', progress: 0 },
    { id: 'infra_update', name: 'Infrastructure Update', status: 'pending', progress: 0 },
    { id: 'ecs_deploy', name: 'ECS Deployment', status: 'pending', progress: 0 },
    { id: 'health_check', name: 'Health Check', status: 'pending', progress: 0 },
    { id: 'verification', name: 'Verification', status: 'pending', progress: 0 }
  ];

  let overallProgress = 0;
  const totalSteps = pipelineSteps.length;
  let workspaceId = null;

  try {
    // (★★★★★ 수정 ★★★★★)
    // 1. workspaceId를 먼저 로드하여 할당합니다.
    const doc = await plantRef.get();
    if (!doc.exists) { throw new Error("Plant not found"); }
    workspaceId = doc.data().workspaceId; // ◀ 여기서 먼저 할당됨
    if (!workspaceId) { throw new Error("Workspace ID not found on plant."); }


    // (★★★★★ 수정 ★★★★★)
    // emitPipelineState 함수 정의 (이제 workspaceId가 정의되어 있음)
    const emitPipelineState = (message) => {
      // workspaceId가 null이면 실행하지 않음 (오류 방지)
      if (!workspaceId) return; 

      const completed = pipelineSteps.filter(s => s.status === 'completed').length;
      const activeStep = pipelineSteps.find(s => s.status === 'active');
      
      let activeProgress = 0;
      if (activeStep) {
         activeProgress = (activeStep.progress / 100) * (100 / totalSteps);
      }
      overallProgress = ((completed / totalSteps) * 100) + activeProgress;

      io.to(workspaceId).emit('pipeline-update', {
        id: deployId,
        steps: pipelineSteps,
        overallProgress: overallProgress,
        message: message,
      });
    };

    // --- (신규) 스텝 실행 헬퍼 (함수 내부에 유지) ---
    // (runStep 함수는 이전과 동일합니다.)
    const runStep = async (stepIndex, duration, failureChance = 0) => {
      const step = pipelineSteps[stepIndex];
      step.status = 'active';
      
      const stepMessage = `[${stepIndex + 1}/${totalSteps}] ${step.name}...`;
      emitPipelineState(stepMessage);
      emitLog(deployId, 'PIPELINE', stepMessage, 0);

      for (let p = 0; p <= 100; p += 20) {
        await new Promise(res => setTimeout(res, duration / 5));
        step.progress = p;
        emitPipelineState(stepMessage);
      }
      
      if (failureChance > 0 && Math.random() < failureChance) {
        throw new Error(`Simulated Failure at ${step.name}`);
      }

      step.status = 'completed';
      emitPipelineState(`${step.name} 완료.`);
    };


    // --- 1. 배포 시작 ---
    await plantRef.update({ status: 'DEPLOYING', aiInsight: 'AWS 파이프라인 시작' });
    emitPipelineState("배포를 시작합니다..."); // ◀ 이제 workspaceId가 정의된 상태입니다.

    // --- 2. 겨울잠 깨우기 (isWakeUp) ---
    if (isWakeUp) {
      emitLog(deployId, 'SYSTEM', '🌱 "겨울잠"에서 깨어나는 중...', 0);
      await new Promise(res => setTimeout(res, 2000));
      pipelineSteps.forEach(s => { s.status = 'completed'; s.progress = 100; });
      emitPipelineState("앱이 깨어났습니다!");

    } else {
      // --- 3. 정규 배포 파이프라인 실행 ---
      await runStep(0, 2000); // Git Clone
      await runStep(1, 3000); // AI Analysis
      await runStep(2, 5000, 0.5); // Docker Build (50% 실패 확률)
      await runStep(3, 3000); // ECR Push
      await runStep(4, 4000); // Infra Update
      await runStep(5, 3000); // ECS Deploy
      await runStep(6, 2000); // Health Check
      await runStep(7, 1000); // Verification
    }

    // --- 4. 최종 성공 ---
    emitLog(deployId, 'done', '✅ 배포 성공! 서비스가 활성화되었습니다.', 0);
    await plantRef.update({ status: 'HEALTHY', plantType: 'rose', updatedAt: new Date() });
    io.to(workspaceId).emit('pipeline-complete', { id: deployId, status: 'HEALTHY' });

  } catch (err) {
    // --- 5. 실패 처리 ---
    console.error(`Pipeline Error (DeployID: ${deployId}):`, err.message);
    const failedStep = pipelineSteps.find(s => s.status === 'active');
    
    if (failedStep) {
      failedStep.status = 'failed';
    }
    
    // (수정) 중복 호출 제거 및 최종 상태 UI 업데이트
    emitPipelineState(`${failedStep ? failedStep.name : 'Unknown'} 단계에서 오류 발생`); 
    
    // AI 롤백 로직 호출 대신, 사용자 승인 대기 상태로 변경
    emitLog(deployId, 'AI_INSIGHT', '🚨 에러 감지! 사용자 승인 대기 중...', 1000);
    
    setTimeout(async () => {
      // Plant 상태를 'FAILED'로 업데이트하여 UI가 롤백 버튼을 활성화하도록 합니다.
      await plantRef.update({ status: 'FAILED', aiInsight: '롤백 승인을 기다리는 중입니다.' }); 
      
      // 클라이언트에게 롤백 승인이 필요하다고 명시적으로 알립니다.
      io.to(workspaceId).emit('rollback-required', { id: deployId }); 
    }, 2000);
  }
}

async function runFakeRollback(plant) {
  const plantId = plant.id;
  const plantRef = db.collection('plants').doc(plantId);

  await plantRef.update({ status: 'ROLLBACK', aiInsight: 'AI가 롤백을 분석 중입니다...', updatedAt: new Date() });

  emitLog(plant.id, 'ROLLBACK', `🚨 롤백 시작! ${plant.version} -> 이전 버전`, 500);
  emitLog(plant.id, 'ROUTING', '🚦 트래픽 Blue로 전환', 2000);
  emitLog(plant.id, 'CLEANUP', '🧹 Green 환경 정리', 4000);
  emitLog(plant.id, 'done', '✅ 롤백 완료', 6000);
  emitLog(plant.id, 'AI_INSIGHT', '서비스 안정화 완료', 6500);

  setTimeout(async () => {
    const newVersion = `${plant.version.split(' (')[0]} (Rolled Back)`;
    await plantRef.update({
      status: 'HEALTHY',
      plantType: 'rose',
      version: newVersion,
      updatedAt: new Date()
    });
  }, 6000);
}

// ============================================
// Real GitHub Deployment Function
// ============================================
async function runRealGitHubDeploy(deployId, gitUrl, appVersion, isWakeUp = false) {
  const plantRef = db.collection('plants').doc(deployId);
  let workspaceId = null;

  try {
    const doc = await plantRef.get();
    if (!doc.exists) {
      throw new Error("Plant not found");
    }
    workspaceId = doc.data().workspaceId;
    if (!workspaceId) {
      throw new Error("Workspace ID not found on plant.");
    }

    console.log(`[Real Deploy] Starting deployment for ${deployId}`);
    emitLog(deployId, 'SYSTEM', `GitHub Actions 워크플로우를 트리거합니다...`);

    // Trigger GitHub Actions workflow
    const deployment = await githubService.triggerDeployment(gitUrl, 'main', deployId);
    console.log(`[Real Deploy] Workflow triggered: Run ID ${deployment.runId}`);

    emitLog(deployId, 'SYSTEM', `배포 시작됨: Run ID ${deployment.runId}`);
    emitLog(deployId, 'SYSTEM', `워크플로우 URL: ${deployment.url}`);

    // Poll for deployment progress
    let previousJobStatuses = {};
    let lastUpdateTime = Date.now();
    const pollInterval = 10000; // 10 seconds

    const pollDeployment = async () => {
      try {
        const status = await githubService.getWorkflowStatus(deployment.runId);

        // Check if any jobs changed status
        const currentJobStatuses = {};
        let hasChanges = false;

        status.jobs.forEach(job => {
          const jobKey = job.name;
          const jobStatus = `${job.status}:${job.conclusion}`;
          currentJobStatuses[jobKey] = jobStatus;

          if (!previousJobStatuses[jobKey] || previousJobStatuses[jobKey] !== jobStatus) {
            hasChanges = true;
            // Map GitHub Actions job status to user-friendly messages
            const statusEmoji = {
              'in_progress:null': '⏳',
              'completed:success': '✅',
              'completed:failure': '❌',
              'completed:cancelled': '🚫',
              'queued:null': '⌛'
            };

            const emoji = statusEmoji[jobStatus] || '📋';
            const message = `${emoji} ${job.name}: ${job.status}`;
            emitLog(deployId, 'PIPELINE', message);
          }
        });

        previousJobStatuses = currentJobStatuses;

        // Update plant status based on workflow status
        if (status.status === 'completed') {
          if (status.conclusion === 'success') {
            emitLog(deployId, 'SYSTEM', '✅ 배포가 성공적으로 완료되었습니다!');

            // Get deployment service info
            const albDns = 'delightful-deploy-alb-500232323.ap-northeast-2.elb.amazonaws.com';
            const serviceUrl = `http://${albDns}/app/${deployId}/`;

            await plantRef.update({
              status: 'HEALTHY',
              plantType: 'rose',
              version: appVersion || 'v1.0',
              aiInsight: '배포가 성공적으로 완료되었습니다.',
              health: '정상',
              deploymentUrl: serviceUrl,
              githubRunId: deployment.runId,
              updatedAt: new Date()
            });

            io.to(workspaceId).emit('plant-update', {
              id: deployId,
              status: 'HEALTHY',
              deploymentUrl: serviceUrl
            });

            emitLog(deployId, 'SYSTEM', `앱 접속 URL: ${serviceUrl}`);
          } else {
            emitLog(deployId, 'SYSTEM_ERROR', `❌ 배포 실패: ${status.conclusion}`);
            await plantRef.update({
              status: 'ERROR',
              aiInsight: `배포 실패: ${status.conclusion}`,
              health: '오류',
              githubRunId: deployment.runId,
              updatedAt: new Date()
            });

            io.to(workspaceId).emit('plant-update', {
              id: deployId,
              status: 'ERROR'
            });
          }
        } else {
          // Still in progress, poll again
          setTimeout(pollDeployment, pollInterval);
        }

      } catch (error) {
        console.error('[Real Deploy] Error polling deployment:', error);
        emitLog(deployId, 'SYSTEM_ERROR', `폴링 오류: ${error.message}`);

        // Retry polling after a delay
        setTimeout(pollDeployment, pollInterval * 2);
      }
    };

    // Start polling
    setTimeout(pollDeployment, pollInterval);

  } catch (error) {
    console.error('[Real Deploy] Error:', error);
    emitLog(deployId, 'SYSTEM_ERROR', `배포 오류: ${error.message}`);

    if (workspaceId) {
      await plantRef.update({
        status: 'ERROR',
        aiInsight: `배포 실패: ${error.message}`,
        health: '오류',
        updatedAt: new Date()
      });

      io.to(workspaceId).emit('plant-update', {
        id: deployId,
        status: 'ERROR'
      });
    }
  }
}

// Cloud Run 포트 사용
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Deplight 서버 실행: ${PORT}번 포트`));