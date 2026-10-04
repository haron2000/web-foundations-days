const noteText = document.getElementById("note-text");
const charCount = document.getElementById("char-count");
const wordCount = document.getElementById("word-count");
const clearBtn = document.getElementById("clear-btn");
const themeToggle = document.getElementById("theme-toggle");

const DRAFT_KEY = "quicknotes-draft";
const THEME_KEY = "quicknotes-theme";

function updateCounts() {
const text = noteText.value;
const characterCount = text.length;

const words = text.trim() === ""
    ? 0
    : text.trim().split(/\s+/).length;

charCount.textContent = `${characterCount} / 200 characters`;
wordCount.textContent = `${words} words`;

charCount.classList.remove("warning", "over");

if (characterCount > 200) {
    charCount.classList.add("over");
} else if (characterCount > 180) {
    charCount.classList.add("warning");
}

}

function saveDraft() {
localStorage.setItem(DRAFT_KEY, noteText.value);
}

function clearNote() {
noteText.value = "";
updateCounts();
localStorage.removeItem(DRAFT_KEY);
noteText.focus();
}

function updateThemeButton() {
if (document.body.classList.contains("dark")) {
themeToggle.textContent = "Light mode";
} else {
themeToggle.textContent = "Dark mode";
}
}

noteText.addEventListener("input", function () {
updateCounts();
saveDraft();
});

clearBtn.addEventListener("click", function () {
clearNote();
});

noteText.addEventListener("keydown", function (event) {
if (event.key === "Escape") {
clearNote();
}
});

themeToggle.addEventListener("click", function () {
document.body.classList.toggle("dark");

const isDark = document.body.classList.contains("dark");

localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");

updateThemeButton();

});

const savedDraft = localStorage.getItem(DRAFT_KEY);

if (savedDraft !== null) {
noteText.value = savedDraft;
}

const savedTheme = localStorage.getItem(THEME_KEY);

if (savedTheme === "dark") {
document.body.classList.add("dark");
}

updateCounts();
updateThemeButton();
