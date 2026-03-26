document.addEventListener("DOMContentLoaded", async () => {
  const state = {
    scenario: null,
    activeIndex: 0,
    selectedOptionByCheckpoint: {}
  };

  const timelineList = document.getElementById("timelineList");
  const stateGrid = document.getElementById("stateGrid");
  const decisionCard = document.getElementById("decisionCard");
  const twinHeader = document.getElementById("twinHeader");
  const twinOverview = document.getElementById("twinOverview");
  const twinModel = document.getElementById("twinModel");
  const twinDelta = document.getElementById("twinDelta");
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

  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

  const phaseProfiles = {
    Ruta: [
      { label: "Derrota", value: 46, detail: "Desalineada con el plan aprobado." },
      { label: "Mando en puente", value: 58, detail: "BRM insuficiente para frenar el desvío." },
      { label: "Ventana de corrección", value: 84, detail: "Todavía existe margen alto para abortar." },
      { label: "Exposición legal", value: 34, detail: "Ya hay incumplimiento, aunque aún reversible." }
    ],
    Impacto: [
      { label: "Integridad del casco", value: 18, detail: "Daño estructural mayor tras Le Scole." },
      { label: "Propulsión y potencia", value: 12, detail: "Blackout y pérdida de control de planta." },
      { label: "Capacidad de control", value: 24, detail: "La operación entra en modo contingencia." },
      { label: "Ventana de respuesta", value: 38, detail: "Solo quedan minutos de reacción útil." }
    ],
    Comunicación: [
      { label: "Narrativa operativa", value: 22, detail: "La versión oficial no refleja la situación real." },
      { label: "Coordinación SAR", value: 42, detail: "Existen medios, pero todavía sin contexto completo." },
      { label: "Control de pasajeros", value: 34, detail: "A bordo crece la desorganización." },
      { label: "Tiempo disponible", value: 28, detail: "La demora ya compromete la evacuación." }
    ],
    Evacuación: [
      { label: "Estabilidad remanente", value: 14, detail: "La escora degrada toda maniobra de abandono." },
      { label: "Medios de salvamento", value: 36, detail: "Solo parte de los botes sigue operativa." },
      { label: "Control de multitudes", value: 26, detail: "El flujo de pasajeros ya es caótico." },
      { label: "Probabilidad de recuperación", value: 10, detail: "El sistema está en fase de pérdida severa." }
    ]
  };

  const toneForValue = (value) => {
    if (value < 35) return "critical";
    if (value < 65) return "warning";
    return "stable";
  };

  const toneClass = (tone) => {
    if (tone === "critical") return "tone-critical";
    if (tone === "warning") return "tone-warning";
    return "";
  };

  const chipClass = (tone) => {
    if (tone === "critical") return "is-critical";
    if (tone === "warning") return "is-warning";
    return "";
  };

  const getSelectedOption = (checkpoint) => state.selectedOptionByCheckpoint[checkpoint.id] || null;

  const scorePenalty = {
    best: 0,
    acceptable: 7,
    poor: 18
  };

  const computeTelemetry = (checkpoint, selectedOption) => {
    const counts = checkpoint.systemState.reduce(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      },
      { ok: 0, warning: 0, critical: 0 }
    );

    const phaseWeight = state.activeIndex * 8;
    const decisionShift =
      !selectedOption ? 0 : selectedOption.score === "best" ? -10 : selectedOption.score === "acceptable" ? -3 : 10;

    const risk = clamp(28 + counts.critical * 18 + counts.warning * 9 + phaseWeight + decisionShift);
    const integrity = clamp(100 - counts.critical * 22 - counts.warning * 9 - phaseWeight + (selectedOption?.score === "best" ? 6 : 0));
    const command = clamp(82 - counts.critical * 12 - phaseWeight + (!selectedOption ? 0 : selectedOption.score === "poor" ? -10 : 8));
    const response = clamp(92 - state.activeIndex * 18 - counts.critical * 8 + (!selectedOption ? 0 : selectedOption.score === "best" ? 8 : -4));

    return [
      {
        label: "Riesgo sistémico",
        value: risk,
        unit: "/100",
        note: risk > 70 ? "Escalada severa" : risk > 45 ? "Escalada contenida" : "Nivel controlable",
        tone: toneForValue(100 - risk)
      },
      {
        label: "Integridad",
        value: integrity,
        unit: "%",
        note: integrity < 35 ? "Subsistemas comprometidos" : integrity < 65 ? "Capacidad degradada" : "Margen operativo",
        tone: toneForValue(integrity)
      },
      {
        label: "Mando operativo",
        value: command,
        unit: "%",
        note: command < 35 ? "Criterio roto" : command < 65 ? "Mando tensionado" : "Mando funcional",
        tone: toneForValue(command)
      },
      {
        label: "Ventana de respuesta",
        value: response,
        unit: "%",
        note: response < 35 ? "Ventana crítica" : response < 65 ? "Margen bajo" : "Tiempo útil",
        tone: toneForValue(response)
      }
    ];
  };

  const computeModel = (checkpoint, selectedOption) => {
    const baseProfile = phaseProfiles[checkpoint.phase] || [];
    const delta =
      !selectedOption ? 0 : selectedOption.score === "best" ? 8 : selectedOption.score === "acceptable" ? 2 : -10;

    return baseProfile.map((item) => ({
      ...item,
      value: clamp(item.value + delta),
      tone: toneForValue(item.value + delta)
    }));
  };

  const computeCommandState = (telemetry) => {
    const risk = telemetry.find((item) => item.label === "Riesgo sistémico")?.value ?? 50;
    if (risk > 72) {
      return { label: "Riesgo crítico", tone: "critical" };
    }
    if (risk > 48) {
      return { label: "Riesgo en vigilancia", tone: "warning" };
    }
    return { label: "Estado controlable", tone: "stable" };
  };

  const computeSync = (selectedOption) => clamp(96 - state.activeIndex * 4 + (selectedOption ? 2 : 0), 79, 99);

  const divergenceClass = (value, badWhenPositive = true) => {
    if (value === 0) return "delta-safe";
    const isBad = badWhenPositive ? value > 0 : value < 0;
    return isBad ? "delta-danger" : "delta-note";
  };

  const formatDelta = (value, suffix = "pts") => `${value > 0 ? "+" : ""}${value}${suffix ? ` ${suffix}` : ""}`;

  const renderTwinHeader = (checkpoint, telemetry, selectedOption) => {
    const commandState = computeCommandState(telemetry);
    const sync = computeSync(selectedOption);
    const checkpointLabel = `${String(state.activeIndex + 1).padStart(2, "0")} / ${String(
      state.scenario.checkpoints.length
    ).padStart(2, "0")}`;

    twinHeader.innerHTML = `
      <div class="twin-command-bar">
        <article class="command-card">
          <span class="model-label">Motor del gemelo</span>
          <strong>ABYSS TWIN ${escapeHtml(state.scenario.version || "v1.1")}</strong>
          <p>Modelo formativo sincronizado con el checkpoint activo y sus restricciones operativas.</p>
        </article>
        <article class="command-card">
          <span class="command-chip ${chipClass(commandState.tone)}">${escapeHtml(commandState.label)}</span>
          <strong>${escapeHtml(checkpoint.phase)} · ${escapeHtml(checkpoint.time)}</strong>
          <p>Checkpoint ${escapeHtml(checkpointLabel)}. El gemelo recalcula riesgo, integridad y ventana de respuesta.</p>
        </article>
        <article class="command-card">
          <span class="model-label">Sincronización</span>
          <strong>${escapeHtml(sync)}%</strong>
          <p>${selectedOption ? "Decisión cargada y comparada con la ruta recomendada." : "Esperando una decisión para calcular divergencia."}</p>
        </article>
        <article class="command-card">
          <span class="model-label">Modo</span>
          <strong>${selectedOption ? "Comparación activa" : "Lectura base"}</strong>
          <p>${selectedOption ? "El gemelo ya estima impacto relativo frente al camino recomendado." : "Visualización del escenario sin intervención seleccionada."}</p>
        </article>
      </div>
    `;
  };

  const renderTwinDelta = (selectedOption, recommendedOption) => {
    if (!selectedOption) {
      twinDelta.innerHTML = `
        <div class="panel-subheader">Divergencia estimada</div>
        <div class="twin-delta-grid">
          <article class="delta-card is-placeholder">
            <span class="model-label">Comparación pendiente</span>
            <strong class="delta-safe">Sin decisión</strong>
            <p>Selecciona una ruta para que el gemelo calcule la divergencia frente a la decisión recomendada.</p>
          </article>
        </div>
      `;
      return;
    }

    const selectedPenalty = scorePenalty[selectedOption.score] ?? 0;
    const recommendedPenalty = scorePenalty[recommendedOption?.score] ?? 0;
    const deltaRisk = selectedPenalty - recommendedPenalty;
    const deltaCommand = -Math.round(deltaRisk * 0.7);
    const deltaResponse = -Math.round(deltaRisk * 0.9);

    twinDelta.innerHTML = `
      <div class="panel-subheader">Divergencia estimada</div>
      <div class="twin-delta-grid">
        <article class="delta-card">
            <span class="model-label">Riesgo frente a la ruta recomendada</span>
          <strong class="${divergenceClass(deltaRisk, true)}">${escapeHtml(formatDelta(deltaRisk))}</strong>
          <p>${deltaRisk > 0 ? "La decisión tomada aumenta la exposición del sistema." : "La ruta mantiene el riesgo alineado con la mejor respuesta disponible."}</p>
        </article>
        <article class="delta-card">
          <span class="model-label">Mando operativo</span>
          <strong class="${divergenceClass(deltaCommand, false)}">${escapeHtml(formatDelta(deltaCommand))}</strong>
          <p>${deltaCommand < 0 ? "El control del puente se tensiona frente a la referencia ideal." : "La decisión sostiene el criterio operativo del puente."}</p>
        </article>
        <article class="delta-card">
          <span class="model-label">Ventana útil de respuesta</span>
          <strong class="${divergenceClass(deltaResponse, false)}">${escapeHtml(formatDelta(deltaResponse))}</strong>
          <p>${deltaResponse < 0 ? "Se consume tiempo recuperable para contener la emergencia." : "La maniobra conserva margen para estabilizar la situación."}</p>
        </article>
      </div>
    `;
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
    const selectedOption = getSelectedOption(checkpoint);
    const telemetry = computeTelemetry(checkpoint, selectedOption);
    const model = computeModel(checkpoint, selectedOption);
    const recommendedOption = checkpoint.decision.options.find(
      (option) => option.id === checkpoint.decision.recommended
    );

    renderTwinHeader(checkpoint, telemetry, selectedOption);

    twinOverview.innerHTML = `
      <div class="panel-subheader">Telemetría sintética</div>
      <div class="twin-overview">
        ${telemetry
          .map(
            (metric) => `
              <article class="metric-card">
                <span class="metric-label">${escapeHtml(metric.label)}</span>
                <strong class="metric-value">${escapeHtml(metric.value)} <span class="metric-unit">${escapeHtml(metric.unit)}</span></strong>
                <div class="metric-bar">
                  <div class="bar-track">
                    <div class="bar-fill ${toneClass(metric.tone)}" style="width:${escapeHtml(metric.value)}%"></div>
                  </div>
                </div>
                <span class="metric-note">${escapeHtml(metric.note)}</span>
              </article>
            `
          )
          .join("")}
      </div>
    `;

    twinModel.innerHTML = `
      <div class="panel-subheader">Espejo operativo</div>
      <div class="twin-compare-grid">
        <article class="compare-card is-recommended">
          <span class="model-label">Ruta recomendada</span>
          <h3>${escapeHtml(recommendedOption?.label || "Sin referencia")}</h3>
          <p>${escapeHtml(recommendedOption?.outcome || "No definida")}</p>
        </article>
        <article class="compare-card is-selected">
          <span class="model-label">Ruta actual</span>
          <h3>${escapeHtml(selectedOption?.label || "Sin decisión registrada")}</h3>
          <p>${escapeHtml(selectedOption?.outcome || "Elige una decisión para ver su impacto en el gemelo.")}</p>
        </article>
      </div>
      <div class="twin-model-grid">
        ${model
          .map(
            (item) => `
              <article class="model-card">
                <span class="model-label">${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}%</strong>
                <div class="model-bar">
                  <div class="bar-track">
                    <div class="bar-fill ${toneClass(item.tone)}" style="width:${escapeHtml(item.value)}%"></div>
                  </div>
                </div>
                <p>${escapeHtml(item.detail)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    `;

    renderTwinDelta(selectedOption, recommendedOption);

    twinAlerts.innerHTML = `
      <div class="panel-subheader">Eventos detectados</div>
      <div class="law-grid">
        ${checkpoint.twinAlerts
          .map(
            (item) => `
              <article class="alert-card alert-${escapeHtml(item.level)}">
                <span class="alert-level">${escapeHtml(item.level)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.detail)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    `;

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
    const hasPrev = state.activeIndex > 0;
    const hasNext = state.activeIndex < state.scenario.checkpoints.length - 1;

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
      <div class="decision-nav">
        <button class="nav-mini" type="button" data-nav="prev" ${hasPrev ? "" : "disabled"}>Checkpoint anterior</button>
        <button class="nav-mini" type="button" data-nav="next" ${hasNext ? "" : "disabled"}>Siguiente checkpoint</button>
      </div>
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
    const navButton = event.target.closest("[data-nav]");
    if (navButton) {
      const direction = navButton.dataset.nav;
      if (direction === "prev" && state.activeIndex > 0) {
        selectCheckpoint(state.activeIndex - 1);
      }
      if (direction === "next" && state.activeIndex < state.scenario.checkpoints.length - 1) {
        selectCheckpoint(state.activeIndex + 1);
      }
      return;
    }

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
    twinOverview.innerHTML = `<p class="meta-copy">Telemetría no disponible</p>`;
    twinModel.innerHTML = `<p class="meta-copy">Modelo no disponible</p>`;
    twinHeader.innerHTML = `<p class="meta-copy">Cabecera del gemelo no disponible</p>`;
    twinDelta.innerHTML = `<p class="meta-copy">Comparación no disponible</p>`;
    twinAlerts.innerHTML = `<p class="meta-copy">Gemelo no disponible</p>`;
    lawOverlay.innerHTML = `<p class="meta-copy">Sin overlay normativo</p>`;
    console.error(error);
  }
});
