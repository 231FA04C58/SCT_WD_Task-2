// --- DOM Elements ---
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const millisecondsDisplay = document.getElementById('milliseconds');

const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resetButton = document.getElementById('resetButton');
const lapButton = document.getElementById('lapButton');
const moodToggleButton = document.getElementById('moodToggleButton');
const exportLapsButton = document.getElementById('exportLapsButton');

const lapList = document.getElementById('lapList');

const currentDateDisplay = document.getElementById('currentDate');
const currentTimeDisplay = document.getElementById('currentTime');
const stopwatchDisplay = document.getElementById('stopwatchDisplay');

// --- Stopwatch Variables ---
let totalMilliseconds = 0;
let timerInterval;
let isRunning = false;
let lapCounter = 0;
let startTime = 0;
let glitchInterval = null;

// --- Helper Function to Format Time ---
function formatTime(unit) {
    return unit < 10 ? '0' + unit : unit;
}

function updateDateTime() {
    const now = new Date();
    const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }; 

    currentDateDisplay.textContent = now.toLocaleDateString('en-US', dateOptions);
    currentTimeDisplay.textContent = now.toLocaleTimeString('en-US', timeOptions);
}

function updateDisplay() {
    const minutes = Math.floor(totalMilliseconds / 60000);
    const seconds = Math.floor((totalMilliseconds % 60000) / 1000);
    const milliseconds = Math.floor((totalMilliseconds % 1000) / 10);

    minutesDisplay.textContent = formatTime(minutes);
    secondsDisplay.textContent = formatTime(seconds);
    millisecondsDisplay.textContent = formatTime(milliseconds);

    saveStopwatchState();
}

function saveStopwatchState() {
    const state = {
        totalMilliseconds: totalMilliseconds,
        isRunning: isRunning,
        lapTimes: lapList.innerHTML, 
        lapCounter: lapCounter,
        startTime: startTime 
    };
    localStorage.setItem('stopwatchState', JSON.stringify(state));
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

function loadStopwatchState() {
    const savedState = localStorage.getItem('stopwatchState');
    if (savedState) {
        const state = JSON.parse(savedState);
        totalMilliseconds = state.totalMilliseconds;
        isRunning = state.isRunning; 
        lapList.innerHTML = state.lapTimes;
        lapCounter = state.lapCounter;
        startTime = state.startTime;

        updateDisplay(); 

        if (isRunning) {
            const timeElapsedSinceLastSave = Date.now() - startTime;
            totalMilliseconds += timeElapsedSinceLastSave;
            startStopwatch(); 
        } else {
            startButton.disabled = false;
            pauseButton.disabled = true;
            lapButton.disabled = totalMilliseconds === 0;
            updateStartButtonText();
        }
    } else {
        startButton.disabled = false;
        pauseButton.disabled = true;
        lapButton.disabled = true;
        updateStartButtonText();
    }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
    
    updateActiveButtonStates(); 
}

function startGlitchEffect() {
    stopGlitchEffect(); 
    glitchInterval = setInterval(() => {
        const randomX = Math.random() * 5 - 2.5; 
        const randomY = Math.random() * 5 - 2.5; 
        stopwatchDisplay.style.setProperty('--random-x', randomX);
        stopwatchDisplay.style.setProperty('--random-y', randomY);
        stopwatchDisplay.classList.add('glitch');
        setTimeout(() => {
            stopwatchDisplay.classList.remove('glitch');
        }, 100); 
    }, Math.random() * (5000 - 1000) + 1000); 
}

function stopGlitchEffect() {
    clearInterval(glitchInterval);
    glitchInterval = null;
    stopwatchDisplay.classList.remove('glitch');
}

function startStopwatch() {
    clearInterval(timerInterval);

    isRunning = true;
    startTime = Date.now() - totalMilliseconds;

    timerInterval = setInterval(() => {
        totalMilliseconds = Date.now() - startTime;
        updateDisplay();
    }, 10);

    startButton.disabled = true;
    pauseButton.disabled = false;
    lapButton.disabled = false;
    startGlitchEffect(); 
    updateActiveButtonStates(); 
    updateStartButtonText(); 
}

function pauseStopwatch() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
        saveStopwatchState();

        startButton.disabled = false;
        pauseButton.disabled = true;
        lapButton.disabled = false;
        stopGlitchEffect();
         startButton.textContent = 'Resume'; 
    }
    updateActiveButtonStates(); 
    updateStartButtonText(); 
}

function resetStopwatch() {
    clearInterval(timerInterval);
    isRunning = false;

    totalMilliseconds = 0;
    lapCounter = 0;
    startTime = 0; 

    updateDisplay(); 
    
    lapList.innerHTML = ''; 

    localStorage.removeItem('stopwatchState'); 

    startButton.disabled = false;
    pauseButton.disabled = true;
    lapButton.disabled = true;
    stopGlitchEffect(); 

    updateActiveButtonStates(); 
    updateStartButtonText(); 
}

function recordLap() {
    if (isRunning || totalMilliseconds > 0) { 
        lapCounter++;
        const lapTime = `${minutesDisplay.textContent}:${secondsDisplay.textContent}:${millisecondsDisplay.textContent}`;

        const listItem = document.createElement('li');
        listItem.innerHTML = `<span>Lap ${lapCounter}:</span> <span>${lapTime}</span>`;
        lapList.appendChild(listItem);

        lapList.scrollTop = lapList.scrollHeight; 
    }
}

function exportLaps() {
    const laps = [];
    laps.push("Lap Number,Time"); 

    lapList.querySelectorAll('li').forEach(item => {
        const lapNum = item.querySelector('span:first-child').textContent.replace('Lap ', '').replace(':', '');
        const lapTime = item.querySelector('span:last-child').textContent;
        laps.push(`${lapNum},${lapTime}`);
    });

    const csvContent = laps.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `stopwatch_laps_${new Date().toISOString().slice(0, 10)}.csv`; 
    document.body.appendChild(a); 
    a.click(); 
    document.body.removeChild(a); 
    URL.revokeObjectURL(url); 
}

function updateStartButtonText() {
    if (totalMilliseconds > 0 && !isRunning) {
        startButton.textContent = 'Resume';
    } else {
        startButton.textContent = 'Start';
    }
}

function toggleMood() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

function updateActiveButtonStates() {
    startButton.classList.remove('active');
    pauseButton.classList.remove('active');

    if (isRunning) {
        startButton.classList.add('active');
    } else if (totalMilliseconds > 0) { 
        pauseButton.classList.add('active');
    }
}

startButton.addEventListener('click', startStopwatch);
pauseButton.addEventListener('click', pauseStopwatch);
resetButton.addEventListener('click', resetStopwatch);
lapButton.addEventListener('click', recordLap);
moodToggleButton.addEventListener('click', toggleMood);
exportLapsButton.addEventListener('click', exportLaps); 

window.addEventListener('load', () => {
    loadStopwatchState();
    updateDateTime(); 
    setInterval(updateDateTime, 1000); 
});

window.addEventListener('beforeunload', saveStopwatchState);