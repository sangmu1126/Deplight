const express = require('express');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- 가짜 데이터베이스 ---
let serviceStatus = { status: 'waiting', message: '무엇을 심어볼까요?' };
let logs = [];
let metrics = { cpu: 5.0 + Math.random() * 5, mem: 128.0 + Math.random() * 20 };
// ------------------------

io.on('connection', (socket) => {
  console.log('Flutter UI가 접속했습니다!');
  // 접속 즉시 현재 상태 전송
  socket.emit('status', serviceStatus);
  socket.emit('all-logs', logs);
  
  // 접속자에게 1초마다 가짜 매트릭 전송
  const metricsInterval = setInterval(() => {
    metrics = { 
      cpu: 5.0 + Math.random() * 5, // 평소엔 5~10%
      mem: 128.0 + Math.random() * 20 
    };
    socket.emit('metrics-update', metrics);
  }, 1000);

  // 배포 시작
  socket.on('start-deploy', () => {
    console.log('UI로부터 배포 시작 명령을 받았습니다!');
    runFakeK8sDeployment(socket); // 배포 시뮬레이션 시작
  });
  
  // (실패 테스트)
  socket.on('start-fail', () => {
    console.log('UI로부터 실패 테스트 시작 명령을 받았습니다!');
    runFakeFail(socket);
  });

  // --- (신규) "가짜 콘솔" 명령어 리스너 ---
  socket.on('run-command', (cmd) => {
    console.log(`UI로부터 명령어 받음: ${cmd}`);

    // 1. 사용자가 입력한 명령어를 로그에 즉시 에코
    emitLog(socket, 'COMMAND', cmd, 0);

    // 2. "가짜" 응답 생성 (1초 딜레이)
    setTimeout(() => {
      let response = `zsh: command not found: ${cmd}`; // 기본 응답
      let status = 'CONSOLE_ERROR';

      if (cmd.startsWith('kubectl get pods')) {
        status = 'CONSOLE';
        response = `NAME                                READY   STATUS    RESTARTS   AGE
deplight-v1-blue-pod-abc12   1/1     Running   0          3h
deplight-v2-green-pod-xyz78   1/1     Running   0          12m`;
      } else if (cmd.startsWith('kubectl logs')) {
        status = 'CONSOLE';
        response = `[${new Date().toISOString()}] Server listening on port 8080
[${new Date().toISOString()}] Health check OK
... (로그 100줄) ...`;
      } else if (cmd.startsWith('ls')) {
        status = 'CONSOLE';
        response = 'README.md  package.json  server.js';
      }

      emitLog(socket, status, response, 0); // 딜레이 없이 즉시 응답 전송
    }, 1000); // 1초간 "생각하는 척"
  });
  // ------------------------------------
  
  socket.on('disconnect', () => {
    clearInterval(metricsInterval); // 연결 끊기면 인터벌 중지
  });
});

// 로그/상태 전송 함수 (딜레이 인자 추가)
function emitLog(socket, status, message, delay = 0) {
  const newLog = { time: new Date(), message, status };
  
  if (status !== 'COMMAND' && status !== 'CONSOLE' && status !== 'CONSOLE_ERROR') {
    // 배포 상태 메시지인 경우 (나무 키우기용)
    const newStatus = { status, message };
    io.emit('status', newStatus); // 모든 클라이언트에 전파
  }
  
  // 로그는 모든 클라이언트에 전파
  setTimeout(() => {
    logs.push(newLog); // 로그 누적
    io.emit('new-log', newLog); 
  }, delay);
}

// 가짜 배포 시뮬레이션
function runFakeK8sDeployment(socket) {
  logs = []; // 로그 초기화
  emitLog(socket, 'linting', '🧐 흙을 고르고 씨앗을 심는 중...', 1000);

  // 배포 중 매트릭 상승 시뮬레이션 (이전과 동일)
  let i = 0;
  const deployMetricsInterval = setInterval(() => {
    metrics = { cpu: 30.0 + Math.random() * 40, mem: 256.0 + Math.random() * 100 };
    io.emit('metrics-update', metrics);
    i++;
    if (i > 12) clearInterval(deployMetricsInterval);
  }, 1000);

  emitLog(socket, 'testing', '✅ 좋아요! 건강한 새싹이 돋아났어요.', 3000);
  emitLog(socket, 'building', '📦 쑥쑥! 줄기가 자라고 있어요.', 5000);
  emitLog(socket, 'deploying', '🚀 잎이 무성해지는 중... (Green 배포)', 8000);
  emitLog(socket, 'routing', '🚦 두근두근... 꽃이 피기 직전이에요!', 11000);
  emitLog(socket, 'done', '✨ 완벽해요! 예쁜 꽃이 피었어요!', 13000);
}

// 가짜 실패 시뮬레이션
function runFakeFail(socket) {
  logs = [];
  emitLog(socket, 'linting', '🧐 흙을 고르는 중...', 1000);
  emitLog(socket, 'testing', '❌ 앗! 테스트에 실패했어요.', 3000);
  emitLog(socket, 'failed', '😭 나무가 시들었어요... (롤백 중)', 4000);
}

server.listen(4000, () => {
  console.log('가짜 K8s+Metrics+Console 백엔드 서버가 4000번 포트에서 실행 중입니다.');
});

