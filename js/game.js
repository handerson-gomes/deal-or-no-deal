(() => {
  "use strict";

  const CASE_VALUES = [
    0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 5000,
    10000, 25000, 50000, 75000, 100000, 200000, 300000, 400000, 500000,
    750000, 1000000,
  ];

  const HIGH_VALUE_THRESHOLD = 50000;

  // Number of non-player cases opened per round before a banker offer is made.
  const ROUND_SCHEDULE = [6, 5, 4, 3, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

  const formatMoney = (value) =>
    "$" + value.toLocaleString("en-US", { minimumFractionDigits: value < 1 ? 2 : 0, maximumFractionDigits: 2 });

  const els = {
    valuesLeft: document.getElementById("values-left"),
    valuesRight: document.getElementById("values-right"),
    casesGrid: document.getElementById("cases-grid"),
    statusMessage: document.getElementById("status-message"),
    yourCaseArea: document.getElementById("your-case-area"),
    yourCaseSlot: document.getElementById("your-case-slot"),
    offerPanel: document.getElementById("offer-panel"),
    offerAmount: document.getElementById("offer-amount"),
    dealBtn: document.getElementById("deal-btn"),
    noDealBtn: document.getElementById("no-deal-btn"),
    swapPanel: document.getElementById("swap-panel"),
    keepBtn: document.getElementById("keep-btn"),
    swapBtn: document.getElementById("swap-btn"),
    resultPanel: document.getElementById("result-panel"),
    resultTitle: document.getElementById("result-title"),
    resultDetail: document.getElementById("result-detail"),
    playAgainBtn: document.getElementById("play-again-btn"),
    newGameBtn: document.getElementById("new-game-btn"),
  };

  let state = null;

  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function newGame() {
    const shuffledValues = shuffle(CASE_VALUES);
    const cases = shuffledValues.map((value, i) => ({
      id: i + 1,
      value,
      opened: false,
    }));

    state = {
      cases,
      phase: "picking", // picking | opening | offer | swap | ended
      yourCaseId: null,
      roundIndex: 0,
      casesToOpenThisRound: 0,
      casesOpenedThisRound: 0,
      locked: false,
      lastOffer: null,
      dealAccepted: false,
      dealAmount: 0,
    };

    render();
  }

  function remainingValues() {
    return state.cases.filter((c) => !c.opened).map((c) => c.value);
  }

  function computeOffer() {
    const remaining = remainingValues();
    const ev = remaining.reduce((a, b) => a + b, 0) / remaining.length;

    const totalRounds = ROUND_SCHEDULE.length;
    const progress = Math.min(state.roundIndex / (totalRounds * 0.6), 1);
    const factor = 0.15 + progress * 0.8 + (Math.random() * 0.1 - 0.05);

    let offer = ev * Math.max(0.1, Math.min(factor, 1.05));

    if (offer >= 1000) {
      offer = Math.round(offer / 100) * 100;
    } else {
      offer = Math.round(offer);
    }
    return offer;
  }

  function startRound() {
    state.roundIndex += 1;
    const idx = state.roundIndex - 1;
    const remainingNonPlayer = state.cases.filter((c) => !c.opened && c.id !== state.yourCaseId).length;

    let toOpen = ROUND_SCHEDULE[idx] ?? 1;
    toOpen = Math.min(toOpen, remainingNonPlayer - 1 >= 0 ? remainingNonPlayer - 1 : remainingNonPlayer);
    // If only one non-player case remains, we go straight to the swap decision.
    if (remainingNonPlayer <= 1) {
      state.phase = "swap";
      render();
      return;
    }

    state.casesToOpenThisRound = Math.max(toOpen, 1);
    state.casesOpenedThisRound = 0;
    state.locked = false;
    state.phase = "opening";
    render();
  }

  function onCaseClick(caseId) {
    const c = state.cases.find((x) => x.id === caseId);
    if (!c) return;

    if (state.phase === "picking") {
      state.yourCaseId = caseId;
      state.phase = "opening";
      state.roundIndex = 0;
      startRound();
      return;
    }

    if (state.phase === "opening") {
      if (state.locked || c.opened || c.id === state.yourCaseId) return;
      c.opened = true;
      state.casesOpenedThisRound += 1;

      if (state.casesOpenedThisRound >= state.casesToOpenThisRound) {
        state.locked = true;
        render();
        setTimeout(() => {
          state.lastOffer = computeOffer();
          state.phase = "offer";
          render();
        }, 500);
      } else {
        render();
      }
    }
  }

  function onDeal() {
    state.dealAccepted = true;
    state.dealAmount = state.lastOffer;
    state.phase = "ended";
    render();
  }

  function onNoDeal() {
    startRound();
  }

  function onKeep() {
    finishGame(state.yourCaseId);
  }

  function onSwap() {
    const otherCase = state.cases.find((c) => !c.opened && c.id !== state.yourCaseId);
    finishGame(otherCase.id);
  }

  function finishGame(finalCaseId) {
    state.cases.forEach((c) => (c.opened = true));
    state.finalCaseId = finalCaseId;
    state.dealAccepted = false;
    state.phase = "ended";
    render();
  }

  function render() {
    renderValues();
    renderCases();
    renderStatus();
    renderYourCase();
    renderOfferPanel();
    renderSwapPanel();
    renderResultPanel();
  }

  function renderValues() {
    const remaining = new Set(remainingValues());
    const sorted = CASE_VALUES.slice().sort((a, b) => a - b);
    const half = Math.ceil(sorted.length / 2);
    const left = sorted.slice(0, half);
    const right = sorted.slice(half);

    const buildChip = (value) => {
      const chip = document.createElement("div");
      chip.className = "value-chip";
      if (value >= HIGH_VALUE_THRESHOLD) chip.classList.add("high-value");
      if (!state.cases.some((c) => c.value === value && !c.opened)) {
        chip.classList.add("eliminated");
      }
      chip.textContent = formatMoney(value);
      return chip;
    };

    els.valuesLeft.replaceChildren(...left.map(buildChip));
    els.valuesRight.replaceChildren(...right.map(buildChip));
  }

  function renderCases() {
    const frag = document.createDocumentFragment();
    state.cases.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "case";
      btn.type = "button";
      btn.dataset.id = c.id;

      if (c.opened && state.phase !== "ended") {
        btn.classList.add("opened");
        btn.innerHTML = `<span class="case-value">${formatMoney(c.value)}</span>`;
        btn.disabled = true;
      } else if (state.phase === "ended") {
        btn.classList.add("opened");
        if (c.id === state.finalCaseId || (state.dealAccepted && c.id === state.yourCaseId)) {
          btn.classList.add("is-yours");
        }
        btn.innerHTML = `<span class="case-value">${formatMoney(c.value)}</span>`;
        btn.disabled = true;
      } else {
        btn.textContent = c.id;
        btn.disabled = state.phase === "offer" || state.phase === "swap" || state.locked;
      }

      if (c.id === state.yourCaseId && state.phase !== "picking" && state.phase !== "ended") {
        // Your case lives in the "your case" slot, not the grid, once chosen.
        return;
      }

      btn.addEventListener("click", () => onCaseClick(c.id));
      frag.appendChild(btn);
    });
    els.casesGrid.replaceChildren(frag);
  }

  function renderStatus() {
    let msg = "";
    switch (state.phase) {
      case "picking":
        msg = "Pick your case to begin.";
        break;
      case "opening": {
        const left = state.casesToOpenThisRound - state.casesOpenedThisRound;
        msg = `Round ${state.roundIndex}: open ${left} more case${left === 1 ? "" : "s"}.`;
        break;
      }
      case "offer":
        msg = "The banker is calling with an offer...";
        break;
      case "swap":
        msg = "One case remains besides yours.";
        break;
      case "ended":
        msg = "";
        break;
    }
    els.statusMessage.textContent = msg;
  }

  function renderYourCase() {
    if (state.phase === "picking") {
      els.yourCaseArea.hidden = true;
      return;
    }
    els.yourCaseArea.hidden = false;
    const yourCase = state.cases.find((c) => c.id === state.yourCaseId);
    if (state.phase === "ended") {
      els.yourCaseSlot.textContent = formatMoney(yourCase.value);
    } else {
      els.yourCaseSlot.textContent = String(yourCase.id);
    }
  }

  function renderOfferPanel() {
    els.offerPanel.hidden = state.phase !== "offer";
    if (state.phase === "offer") {
      els.offerAmount.textContent = formatMoney(state.lastOffer);
    }
  }

  function renderSwapPanel() {
    els.swapPanel.hidden = state.phase !== "swap";
  }

  function renderResultPanel() {
    els.resultPanel.hidden = state.phase !== "ended";
    if (state.phase !== "ended") return;

    const yourCase = state.cases.find((c) => c.id === state.yourCaseId);

    if (state.dealAccepted) {
      els.resultTitle.textContent = `Deal! You walk away with ${formatMoney(state.dealAmount)}`;
      els.resultDetail.textContent = `Your case (#${yourCase.id}) actually held ${formatMoney(yourCase.value)}.`;
    } else {
      const finalCase = state.cases.find((c) => c.id === state.finalCaseId);
      const kept = state.finalCaseId === state.yourCaseId;
      els.resultTitle.textContent = `No Deal! You ${kept ? "kept your case" : "swapped"} and won ${formatMoney(finalCase.value)}`;
      if (!kept) {
        els.resultDetail.textContent = `Your original case (#${yourCase.id}) held ${formatMoney(yourCase.value)}.`;
      } else {
        els.resultDetail.textContent = `You stuck with case #${yourCase.id}.`;
      }
    }
  }

  els.dealBtn.addEventListener("click", onDeal);
  els.noDealBtn.addEventListener("click", onNoDeal);
  els.keepBtn.addEventListener("click", onKeep);
  els.swapBtn.addEventListener("click", onSwap);
  els.playAgainBtn.addEventListener("click", newGame);
  els.newGameBtn.addEventListener("click", () => {
    if (state.phase === "picking" || state.phase === "ended" || confirm("Start a new game? Current progress will be lost.")) {
      newGame();
    }
  });

  newGame();
})();
