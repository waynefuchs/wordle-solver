// TODO:
// 1. Add support for duplicate letter selection for 'wrong spot' / yellow letters - as in the double-l in 'hello'

import masterWordList from './len5words.js';
let workingWordList = []; // <-- calculated every time to save bandwidth (~200k every page load) at the cost of CPU cycles
const cloneMasterWordList = () => masterWordList.map((x) => makeWord(x));

// These character weights are calculated based on the available word list
//old: const charWeights = {"a": 0.11239067055393585, "b": 0.02681304664723032, "c": 0.032990160349854226, "d": 0.0354682944606414, "e": 0.09938046647230321, "f": 0.014704810495626823, "g": 0.02362427113702624, "h": 0.028990524781341107, "i": 0.06608053935860059, "j": 0.005739795918367347, "k": 0.02243075801749271, "l": 0.05564868804664723, "m": 0.03147776967930029, "n": 0.05455539358600583, "o": 0.06528790087463557, "p": 0.026339285714285714, "q": 0.0014941690962099125, "r": 0.06475036443148688, "s": 0.07543731778425657, "t": 0.04905247813411079, "u": 0.03990524781341108, "v": 0.011361151603498543, "w": 0.013529518950437318, "x": 0.004181851311953352, "y": 0.03144132653061225, "z": 0.006924198250728863};
const charWeights = {"a": 0.09236935409280099, "b": 0.02508093109295514, "c": 0.0312625250501002, "d": 0.037814089717897334, "e": 0.1026977030985047, "f": 0.01718822259904424, "g": 0.025342993679667025, "h": 0.027131185447818715, "i": 0.05794666255588099, "j": 0.00448589486665639, "k": 0.023215662093417605, "l": 0.05196546940033914, "m": 0.030460921843687375, "n": 0.045537228302759365, "o": 0.0684291660243564, "p": 0.031123786033605674, "q": 0.0017419454293201788, "r": 0.06412825651302605, "s": 0.10274394943733621, "t": 0.05079389548327424, "u": 0.038723601048250345, "v": 0.010698319716355788, "w": 0.016016648681979342, "x": 0.00443964852782488, "y": 0.03197163557885001, "z": 0.0066903036842916605}
// Global Constants (so I can change them later if I want)
const G_WRONG_SPOT = "yellow";
const G_KNOWN_SPOT = "green";
const G_INVALID = "red";

// Leaving this in for now (allows me to use the developer console to get a list of invalid wordle words)
let rejectedWords = [];

// For Undo Implementation
let previousWords = [];
let currentWord = null;

// Make element lookup and handling cleaner
// I prefer having a single object that stores DOM elements instead of 
// a bunch of random global variables to keep track of.
// See below: initialize()
let elements = {
    add(name, selector) {
        this[name] = document.querySelector(selector);
        if(this[name] === null) delete this[name];
    },
    addEventListener(element, method) {
        this[element].addEventListener('click', method);
    },
}

// define globals that determine word search criteria
// represented by gray letters
let invalidLetters = [];
// represented by yellow letters
let wrongSpot = [[],[],[],[],[]];
// represented by green letters
let knownSpot = [null, null, null, null, null];

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
} initialize();

function getNextWord() {
    // bake the last word
    bakeCurrentWord();

    // Search for the next best word
    var suggestion = findBestNextWord();

    // Create an element to display
    let newWord = createWordElement(suggestion.word);

    // set the current word
    currentWord = newWord;

    // Handle UI changes
    elements.words.append(newWord.wordElement);
    setOutput(suggestion.word);
    setUndoUIStatus();
}

function setUndoUIStatus() {
    if(previousWords.length >= 1) elements.undo.style.visibility="visible";
    else elements.undo.style.visibility="hidden";
}

function undoCurrentWord(e) {
    // Roll the display back
    currentWord.wordElement.remove();
    const word = previousWords.pop();
    currentWord = word;

    // Roll baked data back
    invalidLetters = currentWord.invalidLetters;
    currentWord.invalidLetters = null;
    wrongSpot = currentWord.wrongSpot;
    currentWord.wrongSpot = null;
    knownSpot = currentWord.knownSpot;
    currentWord.knownSpot = null;

    // Set the output to the selected word
    setOutput(currentWord.word);

    // check whether the Undo button should be shown
    setUndoUIStatus();

    // Enable Button Clicks
    currentWord.enableAllButtons();
};

function bakeCurrentWord() {
    if(currentWord === null) return;

    // push the buttons into an array in case I need to undo
    previousWords.push(currentWord);

    // bake search criteria
    if(currentWord === null) return;
    bakeInvalidLetters(invalidLetters);
    bakeWrongSpot(wrongSpot);
    bakeKnownSpot(knownSpot);
    currentWord.disableAllButtons();

    // clear the reference to the current word
    currentWord = null;
}


function bakeInvalidLetters(invalidLetterArray) {
    // Clone invalidLetters and store into currentWord.invalidLetters
    const backupInvalidLettersString = JSON.stringify(invalidLetters);
    currentWord.invalidLetters = JSON.parse(backupInvalidLettersString);

    // perform the bake
    for(let x=0; x<5; x++) if(currentWord.isInvalidLetter(x)) invalidLetterArray.push(currentWord.word[x]);
}

function bakeWrongSpot(wrongSpotReference) {
    // Clone wrongSpot and store into currentWord.wrongSpot
    const backupWrongSpotString = JSON.stringify(wrongSpot);
    currentWord.wrongSpot = JSON.parse(backupWrongSpotString);

    // perform the bake
    for(let x=0; x<wrongSpotReference.length; x++) {
        const character = currentWord.word[x];
        // user already tried this letter at this position(...)
        if(wrongSpotReference[x].includes(character)) continue;
        // push the character into the array, if it has the G_WRONG_SPOT class applied to the button
        if(currentWord.isWrongSpot(x)) wrongSpotReference[x].push(character);
    }
}

function bakeKnownSpot(knownSpotReference) {
    // Clone knownSpot and store into currentWord.knownSpot
    const backupKnownSpotString = JSON.stringify(knownSpot);
    currentWord.knownSpot = JSON.parse(backupKnownSpotString);

    // perform the bake
    for(let x=0; x<knownSpotReference.length; x++) {
        // continue to the next character if I already know the letter in this position...
        if(knownSpotReference[x] !== null) continue;
        // assign the letter, if the user has set it to 'known'
        if(currentWord.isKnownSpot(x)) knownSpot[x] = currentWord.word[x];
    }
}

function findBestNextWord() {
    for(const wordObj of workingWordList) {
        const word = wordObj.word;
        // Go to the next word in the list if:
        // 1. Word contains any letters that are known to be wrong
        if(hasInvalidLetters(word)) continue;

        // 2. Word contains any "wrong spot" letters in the known "wrong spot"
        if(hasWrongSpotLetters(word)) continue;

        // 3. There must be a maximum of 5 wrong spot letters
        if(getAllWrongSpotLetters().length > 5) break;

        // 4. Word must contain ALL "wrong spot" letters
        if(!hasAllWrongSpotLetters(word)) continue;

        // 5. Word contains an incorrect letter in a "known spot"
        if(hasIncorrectLetterInKnownSpot(word)) continue;
        // 6. Word must match "known spot" letters (This is implied by 5.)

        return wordObj;
    }
    return makeWord("#####");
}

// An object that stores details about the buttons in each word
function makeUIWord(word) {
    return {
        word,
        wordElement: null,
        0: null,
        1: null,
        2: null,
        3: null,
        4: null,
        invalidLetters: null,
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
            for(let x=0; x<5; x++) if(button === this[x]) return x;
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
            for(let x=0; x<5; x++) this.removeEventListener(x);
        },
        enableAllButtons() {
            for(let x=0; x<5; x++) this.addEventListener(x);
        },
    }
}

function createWordElement(word) {
    // get a new UI object
    let uiWord = makeUIWord(word);

    // Create the containing div
    let wordElement = document.createElement('div');
    let wordArray = word.toLowerCase().split('');
    wordElement.classList.add('word');

    // Create each letter button
    for(let x=0; x<wordArray.length; x++) {
        let characterButton = document.createElement('button');
        characterButton.classList.add('square');
        characterButton.textContent = wordArray[x];

        // Add the button to the uiWord object
        uiWord[x] = characterButton;

        // activate the button
        if(word === "#####") {
            characterButton.classList.add(G_INVALID);
        } else {
            uiWord.addEventListener(x);
        }

        // Auto-set the color if known
        if(isKnownSpot(x)) characterButton.classList.add(G_KNOWN_SPOT);
        // TODO: Add yellow selection here

        // Add the button to the containing div
        wordElement.append(characterButton);
    }
    // Add an element reference
    uiWord.wordElement = wordElement;

    return uiWord;
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

function makeWord(word) {
    return {
        word: word.toLowerCase(),
        value: getWordValue(word),
    };
}

function hasInvalidLetters(word) {
    for(const c of invalidLetters) if(word.includes((c))) return true;
    return false;
}

function hasWrongSpotLetters(word) {
    for(let x=0; x<wrongSpot.length; x++) if(wrongSpot[x].includes(word[x])) return true;
    return false;
}

function hasIncorrectLetterInKnownSpot(word) {
    for(let x=0; x<knownSpot.length; x++) {
        if(knownSpot[x] === null) continue;
        if(knownSpot[x] !== word[x]) return true;
    }
    return false;
}

function hasAllWrongSpotLetters(word) {
    const letters = getAllWrongSpotLetters();
    for(const c of letters) {
        if(!word.includes(c)) return false;
    }
    return true;
}

function getAllWrongSpotLetters() {
    let letters = [];
    for(const letterGroup of wrongSpot) {
        for(const c of letterGroup) {
            if(letters.includes(c)) continue;
            letters.push(c);
        }
    }
    return letters;
}

function isKnownSpot(index) {
    return knownSpot[index] !== null;
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