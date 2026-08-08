# Deplight Platform

Deplight는 AWS ECS Fargate 기반의 서버리스 자동 배포 플랫폼입니다. 
이 레포지토리는 개별적으로 관리되던 4개의 하위 프로젝트를 하나로 통합한 모노레포(Monorepo)입니다.

## 프로젝트 구조

* **`deplight-platform-v3/`**: 플랫폼 핵심 엔진 (최신 버전)
  * LLM 기반의 프로젝트 자동 분석 및 인프라 스크립트 생성
  * Circuit Breaker 패턴을 적용한 무중단 롤링 배포 및 롤백
  * DynamoDB 캐싱 및 패키지 매니저(UV)를 통한 배포 속도 최적화
* **`deplight-infra/`**: 인프라 프로비저닝용 Terraform 코드 (VPC, ECS, ALB, Lambda 등)
* **`deplight-platform/`**: 이전 버전의 플랫폼 코어 레거시 코드
* **`application/`**: 플랫폼 상에서 구동을 테스트하기 위한 유저 애플리케이션 샘플 코드

## 시스템 요구사항
* Python 3.11 이상
* AWS 계정 및 연동 권한
* Terraform CLI

## 기술 스택
* **인프라**: AWS (ECS Fargate, ALB, Lambda, DynamoDB, S3, ECR), Terraform
* **백엔드**: Python, FastAPI
* **CI/CD**: GitHub Actions

## 시작하기 (로컬 대시보드)

```bash
git clone https://github.com/sangmu1126/Deplight.git
cd Deplight/deplight-platform-v3/dashboard

# 가상환경 활성화 및 실행
source venv/bin/activate
uvicorn api.main:app --host 0.0.0.0 --port 3000
```

> 💡 **참고**: 더 상세한 아키텍처 및 배포 설정 가이드는 `deplight-platform-v3/docs/kor/` 디렉토리 내의 문서를 참고해 주시기 바랍니다.
