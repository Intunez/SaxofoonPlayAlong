document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const tempoInput = document.getElementById('tempo');
    const gameArea = document.getElementById('game-area');
    const targetLine = document.getElementById('target-line');
    const scoreDisplay = document.getElementById('score-display');

    // ** LAGE NOTEN REEKS **
    // Dit is de reeks van noten en hun duur in maten. 
    // Bijvoorbeeld: duration: 4 betekent 4 maten lang blazen op de noot.
    const initialSequence = [
        { note: 'Lage D', duration: 2 },  
        { note: 'Lage C', duration: 1 },  
        { note: 'Lage Bes', duration: 4 },
        { note: 'Lage D', duration: 1 },
        { note: 'Lage C', duration: 2 },
        { note: 'Lage Bes', duration: 2 },
    ];
    let noteSequence = []; // Wordt gevuld bij start

    let isPlaying = false;
    let audioContext;
    let beatTimer;
    let currentBarIndex = 0;
    const notesPerBar = 4; // Kwartnoten

    // --- AUDIO LOGICA (Simpele metronoom) ---
    function setupAudioContext() {
        if (!audioContext) {
            // Initialiseer AudioContext bij de eerste klik
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function playBeat(time) {
        if (!isPlaying) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Hogere toon voor de eerste tel (hoofdbeat), lagere voor de rest
        const beatCount = currentBarIndex % notesPerBar;
        oscillator.frequency.setValueAtTime(beatCount === 0 ? 880 : 440, time); 
        
        gainNode.gain.setValueAtTime(0.5, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05); // Snelle fade-out

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.start(time);
        oscillator.stop(time + 0.1);
    }

    function scheduler() {
        const tempo = parseInt(tempoInput.value);
        const beatDuration = 60 / tempo; // Duur van een kwartnoot in seconden

        // We plannen de volgende beat
        if (audioContext.currentTime + 0.1 < beatTimer) {
             return; // De tijd is nog niet rijp voor de volgende noot
        }

        // Speel de beat en plan de volgende
        playBeat(beatTimer);
        currentBarIndex++;
        beatTimer += beatDuration;

        // Visuele balken plannen: De balk komt elke 4 tellen (één maat)
        if (currentBarIndex % notesPerBar === 0 && noteSequence.length > 0) {
            scheduleVisualBar(audioContext.currentTime);
        } else if (currentBarIndex % notesPerBar === 0 && noteSequence.length === 0) {
             // Als de sequence leeg is, stoppen we een maat na de laatste noot
             stopGame();
             return;
        }

        // Blijf herplannen
        if (isPlaying) {
            setTimeout(scheduler, 50); 
        }
    }

    // --- VISUELE LOGICA (De Duikbalken) ---

    function scheduleVisualBar(startTime) {
        
        const barData = noteSequence.shift(); // Haal de volgende noot uit de array
        const tempo = parseInt(tempoInput.value);
        // Totale seconden dat de noot moet duren: (duur kwartnoot * 4 tellen) * aantal maten
        const barDuration = (60 / tempo) * notesPerBar * barData.duration; 
        
        const barElement = document.createElement('div');
        barElement.classList.add('note-bar');
        
        barElement.innerHTML = `<span class="note-label">${barData.note}</span>`;
        gameArea.appendChild(barElement);
        
        // De travelDuration is de tijd die nodig is om van 100% naar de speellijn (50%) te bewegen
        const travelDuration = 2; // (2 seconden)
        const totalDurationOnScreen = travelDuration + barDuration;

        // Start animatie: laat de balk naar het midden bewegen
        requestAnimationFrame(() => {
            barElement.style.transition = `transform ${travelDuration}s linear, width ${barDuration}s linear`;
            barElement.style.transform = `translateX(-50%)`; // Eindpunt: midden van het scherm
            barElement.style.width = `50%`; // Breedte op het moment dat de lijn bereikt wordt
        });

        // Tijd om de noot aan te houden:
        // De leerling moet de noot op dit moment loslaten
        setTimeout(() => {
            barElement.style.width = '0%'; 
        }, travelDuration * 1000);

        // Verwijder de balk nadat deze volledig is verdwenen
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
        
        // Reset en start de sequence
        gameArea.innerHTML = '';
        gameArea.appendChild(targetLine);
        currentBarIndex = 0;
        
        // Reset de notenreeks voor een nieuw spel (gebruik een kopie)
        noteSequence = [...initialSequence]; 

        // Start de timer net iets in de toekomst
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

    // Zorg ervoor dat het tempo een nummer is
    tempoInput.addEventListener('change', () => {
        if (parseInt(tempoInput.value) < 40) tempoInput.value = 40;
        if (parseInt(tempoInput.value) > 120) tempoInput.value = 120;
    });
});
