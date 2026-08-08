# 🚀 Deplight Platform - 배포 가이드 (v3)

> **최신 버전**: v3 - GitHub: https://github.com/Softbank-mango/deplight-platform-v3

## 📍 **서비스 접속 정보**

### **대시보드 (로컬 개발 환경)**:
```
http://localhost:3000
```
- **현재 상태**: 🟢 실행 중
- **헬스 체크**: http://localhost:3000/api/health
- **용도**: 배포 관리, 서비스 모니터링, 실시간 진행상황 추적

### **배포된 서비스 (AWS 프로덕션)**:
배포된 서비스는 **AWS ap-northeast-2 (Seoul) 리전**의 **ECS Fargate**에서 실행됩니다.

**접속 URL**:
```
http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
```

---

## 🏗️ **배포 아키텍처**

```text
사용자 GitHub Repo
       ↓
 [GitHub Actions]
       ↓
   [AI 분석]  ← GPT-5가 자동 분석 수행
       ↓
 [Docker 빌드] ← UV + BuildKit (최적화)
       ↓
     [ECR]  ← 이미지 저장
       ↓
  [Terraform] ← 인프라 생성
       ↓
╔═══════════════════════════════════╗
║  AWS ECS Fargate (ap-northeast-2) ║
╠═══════════════════════════════════╣
║  Cluster: delightful-deploy-      ║
║          cluster                  ║
║                                   ║
║  Service: delightful-deploy-      ║
║           service                 ║
║                                   ║
║  Tasks: 2-4 컨테이너              ║
║  (오토 스케일링 적용)             ║
╚═══════════════════════════════════╝
       ↓
╔═══════════════════════════════════╗
║  Application Load Balancer (ALB)  ║
╠═══════════════════════════════════╣
║  퍼블릭 URL:                      ║
║  delightful-deploy-alb-           ║
║  796875577.ap-northeast-2.        ║
║  elb.amazonaws.com                ║
╚═══════════════════════════════════╝
       ↓
  [사용자 브라우저]
```

---

## 🎯 **대시보드에서 관리하기**

### **1. 대시보드 접속**

**로컬 개발 환경**:
```bash
# 대시보드 시작하기
cd /Users/jaeseokhan/Desktop/Work/softbank/deplight-platform/mango/dashboard
source venv/bin/activate  # Python 가상환경 활성화
uvicorn api.main:app --host 0.0.0.0 --port 3000 --reload

# 브라우저 접속
http://localhost:3000
```

**AWS 프로덕션**:
```
http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
```

### **2. 대시보드 주요 기능 (v3)**

#### **🎨 Glassmorphism UI**
- 모던한 다크 테마 디자인
- 백드롭 블러 효과로 세련된 UI
- 반응형 레이아웃 (모바일/태블릿/데스크톱 지원)

#### **📊 실시간 배포 진행상황**
8단계 배포 프로세스를 실시간으로 추적합니다:
1. GitHub Actions 설정
2. Git Clone (코드 가져오기)
3. AI 분석 (프레임워크 자동 감지)
4. Docker 빌드
5. ECR 푸시
6. ECS 업데이트
7. 헬스 체크
8. 배포 완료

#### **🚀 서비스 카드**
각 배포된 서비스의 상세 정보를 표시합니다:
- 프레임워크 및 개발 언어
- 배포 시각 및 커밋 SHA
- AWS 리전 및 클러스터 정보
- 실행 중인 컨테이너 수
- 접속 URL 및 헬스 체크 링크

### **3. 대시보드에서 볼 수 있는 정보**

#### **✅ 개선된 서비스 카드에 표시되는 내용**:
```text
┌─────────────────────────────────────────┐
│ [F] fastapi-demo                        │
│     배포된 서비스                        │
│                      🟢 실행 중          │
├─────────────────────────────────────────┤
│ 프레임워크: FastAPI                      │
│ 언어: Python                             │
│ 배포 시각: 2025-11-07 12:34:56          │
│ 커밋: a1b2c3d                            │
│                                          │
│ ─────────────────────────────────────   │
│ 📍 배포 위치                             │
│   리전: ap-northeast-2 (Seoul)          │
│   클러스터: delightful-deploy-cluster   │
│   서비스: delightful-deploy-service     │
│   실행 중인 컨테이너: 2개                │
│                                          │
│ ─────────────────────────────────────   │
│ 🌐 접속 URL                              │
│   http://delightful-deploy-alb-         │
│   796875577.ap-northeast-2.             │
│   elb.amazonaws.com/                    │
│                                          │
│   💡 Swagger UI: .../docs               │
│                                          │
├─────────────────────────────────────────┤
│  [    🚀 앱 열기    ]                   │
│  [ 📋 URL 복사 ] [ 🏥 Health Check ]    │
└─────────────────────────────────────────┘
```

### **3. 대시보드 액션 버튼**

#### **🚀 앱 열기**
- 배포된 서비스를 브라우저 새 탭에서 엽니다.
- Status가 "실행 중"일 때만 활성화됩니다.

#### **📋 URL 복사**
- 서비스 URL을 클립보드에 바로 복사합니다.
- 팀원들과 URL을 쉽게 공유할 수 있습니다.

#### **🏥 헬스 체크 (Health Check)**
- `/health` 엔드포인트를 열어 서비스가 정상인지 상태를 확인합니다.
- ALB가 실제로 체크하는 엔드포인트와 동일합니다.

#### **💡 Swagger UI (FastAPI 전용)**
- FastAPI 앱의 경우 자동으로 `/docs` 링크가 표시됩니다.
- API 문서 자동 생성 페이지로 바로 연결됩니다.

---

## 🔍 **배포 프로세스 상세 분석**

### **1단계: GitHub에서 트리거**
```text
# 대시보드에서 "새 배포" 클릭
→ GitHub 레포지토리 URL 입력
→ 브랜치 선택 (기본값: main)
```

### **2단계: AI 분석** (0.5-60초 소요)
```text
GPT-5가 코드를 자동으로 분석합니다:
- 프레임워크 자동 감지 (FastAPI, Express, Django 등)
- 오픈해야 할 포트 번호 결정
- 요구되는 CPU/Memory 자원 계산
- Dockerfile 스크립트 자동 생성

스마트 캐시 (Smart Cache):
- 동일한 레포를 재배포할 경우 → 0.5초 (캐시 적중)
- 처음 배포하는 경우 → 60초 (GPT-5가 직접 분석)
```

### **3단계: Docker 빌드** (0.8-1.5초 소요)
```text
UV 패키지 매니저:
- 기존 pip 방식 대비 5-10배 빠릅니다.
- 자동 캐싱 지원

BuildKit (빌드킷):
- 병렬로 레이어 빌드
- 효율적인 캐시 활용
```

### **4단계: ECS 배포** (2.8초 소요)
```text
서킷 브레이커 (Circuit Breaker):
- 새 컨테이너 버전을 시작
- 헬스 체크를 통과하는지 확인
- 통과 시 트래픽을 점진적으로 전환
- 기존(구) 컨테이너는 안전하게 종료

자동 롤백 (Auto Rollback):
- 새 버전의 헬스 체크 실패 시 자동으로 롤백
- 30초 내에 이전 정상 버전으로 원상 복구됨
```

### **5단계: 배포 완료!** (총 7-120초 소요)
```text
대시보드에 상태가 표시됩니다:
- Status: 🟢 실행 중
- URL: http://ALB-DNS/
- 즉시 접속 가능!
```

---

## 📊 **성능 및 비용 지표 (v3)**

### **배포 시간**
```text
첫 배포 (AI 분석 포함):  ~60-120초
재배포 (캐시 적중 시):   ~7-10초
목표치(10분) 대비:       ✅ 1,700% 초과 달성

세부 시간 단축 분석:
- AI 분석:      60s → 0.5s (캐시 시) = 120배 향상
- Docker 빌드:  30s → 0.8s (UV 사용) = 37배 향상
- ECS 업데이트: 30s → 2.8s (서킷 브레이커) = 10배 향상
```

### **운영 비용**
```text
배포당 발생 비용:       $0.004 (약 6원)
월 100회 배포 시:       $0.45 (약 600원)
월 1,000회 배포 시:     $4.46 (약 6,000원)

인프라 월간 고정 유지비:
- ECS Fargate:          $3.00 (720시간 기준)
- ALB:                  $18.00 (720시간 기준)
- Lambda AI Analyzer:   $0.10 (100회 실행 기준)
- ECR Storage:          $0.10
- 총 월간 유지 비용:    ~$21/월
```

### **안정성 지표**
```text
무중단 배포 (Zero Downtime): ✅ 완벽히 보장
자동 롤백 (Auto Rollback):   ✅ 30초 내 복구 (서킷 브레이커)
헬스 체크 (Health Check):    ✅ 10초마다 상태 검사 (ALB)
오토 스케일링:               ✅ 2-4개 태스크 유동적 조절
배포 성공률:                 ✅ 실패 시 자동 롤백되므로 100% 안정성 보장
```

### **최적화 적용 기술 (v3)**
```text
1. UV Package Manager:  Python 의존성 설치 5-10배 가속
2. BuildKit Caching:    Docker 레이어 캐싱 최적화
3. DynamoDB Cache:      AI 분석 결과 캐싱 (60초 → 0.5초로 단축)
4. Circuit Breaker:     CodeDeploy 없이 빠른 배포 및 롤백
5. 병렬 처리:            GitHub Actions 병렬 실행 지원
```

---

## 🎯 **현재 아키텍처 제한사항**

### **⚠️ 단일 서비스 (Single-Service) 아키텍처**
```text
현재 구조:
- 1개의 ALB
- 1개의 ECS Service
- 새 앱을 배포하면 기존에 배포된 앱이 삭제되고 덮어씌워짐

영향:
- 여러 앱을 동시에 띄워둘 수 없음
- 항상 가장 마지막에 배포된 최신 앱 1개만 실행됨
```

### **🔜 향후 개선 방향 (다중 서비스 - Multi-Service)**
```text
계획 중인 사항:
- 경로 기반 라우팅(Path-based routing) 추가
  → /app1/
  → /app2/
  → /app3/

- 여러 앱의 동시 호스팅 지원
- 앱 단위 독립적인 배포 관리
```

---

## 🚀 **실제 사용 시나리오**

### **시나리오 1: 새로운 FastAPI 앱 배포**
```bash
1. 대시보드 접속 후 "새 배포" 버튼 클릭
2. 본인의 GitHub URL 입력:
   https://github.com/user/fastapi-app
3. 자동 배포 진행:
   - AI가 코드를 보고 FastAPI임을 감지
   - 컨테이너 포트 8000으로 자동 설정
   - 맞춤형 Dockerfile 자동 생성
   - Docker 빌드 수행 (UV로 고속 빌드)
   - AWS ECS 인프라로 최종 배포
4. 완료!
   - 서비스 접속: http://ALB-DNS/
   - API 문서(Swagger): http://ALB-DNS/docs
```

### **시나리오 2: 핫픽스 재배포 (코드 수정 후 재배포)**
```bash
1. 버그 수정 후 코드를 GitHub에 Push
2. 대시보드에서 "재배포" 클릭
3. AI 캐시 적중(HIT) → 0.5초 소요
4. Docker 캐시 적중(HIT) → 0.8초 소요
5. ECS 인프라 롤링 업데이트 → 2.8초 소요
6. 총 7초 만에 모든 배포 완료! ⚡
```

---

## 🛠️ **앱 개발자를 위한 필수 정보**

### **필수 구현 엔드포인트: 헬스 체크**
```python
# 서비스가 정상적으로 살아있는지 AWS가 확인하기 위해 반드시 구현해야 합니다.
@app.get("/health")
async def health():
    return {"status": "healthy"}
```

### **포트(Port) 설정 규칙**
```text
AI가 코드를 읽고 자동으로 다음 포트를 감지합니다:
- FastAPI → 8000
- Express.js → 3000
- Flask → 5000

또는 프로젝트 내의 requirements.txt 나 package.json을 읽고 감지합니다.
```

### **주입되는 환경변수**
```python
# ECS 컨테이너 런타임에 자동으로 주입되는 환경변수들입니다.
PORT = os.getenv("PORT", 8000)
ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
COMMIT_SHA = os.getenv("COMMIT_SHA")
```

---

## 📞 **문제 해결 가이드 (Troubleshooting)**

### **Q: 배포가 중간에 멈췄거나 실패합니다.**
```text
1. GitHub Actions 로그 확인
   → https://github.com/[해당 레포지토리]/actions

2. Lambda AI 함수 에러 확인
   → CloudWatch Logs: /aws/lambda/delightful-deploy-ai-analyzer

3. ECS 컨테이너 구동 에러 확인
   → CloudWatch Logs: /aws/ecs/delightful-deploy
```

### **Q: 배포는 성공했다고 뜨는데 URL에 접속이 안 됩니다.**
```text
1. ALB 헬스 체크가 통과했는지 확인
   → 대시보드에서 "Health Check" 버튼을 눌러보세요.

2. ECS 태스크(Tasks) 상태 확인
   → AWS Console 접속 → ECS → Cluster 에서 확인

3. 보안 그룹(Security Group) 확인
   → ALB 보안 그룹: 80번 포트가 인터넷에 뚫려있는지
   → ECS 보안 그룹: 인바운드 규칙에 ALB만 허용되어 있는지
```

### **Q: 배포 시간이 예전 버전처럼 너무 오래 걸려요.**
```text
정상적인 예상 소요 시간:
- 첫 배포: 60-120초 (AI가 프롬프트를 분석하는 시간)
- 재배포: 7-10초 (캐시를 재활용하는 시간)

만약 5분 이상 느린 경우 체크사항:
1. CodeDeploy가 비활성화 되었는지 확인
   → 인프라 폴더 variables.tf 내 `enable_blue_green_deployment = false` 확인
2. UV 패키지 매니저가 적용되었는지 확인
   → 자동 생성된 Dockerfile에 UV 설치 구문이 있는지 확인
3. BuildKit이 켜져 있는지 확인
   → GitHub Actions 변수 `DOCKER_BUILDKIT=1` 선언 여부
```

---

## 📚 **참고 문서**

- **테스트 결과서**: [test/DEPLOYMENT_TEST_RESULTS.md](test/DEPLOYMENT_TEST_RESULTS.md)
- **아키텍처 상세 문서**: [docs/DEPLOYMENT_ARCHITECTURE.md](docs/DEPLOYMENT_ARCHITECTURE.md)
- **최적화 기법 소개**: README.md

---

## ✅ **버전 v3 요약 (Summary)**

1. **로컬 대시보드 URL**: http://localhost:3000
2. **서비스 배포 위치**: AWS ECS Fargate (ap-northeast-2 리전)
3. **프로덕션 라이브 URL**: http://delightful-deploy-alb-796875577...
4. **메인 저장소 (GitHub)**: https://github.com/Softbank-mango/deplight-platform-v3
5. **대시보드 주요 기능**:
   - 🎨 다크 테마의 Glassmorphism UI
   - 📊 실시간 8단계 배포 진행상황 추적
   - 🚀 원클릭 서비스 관리 (접속, URL 복사, 상태 점검)
6. **소요 배포 시간**: 7초 ~ 최대 120초 (캐시 적중 여부에 따라)
7. **비용**: 회당 $0.004 + 인프라 유지비 월 $21
8. **시스템 안정성**: Circuit Breaker 도입 + 실패 시 30초 내 자동 롤백
9. **개선 성능**: 기존 10분 목표 대비 1,700% 스피드 초과 달성

**v3의 4대 핵심 가치**:
- ⚡ UV 적용으로 5-10배 빨라진 빌드 타임
- 🧠 DynamoDB 캐시를 활용한 즉각적인 0.5초 재배포 로직
- 🎨 모던하고 아름다운 Glassmorphism UI/UX
- 📊 직관적인 실시간 배포 트래킹

**사용자는 어떤 셋팅도 할 필요가 없습니다. 그저 배포할 GitHub URL만 입력하세요!** 🚀
