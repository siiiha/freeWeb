// ==========================================
// 1. 데이터 저장소 및 전역 변수 선언 구역
// ==========================================
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let filterState = 'all';

let todoInput;  // 할 일 입력창
let todoList;   // 할 일 목록 (ul)

// 스톱워치용 제어 변수
let startTime = 0;
let timerInterval = null;
let elapsedTime = 0;

// 딴짓 감지용 변수
const INACTIVE_LIMIT = 5000;
let inactivityTimeout = null;

// DOM 요소 연결 (코드 최상단에서 명확하게 통합 선언)
const display = document.getElementById('timer-display');
const startBtn = document.getElementById('start-Btn');
const stopBtn = document.getElementById('stop-Btn');
const resetBtn = document.getElementById('reset-Btn');

const pinBtn = document.getElementById('pop-up');
const timerWidgetBar = document.getElementById('timer-widget-bar');
const pipDisplay = document.getElementById('pip-display');

const miniAlert = document.getElementById('mini-alert');
const miniAlertClose = document.getElementById('mini-alert-close');

const customPopup = document.getElementById('custom-popup');
const popupCloseBtn = document.getElementById('popup-close-btn');
const popupMessage = document.querySelector('.popup-message');

// ==========================================
// 2. 초기화 및 이벤트 바인딩 (DOMContentLoaded 통합)
// ==========================================
window.addEventListener("DOMContentLoaded", function () {
    // 투두리스트 요소 연결
    todoInput = document.querySelector('#todo-input');
    todoList = document.querySelector('#todo-list');

    // 메모장 자동불러오기 로직 통합
    const memoInput = document.getElementById('memo-input');
    const savedMemo = localStorage.getItem('autosave-memo');
    if (savedMemo !== null) {
        memoInput.value = savedMemo;
    }
    memoInput.addEventListener('input', () => {
        localStorage.setItem('autosave-memo', memoInput.value);
    });

    bindEvents();
    render();
});

// 모든 이벤트 리스너 등록 함수
function bindEvents() {
    // 투두리스트 등록 및 삭제 이벤트
    const addBtn = document.querySelector('#todo-add-btn');
    addBtn.addEventListener('click', addTodo);

    todoInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });

    const delectAllBtn = document.querySelector('#all-delect');
    delectAllBtn.addEventListener('click', todoDeleteAll);

    // 딴짓 감지 마우스 및 키보드 움직임 리스너
    window.addEventListener("click", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("mousemove", resetInactivityTimer);

    // 📌 핀 버튼 및 커스텀 팝업 닫기 버튼 이벤트
    pinBtn.addEventListener('click', togglePipWidget);
    if (popupCloseBtn) {
        popupCloseBtn.addEventListener("click", () => {
            customPopup.style.display = "none";
        });
    }
}

// ==========================================
// 3. 투두리스트 (Todo List) 기능 구역
// ==========================================
function addTodo() {
    const work = todoInput.value;
    if (!work) return;

    const todo = {
        id: Date.now(),
        work: work,
        completed: false,
        createAt: new Date().toLocaleString(),
    };

    todos.push(todo);
    todoInput.value = "";

    saveTodos();
    render();
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function getFilteredTodos() {
    if (filterState === 'active') return todos.filter(todo => !todo.completed);
    else if (filterState === 'completed') return todos.filter(todo => todo.completed);
    return todos;
}

function render() {
    todoList.textContent = "";
    const filteredTodos = getFilteredTodos();

    if (filteredTodos.length === 0) {
        emptyStateRender();
    } else {
        filteredTodos.forEach(function (todo) {
            todoItemRender(todo);
        });
    }
}

function emptyStateRender() {
    const emptyEl = document.createElement('li');
    emptyEl.className = 'empty-state special-font';
    emptyEl.textContent = "텅~";
    todoList.appendChild(emptyEl);
}

function todoItemRender(todo) {
    const todoEl = document.createElement('li');
    todoEl.className = todo.completed ? 'completed' : '';

    const checkBox = document.createElement('div');
    checkBox.className = 'normal-checkbox' + (todo.completed ? ' checked' : '');
    checkBox.addEventListener('click', () => turnTodoState(todo.id));

    const contentSpan = document.createElement('span');
    contentSpan.textContent = todo.work;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '✖';
    deleteBtn.addEventListener('click', () => todoDelete(todo.id));

    todoEl.appendChild(checkBox);
    todoEl.appendChild(contentSpan);
    todoEl.appendChild(deleteBtn);

    todoList.appendChild(todoEl);
}

// ⭕ [복구 완료] 맛이 갔던 투두리스트 체크박스 토글 함수를 다시 집어넣었습니다!
function turnTodoState(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
        }
        return todo;
    });
    saveTodos();
    render();
}

function todoDelete(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    render();
}

function todoDeleteAll() {
    todos = [];
    saveTodos();
    render();
}

// ==========================================
// 4. 스톱워치 (Timer) 기능 구역
// ==========================================
function timeToString(time) {
    let hh = Math.floor(time / (1000 * 60 * 60));
    let mm = Math.floor((time / (1000 * 60)) % 60);
    let ss = Math.floor((time / 1000) % 60);

    let formattedHH = hh.toString().padStart(2, "0");
    let formattedMM = mm.toString().padStart(2, "0");
    let formattedSS = ss.toString().padStart(2, "0");
    
    return `${formattedHH}:${formattedMM}:${formattedSS}`;
}

// START 버튼 클릭
startBtn.addEventListener("click", () => {
    if (timerInterval) return;
    startTime = Date.now() - elapsedTime;
    
    timerInterval = setInterval(() => {
        elapsedTime = Date.now() - startTime;
        
        // 1. 메인 웹페이지의 큰 타이머 숫자 업데이트 (디자인 유지)
        display.textContent = timeToString(elapsedTime);
        
        // 2. 독립 숨김 처리된 미니 위젯 바 안의 숫자도 완벽 동기화
        if (pipDisplay) {
            pipDisplay.textContent = timeToString(elapsedTime);
        }
    }, 1000);

    resetInactivityTimer(); 
});

// STOP 버튼 클릭
stopBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
});

// RESET 버튼 클릭
resetBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    startTime = 0;
    elapsedTime = 0;
    
    // 메인 큰 타이머와 분리형 미니 위젯 텍스트를 함께 리셋
    display.textContent = "00:00:00";
    if (pipDisplay) {
        pipDisplay.textContent = "00:00:00";
    }
});

// ==========================================
// 5. 딴짓 감지 및 미니 위젯 분리(PIP) 구역
// ==========================================
function resetInactivityTimer(){
    if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
    }

    if (timerInterval){
        inactivityTimeout = setTimeout(() => {
            stopBtn.click(); // 타이머 정지
            miniAlert.classList.add("show"); // 딴짓 알림 표시
        }, INACTIVE_LIMIT);
    }
}

miniAlertClose.addEventListener("click", () => {
    miniAlert.classList.remove("show"); 
});

// 📌 핀 버튼 클릭 시 동작하는 항상 위 미니위젯 처리 함수
async function togglePipWidget() {
    if ('documentPictureInPicture' in window) {
        try {
            const pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 280,
                height: 65,
            });

            pipWindow.document.body.classList.add('pip-body');

            // ⭕ 메인 타이머 구역은 건들지 않고, 숨겨둔 독립 위젯 바만 팝업창으로 전송!
            pipWindow.document.body.append(timerWidgetBar);

            // 본문 스타일 시트 복사
            [...document.styleSheets].forEach((styleSheet) => {
                try {
                    const rules = [...styleSheet.cssRules].map((rule) => rule.cssText).join('');
                    const style = document.createElement('style');
                    style.textContent = rules;
                    pipWindow.document.head.appendChild(style);
                } catch (e) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = styleSheet.href;
                    pipWindow.document.head.appendChild(link);
                }
            });

            // 위젯을 끄면 본문 보이지 않는 하단 영역으로 안전하게 복귀
            pipWindow.addEventListener('pagehide', (event) => {
                document.body.appendChild(timerWidgetBar); 
            });

        } catch (error) {
            console.error('위젯 분리 실패:', error);
        }
    } else {
        // PIP를 지원하지 않는 브라우저 대응 커스텀 팝업창 활성화
        if (popupMessage && customPopup) {
            popupMessage.innerHTML = "팝업 메시지는 타이머를 분리합니다!";
            customPopup.style.display = "flex";
        }
    }
}