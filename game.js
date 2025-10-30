const NUMBER_OF_GUESSES = 8;
let NUMBER_OF_LETTERS = 2;
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let WORDS = {};
let MAX_WORD_LENGTH = 0;
let rightGuessString = "";

// Initialize game
loadWords("words.txt").then(() => gameloop());

function loadWords(filePath) {
    return fetch(filePath)
        .then(response => response.text())
        .then(data => {
            data.split("\n").forEach(word => {
                word = word.trim();
                if (word.length > 0) {
                    const len = word.length;
                    if (!WORDS[len]) {
                        WORDS[len] = [];
                    }
                    WORDS[len].push(word);
                }
            });

            const lengths = Object.keys(WORDS)
                .map(k => Number(k))
                .filter(n => !isNaN(n));
            if (lengths.length > 0) {
                MAX_WORD_LENGTH = Math.max(...lengths);
            }
        });
}

function reset_game() {
    guessesRemaining = NUMBER_OF_GUESSES;
    currentGuess = [];
    nextLetter = 0;
    document.getElementById("niveau-value").textContent = NUMBER_OF_LETTERS;

    if (!WORDS[NUMBER_OF_LETTERS] || WORDS[NUMBER_OF_LETTERS].length === 0) {
        console.warn(
            `Words for length ${NUMBER_OF_LETTERS} not available yet — retrying reset_game shortly.`
        );
        setTimeout(reset_game, 100);
        return;
    }

    const words = WORDS[NUMBER_OF_LETTERS];
    rightGuessString = words[Math.floor(Math.random() * words.length)];
    resetKeyboard();
    createBoard(NUMBER_OF_GUESSES, NUMBER_OF_LETTERS);
}

function resetKeyboard() {
    for (const elem of document.getElementsByClassName("keyboard-button")) {
        elem.style.backgroundColor = '';
    }
}

function createBoard(noGuesses, noLetters) {
    const board = document.getElementById("game-board");
    while (board.firstChild) {
        board.removeChild(board.firstChild);
    }

    for (let i = 0; i < noGuesses; i++) {
        const row = document.createElement("div");
        row.className = "letter-row";

        for (let j = 0; j < noLetters; j++) {
            const box = document.createElement("div");
            box.className = "letter-box";
            row.appendChild(box);
        }
        board.appendChild(row);
    }
}

document.addEventListener("keyup", (e) => {
    if (guessesRemaining === 0) return;

    const pressedKey = String(e.key);

    if (pressedKey === "Backspace" && nextLetter !== 0) {
        deleteLetter();
        return;
    }

    if (pressedKey === "Enter") {
        checkGuess();
        return;
    }

    const found = pressedKey.match(/[a-zæøå]/gi);
    if (found && found.length === 1) {
        insertLetter(pressedKey);
    }
});

function insertLetter(pressedKey) {
    if (nextLetter === NUMBER_OF_LETTERS) return;

    pressedKey = pressedKey.toLowerCase();
    const row = document.getElementsByClassName("letter-row")[
        NUMBER_OF_GUESSES - guessesRemaining
    ];
    const box = row.children[nextLetter];

    animateCSS(box, "pulse");
    box.textContent = pressedKey;
    box.classList.add("filled-box");
    currentGuess.push(pressedKey);
    nextLetter += 1;
}

function deleteLetter() {
    const row = document.getElementsByClassName("letter-row")[
        NUMBER_OF_GUESSES - guessesRemaining
    ];
    const box = row.children[nextLetter - 1];

    box.textContent = "";
    box.classList.remove("filled-box");
    currentGuess.pop();
    nextLetter -= 1;
}

function checkGuess() {
    const row = document.getElementsByClassName("letter-row")[
        NUMBER_OF_GUESSES - guessesRemaining
    ];
    let guessString = currentGuess.join("");
    let rightGuess = Array.from(rightGuessString);

    if (guessString.length !== NUMBER_OF_LETTERS) {
        toastr.error("Not enough letters!");
        return;
    }

    // Reveal letter colors with animation
    for (let i = 0; i < NUMBER_OF_LETTERS; i++) {
        const box = row.children[i];
        const letter = currentGuess[i];
        let letterColor = "grey";

        const letterPosition = rightGuess.indexOf(letter);
        if (letterPosition !== -1) {
            letterColor =
                letter === rightGuess[i] ? "green" : "yellow";
            rightGuess[letterPosition] = "#";
        }

        const delay = 250 * i;
        setTimeout(() => {
            animateCSS(box, "flipInX");
            box.style.backgroundColor = letterColor;
            shadeKeyBoard(letter, letterColor);
        }, delay);
    }

    // Check if guess is correct
    if (guessString === rightGuessString) {
        handleCorrectGuess();
    } else {
        guessesRemaining -= 1;
        currentGuess = [];
        nextLetter = 0;

        if (guessesRemaining === 0) {
            toastr.error("You've run out of guesses! Game over!");
            toastr.info(`The right word was: "${rightGuessString}"`);
        }
    }
}

function handleCorrectGuess() {
    if (NUMBER_OF_LETTERS < MAX_WORD_LENGTH) {
        toastr.success(
            `Correct! Advancing to ${NUMBER_OF_LETTERS + 1}-letter words.`
        );
        NUMBER_OF_LETTERS += 1;
        document.getElementById("niveau-value").textContent = NUMBER_OF_LETTERS;
        setTimeout(() => {
            reset_game();
        }, 1000);
    } else {
        toastr.success(
            "You completed all word lengths — Congratulations!"
        );
        guessesRemaining = 0;
    }
}

function shadeKeyBoard(letter, color) {
    for (const elem of document.getElementsByClassName("keyboard-button")) {
        if (elem.textContent !== letter) continue;

        const oldColor = elem.style.backgroundColor;
        if (oldColor === "green" ||
            (oldColor === "yellow" && color !== "green")) {
            return;
        }

        elem.style.backgroundColor = color;
        break;
    }
}

document.getElementById("keyboard-cont").addEventListener("click", (e) => {
    const target = e.target;

    if (!target.classList.contains("keyboard-button")) return;

    let key = target.textContent;
    if (key === "Del") {
        key = "Backspace";
    }

    document.dispatchEvent(new KeyboardEvent("keyup", { key: key }));
});

const animateCSS = (element, animation, prefix = "animate__") =>
    new Promise((resolve) => {
        const animationName = `${prefix}${animation}`;
        element.style.setProperty("--animate-duration", "0.3s");
        element.classList.add(`${prefix}animated`, animationName);

        function handleAnimationEnd(event) {
            event.stopPropagation();
            element.classList.remove(`${prefix}animated`, animationName);
            resolve("Animation ended");
        }

        element.addEventListener("animationend", handleAnimationEnd, { once: true });
    });

function gameloop() {
    reset_game();
}