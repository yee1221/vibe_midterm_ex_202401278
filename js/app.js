// ========================================
// LUCKY SLOT — GAME LOGIC
// Lever / Vertical Reels / Random Results
// ========================================

const spinButton = document.getElementById("spinButton");
const buttonText = document.getElementById("buttonText");
const leverAssembly = document.getElementById("leverAssembly");
const machineStatus = document.getElementById("machineStatus");
const resultElement = document.getElementById("result");

const choiceForm = document.getElementById("choiceForm");
const choiceInput = document.getElementById("choiceInput");
const choiceList = document.getElementById("choiceList");
const choiceCount = document.getElementById("choiceCount");

const reelIds = ["reel1", "reel2", "reel3"];
const symbols = ["7", "★", "♦", "●", "✳", "♠"];

let choices = [];
let isSpinning = false;

// ----------------------------------------
// Choice management
// ----------------------------------------

function updateChoiceCount() {
  choiceCount.textContent =
    `${String(choices.length).padStart(2, "0")} ITEMS`;
}

function renderChoices() {
  choiceList.replaceChildren();

  choices.forEach((choice, index) => {
    const item = document.createElement("li");
    const text = document.createElement("span");
    const removeButton = document.createElement("button");

    text.textContent = choice;
    removeButton.type = "button";
    removeButton.textContent = "REMOVE";
    removeButton.setAttribute(
      "aria-label",
      `${choice} 선택지 삭제`
    );

    removeButton.addEventListener("click", () => {
      if (isSpinning) return;

      choices.splice(index, 1);
      renderChoices();
      updateChoiceCount();
    });

    item.append(text, removeButton);
    choiceList.appendChild(item);
  });

  updateChoiceCount();
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
  choiceInput.focus();
});

// ----------------------------------------
// Reel setup
// ----------------------------------------

const reels = reelIds.map((id) => {
  const strip = document.getElementById(id);
  const windowElement = strip.parentElement;

  return {
    strip,
    windowElement,
    symbolHeight: 0,
    animation: null
  };
});

function createSymbol(value) {
  const symbol = document.createElement("div");
  symbol.className = "symbol";
  symbol.textContent = value;
  return symbol;
}

function setupReel(reel, values) {
  reel.strip.replaceChildren();

  values.forEach((value) => {
    reel.strip.appendChild(createSymbol(value));
  });

  reel.symbolHeight =
    reel.strip.querySelector(".symbol").getBoundingClientRect().height;
}

function resetReels() {
  reels.forEach((reel) => {
    if (reel.animation) {
      reel.animation.cancel();
      reel.animation = null;
    }

    setupReel(reel, ["7"]);
    reel.strip.style.transform = "translateY(0)";
  });
}

// ----------------------------------------
// Lever animation
// ----------------------------------------

function pullLever() {
  return new Promise((resolve) => {
    leverAssembly.classList.remove("pulling");

    // Allow the browser to register the starting position.
    void leverAssembly.offsetWidth;

    leverAssembly.classList.add("pulling");

    setTimeout(() => {
      leverAssembly.classList.remove("pulling");

      // Lever returns to its raised position.
      setTimeout(resolve, 380);
    }, 430);
  });
}

// ----------------------------------------
// Vertical reel spinning
// ----------------------------------------

function spinReel(reel, duration, finalDelay = 0) {
  return new Promise((resolve) => {
    const spinSymbols = [];

    // Build a long vertical strip of passing symbols.
    for (let i = 0; i < 34; i++) {
      spinSymbols.push(
        symbols[Math.floor(Math.random() * symbols.length)]
      );
    }

    // Finish on 7. The final three reels show 777.
    spinSymbols.push("7");

    setupReel(reel, spinSymbols);

    const totalDistance =
      reel.symbolHeight * (spinSymbols.length - 1);

    reel.animation = reel.strip.animate(
      [
        { transform: "translateY(0)" },
        { transform: `translateY(-${totalDistance}px)` }
      ],
      {
        duration,
        delay: finalDelay,
        easing: "cubic-bezier(0.12, 0.75, 0.18, 1)",
        fill: "forwards"
      }
    );

    reel.animation.onfinish = () => {
      reel.strip.style.transform =
        `translateY(-${totalDistance}px)`;

      reel.animation = null;
      resolve();
    };

    reel.animation.oncancel = resolve;
  });
}

// ----------------------------------------
// Game sequence
// ----------------------------------------

async function playGame() {
  if (isSpinning) return;

  if (choices.length === 0) {
    resultElement.textContent = "Add a choice to begin.";
    choiceInput.focus();
    return;
  }

  isSpinning = true;
  spinButton.disabled = true;
  buttonText.textContent = "SPINNING...";
  machineStatus.textContent = "MACHINE IN MOTION";
  resultElement.textContent = "The odds are turning...";

  resetReels();

  try {
    // Pull down, then automatically return the lever.
    await pullLever();

    // Start all three reels with different stopping times.
    const spinPromises = reels.map((reel, index) => {
      return spinReel(
        reel,
        1700 + index * 650,
        index * 120
      );
    });

    // Stop each reel sequentially.
    for (let index = 0; index < spinPromises.length; index++) {
      await spinPromises[index];

      machineStatus.textContent =
        index < 2
          ? `REEL ${index + 1} LOCKED`
          : "ALL REELS LOCKED";
    }

    // Randomly select from the user's current choices.
    const winner =
      choices[Math.floor(Math.random() * choices.length)];

    resultElement.textContent = winner;
    machineStatus.textContent = "WINNER SELECTED";
    buttonText.textContent = "PLAY AGAIN";
  } catch (error) {
    console.error("Slot animation error:", error);
    resultElement.textContent = "Something went wrong. Try again.";
    machineStatus.textContent = "MACHINE READY";
    buttonText.textContent = "PULL TO PLAY";
  } finally {
    isSpinning = false;
    spinButton.disabled = false;
  }
}

spinButton.addEventListener("click", playGame);

// ----------------------------------------
// Initial state
// ----------------------------------------

resetReels();
renderChoices();