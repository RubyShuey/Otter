const NUMBER_OF_GUESSES = 8;
let NUMBER_OF_LETTERS = 2;
let guessesRemaining = NUMBER_OF_GUESSES;
let currentGuess = [];
let nextLetter = 0;
let WORDS = {};
let MAX_WORD_LENGTH = 0;
// Load words and then start the game once words are available
loadWords("words.txt").then(() => {
    gameloop();
});
let rightGuessString = ""

function loadWords(filePath) {
    // fetch file and parse words into WORDS object
    return fetch(filePath)
        .then(response => response.text())
        .then(data => {
            data.split("\n").forEach(word => {
                word = word.trim();
                if (word.length > 0) {
                    let len = word.length;
                    if (!WORDS[len]) {
                        WORDS[len] = [];
                    }
                    WORDS[len].push(word);
                }
            });

            // compute max available word length
            const lengths = Object.keys(WORDS).map(k => Number(k)).filter(n => !isNaN(n));
            if (lengths.length > 0) {
                MAX_WORD_LENGTH = Math.max(...lengths);
            }
        });
}

function reset_game() {
    guessesRemaining = NUMBER_OF_GUESSES;
    currentGuess = [];
    nextLetter = 0;
    // Ensure we have words loaded for the chosen length before selecting one
    if (!WORDS[NUMBER_OF_LETTERS] || WORDS[NUMBER_OF_LETTERS].length === 0) {
        // If words haven't loaded yet or there are no words of that length,
        // retry shortly. This avoids accessing `.length` of undefined.
        console.warn(`Words for length ${NUMBER_OF_LETTERS} not available yet — retrying reset_game shortly.`);
        setTimeout(reset_game, 100);
        return;
    }

    // Use the same variable name used elsewhere (`rightGuessString`)
    rightGuessString = WORDS[NUMBER_OF_LETTERS][Math.floor(Math.random() * WORDS[NUMBER_OF_LETTERS].length)];
    // Reset keyboard colors before creating the new board
    resetKeyboard();
    createBoard(NUMBER_OF_GUESSES, NUMBER_OF_LETTERS);
}

function resetKeyboard() {
    for (const elem of document.getElementsByClassName("keyboard-button")) {
        elem.style.backgroundColor = '';
    }
}

function createBoard(noGuesses, noLetters) {
    let board = document.getElementById("game-board");

    //reset board
    while (board.firstChild) {
        board.removeChild(board.firstChild);
    }

    for (let i = 0; i < noGuesses; i++) {
        let row = document.createElement("div")
        row.className = "letter-row"

        for (let j = 0; j < noLetters; j++) {
            let box = document.createElement("div")
            box.className = "letter-box"
            row.appendChild(box)
        }

        board.appendChild(row)
    }
}

document.addEventListener("keyup", (e) => {

    if (guessesRemaining === 0) {
        return
    }

    let pressedKey = String(e.key)
    if (pressedKey === "Backspace" && nextLetter !== 0) {
        deleteLetter()
        return
    }

    if (pressedKey === "Enter") {
        checkGuess()
        return
    }

    let found = pressedKey.match(/[a-zæøå]/gi)
    if (!found || found.length > 1) {
        return
    } else {
        insertLetter(pressedKey)
    }
})

function insertLetter(pressedKey) {
    if (nextLetter === NUMBER_OF_LETTERS) {
        return
    }
    pressedKey = pressedKey.toLowerCase()

    let row = document.getElementsByClassName("letter-row")[NUMBER_OF_GUESSES - guessesRemaining]
    let box = row.children[nextLetter]
    animateCSS(box, "pulse")
    box.textContent = pressedKey
    box.classList.add("filled-box")
    currentGuess.push(pressedKey)
    nextLetter += 1
}

function deleteLetter() {
    let row = document.getElementsByClassName("letter-row")[NUMBER_OF_GUESSES - guessesRemaining]
    let box = row.children[nextLetter - 1]
    box.textContent = ""
    box.classList.remove("filled-box")
    currentGuess.pop()
    nextLetter -= 1
}

function checkGuess() {
    let row = document.getElementsByClassName("letter-row")[NUMBER_OF_GUESSES - guessesRemaining]
    let guessString = ''
    let rightGuess = Array.from(rightGuessString)

    for (const val of currentGuess) {
        guessString += val
    }

    if (guessString.length != NUMBER_OF_LETTERS) {
        toastr.error("Not enough letters!")
        return
    }

    //if (!WORDS.includes(guessString)) {
    //    toastr.error("Word not in list!")
    //    return
    //}


    for (let i = 0; i < NUMBER_OF_LETTERS; i++) {
        let letterColor = ''
        let box = row.children[i]
        let letter = currentGuess[i]

        let letterPosition = rightGuess.indexOf(currentGuess[i])
        // is letter in the correct guess
        if (letterPosition === -1) {
            letterColor = 'grey'
        } else {
            // now, letter is definitely in word
            // if letter index and right guess index are the same
            // letter is in the right position 
            if (currentGuess[i] === rightGuess[i]) {
                // shade green 
                letterColor = 'green'
            } else {
                // shade box yellow
                letterColor = 'yellow'
            }

            rightGuess[letterPosition] = "#"
        }

        let delay = 250 * i
        setTimeout(() => {
            //flip box
            animateCSS(box, 'flipInX')
            //shade box
            box.style.backgroundColor = letterColor
            shadeKeyBoard(letter, letterColor)
        }, delay)
    }

    if (guessString === rightGuessString) {
        // If there are longer words available, advance to the next length
        if (NUMBER_OF_LETTERS < MAX_WORD_LENGTH) {
            toastr.success(`Correct! Advancing to ${NUMBER_OF_LETTERS + 1}-letter words.`)
            NUMBER_OF_LETTERS += 1
            // small delay to let animations/toasts play before starting next round
            setTimeout(() => {
                reset_game()
            }, 1000)
            return
        } else {
            // Final congratulations when highest length reached
            toastr.success("You completed all word lengths — Congratulations!")
            guessesRemaining = 0
            return
        }
    } else {
        guessesRemaining -= 1;
        currentGuess = [];
        nextLetter = 0;

        if (guessesRemaining === 0) {
            toastr.error("You've run out of guesses! Game over!")
            toastr.info(`The right word was: "${rightGuessString}"`)
        }
    }
}

function shadeKeyBoard(letter, color) {
    for (const elem of document.getElementsByClassName("keyboard-button")) {
        if (elem.textContent === letter) {
            let oldColor = elem.style.backgroundColor
            if (oldColor === 'green') {
                return
            }

            if (oldColor === 'yellow' && color !== 'green') {
                return
            }

            elem.style.backgroundColor = color
            break
        }
    }
}

document.getElementById("keyboard-cont").addEventListener("click", (e) => {
    const target = e.target

    if (!target.classList.contains("keyboard-button")) {
        return
    }
    let key = target.textContent

    if (key === "Del") {
        key = "Backspace"
    }

    document.dispatchEvent(new KeyboardEvent("keyup", { 'key': key }))
})

const animateCSS = (element, animation, prefix = 'animate__') =>
    // We create a Promise and return it
    new Promise((resolve, reject) => {
        const animationName = `${prefix}${animation}`;
        // const node = document.querySelector(element);
        const node = element
        node.style.setProperty('--animate-duration', '0.3s');

        node.classList.add(`${prefix}animated`, animationName);

        // When the animation ends, we clean the classes and resolve the Promise
        function handleAnimationEnd(event) {
            event.stopPropagation();
            node.classList.remove(`${prefix}animated`, animationName);
            resolve('Animation ended');
        }

        node.addEventListener('animationend', handleAnimationEnd, { once: true });
    });


function gameloop() {
    reset_game()

}