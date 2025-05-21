/**
 * =============================================
 * QUIZ SOBRE XML Y AJAX - ARCHIVO JAVASCRIPT
 * =============================================
 * 
 * Este script maneja toda la lógica del quiz:
 * - Carga de preguntas desde XML
 * - Manejo del temporizador
 * - Sistema de puntuación
 * - Navegación entre preguntas
 * - Mostrar resultados finales
 */

/**
 * Variables globales del quiz
 */
let questions = [];       // Almacena todas las preguntas cargadas
let currentQuestion = 0;  // Índice de la pregunta actual
let score = 0;            // Puntuación acumulada
let timer = 0;            // Tiempo transcurrido en segundos
let timerInterval;        // Referencia al intervalo del temporizador
let quizStarted = false;  // Indica si el quiz ha comenzado
let questionsLoaded = false; // Indica si las preguntas se cargaron correctamente

/**
 * Inicialización cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
  // Cargar las preguntas automáticamente al inicio según el idioma por defecto
  loadQuiz();
  
  // Configurar el evento de cambio de idioma
  document.getElementById('lang').addEventListener('change', function() {
    loadQuiz();
  });
});

/**
 * Carga las preguntas desde el archivo XML según el idioma seleccionado
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
        showError('Error al procesar el archivo XML: ' + error.message);
      }
    } else {
      showError('Error al cargar las preguntas. Código: ' + xhr.status);
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
  // Reiniciar estado del quiz
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
  
  // Ocultar resultados si están visibles
  document.getElementById('result').classList.add('hidden');
  document.getElementById('quiz-box').classList.remove('hidden');
}

/**
 * Comienza el quiz cuando el usuario hace clic en "Comenzar Quiz"
 */
function startQuiz() {
  if (!questionsLoaded || questions.length === 0) {
    showError('Las preguntas no se han cargado correctamente. Intenta recargar la página.');
    return;
  }
  
  // Configurar estado inicial
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
  
  // Mostrar la primera pregunta
  showQuestion();
}

/**
 * Muestra la pregunta actual en la interfaz
 */
function showQuestion() {
  // Verificar si hemos llegado al final del quiz
  if (currentQuestion >= questions.length) {
    finishQuiz();
    return;
  }
  
  const question = questions[currentQuestion];
  const wording = question.getElementsByTagName('wording')[0].textContent;
  const choices = question.getElementsByTagName('choice');
  
  // Mostrar la pregunta
  document.getElementById('question').textContent = wording;
  
  // Actualizar barra de progreso
  updateProgress();
  
  // Limpiar opciones anteriores
  const choicesContainer = document.getElementById('choices');
  choicesContainer.innerHTML = '';
  
  // Añadir las opciones de respuesta
  for (let i = 0; i < choices.length; i++) {
    const choice = choices[i];
    const isCorrect = choice.getAttribute('correct') === 'yes';
    
    const choiceElement = document.createElement('div');
    choiceElement.className = 'choice';
    choiceElement.textContent = choice.textContent;
    choiceElement.dataset.correct = isCorrect;
    
    // Manejar clic en la opción
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
  
  // Actualizar la interfaz
  updateScoreDisplay();
  document.getElementById('next-btn').disabled = true;
  updateButtonText();
}

/**
 * Maneja el evento de pasar a la siguiente pregunta
 */
function nextQuestion() {
  const selected = document.querySelector('.choice.selected');
  
  if (!selected) {
    alert('Por favor selecciona una respuesta antes de continuar.');
    return;
  }
  
  // Verificar si la respuesta es correcta
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
  
  // Deshabilitar todas las opciones
  document.querySelectorAll('.choice').forEach(c => {
    c.style.pointerEvents = 'none';
  });
  
  // Habilitar el botón para continuar
  document.getElementById('next-btn').disabled = false;
  
  // Esperar un momento y pasar a la siguiente pregunta
  setTimeout(() => {
    currentQuestion++;
    showQuestion();
  }, 1500);
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
 * Finaliza el quiz y muestra los resultados
 */
function finishQuiz() {
  clearInterval(timerInterval);
  
  // Ocultar el quiz y mostrar resultados
  document.getElementById('quiz-box').classList.add('hidden');
  document.getElementById('result').classList.remove('hidden');
  
  // Calcular tiempo transcurrido
  const minutes = Math.floor(timer / 60).toString().padStart(2, '0');
  const seconds = (timer % 60).toString().padStart(2, '0');
  
  // Mostrar puntuación final
  document.getElementById('final-score').textContent = 
    `Puntuación: ${score}/${questions.length} en ${minutes}:${seconds}`;
  
  // Mostrar mensaje según el rendimiento
  const percentage = Math.round((score / questions.length) * 100);
  const messageElement = document.getElementById('result-message');
  
  if (percentage >= 90) {
    messageElement.textContent = '¡Excelente! 🎉 Dominas este tema completamente.';
    messageElement.style.backgroundColor = '#e8f5e9';
  } else if (percentage >= 70) {
    messageElement.textContent = '¡Buen trabajo! 👍 Tienes un buen conocimiento del tema.';
    messageElement.style.backgroundColor = '#e3f2fd';
  } else if (percentage >= 50) {
    messageElement.textContent = 'No está mal. 💪 Sigue practicando para mejorar.';
    messageElement.style.backgroundColor = '#fff8e1';
  } else {
    messageElement.textContent = '¡Sigue intentándolo! 📚 Revisa el material y prueba de nuevo.';
    messageElement.style.backgroundColor = '#ffebee';
  }
}

/**
 * Reinicia el quiz completamente
 */
function resetQuiz() {
  loadQuiz();
}

/**
 * Actualiza el texto del botón principal según el estado
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
 * Actualiza el display de la puntuación
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
 * Muestra un mensaje de error en la interfaz
 */
function showError(message) {
  document.getElementById('question').textContent = message;
  document.getElementById('choices').innerHTML = '';
  document.getElementById('next-btn').disabled = true;
  questionsLoaded = false;
}
