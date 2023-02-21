const API_KEY = 'NssCU4xKharIlFgih+IHXA==D8tanMmOq4QitkWr';
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const WORD_GROUPS = 3;
const WORDS_PER_WAVE = 5;
const MISSILE_SPEED = 350;
let mobile = false;
let nthChild = null;
let wordIndex = null;
let gameProgress = null;
let gameStarted = false;
let firstStart = false;
let firstLetterFound = false;
let isGameOver = false;
let wordObjects = [];
let wordsArray = [];
let wordGroups = [];
let firstLetterArray = [];
let firstLetterGroups = [];
let streaks = [];
let firstLetterHistory = [];
let matchWord = null;
let typedLetter = '';
let visibleWords = WORDS_PER_WAVE;
let waveCount = 1;
let correct = 0;
let streak = 0;
let allTypedCount = 0;
let loadingInterval = 0;
let first, second, third, fourth, fifth;

class Word {
    constructor(text = null) {
        this._element = null;
        this._field = document.querySelector('.words');
        this._text = text;
        this._speed = Math.floor(Math.random() * 10000 + 10000 + this._text.length * 1000);
        this._x = null;
        this._y = null;
        this._move = null;
    }

    render(text) {
        if (text) {
            this._text = text;
        }
        const letters = this._text.split('');
        const min = 20;
        const max = this._field.offsetWidth - 100;
        this._x = Math.floor(Math.random() * (max - min) + min);
        this._y = Math.floor(Math.random() * -50);

        let div = document.createElement('div');
        div.classList.add('word', 'hidden');
        letters.forEach(letter => {
            const span = document.createElement('span');
            span.innerText = letter.toLowerCase();
            div.appendChild(span);
        });
        this._field.appendChild(div);
        this._element = this._field.lastElementChild;
    }

    move() {
        const character = document.querySelector('.character');
        this._element.classList.remove('hidden');
        this._element.style.left = `${this._x}px`;
        this._element.style.top = `${this._y}px`;

        const wordMoving = [
            { left: `${character.offsetLeft - 10}px`, top: `${character.offsetTop + 10}px` }
        ];
        const time = {
            duration: this._speed,
            delay: 200,
            iterations: 1
        }
        this._move = this._element.animate(wordMoving, time);
    }

    collision() {
        const character = document.querySelector('.character');
        let targetY = character.offsetTop + 10;
        if (this._element.offsetTop >= targetY && !this._element.style.opacity) {
            return true;
        }
        return false;
    }

    hit() {
        setTimeout(() => {
            this._move.pause();
            setTimeout(() => {
                this._move.play()
            }, 250);
        }, MISSILE_SPEED);
    }
}

class Typewriter {
    constructor(element, text, speed) {
        this._element = element;
        this._text = text;
        this._speed = speed;
        this._interval = null;
    }

    start(loop = true, hidden = false, reverse = false) {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
        if (!this._interval) {
            this._element.style.display = 'block';
            let i = 0;
            if (reverse) {
                i = this._text.length - 1;
                this._element.style.setProperty('--blinkingCursor-speed', '0.5s');
            }
            this._interval = setInterval(() => {
                if (i < this._text.length && !reverse) {
                    this._element.innerHTML += this._text.charAt(i);
                    i++;
                } else if (i >= 0 && reverse) {
                    this._element.innerHTML = this._text.slice(0, i);
                    i--;
                } else {
                    if (loop) {
                        this._element.innerHTML = '';
                        i = 0;
                    } else {
                        clearInterval(this._interval);
                        if (hidden) {
                            this._element.style.setProperty('--blinkingCursor-speed', '0s');
                        }
                    }
                }
            }, this._speed);
        }
        return reverse;
    }

    stop() {
        clearInterval(this._interval);
        this._interval = null;
        this._element.innerHTML = '';
        this._element.style.display = 'none';
    }

    length() {
        return this._text.length;
    }
}

window.addEventListener('load', (e) => {
    const title = document.querySelector('#title');
    const field = document.querySelector('.words');
    const startBtn = document.querySelector('#startBtn');
    const character = document.querySelector('.character');
    const header = document.querySelector('.header');
    const waveCleared = document.querySelector('.wave');
    const loadingSection = document.querySelector('#loading');
    const typeWriterLoading = document.querySelector("#typeWriterLoading");
    const intervalSpeed = 150;    
    const loading = new Typewriter(typeWriterLoading, 'LOADING', intervalSpeed);
    const titleTW = new Typewriter(
        document.querySelector('.text>h1'),
        'GoType',
        intervalSpeed
    );
    const subTitleTW = new Typewriter(
        document.querySelector('.text>h4'),
        'Type to shoot',
        intervalSpeed
    );
    loading.start();

    renderWords();
    async function renderWords() {
        let isComplete = false;

        if (!isComplete && wordsArray.length < WORDS_PER_WAVE && wordGroups.length < WORD_GROUPS) {
            await fetchRandomWord()
                .then((response) => {
                    let word = response.word.toLowerCase();
                    if (!firstLetterArray.includes(word.charAt(0))) {
                        wordsArray.push(word);
                        firstLetterArray.push(word.charAt(0));

                        if (wordsArray.length === WORDS_PER_WAVE) {
                            firstLetterGroups.push(firstLetterArray);
                            wordGroups.push(wordsArray);
                            firstLetterArray = [];
                            wordsArray = [];
                        }
                    }

                    if (wordGroups.length === WORD_GROUPS) {
                        isComplete = true;
                    } else {
                        renderWords();
                    }
                });
        }

        if (isComplete == true && !firstStart) {
            firstStart = true;
            loading.stop();
            loadingSection.classList.toggle('hidden');
            title.classList.toggle('hidden');
            titleTW.start(false, true);

            setTimeout(() => {
                subTitleTW.start(false);
                setTimeout(() => {
                    startBtn.classList.toggle('hidden');
                }, intervalSpeed * subTitleTW.length() + 250);
            }, intervalSpeed * titleTW.length() + 250);

            first = new Word(wordGroups[0][0]);
            second = new Word(wordGroups[0][1]);
            third = new Word(wordGroups[0][2]);
            fourth = new Word(wordGroups[0][3]);
            fifth = new Word(wordGroups[0][4]);
            first.render();
            second.render();
            third.render();
            fourth.render();
            fifth.render();
        }
    };

    window.addEventListener('keydown', (e) => {
        validateKey(e.key);
    });

    window.addEventListener('click', (e) => {
        if (e.target.closest('.keyboard-btn')) {
            validateKey(e.target.closest('.keyboard-btn').value);
        }
    });

    function validateKey(key) {
        if (gameStarted) {
            if (ALPHABET.includes(key.toLowerCase())) {
                if (!firstLetterFound) {
                    wordIndex = firstLetterGroups[0].indexOf(key);
                    if (wordIndex >= 0 && !firstLetterHistory.includes(key)) {
                        firstLetterHistory.push(firstLetterGroups[0][wordIndex]);
                        firstLetterFound = true;
                        matchWord = wordGroups[0][wordIndex];
                        nthChild = document.querySelector(`.word:nth-child(${wordIndex + 1})`);
                        nthChild.classList.toggle('damaged');
                        updateGame(key);
                    }
                    if (!firstLetterFound) {
                        updateGame();
                    }
                } else {
                    if (key === matchWord[typedLetter.length]) {
                        updateGame(key);
                    } else {
                        updateGame();
                    }
                    if (typedLetter === matchWord) {
                        firstLetterArray.splice(firstLetterArray.indexOf(matchWord[0]), 1);
                        wordsArray.splice(wordsArray.indexOf(matchWord), 1);
                        matchWord = null;
                        typedLetter = '';
                        firstLetterFound = false;
                        visibleWords--;
                        const element = nthChild;
                        setTimeout(() => {
                            element.style.opacity = 0;
                            document.querySelectorAll('.missile').forEach(missile => missile.remove());
                        }, 501);
                    }
                    if (visibleWords === 0) {
                        clearInterval(gameProgress);
                        waveCount++;
                        waveCleared.classList.toggle('show-wave');
                        gameStarted = false;
                        renderWords();
                        wordGroups.shift();
                        firstLetterGroups.shift();
                        firstLetterHistory = [];

                        setTimeout(() => {
                            field.innerHTML = '';
                            first.render(wordGroups[0][0]);
                            second.render(wordGroups[0][1]);
                            third.render(wordGroups[0][2]);
                            fourth.render(wordGroups[0][3]);
                            fifth.render(wordGroups[0][4]);
                            startGame();
                            visibleWords = WORDS_PER_WAVE;
                            setWaveClearedPanel();
                        }, 3000);
                    }
                }
            }
        }
    }

    startBtn.addEventListener('click', (e) => {
        startBtn.classList.toggle('hidden');
        subTitleTW.start(false, false, true);
        setTimeout(() => {
            titleTW.start(false, false, true);
            setTimeout(() => {
                title.classList.toggle('hidden');
                header.classList.toggle('slide-up');
                character.classList.toggle('slide-down');
                toggleKeyboard();
                startGame();
            }, intervalSpeed * titleTW.length() + 250);
        }, intervalSpeed * subTitleTW.length() + 250);
    });

    const newGameBtn = document.querySelector('#newGameBtn');
    newGameBtn.addEventListener('click', (e) => {
        const gameOverPanel = document.querySelector('#gameOver');
        gameOverPanel.classList.toggle('hidden');

        gameStarted = false;
        wordsArray = [];
        wordGroups.shift();
        firstLetterArray = [];
        firstLetterGroups.shift();
        firstLetterHistory = [];
        firstLetterFound = false;
        matchWord = null;
        typedLetter = '';
        visibleWords = WORDS_PER_WAVE;
        waveCount = 1;
        correct = 0;
        streak = 0;
        streaks = [];
        allTypedCount = 0;
        nthChild = null;
        wordIndex = null;

        title.classList.toggle('hidden');
        titleTW.start(false, true);
        setTimeout(() => {
            subTitleTW.start(false);
            setTimeout(() => {
                startBtn.classList.toggle('hidden');
            }, intervalSpeed * subTitleTW.length());
        }, intervalSpeed * titleTW.length());

        if (wordGroups.length === 1) {
            renderWords();
        }
    });

});

function toggleKeyboard() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        const keyboard = document.querySelector('.mobile-keyboard');
        keyboard.classList.toggle('show-keyboard');
        mobile = true;
    }
}

function hit(nthWord) {
    if (nthWord === 0) {
        first.hit();
    } else if (nthWord === 1) {
        second.hit();
    } else if (nthWord === 2) {
        third.hit();
    } else if (nthWord === 3) {
        fourth.hit();
    } else if (nthWord === 4) {
        fifth.hit();
    }
}

function startGame() {
    const waveBoard = document.querySelector('#wave');
    const launcher = document.querySelector('.missiles');

    waveBoard.innerText = waveCount;
    launcher.innerHTML = '';

    if (isGameOver) {
        first.render(wordGroups[0][0]);
        second.render(wordGroups[0][1]);
        third.render(wordGroups[0][2]);
        fourth.render(wordGroups[0][3]);
        fifth.render(wordGroups[0][4]);
        isGameOver = false;
    }

    gameStarted = true;
    first.move();
    second.move();
    third.move();
    fourth.move();
    fifth.move();

    gameProgress = setInterval(() => {
        if (first.collision() || second.collision() || third.collision() || fourth.collision() || fifth.collision()) {
            clearInterval(gameProgress);
            gameOver();
        }
    }, 250);
}

function updateGame(key = null) {
    if (key) {
        typedLetter += key;
        nthChild.children[typedLetter.length - 1].classList.add('is-hit');
        correct++;
        streak++;
        allTypedCount++;

        shootMissiles(nthChild);
        hit(wordIndex);
        setStats();
    } else {
        if (streak !== 0) {
            streaks.push(streak);
        }

        streak = 0;
        allTypedCount++;
        setStats();
    }
}

function shootMissiles(target) {
    const character = document.querySelector('.character');
    const fieldWidth = document.querySelector('.words').offsetWidth;
    const fieldHeight = document.querySelector('.words').offsetHeight;
    const launcher = document.querySelector('.missiles');

    let spanMissile = document.createElement('span');
    spanMissile.classList.add('missile');
    launcher.appendChild(spanMissile);

    let left = target.offsetLeft + target.offsetWidth / 2 - fieldWidth / 2;
    let top = target.offsetTop - fieldHeight + 50;
    let rotate = left / 8.5;
    
    character.style.transform = `rotate(${rotate}deg)`;
    launcher.lastChild.style.transform = `rotate(${rotate}deg)`;

    if (mobile) {
        top += 120;
    }

    const wordMoving = [
        { transform: `translate(${left}px, ${top}px)`, opacity: 1}
    ]
    const time = {
        duration: MISSILE_SPEED,
        iterations: 1
    }
    launcher.lastChild.animate(wordMoving, time);
}

function setStats() {
    const streakBoard = document.querySelector('#streak');
    const scoreBoard = document.querySelector('#score');

    streakBoard.innerText = streak;
    scoreBoard.innerText = correct;
}

function setWaveClearedPanel() {
    const waveCleared = document.querySelector('.wave');
    const waveNumber = document.querySelector('#waveCleared');

    waveCleared.classList.remove('show-wave');
    waveNumber.innerText = waveCount;
}

function gameOver() {
    const field = document.querySelector('.words');
    const longestStreak = document.querySelector('#goLongestStreak');
    const score = document.querySelector('#goScore');
    const accuracy = document.querySelector('#goAccuracy');
    const wave = document.querySelector('#goWave');
    const gameOverPanel = document.querySelector('#gameOver');
    const header = document.querySelector('.header');
    const character = document.querySelector('.character');
    const launcher = document.querySelector('.missiles');

    let longest = Math.max(...streaks, streak);

    isGameOver = true;
    wave.innerText = waveCount - 1;
    longestStreak.innerText = longest;
    score.innerText = correct;
    accuracy.innerText = `${(correct / allTypedCount * 100 || 0).toFixed(2)}%`;

    toggleKeyboard();

    character.classList.toggle('slide-down');
    header.classList.toggle('slide-up');
    setTimeout(() => {
        gameOverPanel.classList.toggle('hidden');
    }, 500);

    field.innerHTML = '';
    launcher.innerHTML = '';
}

async function fetchRandomWord() {
    const options = {
        method: 'GET',
        headers: { 'X-Api-Key': `${API_KEY}` }
    };

    return fetch('https://api.api-ninjas.com/v1/randomword', options)
        .then(response => response.json());
}