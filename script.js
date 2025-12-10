document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const tempoInput = document.getElementById('tempo');
    const gameArea = document.getElementById('game-area');
    const targetLine = document.getElementById('target-line');
    const scoreDisplay = document.getElementById('score-display');

    // ** LAGE NOTEN REEKS **
    const initialSequence = [
        { note: 'Lage D', duration: 2 },  
        { note: 'Lage C', duration: 1 },  
        { note: 'Lage Bes', duration: 4 },
        { note: 'Lage D', duration: 1 },
        { note: 'Lage C', duration: 2 },
        { note: 'Lage Bes', duration: 2 },
    ];
    let noteSequence = []; 

    let isPlaying = false;
    let audioContext;
    let beatTimer;
    let currentBarIndex = 0;
    const notesPerBar = 4; // Kwartnoten

    // --- AUDIO LOGICA (Simpele metronoom) ---
    function setupAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playBeat(time) {
        if (!isPlaying) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        const beatCount = currentBarIndex % notesPerBar;
        oscillator.frequency.setValueAtTime(beatCount === 0 ? 880 : 440, time); 
        
        gainNode.gain.setValueAtTime(0.5, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(time);
        oscillator.stop(time + 0.1);
    }

    function scheduler() {
        const tempo = parseInt(tempoInput.value);
        const beatDuration = 60 / tempo;

        if (audioContext.currentTime + 0.1 < beatTimer) {
             return;
        }

        playBeat(beatTimer);
        currentBarIndex++;
        beatTimer += beatDuration;

        if (currentBarIndex % notesPerBar === 0 && noteSequence.length > 0) {
            scheduleVisualBar(audioContext.currentTime);
        } else if (currentBarIndex % notesPerBar === 0 && noteSequence.length === 0) {
             stopGame();
             return;
        }

        if (isPlaying) {
            setTimeout(scheduler, 50); 
        }
    }

    // --- VISUELE LOGICA (De Duikbalken) ---

    function scheduleVisualBar(startTime) {
        
        const barData = noteSequence.shift();
        const tempo = parseInt(tempoInput.value);
        const barDuration = (60 / tempo) * notesPerBar * barData.duration; 
        
        const barElement = document.createElement('div');
        barElement.classList.add('note-bar');
        
        barElement.innerHTML = `<span class="note-label">${barData.note}</span>`;
        gameArea.appendChild(barElement);
        
        const travelDuration = 2;
        const totalDurationOnScreen = travelDuration + barDuration;

        requestAnimationFrame(() => {
            barElement.style.transition = `transform ${travelDuration}s linear, width ${barDuration}s linear`;
            barElement.style.transform = `translateX(-50%)`;
            barElement.style.width = `50%`;
        });

        setTimeout(() => {
            barElement.style.width = '0%'; 
        }, travelDuration * 1000);

        setTimeout(() => {
            if(gameArea.contains(barElement)) {
                gameArea.removeChild(barElement);
            }
        }, totalDurationOnScreen * 1000);
    }

    // --- START/STOP FUNCTIES ---

    function startGame() {
        if (isPlaying) return;

        setupAudioContext();
        isPlaying = true;
        
        gameArea.innerHTML = '';
        gameArea.appendChild(targetLine);
        currentBarIndex = 0;
        
        noteSequence = [...initialSequence]; 

        beatTimer = audioContext.currentTime + 0.1; 
        
        startButton.textContent = "Stop Duik";
        scheduler();
    }

    function stopGame() {
        isPlaying = false;
        startButton.textContent = "Start Duik";
        scoreDisplay.textContent = "Spel beëindigd. Goed gedaan, blijf doorblazen!";
    }

    startButton.addEventListener('click', () => {
        if (isPlaying) {
            stopGame();
        } else {
            startGame();
        }
    });

    tempoInput.addEventListener('change', () => {
        if (parseInt(tempoInput.value) < 40) tempoInput.value = 40;
        if (parseInt(tempoInput.value) > 120) tempoInput.value = 120;
    });
});
