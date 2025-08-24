// 동적으로 API 기본 URL 설정
function getApiBaseUrl() {
  // 환경 변수에서 API URL 설정이 있으면 사용
  if (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) {
    return process.env.API_BASE_URL;
  }
  
  // 브라우저 환경에서는 현재 페이지의 호스트와 포트 사용
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // 포트가 있으면 포함, 없으면 제외
    if (port) {
      return `${protocol}//${hostname}:${port}`;
    } else {
      return `${protocol}//${hostname}`;
    }
  }
  
  // 기본값 (로컬 개발용)
  return 'http://localhost:8083';
}

// API 기본 URL 설정
const API_BASE_URL = getApiBaseUrl();

// 전역 변수
let editingMemoId = null;
let memos = {};

// DOM 요소들
const memoForm = document.getElementById('memo-form');
const memoTitleInput = document.getElementById('memo-title');
const memoContentInput = document.getElementById('memo-content');
const memoListContainer = document.getElementById('memo-list');
const alertContainer = document.getElementById('alert-container');
const clearFormBtn = document.getElementById('clear-form');

// 서버 정보 표시 함수
function displayServerInfo() {
  // 서버 정보를 페이지에 표시
  const serverInfoDiv = document.createElement('div');
  serverInfoDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-size: 12px;
    font-family: monospace;
    z-index: 1000;
  `;
  serverInfoDiv.innerHTML = `
    <div>🌐 API: ${API_BASE_URL}</div>
    <div>📍 현재: ${window.location.href}</div>
  `;
  document.body.appendChild(serverInfoDiv);
}

// 유틸리티 함수들
function showAlert(message, type = 'success') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  
  alertContainer.appendChild(alertDiv);
  
  // 3초 후 자동 제거
  setTimeout(() => {
    if (alertDiv.parentNode) {
      alertDiv.parentNode.removeChild(alertDiv);
    }
  }, 3000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function clearForm() {
  memoTitleInput.value = '';
  memoContentInput.value = '';
  editingMemoId = null;
  
  // 폼 제출 버튼 텍스트 변경
  const submitBtn = memoForm.querySelector('button[type="submit"]');
  submitBtn.textContent = '💾 메모 저장';
  
  // 입력 필드 포커스
  memoTitleInput.focus();
}

function setEditMode(memoId) {
  const memo = memos[memoId];
  if (!memo) return;
  
  editingMemoId = memoId;
  memoTitleInput.value = memo.title;
  memoContentInput.value = memo.content;
  
  // 폼 제출 버튼 텍스트 변경
  const submitBtn = memoForm.querySelector('button[type="submit"]');
  submitBtn.textContent = '✏️ 메모 수정';
  
  // 제목 입력 필드로 스크롤
  memoTitleInput.scrollIntoView({ behavior: 'smooth' });
  memoTitleInput.focus();
}

// API 호출 함수들
async function fetchMemos() {
  try {
    const response = await axios.get(`${API_BASE_URL}/memos`);
    memos = response.data;
    renderMemoList();
  } catch (error) {
    console.error('메모 목록을 불러오는데 실패했습니다:', error);
    showAlert('메모 목록을 불러오는데 실패했습니다.', 'error');
    renderErrorState();
  }
}

async function createMemo(title, content) {
  try {
    const response = await axios.post(`${API_BASE_URL}/memo`, {
      title,
      content
    });
    
    showAlert('메모가 성공적으로 저장되었습니다!');
    await fetchMemos();
    clearForm();
    return response.data;
  } catch (error) {
    console.error('메모 저장에 실패했습니다:', error);
    showAlert('메모 저장에 실패했습니다.', 'error');
    throw error;
  }
}

async function updateMemo(memoId, title, content) {
  try {
    const response = await axios.put(`${API_BASE_URL}/memo/${memoId}`, {
      title,
      content
    });
    
    showAlert('메모가 성공적으로 수정되었습니다!');
    await fetchMemos();
    clearForm();
    return response.data;
  } catch (error) {
    console.error('메모 수정에 실패했습니다:', error);
    showAlert('메모 수정에 실패했습니다.', 'error');
    throw error;
  }
}

async function deleteMemo(memoId) {
  if (!confirm('정말로 이 메모를 삭제하시겠습니까?')) {
    return;
  }
  
  try {
    await axios.delete(`${API_BASE_URL}/memo/${memoId}`);
    showAlert('메모가 성공적으로 삭제되었습니다!');
    await fetchMemos();
  } catch (error) {
    console.error('메모 삭제에 실패했습니다:', error);
    showAlert('메모 삭제에 실패했습니다.', 'error');
  }
}

// UI 렌더링 함수들
function renderMemoList() {
  if (Object.keys(memos).length === 0) {
    renderEmptyState();
    return;
  }
  
  const memoList = document.createElement('div');
  
  // 메모를 생성 시간 역순으로 정렬
  const sortedMemos = Object.entries(memos).sort((a, b) => {
    return new Date(b[1].createdAt) - new Date(a[1].createdAt);
  });
  
  sortedMemos.forEach(([memoId, memo]) => {
    const memoItem = createMemoItem(memoId, memo);
    memoList.appendChild(memoItem);
  });
  
  memoListContainer.innerHTML = '';
  memoListContainer.appendChild(memoList);
}

function createMemoItem(memoId, memo) {
  const memoDiv = document.createElement('div');
  memoDiv.className = 'memo-item';
  
  const isEdited = memo.updatedAt && memo.updatedAt !== memo.createdAt;
  
  memoDiv.innerHTML = `
    <div class="memo-header">
      <div>
        <div class="memo-title">${escapeHtml(memo.title)}</div>
        <div class="memo-meta">
          📅 생성: ${formatDate(memo.createdAt)}
          ${isEdited ? ` | ✏️ 수정: ${formatDate(memo.updatedAt)}` : ''}
        </div>
      </div>
    </div>
    <div class="memo-content">${escapeHtml(memo.content)}</div>
    <div class="memo-actions">
      <button class="btn btn-secondary edit-btn" data-memo-id="${memoId}">
        ✏️ 수정
      </button>
      <button class="btn btn-danger delete-btn" data-memo-id="${memoId}">
        🗑️ 삭제
      </button>
    </div>
  `;
  
  // 이벤트 리스너 추가
  const editBtn = memoDiv.querySelector('.edit-btn');
  const deleteBtn = memoDiv.querySelector('.delete-btn');
  
  editBtn.addEventListener('click', () => setEditMode(memoId));
  deleteBtn.addEventListener('click', () => deleteMemo(memoId));
  
  return memoDiv;
}

function renderEmptyState() {
  memoListContainer.innerHTML = `
    <div class="empty-state">
      <h3>📝 아직 작성된 메모가 없습니다</h3>
      <p>위의 폼을 사용하여 첫 번째 메모를 작성해보세요!</p>
    </div>
  `;
}

function renderErrorState() {
  memoListContainer.innerHTML = `
    <div class="empty-state">
      <h3>❌ 메모를 불러올 수 없습니다</h3>
      <p>서버 연결을 확인하고 다시 시도해주세요.</p>
      <p><strong>현재 API 주소:</strong> ${API_BASE_URL}</p>
      <button class="btn" onclick="fetchMemos()">🔄 다시 시도</button>
    </div>
  `;
}

// XSS 방지를 위한 HTML 이스케이프 함수
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 이벤트 리스너들
memoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const title = memoTitleInput.value.trim();
  const content = memoContentInput.value.trim();
  
  if (!title || !content) {
    showAlert('제목과 내용을 모두 입력해주세요.', 'error');
    return;
  }
  
  try {
    if (editingMemoId) {
      // 수정 모드
      await updateMemo(editingMemoId, title, content);
    } else {
      // 새 메모 작성 모드
      await createMemo(title, content);
    }
  } catch (error) {
    // 에러는 이미 각 함수에서 처리됨
  }
});

clearFormBtn.addEventListener('click', clearForm);

// 키보드 단축키 지원
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter: 폼 제출
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    memoForm.dispatchEvent(new Event('submit'));
  }
  
  // Esc: 편집 모드 취소
  if (e.key === 'Escape' && editingMemoId) {
    clearForm();
  }
});

// 페이지 로드 시 실행
window.addEventListener('load', async () => {
  try {
    // 서버 정보 표시
    displayServerInfo();
    
    // API 연결 테스트
    console.log(`🔗 API 서버에 연결 중: ${API_BASE_URL}`);
    
    await fetchMemos();
  } catch (error) {
    console.error('초기 로딩 실패:', error);
  }
});

// 주기적으로 메모 목록 새로고침 (선택사항)
setInterval(fetchMemos, 30000); // 30초마다 새로고침
  