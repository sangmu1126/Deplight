# 🏗️ 배포 아키텍처 (Deployment Architecture) - 배포된 서비스는 어디에?

## 📍 **배포된 서비스의 실제 위치**

사용자가 GitHub 저장소를 플랫폼을 통해 배포하면, 다음과 같은 AWS 인프라 위에 서비스가 배포됩니다:

```text
[사용자의 GitHub Repo]
        ↓
   [Deplight 플랫폼]
        ↓
   ╔═══════════════════════════════════════════╗
   ║  AWS 인프라 (ap-northeast-2, 서울)        ║
   ╠═══════════════════════════════════════════╣
   ║                                           ║
   ║  ┌─────────────────────────────────────┐  ║
   ║  │  애플리케이션 로드 밸런서 (ALB)     │  ║
   ║  │  Public DNS:                        │  ║
   ║  │  delightful-deploy-alb-796875577     │  ║
   ║  │  .ap-northeast-2.elb.amazonaws.com  │  ║
   ║  └─────────────────────────────────────┘  ║
   ║              ↓                            ║
   ║  ┌─────────────────────────────────────┐  ║
   ║  │  ECS Fargate 클러스터               │  ║
   ║  │  • Cluster: delightful-deploy-      │  ║
   ║  │             cluster                 │  ║
   ║  │  • Service: delightful-deploy-      │  ║
   ║  │             service                 │  ║
   ║  │  • Tasks: 2-4개의 컨테이너 실행 중  │  ║
   ║  └─────────────────────────────────────┘  ║
   ║              ↓                            ║
   ║  ┌─────────────────────────────────────┐  ║
   ║  │  Docker 컨테이너 (사용자 앱)        │  ║
   ║  │  • ECR에서 이미지 가져옴            │  ║
   ║  │  • Port: 8000 (또는 AI가 감지한 포트)│ ║
   ║  │  • Auto-scaling: 2-4개 태스크 유지  │  ║
   ║  └─────────────────────────────────────┘  ║
   ║                                           ║
   ╚═══════════════════════════════════════════╝
```

---

## 🌐 **사용자가 접속하는 URL**

### **1. 메인 ALB URL** (공통 진입점)
```
http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com
```

### **2. 배포된 서비스별 접근**

현재 아키텍처에서는 **하나의 ALB가 하나의 ECS 서비스를 가리킵니다**.

#### **문제점**:
- 모든 사용자의 앱이 **같은 ECS 서비스**에 배포됩니다.
- 새로운 앱을 배포하면 이전 배포가 **덮어씌워집니다(교체됨)**.
- 여러 개의 다른 앱을 동시에 호스팅할 수 없습니다.

#### **해결 방안 (Multi-Service 다중 서비스 지원)**:

##### **Option 1: 경로 기반 라우팅 (Path-Based Routing)** (권장)
```
ALB 리스너 규칙 (Listener Rules):
- /app1/*  →  ECS Service: app1 으로 연결
- /app2/*  →  ECS Service: app2 로 연결
- /app3/*  →  ECS Service: app3 로 연결
```

**URL 예시**:
```
http://delightful-deploy-alb.../app1/
http://delightful-deploy-alb.../app2/health
http://delightful-deploy-alb.../app3/docs
```

##### **Option 2: 호스트 기반 라우팅 (Host-Based Routing)**
```
ALB 리스너 규칙 (Listener Rules):
- app1.deplight.com  →  ECS Service: app1 으로 연결
- app2.deplight.com  →  ECS Service: app2 로 연결
```

**URL 예시**:
```
http://app1.deplight.com/
http://app2.deplight.com/docs
```

##### **Option 3: 서비스마다 독립적인 ALB 생성 (Per-Service ALB)** (비용 급증)
```
각 배포마다 별도의 ALB 인스턴스를 생성:
- app1-alb-xxx.amazonaws.com
- app2-alb-xxx.amazonaws.com
```

---

## 🎯 **현재 구현 상태**

### **단일 서비스 아키텍처 (Single-Service Architecture)** ❌
```
현재 상태:
- 1개의 ALB
- 1개의 ECS Service
- 1개의 Target Group

발생하는 문제:
- 새 배포 시 이전 앱이 강제로 교체됨
- 여러 앱을 동시에 호스팅 불가
```

### **다중 서비스 아키텍처 필요 (Multi-Service Architecture)** ✅
```
향후 개선 방향:
- 1개의 ALB (여러 서비스가 공통으로 공유)
- N개의 ECS Services (배포된 앱마다 각각 1개씩)
- N개의 Target Groups
- Path 또는 Host 기반 라우팅 규칙 적용
```

---

## 🔧 **Multi-Service 지원 구현 계획**

### **Step 1: Terraform 코드 수정**

```hcl
# 앱마다 독립적인 ECS Service 생성
resource "aws_ecs_service" "app" {
  for_each = var.deployed_apps

  name    = "${var.app_name}-${each.key}"
  cluster = aws_ecs_cluster.main.id
  # ...
}

# 앱마다 독립적인 Target Group 생성
resource "aws_ecs_target_group" "app" {
  for_each = var.deployed_apps

  name = "${var.app_name}-${each.key}-tg"
  # ...
}

# Path 기반 라우팅 규칙 추가
resource "aws_lb_listener_rule" "app" {
  for_each = var.deployed_apps

  listener_arn = aws_lb_listener.http.arn
  priority     = each.value.priority

  condition {
    path_pattern {
      values = ["/${each.key}/*"]
    }
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app[each.key].arn
  }
}
```

### **Step 2: 대시보드에서 URL 매핑 처리**

```javascript
// 앱 이름에 따라 동적으로 URL 반환
function getServiceUrl(appName) {
    const ALB_DNS = 'delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com';
    return `http://${ALB_DNS}/${appName}/`;
}

// 예시:
getServiceUrl('fastapi-demo')
// 반환값 → http://delightful-deploy-alb.../fastapi-demo/
```

---

## 📊 **현재 아키텍처 vs 개선 후 아키텍처**

### **현재 (Single-Service)**
```
사용자가 "app1"을 배포함
  → 기존의 모든 것을 교체함
  → URL: http://ALB/ (app1 접속됨)

다른 사용자가 "app2"를 배포함
  → "app1"을 삭제하고 덮어씀 ❌
  → URL: http://ALB/ (이제 app2만 접속됨)
```

### **개선 후 (Multi-Service)**
```
사용자가 "app1"을 배포함
  → 새 ECS Service 'app1' 생성됨
  → URL: http://ALB/app1/

다른 사용자가 "app2"를 배포함
  → 새 ECS Service 'app2'가 병렬로 생성됨
  → URL: http://ALB/app2/

두 앱 모두 동시에 실행되고 접속 가능함! ✅
```

---

## 🎯 **대시보드(Dashboard) API에서 내려줄 응답 데이터 형식**

```javascript
{
  "services": [
    {
      "name": "fastapi-demo",
      "url": "http://delightful-deploy-alb.../fastapi-demo/",
      "status": "healthy",
      "endpoints": {
        "root": "http://ALB/fastapi-demo/",
        "health": "http://ALB/fastapi-demo/health",
        "docs": "http://ALB/fastapi-demo/docs"
      },
      "container": {
        "cluster": "delightful-deploy-cluster",
        "service": "delightful-deploy-fastapi-demo",
        "tasks": 2,
        "cpu": 256,
        "memory": 512
      },
      "deployedAt": "2025-11-07T12:34:56Z",
      "cost": "$0.004/deploy"
    }
  ]
}
```

---

## 🚀 **추천 구현 순서**

1. ✅ **현재**: Single-service (이미 구현 완료됨)
2. ⏳ **다음 단계**: Path-based routing (경로 기반 라우팅) 추가
3. 🔜 **향후 계획**: Custom domain (개별 커스텀 도메인) 지원

---

## 💡 **임시 해결책 (현재 테스트용 가이드)**

현재 버전은 **단일 서비스(Single-Service)**만 지원하므로 아래 사항에 유의해 주세요:

```
배포된 앱에 접속할 수 있는 공통 URL:
http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/

주의사항:
- 누군가 새 앱을 배포하면, 이전에 배포된 다른 앱은 강제로 지워지고 새 앱으로 교체됩니다.
- 프로덕션(실서비스)용으로는 적합하지 않으며, 현재는 데모/테스트 용도로만 사용하세요.
- 여러 팀이 사용할 수 있는 프로덕션 환경은 Multi-Service 기능이 구현된 후 사용 가능합니다.
```

---

## 📝 **요약 (Q&A)**

**Q: 내가 배포한 서비스는 물리적으로 어디에 떠 있나요?**
A: AWS의 ECS Fargate (서울 리전, ap-northeast-2) 위에서 컨테이너로 실행됩니다.

**Q: 접속 URL은 어떻게 되나요?**
A: http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/ 로 접속하면 됩니다.

**Q: 친구와 동시에 서로 다른 앱을 배포해서 둘 다 띄워둘 수 있나요?**
A: 현재 구조에서는 불가능합니다. Path-based 라우팅 업데이트가 선행되어야 합니다.

**Q: 이 모든 내역을 대시보드 UI에서 시각적으로 관리할 수 있나요?**
A: 네! 현재 대시보드 화면에 해당 기능이 연동되도록 구현 중입니다! 🚀
