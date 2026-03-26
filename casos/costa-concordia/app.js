document.addEventListener("DOMContentLoaded", async () => {
  const state = {
    scenario: null,
    activeIndex: 0,
    selectedOptionByCheckpoint: {}
  };

  const timelineList = document.getElementById("timelineList");
  const stateGrid = document.getElementById("stateGrid");
  const decisionCard = document.getElementById("decisionCard");
  const twinAlerts = document.getElementById("twinAlerts");
  const lawOverlay = document.getElementById("lawOverlay");
  const panelDebrief = document.getElementById("panelDebrief");
  const debriefContent = document.getElementById("debriefContent");
  const mermaidDivergence = document.getElementById("mermaidDivergence");

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const statusLabel = {
    ok: "Estable",
    warning: "Vigilancia",
    critical: "Crítico"
  };

  const scoreLabel = {
    best: "Recomendada",
    acceptable: "Parcial",
    poor: "Deficiente"
  };

  const renderTimeline = () => {
    timelineList.innerHTML = state.scenario.checkpoints
      .map((checkpoint, index) => {
        const isActive = index === state.activeIndex;
        const choice = state.selectedOptionByCheckpoint[checkpoint.id];
        return `
          <button
            class="timeline-item${isActive ? " is-active" : ""}"
            type="button"
            data-index="${index}"
            aria-pressed="${isActive ? "true" : "false"}"
          >
            <span class="timeline-time">${escapeHtml(checkpoint.time)}</span>
            <span class="timeline-phase">${escapeHtml(checkpoint.phase)}</span>
            <strong>${escapeHtml(checkpoint.title)}</strong>
            <span class="timeline-summary">${escapeHtml(checkpoint.summary)}</span>
            ${choice ? `<span class="timeline-choice">${escapeHtml(choice.label)}</span>` : ""}
          </button>
        `;
      })
      .join("");
  };

  const renderState = (checkpoint) => {
    stateGrid.innerHTML = checkpoint.systemState
      .map(
        (item) => `
          <article class="state-card state-${escapeHtml(item.status)}">
            <span class="state-label">${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
            <span class="state-status">${escapeHtml(statusLabel[item.status] || item.status)}</span>
          </article>
        `
      )
      .join("");
  };

  const renderTwin = (checkpoint) => {
    twinAlerts.innerHTML = checkpoint.twinAlerts
      .map(
        (item) => `
          <article class="alert-card alert-${escapeHtml(item.level)}">
            <span class="alert-level">${escapeHtml(item.level)}</span>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.detail)}</p>
          </article>
        `
      )
      .join("");

    lawOverlay.innerHTML = `
      <div class="panel-subheader">Overlay normativo</div>
      <div class="law-grid">
        ${checkpoint.lawOverlay
          .map(
            (item) => `
              <article class="law-card">
                <span class="law-code">${escapeHtml(item.code)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.detail)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    `;
  };

  const renderDebrief = (checkpoint, selectedOption) => {
    panelDebrief.hidden = false;

    debriefContent.innerHTML = `
      <div class="debrief-grid">
        <article class="debrief-card">
          <span class="panel-subheader">Lectura del checkpoint</span>
          <h3>${escapeHtml(checkpoint.debrief.title)}</h3>
          <p>${escapeHtml(checkpoint.debrief.summary)}</p>
        </article>
        <article class="debrief-card">
          <span class="panel-subheader">Decisión elegida</span>
          <h3>${escapeHtml(selectedOption.label)}</h3>
          <p>${escapeHtml(selectedOption.outcome)}</p>
          <span class="decision-badge score-${escapeHtml(selectedOption.score)}">${escapeHtml(scoreLabel[selectedOption.score])}</span>
        </article>
      </div>
      <article class="debrief-card lessons-card">
        <span class="panel-subheader">Lecciones clave</span>
        <ul class="lesson-list">
          ${checkpoint.debrief.lessons
            .map((lesson) => `<li>${escapeHtml(lesson)}</li>`)
            .join("")}
        </ul>
      </article>
    `;

    if (window.mermaid && checkpoint.debrief.diagram) {
      mermaidDivergence.removeAttribute("data-processed");
      mermaidDivergence.textContent = checkpoint.debrief.diagram;
      window.mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#081a2d",
          primaryBorderColor: "#00d4ff",
          primaryTextColor: "#e8f4f8",
          lineColor: "#00d4ff",
          secondaryColor: "#061525",
          tertiaryColor: "#0a1e30",
          fontFamily: "Inter, sans-serif"
        },
        flowchart: {
          curve: "basis",
          useMaxWidth: true
        }
      });
      window.mermaid.run({ nodes: [mermaidDivergence] }).catch(() => {
        mermaidDivergence.textContent = "";
      });
    }
  };

  const renderDecision = (checkpoint) => {
    const selectedOption = state.selectedOptionByCheckpoint[checkpoint.id];

    decisionCard.innerHTML = `
      <div class="decision-header">
        <span class="decision-time">${escapeHtml(checkpoint.time)}</span>
        <span class="decision-phase">${escapeHtml(checkpoint.phase)}</span>
      </div>
      <h3>${escapeHtml(checkpoint.title)}</h3>
      <p class="decision-copy">${escapeHtml(checkpoint.decision.prompt)}</p>
      <div class="decision-options">
        ${checkpoint.decision.options
          .map((option) => {
            const isSelected = selectedOption?.id === option.id;
            const isRecommended = checkpoint.decision.recommended === option.id;
            return `
              <button
                class="decision-option${isSelected ? " is-selected" : ""}"
                type="button"
                data-option-id="${escapeHtml(option.id)}"
              >
                <span class="decision-option-title">${escapeHtml(option.label)}</span>
                <span class="decision-option-outcome">${escapeHtml(option.outcome)}</span>
                <span class="decision-option-footer">
                  <span class="decision-badge score-${escapeHtml(option.score)}">${escapeHtml(scoreLabel[option.score])}</span>
                  ${isRecommended ? '<span class="decision-badge badge-outline">Ruta recomendada</span>' : ""}
                </span>
              </button>
            `;
          })
          .join("")}
      </div>
      ${
        selectedOption
          ? `<div class="decision-result">
              <span class="panel-subheader">Resultado</span>
              <p>${escapeHtml(selectedOption.outcome)}</p>
            </div>`
          : ""
      }
    `;

    if (selectedOption) {
      renderDebrief(checkpoint, selectedOption);
    } else {
      panelDebrief.hidden = true;
      debriefContent.innerHTML = "";
      mermaidDivergence.textContent = "";
    }
  };

  const renderCheckpoint = () => {
    const checkpoint = state.scenario.checkpoints[state.activeIndex];
    renderTimeline();
    renderState(checkpoint);
    renderTwin(checkpoint);
    renderDecision(checkpoint);
  };

  const selectCheckpoint = (index) => {
    state.activeIndex = index;
    renderCheckpoint();
  };

  const selectOption = (optionId) => {
    const checkpoint = state.scenario.checkpoints[state.activeIndex];
    const option = checkpoint.decision.options.find((item) => item.id === optionId);
    if (!option) {
      return;
    }
    state.selectedOptionByCheckpoint[checkpoint.id] = option;
    renderCheckpoint();
  };

  timelineList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-index]");
    if (!button) {
      return;
    }
    selectCheckpoint(Number(button.dataset.index));
  });

  decisionCard.addEventListener("click", (event) => {
    const button = event.target.closest("[data-option-id]");
    if (!button) {
      return;
    }
    selectOption(button.dataset.optionId);
  });

  try {
    const response = await fetch("./scenario.json");
    if (!response.ok) {
      throw new Error(`Scenario HTTP ${response.status}`);
    }
    state.scenario = await response.json();
    renderCheckpoint();
  } catch (error) {
    timelineList.innerHTML = `<p class="meta-copy">Error al cargar timeline</p>`;
    stateGrid.innerHTML = `<p class="meta-copy">No se pudo cargar el estado del caso</p>`;
    decisionCard.innerHTML = `
      <div class="decision-result error-box">
        <span class="panel-subheader">Carga fallida</span>
        <p>No se pudo cargar <code>scenario.json</code>. Revisa la publicación del caso.</p>
      </div>
    `;
    twinAlerts.innerHTML = `<p class="meta-copy">Gemelo no disponible</p>`;
    lawOverlay.innerHTML = `<p class="meta-copy">Sin overlay normativo</p>`;
    console.error(error);
  }
});
