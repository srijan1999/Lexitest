const state = {
    questions: [],
    current: 0,
    score: 0,
    answered: 0,
    streak: 0,
    locked: false
};


const elements = {
    questionText: document.getElementById("questionText"),
    questionNumber: document.getElementById("questionNumber"),
    options: document.getElementById("options"),

    currentQuestion: document.getElementById("currentQuestion"),
    totalQuestions: document.getElementById("totalQuestions"),

    score: document.getElementById("score"),
    accuracy: document.getElementById("accuracy"),
    streak: document.getElementById("streak"),

    progressBar: document.getElementById("progressBar"),

    explanation: document.getElementById("explanation"),
    explanationText: document.getElementById("explanationText"),

    nextButton: document.getElementById("nextButton"),

    themeToggle: document.getElementById("themeToggle"),
    themeIcon: document.getElementById("themeIcon")
};


/* --------------------------------
   LOAD QUESTIONS
-------------------------------- */

async function loadQuestions() {

    try {

        const response = await fetch("questions.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Could not load questions.json");
        }

        const questions = await response.json();

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("The question file is empty.");
        }

        state.questions = questions;

        elements.totalQuestions.textContent = questions.length;

        showQuestion();

    } catch (error) {

        console.error(error);

        elements.questionText.textContent =
            "Unable to load the question set.";

        elements.options.innerHTML = `
            <div style="
                grid-column: 1 / -1;
                color: var(--text-secondary);
                font-size: 13px;
                line-height: 1.6;
            ">
                Make sure <strong>questions.json</strong> is in the same
                folder as this page and that the website is being served
                through a local web server.
            </div>
        `;
    }
}


/* --------------------------------
   DISPLAY QUESTION
-------------------------------- */

function showQuestion() {

    const question = state.questions[state.current];

    if (!question) {
        showFinished();
        return;
    }

    state.locked = false;

    elements.currentQuestion.textContent = state.current + 1;

    elements.questionNumber.textContent =
        `QUESTION ${String(state.current + 1).padStart(2, "0")}`;

    elements.questionText.textContent = question.question;

    elements.options.innerHTML = "";

    elements.explanation.hidden = true;

    elements.explanationText.textContent = "";

    elements.nextButton.disabled = true;


    question.options.forEach((optionText, index) => {

        const button = document.createElement("button");

        button.type = "button";
        button.className = "option";

        const letter = document.createElement("span");

        letter.className = "option-letter";

        letter.textContent =
            String.fromCharCode(65 + index);


        const text = document.createElement("span");

        text.textContent = optionText;


        button.appendChild(letter);
        button.appendChild(text);


        button.addEventListener("click", () => {
            checkAnswer(index);
        });


        elements.options.appendChild(button);
    });


    updateStats();
    updateProgress();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* --------------------------------
   CHECK ANSWER
-------------------------------- */

function checkAnswer(selectedIndex) {

    if (state.locked) {
        return;
    }

    state.locked = true;

    const question = state.questions[state.current];

    const buttons =
        [...elements.options.querySelectorAll(".option")];

    const isCorrect =
        selectedIndex === question.answer;


    state.answered++;


    if (isCorrect) {

        state.score++;
        state.streak++;

    } else {

        state.streak = 0;
    }


    /*
     * Always reveal the correct answer.
     */

    buttons.forEach((button, index) => {

        button.disabled = true;

        if (index === question.answer) {
            button.classList.add("correct");
        }

        if (index === selectedIndex && !isCorrect) {
            button.classList.add("wrong");
        }
    });


    /*
     * Show explanation if the JSON contains one.
     */

    if (question.explanation) {

        elements.explanationText.textContent =
            question.explanation;

        elements.explanation.hidden = false;
    }


    elements.nextButton.disabled = false;

    updateStats();
}


/* --------------------------------
   NEXT QUESTION
-------------------------------- */

elements.nextButton.addEventListener("click", () => {

    if (!state.locked) {
        return;
    }

    state.current++;

    showQuestion();
});


/* --------------------------------
   STATISTICS
-------------------------------- */

function updateStats() {

    elements.score.textContent = state.score;

    elements.streak.textContent = state.streak;


    const accuracy =
        state.answered === 0
            ? 0
            : Math.round(
                (state.score / state.answered) * 100
            );


    elements.accuracy.textContent =
        `${accuracy}%`;
}


/* --------------------------------
   PROGRESS
-------------------------------- */

function updateProgress() {

    const percentage =
        ((state.current + 1) / state.questions.length) * 100;

    elements.progressBar.style.width =
        `${percentage}%`;
}


/* --------------------------------
   FINISHED
-------------------------------- */

function showFinished() {

    const percentage =
        state.answered === 0
            ? 0
            : Math.round(
                (state.score / state.answered) * 100
            );


    elements.questionNumber.textContent = "COMPLETE";

    elements.questionText.textContent =
        "Vocabulary test complete.";

    elements.options.innerHTML = `
        <div style="
            grid-column: 1 / -1;
            padding: 25px 0;
        ">
            <div style="
                font-size: 42px;
                font-weight: 600;
                letter-spacing: -0.04em;
            ">
                ${percentage}%
            </div>

            <p style="
                margin-top: 8px;
                color: var(--text-secondary);
                font-size: 13px;
                line-height: 1.6;
            ">
                You answered ${state.score} out of
                ${state.answered} questions correctly.
            </p>
        </div>
    `;


    elements.explanation.hidden = true;

    elements.nextButton.textContent =
        "Restart test ↻";

    elements.nextButton.disabled = false;

    elements.nextButton.onclick = restartTest;

    elements.progressBar.style.width = "100%";
}


function restartTest() {

    state.current = 0;
    state.score = 0;
    state.answered = 0;
    state.streak = 0;
    state.locked = false;


    elements.nextButton.textContent =
        "Next question →";

    elements.nextButton.onclick = null;


    showQuestion();
}


/* --------------------------------
   DARK MODE
-------------------------------- */

function setTheme(theme) {

    document.documentElement.dataset.theme = theme;

    localStorage.setItem("lexicon-theme", theme);

    elements.themeIcon.textContent =
        theme === "dark" ? "☀" : "☾";
}


const savedTheme =
    localStorage.getItem("lexicon-theme");


if (savedTheme) {

    setTheme(savedTheme);

} else if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
) {

    setTheme("dark");

} else {

    setTheme("light");
}


elements.themeToggle.addEventListener("click", () => {

    const currentTheme =
        document.documentElement.dataset.theme;

    setTheme(
        currentTheme === "dark"
            ? "light"
            : "dark"
    );
});


/* --------------------------------
   START
-------------------------------- */

loadQuestions();
