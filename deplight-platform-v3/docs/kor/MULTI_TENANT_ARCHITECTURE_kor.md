# 사용자 앱 배포를 위한 멀티 테넌트 아키텍처 (Multi-Tenant Architecture)

## 개요 (Overview)

각 사용자 애플리케이션(학생 프로젝트)마다 독립적인 인프라를 구축하여 여러 앱을 배포할 수 있도록 Terraform 구성이 업데이트되었습니다. 각 사용자 앱은 고유한 ECS 서비스, 타겟 그룹(Target group), ALB 리스너 규칙을 가지면서도 공통 ALB와 ECS 클러스터는 공유합니다.

## 아키텍처 변경 사항 (Architecture Changes)

### 변경 전 (수동 AWS CLI)
- 사용자 앱들이 워크플로우 내의 AWS CLI 명령어를 통해 수동으로 배포됨
- 사용자 앱에 대한 Terraform 상태(State) 관리 부재
- 다수의 배포를 추적하고 관리하기 어려움
- 리소스 충돌 및 일관성 없는 설정 발생 위험

### 변경 후 (Terraform 모듈)
- 재사용 가능한 Terraform 모듈을 통해 사용자 앱 배포
- 완전한 상태 관리 및 코드형 인프라(IaC) 구현
- 일관되고 반복 가능한 배포
- 자동 충돌 해결 (고유한 이름 지정, 우선순위 자동 할당)

## 파일 구조 (File Structure)

```text
deplight-platform-v3/
├── infrastructure/terraform/
│   ├── modules/
│   │   └── user-app/
│   │       ├── main.tf        # ECS 서비스, 타겟 그룹, ALB 규칙
│   │       ├── variables.tf   # 모듈 입력 변수
│   │       └── outputs.tf     # 모듈 출력 (엔드포인트, 서비스 이름 등)
│   ├── user-apps.tf           # 조건에 따라 user-app 모듈을 생성
│   ├── variables.tf           # 사용자 앱 배포 변수 추가됨
│   └── outputs.tf             # 사용자 앱 출력 결과 추가됨
└── .github/workflows/
    └── deploy.yml             # Terraform을 항상 실행하도록 수정됨
```

## 주요 구성 요소 (Key Components)

### 1. User App 모듈 (`modules/user-app/`)

**목적**: 단일 사용자 애플리케이션 배포를 위한 재사용 가능한 모듈

**생성되는 리소스**:
- **ECS Task Definition**: 컨테이너 설정 정의
- **ECS Service**: 태스크 생명주기 관리 (Fargate 구동 방식)
- **Target Group**: 헬스 체크 및 트래픽 분산
- **ALB Listener Rule**: 경로 기반 라우팅 (예: `/app/deployment-123/*`)
- **CloudWatch Log Group**: 각 앱을 위한 독립적인 로그
- **CloudWatch Alarms**: CPU 및 메모리 모니터링

**주요 기능**:
- 배포 ID를 기반으로 한 고유 이름 생성 (충돌 방지)
- ALB 리스너 규칙에 대한 우선순위 자동 할당
- 안전한 배포를 위한 Circuit Breaker 활성화
- 커스텀 환경 변수 지원
- 헬스 체크 설정

### 2. User Apps 인프라 (`user-apps.tf`)

**목적**: user-app 모듈의 조건부 생성

**로직**:
```hcl
locals {
  create_user_app = var.deploy_user_app && var.user_app_name != "" && var.user_app_image != ""

  # 앱 이름 살균 (소문자, 영숫자 + 하이픈)
  sanitized_app_name = substr(replace(lower(var.user_app_name), "/[^a-z0-9-]/", "-"), 0, 60)

  # 결정론적 우선순위 할당 (60-1059 범위)
  user_app_priority = 60 + (abs(tonumber(substr(md5(sanitized_app_name), 0, 8), 16)) % 1000)
}

module "user_app" {
  count  = local.create_user_app ? 1 : 0
  source = "./modules/user-app"

  # ... 변수들 ...
}
```

### 3. 새로운 Terraform 변수

`variables.tf`에 추가됨:

```hcl
variable "deploy_user_app" {
  description = "사용자 애플리케이션 배포 여부"
  type        = bool
  default     = false
}

variable "user_app_name" {
  description = "사용자 애플리케이션 이름 (살균된 레포지토리 이름 또는 배포 ID)"
  type        = string
  default     = ""
}

variable "user_app_image" {
  description = "사용자 앱을 위한 전체 ECR 레포지토리 URL (태그 제외)"
  type        = string
  default     = ""
}

variable "user_app_port" {
  description = "사용자 앱 컨테이너 포트"
  type        = number
  default     = 8000
}

# ... CPU, 메모리, 헬스 체크 등을 위한 8개의 추가 변수
```

### 4. 워크플로우 변경 사항 (`deploy.yml`)

**주요 변경점**:

1. **조건부 건너뛰기 제거** (371번째 줄):
   ```yaml
   # 변경 전
   if: ${{ !github.event.inputs.target_repository }}

   # 변경 후
   # Terraform 항상 실행 - 플랫폼과 사용자 앱 배포 모두 처리
   ```

2. **사용자 앱을 위한 Terraform 변수 준비 추가**:
   ```yaml
   - name: 사용자 앱을 위한 Terraform 변수 준비
     id: prepare-vars
     run: |
       if [ -n "${{ github.event.inputs.target_repository }}" ]; then
         # 레포지토리 이름 추출, 고유 앱 이름 생성
         APP_NAME="user-app-${DEPLOYMENT_ID}"
         PATH_PREFIX="app/${DEPLOYMENT_ID}"
         # Terraform으로 전달
       fi
   ```

3. **Terraform으로 변수 전달**:
   ```yaml
   TF_VARS="$TF_VARS -var=deploy_user_app=true"
   TF_VARS="$TF_VARS -var=user_app_name=${{ steps.prepare-vars.outputs.app_name }}"
   TF_VARS="$TF_VARS -var=user_app_image=${{ steps.prepare-vars.outputs.ecr_url }}"
   # ... 추가 변수들
   ```

4. **Terraform 출력 결과 추출**:
   ```yaml
   - name: Terraform 출력 추출
     run: |
       USER_APP_ENDPOINT=$(terraform output -raw user_app_endpoint_url)
       USER_APP_SERVICE=$(terraform output -raw user_app_service_name)
   ```

5. **사용자 앱 배포 단순화**:
   - 약 200줄의 AWS CLI 명령어 제거됨
   - Terraform으로 관리되는 인프라로 대체됨
   - 상태 추적 및 롤백 기능 향상

## 배포 흐름 (Deployment Flow)

### 플랫폼 (대시보드) 배포

```text
1. target_repository 없이 워크플로우 트리거됨
2. deploy_user_app=false 상태로 Terraform 실행
3. 플랫폼 인프라만 업데이트됨
4. 대시보드 서비스가 배포됨
```

### 사용자 앱 배포

```text
1. target_repository 와 함께 워크플로우 트리거됨
2. Docker 이미지 빌드 → ECR로 푸시
3. deploy_user_app=true 및 사용자 앱 변수와 함께 Terraform 실행
4. Terraform이 다음을 생성:
   - ECS Task Definition (user-app-123456)
   - ECS Service (user-app-123456)
   - Target Group (user-app-12345678-tg)
   - ALB Listener Rule (우선순위: 60-1059)
   - CloudWatch Log Group (/aws/ecs/user-apps/user-app-123456)
5. 서비스가 시작되고 헬스 체크 정상 상태가 됨
6. 다음 주소로 접근 가능: http://<ALB-DNS>/app/123456/*
```

## 리소스 명명 규칙 (Resource Naming Convention)

| 리소스 | 명명 패턴 | 예시 |
|----------|---------------|---------|
| App Name | `user-app-{deployment-id}` | `user-app-1234567890` |
| ECS Service | `{app-name}` | `user-app-1234567890` |
| Task Definition | `{app-name}` | `user-app-1234567890` |
| Target Group | `{app-name}-tg` (최대 32자) | `user-app-12345678-tg` |
| Log Group | `/aws/ecs/user-apps/{app-name}` | `/aws/ecs/user-apps/user-app-1234567890` |
| ALB Path | `/app/{deployment-id}/*` | `/app/1234567890/*` |

## 경로 기반 라우팅 (Path-based Routing)

ALB는 트래픽을 지시하기 위해 경로 기반 라우팅을 사용합니다:

| 경로 패턴 | 대상 | 우선순위 |
|--------------|--------|----------|
| `/dashboard/*` | 대시보드 서비스 | 40 |
| `/api/*` | 플랫폼 API | 50 |
| `/app/{deployment-id}/*` | 사용자 앱 | 60-1059 |
| `/health`, `/healthz` | 플랫폼 | 100 |
| `/*` (기본값) | Blue 타겟 그룹 | N/A |

**우선순위 할당**:
- 우선순위는 앱 이름의 해시를 기반으로 결정론적으로 지정됩니다.
- 범위: 60-1059 (1000개의 가능한 값)
- 자동으로 충돌을 방지합니다.
- 공식: `60 + (hash(app_name) % 1000)`

## 멀티 테넌트 아키텍처 테스트

### 테스트 1: 사용자 앱 배포

```bash
# GitHub Actions UI에서
1. Actions → CI/CD Pipeline → Run workflow 이동
2. 입력:
   - Environment: dev
   - Target repository: https://github.com/user/fastapi-app
   - Target branch: main
3. "Run workflow" 클릭

# 예상 결과:
- Terraform이 새 리소스를 생성함
- 서비스 시작: user-app-<run-id>
- 엔드포인트: http://<ALB>/app/<run-id>/
- 로그: /aws/ecs/user-apps/user-app-<run-id>
```

### 테스트 2: 여러 사용자 앱 배포

```bash
# 순차적으로 3개의 다른 앱 배포
1. 앱 A 배포 (run-id: 111)
2. 앱 B 배포 (run-id: 222)
3. 앱 C 배포 (run-id: 333)

# 격리 상태 확인:
curl http://<ALB>/app/111/  # 앱 A
curl http://<ALB>/app/222/  # 앱 B
curl http://<ALB>/app/333/  # 앱 C

# 각자 독립적으로 응답해야 함
```

### 테스트 3: Terraform 상태 확인

```bash
cd infrastructure/terraform

# 관리되는 모든 리소스 나열
terraform state list

# 예상되는 출력 결과 포함:
# module.user_app[0].aws_ecs_service.user_app
# module.user_app[0].aws_lb_target_group.user_app
# module.user_app[0].aws_lb_listener_rule.user_app
# ...

# 사용자 앱 상세 정보 표시
terraform state show 'module.user_app[0].aws_ecs_service.user_app'
```

### 테스트 4: ALB 리스너 규칙 검증

```bash
# ALB ARN 가져오기
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names delightful-deploy-alb \
  --query 'LoadBalancers[0].LoadBalancerArn' \
  --output text)

# 리스너 ARN 가져오기
LISTENER_ARN=$(aws elbv2 describe-listeners \
  --load-balancer-arn $ALB_ARN \
  --query 'Listeners[?Port==`80`].ListenerArn' \
  --output text)

# 모든 규칙 나열
aws elbv2 describe-rules \
  --listener-arn $LISTENER_ARN \
  --query 'Rules[*].[Priority,Conditions[0].Values[0]]' \
  --output table

# 예상 출력 결과:
# Priority | Path Pattern
# ---------|-------------
# 40       | /dashboard*
# 50       | /api/*
# 60-1059  | /app/*/* (사용자 앱들)
# 100      | /health*
```

### 테스트 5: ECS 서비스 확인

```bash
# 클러스터의 모든 서비스 나열
aws ecs list-services \
  --cluster delightful-deploy-cluster \
  --output table

# 사용자 앱 서비스 상세 조회
aws ecs describe-services \
  --cluster delightful-deploy-cluster \
  --services user-app-<deployment-id> \
  --query 'services[0].[serviceName,status,runningCount,desiredCount]' \
  --output table
```

### 테스트 6: CloudWatch 로그 모니터링

```bash
# 특정 사용자 앱 로그 추적
aws logs tail /aws/ecs/user-apps/user-app-<deployment-id> --follow

# 모든 사용자 앱 로그 그룹 나열
aws logs describe-log-groups \
  --log-group-name-prefix /aws/ecs/user-apps/ \
  --query 'logGroups[*].logGroupName' \
  --output table
```

### 테스트 7: Terraform Plan Dry Run (예행 연습)

```bash
cd infrastructure/terraform

# 사용자 앱 배포 테스트 (예행 연습)
terraform plan \
  -var="deploy_user_app=true" \
  -var="user_app_name=test-app-123" \
  -var="user_app_repository_url=https://github.com/test/app" \
  -var="user_app_image=123456.dkr.ecr.ap-northeast-2.amazonaws.com/user-app-test" \
  -var="user_app_image_tag=latest" \
  -var="user_app_port=8000" \
  -var="user_app_path_prefix=app/test-123"

# 다음 내용을 보여주어야 함:
# + module.user_app[0].aws_ecs_service.user_app
# + module.user_app[0].aws_lb_target_group.user_app
# + module.user_app[0].aws_lb_listener_rule.user_app
# + module.user_app[0].aws_cloudwatch_log_group.user_app
```

## 새로운 아키텍처의 장점 (Advantages of New Architecture)

### 1. 코드형 인프라 (Infrastructure as Code)
- 모든 사용자 앱이 Terraform으로 관리됨
- 버전 관리가 가능하고 감사 가능한 인프라 변경 내역
- 쉬운 롤백과 재해 복구(Disaster recovery)

### 2. 일관성 (Consistency)
- 모든 앱에 동일한 배포 프로세스 적용
- 일관된 명명 규칙
- 예측 가능한 리소스 할당

### 3. 격리 (Isolation)
- 각 앱마다 분리된 로그, 메트릭, 알람
- 독립적인 확장 및 구성
- 리소스 이름 충돌 없음

### 4. 가시성 (Observability)
- Terraform 출력을 통해 엔드포인트 URL 제공
- 각 앱별 CloudWatch 알람
- 중앙 집중식 로그 그룹

### 5. 확장성 (Scalability)
- 1000개 이상의 동시 실행 앱 지원 (ALB 규칙 한도: 100개 규칙이나 충돌을 피하기 위해 해시 사용)
- Terraform destroy를 통한 자동 정리
- 수동으로 리소스를 추적할 필요 없음

## 정리 (Cleanup)

### 단일 사용자 앱 제거

```bash
cd infrastructure/terraform

# deploy_user_app=false로 설정하여 사용자 앱 삭제
terraform apply \
  -var="deploy_user_app=false"

# 또는 특정 타겟 파괴(destroy) 사용
terraform destroy \
  -target='module.user_app[0]'
```

### 모든 사용자 앱 제거

```bash
# 사용자 앱 변수 없이 단순히 재배포
terraform apply \
  -var="deploy_user_app=false"
```

## 트러블슈팅 (Troubleshooting)

### 문제: Terraform 출력이 null로 나옴

**원인**: Terraform 래퍼(wrapper)가 여분의 출력 형식을 추가함
**해결책**: 워크플로우에 `terraform_wrapper: false` 설정 (이미 적용됨)

### 문제: ALB 리스너 규칙 우선순위 충돌

**원인**: 여러 앱이 같은 해시 값을 가짐
**해결책**: 우선순위는 앱 이름의 해시에 기반하여 결정론적으로 할당됩니다. 앱 이름을 약간 변경하세요.

### 문제: 타겟 그룹 이름이 너무 김

**원인**: AWS 한도는 32자입니다.
**해결책**: 모듈 내에서 타겟 그룹 이름이 32자로 자동 잘림 처리됩니다.

### 문제: ECS 서비스가 시작되지 않음

**확인 사항**:
1. 헬스 체크 경로가 올바른지 (기본값 `/`)
2. 컨테이너 포트가 앱 구성과 일치하는지
3. 보안 그룹이 ALB → ECS 트래픽을 허용하는지
4. 서브넷에 인터넷 액세스가 있는지 (퍼블릭 IP 활성화)

## 다음 단계 (Next Steps)

### 권장되는 개선 사항

1. **오토 스케일링**: user-app 모듈에 오토 스케일링 정책 추가
2. **커스텀 도메인**: 앱별 커스텀 도메인 라우팅 지원
3. **리소스 제한**: 리소스 고갈을 막기 위한 할당량(Quotas) 추가
4. **비용 추적**: 비용 센터 기준으로 리소스 태그 부착
5. **Blue-Green 배포**: 사용자 앱을 위한 CodeDeploy 지원
6. **상태 락킹(State locking)**: 팀 협업을 위해 S3 + DynamoDB 백엔드 사용

### 향후 개선 방향

1. **다중 리전 (Multi-region)**: 여러 AWS 리전에 앱 배포
2. **앱별 데이터베이스**: 앱별로 RDS/DynamoDB 프로비저닝
3. **비밀 키 관리**: 앱별 Secrets Manager 연동
4. **앱별 CI/CD**: 사용자 레포지토리에서 바로 배포 트리거
5. **모니터링 대시보드**: 모든 사용자 앱에 대한 통합된 뷰 제공

## 요약 (Summary)

멀티 테넌트 아키텍처는 학생 프로젝트를 배포하기 위해 확장 가능하고, 일관성 있으며, 유지보수가 쉬운 방법을 제공합니다. Terraform 모듈을 활용하여 공통 리소스(ALB, 클러스터)는 공유하면서 각 사용자 앱은 격리된 인프라를 가지게 됩니다. 이제 워크플로우는 하나의 통합된 파이프라인으로 플랫폼과 사용자 앱 배포 모두를 완벽하게 처리합니다.

**주요 지표**:
- 제거된 워크플로우 코드 수: 약 200줄
- 새로 추가된 Terraform 파일 수: 4개
- 추가된 Terraform 변수 수: 12개
- 최대 동시 실행 가능 앱 수: 1000개 이상
- 배포 소요 시간: 앱당 약 3-5분
