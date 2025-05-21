/**
 * Variables globales del quiz
 */
let questions = [];
let currentQuestion = 0;
let score = 0;
let timer = 0;
let timerInterval;
let selectedChoice = null;
let quizStarted = false;

/**
 * Inicializa la interfaz al cargar
 */
document.addEventListener('DOMContentLoaded', function () {
  updateUI();
});

/**
 * Carga las preguntas desde el XML
 */
function loadQuiz() {
  const lang = document.getElementById('lang').value;
  const xhr = new XMLHttpRequest();
  xhr.open('GET', `xml/preguntas_${lang}.xml`, true);

  xhr.onload = function () {
    if (xhr.status === 200) {
      const xml = xhr.responseXML;
      questions = Array.from(xml.getElementsByTagName('question')).map(q => {
        return {
          wording: q.getElementsByTagName('wording')[0].textContent,
          choices: Array.from(q.getElementsByTagName('choice')).map(c => ({
            text: c.textContent,
            correct: c.getAttribute('correct') === 'yes'
          }))
        };
      });
      startQuiz();
    } else {
      showError('❌ Error al cargar las preguntas.');
    }
  };

  xhr.onerror = function () {
    showError('⚠️ Error de red. Revisa tu conexión.');
  };

  xhr.send();
}

/**
 * Comienza el quiz
 */
function startQuiz() {
  quizStarted = true;
  currentQuestion = 0;
  score = 0;
  timer = 0;
  clearInterval(timerInterval);
  document.getElementById('result').classList.add('hidden');
  document.getElementById('next-btn').innerText = "Siguiente";
  startTimer();
  showQuestion();
}

/**
 * Muestra la pregunta actual
 */
function showQuestion() {
  if (currentQuestion >= questions.length) {
    endQuiz();
    return;
  }

  const q = questions[currentQuestion];
  const questionElem = document.getElementById('question');
  const choicesElem = document.getElementById('choices');
  const progress = document.getElementById('progress');

  questionElem.textContent = q.wording;
  choicesElem.innerHTML = "";
  document.getElementById('next-btn').disabled = true;

  q.choices.forEach((choice, index) => {
    const div = document.createElement('div');
    div.className = 'choice';
    div.textContent = choice.text;
    div.dataset.correct = choice.correct;
    div.onclick = () => handleChoiceSelection(div);
    choicesElem.appendChild(div);
  });

  selectedChoice = null;
  progress.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
  updateScoreDisplay();
}

/**
 * Maneja la selección de una opción
 */
function handleChoiceSelection(choiceElem) {
  if (selectedChoice) return;

  selectedChoice = choiceElem;
  choiceElem.classList.add('selected');
  document.getElementById('next-btn').disabled = false;
}

/**
 * Controla el paso a la siguiente pregunta
 */
document.getElementById('next-btn').addEventListener('click', () => {
  if (!quizStarted) return;
  if (!selectedChoice) return;

  const isCorrect = selectedChoice.dataset.correct === 'true';

  if (isCorrect) {
    score++;
    selectedChoice.classList.add('correct');
  } else {
    selectedChoice.classList.add('incorrect');
    document.querySelectorAll('.choice').forEach(c => {
      if (c.dataset.correct === 'true') c.classList.add('correct');
    });
  }

  updateScoreDisplay();

  setTimeout(() => {
    currentQuestion++;
    showQuestion();
  }, 1000);
});

/**
 * Muestra la puntuación y mensaje final
 */
function endQuiz() {
  clearInterval(timerInterval);
  document.getElementById('quiz-box').classList.add('hidden');
  const lang = document.getElementById('lang').value;

  const finalScore = document.getElementById('final-score');
  const resultMessage = document.getElementById('result-message');
  const resultBox = document.getElementById('result');

  finalScore.textContent = `${lang === 'es' ? 'Tu puntuación' : 'Your score'}: ${score}/${questions.length}`;
  resultMessage.textContent =
    score === questions.length
      ? lang === 'es' ? "¡Perfecto!" : "Perfect!"
      : lang === 'es'
      ? "¡Buen intento! Puedes volver a intentarlo."
      : "Nice try! You can do it again.";

  resultBox.classList.remove('hidden');
}

/**
 * Reinicia el quiz
 */
function resetQuiz() {
  document.getElementById('quiz-box').classList.remove('hidden');
  loadQuiz();
}

/**
 * Actualiza el contador de puntuación
 */
function updateScoreDisplay() {
  document.getElementById('score').textContent = `Puntuación: ${score}/${questions.length}`;
}

/**
 * Muestra un error en la interfaz
 */
function showError(msg) {
  document.getElementById('question').textContent = msg;
  document.getElementById('choices').innerHTML = '';
}

/**
 * Inicia el temporizador
 */
function startTimer() {
  timerInterval = setInterval(() => {
    timer++;
    const min = String(Math.floor(timer / 60)).padStart(2, '0');
    const sec = String(timer % 60).padStart(2, '0');
    document.getElementById('timer').textContent = `⏱ ${min}:${sec}`;
  }, 1000);
}

/**
 * Refresca la UI cuando se carga el DOM
 */
function updateUI() {
  document.getElementById('next-btn').disabled = true;
  document.getElementById('score').textContent = "Puntuación: 0/0";
  document.getElementById('quiz-box').classList.remove('hidden');
}
