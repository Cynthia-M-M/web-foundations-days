// 1. Select elements
const noteText = document.querySelector("#note-text");
const charCount = document.querySelector("#char-count");
const wordCount = document.querySelector("#word-count");
const clearBtn = document.querySelector("#clear-btn");
const themeToggle = document.querySelector("#theme-toggle");

// 2. Initialize saved data on page load
noteText.value = localStorage.getItem("draft") || "";

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "Light mode";
}

// 3. Helper functions
function updateCounts() {
  const text = noteText.value;
  const length = text.length;

  // Calculate words: trim spaces and split by whitespace, handling empty fields
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  charCount.textContent = `${length} / 200 characters`;
  wordCount.textContent = `${words} words`;

  // Reset classes
  charCount.classList.remove("warning", "over");

  // Apply limit classes
  if (length > 200) {
    charCount.classList.add("over");
  } else if (length > 180) {
    charCount.classList.add("warning");
  }
}

function clearAll() {
  noteText.value = "";
  localStorage.removeItem("draft");
  updateCounts();
}

// 4. Event Listeners
noteText.addEventListener("input", () => {
  updateCounts();
  localStorage.setItem("draft", noteText.value);
});

noteText.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    clearAll();
  }
});

clearBtn.addEventListener("click", () => {
  clearAll();
});

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  // Check if the dark class is currently applied
  const isDark = document.body.classList.contains("dark");

  // Update button text and save choice to local storage
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

// 5. Draw initial state
updateCounts();
