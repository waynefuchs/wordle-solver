import masterWordList from './len5words.js';
const cloneMasterWordList = () => masterWordList.map((x) => makeWord(x));

// These character weights are calculated based on the available word list
const charWeights = {"a": 0.11239067055393585, "b": 0.02681304664723032, "c": 0.032990160349854226, "d": 0.0354682944606414, "e": 0.09938046647230321, "f": 0.014704810495626823, "g": 0.02362427113702624, "h": 0.028990524781341107, "i": 0.06608053935860059, "j": 0.005739795918367347, "k": 0.02243075801749271, "l": 0.05564868804664723, "m": 0.03147776967930029, "n": 0.05455539358600583, "o": 0.06528790087463557, "p": 0.026339285714285714, "q": 0.0014941690962099125, "r": 0.06475036443148688, "s": 0.07543731778425657, "t": 0.04905247813411079, "u": 0.03990524781341108, "v": 0.011361151603498543, "w": 0.013529518950437318, "x": 0.004181851311953352, "y": 0.03144132653061225, "z": 0.006924198250728863};

// define globals
const G_WRONG_SPOT = "yellow";
const G_KNOWN_SPOT = "green";
const G_INVALID = "red";
let workingWordList = [];
let grayLetters = [];
let wrongSpot = [[],[],[],[],[]];
let knownSpot = [null, null, null, null, null];
let rejectedWords = [];
let previousWords = [];
let currentWord = null;
let elements = {
    add(name, selector) {
        this[name] = document.querySelector(selector);
        if(this[name] === null) {
            console.error("Failed to add " + name + ":" + selector);
            delete this[name];
        }
    },
    addEventListener(element, method) {
        this[element].addEventListener('click', method);
    },
}

function initialize() {
    // define element access variables
    elements.add("output", "#output");
    elements.add("words", "#word-array");
    elements.add("next-move", "#find-next-move");
    elements.add("not-accepted", "#word-not-accepted");
    elements.add("undo", "#word-undo");

    // load and sort the word list
    workingWordList = cloneMasterWordList();
    workingWordList.sort((a, b) => a.value > b.value ? -1 : a.value < b.value ? 1 : 0);
    
    // wire events
    elements.addEventListener("next-move", getNextWord);
    elements.addEventListener("not-accepted", wordNotAccepted);
    elements.addEventListener("undo", undoCurrentWord);
    
    getNextWord();
    console.log("Initialized.");
} initialize();

function getNextWord() {
    bakeCurrentWord();
    var suggestion = findBestNextWord();
    setOutput(suggestion.word);
    let newWord = createWordElement(suggestion.word);
    elements.words.append(newWord);
}

function undoCurrentWord(e) {
    console.log(e);
};

function snapshotCurrentWord() {
    // currentWord.grayLetters = 
}

function bakeCurrentWord() {
    if(currentWord === null) return;
    currentWord.updateInvalidLetters(grayLetters);
    currentWord.updateWrongSpot(wrongSpot);
    currentWord.updateKnownSpot(knownSpot);
    currentWord.disableAllButtons();

    // push the buttons into an array in case I need to undo
    previousWords.push(currentWord);
}

function findBestNextWord() {
    for(const wordObj of workingWordList) {
        const word = wordObj.word;
        // Go to the next word in the list if:
        // 1. Word contains any letters that are known to be wrong
        if(hasGrayLetters(word)) continue;

        // 2. Word contains any "wrong spot" letters in the known "wrong spot"
        if(hasWrongSpotLetters(word)) continue;

        // 3. Word contains an incorrect letter in a "known spot"
        // 4. Word must match "known spot" letters (This is implied)
        if(hasIncorrectLetterInKnownSpot(word)) continue;

        return wordObj;
    }
    return makeWord("#####");
}

// An object that stores details about the buttons in each word
function makeUIWord(word) {
    return {
        word,
        0: null,
        1: null,
        2: null,
        3: null,
        4: null,
        grayLetters: null,
        wrongSpot: null,
        knownSpot: null,
        isInvalidLetter(index) {
            if(this[index] === null) return false;
            if(this[index].classList.contains(G_WRONG_SPOT) 
                || this[index].classList.contains(G_KNOWN_SPOT)) return false;
            return true;
        },
        isWrongSpot(index) {
            if(this[index] === null) return false;
            return this[index].classList.contains(G_WRONG_SPOT);
        },
        isKnownSpot(index) {
            if(this[index] === null) return false;
            return this[index].classList.contains(G_KNOWN_SPOT);
        },
        getIndex(button) {
            for(let x=0; x<5; x++) {
                if(button === this[x]) return x;
            }
            console.error("Button not found in object!");
            return -1;
        },
        letterButtonPushed(e) {
            const c = this.classList;
            if(c.contains(G_WRONG_SPOT)) {
                c.remove(G_WRONG_SPOT);
                c.add(G_KNOWN_SPOT);
            } else if(c.contains(G_KNOWN_SPOT)) {
                c.remove(G_KNOWN_SPOT);
            } else {
                c.add(G_WRONG_SPOT);
            }
        },
        addEventListener(index) {
            this[index].addEventListener('click', this.letterButtonPushed);
        },
        removeEventListener(index) {
            this[index].removeEventListener('click', this.letterButtonPushed);
        },
        disableAllButtons() {
            for(let x=0; x<5; x++) {
                this.removeEventListener(x);
            }
        },
        enableAllButtons() {
            for(let x=0; x<5; x++) {
                this.addEventListener(x);
            }
        },

        updateInvalidLetters(grayLetterArray) {
            for(let x=0; x<5; x++) {
                if(this.isInvalidLetter(x)) grayLetterArray.push(this.word[x]);
            }
        },

        updateWrongSpot(wrongSpotReference) {
            for(let x=0; x<wrongSpotReference.length; x++) {
                const character = this.word[x];
                // user already tried this letter at this position(...)
                if(wrongSpotReference[x].includes(character)) continue;
                // push the character into the array, if it has the G_WRONG_SPOT class applied to the button
                if(this.isWrongSpot(x)) wrongSpotReference[x].push(character);
            }
        },

        updateKnownSpot(knownSpotReference) {
            for(let x=0; x<knownSpotReference.length; x++) {
                // continue to the next character if I already know the letter in this position...
                if(knownSpotReference[x] !== null) continue;
                // assign the letter, if the user has set it to 'known'
                if(this.isKnownSpot(x)) knownSpot[x] = word[x];
            }
        }

    }
}

function createWordElement(word) {
    // Push current word onto undo stack, if applicable
    bakeCurrentWord();
    // get a new UI object
    currentWord = makeUIWord(word);

    // Create the containing div
    let wordElement = document.createElement('div');
    let wordArray = word.toLowerCase().split('');
    wordElement.classList.add('word');

    for(let x=0; x<wordArray.length; x++) {
        // Create each letter button
        let characterButton = document.createElement('button');
        characterButton.classList.add('square');
        characterButton.textContent = wordArray[x];

        // Add the button to the currentWord UI object
        currentWord[x] = characterButton;

        // activate the button
        if(word === "#####") {
            characterButton.classList.add(G_INVALID);
        } else {
            currentWord.addEventListener(x);
        }

        // Add an element reference
        currentWord.wordElement = wordElement;

        // Add the button to the containing div
        wordElement.append(characterButton);
    }
    return wordElement;
}



function getWordValue(word) {
    let sum = 0;
    let unique = [...new Set(word.toLowerCase())];
    for(const c of unique) {
        if(wrongSpot.includes(c)) continue;
        sum += charWeights[c];
    }
    return sum;
}

// An object that functions as a C# Tuple.. ish
function makeWord(word) {
    return {
        word: word.toLowerCase(),
        value: getWordValue(word),
    };
}

function hasGrayLetters(word) {
    for(const c of grayLetters) {
        if(word.includes((c))) return true;
    }
    return false;
}

function hasWrongSpotLetters(word) {
    for(let x=0; x<wrongSpot.length; x++) {
        if(wrongSpot[x].includes(word[x])) return true;
    }
    return false;
}

function hasIncorrectLetterInKnownSpot(word) {
    for(let x=0; x<knownSpot.length; x++) {
        if(knownSpot[x] === null) continue;
        if(knownSpot[x] !== word[x]) return true;
    }
    return false;
}

function removeWordFromWorkingWordList(word) {
    for(let x=0; x<workingWordList.length; x++) {
        if(workingWordList[x].word === word) {
            const removed = workingWordList.splice(x, 1);
            return;
        }
    }
}

function wordNotAccepted(e) {
    console.log(e);

    const word = currentWord.word;
    // reject the word and remove it from the working list
    rejectedWords.push(word);
    removeWordFromWorkingWordList(word);

    // remove the element containing the buttons from the page
    currentWord.wordElement.remove();
    currentWord = null;

    // generate a new word
    getNextWord();
}

function setOutput(message) {
    elements.output.textContent = message;
}