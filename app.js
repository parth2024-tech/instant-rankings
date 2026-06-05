// Timer & Audio Engine State
const TIMER_MODES = {
    focus: { duration: 25 * 60, label: 'Deep Work' },
    'short-break': { duration: 5 * 60, label: 'Short Break' },
    'long-break': { duration: 15 * 60, label: 'Long Break' }
};

let currentMode = 'focus';
let timeLeft = TIMER_MODES[currentMode].duration;
let timerInterval = null;
let isRunning = false;

// Web Audio API Context & Nodes
let audioCtx = null;
let noiseNode = null;
let rainNode = null;
let gainNoise = null;
let gainRain = null;

// DOM Elements
const timeLeftEl = document.getElementById('time-left');
const timerLabelEl = document.getElementById('timer-label');
const toggleBtn = document.getElementById('toggle-timer');
const resetBtn = document.getElementById('reset-timer');
const progressCircle = document.querySelector('.progress-ring__circle');
const modeButtons = document.querySelectorAll('.timer-mode-btn');

// Todo State & Elements
let selectedTodoId = null;
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');

// Progress Circle Setup
const radius = progressCircle.r.baseVal.value;
const circumference = radius * 2 * Math.PI;
progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressCircle.style.strokeDashoffset = 0;

function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
}

// Timer Functions
function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timeLeftEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Title updates
    document.title = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} - ZenFocus`;

    // Progress percentage
    const maxDuration = TIMER_MODES[currentMode].duration;
    const percent = ((maxDuration - timeLeft) / maxDuration) * 100;
    setProgress(percent);
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    toggleBtn.textContent = 'Pause Session';
    toggleBtn.classList.remove('btn-glow');
    
    initAudioContext();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            isRunning = false;
            playAlarmSound();
            logSession();
            resetTimer();
        }
    }, 1000);
}

function pauseTimer() {
    if (!isRunning) return;
    isRunning = false;
    toggleBtn.textContent = 'Resume Session';
    toggleBtn.classList.add('btn-glow');
    clearInterval(timerInterval);
    timerInterval = null;
}

function resetTimer() {
    pauseTimer();
    timeLeft = TIMER_MODES[currentMode].duration;
    toggleBtn.textContent = 'Start Session';
    updateDisplay();
}

function switchMode(newMode) {
    currentMode = newMode;
    modeButtons.forEach(btn => {
        if (btn.dataset.mode === newMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    timerLabelEl.textContent = TIMER_MODES[newMode].label;
    resetTimer();
}

function logSession() {
    const sessionDate = new Date();
    const formattedTime = sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const formattedDate = sessionDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    
    let label = TIMER_MODES[currentMode].label;
    if (currentMode === 'focus' && selectedTodoId) {
        const todos = JSON.parse(localStorage.getItem('zenfocus_todos') || '[]');
        const activeTodo = todos.find(t => t.id === selectedTodoId);
        if (activeTodo) {
            label = `Focus: ${activeTodo.text}`;
        }
    }
    const durationMins = Math.round(TIMER_MODES[currentMode].duration / 60);

    const logEntry = {
        mode: currentMode,
        label: label,
        duration: durationMins,
        time: formattedTime,
        date: formattedDate,
        timestamp: sessionDate.getTime()
    };

    // Save to LocalStorage
    let logs = JSON.parse(localStorage.getItem('zenfocus_logs') || '[]');
    logs.unshift(logEntry);
    localStorage.setItem('zenfocus_logs', JSON.stringify(logs));

    // Update statistics computations
    updateStatsDashboard();
}

function updateStatsDashboard() {
    const logs = JSON.parse(localStorage.getItem('zenfocus_logs') || '[]');
    
    // Total sessions
    const totalSessions = logs.length;
    document.getElementById('stat-total-sessions').textContent = totalSessions;

    // Total focus duration
    const totalDuration = logs.reduce((sum, item) => sum + (item.mode === 'focus' ? item.duration : 0), 0);
    document.getElementById('stat-focus-time').textContent = `${totalDuration}m`;

    // Streak calculation
    let streak = 0;
    if (logs.length > 0) {
        const uniqueDays = new Set(logs.map(item => item.date));
        streak = uniqueDays.size;
    }
    document.getElementById('stat-streak').textContent = streak;

    // Render list
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    if (logs.length === 0) {
        historyList.innerHTML = '<li class="empty-state">No focus logs recorded yet. Start a session to log stats!</li>';
    } else {
        logs.slice(0, 5).forEach(item => {
            const li = document.createElement('li');
            li.className = 'history-item';
            
            // Emoji indicator
            const emoji = item.mode === 'focus' ? '🎯' : '☕';
            
            li.innerHTML = `
                <span>${emoji} ${item.label} (${item.duration}m)</span>
                <span class="history-time">${item.date}, ${item.time}</span>
            `;
            historyList.appendChild(li);
        });
    }
}

// Trigger initial load of stats
document.addEventListener('DOMContentLoaded', updateStatsDashboard);
updateStatsDashboard();


// Audio Synthesizers using Web Audio API
function initAudioContext() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Setup white noise
    noiseNode = createWhiteNoiseNode();
    gainNoise = audioCtx.createGain();
    gainNoise.gain.value = 0;
    if (noiseNode) {
        noiseNode.connect(gainNoise);
        gainNoise.connect(audioCtx.destination);
        noiseNode.start();
    }

    // Setup rain generator
    rainNode = createRainNode();
    gainRain = audioCtx.createGain();
    gainRain.gain.value = 0;
    if (rainNode) {
        rainNode.connect(gainRain);
        gainRain.connect(audioCtx.destination);
        rainNode.start();
    }
}

function createWhiteNoiseNode() {
    if (!audioCtx) return null;
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = audioCtx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    return whiteNoise;
}

function createRainNode() {
    if (!audioCtx) return null;
    // Synthesize low-frequency rumble + high pitch taps for rain effect
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise approximation filter
        output[i] = (lastOut * 0.95 + white * 0.05);
        lastOut = output[i];
        output[i] *= 2.5; // Gain adjustment
    }
    const rain = audioCtx.createBufferSource();
    rain.buffer = noiseBuffer;
    rain.loop = true;
    return rain;
}

function playAlarmSound() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 1.5);
}

// Event Listeners for controls
toggleBtn.addEventListener('click', () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

resetBtn.addEventListener('click', resetTimer);

modeButtons.forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

// Sound Volume Controllers
document.getElementById('vol-noise').addEventListener('input', (e) => {
    initAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const val = parseFloat(e.target.value) / 100;
    if (gainNoise) {
        gainNoise.gain.setValueAtTime(val * 0.15, audioCtx.currentTime);
    }
});

document.getElementById('vol-rain').addEventListener('input', (e) => {
    initAudioContext();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const val = parseFloat(e.target.value) / 100;
    if (gainRain) {
        gainRain.gain.setValueAtTime(val * 0.25, audioCtx.currentTime);
    }
});

// Theme Selection Control
const themeButtons = document.querySelectorAll('.theme-btn');
themeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        themeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Remove existing theme classes from body
        document.body.className = '';
        
        // Apply new theme
        const newTheme = `theme-${btn.dataset.theme}`;
        document.body.classList.add(newTheme);
    });
});

// Focus Objectives Functions
function renderTodos() {
    const todos = JSON.parse(localStorage.getItem('zenfocus_todos') || '[]');
    todoList.innerHTML = '';
    
    if (todos.length === 0) {
        todoList.innerHTML = '<li class="empty-state">No focus objectives set yet. Add one above!</li>';
        selectedTodoId = null;
        return;
    }

    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.id === selectedTodoId ? 'active-focus' : ''} ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = todo.id;
        
        li.innerHTML = `
            <div class="todo-checkbox-container">
                <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                <span class="todo-text">${todo.text}</span>
            </div>
            <button class="btn-todo-delete" title="Delete Task">&times;</button>
        `;

        // Click on row to set as active focus task
        li.addEventListener('click', (e) => {
            if (e.target.classList.contains('todo-checkbox') || e.target.classList.contains('btn-todo-delete')) {
                return;
            }
            if (todo.completed) return; // Cannot focus completed items
            selectedTodoId = (selectedTodoId === todo.id) ? null : todo.id;
            renderTodos();
        });

        // Checkbox complete event
        li.querySelector('.todo-checkbox').addEventListener('change', (e) => {
            todo.completed = e.target.checked;
            if (todo.completed && selectedTodoId === todo.id) {
                selectedTodoId = null;
            }
            localStorage.setItem('zenfocus_todos', JSON.stringify(todos));
            renderTodos();
        });

        // Delete button event
        li.querySelector('.btn-todo-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            const filtered = todos.filter(t => t.id !== todo.id);
            if (selectedTodoId === todo.id) {
                selectedTodoId = null;
            }
            localStorage.setItem('zenfocus_todos', JSON.stringify(filtered));
            renderTodos();
        });

        todoList.appendChild(li);
    });
}

todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text) return;

    const newTodo = {
        id: Date.now().toString(),
        text: text,
        completed: false
    };

    const todos = JSON.parse(localStorage.getItem('zenfocus_todos') || '[]');
    todos.push(newTodo);
    localStorage.setItem('zenfocus_todos', JSON.stringify(todos));

    todoInput.value = '';
    renderTodos();
});

// Load todos initially
renderTodos();

// Initial draw
updateDisplay();
