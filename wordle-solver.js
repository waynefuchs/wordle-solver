import wordList from './len5words.js';

// These character weights are calculated based on the available word list
const charWeights = {"a": 0.11239067055393585, "b": 0.02681304664723032, "c": 0.032990160349854226, "d": 0.0354682944606414, "e": 0.09938046647230321, "f": 0.014704810495626823, "g": 0.02362427113702624, "h": 0.028990524781341107, "i": 0.06608053935860059, "j": 0.005739795918367347, "k": 0.02243075801749271, "l": 0.05564868804664723, "m": 0.03147776967930029, "n": 0.05455539358600583, "o": 0.06528790087463557, "p": 0.026339285714285714, "q": 0.0014941690962099125, "r": 0.06475036443148688, "s": 0.07543731778425657, "t": 0.04905247813411079, "u": 0.03990524781341108, "v": 0.011361151603498543, "w": 0.013529518950437318, "x": 0.004181851311953352, "y": 0.03144132653061225, "z": 0.006924198250728863};

// define globals
let w = [];
let badLetterArray = [];
let goodLetterArray = [];
let badWordArray = [];

// wire up output
const output = document.querySelector("#output");

// wire up "Used Bad Letter" text box
const badLetterElement = document.querySelector('#badLetters');

// wire up out of position letters
const outOfPositionElements = [
    document.querySelector("#n0"),
    document.querySelector("#n1"),
    document.querySelector("#n2"),
    document.querySelector("#n3"),
    document.querySelector("#n4"),
];
// I differentiate this from outOfPositionElements in anticipation for input error checking
// and easier iteration
let outOfPositionArray = getBadPosition();

// wire up letter inputs
const c0 = document.querySelector("#c0");
const c1 = document.querySelector("#c1");
const c2 = document.querySelector("#c2");
const c3 = document.querySelector("#c3");
const c4 = document.querySelector("#c4");


function getBadPosition() {
    let n = [[],[],[],[],[],];
    for(let x = 0; x < outOfPositionElements.length; x++) {
        if(outOfPositionElements[x].value !== "") {
            for(const c of outOfPositionElements[x].value.toLowerCase()) {
                n[x].push(c);
            }
        }
    }

    return n;  
}

function getWordValue(word) {
    let sum = 0;
    let unique = [...new Set(word.toLowerCase())];
    for(const c of unique) {
        if(badLetterArray.includes(c)) continue;
        sum += charWeights[c];
    }
    return sum;
}

function getWordObject(word) {
    let obj = {};
    obj.word = word;
    obj.wordlc = word.toLowerCase();
    obj.value = getWordValue(word);
    return obj;
}

function loadWords() {
    let a = [];
    for(const word of wordList) {
        if(badWordArray.includes(word)) continue;
        a.push(getWordObject(word));
    }
    return a;
}

function isMatchingKnownLetters(testWord) {
    return (testWord[0] === c0.value || c0.value === "")
        && (testWord[1] === c1.value || c1.value === "")
        && (testWord[2] === c2.value || c2.value === "")
        && (testWord[3] === c3.value || c3.value === "")
        && (testWord[4] === c4.value || c4.value === "");
}

function isNotContainingBadLetters(testWord) {
    for(const c of badLetterArray) {
        if(testWord.includes(c)) return false;
    }
    return true;
}

function isMatchingGoodLetters(testWord) {
    for(const c of goodLetterArray) {
        if(!testWord.includes(c)) return false;
    }
    return true;
}

function isNotMatchingBadPositionLetters(testWord) {
    for(let x=0; x<outOfPositionElements.length; x++) {
        if(outOfPositionElements[x].value === "") continue;
        for(const c of outOfPositionElements[x].value.toLowerCase()) {
            if(testWord[x] === c) return false;
        }
    }
    return true;
}

function getBestWord(list) {
    var bestObj = getWordObject("");
    for(const obj of list) {
        if(isMatchingKnownLetters(obj.wordlc) 
        && isNotContainingBadLetters(obj.wordlc)
        && isMatchingGoodLetters(obj.wordlc)
        && isNotMatchingBadPositionLetters(obj.wordlc)
        && obj.value > bestObj.value) {
            bestObj = obj;
        }
    }
    if(bestObj.word === "") bestObj.word = "No valid word was found!";
    return bestObj;
}

function getBadLettersFromUser() {
    badLetterArray = [];
    const letters = badLetterElement.value;
    for(const c of letters.toLowerCase()) {
        badLetterArray.push(c);
    }
}

function recalculateNextMove() {
    getBadLettersFromUser();
    w = loadWords();
    outOfPositionArray = getBadPosition();
    let bestWord = getBestWord(w);
    output.textContent = bestWord.word;
}

function removeWord() {
    const word = output.textContent;
    badWordArray.push(word);
    recalculateNextMove();
}

// Wire Recalculate Button
const recalculate = document.querySelector("#recalculate");
recalculate.addEventListener("click", recalculateNextMove);
recalculateNextMove();

// Wire Word-Didn't-Work button
const notAWord = document.querySelector("#notaword");
notAWord.addEventListener("click", removeWord);