import * as util from "./data.js";

const loadingMenu = document.getElementById("loadingMenu");
const mainMenu = document.getElementById("mainMenu");
const questionMenu = document.getElementById("questionMenu");
const scoreMenu = document.getElementById("scoreMenu");

const explorerList = document.getElementById("explorerList");

const questionProgressBar = document.getElementById("questionProgressBar");
const questionResponseInput = document.getElementById("questionResponseInput");
const responseConfirmButton = document.getElementById("responseConfirmButton");
const questionHolderBox = document.getElementById("questionHolderBox");
const languageContainer = document.getElementById("languageContainer");
const submitResultMenu = document.getElementById("submitResultMenu");
const correctScoreContainer = document.getElementById("correctScoreContainer");
const incorrectScoreContainer = document.getElementById("incorrectScoreContainer");
const totalAmountContainer = document.getElementById("totalAmountContainer");
const gradeContainer = document.getElementById("gradeContainer");

const instructionListHolder = document.getElementById("instructionListHolder");
const solutionListHolder = document.getElementById("solutionListHolder");
const inputtedListHolder = document.getElementById("inputtedListHolder");

const data = await util.getJson("./assets/data.json");
const vocabulary = await util.getJson("./assets/vocabulary.json");

// Menu Stuff
var currentQuestionaire = null;
var occuranceExplorer;

// Main Menu occurance explorer
function showOccurance(path) {
    occuranceExplorer.show(path);
}
function goBackToAboveOccurance() {
    occuranceExplorer.goAbove();
}
function loadVocab(path) {
    let vocabulary = occuranceExplorer.extractVocabulary(path);
    currentQuestionaire = new Questionaire(data, vocabulary, "french", "german");
    window.currentQuestionaire = currentQuestionaire;
}
window.showOccurance = showOccurance;
window.goBackToAboveOccurance = goBackToAboveOccurance;
window.loadVocab = loadVocab;

class OccuranceExplorer {
    constructor(vocabulary) {
        this.vocabulary = vocabulary;
        this.occurances = Array.from(util.extractOccurances(vocabulary));
        this.path = "";
        this.lastPath = "";
    }

    extractVocabulary(occurancePath) {
        let result = [];
        let searchedLength = occurancePath.split(" ").length + 1;
        if (occurancePath == "") searchedLength = 1;
        for (let i = 0; i < this.vocabulary.length; i++) {
            const occurances = this.vocabulary[i].occurances;
            for (let j = 0; j < occurances.length; j++) {
                if (occurances[j].startsWith(occurancePath)) {
                    result.push(this.vocabulary[i]);
                    break;
                }
            }
        }
        return result;
    }

    extract(occurancePath) {
        let result = [];
        let searchedLength = occurancePath.split(" ").length + 1;
        if (occurancePath == "") searchedLength = 1;
        for (let i = 0; i < this.occurances.length; i++) {
            if (this.occurances[i].split(" ").length == searchedLength && this.occurances[i].startsWith(occurancePath)) {
                result.push(this.occurances[i]);
            }
        }
        return result;
    }

    getOccuranceHTML(path) {
        let subOptionAmount = this.extract(path);
        if (subOptionAmount == 0) {
            let vocAmount = this.extractVocabulary(path).length;
            let vocAmountLabel = vocAmount + " Vokabeln";
            if (vocAmount == 1) {
                vocAmountLabel = "1 Vokabel";
            }
            return ('<div class="item" onclick=\'window.loadVocab(\"' + path + '\")\'>' + path + ' - ' + vocAmountLabel + "</div>");
        } else {
            return ('<div class="item" onclick=\'window.showOccurance("' + path + '")\'>' + path + "</div>");
        }
    }
    
    show(occurancePath) {
        this.path = occurancePath;
        let results = this.extract(occurancePath);
        let html = '<div class="item" onclick=\'window.goBackToAboveOccurance()\'>Zurück</div>';
        if (occurancePath == "") {
            html = '<div style="color: gray">Zurück</div>';
        }
        for (let i = 0; i < results.length; i++) {
            html += this.getOccuranceHTML(results[i]);
        }
        explorerList.innerHTML = html;
    }

    goAbove() {
        let split = this.path.split(" ");
        split.length--;
        this.show(split.join(" "));
    }
}
occuranceExplorer = new OccuranceExplorer(vocabulary);
occuranceExplorer.show("");

// Question Menu

class Questionaire {
    constructor(data, vocabulary, language1, language2) {
        this.data = data;
        this.vocabulary = vocabulary;
        this.language1 = language1;
        this.language2 = language2;
        this.currentQuestionIndex = 0;
        this.resultShown = false;

        this.instructions = [];
        this.vocabSolutions = [];
        this.inputs = [];
        this.correct = [];

        questionProgressBar.setAttribute("max", this.vocabulary.length);

        this.correctAmount = 0;
        this.incorrectAmount = 0;
        this.show(vocabulary[0]);
    }

    show(vocab) {
        mainMenu.style.visibility = "hidden";
        questionMenu.style.visibility = "visible";
        languageContainer.textContent = "Von " + util.getLanguageName(this.language1) + " nach " + util.getLanguageName(this.language2);
        this.currentVocab = vocab;
        questionHolderBox.textContent = vocab[this.language1][0];
        this.solutions = [...vocab[this.language2]];
        this.extendSolutions();
        this.instructions.push(questionHolderBox.textContent);
        this.vocabSolutions.push(this.solutions[0]);
        questionProgressBar.setAttribute("value", this.currentQuestionIndex);
        responseConfirmButton.setAttribute("disabled", "disabled");
        questionResponseInput.value = "";
        questionResponseInput.removeAttribute("disabled");
        questionResponseInput.focus();
    }

    next() {
        this.hideCorrectness();
        this.currentQuestionIndex++;
        if (this.currentQuestionIndex >= this.vocabulary.length) {
            questionMenu.style.visibility = "hidden";
            scoreMenu.style.visibility = "visible";
            let correctPercentage = (this.correctAmount / this.vocabulary.length)
            correctScoreContainer.textContent = "" + this.correctAmount + " (" + (correctPercentage.toLocaleString(undefined, {style: "percent", minimumFractionDigits:0})) + ")";
            incorrectScoreContainer.textContent = this.incorrectAmount + " (" + (this.incorrectAmount / this.vocabulary.length).toLocaleString(undefined, {style: "percent", minimumFractionDigits:0}) + ")";
            totalAmountContainer.textContent = this.vocabulary.length;
            gradeContainer.textContent = this.calcGrade(correctPercentage);

            instructionListHolder.innerHTML = this.convert(this.instructions);
            solutionListHolder.innerHTML = this.convert(this.vocabSolutions);
            
            let result = "";
            for (let i = 0; i < this.inputs.length; i++) {
                if (this.correct[i]) {
                    result += '<div style="color: green;">' + this.inputs[i] + "</div>";
                } else {
                    result += '<div style="color: red;">' + this.inputs[i] + "</div>";
                }
            }
            inputtedListHolder.innerHTML = result;
            return;
        }
        this.show(this.vocabulary[this.currentQuestionIndex]);
    }

    isSubmittable() {
        return questionResponseInput.value.trim() && !this.resultShown;
    }

    submit() {
        let entered = questionResponseInput.value.trim();
        console.log("Entered: ", entered, " - Is that the solution?", this.isCorrect(entered));
        this.inputs.push(entered);
        if (this.isCorrect(entered)) {
            this.correct.push(true);
            this.correctAmount++;
            this.showCorrect();
        } else {
            this.correct.push(false);
            this.incorrectAmount++;
            this.showIncorrect();
        }
    }
    
    extendSolutions() {
        let originalWordAmount = this.solutions.length;
        let extensions = data.extensions
        for (let i = 0; i < originalWordAmount; i++) {
            let word = this.solutions[i];
            for (let j = 0; j < extensions.length; j++) {
                let pattern = extensions[i][0];
                let index = word.indexOf(pattern);
                if (index == -1) continue;
                for (let k = 1; k < extensions.length; k++) {
                    this.solutions.push(word.replace(pattern, extensions[k]));
                }
            }
        }
    }

    isCorrect(input) {
        input = input.toLowerCase();
        for (let i = 0; i < this.solutions.length; i++) {
            if (this.solutions[i].toLowerCase() == input) {
                return true;
            }
        }
        return false;
    }

    showResult() {
        submitResultMenu.style.visibility = "visible";
        submitResultMenu.style.opacity = 1;
        submitResultActionContainer.style.opacity = 1;
        questionResponseInput.setAttribute("disabled", "disabled");
        responseConfirmButton.setAttribute("disabled", "disabled");
        submitResultActionContainer.style.visibility = "visible";
        questionProgressBar.setAttribute("value", this.currentQuestionIndex + 1);
        this.resultShown = true;
    }

    showCorrect() {
        this.showResult();
        document.body.style.backgroundColor = "lightgreen";
        submitResultActionContainer.classList.add("correctStyle");
        submitResultMenu.classList.add("correctStyle");
        submitResultMenu.textContent = "Richtig!";
    }

    showIncorrect() {
        this.showResult();
        document.body.style.backgroundColor = "rgb(238, 144, 144)";
        submitResultActionContainer.classList.add("incorrectStyle");
        submitResultMenu.classList.add("incorrectStyle");
        submitResultMenu.textContent = "Falsch!";
    }

    hideCorrectness() {
        document.body.style.backgroundColor = "";
        submitResultActionContainer.style.visibility = "hidden";
        submitResultActionContainer.style.opacity = 0;
        submitResultActionContainer.classList.remove("correctStyle", "incorrectStyle");
        submitResultMenu.style.visibility = "hidden";
        submitResultMenu.style.opacity = 0;
        submitResultMenu.classList.remove("correctStyle", "incorrectStyle");
        this.resultShown = false;
    }

    convert(list) {
        let result = "";
        for (let i = 0; i < list.length; i++) {
            result += list[i] + "<br>";
        }
        return result;
    }

    calcGrade(perc) {
        if (perc >= 0.875) {
            return 1;
        }
        if (perc >= 0.75) {
            return 2;
        }
        if (perc >= 0.625) {
            return 3;
        }
        if (perc >= 0.5) {
            return 4;
        }
        if (perc >= 0.33) {
            return 5;
        }
        return 6;
    }
}

questionResponseInput.addEventListener("input", () => {
    if (currentQuestionaire.isSubmittable()) {
        responseConfirmButton.removeAttribute("disabled");
    } else {
        responseConfirmButton.setAttribute("disabled", "disabled");
    }
})

submitResultActionContainer.addEventListener("click", () => {
        currentQuestionaire.next();
})

responseConfirmButton.addEventListener("click", () => {currentQuestionaire.submit();});
document.body.addEventListener("keyup", (e) => {
    if (currentQuestionaire != null && e.key == "Enter") {
        if (currentQuestionaire.isSubmittable()) {
            currentQuestionaire.submit();
        } else if (currentQuestionaire.resultShown) {
            currentQuestionaire.next();
        }
    }
});


// Main part
loadingMenu.style.visibility = "hidden";
mainMenu.style.visibility = "visible";