const AVAILABLE_TOPICS = ['biologia'];

const topicsContainer = document.getElementById('topics-container');
const topicsSection = document.getElementById('topics-section');
const rouletteSection = document.getElementById('roulette-section');
const questionSection = document.getElementById('question-section');
const spinButton = document.getElementById('spin-button');
const questionTextElement = document.getElementById('question-text');
const hintsContainer = document.getElementById('hints-container');
const showAnswerButton = document.getElementById('show-answer-button');
const nextButton = document.getElementById('next-button');
const timerDisplay = document.getElementById('timer-display');
const answerContainer = document.getElementById('answer-container');
const answerTextElement = document.getElementById('answer-text');
const themeSwitch = document.getElementById('checkbox') as HTMLInputElement;

// State management
let currentTopicQuestions: { [key: string]: any } = {};
let answeredQuestions: string[] = [];
let selectedQuestionName: string | null = null;
let countdownTimer: number | undefined;


async function loadTopicButtons() {
    if (topicsContainer) {
        topicsContainer.innerHTML = ''; // Clear existing content
        AVAILABLE_TOPICS.forEach(topicName => {
            const button = document.createElement('button');
            button.classList.add('topic-button');
            button.textContent = topicName;
            button.onclick = () => selectTopic(topicName);
            topicsContainer.appendChild(button);
        });
    }
}

async function selectTopic(topicName: string) {
    console.log(`Selected topic: ${topicName}`);
    try {
        const response = await fetch(`./data/${topicName.toLowerCase()}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        currentTopicQuestions = await response.json();
        answeredQuestions = []; // Reset answered questions when a new topic is selected
        console.log("Loaded questions for topic:", topicName, currentTopicQuestions);

        // Hide topics section
        if (topicsSection) {
            topicsSection.classList.add('hidden');
        }

        // Show roulette section
        if (rouletteSection) {
            rouletteSection.classList.remove('hidden');
        }
    } catch (error) {
        console.error(`Failed to load questions for topic ${topicName}:`, error);
        if (topicsContainer) {
            topicsContainer.innerHTML = `<p>Erro ao carregar perguntas para o tópico "${topicName}". Por favor, tente novamente mais tarde.</p>`;
        }
    }
}

function pickRandomQuestion() {
    const unansweredQuestions = Object.keys(currentTopicQuestions).filter(q => !answeredQuestions.includes(q));

    if (unansweredQuestions.length === 0) {
        // All questions answered
        if (questionTextElement) questionTextElement.textContent = "Parabéns! Você respondeu todas as perguntas!";
        if (hintsContainer) hintsContainer.innerHTML = '';
        if (answerContainer) answerContainer.classList.add('hidden');
        if (showAnswerButton) showAnswerButton.classList.add('hidden');
        if (nextButton) nextButton.classList.add('hidden');
        // Maybe add a "Restart" button here
        return;
    }

    const randomIndex = Math.floor(Math.random() * unansweredQuestions.length);
    selectedQuestionName = unansweredQuestions[randomIndex]!;

    if (questionTextElement && selectedQuestionName) {
        questionTextElement.textContent = selectedQuestionName;
    }

    // Reset UI for new question
    if (hintsContainer) hintsContainer.innerHTML = '';
    if (timerDisplay) timerDisplay.textContent = '';
    if (answerContainer) answerContainer.classList.add('hidden');
    if (showAnswerButton) showAnswerButton.classList.remove('hidden');
    if (nextButton) nextButton.classList.add('hidden');
    clearTimeout(countdownTimer); // Clear any previous timers

    // Hide roulette section
    if (rouletteSection) {
        rouletteSection.classList.add('hidden');
    }

    // Show question section
    if (questionSection) {
        questionSection.classList.remove('hidden');
    }

    displayHints();
}

function displayHints() {
    if (!hintsContainer || !selectedQuestionName || !currentTopicQuestions[selectedQuestionName]) {
        return;
    }

    hintsContainer.innerHTML = ''; // Clear previous hints

    const questionData = currentTopicQuestions[selectedQuestionName];

    for (let i = 1; i <= 4; i++) {
        const hintKey = `Hint ${i}`;
        const hintText = questionData[hintKey];

        if (hintText) {
            const hintButton = document.createElement('button');
            hintButton.classList.add('hint-button');
            hintButton.textContent = `Dica ${i}`; // Initial button text
            hintButton.dataset.hintNumber = String(i); // Store hint number

            let revealed = false; // Track if hint is revealed
            hintButton.onclick = () => {
                if (!revealed) {
                    hintButton.textContent = hintText; // Reveal hint
                    hintButton.disabled = true; // Disable button after revealing
                    revealed = true;
                    hintButton.classList.add('revealed-hint');
                }
            };
            hintsContainer.appendChild(hintButton);
        }
    }
}

function startAnswerTimer() {
    if (showAnswerButton) showAnswerButton.classList.add('hidden'); // Hide button once timer starts

    let timeLeft = 10;
    if (timerDisplay) timerDisplay.textContent = `Tempo restante: ${timeLeft}s`;

    countdownTimer = setInterval(() => {
        timeLeft--;
        if (timerDisplay) timerDisplay.textContent = `Tempo restante: ${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            revealAnswer();
        }
    }, 1000);
}

function revealAnswer() {
    if (!selectedQuestionName || !currentTopicQuestions[selectedQuestionName]) {
        console.warn("No question selected to reveal answer.");
        return;
    }

    // Add to answered list
    if (!answeredQuestions.includes(selectedQuestionName)) {
        answeredQuestions.push(selectedQuestionName);
    }

    const questionData = currentTopicQuestions[selectedQuestionName];
    if (answerTextElement) {
        answerTextElement.textContent = questionData.Answer;
    }
    if (answerContainer) {
        answerContainer.classList.remove('hidden');
    }
    if (timerDisplay) timerDisplay.textContent = ''; // Clear timer display
    if (showAnswerButton) showAnswerButton.classList.add('hidden');
    if (nextButton) nextButton.classList.remove('hidden'); // Show the next button
}


if (spinButton) {
    spinButton.addEventListener('click', pickRandomQuestion);
}

if (showAnswerButton) {
    showAnswerButton.addEventListener('click', startAnswerTimer);
}

if (nextButton) {
    nextButton.addEventListener('click', pickRandomQuestion);
}

// Theme switcher logic
if (themeSwitch) {
    themeSwitch.addEventListener('change', () => {
        if (themeSwitch.checked) {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            localStorage.setItem('theme', 'light');
        }
    });
}

function applyInitialTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        if (themeSwitch) themeSwitch.checked = true;
        document.body.classList.add('dark-theme');
    } else {
        if (themeSwitch) themeSwitch.checked = false;
        document.body.classList.remove('dark-theme');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTopicButtons();
    applyInitialTheme();
});