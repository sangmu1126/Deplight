# 🔐 GitHub 레포지토리 시나리오 (GitHub Repository Scenarios) - 배포 가능한 저장소 유형

## ✅ **결론: 조직 저장소와 개인 저장소 둘 다 완벽하게 지원합니다!**

Deplight 플랫폼은 GitHub Actions의 `workflow_dispatch` 이벤트를 사용하여 파이프라인을 작동시키며, **기본적으로 어떤 GitHub 저장소의 코드든 가져와서 배포할 수 있습니다**.

---

## 🎯 **지원하는 저장소 유형**

### 1️⃣ **조직 저장소 (Organization Repository)**
- ✅ **지원 여부**: Softbank-mango 조직 하위의 private/public 저장소
- ✅ **장점**:
  - 팀 단위의 긴밀한 협업에 매우 적합
  - GitHub Actions의 Secrets(비밀 키)를 한 곳에서 중앙 관리 가능
  - 조직 수준의 강력한 권한 제어
- ✅ **URL 예시**: `https://github.com/Softbank-mango/my-app`

### 2️⃣ **개인 저장소 (Personal Repository)**
- ✅ **지원 여부**: 사용자 개인 계정에 속한 public/private 저장소
- ✅ **장점**:
  - 개인 토이 프로젝트나 사이드 프로젝트를 빠르게 배포 가능
  - 별도로 조직에 속하거나 권한을 얻을 필요가 없음
  - 테스트 및 프로토타입 용도로 이상적
- ✅ **URL 예시**: `https://github.com/sabill123/sb_test_2`

### 3️⃣ **Fork된 저장소**
- ✅ **지원 여부**: 원본 저장소를 개인이나 다른 조직으로 Fork한 코드도 배포 가능
- ⚠️ **주의사항**: Fork된 저장소의 코드를 돌릴 경우, 해당 저장소에 필요한 GitHub Actions secrets가 제대로 세팅되어 있어야 합니다.

---

## 🔧 **배포 메커니즘 (작동 원리)**

### **GitHub Actions 워크플로우 수동 트리거 (Workflow Dispatch)**
```yaml
on:
  workflow_dispatch:
    inputs:
      target_repository:
        description: '배포할 타겟 저장소 (사용자의 레포지토리 URL)'
        required: false
        type: string
      target_branch:
        description: '타겟 저장소의 브랜치'
        required: false
        default: 'main'
        type: string
```

### **저장소 파싱 로직**
```bash
# deploy.yml 의 Line 113-124
TARGET_REPO="${{ github.event.inputs.target_repository }}"

if [ -n "$TARGET_REPO" ]; then
  # 어떤 형태의 GitHub URL이 들어오든 파싱 가능함
  # 지원하는 입력 포맷 예시:
  #   - https://github.com/owner/repo
  #   - https://github.com/owner/repo.git
  REPO_PATH=$(echo "$TARGET_REPO" | sed -E 's|https?://github.com/||' | sed 's|\.git$||')
  echo "repository=${REPO_PATH}" >> $GITHUB_OUTPUT
fi
```

### **저장소 코드 복사 (Checkout)**
```yaml
# deploy.yml 의 Line 126-131
- name: 타겟 저장소 체크아웃
  uses: actions/checkout@v4
  with:
    repository: ${{ steps.parse-repo.outputs.repository }}  # owner/repo 포맷
    ref: ${{ github.event.inputs.target_branch || github.ref }}
    path: user_repo
```

**핵심 원리**: GitHub Actions의 `actions/checkout@v4` 플러그인은 **Public 저장소의 코드는 아무 인증 없이 누구나 가져올 수 있고**, **Private 저장소의 코드는 유효한 GitHub token이 있어야만** 가져올 수 있습니다.

---

## 📋 **시나리오별 배포 가이드**

### 🏢 **시나리오 1: 조직 저장소 배포 (Softbank-mango 조직 내 프로젝트)**

#### **주요 사용 사례**
- Softbank-mango 팀의 프로덕션(실서비스)용 앱 배포
- 여러 명의 팀원이 함께 코드를 짜고 협업하는 메인 프로젝트
- 조직 수준의 안전한 secrets 관리

#### **저장소 예시**
```
https://github.com/Softbank-mango/fastapi-ecommerce
```

#### **배포 단계**

**Step 1: Dashboard에서 배포 시작**
```text
대시보드 접속 → "새 배포" 버튼 클릭
├─ Repository URL 란에: https://github.com/Softbank-mango/fastapi-ecommerce 입력
├─ Branch 란에: main (또는 dev, staging 등) 입력
└─ 배포 시작 버튼 클릭
```

**Step 2: GitHub Actions 백그라운드 자동 실행**
```bash
1. ✅ 코드 체크아웃 (조직 저장소)
   → actions/checkout@v4가 자동으로 발급된 GitHub token으로 인증하여 코드를 가져옴

2. ✅ AI 분석 시작
   → Lambda 함수가 다운받은 프로젝트 구조를 스캔
   → FastAPI 프레임워크임을 감지하고, 포트를 8000으로 자동 설정

3. ✅ Docker 이미지 빌드 (UV + BuildKit 사용)
   → 의존성 설치 최적화로 고속 빌드 진행 (기존 대비 5-10배 빠름)

4. ✅ AWS ECR Push (이미지 업로드)
   → 513348493870.dkr.ecr.ap-northeast-2.amazonaws.com/delightful-deploy:latest 에 등록

5. ✅ AWS ECS 인프라 배포
   → 대상 클러스터: delightful-deploy-cluster
   → Circuit Breaker 기능으로 안전하고 빠르게 컨테이너 교체

6. ✅ 배포 완료!
   → 접속 URL 할당됨: http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
```

**Step 3: 배포 완료 및 접속 테스트**
```bash
# 헬스 체크 API 테스트
curl http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/health

# 기본 화면 접속
curl http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
```

#### **필요한 권한 및 설정**
- **권한**: 조직 멤버로서 최소 Read 권한 보유, GitHub Actions 실행 권한
- **보안 세팅**: 조직 단위 Secret으로 `AWS_ROLE_ARN` (OIDC용) 등이 세팅되어 있어야 함

---

### 👤 **시나리오 2: 개인 저장소 배포 (예: sabill123/sb_test_2)**

#### **주요 사용 사례**
- 회사나 조직과 무관한 개인 사이드 프로젝트 배포
- 빠르게 아이디어를 구현해보고 싶을 때 (프로토타이핑)
- 포트폴리오를 웹에 띄워서 보여주고 싶을 때

#### **저장소 예시**
```
https://github.com/sabill123/sb_test_2
```

#### **배포 단계**

**Step 1: 본인의 저장소 준비하기**

**Option A: Public 저장소 (가장 권장함 - 매우 간단함)**
```text
1. GitHub에서 본인 계정으로 새 저장소 생성 (예: sabill123/sb_test_2)
2. Settings → Visibility 메뉴에서 저장소를 'Public'으로 설정
3. 개발한 코드를 origin main에 푸시(Push)
```

**Option B: Private 저장소 (추가적인 토큰 설정이 필요함)**
```text
※ Private 저장소는 비공개이므로, 플랫폼이 코드를 가져오기 위해 본인의 비밀번호(Token)를 플랫폼에 넘겨줘야 합니다.

1. GitHub 우측 상단 프로필 클릭 → Settings → Developer settings → Personal access tokens
2. 'Generate new token (classic)' 버튼 클릭
3. 권한(Scopes)에서 'repo' (Full control of private repositories) 체크 후 발급
4. 생성된 `ghp_xxxxxxxxxxxx` 형태의 토큰을 복사
5. Deplight Platform(메인 뼈대) 저장소의 Settings → Secrets 메뉴로 이동하여
   `USER_GITHUB_TOKEN` 이라는 이름으로 방금 복사한 토큰값을 저장
```

**Step 2: Dashboard에서 배포 요청**
```text
대시보드 접속 → "새 배포" 클릭
├─ Repository URL 란에: https://github.com/sabill123/sb_test_2 입력
├─ Branch: main
└─ 배포 시작 버튼 클릭
```

**Step 3: 자동 배포 프로세스 진행**
```text
1. ✅ 개인 저장소 체크아웃
   → Public인 경우: 플랫폼이 아무 인증 절차 없이 깃허브에서 코드를 가져옴 ✅
   → Private인 경우: 사전에 세팅해둔 USER_GITHUB_TOKEN으로 로그인하여 코드를 가져옴

2. ✅ AI가 코드 분석
   → 앱 종류 자동 감지 (예: FastAPI)
   → 최적화된 Dockerfile 자동 생성 (Port: 8000, CPU: 256, Memory: 512 세팅)

3. ✅ 인프라 배포
   → ECR에 이미지 푸시 후 ECS에 띄워줌

4. ✅ 배포 URL 오픈
   → http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/
```

**Step 4: 배포 확인**
```bash
# 본인의 앱이 웹에 정상적으로 떴는지 터미널이나 브라우저에서 접속해보기
curl http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/

# 대시보드 상태창 확인
- Status: 🟢 실행 중
- Framework: FastAPI (AI가 자동으로 감지했음)
- 소요 시간: 7-120초
```

#### **사전 필수 체크리스트**
- **Public 저장소의 경우**: 레포지토리만 Public으로 열려 있으면 끝. Dockerfile조차 없어도 AI가 만들어줍니다. (단, `requirements.txt`나 `package.json`은 꼭 있어야 AI가 의존성을 파악할 수 있습니다.)
- **Private 저장소의 경우**: 플랫폼의 `deploy.yml` 파일에서 코드를 체크아웃하는 부분(`actions/checkout@v4`)에 `token: ${{ secrets.USER_GITHUB_TOKEN }}` 라인이 활성화되어 있는지 확인해야 합니다.

---

## 🔐 **권한 및 보안 요약**

### **Public 저장소**
```text
✅ 깃허브 인증 절차가 아예 필요 없음
✅ 대시보드 사이트에 접속할 수 있는 사람이면 누구나 해당 URL을 넣고 배포 버튼을 누를 수 있음
✅ 소스코드가 이미 퍼블릭이므로 권한 유출 같은 보안 이슈가 없음
```

### **Private 저장소**
```text
⚠️ 본인의 GitHub 계정을 대신할 수 있는 토큰(PAT)을 수동으로 발급해야 함
⚠️ 해당 토큰을 공용 플랫폼인 Deplight Platform의 설정 창에 입력해야 함
✅ 외부인은 코드를 볼 수 없으므로, 민감한 회사 코드 등을 배포하기 좋음
```

### **조직 저장소**
```text
✅ GitHub OIDC를 통해 가장 강력하고 안전한 형태의 AWS 접근 권한 제어
✅ 토큰을 누가 발급했냐 따질 것 없이 조직 레벨에서 시크릿이 묶여서 통제됨
```

---

## 📊 **시나리오별 비교 요약표**

| 구분 | 조직 저장소 (Org) | 개인 Public | 개인 Private |
|------|------------|------------|-------------|
| **깃허브 인증 방식** | GitHub OIDC | 인증 불필요 | 토큰(PAT) 발급 필요 |
| **배포 소요 시간** | 7-120초 | 7-120초 | 7-120초 |
| **AI 자동 분석** | ✅ 지원함 | ✅ 지원함 | ✅ 지원함 |
| **Dockerfile 필요여부**| 선택 (없어도 됨) | 선택 (없어도 됨) | 선택 (없어도 됨) |
| **보안 주체** | 조직 관리자 | 보안 없음 (모두 공개) | 토큰(PAT) 보유자 |
| **팀 협업 용이성** | ✅ 매우 좋음 | ⚠️ 다소 제한적 | ⚠️ 다소 제한적 |
| **배포 인프라 비용** | $0.004/배포 | $0.004/배포 | $0.004/배포 |

---

## 🎯 **상황별 권장 가이드**

### **이럴 때는 '조직 저장소 (Softbank-mango)'를 사용하세요:**
- 실제 고객에게 서비스할 프로덕션 레벨의 배포일 때
- 여러 개발자가 수시로 PR을 날리고 협업하는 프로젝트일 때
- CI/CD 파이프라인을 체계적으로 붙이고 싶을 때

### **이럴 때는 '개인 Public 저장소'를 사용하세요:**
- 누구나 코드를 봐도 상관없는 오픈소스 프로젝트일 때
- 취업이나 포트폴리오 제출을 위해 급하게 웹 주소가 필요할 때
- 간단한 기능이 되는지 안 되는지 5분 만에 프로토타입을 테스트해보고 싶을 때

### **이럴 때는 '개인 Private 저장소'를 사용하세요:**
- 코드가 유출되면 큰일 나는 개인의 수익형 앱이나 비밀 프로젝트일 때
- (단, 플랫폼 관리자에게 내 레포지토리 접근 토큰을 제공해야 하므로 설정이 조금 더 번거로움을 감수해야 함)

---

## 💡 **자주 묻는 질문 (FAQ)**

### **Q1: 제가 만든 개인 저장소를 배포하면, 기존에 잘 돌고 있던 팀의 조직 저장소 앱은 어떻게 되나요?**
```text
A: 안타깝게도 현재 아키텍처는 단일 서비스(Single-Service)만 호스팅합니다.
   즉, 누군가 새로 배포를 누르면 무조건 이전에 돌고 있던 앱은 삭제되고 새 앱이 그 자리를 차지합니다.

   해결 방안: 이 문제를 해결하기 위해 URL 경로별로 여러 앱을 동시 분기해주는 기능(Path-based routing, 예: /app1, /app2)이 도입될 예정입니다.
```

### **Q2: 개인 Private 저장소용 토큰(PAT)을 코드 안에 직접 적어두면 안 되나요?**
```text
A: 절대 안 됩니다! 코드가 깃허브에 푸시되는 순간 전 세계 누구나 당신의 레포지토리 통제권을 가로챌 수 있습니다.
   토큰은 반드시 GitHub Settings의 'Secrets' 메뉴에만 저장해야 하며 코드에는 변수명(${{ secrets... }})으로만 참조해야 합니다.
```

### **Q3: 다른 사람의 코드를 포크(Fork)해서 가져온 저장소도 배포가 되나요?**
```text
A: 네, 완벽하게 가능합니다!

   [흐름 예시]
   1. 원본 저장소: github.com/original/awesome-app
   2. Fork 버튼 클릭: github.com/내아이디/awesome-app (나의 저장소로 가져옴)
   3. 대시보드 URL 란에: https://github.com/내아이디/awesome-app 입력
   4. 배포 시작 → 성공적으로 배포됩니다!
```

### **Q4: 배포가 성공한 뒤 접속 주소(URL)는 어떻게 만들어지나요?**
```text
A: 현재는 플랫폼을 사용하는 모든 사람이 동일한 ALB 주소를 사용합니다.
   (http://delightful-deploy-alb-796875577.ap-northeast-2.elb.amazonaws.com/)

   향후 업데이트를 통해 `/앱이름` 형태나 `앱이름.deplight.com`과 같은 서브도메인 형태로 URL을 예쁘게 분리할 계획입니다.
```
