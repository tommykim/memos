# 📝 메모 관리 시스템

메모리 기반으로 동작하는 메모 관리 시스템입니다. REST API를 통해 메모를 작성, 조회, 수정, 삭제할 수 있으며, Swagger 문서를 제공합니다.

## ✨ 주요 기능

- **메모리 기반 저장**: 파일 시스템 대신 메모리에 데이터를 저장하여 빠른 접근
- **RESTful API**: 표준 HTTP 메서드를 사용한 API 설계
- **Swagger 문서**: 자동 생성되는 API 문서로 쉽게 테스트 가능
- **CORS 지원**: 웹 브라우저에서 API 호출 가능
- **에러 처리**: 적절한 HTTP 상태 코드와 에러 메시지 제공
- **자동 IP 감지**: EC2 서버에서 IP 주소가 바뀌어도 자동 감지

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/tommykim/memos.git
cd memos
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
# env.example을 .env로 복사
cp env.example .env

# .env 파일을 편집하여 설정 수정
# PORT=8083
# HOST=0.0.0.0
# NODE_ENV=production
```

### 4. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm run start:prod

# 기본 실행
npm start
```

## 🌐 접속 정보

- **메인 페이지**: http://localhost:8083
- **Swagger API 문서**: http://localhost:8083/api-docs
- **API 엔드포인트**: http://localhost:8083/memos
- **서버 정보**: http://localhost:8083/server-info

## 📚 API 엔드포인트

### 메모 목록 조회
```http
GET /memos
```

### 새 메모 작성
```http
POST /memo
Content-Type: application/json

{
  "title": "메모 제목",
  "content": "메모 내용"
}
```

### 특정 메모 조회
```http
GET /memo/{id}
```

### 메모 수정
```http
PUT /memo/{id}
Content-Type: application/json

{
  "title": "수정된 제목",
  "content": "수정된 내용"
}
```

### 메모 삭제
```http
DELETE /memo/{id}
```

## 🔧 환경 변수

| 변수명 | 기본값 | 설명 |
|--------|--------|------|
| `PORT` | 8083 | 서버 포트 |
| `HOST` | 자동 감지 | 서버 호스트 |
| `NODE_ENV` | development | Node.js 환경 |
| `API_BASE_URL` | 자동 감지 | API 기본 URL |

## 🖥️ EC2 서버 배포

### 1. 보안 그룹 설정
- **인바운드 규칙**:
  - SSH (포트 22): 내 IP에서만
  - 커스텀 TCP (포트 8083): 모든 IP

### 2. 서버 실행
```bash
# 프로덕션 모드로 실행
NODE_ENV=production HOST=0.0.0.0 node memo.js

# 또는 PM2 사용
npm install -g pm2
pm2 start memo.js --name "memo-system"
pm2 startup
pm2 save
```

### 3. 접속
```
http://your-ec2-public-ip:8083
```

## 📁 프로젝트 구조

```
memos/
├── memo.js              # 메인 서버 파일
├── restFront.html       # 프론트엔드 HTML
├── restFront.js         # 프론트엔드 JavaScript
├── package.json         # 프로젝트 설정 및 의존성
├── env.example          # 환경 변수 예시
├── .gitignore           # Git 제외 파일 목록
├── DEPLOYMENT.md        # 배포 가이드
└── README.md            # 프로젝트 설명서
```

## 🧪 테스트 방법

### 1. 브라우저에서 테스트
- http://localhost:8083 접속하여 메인 페이지 확인
- http://localhost:8083/api-docs 접속하여 Swagger UI에서 API 테스트

### 2. curl 명령어로 테스트

#### 메모 작성
```bash
curl -X POST http://localhost:8083/memo \
  -H "Content-Type: application/json" \
  -d '{"title":"테스트 메모","content":"이것은 테스트 메모입니다."}'
```

#### 메모 목록 조회
```bash
curl http://localhost:8083/memos
```

#### 특정 메모 조회
```bash
curl http://localhost:8083/memo/{메모ID}
```

#### 메모 수정
```bash
curl -X PUT http://localhost:8083/memo/{메모ID} \
  -H "Content-Type: application/json" \
  -d '{"title":"수정된 제목","content":"수정된 내용"}'
```

#### 메모 삭제
```bash
curl -X DELETE http://localhost:8083/memo/{메모ID}
```

## 🔄 스크립트 명령어

```bash
npm start              # 기본 실행
npm run dev            # 개발 모드 (nodemon)
npm run start:prod     # 프로덕션 모드
npm run pm2:start      # PM2로 시작
npm run pm2:stop       # PM2 중지
npm run pm2:restart    # PM2 재시작
npm run pm2:logs       # PM2 로그 확인
npm run pm2:delete     # PM2 프로세스 삭제
```

## ⚠️ 주의사항

- **메모리 기반 저장**: 서버를 재시작하면 모든 메모 데이터가 사라집니다
- **포트 충돌**: 8083번 포트가 이미 사용 중인 경우 다른 포트로 변경해야 합니다
- **Node.js 버전**: Node.js 14.0.0 이상이 필요합니다
- **보안**: 프로덕션 환경에서는 방화벽 설정 필수
