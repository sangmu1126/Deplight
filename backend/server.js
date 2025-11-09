require('dotenv').config()
const { OpenAI } = require('openai');
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const bodyParser = require('body-parser');
const path = require('path');

// Letsur 게이트웨이 설정
const LETSUR_API_KEY = process.env.LETSUR_API_KEY;
const LETSUR_BASE_URL = "https://gateway.letsur.ai/v1"; 
const AI_MODEL = "claude-3-7-sonnet-20250219"; //

const openai = new OpenAI({
  apiKey: LETSUR_API_KEY,
  baseURL: LETSUR_BASE_URL,
});

const app = express();
// 1. bodyParser와 같은 미들웨어를 먼저 적용합니다.
app.use(bodyParser.json());

// 2. API 및 Webhook 라우트를 먼저 정의합니다.
app.post('/webhook/slack-command', (req, res) => {
  const plant = shelf.find(p => p.id === 3);
  if (!plant) return res.status(404).send('Plant not found');

  // 상태 충돌 방지
  if (plant.status === 'DEPLOYING' || plant.status === 'ROLLBACK') {
    return res.status(409).send('Action already in progress.');
  }

  plant.status = 'DEPLOYING';
  plant.logs = [];
  plant.aiInsight = 'AI가 Slack 명령을 분석 중입니다...';
  io.emit('plant-update', plant);

  emitLog(plant.id, 'SYSTEM', 'Slack 명령에 의해 배포 시작');

  // 3. isWakeUp 플래그를 false로 전달
  runFakeSelfHealingDeploy(plant.id, false);

  res.send('Slack command received. Deployment started.');
});

// 스크린샷 api
app.post('/api/upload-screenshot/:plantId', async (req, res) => {
  const plantId = req.params.plantId;
  const imageBuffer = req.body;

  if (!imageBuffer) {
    return res.status(400).sned('이미지 데이터 X')
  }

  try {
    // Slack으로 이미지 전송
    const plant = await getPlantData(plantId);
    const targetChannel = plant.slackChannel || 'alerts';

    const message = `📸 [${plant.version}] 에러 발생 시점의 스크린샷입니다. (Plant ID: ${plantId})`;
    await sendToSlack(message, targetChannel, imageBuffer);

    console.log(`[${plantId}] 스크린샷 Slack 전송 완료`);
    res.status(200).send('스크린샷이 성공적으로 업로드 및 전송되었습니다.');

  } catch (err) {
    console.error('스샷 실패:', err);
    res.status(500).send('스샷 처리 중 오류');
  }
})



// 3. Flutter Web 빌드 결과를 정적 경로로 지정
app.use(express.static(path.join(__dirname, '../frontend/build/web')));

// 4. 가장 마지막에 "catch-all" 라우트를 둡니다. (오류 수정됨)
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/web/index.html'));
});

// --- (Socket.io 및 서버 설정은 동일) ---
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- 가짜 데이터베이스 ---
let nextId = 4;
let shelf = [
  { id: 1, plant: 'rose', version: 'Unicef_dev', description: 'Unicef 본 프로젝트 demo입니다.', status: 'HEALTHY', owner: 'Alex', reactions: ['🎉', '👍'] },
  { id: 2, plant: 'cactus', version: 'poc_app', description: "don't use", status: 'FAILED', owner: 'Sarah', reactions: [] },
  { id: 3, plant: 'sunflower', version: 'CJ_ENM', description: 'CJ ENM 메인 앱', status: 'HEALTHY', owner: 'Alex', reactions: ['❤️'] },
];
let metrics = { cpu: 5.0, mem: 128.0 };
let globalTraffic = ['Tokyo', 'Seoul', 'London', 'San Francisco', 'Singapore'];

// "PaaS 겨울잠" 시뮬레이션
setInterval(() => {
  const plantToSleep = shelf.find(p => p.id === 1 && p.status === 'HEALTHY');
  if (plantToSleep) {
    console.log('Hibernation: 1번 앱을 "SLEEPING" 상태로 변경합니다.');
    plantToSleep.status = 'SLEEPING';
    io.emit('plant-update', plantToSleep);
  }
}, 60000);

io.on('connection', (socket) => {
  console.log('Deplight PaaS UI가 접속했습니다!');
  socket.emit('current-shelf', shelf);

  const metricsInterval = setInterval(() => {
    metrics = { cpu: 5.0 + Math.random() * 5, mem: 128.0 + Math.random() * 20 };
    socket.emit('metrics-update', metrics);
  }, 1000);

  const trafficInterval = setInterval(() => {
    const location = globalTraffic[Math.floor(Math.random() * globalTraffic.length)];
    const newLog = { time: new Date(), message: `200 OK - /api/ping from ${location}`, status: 'TRAFFIC_HIT' };
    io.emit('new-log', { id: 0, log: newLog });
  }, 1500);

  // 배포 시작
  socket.on('start-deploy', (data) => {
    const isWakeUp = data.isWakeUp || false;
    let plant;

    if (isWakeUp) {
      plant = shelf.find(p => p.id === data.id);
      if (!plant) return;
      // 상태 충돌 방지
      if (plant.status !== 'HEALTHY' && plant.status !== 'SLEEPING' && plant.status !== 'FAILED') {
        emitLog(plant.id, 'SYSTEM_ERROR', '이미 다른 작업이 진행 중입니다.', 0);
        return;
      }
      plant.status = 'DEPLOYING';
      plant.logs = [];
      plant.aiInsight = 'AI가 "겨울잠"에서 깨어나는 중입니다...';
      io.emit('plant-update', plant);
    } else {
      plant = {
        id: nextId++,
        plant: 'pot',
        version: data.version || `New_App_v1.${nextId - 1}`,
        description: data.description || '새 배포입니다...',
        status: 'DEPLOYING',
        owner: 'You',
        reactions: [],
        logs: [],
        aiInsight: 'AI가 배포를 분석 중입니다...'
      };
      shelf.push(plant);
      io.emit('new-plant', plant);
    }

    // 4. 불필요한 socket 매개변수 제거, isWakeUp 전달
    runFakeSelfHealingDeploy(plant.id, isWakeUp);
  });

  socket.on('start-rollback', (data) => {
    const plant = shelf.find(p => p.id === data.id);
    if (plant) {
      // 2. 상태 충돌 방지
      if (plant.status === 'DEPLOYING' || plant.status === 'ROLLBACK') {
        emitLog(plant.id, 'SYSTEM_ERROR', '이미 다른 작업이 진행 중입니다.', 0);
        return;
      }
      // 4. 불필요한 socket 매개변수 제거
      runFakeRollback(plant);
    }
  });

  socket.on('slack-reaction', (data) => {
    const plant = shelf.find(p => p.id === data.id);
    if (plant) {
      const emoji = data.emoji || '🚀';
      plant.reactions.push(emoji);
      io.emit('reaction-update', { id: data.id, reactions: plant.reactions, emoji });
    }
  });

  socket.on('run-command', (cmd) => {
    // 4. 불필요한 socket 매개변수 제거
    emitLog(0, 'COMMAND', cmd, 0);
    setTimeout(() => {
      let response = `zsh: command not found: ${cmd}`;
      let status = 'CONSOLE_ERROR';
      if (cmd.startsWith('kubectl get pods')) {
        status = 'CONSOLE';
        response = `(모든 파드 목록...)\ndeplight-v1-blue-pod-abc12   1/1     Running\n...`;
      }
      emitLog(0, status, response, 0);
    }, 1000);
  });

  socket.on('disconnect', () => {
    clearInterval(metricsInterval);
    clearInterval(trafficInterval);
  });
});

// AI 호출
async function callAiDoctor(errorLog) {
  const prompt = `당신은 '' 꽃을 가꾸는 '정원사' 입니다.
  개발자가 배포에 실패해 꽃이 시들고 있습니다.
  아래 에러 로그를 보고, 꽃이 왜 시들어가는지(원인)과 어떻게 치료해야 하는지(해결책)을
  개발자 초보도 알아들을 수 있게 친절하고, 귀여운 톤으로 1~2문장으로 요약 해주세요.

  Error: ${errorLog}`;

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,  // 클로드 모델
      messages: [{ role: 'user', content: prompt }],
    });

    const diagnosis = completion.choices[0].message.content;
    return diagnosis.trim();
  } catch (error) {
    console.error('AI 호출 실패', error);
    return 'AI 호출 실패';
  }
}

// Slack 전송
async function sendToSlack(message) {
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
  if (!SLACK_WEBHOOK_URL) {
    console.error('SLACK_WEBHOOK_URL is not found');
    return;
  }
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({ text: message }),
    });
    console.log('Slack 전송 완료');
  } catch (err) {
    console.error('Slack 전송 실패:',err)
  }
}



// 4. 불필요한 socket 매개변수 제거
function emitLog(deployId, status, message, delay = 0) {
  const newLog = { time: new Date(), message, status };
  setTimeout(() => {
    if (deployId !== 0) {
      const plant = shelf.find(p => p.id === deployId);
      if (plant && plant.logs) plant.logs.push(newLog);
    }
    io.emit('new-log', { id: deployId, log: newLog });
    if (!status.startsWith('CONSOLE') && status !== 'COMMAND' && status !== 'TRAFFIC_HIT') {
      io.emit('status-update', { id: deployId, status, message });
    }
    if (status === 'AI_INSIGHT') io.emit('ai-insight', { id: deployId, message });
  }, delay);
}

// 3. isWakeUp 플래그 추가 및 4. socket 매개변수 제거
function runFakeSelfHealingDeploy(deployId, isWakeUp = false) {
  const plant = shelf.find(p => p.id === deployId);
  if (!plant) return;
  if (!plant.logs) plant.logs = [];
  if (!plant.aiInsight) plant.aiInsight = '...';

  emitLog(deployId, 'linting', '🧐 흙을 고르고 씨앗을 심는 중...', 1000);
  emitLog(deployId, 'testing', '✅ 새싹이 돋아났어요.', 3000);
  emitLog(deployId, 'building', '📦 줄기가 자라고 있어요.', 5000);
  emitLog(deployId, 'deploying', '🚀 Canary 트래픽 10% 전송...', 7000);

  // 3. isWakeUp(겨울잠) 여부에 따라 성공/실패 분기
  if (isWakeUp) {
    // 성공 (겨울잠 깨우기)
    emitLog(deployId, 'done', '✅ 배포 성공! 겨울잠에서 깨어났습니다.', 9000);
    emitLog(deployId, 'AI_INSIGHT', '서비스 안정화 완료', 9500);
    setTimeout(() => {
      plant.status = 'HEALTHY';
      plant.plant = 'rose'; // 겨울잠 깬 식물로 변경 (선택 사항)
      io.emit('plant-update', plant);
    }, 9000);
  } else {
    // 실패 (일반 배포)

    // 변수 선언
    const fakeErrorLog = 'Error: 500 - /api/checkout (Payment Gateway Timeout)';
    const targetWorkspaceID = plant.targetWorkspaceID   // workspaceId?

    emitLog(deployId, 'TRAFFIC_ERROR', fakeErrorLog, 9000);
    emitLog(deployId, 'AI_INSIGHT', '🚨 에러 감지! 자동 롤백 시작...', 10000);

    // 캡처 명령 전송
    if (targetWorkspaceID) {
      emitLog(deployId, 'SYSTEM', '프론트엔드 캡처 명령 전송', 9001)

      // io.to(Room ID).emit(이벤트명, 데이터)
      io.to(targetWorkspaceID).emit('REQUEST_SCREENSHOT', { plantId: plant.id })

      // 프론트엔드 코드
      // socket.io('REQUEST_SCREENSHOT', (data) => {화면 캡처 및 백엔드로 이미지 전송};
    }

    // AI 호출 (비동기)
    (async () => {
      try {
      const messageText = `대상: ${plant?.version || "New App"}이 문제, (원인: ${fakeErrorLog})`;
      const diagnosis = await callAiDoctor(fakeErrorLog);
      // Slack MSG 보내기
      const finalMessage = `${messageText}\n\n AI 진단: \n${diagnosis}`; 
      await sendToSlack(finalMessage);
      emitLog(deployId, 'AI_INSIGHT', `AI 진단: ${diagnosis}`, 9600)
        
      } catch (err) {
        console.error('AI 호출 error:', err)
        emitLog(deployId, 'AI_INSIGHT', `AI 시스템 오류 발생...`, 9600)
      }
    })();

    setTimeout(() => runFakeRollback(plant), 11000); // 4. socket 매개변수 제거
  }
}

// 4. 불필요한 socket 매개변수 제거
function runFakeRollback(plant) {
  if (!plant) return;
  if (!plant.logs) plant.logs = [];

  // 2. 롤백 시작 시 즉시 상태 변경 및 전파
  plant.status = 'ROLLBACK';
  plant.aiInsight = 'AI가 롤백을 분석 중입니다...';
  io.emit('plant-update', plant); // 상태 변경 즉시 전파

  emitLog(plant.id, 'ROLLBACK', `🚨 롤백 시작! ${plant.version} -> 이전 버전`, 500);
  emitLog(plant.id, 'ROUTING', '🚦 트래픽 Blue로 전환', 2000);
  emitLog(plant.id, 'CLEANUP', '🧹 Green 환경 정리', 4000);
  emitLog(plant.id, 'done', '✅ 롤백 완료', 6000);
  emitLog(plant.id, 'AI_INSIGHT', '서비스 안정화 완료', 6500);

  setTimeout(() => {
    plant.status = 'HEALTHY'; // 롤백이 완료되면 HEALTHY로 변경
    plant.plant = 'rose';
    if (!plant.version.includes('(Rolled Back)')) {
      plant.version = `${plant.version.split(' (')[0]} (Rolled Back)`;
    }
    io.emit('plant-update', plant);
  }, 6000);
}

// Cloud Run 포트 사용
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Deplight 서버 실행: ${PORT}번 포트`));