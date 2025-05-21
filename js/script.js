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
  
  xhr.onload = function() {
    if (xhr.status === 200) {
      const xml = xhr.responseXML;
      questions = Array.from(xml.getElementsByTagName('question'));
      if (questions.length > 0) {
        startQuiz(); // Iniciar el quiz después de cargar las preguntas
      } else {
        showError('No se encontraron preguntas en el archivo XML.');
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
 * Inicia el quiz
 */
function startQuiz() {
  // Verificar que hay preguntas cargadas
  if (questions.length === 0) {
    showError('No hay preguntas disponibles. Intenta recargar la página.');
    return;
  }

  quizStarted = true;
  currentQuestion = 0;
  score = 0;
  timer = 0;
  clearInterval(timerInterval);
  startTimer();
  showQuestion();
}

// ... (resto de las funciones permanecen iguales)

/**
 * Maneja el evento de siguiente pregunta
 */
function handleNextQuestion() {
  if (!selectedChoice) return;

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

// ... (resto del código permanece igual)
