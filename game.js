// Prototype de démonstration — poste Chef de groupe.
// Base volontairement simple : amélioration du feedback et de la gestion de session.

const SCENARIOS = [
  { id: "intrusion", title: "INTRUSION" },
  { id: "incendie", title: "INCENDIE" },
  { id: "secourisme", title: "SECOURISME" },
  { id: "inondation", title: "INONDATION" },
];

const STATUS_LABEL = {
  "a-traiter": "À TRAITER",
  erreur: "ERREUR",
  valide: "VALIDIDÉ",
};

const GAME_STATE = {
  PREPARATION: "preparation",
  READY: "ready",
  REARTICULATION: "rearticulation",
};

const state = {};
const eventHistory = [];

const sessionStats = {
  totalReads: 0,
  errors: 0,
  validated: 0,
  startedAt: Date.now(),
};

let gameState = GAME_STATE.PREPARATION;

let lastRfidRead = {
  scenarioId: null,
  timestamp: 0,
};

const RFID_COOLDOWN = 800;

const board = document.getElementById("board");
const teamState = document.getElementById("teamState");
const rearticulateBtn = document.getElementById("rearticulateBtn");
const rearticulationState = document.getElementById("rearticulationState");

const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

const feedback = document.getElementById("feedback");
const feedbackTitle = document.getElementById("feedbackTitle");
const feedbackMessage = document.getElementById("feedbackMessage");

const resetBtn = document.getElementById("resetBtn");

function initializeScenarioState() {
  SCENARIOS.forEach((scenario) => {
    state[scenario.id] = "a-traiter";
  });
}

function render() {
  board.innerHTML = "";

  SCENARIOS.forEach((scenario) => {
    const cardState = state[scenario.id];

    const card = document.createElement("article");
    card.className = "card";

    const title = document.createElement("p");
    title.className = "card__title";
    title.textContent = scenario.title;

    const status = document.createElement("span");
    status.className = "card__status";
    status.dataset.state = cardState;
    status.textContent = STATUS_LABEL[cardState];

    const button = document.createElement("button");
    button.className = "card__btn";
    button.textContent = "Lecture RFID";

    button.disabled =
      cardState === "valide" ||
      gameState !== GAME_STATE.PREPARATION;

    button.addEventListener("click", () => {
      simulateRfidRead(scenario.id);
    });

    card.append(title, status, button);
    board.append(card);
  });

  const validatedCount = getValidatedCount();

  progressText.textContent =
    `${validatedCount} / ${SCENARIOS.length} VALIDÉES`;

  progressFill.style.width =
    `${(validatedCount / SCENARIOS.length) * 100}%`;

  // Le bouton reste disponible pendant la préparation
  // afin de pouvoir donner un feedback si le joueur tente trop tôt.
  teamState.hidden = gameState === GAME_STATE.REARTICULATION;

  rearticulationState.hidden =
    gameState !== GAME_STATE.REARTICULATION;

  updateGlobalPreparationFeedback();
}

function getValidatedCount() {
  return SCENARIOS.filter(
    (scenario) => state[scenario.id] === "valide"
  ).length;
}

function getErrorCount() {
  return SCENARIOS.filter(
    (scenario) => state[scenario.id] === "erreur"
  ).length;
}

function getPendingCount() {
  return SCENARIOS.filter(
    (scenario) => state[scenario.id] === "a-traiter"
  ).length;
}

function simulateRfidRead(scenarioId) {
  const success = Math.random() > 0.5;

  handleRfidEvent(scenarioId, success);
}

function handleRfidEvent(scenarioId, isValid) {
  const now = Date.now();

  if (gameState !== GAME_STATE.PREPARATION) {
    return;
  }

  if (
    lastRfidRead.scenarioId === scenarioId &&
    now - lastRfidRead.timestamp < RFID_COOLDOWN
  ) {
    return;
  }

  lastRfidRead = {
    scenarioId,
    timestamp: now,
  };

  if (!(scenarioId in state)) {
    console.warn(`Scénario RFID inconnu : ${scenarioId}`);
    return;
  }

  if (state[scenarioId] === "valide") {
    return;
  }

  sessionStats.totalReads++;

  if (isValid) {
    state[scenarioId] = "valide";
    sessionStats.validated++;
  } else {
    state[scenarioId] = "erreur";
    sessionStats.errors++;
  }

  eventHistory.push({
    type: "rfid-read",
    scenarioId,
    success: isValid,
    timestamp: now,
  });

  showRfidFeedback(scenarioId, isValid);

  updateGameState();
  render();
}

function showRfidFeedback(scenarioId, success) {
  const scenario = SCENARIOS.find(
    (scenario) => scenario.id === scenarioId
  );

  if (!scenario) {
    return;
  }

  feedback.hidden = false;

  if (success) {
    feedbackTitle.textContent =
      `${scenario.title} VALIDÉE`;

    feedbackMessage.textContent =
      "La conduite à tenir a bien été prise en compte.";
  } else {
    feedbackTitle.textContent =
      `LECTURE INCORRECTE — ${scenario.title}`;

    feedbackMessage.textContent =
      "Cette conduite doit être corrigée avant la réarticulation du groupe.";
  }
}

function updateGlobalPreparationFeedback() {
  if (gameState !== GAME_STATE.PREPARATION) {
    return;
  }

  const errorCount = getErrorCount();
  const pendingCount = getPendingCount();

  // On laisse le feedback de lecture affiché juste après une interaction.
  // Cette fonction sert surtout à garder un état global cohérent.
  if (errorCount > 0) {
    rearticulateBtn.textContent =
      `RÉARTICULATION DU GROUPE — ${errorCount} ERREUR${errorCount > 1 ? "S" : ""}`;
  } else if (pendingCount > 0) {
    rearticulateBtn.textContent =
      `RÉARTICULATION DU GROUPE — ${pendingCount} RESTANTE${pendingCount > 1 ? "S" : ""}`;
  } else {
    rearticulateBtn.textContent =
      "RÉARTICULATION DU GROUPE";
  }
}

function updateGameState() {
  const allValidated = SCENARIOS.every(
    (scenario) => state[scenario.id] === "valide"
  );

  if (
    allValidated &&
    gameState === GAME_STATE.PREPARATION
  ) {
    gameState = GAME_STATE.READY;

    eventHistory.push({
      type: "game-state-change",
      state: GAME_STATE.READY,
      timestamp: Date.now(),
    });

    showReadyFeedback();
    logSessionSummary();
  }
}

function showReadyFeedback() {
  feedback.hidden = false;

  feedbackTitle.textContent =
    "PRÉPARATION TERMINÉE";

  feedbackMessage.textContent =
    "Les quatre conduites à tenir sont validées. Le Chef de groupe peut maintenant réarticuler son équipe.";

  rearticulateBtn.textContent =
    "RÉARTICULATION DU GROUPE";
}

function showIncompletePreparationFeedback() {
  const errorCount = getErrorCount();
  const pendingCount = getPendingCount();
  const validatedCount = getValidatedCount();

  feedback.hidden = false;

  feedbackTitle.textContent =
    "PRÉPARATION INCOMPLÈTE";

  if (errorCount > 0 && pendingCount > 0) {
    feedbackMessage.textContent =
      `${validatedCount} / ${SCENARIOS.length} conduites validées. ` +
      `${errorCount} en erreur et ${pendingCount} encore à traiter.`;
  } else if (errorCount > 0) {
    feedbackMessage.textContent =
      `${errorCount} conduite${errorCount > 1 ? "s" : ""} ` +
      `${errorCount > 1 ? "nécessitent" : "nécessite"} une nouvelle lecture RFID avant la réarticulation.`;
  } else {
    feedbackMessage.textContent =
      `${pendingCount} conduite${pendingCount > 1 ? "s restent" : " reste"} à traiter avant la réarticulation.`;
  }

  eventHistory.push({
    type: "rearticulation-refused",
    validated: validatedCount,
    errors: errorCount,
    pending: pendingCount,
    timestamp: Date.now(),
  });
}

function logSessionSummary() {
  const durationSeconds = Math.round(
    (Date.now() - sessionStats.startedAt) / 1000
  );

  console.log("Résumé de session :", {
    durationSeconds,
    totalReads: sessionStats.totalReads,
    errors: sessionStats.errors,
    validated: sessionStats.validated,
  });

  console.log("Historique des événements :", eventHistory);
}

function resetSession() {
  initializeScenarioState();

  gameState = GAME_STATE.PREPARATION;

  eventHistory.length = 0;

  sessionStats.totalReads = 0;
  sessionStats.errors = 0;
  sessionStats.validated = 0;
  sessionStats.startedAt = Date.now();

  lastRfidRead = {
    scenarioId: null,
    timestamp: 0,
  };

  feedback.hidden = true;

  feedbackTitle.textContent = "";
  feedbackMessage.textContent = "";

  render();

  console.log("Session réinitialisée.");
}

rearticulateBtn.addEventListener("click", () => {
  if (gameState === GAME_STATE.PREPARATION) {
    showIncompletePreparationFeedback();
    return;
  }

  if (gameState !== GAME_STATE.READY) {
    return;
  }

  gameState = GAME_STATE.REARTICULATION;

  eventHistory.push({
    type: "game-state-change",
    state: GAME_STATE.REARTICULATION,
    timestamp: Date.now(),
  });

  feedback.hidden = false;

  feedbackTitle.textContent =
    "RÉARTICULATION";

  feedbackMessage.textContent =
    "Rejoignez votre groupe et transmettez les conduites à tenir.";

  render();
});

resetBtn.addEventListener("click", () => {
  resetSession();
});

initializeScenarioState();
render();