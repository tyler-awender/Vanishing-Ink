// Define corruption character set (block Unicode characters)
const corruptionCharacters = [
  "▒",
  "▓",
  "░",
  "█",
  "▀",
  "▄",
  "▌",
  "▐",
  "▞",
  "▟",
  "■",
  "▛",
  "▏",
  "▆",
];
const titleChars = ["■", "░"];

let userText = []; // array of dicts
let textField; // output
let typingStartedAt = null;

function DisplayDate() {
  const dateId = document.getElementById("date");
  const currentDate = new Date().toLocaleDateString("en-US");
  dateId.innerText = currentDate;
  glitchTitle();
}

// run these on window load
window.onload = function () {
  DisplayDate();
  textField = document.getElementById("userInput");

  userText = [];
  typingStartedAt = null;
  updateDisplay(); // always start blank

  //   setInterval(checkCorruption, 2000);
  setInterval(updateSubmitAvailability, 1000);

  // Archive toggle
  const archiveBtn = document.getElementById("archiveToggle");
  if (archiveBtn) {
    archiveBtn.addEventListener("click", () => {
      const archiveDiv = document.getElementById("archive");
      archiveDiv.classList.toggle("hidden");
      if (!archiveDiv.classList.contains("hidden")) loadArchive();
    });
  }

  // Submit to Memory
  const submitBtn = document.getElementById("submitJournal");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const corrupted = userText.map((obj) => obj.char).join("");
      if (corrupted.trim() === "") return;

      fetch("/save_entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ corrupted: corrupted }),
      }).then(() => {
        userText = [];
        typingStartedAt = null;
        updateDisplay();
        updateSubmitAvailability();
        sessionStorage.setItem("justSubmitted", "true");

        clearTimeout(corruptionTimeoutId);
        // show confirmation message
        const msg = document.getElementById("submissionMessage");
        if (msg) {
          msg.classList.add("visible");
          msg.textContent = "Memory submitted.";
          setTimeout(() => {
            msg.classList.remove("visible");
          }, 3000);
        }
      });
    });
  }
};

function CaptureInput(event) {
  if (!textField) return;

  let currentTime = Date.now();

  if (!typingStartedAt) {
    typingStartedAt = currentTime;
    startCorruptionLoop(); // begin new logarithmic loop
  }

  if (event.key === " ") {
    userText.push({ char: " ", timestamp: currentTime });
  } else if (event.key === "Enter") {
    userText.push({ char: "\n", timestamp: currentTime });
  } else if (event.key.length === 1) {
    userText.push({ char: event.key, timestamp: currentTime });
  }

  updateDisplay();
  updateSubmitAvailability();
}

// run CaptureInput() on every keystroke
document.addEventListener("keydown", CaptureInput);

// update displayed text
function updateDisplay() {
  // only continue if textfield is not null
  if (textField) {
    // extract chars and add to map
    textField.textContent = userText.map((obj) => obj.char).join(""); // .join -> convert into string??
  }
}

// check corruption
function checkCorruption() {
  if (userText.length === 0) return;

  const maxAttempts = 20;
  let attempts = 0;
  while (attempts < maxAttempts) {
    const index = Math.floor(Math.random() * userText.length);
    const currentChar = userText[index].char;

    if (
      !corruptionCharacters.includes(currentChar) &&
      currentChar.trim() !== ""
    ) {
      userText[index].char =
        corruptionCharacters[
          Math.floor(Math.random() * corruptionCharacters.length)
        ];
      break;
    }

    attempts++;
  }

  updateDisplay();
}

function glitchTitle() {
  let titleElement = document.getElementById("title");
  if (!titleElement) return;

  let originalText = titleElement.textContent.split(""); // title to char arr
  let glitchText = [...originalText];

  let numGlitches = Math.floor(Math.random() * 3) + 1; // pick 1 - 3 chars

  // select char and replace
  for (let i = 0; i < numGlitches; i++) {
    let randomIndex = Math.floor(Math.random() * glitchText.length);
    glitchText[randomIndex] =
      titleChars[Math.floor(Math.random() * titleChars.length)];
  }

  titleElement.textContent = glitchText.join(""); // apply corruption

  setTimeout(() => {
    titleElement.textContent = originalText.join(""); // restore after 300ms
  }, 300);
}

// glitch  every 2-5 seconds
setInterval(glitchTitle, Math.random() * (5000 - 2000) + 2000);

function saveCorruptedJournal() {
  const corrupted = userText.map((obj) => obj.char).join("");
  fetch("/save_entry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ corrupted: corrupted }),
  }).then((res) => console.log("Saved corrupted entry."));
}

function loadArchive() {
  fetch("/archive")
    .then((res) => res.json())
    .then((entries) => {
      const archiveDiv = document.getElementById("archive");
      archiveDiv.innerHTML = "";
      entries.forEach((entry) => {
        const div = document.createElement("div");
        div.classList.add("archive-entry");
        const date = new Date(entry.timestamp).toLocaleString();
        div.innerText = `${date}\n${entry.content}`;
        archiveDiv.appendChild(div);
      });
    });
}

function updateSubmitAvailability() {
  const submitBtn = document.getElementById("submitJournal");
  if (!typingStartedAt || userText.length === 0) {
    submitBtn.disabled = true;
    submitBtn.innerText = "Wait...";
    return;
  }

  const secondsElapsed = (Date.now() - typingStartedAt) / 1000;
  if (secondsElapsed >= 10) {
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit to Memory";
  } else {
    submitBtn.disabled = true;
    const remaining = Math.ceil(10 - secondsElapsed);
    submitBtn.innerText = `Wait ${remaining}s...`;
  }
}

// logarithmic scaling
let corruptionTimeoutId = null;

function startCorruptionLoop() {
  if (corruptionTimeoutId) clearTimeout(corruptionTimeoutId); // prevent overlap

  const now = Date.now();
  const elapsed = typingStartedAt ? (now - typingStartedAt) / 1000 : 0;

  // Sharper decay, faster ramp
  const delay = Math.max(400, 4000 - Math.log(elapsed + 1) * 1000);

  // Perform one corruption, then schedule next run
  checkCorruption();

  corruptionTimeoutId = setTimeout(startCorruptionLoop, delay);
}
