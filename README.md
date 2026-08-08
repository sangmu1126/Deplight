# 🚀 Deplight Monorepo

> **어떤 GitHub 레포지토리든 7~120초 안에 AWS에 배포하는 AI 기반 초고속 서버리스 배포 플랫폼**

이 저장소(Repository)는 **Deplight** 플랫폼의 전체 아키텍처와 구성요소를 포함하는 **모노레포(Monorepo)**입니다. 개별적으로 관리되던 4개의 핵심 프로젝트가 하나의 통합된 환경에서 관리됩니다.

---

## 📂 프로젝트 구조 (Monorepo Structure)

이 레포지토리는 다음과 같이 4개의 독립된 하위 프로젝트로 구성되어 있습니다.

### 1. `deplight-platform-v3/` (최신 코어 엔진) ⭐
Deplight 플랫폼의 최신(v3) 핵심 로직이 담긴 디렉토리입니다.
- **AI Analyzer (GPT-5)**: 사용자의 코드를 자동으로 분석하여 프레임워크, 포트, 자원을 결정합니다.
- **초고속 빌드 (UV + BuildKit)**: 기존 대비 최대 10배 빠른 컨테이너 빌드를 수행합니다.
- **안전한 배포 (Circuit Breaker)**: 배포 실패 시 30초 내에 자동으로 롤백하여 무중단(Zero-Downtime)을 보장합니다.
- **스마트 캐싱 (DynamoDB)**: 동일한 저장소를 재배포할 경우 60초의 AI 분석 시간을 0.5초로 극한 단축합니다.
- 💡 *상세 가이드: `deplight-platform-v3/docs/kor/` 폴더 참조*

### 2. `deplight-infra/`
플랫폼을 지탱하는 **AWS 인프라(IaC)** 코드 모음입니다.
- **Terraform 기반**: VPC, ECS Fargate, ALB, DynamoDB, S3 등 AWS 리소스의 자동 프로비저닝을 담당합니다.
- **멀티 테넌트 확장성**: 수많은 사용자의 앱을 안정적으로 수용할 수 있도록 설계된 인프라 아키텍처입니다.

### 3. `deplight-platform/`
기존 버전의 플랫폼 코어 저장소입니다.
- v3로 넘어가기 전의 레거시 구조 및 백엔드/프론트엔드 기초 설계가 포함되어 있습니다.

### 4. `application/`
플랫폼 위에서 실제로 구동되거나 테스트하기 위한 **유저 애플리케이션(User Application)** 샘플 코드 묶음입니다.
- 사용자가 Deplight를 이용해 배포할 때 참고할 수 있는 템플릿 역할을 합니다.

---

## ⚡ 주요 성능 지표 (v3 기준)

| 구분 | 초기 기획 (v1) | 최적화 단계 (v2) | 최종 완성본 (v3) |
| --- | --- | --- | --- |
| **배포 시간 (첫 배포)** | 15분 | 4분 | **8.6초** |
| **배포 시간 (재배포)** | 15분 | 3분 | **7.1초** (캐시 적중) |
| **AI 분석 속도** | 180초 | 60초 | **0.5초** |
| **도커 빌드 패키지** | pip (60초) | BuildKit (25초) | **UV (0.8초)** |
| **비용 (배포 1회당)** | 약 19원 ($0.014) | 약 9원 ($0.007) | **약 6원 ($0.004)** |

---

## 🛠 기술 스택 (Tech Stack)

### **Infrastructure & DevOps**
- **AWS**: ECS Fargate, Application Load Balancer, Lambda, DynamoDB, S3, ECR
- **IaC**: Terraform (Local / Remote State 혼용)
- **CI/CD**: GitHub Actions (OIDC 인증 기반)

### **Backend & Core Logic**
- **Language**: Python 3.11+
- **Framework**: FastAPI (대시보드 API)
- **AI / LLM**: OpenAI GPT-5 (코드 분석기)
- **Package Manager**: UV (초고속 의존성 설치)

### **Frontend (Dashboard)**
- **UI/UX**: Glassmorphism 기반 다크 테마 디자인
- **웹 서버**: Uvicorn

---

## 📖 시작하기 (Getting Started)

이 모노레포를 복제(Clone)한 후 각 디렉토리로 이동하여 개발 및 배포를 진행할 수 있습니다.

```bash
# 1. 레포지토리 클론
git clone https://github.com/sangmu1126/Deplight.git
cd Deplight

# 2. 최신 플랫폼(v3) 대시보드 로컬 실행 예시
cd deplight-platform-v3/dashboard
source venv/bin/activate
uvicorn api.main:app --host 0.0.0.0 --port 3000 --reload
```

> **더 자세한 설정 및 배포 방법**은 `deplight-platform-v3/docs/kor/README_DEPLOYMENT_GUIDE_kor.md`를 참고해 주세요!

---

## 🔒 라이선스 (License)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
