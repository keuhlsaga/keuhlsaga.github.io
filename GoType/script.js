const API_KEY = 'NssCU4xKharIlFgih+IHXA==D8tanMmOq4QitkWr';
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const WORD_GROUPS = 3;
const WORDS_PER_WAVE = 5;
let monitor = null;
let wordObjects = [];
let gameStarted = false;
let firstStart = false;
let wordsArray = [];
let wordGroups = [];
let firstLetterArray = [];
let firstLetterGroups = [];
let nthChild = null;
let firstLetterFound = false;
let matchWord = '';
let typedLetter = '';
let visibleWords = WORDS_PER_WAVE;
let waveCount = 1;
let correct = 0;
let streak = 0;
let streaks = [];
let allTypedCount = 0;
let loadingInterval = 0;
let isGameOver = false;

class Word {
    constructor(text = null) {
        this._element = null;
        this._field = document.querySelector('.words');
        this._text = text;
        this._speed = Math.floor(Math.random() * 10000 + 10000 + this._text.length * 1000);
        this._x = null;
        this._y = null;
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
        // this._element.style.display = 'block';
        this._element.style.left = `${this._x}px`;
        this._element.style.top = `${this._y}px`;

        let targetX = 0;
        if (this._element.offsetLeft < 100) {
            targetX = 100 - this._element.offsetWidth / 2;
        } else {
            targetX = this._element.offsetWidth / 2 - 100;
        }
        const wordMoving = [
            { left: `${character.offsetLeft - 25}px`, top: `${character.offsetTop}px` }
        ];
        const time = {
            duration: this._speed,
            iterations: 1
        }
        this._element.classList.remove('hidden');
        this._element.animate(wordMoving, time);
    }

    targetHit() {
        const character = document.querySelector('.character');
        let targetY = character.offsetTop - 55;
        console.log(this._text, this._element.offsetTop, targetY);
        if (this._element.offsetTop >= targetY && !this._element.style.opacity) {
            return true;
        }
        return false;
    }

    length() {
        return this._text.length;
    }

    update(text) {
        this._text = text;
        this.render();
    }
}

class Typewriter {
    constructor(element, text, speed) {
        this._element = element;
        this._text = '\u00A0' + text;
        this._speed = speed;
        this._interval = null;
    }

    start(loop = true, hidden = false, reverse = false) {
        this.clear();
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
                            // this._element.style.borderRightColor = 'transparent';
                            this._element.style.setProperty('--blinkingCursor-speed', '0s');
                        }
                    }
                }
            }, this._speed);
        }
        return reverse;
    }

    /* reverse(loop = false) {
        this.clear();
        if (!this._interval) {
            this._element.style.display = 'block';
            this._element.innerHTML = this._text;
            let i = this._text.length - 1;
            this._interval = setInterval(() => {
                if (i >= 0) {
                    this._element.innerHTML = this._text.slice(0, i);
                    i--;
                } else {
                    if (loop) {
                        this._element.innerHTML = this._text;
                        i = this._text.length - 1;
                    } else {
                        clearInterval(this._interval);
                        if (hidden) {
                            this._element.style.borderColor = 'transparent';
                        }
                    }
                }
            }, this._speed);
        }
    } */

    clear() {
        clearInterval(this._interval);
        this._interval = null;
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

let first, second, third, fourth, fifth;

window.addEventListener('load', (e) => {
    // const SHOW_TYPED_TEXT = document.querySelector('#showTypedText');
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
    async function renderWords(j = 0) {
        let isComplete = false;
        console.log(wordsArray.length, wordGroups.length);
        if (!isComplete && wordsArray.length < WORDS_PER_WAVE && wordGroups.length < WORD_GROUPS) {
            await fetchRandomWord()
                .then((response) => {
                    console.log(response);
                    let word = response.word.toLowerCase();
                    console.log(word);
                    if (!firstLetterArray.includes(word.charAt(0))) {
                        wordsArray.push(word);
                        firstLetterArray.push(word.charAt(0));
                        console.log(wordsArray, firstLetterArray);
                        if (wordsArray.length === WORDS_PER_WAVE) {
                            firstLetterGroups.push(firstLetterArray);
                            wordGroups.push(wordsArray);
                            console.log(wordGroups, firstLetterGroups);
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

            // first = new Word();
            // second = new Word();
            // third = new Word();
            // fourth = new Word();
            // fifth = new Word();
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

    let firstLetterHistory = [];
    window.addEventListener('keydown', (e) => {
        if (gameStarted) {
            if (ALPHABET.includes(e.key.toLowerCase())) {
                if (!firstLetterFound) {
                    let wordIndex = firstLetterGroups[0].indexOf(e.key);
                    if (wordIndex >= 0 && !firstLetterHistory.includes(e.key)) {
                        firstLetterHistory.push(firstLetterGroups[0][wordIndex]);
                        firstLetterFound = true;
                        matchWord = wordGroups[0][wordIndex];
                        nthChild = document.querySelector(`.word:nth-child(${wordIndex + 1})`);
                        nthChild.classList.toggle('damaged');
                        updateGame(e.key);
                    }
                    if (!firstLetterFound) {
                        updateGame();
                    }
                } else {
                    if (e.key === matchWord[typedLetter.length]) {
                        updateGame(e.key);
                    } else {
                        updateGame();
                    }
                    if (typedLetter === matchWord) {
                        firstLetterArray.splice(firstLetterArray.indexOf(matchWord[0]), 1);
                        wordsArray.splice(wordsArray.indexOf(matchWord), 1);
                        matchWord = '';
                        typedLetter = '';
                        firstLetterFound = false;
                        visibleWords--;
                        const element = nthChild;
                        setTimeout(() => {
                            element.style.opacity = 0;
                            document.querySelectorAll('.shoot-misile').forEach(misile => misile.remove());
                        }, 501);
                    }
                    if (visibleWords === 0) {
                        clearInterval(monitor);
                        waveCount++;
                        waveCleared.classList.toggle('show-wave');
                        gameStarted = false;
                        renderWords();
                        wordGroups.shift();
                        firstLetterGroups.shift();
                        firstLetterHistory = [];
                        field.innerHTML = '';
                        first.render(wordGroups[0][0]);
                        second.render(wordGroups[0][1]);
                        third.render(wordGroups[0][2]);
                        fourth.render(wordGroups[0][3]);
                        fifth.render(wordGroups[0][4]);
                        console.log(first);
                        setTimeout(() => {
                            startGame();
                            visibleWords = WORDS_PER_WAVE;
                            setWaveClearedPanel();
                        }, 3000);
                    }
                }
            }
        }
    });

    startBtn.addEventListener('click', (e) => {
        const title = document.querySelector('#title');
        startBtn.classList.toggle('hidden');
        subTitleTW.start(false, false, true);
        setTimeout(() => {
            titleTW.start(false, false, true);
            setTimeout(() => {
                title.classList.toggle('hidden');
                header.classList.toggle('slide-up');
                character.classList.toggle('slide-down');
                // character.classList.toggle('hidden');
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
        matchWord = '';
        typedLetter = '';
        visibleWords = WORDS_PER_WAVE;
        waveCount = 1;
        correct = 0;
        streak = 0;
        streaks = [];
        allTypedCount = 0;
        nthChild = null;
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

function startGame() {
    const waveBoard = document.querySelector('#wave');
    waveBoard.innerText = waveCount;
    if (isGameOver) {
        console.log('after game over');
        first.render(wordGroups[0][0]);
        second.render(wordGroups[0][1]);
        third.render(wordGroups[0][2]);
        fourth.render(wordGroups[0][3]);
        fifth.render(wordGroups[0][4]);
        console.log(first, second, third, fourth, fifth);
        isGameOver = false;
    }
    setTimeout(() => {
        gameStarted = true;
        first.move();
        second.move();
        third.move();
        fourth.move();
        fifth.move();
    }, 200);
    monitor = setInterval(() => {
        console.log('monitor');
        if (first.targetHit() || second.targetHit() || third.targetHit() || fourth.targetHit() || fifth.targetHit()) {
            console.log('sulod ka diri');
            clearInterval(monitor);
            gameOver();
        }
    }, 250);
}

function updateGame(key = null) {
    if (key) {
        typedLetter += key;
        console.log(typedLetter);
        nthChild.children[typedLetter.length - 1].classList.add('is-hit');
        shootMisile(nthChild);
        correct++;
        streak++;
        allTypedCount++;
        setStats();

        console.log(typedLetter, nthChild, correct, streak, allTypedCount);
    } else {
        if (streak !== 0) {
            streaks.push(streak);
        }
        streak = 0;
        allTypedCount++;
        setStats();
    }
}

function shootMisile(target) {
    const character = document.querySelector('.character');
    const fieldWidth = document.querySelector('.words').offsetWidth;
    const fieldHeight = document.querySelector('.words').offsetHeight;
    let span = document.createElement('span');
    span.classList.add('shoot-misile');
    character.before(span);

    let left = target.offsetLeft + target.offsetWidth / 2;
    let top = target.offsetTop - fieldHeight + 100;
    let rotate = 0;
    left -= fieldWidth / 2;
    rotate = ((target.offsetLeft - fieldWidth / 2)) / 10;

    // console.log('start-target', target.offsetWidth);
    // console.log('start-target', target.offsetLeft);
    // console.log('start-target-top', target.offsetTop);
    // console.log('middle-target', left);
    // console.log('field-middle-target', fieldWidth / 2);
    /* if (target.offsetLeft < fieldWidth/2) {
        rotate = (target.offsetLeft - fieldWidth / 2) / 5;
        console.log('less ', fieldWidth/2 - left);
    } else {
        rotate = target.offsetLeft - fieldWidth / 2;
        console.log('more ', left - fieldWidth/2);
    } */
    // console.log('field center', fieldWidth / 2);
    // console.log('rotate', target);

    // console.log('left', left);
    // console.log('top', top);

    // console.log('go', left);

    // console.log('rotation ', rotate, 'deg');
    const wordMoving = [
        { transform: `translate(0px, 0px)` },
        { transform: `translate(${left}px, ${top}px)` }
    ]
    const time = {
        duration: 350,
        iterations: 1
    }
    const misiles = document.querySelectorAll('.shoot-misile');
    character.style.transform = `rotate(${rotate}deg)`;
    // misiles[misiles.length - 1].style.transform = `rotate(${rotate}deg)`;
    misiles[misiles.length - 1].animate(wordMoving, time);
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
    const misiles = document.querySelectorAll('.shoot-misile');
    let longest = Math.max(...streaks, streak);
    isGameOver = true;

    wave.innerText = waveCount - 1;
    longestStreak.innerText = longest;
    score.innerText = correct;
    accuracy.innerText = `${(correct / allTypedCount * 100 || 0).toFixed(2)}%`;

    character.classList.toggle('slide-down');
    header.classList.toggle('slide-up');
    setTimeout(() => {
        gameOverPanel.classList.toggle('hidden');
    }, 500);
    field.innerHTML = '';
    misiles.forEach(misile => {
        misile.remove();
    });
}

async function fetchRandomWord() {
    /* CORRECT USE THIS */
    const options = {
        method: 'GET',
        headers: { 'X-Api-Key': `${API_KEY}` }
    };

    return fetch('https://api.api-ninjas.com/v1/randomword', options)
        .then(response => response.json());
}