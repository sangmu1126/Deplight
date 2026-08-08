# 🎨 대시보드 배포 가이드 (Dashboard Deployment Guide)

## 📍 현재 상태

**GitHub 레포지토리:** https://github.com/Softbank-mango/deplight-platform-v3

**현재 실행 중인 앱:**
- URL: http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
- 앱: E-Commerce FastAPI Application
- 상태: 🟢 실행 중

---

## 🚀 대시보드 배포 방법

### **방법 1: GitHub Actions 자동 배포 (권장)**

#### 준비사항
1. GitHub의 `deplight-platform-v3` 레포지토리에 AWS secrets 설정
2. OIDC Role ARN 설정

#### 배포 단계
```bash
# 1. GitHub에 코드 푸시 (이미 완료됨 ✅)
git push origin main

# 2. GitHub Actions에서 Deploy Dashboard 워크플로우 수동 실행
# https://github.com/Softbank-mango/deplight-platform-v3/actions/workflows/deploy-dashboard.yml
# "Run workflow" 버튼 클릭

# 3. 배포 진행 상황 모니터링
# GitHub Actions 페이지에서 실시간 로그 확인

# 4. 완료! (약 5-10분 소요)
# Dashboard URL: http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
```

#### GitHub Actions 워크플로우
- 파일: `.github/workflows/deploy-dashboard.yml`
- 트리거:
  - `mango/dashboard/` 경로의 코드가 변경될 시 자동 실행
  - 수동 실행 (`workflow_dispatch`)

#### 배포 과정
```
1. ✅ 코드 체크아웃 (Checkout code)
2. ✅ AWS 자격 증명 설정 (Configure AWS credentials - OIDC)
3. ✅ ECR 로그인 (Login to ECR)
4. ✅ Docker 이미지 빌드 (Build Docker image - UV + BuildKit)
5. ✅ ECR로 푸시 (Push to ECR)
6. ✅ ECS 작업 정의 업데이트 (Update ECS task definition)
7. ✅ ECS 서비스 업데이트 (Update ECS service)
8. ✅ 안정화 대기 (Wait for stability)
9. ✅ 헬스 체크 (Health check)
```

---

### **방법 2: 로컬에서 수동 배포**

#### 전제 조건
- Docker Desktop 실행 중일 것
- AWS CLI 설정이 완료되어 있을 것
- `.env` 파일이 설정되어 있을 것

#### 배포 스크립트 실행
```bash
# Dashboard 배포 스크립트
./scripts/deploy_dashboard.sh
```

#### 스크립트 동작 순서
1. ECR 로그인
2. ALB DNS 확인
3. Docker 이미지 빌드 (UV + BuildKit)
4. ECR에 이미지 푸시
5. ECS Task Definition 업데이트
6. ECS 서비스 재시작
7. Health Check

---

### **방법 3: 간단한 재배포 (이미지가 ECR에 있는 경우)**

```bash
# Python 스크립트로 간단 재배포
python3 scripts/deploy_dashboard_simple.py
```

⚠️ **주의**: 현재 ECS 서비스가 CodeDeploy를 사용 중이므로 `forceNewDeployment` 옵션이 작동하지 않습니다.

**해결 방법:**
1. Terraform에서 `enable_blue_green_deployment = false`로 설정
2. `terraform apply`로 인프라 업데이트
3. 이후 간단한 재배포 가능

---

## 🏗️ 현재 인프라 설정

### ECS 서비스 구성
```
Cluster: delightful-deploy-cluster
Service: delightful-deploy-service
Deployment Controller: CODE_DEPLOY (Blue-Green)
Desired Tasks: 2
Current Tasks: 2 running
```

### 작업 정의 (Task Definition)
```
Family: delightful-deploy
CPU: 256
Memory: 512
Container Port: 8000
Health Check: /api/health
```

### ALB (애플리케이션 로드 밸런서)
```
Name: delightful-deploy-alb
DNS: delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com
Port: 80 (HTTP)
Health Check: /health
```

---

## 🔄 배포 전환 (E-Commerce → Dashboard)

현재 E-Commerce API가 실행 중이므로, Dashboard로 전환하려면 다음 방법 중 하나를 선택하세요:

### Option A: CodeDeploy를 사용한 안전한 전환
```bash
# 1. Dashboard Docker 이미지 빌드
cd mango/dashboard
docker build -t 513348493870.dkr.ecr.ap-northeast-2.amazonaws.com/delightful-deploy:dashboard-latest .

# 2. ECR에 푸시
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 513348493870.dkr.ecr.ap-northeast-2.amazonaws.com
docker push 513348493870.dkr.ecr.ap-northeast-2.amazonaws.com/delightful-deploy:dashboard-latest

# 3. CodeDeploy 배포 생성
aws deploy create-deployment \
  --application-name delightful-deploy-app \
  --deployment-group-name delightful-deploy-dg \
  --deployment-config-name CodeDeployDefault.ECSCanary10Percent5Minutes \
  --description "Deploy Dashboard"
```

### Option B: GitHub Actions 자동 배포 (권장)
```bash
# GitHub에서 워크플로우 실행
https://github.com/Softbank-mango/deplight-platform-v3/actions
→ Deploy Dashboard 클릭
→ Run workflow 클릭
```

### Option C: Circuit Breaker로 빠른 배포 (설정 변경 필요)
```bash
# 1. Terraform 설정 변경
# mango/infrastructure/terraform/variables.tf 파일에서
# enable_blue_green_deployment = false 로 수정

# 2. Terraform 적용
cd mango/infrastructure/terraform
terraform apply

# 3. 이후 스크립트로 빠른 재배포 가능
python3 ../../scripts/deploy_dashboard_simple.py
```

---

## 📊 대시보드 접속 후 확인 사항

배포 완료 후 다음 URL들에 접속하여 상태를 확인하세요:

### 1. **메인 대시보드**
```
http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
```

**예상 화면:**
- Glassmorphism 다크 테마 디자인
- 통계 카드 (실행 중인 서비스, 배포 중, 평균 배포 시간, 비용 등)
- 배포된 서비스 목록 (카드 형태)
- "새 배포" 버튼

### 2. **API 헬스 체크**
```
http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/api/health
```

**예상 응답:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-07T...",
  "service": "dashboard-api"
}
```

### 3. **서비스 목록 API**
```
http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/api/services
```

**예상 응답:**
```json
{
  "success": true,
  "count": 1,
  "services": [
    {
      "id": "...",
      "name": "...",
      "framework": "FastAPI",
      "status": "healthy",
      ...
    }
  ]
}
```

---

## 🐛 문제 해결 (Troubleshooting)

### 문제 1: CodeDeploy 오류
```
Error: Cannot force a new deployment on services with a CODE_DEPLOY deployment controller
```

**해결책:**
1. Terraform 설정을 변경하여 Circuit Breaker 모드로 전환
2. 또는 AWS CodeDeploy API를 직접 사용하여 배포

### 문제 2: Docker 데몬이 실행되지 않음
```
Error: Cannot connect to the Docker daemon
```

**해결책:**
1. 로컬 환경이라면 Docker Desktop을 시작하세요.
2. 로컬이 번거롭다면 GitHub Actions를 사용하세요 (로컬 Docker 불필요).

### 문제 3: ECR 로그인 실패
```
Error: no basic auth credentials
```

**해결책:**
```bash
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin 513348493870.dkr.ecr.ap-northeast-2.amazonaws.com
```

### 문제 4: Health Check 실패
```
Health check failed after 10 attempts
```

**해결책:**
1. ECS 태스크 로그를 확인합니다:
```bash
python3 mango/scripts/check_ecs_tasks.py
```

2. CloudWatch Logs를 확인합니다:
```bash
aws logs tail /aws/ecs/delightful-deploy --follow
```

3. 보안 그룹(Security Group)을 확인합니다:
```bash
# ALB에서 ECS로의 통신 포트가 열려있는지 확인
```

---

## 📝 배포 후 작업 항목 (TODO)

### 즉시 확인 (Immediate)
- [ ] Health Check 정상 동작 확인
- [ ] Dashboard UI 접속 정상 확인
- [ ] 주요 API 엔드포인트 응답 테스트

### 단기 계획 (1주일 내)
- [ ] DynamoDB에서 실제 배포 데이터가 잘 로드되는지 확인
- [ ] GitHub Actions를 통한 새로운 앱 배포 테스트
- [ ] 배포 진행 상황이 실시간으로 업데이트되는지 확인

### 중기 계획 (1개월 내)
- [ ] Multi-Service 아키텍처 구현 (Path-based 라우팅 적용)
- [ ] Custom Domain (커스텀 도메인) 설정 (예: deplight.com)
- [ ] HTTPS/SSL 인증서 발급 및 적용

---

## 🎯 다음 단계 (Next Steps)

### 1. **GitHub Actions Secrets 설정**
```
Repository Settings → Secrets and variables → Actions 이동

필요한 Secrets:
- AWS_ROLE_ARN: arn:aws:iam::513348493870:role/github-actions-role
- GITHUB_TOKEN: (자동으로 생성되어 제공됨)
```

### 2. **Dashboard 배포 실행**
```bash
# GitHub Actions 메뉴에서
https://github.com/Softbank-mango/deplight-platform-v3/actions/workflows/deploy-dashboard.yml
→ 'Run workflow' 버튼 클릭
```

### 3. **배포 완료 후 접속 테스트**
```
http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
```

---

## ✅ 요약 (Summary)

1. **v3 코드 GitHub 푸시**: ✅ 완료
   - https://github.com/Softbank-mango/deplight-platform-v3

2. **대시보드 배포 준비**: ✅ 완료
   - Dockerfile 생성 완료
   - GitHub Actions 워크플로우 구성 완료
   - 배포 자동화 스크립트 작성 완료

3. **대시보드 배포 실행**: ⏳ 대기 중
   - GitHub Actions에서 수동(Run workflow)으로 실행 필요
   - 또는 로컬 환경에서 `./scripts/deploy_dashboard.sh` 실행

4. **현재 상태 (실행 중인 앱)**: E-Commerce API
   - URL: http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
   - Dashboard 화면으로 전환하려면 새 배포 과정을 밟아야 함

---

**🚀 Dashboard를 AWS에서 계속 돌아가도록 유지하려면:**

1. GitHub Actions에서 `deploy-dashboard.yml` 워크플로우를 실행하세요.
2. 혹은 로컬에 Docker Desktop을 켜고 `./scripts/deploy_dashboard.sh`를 실행하세요.
3. 배포가 끝나면 위 URL로 접속하여 확인합니다.

**모든 준비가 완료되었습니다!** 🎉
