/**
 * Variables globales del quiz
 */
let questions = [];       // Almacena las preguntas cargadas
let currentQuestion = 0;  // Índice de la pregunta actual
let score = 0;            // Puntuación del usuario
let timer = 0;            // Tiempo transcurrido en segundos
let timerInterval;        // Referencia al intervalo del temporizador
let selectedChoice = null;// Opción seleccionada por el usuario
let quizStarted = false;  // Estado del quiz

/**
 * Inicializa el quiz cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
  updateUI();
});

/**
 * Carga el quiz según el idioma seleccionado
 */
function loadQuiz() {
  const lang = document.getElementById('lang').value;
  const xhr = new XMLHttpRequest();
  
  xhr.open('GET', `xml/preguntas_${lang}.xml`, true);
  
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        const xml = xhr.responseXML;
        questions = Array.from(xml.getElementsByTagName('question'));
        resetQuizState();
        startQuiz();
      } else {
        showError('Error al cargar las preguntas. Inténtalo de nuevo.');
      }
    }
  };
  
  xhr.onerror = function() {
    showError('Error de conexión. Verifica tu acceso a internet.');
  };
  
  xhr.send();
}

/**
 * Reinicia el estado del quiz
 */
function resetQuizState() {
  currentQuestion = 0;
  score = 0;
  timer = 0;
  quizStarted = false;
  clearInterval(timerInterval);
  updateUI();
}

/**
 * Inicia el quiz
 */
function startQuiz() {
  quizStarted = true;
  startTimer();
  showQuestion();
}

/**
 * Inicia el temporizador
 */
function startTimer() {
  clearInterval(timerInterval);
  timer = 0;
  updateTimerDisplay();
  
  timerInterval = setInterval(function() {
    timer++;
    updateTimerDisplay();
  }, 1000);
}

/**
 * Actualiza el display del temporizador
 */
function updateTimerDisplay() {
  const minutes = Math.floor(timer / 60).toString().padStart(2, '0');
  const seconds = (timer % 60).toString().padStart(2, '0');
  document.getElementById('timer').textContent = `⏱ ${minutes}:${seconds}`;
}

/**
 * Muestra la pregunta actual
 */
function showQuestion() {
  if (!questions.length || currentQuestion >= questions.length) {
    finishQuiz();
    return;
  }

  const question = questions[currentQuestion];
  const wording = question.getElementsByTagName('wording')[0].textContent;
  const choices = question.getElementsByTagName('choice');

  // Actualizar la pregunta
  document.getElementById('question').textContent = wording;

  // Actualizar el progreso
  updateProgress();

  // Limpiar opciones anteriores
  const choicesContainer = document.getElementById('choices');
  choicesContainer.innerHTML = '';

  // Añadir nuevas opciones
  for (let i = 0; i < choices.length; i++) {
    const choice = choices[i];
    const choiceElement = document.createElement('div');
    choiceElement.className = 'choice';
    choiceElement.textContent = choice.textContent;
    choiceElement.dataset.correct = choice.getAttribute('correct') === 'yes';
    
    choiceElement.addEventListener('click', function() {
      if (this.classList.contains('selected')) return;
      
      // Deseleccionar todas las opciones
      document.querySelectorAll('.choice').forEach(c => {
        c.classList.remove('selected');
      });
      
      // Seleccionar esta opción
      this.classList.add('selected');
      selectedChoice = this;
      
      // Habilitar el botón de siguiente
      document.getElementById('next-btn').disabled = false;
    });
    
    choicesContainer.appendChild(choiceElement);
  }

  // Actualizar puntuación
  updateScoreDisplay();

  // Reiniciar selección y deshabilitar botón
  selectedChoice = null;
  document.getElementById('next-btn').disabled = true;
  updateButtonText();
}

/**
 * Maneja el evento de siguiente pregunta
 */
function handleNextQuestion() {
  if (!quizStarted) {
    startQuiz();
    return;
  }

  if (selectedChoice) {
    // Verificar respuesta
    const isCorrect = selectedChoice.dataset.correct === 'true';
    
    if (isCorrect) {
      score++;
      selectedChoice.classList.add('correct');
    } else {
      selectedChoice.classList.add('incorrect');
      // Mostrar la respuesta correcta
      document.querySelectorAll('.choice').forEach(c => {
        if (c.dataset.correct === 'true') {
          c.classList.add('correct');
        }
      });
    }
    
    // Actualizar puntuación
    updateScoreDisplay();
    
    // Deshabilitar todas las opciones
    document.querySelectorAll('.choice').forEach(c => {
      c.style.pointerEvents = 'none';
    });
    
    // Cambiar texto del botón y habilitarlo
    updateButtonText();
    document.getElementById('next-btn').disabled = false;
    
    // Esperar un momento antes de pasar a la siguiente pregunta
    setTimeout(() => {
      currentQuestion++;
      showQuestion();
    }, 1500);
  }
}

/**
 * Actualiza el display de la puntuación
 */
function updateScoreDisplay() {
  document.getElementById('score').textContent = `Puntuación: ${score}/${questions.length}`;
}

/**
 * Actualiza el texto del botón según el estado
 */
function updateButtonText() {
  const btn = document.getElementById('next-btn');
  
  if (!quizStarted) {
    btn.textContent = 'Comenzar Quiz';
  } else if (currentQuestion < questions.length - 1) {
    btn.textContent = 'Siguiente Pregunta';
  } else {
    btn.textContent = 'Finalizar Quiz';
  }
}

/**
 * Actualiza la barra de progreso
 */
function updateProgress() {
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  document.getElementById('progress').style.width = `${progress}%`;
}

/**
 * Finaliza el quiz y muestra los resultados
 */
function finishQuiz() {
  clearInterval(timerInterval);
  
  // Ocultar el quiz y mostrar resultados
  document.getElementById('quiz-box').classList.add('hidden');
  document.getElementById('result').classList.remove('hidden');
  
  // Mostrar puntuación final
  const minutes = Math.floor(timer / 60).toString().padStart(2, '0');
  const seconds = (timer % 60).toString().padStart(2, '0');
  const finalScore = document.getElementById('final-score');
  finalScore.textContent = `Puntuación: ${score}/${questions.length} en ${minutes}:${seconds}`;
  
  // Calcular porcentaje y mensaje
  const percentage = Math.round((score / questions.length) * 100);
  const messageElement = document.getElementById('result-message');
  
  let message = '';
  if (percentage >= 90) {
    message = '¡Excelente! 🎉 Dominas este tema completamente.';
    messageElement.style.backgroundColor = '#e8f5e9';
  } else if (percentage >= 70) {
    message = '¡Buen trabajo! 👍 Tienes un buen conocimiento del tema.';
    messageElement.style.backgroundColor = '#e3f2fd';
  } else if (percentage >= 50) {
    message = 'No está mal. 💪 Sigue practicando para mejorar.';
    messageElement.style.backgroundColor =rgb(255, 247, 221);
  } else {
    message = '¡Sigue intentándolo! 📚 Revisa el material y prueba de nuevo.';
    messageElement.style.backgroundColor = '#ffebee';
  }
  
  messageElement.textContent = message;
}

/**
 * Reinicia el quiz completo
 */
function resetQuiz() {
  document.getElementById('result').classList.add('hidden');
  document.getElementById('quiz-box').classList.remove('hidden');
  loadQuiz();
}

/**
 * Muestra un mensaje de error
 */
function showError(message) {
  document.getElementById('question').textContent = message;
  document.getElementById('choices').innerHTML = '';
  document.getElementById('next-btn').disabled = true;
}

/**
 * Actualiza la UI según el estado
 */
function updateUI() {
  updateButtonText();
  updateScoreDisplay();
  updateTimerDisplay();
}