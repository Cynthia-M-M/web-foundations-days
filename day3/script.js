let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes
function searchNotes(word) {
  const lowerWord = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(lowerWord));
}

// 2. longestNote
function longestNote() {
  if (notes.length === 0) return null;

  return notes.reduce((longest, current) => {
    if (current.text.length > longest.text.length) {
      return current;
    }
    return longest;
  });
}

// 3. countByCategory
function countByCategory() {
  const counts = {};
  notes.forEach((note) => {
    if (counts[note.category]) {
      counts[note.category]++;
    } else {
      counts[note.category] = 1;
    }
  });
  return counts;
}

// 4. getSummary
function getSummary() {
  const counts = countByCategory();
  const noteWord = notes.length === 1 ? "note" : "notes";

  const personalCount = counts.personal || 0;
  const workCount = counts.work || 0;
  const studyCount = counts.study || 0;

  return `${notes.length} ${noteWord}: ${personalCount} personal, ${workCount} work, ${studyCount} study.`;
}

// 5. isDuplicate
function isDuplicate(text) {
  const cleanedText = text.trim().toLowerCase();
  return notes.some((note) => note.text.trim().toLowerCase() === cleanedText);
}

// 6. addNote
function addNote(text, category) {
  const cleanedText = text.trim();

  if (cleanedText.length === 0 || cleanedText.length > 200) {
    console.log("❌ Note rejected: must be between 1 and 200 characters.");
    return false;
  }

  if (isDuplicate(cleanedText)) {
    console.log("❌ Note rejected: duplicate text.");
    return false;
  }

  const validCategories = ["personal", "work", "study"];
  if (!validCategories.includes(category)) {
    console.log(
      "❌ Note rejected: invalid category. Use personal, work, or study.",
    );
    return false;
  }

  const newNote = {
    id: Date.now(),
    text: cleanedText,
    category: category,
  };

  notes.push(newNote);
  console.log(`✅ Added: "${newNote.text}"`);
  return true;
}

// --- Tests ---

// Test searchNotes
console.log(searchNotes("javascript"));
// Expected: [{ id: 4, text: 'Revise JavaScript arrays', category: 'study' }]
console.log(searchNotes("python"));
// Expected: [] (empty array, no results found)

// Test longestNote
console.log(longestNote());
// Expected: { id: 3, text: 'Email the project report to Grace', category: 'work' }
const backupNotes = [...notes]; // temporarily empty the array for the edge case
notes = [];
console.log(longestNote());
// Expected: null
notes = [...backupNotes]; // restore notes

// Test countByCategory
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }
notes.push({ id: 6, text: "Workout", category: "personal" }); // temporary addition
console.log(countByCategory());
// Expected: { personal: 3, study: 2, work: 1 }
notes.pop(); // remove temporary addition

// Test getSummary
console.log(getSummary());
// Expected: "5 notes: 2 personal, 1 work, 2 study."
const tempNotes = [...notes];
notes = [{ id: 7, text: "Only one note", category: "personal" }]; // test singular edge case
console.log(getSummary());
// Expected: "1 note: 1 personal, 0 work, 0 study."
notes = [...tempNotes]; // restore notes

// Test isDuplicate
console.log(isDuplicate("  CALL mum  "));
// Expected: true (ignores case and spaces)
console.log(isDuplicate("Call dad"));
// Expected: false

// Test addNote
console.log(addNote("Learn Node.js", "study"));
// Expected: ✅ Added: "Learn Node.js", returns true
console.log(addNote("Learn Node.js", "study"));
// Expected: ❌ Note rejected: duplicate text., returns false
console.log(addNote("  ", "work"));
// Expected: ❌ Note rejected: must be between 1 and 200 characters., returns false
console.log(addNote("Walk the dog", "chores"));
// Expected: ❌ Note rejected: invalid category., returns false
