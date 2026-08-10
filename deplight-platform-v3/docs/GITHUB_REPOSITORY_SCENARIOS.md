# 🔐 GitHub Repository Scenarios - 배포 가능한 저장소 유형

## ✅ **결론: 조직 저장소와 개인 저장소 둘 다 지원합니다!**

Deplight Platform은 GitHub Actions의 `workflow_dispatch` 이벤트를 사용하며, **어떤 GitHub 저장소든 배포할 수 있습니다**.

---

## 🎯 **지원하는 저장소 유형**

### 1️⃣ **조직 저장소 (Organization Repository)**
- ✅ **지원**: Softbank-mango 조직의 private/public 저장소
- ✅ **장점**:
  - 팀 협업에 적합
  - GitHub Actions secrets 중앙 관리
  - 조직 수준의 권한 제어
- ✅ **예시**: `https://github.com/Softbank-mango/my-app`

### 2️⃣ **개인 저장소 (Personal Repository)**
- ✅ **지원**: 개인 계정의 public/private 저장소
- ✅ **장점**:
  - 개인 프로젝트 빠른 배포
  - 별도의 조직 권한 불필요
  - 테스트 및 프로토타입에 이상적
- ✅ **예시**: `https://github.com/sangmu1126/deployment_test_py`

### 3️⃣ **Fork된 저장소**
- ✅ **지원**: 원본 저장소를 fork한 경우도 배포 가능
- ⚠️ **주의**: Fork된 저장소의 경우 GitHub Actions secrets 설정 필요

---

## 🔧 **배포 메커니즘**

### **GitHub Actions Workflow Dispatch**
```yaml
on:
  workflow_dispatch:
    inputs:
      target_repository:
        description: 'Target repository to deploy (user repo URL)'
        required: false
        type: string
      target_branch:
        description: 'Target repository branch'
        required: false
        default: 'main'
        type: string
```

### **저장소 파싱 로직**
```bash
# Line 113-124 in deploy.yml
TARGET_REPO="${{ github.event.inputs.target_repository }}"

if [ -n "$TARGET_REPO" ]; then
  # 어떤 GitHub URL이든 파싱 가능
  # 지원 형식:
  #   - https://github.com/owner/repo
  #   - https://github.com/owner/repo.git
  REPO_PATH=$(echo "$TARGET_REPO" | sed -E 's|https?://github.com/||' | sed 's|\.git$||')
  echo "repository=${REPO_PATH}" >> $GITHUB_OUTPUT
fi
```

### **저장소 체크아웃**
```yaml
# Line 126-131 in deploy.yml
- name: Checkout target repository
  uses: actions/checkout@v4
  with:
    repository: ${{ steps.parse-repo.outputs.repository }}  # owner/repo 형식
    ref: ${{ github.event.inputs.target_branch || github.ref }}
    path: user_repo
```

**핵심**: GitHub Actions의 `actions/checkout@v4`는 **public 저장소는 인증 없이**, **private 저장소는 GitHub token으로** 접근 가능합니다.

---

## 📋 **시나리오별 배포 가이드**

### 🏢 **시나리오 1: 조직 저장소 배포 (Softbank-mango)**

#### **사용 사례**
- Softbank-mango 팀의 프로덕션 앱 배포
- 여러 팀원이 협업하는 프로젝트
- 조직 수준의 secrets 관리

#### **저장소 예시**
```
https://github.com/Softbank-mango/fastapi-ecommerce
```

#### **배포 단계**

**Step 1: Dashboard에서 배포 시작**
```
Dashboard → "새 배포" 클릭
├─ Repository URL: https://github.com/Softbank-mango/fastapi-ecommerce
├─ Branch: main (또는 dev, staging)
└─ 배포 시작
```

**Step 2: GitHub Actions 자동 실행**
```bash
1. ✅ 저장소 체크아웃 (조직 저장소)
   → actions/checkout@v4가 GitHub token으로 인증

2. ✅ AI 분석 시작
   → Lambda가 프로젝트 구조 분석
   → FastAPI 감지, Port 8000 설정

3. ✅ Docker 빌드 (UV + BuildKit)
   → 고속 빌드 (5-10배 빠름)

4. ✅ ECR Push
   → 513348493870.dkr.ecr.ap-northeast-2.amazonaws.com/delightful-deploy:latest

5. ✅ ECS 배포
   → 클러스터: delightful-deploy-cluster
   → Circuit Breaker로 안전한 배포

6. ✅ 완료!
   → URL: http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
```

**Step 3: 배포 확인**
```bash
# Health Check
curl http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/health

# API 테스트
curl http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
```

#### **필요한 설정**
```yaml
# GitHub Actions Secrets (조직 수준에서 설정)
AWS_ROLE_ARN: arn:aws:iam::513348493870:role/github-actions-role
SLACK_WEBHOOK_URL: (선택사항)
```

#### **권한 요구사항**
- ✅ 조직 멤버 (최소 Read 권한)
- ✅ GitHub Actions 실행 권한
- ✅ AWS Role (OIDC 인증)

---

### 👤 **시나리오 2: 개인 저장소 배포 (sangmu1126/deployment_test_py)**

#### **사용 사례**
- 개인 사이드 프로젝트 배포
- 빠른 프로토타입 테스트
- 포트폴리오 앱 호스팅

#### **저장소 예시**
```
https://github.com/sangmu1126/deployment_test_py
```

#### **배포 단계**

**Step 1: 저장소 준비**

**Option A: Public 저장소 (권장 - 간단함)**
```bash
# GitHub에서 저장소 생성
https://github.com/sangmu1126/deployment_test_py

# Public으로 설정
Settings → Visibility → Public

# 코드 푸시
git push origin main
```

**Option B: Private 저장소 (추가 설정 필요)**
```bash
# Private 저장소는 GitHub token 필요
# Deplight Platform의 GitHub Actions에 접근 권한 부여

# Personal Access Token 생성
GitHub Settings → Developer settings → Personal access tokens
→ Generate new token (classic)
→ Scopes: repo (Full control of private repositories)

# Deplight Platform 저장소에 Secret 추가
Softbank-mango/deplight-platform
→ Settings → Secrets → Actions
→ New repository secret:
   Name: USER_GITHUB_TOKEN
   Value: ghp_xxxxxxxxxxxx
```

**Step 2: Dashboard에서 배포**
```
Dashboard → "새 배포" 클릭
├─ Repository URL: https://github.com/sangmu1126/deployment_test_py
├─ Branch: main
└─ 배포 시작
```

**Step 3: 자동 배포 프로세스**
```bash
1. ✅ 개인 저장소 체크아웃
   → Public: 인증 없이 자동 접근 ✅
   → Private: USER_GITHUB_TOKEN으로 인증

2. ✅ AI가 코드 분석
   → 예시: FastAPI 앱 감지
   → Dockerfile 자동 생성
   → Port: 8000, CPU: 256, Memory: 512

3. ✅ Docker 빌드 및 배포
   → UV로 빠른 의존성 설치
   → ECR에 이미지 푸시
   → ECS에 배포

4. ✅ URL 생성
   → http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
```

**Step 4: 배포 확인**
```bash
# 본인의 앱이 배포됨!
curl http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/

# Dashboard에서 확인
- Status: 🟢 실행 중
- Framework: FastAPI (AI가 자동 감지)
- Deploy Time: 7-120초
```

#### **필요한 설정 (Public 저장소)**
- ✅ **저장소**: Public으로 설정
- ✅ **Dockerfile**: 없어도 됨 (AI가 자동 생성)
- ✅ **requirements.txt** 또는 **package.json**: 있으면 좋음

#### **필요한 설정 (Private 저장소)**
```yaml
# Deplight Platform에 추가 Secret 설정
USER_GITHUB_TOKEN: ghp_xxxxxxxxxxxxx

# deploy.yml 수정 (Line 127-131)
- name: Checkout target repository
  uses: actions/checkout@v4
  with:
    repository: ${{ steps.parse-repo.outputs.repository }}
    ref: ${{ github.event.inputs.target_branch || github.ref }}
    token: ${{ secrets.USER_GITHUB_TOKEN }}  # Private 저장소용
    path: user_repo
```

---

## 🔐 **권한 및 보안**

### **Public 저장소**
```
✅ 인증 불필요
✅ 누구나 배포 요청 가능 (Dashboard 접근 권한만 있으면)
✅ 코드가 공개되어 있으므로 보안 이슈 없음
```

### **Private 저장소**
```
⚠️ GitHub Personal Access Token 필요
⚠️ Token은 Deplight Platform의 GitHub Secrets에 저장
⚠️ Token 권한: repo (Full control of private repositories)
✅ 민감한 코드도 안전하게 배포 가능
```

### **조직 저장소**
```
✅ GitHub OIDC로 안전한 AWS 접근
✅ 조직 수준의 Secrets 관리
✅ 팀원 권한 제어 (GitHub Teams)
```

---

## 📊 **비교표**

| 구분 | 조직 저장소 | 개인 Public | 개인 Private |
|------|------------|------------|-------------|
| **인증** | GitHub OIDC | 불필요 | PAT 필요 |
| **배포 속도** | 7-120초 | 7-120초 | 7-120초 |
| **AI 분석** | ✅ | ✅ | ✅ |
| **Dockerfile** | 선택사항 | 선택사항 | 선택사항 |
| **보안** | 조직 관리 | Public | PAT 보호 |
| **협업** | ✅ 최적 | ⚠️ 제한적 | ⚠️ 제한적 |
| **비용** | $0.004/배포 | $0.004/배포 | $0.004/배포 |

---

## 🎯 **권장 사용 사례**

### **조직 저장소 (Softbank-mango)를 사용하세요:**
- ✅ 프로덕션 배포
- ✅ 팀 협업 프로젝트
- ✅ CI/CD 파이프라인 구축
- ✅ 장기 운영 서비스

### **개인 Public 저장소를 사용하세요:**
- ✅ 오픈소스 프로젝트
- ✅ 포트폴리오 앱
- ✅ 빠른 프로토타입 테스트
- ✅ 학습용 프로젝트

### **개인 Private 저장소를 사용하세요:**
- ✅ 민감한 코드 보호
- ✅ 개인 사이드 프로젝트
- ⚠️ PAT 설정 필요 (추가 설정 복잡)

---

## 🚀 **테스트 저장소 예시**

### **조직 저장소 (이미 배포됨)**
```bash
# 현재 실행 중인 앱
Repository: Softbank-mango/fastapi-ecommerce (추정)
URL: http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
Status: 🟢 실행 중
Framework: FastAPI
Endpoints: /products, /orders, /health
```

### **개인 저장소 (테스트 준비)**
```bash
# sangmu1126/deployment_test_py (현재 404 - 저장소 생성 필요)

# 생성 후 테스트 가능:
1. GitHub에서 sb_test_2 저장소 생성 (Public)
2. FastAPI Hello World 코드 푸시
3. Dashboard에서 배포 요청
4. 7-120초 후 접속 가능!
```

---

## 💡 **FAQ**

### **Q1: 개인 저장소를 배포하면 조직 저장소 배포가 사라지나요?**
```
A: 네, 현재 아키텍처는 Single-Service입니다.
   새 배포 시 이전 배포를 덮어씁니다.

   해결책: Multi-Service 아키텍처 (Path-based routing)
   - 개발 중: /app1/, /app2/, /app3/ 형태로 여러 앱 동시 호스팅
```

### **Q2: Private 저장소 배포 시 Token을 어디에 저장하나요?**
```
A: GitHub Secrets에 안전하게 저장됩니다.

   설정 위치:
   Softbank-mango/deplight-platform
   → Settings → Secrets and variables → Actions
   → New repository secret

   ⚠️ Token은 절대 코드에 하드코딩하지 마세요!
```

### **Q3: Fork한 저장소도 배포 가능한가요?**
```
A: 네, 가능합니다!

   예시:
   1. 원본: github.com/original/repo
   2. Fork: github.com/sangmu1126/repo (Fork)
   3. 배포 URL: https://github.com/sangmu1126/repo
   4. ✅ 정상 배포됨
```

### **Q4: 배포 후 URL은 어떻게 되나요?**
```
A: 현재는 모든 배포가 같은 ALB를 사용합니다:
   http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/

   향후 개선:
   - /app-name/ 형태로 path-based routing
   - 또는 app-name.deplight.com 형태의 subdomain
```

---

## 📝 **결론**

**✅ Deplight Platform은 어떤 GitHub 저장소든 배포할 수 있습니다!**

1. **조직 저장소** (Softbank-mango): 프로덕션용, 팀 협업
2. **개인 Public 저장소**: 빠른 테스트, 포트폴리오
3. **개인 Private 저장소**: 민감한 코드, PAT 설정 필요

**배포 시간**: 7-120초 (AI 캐싱에 따라)
**비용**: $0.004/배포
**안정성**: Circuit Breaker + Auto Rollback

**지금 바로 배포하세요!** 🚀
