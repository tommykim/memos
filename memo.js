const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const os = require('os');

const memos = {}; // 데이터 저장용

// 동적으로 IP 주소와 포트 설정
function getServerConfig() {
  // 환경 변수에서 포트 가져오기 (기본값: 8083)
  const PORT = process.env.PORT || 8083;
  
  // 환경 변수에서 HOST 설정이 있으면 우선 사용
  if (process.env.HOST) {
    return {
      port: PORT,
      host: process.env.HOST,
      localIP: process.env.HOST
    };
  }
  
  // 로컬 IP 주소들 가져오기
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  let publicIP = null;
  
  // 네트워크 인터페이스에서 IP 주소 찾기
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const interface of interfaces) {
      if (interface.family === 'IPv4' && !interface.internal) {
        const ip = interface.address;
        
        // 퍼블릭 IP 범위 확인 (RFC 1918 제외)
        if (!isPrivateIP(ip)) {
          publicIP = ip;
          break; // 퍼블릭 IP를 찾으면 우선 사용
        } else if (localIP === 'localhost') {
          localIP = ip; // 프라이빗 IP는 백업으로 저장
        }
      }
    }
    if (publicIP) break; // 퍼블릭 IP를 찾았으면 중단
  }
  
  // 퍼블릭 IP가 있으면 사용, 없으면 프라이빗 IP 사용
  const HOST = publicIP || localIP;
  
  return {
    port: PORT,
    host: HOST,
    localIP: localIP,
    publicIP: publicIP
  };
}

// 프라이빗 IP 주소인지 확인하는 함수
function isPrivateIP(ip) {
  const parts = ip.split('.').map(part => parseInt(part));
  
  // RFC 1918 프라이빗 IP 범위
  return (
    (parts[0] === 10) ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}

const serverConfig = getServerConfig();

// Swagger 정의
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '메모 관리 REST API 문서',
      version: '1.0.0',
      description: '메모 작성, 조회, 수정, 삭제를 위한 REST API 문서',
    },
    servers: [
      {
        url: `http://${serverConfig.host}:${serverConfig.port}`,
        description: serverConfig.publicIP ? '퍼블릭 서버 (외부 접근)' : '메모 관리 서버',
      },
      {
        url: `http://localhost:${serverConfig.port}`,
        description: '로컬 개발 서버',
      },
      ...(serverConfig.publicIP && serverConfig.publicIP !== serverConfig.host ? [{
        url: `http://${serverConfig.publicIP}:${serverConfig.port}`,
        description: '퍼블릭 IP 서버',
      }] : []),
      ...(serverConfig.localIP && serverConfig.localIP !== serverConfig.host ? [{
        url: `http://${serverConfig.localIP}:${serverConfig.port}`,
        description: '프라이빗 IP 서버',
      }] : []),
    ],
  },
  apis: ['./memo.js'],
};

/**
 * @swagger
 * /memos:
 *   get:
 *     summary: 모든 메모 조회
 *     responses:
 *       200:
 *         description: 성공
 * 
 * /memo:
 *   post:
 *     summary: 새 메모 작성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: 등록 성공
 * 
 * /memo/{id}:
 *   get:
 *     summary: 특정 메모 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 조회 성공
 * 
 *   put:
 *     summary: 메모 수정
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 수정 성공
 * 
 *   delete:
 *     summary: 메모 삭제
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 삭제 성공
 */

const swaggerSpec = swaggerJsdoc(swaggerOptions);

http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET') {
      if (req.url === '/') {
        const data = await fs.readFile(path.join(__dirname, 'restFront.html'));
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(data);
      } else if (req.url === '/memos') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(memos));
      } else if (req.url.startsWith('/memo/')) {
        const id = req.url.split('/')[2];
        if (memos[id]) {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify(memos[id]));
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('메모를 찾을 수 없습니다');
        }
      } else if (req.url === '/api-docs') {
        // Swagger UI HTML 반환
        const swaggerHtml = `
          <!DOCTYPE html>
          <html lang="ko">
          <head>
            <meta charset="UTF-8">
            <title>메모 관리 API - Swagger UI</title>
            <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.css" />
          </head>
          <body>
            <div id="swagger-ui"></div>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui-bundle.js"></script>
            <script>
              window.onload = () => {
                const ui = SwaggerUIBundle({
                  spec: ${JSON.stringify(swaggerSpec)},
                  dom_id: '#swagger-ui',
                  deepLinking: true,
                  presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                  ],
                });
              };
            </script>
          </body>
          </html>
        `;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(swaggerHtml);
      } else if (req.url === '/swagger.json') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify(swaggerSpec));
      } else if (req.url === '/server-info') {
        // 서버 정보 API 추가
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
          host: serverConfig.host,
          port: serverConfig.port,
          localIP: serverConfig.localIP,
          publicIP: serverConfig.publicIP,
          environment: process.env.NODE_ENV || 'development'
        }));
      }
      try {
        const data = await fs.readFile(path.join(__dirname, req.url));
        return res.end(data);
      } catch (err) {
        // 404 Not Found
      }
    } else if (req.method === 'POST') {
      if (req.url === '/memo') {
        let body = '';
        req.on('data', (data) => {
          body += data;
        });
        return req.on('end', () => {
          console.log('POST 본문(Body):', body);
          try {
            const { title, content } = JSON.parse(body);
            
            if (!title || !content) {
              res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
              return res.end('제목과 내용은 필수입니다');
            }

            const id = Date.now().toString();
            memos[id] = {
              id,
              title,
              content,
              createdAt: new Date().toISOString()
            };

            console.log(`새 메모 작성: ${title}`);
            res.writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('메모 작성 성공');
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('잘못된 JSON 형식입니다');
          }
        });
      }
    } else if (req.method === 'PUT') {
      if (req.url.startsWith('/memo/')) {
        const id = req.url.split('/')[2];
        if (!memos[id]) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('메모를 찾을 수 없습니다');
        }

        let body = '';
        req.on('data', (data) => {
          body += data;
        });
        return req.on('end', () => {
          console.log('PUT 본문(Body):', body);
          try {
            const { title, content } = JSON.parse(body);
            
            if (title) memos[id].title = title;
            if (content) memos[id].content = content;
            memos[id].updatedAt = new Date().toISOString();

            console.log(`메모 수정: ${id}`);
            res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('메모 수정 성공');
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('잘못된 JSON 형식입니다');
          }
        });
      }
    } else if (req.method === 'DELETE') {
      if (req.url.startsWith('/memo/')) {
        const id = req.url.split('/')[2];
        if (!memos[id]) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('메모를 찾을 수 없습니다');
        }

        delete memos[id];
        console.log(`메모 삭제: ${id}`);
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('메모 삭제 성공');
      }
    }
    res.writeHead(404);
    return res.end('NOT FOUND');
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(err.message);
  }
})
.listen(serverConfig.port, serverConfig.host, () => {
  console.log('🚀 메모 관리 서버가 실행 중입니다');
  console.log(`📍 서버 주소: http://${serverConfig.host}:${serverConfig.port}`);
  console.log(`🌐 로컬 접속: http://localhost:${serverConfig.port}`);
  console.log(`📚 Swagger 문서: http://${serverConfig.host}:${serverConfig.port}/api-docs`);
  console.log(`🔧 서버 정보: http://${serverConfig.host}:${serverConfig.port}/server-info`);
  console.log(`⚙️  환경: ${process.env.NODE_ENV || 'development'}`);
});


    
