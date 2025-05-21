let questions = [];
let currentQuestion = 0;
let score = 0;
let timer = 0;
let timerInterval;
let quizStarted = false;
let questionsLoaded = false;

/**
 * Mezcla un array (Fisher-Yates)
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('lang').addEventListener('change', loadQuiz);
  document.getElementById('next-btn').addEventListener('click', handleMainButton);

  loadQuiz();
});

function loadQuiz() {
  const lang = document.getElementById('lang').value;
  const xhr = new XMLHttpRequest();

  document.getElementById('question').textContent = 'Cargando preguntas...';
  document.getElementById('choices').innerHTML = '';
  document.getElementById('next-btn').disabled = true;

  xhr.open('GET', `xml/preguntas_${lang}.xml`, true);

  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        const xml = xhr.responseXML;
        const qNodes = Array.from(xml.getElementsByTagName('question'));

        if (qNodes.length > 0) {
          // Convertir cada pregunta XML en un objeto para facilitar manejo y mezcla
          questions = qNodes.map((qNode) => {
            const wording = qNode.getElementsByTagName('wording')[0].textContent;
            const choicesNodes = Array.from(qNode.getElementsByTagName('choice'));
            const choices = choicesNodes.map((choiceNode) => ({
              text: choiceNode.textContent,
              correct: choiceNode.getAttribute('correct') === 'yes',
            }));
            return { wording, choices };
          });

          // Barajar preguntas y también barajar respuestas dentro de cada pregunta
          questions = shuffleArray(questions);
          questions.forEach((q) => (q.choices = shuffleArray(q.choices)));

          questionsLoaded = true;
          initializeQuiz();
        } else {
          showError('El archivo XML no contiene preguntas válidas.');
        }
      } catch {
        showError('Error al procesar el archivo XML.');
      }
    } else {
      showError('Error al cargar las preguntas. Inténtalo de nuevo.');
    }
  };

  xhr.onerror = function () {
    showError('Error de conexión. Verifica tu acceso a internet.');
  };

  xhr.send();
}

function initializeQuiz() {
  quizStarted = false;
  currentQuestion = 0;
  score = 0;
  timer = 0;
  clearInterval(timerInterval);

  document.getElementById('question').textContent = '¡Listo para comenzar!';
  document.getElementById('choices').innerHTML = '';
  document.getElementById('next-btn').disabled = false;
  document.getElementById('next-btn').textContent = 'Comenzar Quiz';
  document.getElementById('score').textContent = `Puntuación: 0/${questions.length}`;
  document.getElementById('timer').textContent = '⏱ 00:00';
  document.getElementById('progress').style.width = '0%';

  document.getElementById('result').classList.add('hidden');
  document.getElementById('quiz-box').classList.remove('hidden');
}

function handleMainButton() {
  if (!quizStarted) {
    startQuiz();
  } else {
    nextQuestion();
  }
}

function startQuiz() {
  if (!questionsLoaded || questions.length === 0) {
    showError('Las preguntas no se han cargado correctamente.');
    return;
  }

  quizStarted = true;
  currentQuestion = 0;
  score = 0;
  timer = 0;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timer++;
    updateTimerDisplay();
  }, 1000);

  showQuestion();
}

function showQuestion() {
  if (currentQuestion >= questions.length) {
    finishQuiz();
    return;
  }

  const question = questions[currentQuestion];

  document.getElementById('question').textContent = question.wording;
  updateProgress();

  const choicesContainer = document.getElementById('choices');
  choicesContainer.innerHTML = '';

  question.choices.forEach((choice, i) => {
    const choiceElement = document.createElement('div');
    choiceElement.className = 'choice';
    choiceElement.textContent = choice.text;
    choiceElement.dataset.correct = choice.correct ? 'true' : 'false';

    choiceElement.addEventListener('click', function () {
      if (this.classList.contains('selected')) return;

      document.querySelectorAll('.choice').forEach((c) => c.classList.remove('selected'));
      this.classList.add('selected');
      document.getElementById('next-btn').disabled = false;
    });

    choicesContainer.appendChild(choiceElement);
  });

  updateScoreDisplay();
  document.getElementById('next-btn').disabled = true;
  updateButtonText();
}

function nextQuestion() {
  const selected = document.querySelector('.choice.selected');

  const isCorrect = selected.dataset.correct === 'true';
  if (isCorrect) {
    score++;
    selected.classList.add('correct');
  } else {
    selected.classList.add('incorrect');
    // Mostrar respuesta correcta
    document.querySelectorAll('.choice').forEach((c) => {
      if (c.dataset.correct === 'true') c.classList.add('correct');
    });
  }

  updateScoreDisplay();

  // Deshabilitar todas las opciones para que no puedan cambiar respuesta
  document.querySelectorAll('.choice').forEach((c) => {
    c.style.pointerEvents = 'none';
  });

  // Deshabilitar botón para evitar clicks rápidos
  document.getElementById('next-btn').disabled = true;

  setTimeout(() => {
    currentQuestion++;
    showQuestion();
  }, 1500);
}

function finishQuiz() {
  clearInterval(timerInterval);

  document.getElementById('quiz-box').classList.add('hidden');
  document.getElementById('result').classList.remove('hidden');

  const minutes = String(Math.floor(timer / 60)).padStart(2, '0');
  const seconds = String(timer % 60).padStart(2, '0');

  const finalScoreElement = document.getElementById('final-score');
  finalScoreElement.innerHTML = `
    <div>Puntuación final:</div>
    <div class="big-score">${score}/${questions.length}</div>
    <div>Tiempo: ${minutes}:${seconds}</div>
  `;

  const percentage = Math.round((score / questions.length) * 100);
  const messageElement = document.getElementById('result-message');

  if (percentage >= 90) {
    messageElement.innerHTML = '¡Excelente! <span class="emoji">🎉</span><br>Dominas este tema completamente.';
    messageElement.style.backgroundColor = '#e8f5e9';
    messageElement.style.borderLeft = '5px solid #4CAF50';
  } else if (percentage >= 60) {
    messageElement.innerHTML = '¡Bien hecho! <span class="emoji">👍</span><br>Pero aún hay espacio para mejorar.';
    messageElement.style.backgroundColor = '#fff8e1';
    messageElement.style.borderLeft = '5px solid #FFC107';
  } else {
    messageElement.innerHTML = 'Necesitas más práctica. <span class="emoji">😕</span><br>No te rindas, sigue intentándolo.';
    messageElement.style.backgroundColor = '#ffebee';
    messageElement.style.borderLeft = '5px solid #F44336';
  }
}

function resetQuiz() {
  initializeQuiz();
  document.getElementById('result').classList.add('hidden');
  document.getElementById('quiz-box').classList.remove('hidden');
}

function updateTimerDisplay() {
  const minutes = String(Math.floor(timer / 60)).padStart(2, '0');
  const seconds = String(timer % 60).padStart(2, '0');
  document.getElementById('timer').textContent = `⏱ ${minutes}:${seconds}`;
}

function updateScoreDisplay() {
  document.getElementById('score').textContent = `Puntuación: ${score}/${questions.length}`;
}

function updateProgress() {
  const progressPercent = ((currentQuestion) / questions.length) * 100;
  document.getElementById('progress').style.width = progressPercent + '%';
}

function updateButtonText() {
  if (!quizStarted) {
    document.getElementById('next-btn').textContent = 'Comenzar Quiz';
  } else if (currentQuestion === questions.length - 1) {
    document.getElementById('next-btn').textContent = 'Finalizar';
  } else {
    document.getElementById('next-btn').textContent = 'Siguiente';
  }
}

function showError(msg) {
  document.getElementById('question').textContent = msg;
  document.getElementById('choices').innerHTML = '';
  document.getElementById('next-btn').disabled = true;
}
