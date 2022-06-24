import masterWordList from './len5words.js';
const cloneMasterWordList = () => masterWordList.map((x) => x);

// These character weights are calculated based on the available word list
const charWeights = {"a": 0.11239067055393585, "b": 0.02681304664723032, "c": 0.032990160349854226, "d": 0.0354682944606414, "e": 0.09938046647230321, "f": 0.014704810495626823, "g": 0.02362427113702624, "h": 0.028990524781341107, "i": 0.06608053935860059, "j": 0.005739795918367347, "k": 0.02243075801749271, "l": 0.05564868804664723, "m": 0.03147776967930029, "n": 0.05455539358600583, "o": 0.06528790087463557, "p": 0.026339285714285714, "q": 0.0014941690962099125, "r": 0.06475036443148688, "s": 0.07543731778425657, "t": 0.04905247813411079, "u": 0.03990524781341108, "v": 0.011361151603498543, "w": 0.013529518950437318, "x": 0.004181851311953352, "y": 0.03144132653061225, "z": 0.006924198250728863};

// define globals
let workingWordList = [];   // masterWordList - rejected words
let wrongSpot = [];         // array of arrays containing letters in the wrong spot
let correctSpot = [];       // array containing correctly identified letters
// let badWordArray = [];      // for debugging (and so i can remove the words)
let elements = {
    add(name, selector) {
        this[name] = document.querySelector(selector);
        if(this[name] === null) {
            console.error("Failed to add " + name + ":" + selector);
            delete this[name];
        }
    }
}

function initialize() {
    elements.add("output", "#output");
    elements.add("words", "#word-array");
    workingWordList = cloneMasterWordList();
} initialize();


function createWord(word) {
    let wordElement = document.createElement('div');
    let wordArray = word.toLowerCase().split('');
    wordElement.classList.add('word');
    for(let x=0; x<wordArray.length; x++) {
        let characterButton = document.createElement('button');
        characterButton.classList.add('square');
        characterButton.value = wordArray[x];
        characterButton.textContent = wordArray[x];
        createCharacterEventListener(characterButton);
        wordElement.append(characterButton);
    }
    return wordElement;
}

function characterPushed(e) {
    console.log(e);
    const c = e.target.classList;
    if(c.contains('yellow')) {
        c.remove('yellow');
        c.add('green');
    } else if(c.contains('green')) {
        c.remove('green');
    } else {
        c.add('yellow');
    }
}

function createCharacterEventListener(button) {
    button.addEventListener('click', characterPushed);
    button.addEventListener('touchstart', characterPushed);
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
    let wordlc = word.toLowerCase();
    let value = getWordValue(word);
    return {
        word,
        wordlc,
        value,
    };
}

function isMatchingKnownLetters(testWord) {
    return (testWord[0] === c0.value || c0.value === "")
        && (testWord[1] === c1.value || c1.value === "")
        && (testWord[2] === c2.value || c2.value === "")
        && (testWord[3] === c3.value || c3.value === "")
        && (testWord[4] === c4.value || c4.value === "");
}

function isNotContainingBadLetters(testWord) {
    for(const c of wrongSpot) {
        if(testWord.includes(c)) return false;
    }
    return true;
}

function isMatchingGoodLetters(testWord) {
    for(const c of correctSpot) {
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
    var bestObj = makeWord("");
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
    wrongSpot = [];
    const letters = badLetterElement.value;
    for(const c of letters.toLowerCase()) {
        wrongSpot.push(c);
    }
}

function setOutput(message) {
    elements.output.textContent = message;
}

function suggestWord() {

}

function recalculateNextMove() {
    getBadLettersFromUser();
    workingWordList = loadWords();
    
    
    outOfPositionArray = getBadPosition();
    let bestWord = getBestWord(workingWordList);
    setOutput(bestWord.word)

    let newWord = createWord(bestWord.word);
    elementWordArray.append(newWord.wordElement);
}

function removeWord(word) {
    badWordArray.push(word);
}

