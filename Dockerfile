# Node.js 18 버전 기반
FROM node:18

# 1. backend 작업 디렉토리
WORKDIR /usr/src/app/backend

# 2. backend package.json만 복사 후 의존성 설치
COPY backend/package*.json ./
RUN npm install --production

# 3. backend 전체 코드 복사
COPY backend/ ./

# 4. Flutter Web 빌드 결과 복사 (상위 frontend 폴더 기준)
COPY frontend/build/web /usr/src/app/frontend/build/web

# 5. Cloud Run 포트
ENV PORT=8080
EXPOSE 8080

# 6. backend/server.js 실행
CMD ["node", "server.js"]
