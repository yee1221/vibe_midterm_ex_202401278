const choiceForm = document.querySelector("#choiceForm");
const choiceInput = document.querySelector("#choiceInput");
const choiceList = document.querySelector("#choiceList");
const choiceCount = document.querySelector("#choiceCount");
const emptyState = document.querySelector("#emptyState");
const clearButton = document.querySelector("#clearButton");

const spinButton = document.querySelector("#spinButton");
const lever = document.querySelector("#lever");
const leverHint = document.querySelector("#leverHint");
const reelFrame = document.querySelector("#reelFrame");

const resultPanel = document.querySelector("#resultPanel");
const resultCaption = document.querySelector("#resultCaption");
const resultText = document.querySelector("#resultText");

const reels = [
  document.querySelector("#reel1"),
  document.querySelector("#reel2"),
  document.querySelector("#reel3")
];

const symbols = ["7", "★", "BAR", "♦", "♠", "♣", "✦"];

let choices = [];
let isSpinning = false;
let timers = [];

function renderChoices() {
  choiceList.replaceChildren();

  choices.forEach((choice, index) => {
    const item = document.createElement("li");
    item.className = "choice-item";

    const text = document.createElement("span");
    text.textContent = choice;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-choice";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `${choice} 삭제`);

    deleteButton.addEventListener("click", () => {
      if (isSpinning) return;

      choices.splice(index, 1);
      renderChoices();
      resetResult();
    });

    item.append(text, deleteButton);
    choiceList.append(item);
  });

  choiceCount.textContent = choices.length;
  emptyState.hidden = choices.length > 0;
  clearButton.hidden = choices.length === 0;
  spinButton.disabled = isSpinning || choices.length === 0;
}

function resetResult() {
  resultPanel.classList.remove("winner");
  resultCaption.textContent = "YOUR DESTINY AWAITS";
  resultText.textContent = "What will luck bring?";
}

choiceForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (isSpinning) return;

  const value = choiceInput.value.trim();

  if (!value) {
    choiceInput.focus();
    return;
  }

  choices.push(value);
  choiceInput.value = "";

  renderChoices();
  resetResult();
  leverHint.textContent = "READY WHEN YOU ARE";
  choiceInput.focus();
});

clearButton.addEventListener("click", () => {
  if (isSpinning) return;

  choices = [];
  renderChoices();
  resetResult();
  leverHint.textContent = "ADD YOUR CHOICES & PULL";
});

function delay(ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    timers.push(timer);
  });
}

function setReelSymbol(reel, symbol) {
  reel.innerHTML = "";

  const span = document.createElement("span");
  span.textContent = symbol;
  reel.append(span);
}

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

async function spinReel(reel, index) {
  reel.classList.remove("stopping");
  reel.classList.add("spinning");

  const duration = 1250 + index * 800;
  const interval = setInterval(() => {
    setReelSymbol(reel, randomSymbol());
  }, 85);

  await delay(duration);

  clearInterval(interval);
  reel.classList.remove("spinning");

  setReelSymbol(reel, "7");
  reel.classList.add("stopping");

  await delay(220);
  reel.classList.remove("stopping");
}

async function playSlotMachine() {
  if (isSpinning || choices.length === 0) return;

  isSpinning = true;
  renderChoices();

  timers.forEach(clearTimeout);
  timers = [];

  resetResult();
  reelFrame.classList.remove("jackpot");
  lever.classList.add("pulling");

  leverHint.textContent = "GOOD LUCK...";
  resultCaption.textContent = "THE REELS ARE SPINNING";
  resultText.textContent = "Waiting for your lucky moment";

  await delay(360);
  lever.classList.remove("pulling");

  reels.forEach((reel) => {
    reel.classList.remove("spinning", "stopping");
  });

  try {
    await Promise.all([
      spinReel(reels[0], 0),
      spinReel(reels[1], 1).then(() => delay(0)),
      spinReel(reels[2], 2).then(() => delay(0))
    ]);

    // 최종 릴 표시는 항상 777
    reels.forEach((reel) => setReelSymbol(reel, "7"));
    reelFrame.classList.add("jackpot");

    leverHint.textContent = "JACKPOT!";
    resultCaption.textContent = "777 — JACKPOT";

    await delay(650);

    // 모든 선택지가 동일한 확률로 선택됨
    const winner = choices[
      Math.floor(Math.random() * choices.length)
    ];

    resultText.textContent = winner;
    resultCaption.textContent = "LUCK HAS CHOSEN";
    resultPanel.classList.add("winner");
    leverHint.textContent = "PULL AGAIN TO TRY YOUR LUCK";
  } finally {
    isSpinning = false;
    renderChoices();
  }
}

spinButton.addEventListener("click", playSlotMachine);

// 초기 화면
renderChoices();
resetResult();
