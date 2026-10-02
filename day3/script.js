
let notes = [
    { id: 1, text: "Buy milk and bread", category: "personal" },
    { id: 2, text: "Finish the Day 3 assignment", category: "study" },
    { id: 3, text: "Email the project report to Grace", category: "work" },
    { id: 4, text: "Revise JavaScript arrays", category: "study" },
    { id: 5, text: "Call mum", category: "personal" },
];

// 1. Search notes by word, ignoring case
function searchNotes(word) {
    return notes.filter(note =>
        note.text.toLowerCase().includes(word.toLowerCase())
    );
}

// 2. Find the note with the most characters
function longestNote() {
    if (notes.length === 0) {
        return null;
    }

    return notes.reduce((longest, current) =>
        current.text.length > longest.text.length ? current : longest
    );
}

// 3. Count notes in each category
function countByCategory() {
    let counts = {};

    for (let note of notes) {
        if (counts[note.category] === undefined) {
            counts[note.category] = 0;
        }

        counts[note.category]++;
    }

    return counts;
}

// 4. Create a summary of all notes
function getSummary() {
    let counts = countByCategory();
    let total = notes.length;
    let noteWord = total === 1 ? "note" : "notes";

    return `${total} ${noteWord}: ${counts.personal || 0} personal, ${counts.work || 0} work, ${counts.study || 0} study.`;
}

// 5. Check whether a note already exists
function isDuplicate(text) {
    let normalisedText = text.trim().toLowerCase();

    return notes.some(note =>
        note.text.trim().toLowerCase() === normalisedText
    );
}

// 6. Add a note after validating it
function addNote(text, category) {
    let trimmedText = text.trim();
    let allowedCategories = ["personal", "work", "study"];

    if (trimmedText.length < 1 || trimmedText.length > 200) {
        console.log("Note must contain between 1 and 200 characters.");
        return false;
    }

    if (isDuplicate(trimmedText)) {
        console.log("A note with this text already exists.");
        return false;
    }

    if (!allowedCategories.includes(category)) {
        console.log("Invalid category. Use personal, work, or study.");
        return false;
    }

    let newId = notes.length === 0
        ? 1
        : Math.max(...notes.map(note => note.id)) + 1;

    notes.push({
        id: newId,
        text: trimmedText,
        category: category
    });

    console.log("Note added successfully.");
    return true;
}


// ============================
// TESTS
// Open the browser console
// ============================

// Test 1: searchNotes
console.log(searchNotes("JAVASCRIPT"));
// Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]

console.log(searchNotes("pizza"));
// Expected: []


// Test 2: longestNote
console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

let savedNotes = notes;
notes = [];
console.log(longestNote());
// Expected: null
notes = savedNotes;


// Test 3: countByCategory
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

notes = [];
console.log(countByCategory());
// Expected: {}
notes = savedNotes;


// Test 4: getSummary
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."

notes = [{ id: 1, text: "Read a book", category: "personal" }];
console.log(getSummary());
// Expected: "1 note: 1 personal, 0 work, 0 study."

notes = savedNotes;


// Test 5: isDuplicate
console.log(isDuplicate("  BUY MILK AND BREAD  "));
// Expected: true

console.log(isDuplicate("Go swimming"));
// Expected: false


// Test 6: addNote
console.log(addNote("Complete JavaScript practice", "study"));
// Expected: logs "Note added successfully." and returns true

console.log(addNote("  complete JAVASCRIPT practice  ", "study"));
// Expected: logs duplicate reason and returns false

console.log(addNote("", "personal"));
// Expected: logs length reason and returns false

console.log(addNote("Prepare meeting notes", "invalid"));
// Expected: logs invalid category reason and returns false

console.log(notes);
// Expected: 6 notes, including "Complete JavaScript practice"