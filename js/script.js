/**
 * Variables globales del quiz
 */
let questions = [];
let currentQuestion = 0;
let score = 0;
let timer = 0;
let timerInterval;
let quizStarted = false;
let questionsLoaded = false;

/**
 * Inicialización cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
  // Configurar eventos
  document.getElementById('lang').addEventListener('change', loadQuiz);
  document.getElementById('next-btn').addEventListener('click', handleMainButton);
  document.querySelector('.reset-btn').addEventListener('click', resetQuiz);
  
  // Cargar el quiz inicial
  loadQuiz();
});

/**
 * Carga el quiz según el idioma seleccionado
 */
function loadQuiz() {
  const lang = document.getElementById('lang').value;
  const xhr = new XMLHttpRequest();
  
  // Mostrar estado de carga
  document.getElementById('question').textContent = 'Cargando preguntas...';
  document.getElementById('choices').innerHTML = '';
  document.getElementById('next-btn').disabled = true;
  
  xhr.open('GET', `xml/preguntas_${lang}.xml`, true);
  
  xhr.onload = function() {
    if (xhr.status === 200) {
      try {
        const xml = xhr.responseXML;
        questions = Array.from(xml.getElementsByTagName('question'));
        
        if (questions.length > 0) {
          questionsLoaded = true;
          initializeQuiz();
        } else {
          showError('El archivo XML no contiene preguntas válidas.');
        }
      } catch (error) {
        showError('Error al procesar el archivo XML.');
      }
    } else {
      showError('Error al cargar las preguntas. Inténtalo de nuevo.');
    }
  };
  
  xhr.onerror = function() {
    showError('Error de conexión. Verifica tu acceso a internet.');
  };
  
  xhr.send();
}

/**
 * Inicializa el quiz con las preguntas cargadas
 */
function initializeQuiz() {
  quizStarted = false;
  currentQuestion = 0;
  score = 0;
  timer = 0;
  clearInterval(timerInterval);
  
  // Actualizar la interfaz
  document.getElementById('question').textContent = '¡Listo para comenzar!';
  document.getElementById('choices').innerHTML = '';
  document.getElementById('next-btn').disabled = false;
  document.getElementById('next-btn').textContent = 'Comenzar Quiz';
  document.getElementById('score').textContent = `Puntuación: 0/${questions.length}`;
  document.getElementById('timer').textContent = '⏱ 00:00';
  document.getElementById('progress').style.width = '0%';
  
  // Ocultar resultados si están visibles
  document.getElementById('result').classList.add('hidden');
  document.getElementById('quiz-box').classList.remove('hidden');
}

/**
 * Maneja el botón principal (Comenzar/Siguiente/Finalizar)
 */
function handleMainButton() {
  if (!quizStarted) {
    startQuiz();
  } else {
    nextQuestion();
  }
}

/**
 * Comienza el quiz
 */
function startQuiz() {
  if (!questionsLoaded || questions.length === 0) {
    showError('Las preguntas no se han cargado correctamente.');
    return;
  }
  
  quizStarted = true;
  currentQuestion = 0;
  score = 0;
  timer = 0;
  
  // Iniciar temporizador
  clearInterval(timerInterval);
  timerInterval = setInterval(function() {
    timer++;
    updateTimerDisplay();
  }, 1000);
  
  // Mostrar primera pregunta
  showQuestion();
}

/**
 * Muestra la pregunta actual
 */
function showQuestion() {
  if (currentQuestion >= questions.length) {
    finishQuiz();
    return;
  }

  const question = questions[currentQuestion];
  const wording = question.getElementsByTagName('wording')[0].textContent;
  const choices = question.getElementsByTagName('choice');

  // Mostrar la pregunta
  document.getElementById('question').textContent = wording;

  // Actualizar progreso
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
      
      // Deseleccionar otras opciones
      document.querySelectorAll('.choice').forEach(c => {
        c.classList.remove('selected');
      });
      
      // Seleccionar esta opción
      this.classList.add('selected');
      document.getElementById('next-btn').disabled = false;
    });
    
    choicesContainer.appendChild(choiceElement);
  }

  // Actualizar UI
  updateScoreDisplay();
  document.getElementById('next-btn').disabled = true;
  updateButtonText();
}

/**
 * Maneja el paso a la siguiente pregunta
 */
function nextQuestion() {
  const selected = document.querySelector('.choice.selected');
  
  if (!selected) {
    alert('Por favor selecciona una respuesta antes de continuar.');
    return;
  }
  
  // Verificar respuesta
  const isCorrect = selected.dataset.correct === 'true';
  if (isCorrect) {
    score++;
    selected.classList.add('correct');
  } else {
    selected.classList.add('incorrect');
    // Mostrar la respuesta correcta
    document.querySelectorAll('.choice').forEach(c => {
      if (c.dataset.correct === 'true') {
        c.classList.add('correct');
      }
    });
  }
  
  // Actualizar puntuación
  updateScoreDisplay();
  
  // Deshabilitar interacción con opciones
  document.querySelectorAll('.choice').forEach(c => {
    c.style.pointerEvents = 'none';
  });
  
  // Habilitar botón para continuar
  document.getElementById('next-btn').disabled = false;
  
  // Esperar y pasar a siguiente pregunta
  setTimeout(() => {
    currentQuestion++;
    showQuestion();
  }, 1500);
}

/**
 * Finaliza el quiz mostrando resultados
 */
function finishQuiz() {
  clearInterval(timerInterval);
  
  // Ocultar quiz y mostrar resultados
  document.getElementById('quiz-box').classList.add('hidden');
  document.getElementById('result').classList.remove('hidden');
  
  // Calcular tiempo
  const minutes = Math.floor(timer / 60).toString().padStart(2, '0');
  const seconds = (timer % 60).toString().padStart(2, '0');
  
  // Mostrar puntuación
  const finalScoreElement = document.getElementById('final-score');
  finalScoreElement.innerHTML = `
    <div>Puntuación final:</div>
    <div class="big-score">${score}/${questions.length}</div>
    <div>Tiempo: ${minutes}:${seconds}</div>
  `;
  
  // Mostrar mensaje según rendimiento
  const percentage = Math.round((score / questions.length) * 100);
  const messageElement = document.getElementById('result-message');
  
  if (percentage >= 90) {
    messageElement.innerHTML = '¡Excelente! <span class="emoji">🎉</span><br>Dominas este tema completamente.';
    messageElement.style.backgroundColor = '#e8f5e9';
    messageElement.style.borderLeft = '5px solid #4CAF50';
  } else if (percentage >= 70) {
    messageElement.innerHTML = '¡Buen trabajo! <span class="emoji">👍</span><br>Tienes un buen conocimiento del tema.';
    messageElement.style.backgroundColor = '#e3f2fd';
    messageElement.style.borderLeft = '5px solid #2196F3';
  } else if (percentage >= 50) {
    messageElement.innerHTML = 'No está mal. <span class="emoji">💪</span><br>Sigue practicando para mejorar.';
    messageElement.style.backgroundColor = '#fff8e1';
    messageElement.style.borderLeft = '5px solid #FFC107';
  } else {
    messageElement.innerHTML = '¡Sigue intentándolo! <span class="emoji">📚</span><br>Revisa el material y prueba de nuevo.';
    messageElement.style.backgroundColor = '#ffebee';
    messageElement.style.borderLeft = '5px solid #F44336';
  }
}

/**
 * Reinicia el quiz completamente
 */
function resetQuiz() {
  loadQuiz();
}

/**
 * Actualiza el texto del botón principal
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
 * Actualiza el display de puntuación
 */
function updateScoreDisplay() {
  document.getElementById('score').textContent = `Puntuación: ${score}/${questions.length}`;
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
 * Muestra un mensaje de error
 */
function showError(message) {
  document.getElementById('question').textContent = message;
  document.getElementById('choices').innerHTML = '';
  document.getElementById('next-btn').disabled = true;
  questionsLoaded = false;
}
