
//1. 투두리스트
let todos = JSON.parse(localStorage.getItem('todos')) || [];
let filterState = 'all';

let todoInput;  // 할 일 입력창
let todoListEl;   // 할 일 목록 (ul)

// 2-1. 스톱워치
let startTime = 0;
let timerInterval = null;
let elapsedTime = 0;


// 2-2. 딴짓 감지
const INACTIVE_LIMIT = 3000; //일단 3초로 설정
let inactivityTimeout = null;



// DOM 요소 연결한다.
const display = document.getElementById('timer-display');
const startBtn = document.getElementById('start-Btn');
const stopBtn = document.getElementById('stop-Btn');
const resetBtn = document.getElementById('reset-Btn');
//스탑워치

const pinBtn = document.getElementById('pop-up');
const timerWidgetBar = document.getElementById('timer-widget-bar');
const pipDisplay = document.getElementById('pip-display');
//창분리

const miniAlert = document.getElementById('mini-alert');
const miniAlertClose = document.getElementById('mini-alert-close');
//미니 알림이다.

const customPopup = document.getElementById('custom-popup');
const popupCloseBtn = document.getElementById('popup-close-btn');
const popupMessage = document.getElementById('popup-message');
//커스텀 팝업이다.


//화면이 시작되면 밑의 세 기능이 시작
window.addEventListener("DOMContentLoaded", function () {
    todoList();
    toStopwatch();
    toMemo()
});


// 투두리스트 요소 연결
function todoList() {
    todoInput = document.querySelector('#todo-input');
    todoListEl = document.querySelector('#todo-list');

    bindEvents();
    render();
};


// 이벤트 묶음!
function bindEvents() {
    // 투두리스트 등록 및 삭제 이벤트
    const addBtn = document.querySelector('#todo-add-btn');
    addBtn.addEventListener('click', addTodo);

    todoInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            addTodo();
        }
    });



    //모두 삭제하는 버튼은 클릭으로 작동
    const deleteAllBtn = document.querySelector('#all-delect');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', todoDeleteAll);
    }
    //if문 꼭 안해도 되는데 에러방지용



    //딴짓감지용. 움직임이 있을 때마다 이벤트 타이머를 리셋한다.
    window.addEventListener("click", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);
    window.addEventListener("mousemove", resetInactivityTimer);



    //창분리 버튼 이벤트 추가
    //핀버튼을 누르면 토글함수가 시작된다.
    //닫기 버튼을 누르면 팝업을 보이지 않게 만든다.
    pinBtn.addEventListener('click', togglePipWidget);
    if (popupCloseBtn) {
        popupCloseBtn.addEventListener("click", () => {
            customPopup.style.display = "none";
        });
    }
}


//투두리스트 추가
function addTodo() {
    const work = todoInput.value;
    if (!work) return;
    //써있는 것이 없다면 리턴

    const todo = {
        id: Date.now(),
        work: work,
        completed: false,
    };
    //저장정보~
    //id는 date로. 완료하지 않았으니까 상태는 false다.

    todos.push(todo);
    todoInput.value = "";
    //값을 추가하고 난 뒤에, 추가창은 공백으로

    saveTodos();
    render();
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    //localStorage에 저장! (투두스를 문자열로 변환해서 저장한다~)
    //안그러면 타입을 몰라서 오류가 난다~
}

function getFilteredTodos() {
    if (filterState === 'active') return todos.filter(todo => !todo.completed);
    else if (filterState === 'completed') return todos.filter(todo => todo.completed);
    return todos;
    //다른 기능들을 사용할 때 쓰는 필터
    //하는중 상태가 아닌 것들은 완료하지 않음 필터에 다 걸러짐
    //완료함 필터로 완료함들만 남겨둔다.
}

//새창 렌더하기
function render() {
    todoListEl.textContent = "";
    //싹 지우고 시작

    const filteredTodos = getFilteredTodos();

    //투두스들이 들어있는 배열에 아무것도 없다면 빈 상태를 렌더하고
    //그게 아니라면 아이템있음 상태를 렌더한다.
    if (filteredTodos.length === 0) {
        emptyStateRender();
    } else {
        filteredTodos.forEach(function (todo) {
            todoItemRender(todo);
        });
    }
}


//빈상태 렌더
function emptyStateRender() {
    const emptyEl = document.createElement('li');
    emptyEl.className = 'empty-state special-font';
    //혼자 다른 폰트 쓰고 싶음
    emptyEl.textContent = "텅~";
    todoListEl.appendChild(emptyEl);
}

//아이템 있음 렌더
function todoItemRender(todo) {
    //
    const todoEl = document.createElement('li');
    todoEl.className = todo.completed ? 'completed' : '';

    //완료상태라면 기본 체크박스를 체크. 아니라면 냅두기.
    //클릭하면 투두상태가 바뀐다.
    const checkBox = document.createElement('div');
    checkBox.className = 'normal-checkbox' + (todo.completed ? ' checked' : '');
    checkBox.addEventListener('click', () => turnTodoState(todo.id));

    //텍스트 렌더 : span이라는 공간을 만들고 그곳에 todo의 텍스트 컨탠츠를 추가한다.
    const contentSpan = document.createElement('span');
    contentSpan.textContent = todo.work;

    //X버튼을 누르면 삭제 함수가 발동
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-delete';
    deleteBtn.textContent = '✖';
    deleteBtn.addEventListener('click', () => todoDelete(todo.id));

    //부모 li에 자식들을 붙인다.
    todoEl.appendChild(checkBox);
    todoEl.appendChild(contentSpan);
    todoEl.appendChild(deleteBtn);

    //부모li를 ul에 붙인다.
    todoListEl.appendChild(todoEl);

}



//투두상태바꾸기 함수
//완료->하는중 / 하는중->완료
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


//투두 삭제하기 : id가 동일하지 않은 투두들을 필터로 걸러서 남겨둔다.
//               걸러진(체크된) 투두들은 렌더링 하지 않음으로 삭제
function todoDelete(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    render();
}

//투두 모두 삭제하기
function todoDeleteAll() {
    todos = [];
    saveTodos();
    render();
}



//스톱워치
//밀리초를 가지고 ...


function timeToString(time) {
    let hh = Math.floor(time / (1000 * 60 * 60));
    let mm = Math.floor((time / (1000 * 60)) % 60);
    //1분으로 나눈 후에 60분으로 나눈 나머지
    //(1시간 30분이면 -1시간해서 30분이 나머지인거)
    let ss = Math.floor((time / 1000) % 60);
    //1초로 나눈 후에 1분으로 나눈 나머지

    //숫자를 문자열로 형변환. 
    let formattedHH = hh.toString().padStart(2, "0");
    let formattedMM = mm.toString().padStart(2, "0");
    let formattedSS = ss.toString().padStart(2, "0");
    //"문자열".padStart(원하는_총_길이, "채울_문자")
    //=> 숫자가 한자리라면 두자리로 맞추고 앞자리는 0으로 채우는 거다.
    //이미 두자리인 경우에는 손대지 않는다.

    return `${formattedHH}:${formattedMM}:${formattedSS}`;
    //리턴 값은 HH:MM:SS
}



// START 버튼 클릭
function toStopwatch() {
    startBtn.addEventListener("click", () => {
        if (timerInterval) return;
        startTime = Date.now() - elapsedTime;
        //elapsedTime : 흘러간 시간
        //시작한 시간 = 현재 시간 - 흘러간 시간

        timerInterval = setInterval(() => {
            elapsedTime = Date.now() - startTime;
            //흘러간 시간 = 현재 시간 - 시작한 시간

            display.textContent = timeToString(elapsedTime);
            //흘러간 시간을 집어넣는다. 스탑워치니까.

            if (pipDisplay) {
                pipDisplay.textContent = timeToString(elapsedTime);
            }
            //만약 팝업...pip모드가 있다면 그것도 마찬가지로 적용해준다.
        }, 1000);
        //1000mm = 1s : 1초마다 작동한다는 소리
        resetInactivityTimer();
        //딴짓감지용 타이머를 리셋한다. (감시 시작)
    });



    // STOP 버튼 클릭
    stopBtn.addEventListener("click", () => {
        clearInterval(timerInterval);
        timerInterval = null;

        if (inactivityTimeout) {
            clearTimeout(inactivityTimeout);
            inactivityTimeout = null;
        }
    });



    // RESET 버튼 클릭
    resetBtn.addEventListener("click", () => {
        clearInterval(timerInterval);
        timerInterval = null;
        startTime = 0;
        elapsedTime = 0;

        if (inactivityTimeout) {
            clearTimeout(inactivityTimeout);
            inactivityTimeout = null;
        }

        // 큰 타이머, 작은 타이머 동시에 리셋
        display.textContent = "00:00:00";
        if (pipDisplay) {
            pipDisplay.textContent = "00:00:00";
        }

    });

    miniAlertClose.addEventListener("click", () => {
        miniAlert.classList.remove("show");
    });
}


//딴짓 감지
function resetInactivityTimer() {
    if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
    }

    if (timerInterval) {
        const marqueeContent = document.querySelector('.status-marquee-content');
        
        
        if (marqueeContent) {
            marqueeContent.classList.remove('marquee-alert'); 
            const spans = marqueeContent.querySelectorAll('span');
            spans.forEach(span => { span.textContent = '열심히 집중중!'; });
        }

        // 지정된 시간 동안 멈춰있을 때 실행할 타임아웃 설정
        inactivityTimeout = setTimeout(() => {
            stopBtn.click(); // 타이머 정지

            // 딴짓 상태 UI 전광판 적용
            if (marqueeContent) {
                marqueeContent.classList.add('marquee-alert'); 
                const spans = marqueeContent.querySelectorAll('span');
                spans.forEach(span => { span.textContent = '딴짓 감지!'; });
            }

            //미니알림보여주기
            if (miniAlert) {
                miniAlert.classList.add("show"); 
            }
        }, INACTIVE_LIMIT);
    }
}



//미니 위젯(PIP)
//모달창과 pip비교.
//위치? 내부 / 외부
//항상 위에 표시 가능? NO / YES
//제어? 원래 만들어둔 규칙을 그대로 따라간다 / 만들 때마다 해줘야함
// => pip은 메인의 자식이 아닌 독립된 도큐먼트 (아무것도 연결되어있지XX)
//모든 브라우저 지원? YES / NO



async function togglePipWidget() {
    //async : 비동기 함수
    //async를 사용하면 함수 내에서 await를 사용할 수 있다.
    //시간이 걸리는 작업을 먼저 브라우저에게 넘긴뒤, 다음 코드를 실행
    //시간이 지나고 차례가 되면 해당 작업 실행

    //시간이 되지 않았으면 팽하고 계속 뒤로 보내는 것

    //1. 콜 스택 (Call Stack) : 실행해야하는 코드들이 쌓이는 곳.
    //2. 백그라운드 (Web APIs):시간이 걸리는 작업들을 대신 맡아서 처리해 주는 브라우저의 전용 공간
    //3. 3. 태스크 큐 (Task Queue):백그라운드에서 심부름이 끝난 작업들이 다시 실행되기 위해 차례대로 서는 대기줄


    if ('documentPictureInPicture' in window) {
        //모든 브라우저가 이 pip을 사용할 수 있을지 모름 -> 먼저 if문으로 확인을 한다.
        try {
            const pipWindow = await window.documentPictureInPicture.requestWindow({
                width: 280,
                height: 65,
            });
            pipWindow.document.body.classList.add('pip-body');

            // append는 이동. 숨겨뒀던 타이머가 pip으로 이동한다.
            pipWindow.document.body.append(timerWidgetBar);

            // 본문 스타일 시트 복사
            // ... : 유사배열
            //1. [] 진짜 배열 준비
            //2. ...document.styleSheets를 넣으면 []에 내용물이 펼쳐짐
            //3. 진짜 배열이 완성 -> 이제 for Each를 쓸 수 있다.

            //const numbers = [1, 2, 3];
            //console.log(numbers);    // [1, 2, 3] 
            //console.log(...numbers); // 1 2 3 <- 펼쳤다.

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

            //pagehide : PIP 팝업창이 닫히거나 파괴될 때 발생하는 브라우저 생명주기(Lifecycle) 이벤트(서블릿과는 완전 무관)
            pipWindow.addEventListener('pagehide', (event) => {
                document.body.appendChild(timerWidgetBar);
                //위젯을 끄면 있던 자리(안보임)으로 돌아온다.
                // document.body -> (appendChild) -> 메인 화면의 DOM 트리
            });

        } catch (error) {
            console.error('위젯 분리 실패:', error);
        }
    } else {
        //위에 적었던 if문이 false일 때 출력
        alert("이 브라우저는 타이머 분리(PIP) 기능을 지원하지 않습니다.");

    }
}



//메모장
function toMemo() {
    const memoInput = document.getElementById('memo-input');

    const MAX_BYTES = 238; //바이트 제한

    //저장된 메모 불러오기
    const savedMemo = localStorage.getItem('autosave-memo');
    if (savedMemo !== null) {
        memoInput.value = savedMemo;
    }
    
    //오토세이브
    memoInput.addEventListener('input', () => {
        //한,영 바이트 계산
        let currentBytes = 0;
        let filteredText = "";

        for (let i = 0; i < memoInput.value.length; i++) {
            const char = memoInput.value[i];
            
            // 한글(유니코드)은 2바이트, 영어/숫자/공백은 1바이트로 계산
            if (escape(char).length > 4) {
                currentBytes += 2;
            } else {
                currentBytes += 1;
            }

            // 설정한 최대 바이트(238)를 넘지 않을 때까지만 문자열에 누적
            if (currentBytes <= MAX_BYTES) {
                filteredText += char;
            } else {
                break; // 허용 용량 초과 시 반복문 즉시 종료 (글자 차단)
            }
        }

        // 입력창의 값을 계산된 제한 글자까지만 남기도록 강제 갱신
        memoInput.value = filteredText;


        localStorage.setItem('autosave-memo', memoInput.value);
    });
}