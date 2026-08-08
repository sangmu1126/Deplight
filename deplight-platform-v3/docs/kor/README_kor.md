# Deplight Platform - v3

> **🚀 초고속 서버리스 배포 플랫폼**
> 어떤 GitHub 레포지토리든 7~120초 안에 AWS에 배포하는 AI 기반 최적화 플랫폼

[![GitHub](https://img.shields.io/badge/GitHub-v3-blue)](https://github.com/Softbank-mango/deplight-platform-v3)
[![AWS](https://img.shields.io/badge/AWS-ECS%20Fargate-orange)](https://aws.amazon.com/fargate/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## v3의 새로운 기능

### 🎨 모던 대시보드
- **Glassmorphism UI**: 백드롭 블러 효과가 적용된 세련된 다크 테마
- **실시간 추적**: 8단계 배포 진행 상황 시각화
- **로컬 개발**: http://localhost:3000 에서 실행 가능

### ⚡ 성능 혁신
- **7초 재배포** (캐시 적중 시)
- 기존 목표(10분) 대비 **1,700% 속도 향상**
- **UV 패키지 매니저**: pip 대비 5-10배 빠른 속도
- **DynamoDB 캐시**: AI 분석 시간을 60초에서 0.5초로 단축

### 🏗️ 인프라 개선
- **Circuit Breaker (서킷 브레이커)**: 빠르고 안전한 배포
- **자동 롤백**: 30초 내 자동 복구
- **Terraform Local/Remote**: 유연한 상태(State) 관리

## 빠른 시작 (Quick Start)

### 대시보드 (로컬 환경)
```bash
# 레포지토리 클론
git clone https://github.com/Softbank-mango/deplight-platform-v3
cd deplight-platform/mango/dashboard

# Python 환경 설정
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 대시보드 실행
uvicorn api.main:app --host 0.0.0.0 --port 3000 --reload

# 접속
open http://localhost:3000
```

### 앱 배포하기
1. 대시보드 열기: http://localhost:3000
2. "새 배포 (New Deployment)" 클릭
3. GitHub URL 입력: `https://github.com/your-org/your-app`
4. 7~120초 대기
5. 완료! 다음 주소로 접속: `http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/`

## 배포 시스템 개요 (Deployment System Overview)

### 아키텍처 흐름 (Architecture Flow)
```
개발자 (GitHub URL)
    ↓
대시보드 (Glassmorphism UI)
    ↓
GitHub Actions (OIDC Auth)
    ↓
Lambda AI Analyzer (프레임워크 감지 + Dockerfile 생성)
    ↓
Docker Build (UV + BuildKit)
    ↓
ECR (이미지 저장소)
    ↓
ECS Fargate (Circuit Breaker 배포)
    ↓
ALB (로드 밸런서)
    ↓
라이브 애플리케이션!
```

### 주요 기술 (Key Technologies)
- **프론트엔드**: React 18, Tailwind CSS, Glassmorphism 디자인
- **백엔드**: FastAPI, Python 3.11+
- **AI**: 코드 분석용 GPT-5, DynamoDB 캐싱
- **컨테이너**: UV 패키지 매니저가 포함된 Docker
- **클라우드**: AWS ECS Fargate, ALB, Lambda
- **IaC (코드형 인프라)**: Terraform (Circuit Breaker 적용)
- **CI/CD**: GitHub Actions (OIDC 인증)

## 레포지토리 구조 (v3)
```text
deplight-platform/
├─ mango/
│  ├─ dashboard/                    # 대시보드 UI/API
│  │  ├─ api/                       # FastAPI 백엔드
│  │  │  ├─ main.py                 # API 라우트
│  │  │  └─ models.py               # 데이터 모델
│  │  ├─ static/
│  │  │  └─ index.html              # Glassmorphism UI
│  │  ├─ requirements.txt           # Python 종속성 패키지
│  │  ├─ Dockerfile                 # UV 최적화
│  │  └─ venv/                      # Python 가상 환경
│  ├─ lambda/
│  │  └─ ai_code_analyzer/          # AI 분석 람다
│  │     ├─ handler.py              # 메인 핸들러
│  │     ├─ generators/             # Dockerfile 생성기
│  │     └─ templates/              # 프레임워크 템플릿
│  ├─ infrastructure/
│  │  └─ terraform/                 # IaC
│  │     ├─ main.tf
│  │     ├─ ecs.tf                  # Circuit Breaker 설정
│  │     ├─ lambda.tf
│  │     └─ variables.tf
│  └─ scripts/
│     ├─ deploy_dashboard.sh        # 전체 배포 스크립트
│     └─ deploy_dashboard_simple.py # 빠른 재배포
├─ docs/
│  ├─ deployment_system.md          # 아키텍처 (v3)
│  ├─ README_DEPLOYMENT_GUIDE.md    # 사용자 가이드 (v3)
│  ├─ GITHUB_REPOSITORY_SCENARIOS.md # 레포지토리 시나리오
│  └─ DASHBOARD_DEPLOYMENT.md       # 대시보드 배포 가이드
├─ test/
│  └─ demo_app/                     # 테스트용 애플리케이션들
│     ├─ fastapi-ecommerce/
│     ├─ express-todo/
│     └─ streamlit-dashboard/
└─ .github/
   └─ workflows/
      ├─ deploy.yml                 # 메인 배포 파이프라인
      └─ deploy-dashboard.yml       # 대시보드 배포 파이프라인
```

## 성능 지표 (Performance Metrics)

| 지표 | 최초 배포 | 재배포 (캐시) | 개선도 |
|--------|-------------|------------------|-------------|
| AI 분석 | 60초 | 0.5초 | 120배 향상 |
| Docker 빌드 | 30초 | 0.8초 | 37배 향상 |
| ECS 업데이트 | 30초 | 2.8초 | 10배 향상 |
| **총합** | **~120초** | **~7초** | **17배 향상** |

## 비용 분석 (Cost Analysis)

| 리소스 | 배포당 비용 | 월간 (100회 배포 기준) |
|----------|-------------|----------------------|
| Lambda AI | $0.001 | $0.10 |
| ECR 스토리지 | $0.001 | $0.10 |
| ECS Fargate | $0.004/시간 | $3.00 (720시간) |
| ALB | $0.025/시간 | $18.00 (720시간) |
| **총합** | **$0.004** | **~$21/월** |

## 지원하는 프레임워크

### 백엔드 (Backend)
- ✅ FastAPI (Python)
- ✅ Express.js (Node.js)
- ✅ Django (Python)
- ✅ Flask (Python)
- ✅ NestJS (Node.js)

### 프론트엔드 (Frontend)
- ✅ React
- ✅ Next.js
- ✅ Streamlit
- ✅ Vue.js
- ✅ Static HTML

### 자동 감지 (Auto-Detection)
AI 분석기는 다음 항목들을 자동으로 감지합니다:
- 프레임워크 및 언어
- 포트 설정
- CPU/Memory 요구 사항
- 종속성 패키지(Dependencies)
- 헬스 체크 엔드포인트(Health check endpoints)

## 문서 (Documentation)

### 필수 가이드
1. **[배포 가이드 (Deployment Guide)](README_DEPLOYMENT_GUIDE.md)**: 전체 배포 단계별 안내
2. **[아키텍처 (Architecture)](deployment_system.md)**: 시스템 설계 및 v3 개선 사항
3. **[GitHub 시나리오](docs/GITHUB_REPOSITORY_SCENARIOS.md)**: 조직(Organization) vs 개인(Personal) 레포지토리
4. **[대시보드 배포](docs/DASHBOARD_DEPLOYMENT.md)**: 대시보드 전용 배포 가이드

### 빠른 링크 (Quick Links)
- **대시보드**: http://localhost:3000
- **프로덕션 ALB**: http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
- **GitHub v3**: https://github.com/Softbank-mango/deplight-platform-v3
- **AWS 리전**: ap-northeast-2 (서울)

## 시작하기 (Getting Started)

### 사전 요구 사항 (Prerequisites)
- Python 3.11+
- AWS CLI 구성 완료
- Docker (로컬 테스트용)
- GitHub 계정

### 로컬 개발 (Local Development)
```bash
# 1. 대시보드 세팅
cd mango/dashboard
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --host 0.0.0.0 --port 3000 --reload

# 2. 대시보드 접속
open http://localhost:3000

# 3. 앱 배포하기
# 대시보드 UI에 GitHub URL 입력
# 실시간 진행 상황 추적하기
# ALB URL을 통해 배포된 앱 접속
```

### 프로덕션 배포 (Production Deployment)
다음 내용을 확인하려면 [DASHBOARD_DEPLOYMENT.md](docs/DASHBOARD_DEPLOYMENT.md)를 참고하세요:
- GitHub Actions 배포
- AWS 인프라 설정
- Terraform 구성
- 트러블슈팅

## 주요 기능 (Features)

### 대시보드 기능
- 🎨 **모던 UI**: Glassmorphism 다크 테마
- 📊 **실시간 추적**: 8단계 배포 진행 상황 시각화
- 🚀 **빠른 작업**: URL 복사, 헬스 체크, 앱 실행
- 📋 **서비스 카드**: 상세 배포 정보 제공
- 🔄 **자동 새로고침**: 실시간 상태 업데이트

### 배포 기능
- ⚡ **초고속**: 7초 만에 완료되는 재배포
- 🧠 **AI 기반**: 프레임워크 자동 감지
- 🔒 **무중단(Zero-downtime)**: Circuit Breaker 배포
- 🔄 **자동 롤백**: 30초 내 복구
- 📦 **스마트 캐싱**: DynamoDB + Docker 레이어
- 🏗️ **오토 스케일링**: 부하에 따라 2-4개 태스크 자동 조절

## 기여하기 (Contributing)
기여는 언제나 환영합니다! 가이드라인은 [CONTRIBUTING.md](CONTRIBUTING.md)를 참고해 주세요.

## 라이선스 (License)
MIT License - 자세한 내용은 [LICENSE](LICENSE)를 참고하세요.

## 지원 (Support)
- **이슈 (Issues)**: https://github.com/Softbank-mango/deplight-platform-v3/issues
- **문서 (Documentation)**: `/docs` 디렉토리 참고
- **이메일**: support@deplight.com

---

**Built with ❤️ by the Softbank Mango Team**

*v3 - Making deployment delightful, one commit at a time* 🚀
