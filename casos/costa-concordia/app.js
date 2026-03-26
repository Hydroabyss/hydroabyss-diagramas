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
  const locale = (document.documentElement.lang || "es").slice(0, 2);

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const uiText = {
    es: {
      statusLabel: { ok: "Estable", warning: "Vigilancia", critical: "Crítico" },
      scoreLabel: { best: "Recomendada", acceptable: "Parcial", poor: "Deficiente" },
      metrics: {
        risk: {
          label: "Riesgo sistémico",
          unit: "/100",
          note: (value) => (value > 70 ? "Escalada severa" : value > 45 ? "Escalada contenida" : "Nivel controlable")
        },
        integrity: {
          label: "Integridad",
          unit: "%",
          note: (value) => (value < 35 ? "Subsistemas comprometidos" : value < 65 ? "Capacidad degradada" : "Margen operativo")
        },
        command: {
          label: "Mando operativo",
          unit: "%",
          note: (value) => (value < 35 ? "Criterio roto" : value < 65 ? "Mando tensionado" : "Mando funcional")
        },
        response: {
          label: "Ventana de respuesta",
          unit: "%",
          note: (value) => (value < 35 ? "Ventana crítica" : value < 65 ? "Margen bajo" : "Tiempo útil")
        }
      },
      commandState: { critical: "Riesgo crítico", warning: "Riesgo en vigilancia", stable: "Estado controlable" },
      labels: {
        twinEngine: "Motor del gemelo",
        twinEngineBody: "Modelo formativo sincronizado con el checkpoint activo y sus restricciones operativas.",
        syncLabel: "Sincronización",
        syncActive: "Decisión cargada y comparada con la ruta recomendada.",
        syncIdle: "Esperando una decisión para calcular divergencia.",
        modeLabel: "Modo",
        modeActiveTitle: "Comparación activa",
        modeIdleTitle: "Lectura base",
        modeActiveBody: "El gemelo ya estima impacto relativo frente al camino recomendado.",
        modeIdleBody: "Visualización del escenario sin intervención seleccionada.",
        checkpoint: "Checkpoint",
        checkpointBody: "El gemelo recalcula riesgo, integridad y ventana de respuesta.",
        syntheticTelemetry: "Telemetría sintética",
        operationalMirror: "Espejo operativo",
        recommendedRoute: "Ruta recomendada",
        currentRoute: "Ruta actual",
        noReference: "Sin referencia",
        notDefined: "No definida",
        noDecisionRegistered: "Sin decisión registrada",
        chooseDecisionImpact: "Elige una decisión para ver su impacto en el gemelo.",
        detectedEvents: "Eventos detectados",
        lawOverlay: "Overlay normativo",
        checkpointRead: "Lectura del checkpoint",
        selectedDecision: "Decisión elegida",
        keyLessons: "Lecciones clave",
        result: "Resultado",
        recommendedBadge: "Ruta recomendada",
        prev: "Checkpoint anterior",
        next: "Siguiente checkpoint",
        divergence: "Divergencia estimada",
        pendingComparison: "Comparación pendiente",
        noDecisionStrong: "Sin decisión",
        pendingComparisonBody: "Selecciona una ruta para que el gemelo calcule la divergencia frente a la decisión recomendada.",
        riskVsReference: "Riesgo frente a la ruta recomendada",
        operationalCommand: "Mando operativo",
        effectiveResponseWindow: "Ventana útil de respuesta",
        riskIncrease: "La decisión tomada aumenta la exposición del sistema.",
        riskAligned: "La ruta mantiene el riesgo alineado con la mejor respuesta disponible.",
        commandTension: "El control del puente se tensiona frente a la referencia ideal.",
        commandSustain: "La decisión sostiene el criterio operativo del puente.",
        responseLoss: "Se consume tiempo recuperable para contener la emergencia.",
        responsePreserve: "La maniobra conserva margen para estabilizar la situación.",
        timelineError: "Error al cargar timeline",
        stateError: "No se pudo cargar el estado del caso",
        loadFailed: "Carga fallida",
        loadFailedBody: "No se pudo cargar <code>scenario.json</code>. Revisa la publicación del caso.",
        telemetryUnavailable: "Telemetría no disponible",
        modelUnavailable: "Modelo no disponible",
        headerUnavailable: "Cabecera del gemelo no disponible",
        comparisonUnavailable: "Comparación no disponible",
        twinUnavailable: "Gemelo no disponible",
        lawUnavailable: "Sin overlay normativo"
      },
      profiles: {
        cp1: [
          { label: "Derrota", value: 46, detail: "Desalineada con el plan aprobado." },
          { label: "Mando en puente", value: 58, detail: "BRM insuficiente para frenar el desvío." },
          { label: "Ventana de corrección", value: 84, detail: "Todavía existe margen alto para abortar." },
          { label: "Exposición legal", value: 34, detail: "Ya hay incumplimiento, aunque aún reversible." }
        ],
        cp2: [
          { label: "Integridad del casco", value: 18, detail: "Daño estructural mayor tras Le Scole." },
          { label: "Propulsión y potencia", value: 12, detail: "Blackout y pérdida de control de planta." },
          { label: "Capacidad de control", value: 24, detail: "La operación entra en modo contingencia." },
          { label: "Ventana de respuesta", value: 38, detail: "Solo quedan minutos de reacción útil." }
        ],
        cp3: [
          { label: "Narrativa operativa", value: 22, detail: "La versión oficial no refleja la situación real." },
          { label: "Coordinación SAR", value: 42, detail: "Existen medios, pero todavía sin contexto completo." },
          { label: "Control de pasajeros", value: 34, detail: "A bordo crece la desorganización." },
          { label: "Tiempo disponible", value: 28, detail: "La demora ya compromete la evacuación." }
        ],
        cp4: [
          { label: "Estabilidad remanente", value: 14, detail: "La escora degrada toda maniobra de abandono." },
          { label: "Medios de salvamento", value: 36, detail: "Solo parte de los botes sigue operativa." },
          { label: "Control de multitudes", value: 26, detail: "El flujo de pasajeros ya es caótico." },
          { label: "Probabilidad de recuperación", value: 10, detail: "El sistema está en fase de pérdida severa." }
        ]
      }
    },
    en: {
      statusLabel: { ok: "Stable", warning: "Watch", critical: "Critical" },
      scoreLabel: { best: "Recommended", acceptable: "Partial", poor: "Deficient" },
      metrics: {
        risk: {
          label: "Systemic risk",
          unit: "/100",
          note: (value) => (value > 70 ? "Severe escalation" : value > 45 ? "Contained escalation" : "Controllable level")
        },
        integrity: {
          label: "Integrity",
          unit: "%",
          note: (value) => (value < 35 ? "Subsystems compromised" : value < 65 ? "Degraded capability" : "Operational margin")
        },
        command: {
          label: "Operational command",
          unit: "%",
          note: (value) => (value < 35 ? "Broken judgment" : value < 65 ? "Command under strain" : "Functional command")
        },
        response: {
          label: "Response window",
          unit: "%",
          note: (value) => (value < 35 ? "Critical window" : value < 65 ? "Low margin" : "Useful time")
        }
      },
      commandState: { critical: "Critical risk", warning: "Risk under watch", stable: "Controllable state" },
      labels: {
        twinEngine: "Twin engine",
        twinEngineBody: "Training model synchronized with the active checkpoint and its operational constraints.",
        syncLabel: "Synchronization",
        syncActive: "Decision loaded and compared with the recommended route.",
        syncIdle: "Waiting for a decision to calculate divergence.",
        modeLabel: "Mode",
        modeActiveTitle: "Active comparison",
        modeIdleTitle: "Baseline view",
        modeActiveBody: "The twin is already estimating relative impact against the recommended path.",
        modeIdleBody: "Scenario view with no selected intervention yet.",
        checkpoint: "Checkpoint",
        checkpointBody: "The twin recalculates risk, integrity, and response window.",
        syntheticTelemetry: "Synthetic telemetry",
        operationalMirror: "Operational mirror",
        recommendedRoute: "Recommended route",
        currentRoute: "Current route",
        noReference: "No reference",
        notDefined: "Not defined",
        noDecisionRegistered: "No decision recorded",
        chooseDecisionImpact: "Choose a decision to see its impact on the twin.",
        detectedEvents: "Detected events",
        lawOverlay: "Regulatory overlay",
        checkpointRead: "Checkpoint reading",
        selectedDecision: "Selected decision",
        keyLessons: "Key lessons",
        result: "Result",
        recommendedBadge: "Recommended route",
        prev: "Previous checkpoint",
        next: "Next checkpoint",
        divergence: "Estimated divergence",
        pendingComparison: "Comparison pending",
        noDecisionStrong: "No decision",
        pendingComparisonBody: "Select a route so the twin can calculate divergence against the recommended decision.",
        riskVsReference: "Risk versus recommended route",
        operationalCommand: "Operational command",
        effectiveResponseWindow: "Effective response window",
        riskIncrease: "The selected decision increases system exposure.",
        riskAligned: "The route keeps risk aligned with the best available response.",
        commandTension: "Bridge control becomes more strained than the ideal reference.",
        commandSustain: "The decision sustains the bridge's operational judgment.",
        responseLoss: "Recoverable time is consumed for containing the emergency.",
        responsePreserve: "The maneuver preserves margin to stabilize the situation.",
        timelineError: "Timeline failed to load",
        stateError: "The case system state could not be loaded",
        loadFailed: "Load failed",
        loadFailedBody: "Could not load <code>scenario.json</code>. Check the published case.",
        telemetryUnavailable: "Telemetry unavailable",
        modelUnavailable: "Model unavailable",
        headerUnavailable: "Twin header unavailable",
        comparisonUnavailable: "Comparison unavailable",
        twinUnavailable: "Twin unavailable",
        lawUnavailable: "No regulatory overlay"
      },
      profiles: {
        cp1: [
          { label: "Route", value: 46, detail: "Misaligned with the approved voyage plan." },
          { label: "Bridge command", value: 58, detail: "Insufficient BRM to stop the deviation." },
          { label: "Correction window", value: 84, detail: "There is still significant margin to abort." },
          { label: "Legal exposure", value: 34, detail: "There is already non-compliance, though still reversible." }
        ],
        cp2: [
          { label: "Hull integrity", value: 18, detail: "Major structural damage after Le Scole." },
          { label: "Propulsion and power", value: 12, detail: "Blackout and loss of plant control." },
          { label: "Control capacity", value: 24, detail: "The operation has entered contingency mode." },
          { label: "Response window", value: 38, detail: "Only minutes of useful reaction time remain." }
        ],
        cp3: [
          { label: "Operational narrative", value: 22, detail: "The official version does not reflect reality." },
          { label: "SAR coordination", value: 42, detail: "Assets exist, but still without full context." },
          { label: "Passenger control", value: 34, detail: "Disorder is growing on board." },
          { label: "Available time", value: 28, detail: "Delay is already compromising evacuation." }
        ],
        cp4: [
          { label: "Remaining stability", value: 14, detail: "List degrades every abandon-ship maneuver." },
          { label: "Life-saving appliances", value: 36, detail: "Only part of the boats remain operational." },
          { label: "Crowd control", value: 26, detail: "Passenger flow has already become chaotic." },
          { label: "Recovery probability", value: 10, detail: "The system is in a severe-loss phase." }
        ]
      }
    },
    pt: {
      statusLabel: { ok: "Estável", warning: "Vigilância", critical: "Crítico" },
      scoreLabel: { best: "Recomendada", acceptable: "Parcial", poor: "Deficiente" },
      metrics: {
        risk: {
          label: "Risco sistêmico",
          unit: "/100",
          note: (value) => (value > 70 ? "Escalada severa" : value > 45 ? "Escalada contida" : "Nível controlável")
        },
        integrity: {
          label: "Integridade",
          unit: "%",
          note: (value) => (value < 35 ? "Subsistemas comprometidos" : value < 65 ? "Capacidade degradada" : "Margem operacional")
        },
        command: {
          label: "Comando operacional",
          unit: "%",
          note: (value) => (value < 35 ? "Critério rompido" : value < 65 ? "Comando tensionado" : "Comando funcional")
        },
        response: {
          label: "Janela de resposta",
          unit: "%",
          note: (value) => (value < 35 ? "Janela crítica" : value < 65 ? "Margem baixa" : "Tempo útil")
        }
      },
      commandState: { critical: "Risco crítico", warning: "Risco em vigilância", stable: "Estado controlável" },
      labels: {
        twinEngine: "Motor do gêmeo",
        twinEngineBody: "Modelo formativo sincronizado com o checkpoint ativo e suas restrições operacionais.",
        syncLabel: "Sincronização",
        syncActive: "Decisão carregada e comparada com a rota recomendada.",
        syncIdle: "Aguardando uma decisão para calcular a divergência.",
        modeLabel: "Modo",
        modeActiveTitle: "Comparação ativa",
        modeIdleTitle: "Leitura base",
        modeActiveBody: "O gêmeo já estima o impacto relativo em relação ao caminho recomendado.",
        modeIdleBody: "Visualização do cenário sem intervenção selecionada.",
        checkpoint: "Checkpoint",
        checkpointBody: "O gêmeo recalcula risco, integridade e janela de resposta.",
        syntheticTelemetry: "Telemetria sintética",
        operationalMirror: "Espelho operacional",
        recommendedRoute: "Rota recomendada",
        currentRoute: "Rota atual",
        noReference: "Sem referência",
        notDefined: "Não definida",
        noDecisionRegistered: "Sem decisão registrada",
        chooseDecisionImpact: "Escolha uma decisão para ver seu impacto no gêmeo.",
        detectedEvents: "Eventos detectados",
        lawOverlay: "Overlay normativo",
        checkpointRead: "Leitura do checkpoint",
        selectedDecision: "Decisão selecionada",
        keyLessons: "Lições-chave",
        result: "Resultado",
        recommendedBadge: "Rota recomendada",
        prev: "Checkpoint anterior",
        next: "Próximo checkpoint",
        divergence: "Divergência estimada",
        pendingComparison: "Comparação pendente",
        noDecisionStrong: "Sem decisão",
        pendingComparisonBody: "Selecione uma rota para que o gêmeo calcule a divergência em relação à decisão recomendada.",
        riskVsReference: "Risco frente à rota recomendada",
        operationalCommand: "Comando operacional",
        effectiveResponseWindow: "Janela útil de resposta",
        riskIncrease: "A decisão tomada aumenta a exposição do sistema.",
        riskAligned: "A rota mantém o risco alinhado com a melhor resposta disponível.",
        commandTension: "O controle da ponte se tensiona em relação à referência ideal.",
        commandSustain: "A decisão sustenta o critério operacional da ponte.",
        responseLoss: "Tempo recuperável é consumido para conter a emergência.",
        responsePreserve: "A manobra preserva margem para estabilizar a situação.",
        timelineError: "Erro ao carregar a timeline",
        stateError: "Não foi possível carregar o estado do caso",
        loadFailed: "Falha de carga",
        loadFailedBody: "Não foi possível carregar <code>scenario.json</code>. Verifique a publicação do caso.",
        telemetryUnavailable: "Telemetria indisponível",
        modelUnavailable: "Modelo indisponível",
        headerUnavailable: "Cabeçalho do gêmeo indisponível",
        comparisonUnavailable: "Comparação indisponível",
        twinUnavailable: "Gêmeo indisponível",
        lawUnavailable: "Sem overlay normativo"
      },
      profiles: {
        cp1: [
          { label: "Rota", value: 46, detail: "Desalinhada com o plano de viagem aprovado." },
          { label: "Comando na ponte", value: 58, detail: "BRM insuficiente para travar o desvio." },
          { label: "Janela de correção", value: 84, detail: "Ainda existe margem alta para abortar." },
          { label: "Exposição legal", value: 34, detail: "Já existe incumprimento, embora ainda reversível." }
        ],
        cp2: [
          { label: "Integridade do casco", value: 18, detail: "Dano estrutural maior após Le Scole." },
          { label: "Propulsão e potência", value: 12, detail: "Blackout e perda de controlo da planta." },
          { label: "Capacidade de controlo", value: 24, detail: "A operação entrou em modo de contingência." },
          { label: "Janela de resposta", value: 38, detail: "Restam apenas minutos de reação útil." }
        ],
        cp3: [
          { label: "Narrativa operacional", value: 22, detail: "A versão oficial não reflete a situação real." },
          { label: "Coordenação SAR", value: 42, detail: "Existem meios, mas ainda sem contexto completo." },
          { label: "Controlo de passageiros", value: 34, detail: "A desorganização cresce a bordo." },
          { label: "Tempo disponível", value: 28, detail: "O atraso já compromete a evacuação." }
        ],
        cp4: [
          { label: "Estabilidade remanescente", value: 14, detail: "A banda degrada toda a manobra de abandono." },
          { label: "Meios de salvamento", value: 36, detail: "Apenas parte dos botes continua operativa." },
          { label: "Controlo de multidões", value: 26, detail: "O fluxo de passageiros já é caótico." },
          { label: "Probabilidade de recuperação", value: 10, detail: "O sistema entrou em fase de perda severa." }
        ]
      }
    }
  };

  const ui = uiText[locale] || uiText.es;
  const statusLabel = ui.statusLabel;
  const scoreLabel = ui.scoreLabel;

  const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

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
        key: "risk",
        value: risk,
        tone: toneForValue(100 - risk)
      },
      {
        key: "integrity",
        value: integrity,
        tone: toneForValue(integrity)
      },
      {
        key: "command",
        value: command,
        tone: toneForValue(command)
      },
      {
        key: "response",
        value: response,
        tone: toneForValue(response)
      }
    ].map((item) => ({
      ...item,
      label: ui.metrics[item.key].label,
      unit: ui.metrics[item.key].unit,
      note: ui.metrics[item.key].note(item.value)
    }));
  };

  const computeModel = (checkpoint, selectedOption) => {
    const baseProfile = ui.profiles[checkpoint.id] || [];
    const delta =
      !selectedOption ? 0 : selectedOption.score === "best" ? 8 : selectedOption.score === "acceptable" ? 2 : -10;

    return baseProfile.map((item) => ({
      ...item,
      value: clamp(item.value + delta),
      tone: toneForValue(item.value + delta)
    }));
  };

  const computeCommandState = (telemetry) => {
    const risk = telemetry.find((item) => item.key === "risk")?.value ?? 50;
    if (risk > 72) {
      return { label: ui.commandState.critical, tone: "critical" };
    }
    if (risk > 48) {
      return { label: ui.commandState.warning, tone: "warning" };
    }
    return { label: ui.commandState.stable, tone: "stable" };
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
          <span class="model-label">${escapeHtml(ui.labels.twinEngine)}</span>
          <strong>ABYSS TWIN ${escapeHtml(state.scenario.version || "v1.1")}</strong>
          <p>${escapeHtml(ui.labels.twinEngineBody)}</p>
        </article>
        <article class="command-card">
          <span class="command-chip ${chipClass(commandState.tone)}">${escapeHtml(commandState.label)}</span>
          <strong>${escapeHtml(checkpoint.phase)} · ${escapeHtml(checkpoint.time)}</strong>
          <p>${escapeHtml(ui.labels.checkpoint)} ${escapeHtml(checkpointLabel)}. ${escapeHtml(ui.labels.checkpointBody)}</p>
        </article>
        <article class="command-card">
          <span class="model-label">${escapeHtml(ui.labels.syncLabel)}</span>
          <strong>${escapeHtml(sync)}%</strong>
          <p>${escapeHtml(selectedOption ? ui.labels.syncActive : ui.labels.syncIdle)}</p>
        </article>
        <article class="command-card">
          <span class="model-label">${escapeHtml(ui.labels.modeLabel)}</span>
          <strong>${escapeHtml(selectedOption ? ui.labels.modeActiveTitle : ui.labels.modeIdleTitle)}</strong>
          <p>${escapeHtml(selectedOption ? ui.labels.modeActiveBody : ui.labels.modeIdleBody)}</p>
        </article>
      </div>
    `;
  };

  const renderTwinDelta = (selectedOption, recommendedOption) => {
    if (!selectedOption) {
      twinDelta.innerHTML = `
        <div class="panel-subheader">${escapeHtml(ui.labels.divergence)}</div>
        <div class="twin-delta-grid">
          <article class="delta-card is-placeholder">
            <span class="model-label">${escapeHtml(ui.labels.pendingComparison)}</span>
            <strong class="delta-safe">${escapeHtml(ui.labels.noDecisionStrong)}</strong>
            <p>${escapeHtml(ui.labels.pendingComparisonBody)}</p>
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
      <div class="panel-subheader">${escapeHtml(ui.labels.divergence)}</div>
      <div class="twin-delta-grid">
        <article class="delta-card">
            <span class="model-label">${escapeHtml(ui.labels.riskVsReference)}</span>
          <strong class="${divergenceClass(deltaRisk, true)}">${escapeHtml(formatDelta(deltaRisk))}</strong>
          <p>${escapeHtml(deltaRisk > 0 ? ui.labels.riskIncrease : ui.labels.riskAligned)}</p>
        </article>
        <article class="delta-card">
          <span class="model-label">${escapeHtml(ui.labels.operationalCommand)}</span>
          <strong class="${divergenceClass(deltaCommand, false)}">${escapeHtml(formatDelta(deltaCommand))}</strong>
          <p>${escapeHtml(deltaCommand < 0 ? ui.labels.commandTension : ui.labels.commandSustain)}</p>
        </article>
        <article class="delta-card">
          <span class="model-label">${escapeHtml(ui.labels.effectiveResponseWindow)}</span>
          <strong class="${divergenceClass(deltaResponse, false)}">${escapeHtml(formatDelta(deltaResponse))}</strong>
          <p>${escapeHtml(deltaResponse < 0 ? ui.labels.responseLoss : ui.labels.responsePreserve)}</p>
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
      <div class="panel-subheader">${escapeHtml(ui.labels.syntheticTelemetry)}</div>
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
      <div class="panel-subheader">${escapeHtml(ui.labels.operationalMirror)}</div>
      <div class="twin-compare-grid">
        <article class="compare-card is-recommended">
          <span class="model-label">${escapeHtml(ui.labels.recommendedRoute)}</span>
          <h3>${escapeHtml(recommendedOption?.label || ui.labels.noReference)}</h3>
          <p>${escapeHtml(recommendedOption?.outcome || ui.labels.notDefined)}</p>
        </article>
        <article class="compare-card is-selected">
          <span class="model-label">${escapeHtml(ui.labels.currentRoute)}</span>
          <h3>${escapeHtml(selectedOption?.label || ui.labels.noDecisionRegistered)}</h3>
          <p>${escapeHtml(selectedOption?.outcome || ui.labels.chooseDecisionImpact)}</p>
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
      <div class="panel-subheader">${escapeHtml(ui.labels.detectedEvents)}</div>
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
      <div class="panel-subheader">${escapeHtml(ui.labels.lawOverlay)}</div>
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
          <span class="panel-subheader">${escapeHtml(ui.labels.checkpointRead)}</span>
          <h3>${escapeHtml(checkpoint.debrief.title)}</h3>
          <p>${escapeHtml(checkpoint.debrief.summary)}</p>
        </article>
        <article class="debrief-card">
          <span class="panel-subheader">${escapeHtml(ui.labels.selectedDecision)}</span>
          <h3>${escapeHtml(selectedOption.label)}</h3>
          <p>${escapeHtml(selectedOption.outcome)}</p>
          <span class="decision-badge score-${escapeHtml(selectedOption.score)}">${escapeHtml(scoreLabel[selectedOption.score])}</span>
        </article>
      </div>
      <article class="debrief-card lessons-card">
        <span class="panel-subheader">${escapeHtml(ui.labels.keyLessons)}</span>
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
                  ${isRecommended ? `<span class="decision-badge badge-outline">${escapeHtml(ui.labels.recommendedBadge)}</span>` : ""}
                </span>
              </button>
            `;
          })
          .join("")}
      </div>
      ${
        selectedOption
          ? `<div class="decision-result">
              <span class="panel-subheader">${escapeHtml(ui.labels.result)}</span>
              <p>${escapeHtml(selectedOption.outcome)}</p>
            </div>`
          : ""
      }
      <div class="decision-nav">
        <button class="nav-mini" type="button" data-nav="prev" ${hasPrev ? "" : "disabled"}>${escapeHtml(ui.labels.prev)}</button>
        <button class="nav-mini" type="button" data-nav="next" ${hasNext ? "" : "disabled"}>${escapeHtml(ui.labels.next)}</button>
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
    timelineList.innerHTML = `<p class="meta-copy">${escapeHtml(ui.labels.timelineError)}</p>`;
    stateGrid.innerHTML = `<p class="meta-copy">${escapeHtml(ui.labels.stateError)}</p>`;
    decisionCard.innerHTML = `
      <div class="decision-result error-box">
        <span class="panel-subheader">${escapeHtml(ui.labels.loadFailed)}</span>
        <p>${ui.labels.loadFailedBody}</p>
      </div>
    `;
    twinOverview.innerHTML = `<p class="meta-copy">${escapeHtml(ui.labels.telemetryUnavailable)}</p>`;
    twinModel.innerHTML = `<p class="meta-copy">${escapeHtml(ui.labels.modelUnavailable)}</p>`;
    twinHeader.innerHTML = `<p class="meta-copy">${escapeHtml(ui.labels.headerUnavailable)}</p>`;
    twinDelta.innerHTML = `<p class="meta-copy">${escapeHtml(ui.labels.comparisonUnavailable)}</p>`;
    twinAlerts.innerHTML = `<p class="meta-copy">${escapeHtml(ui.labels.twinUnavailable)}</p>`;
    lawOverlay.innerHTML = `<p class="meta-copy">${escapeHtml(ui.labels.lawUnavailable)}</p>`;
    console.error(error);
  }
});
