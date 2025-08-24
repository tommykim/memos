# 🚀 EC2 서버 배포 가이드

## 📋 환경 변수 설정

EC2 서버에서 IP 주소가 바뀌어도 문제없이 동작하도록 환경 변수를 설정할 수 있습니다.

### 1. 환경 변수 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# 서버 포트 (기본값: 8083)
PORT=8083

# 서버 호스트 (기본값: 자동 감지)
HOST=0.0.0.0

# Node.js 환경
NODE_ENV=production

# API 기본 URL (프론트엔드에서 사용)
API_BASE_URL=http://your-ec2-ip:8083
```

### 2. 환경 변수 설정 방법

#### 방법 1: .env 파일 사용 (권장)
```bash
# .env 파일 생성
echo "PORT=8083" > .env
echo "HOST=0.0.0.0" >> .env
echo "NODE_ENV=production" >> .env
```

#### 방법 2: 시스템 환경 변수 설정
```bash
# Linux/Mac
export PORT=8083
export HOST=0.0.0.0
export NODE_ENV=production

# Windows
set PORT=8083
set HOST=0.0.0.0
set NODE_ENV=production
```

#### 방법 3: PM2 사용 시
```bash
# ecosystem.config.js 파일 생성
module.exports = {
  apps: [{
    name: 'memo-system',
    script: 'memo.js',
    env: {
      PORT: 8083,
      HOST: '0.0.0.0',
      NODE_ENV: 'production'
    }
  }]
};

# PM2로 실행
pm2 start ecosystem.config.js
```

## 🌐 EC2 서버 설정

### 1. 보안 그룹 설정
- **인바운드 규칙**:
  - SSH (포트 22): 내 IP에서만
  - HTTP (포트 80): 모든 IP
  - HTTPS (포트 443): 모든 IP
  - 커스텀 TCP (포트 8083): 모든 IP

### 2. 서버 실행
```bash
# 의존성 설치
npm install

# 프로덕션 모드로 실행
NODE_ENV=production PORT=8083 HOST=0.0.0.0 node memo.js

# 또는 PM2 사용
npm install -g pm2
pm2 start memo.js --name "memo-system"
pm2 startup
pm2 save
```

### 3. Nginx 리버스 프록시 설정 (선택사항)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8083;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔧 자동 IP 감지 기능

### 서버 측 (memo.js)
- `os.networkInterfaces()`를 사용하여 자동으로 IP 주소 감지
- 환경 변수 `HOST`가 설정되어 있으면 해당 값 사용
- 설정되지 않으면 자동 감지된 IP 사용

### 클라이언트 측 (restFront.js)
- `window.location`을 사용하여 현재 페이지의 호스트와 포트 자동 감지
- 환경 변수 `API_BASE_URL`이 설정되어 있으면 해당 값 사용
- 설정되지 않으면 현재 페이지 주소 기반으로 API URL 생성

## 📱 접속 방법

### 로컬 개발 환경
```bash
# 서버 실행
npm start

# 접속
http://localhost:8083
```

### EC2 서버 환경
```bash
# 서버 실행
NODE_ENV=production node memo.js

# 접속 (EC2 퍼블릭 IP 사용)
http://your-ec2-public-ip:8083
```

## 🚨 주의사항

1. **보안**: 프로덕션 환경에서는 방화벽 설정 필수
2. **포트**: 8083 포트가 방화벽에서 열려있어야 함
3. **환경 변수**: 민감한 정보는 환경 변수로 관리
4. **HTTPS**: 프로덕션 환경에서는 SSL 인증서 설정 권장

## 🔍 문제 해결

### 서버가 시작되지 않는 경우
```bash
# 포트 사용 확인
netstat -tulpn | grep 8083

# 프로세스 확인
ps aux | grep node

# 로그 확인
pm2 logs memo-system
```

### 클라이언트에서 연결이 안 되는 경우
1. EC2 보안 그룹에서 8083 포트 열기
2. 서버가 `0.0.0.0`으로 바인딩되었는지 확인
3. 방화벽 설정 확인

### IP 주소가 자동으로 변경되는 경우
- 환경 변수 `HOST`를 명시적으로 설정
- 고정 IP 사용 고려
- 도메인 이름 사용 권장
