/**
 * Day 5 Assignment: User Directory
 * Demonstrates async/await, fetch API, HTTP status checks,
 * try/catch/finally error handling, and client-side array filtering.
 */

// 1. Select DOM Elements
const loadUsersBtn = document.getElementById("load-users");
const filterInput = document.getElementById("filter-input");
const statusText = document.getElementById("status");
const usersList = document.getElementById("users-list");

// 2. Application State
let allUsers = [];

/**
 * Updates the UI status notification with appropriate styling and text.
 * @param {string} message - The status message to display.
 * @param {'loading'|'success'|'error'|'clear'} type - The visual style type.
 */
function setStatus(message, type) {
  if (type === "clear" || !message) {
    statusText.textContent = "";
    statusText.className = "";
    return;
  }

  statusText.textContent = message;
  statusText.className = `visible status-${type}`;
}

/**
 * Fetches user data from the REST API with error handling and UI state updates.
 */
async function loadUsers() {
  // Reset filter input on new load
  filterInput.value = "";
  
  // Update UI to loading state
  loadUsersBtn.disabled = true;
  setStatus("Loading users...", "loading");
  usersList.innerHTML = "";

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    // Check if HTTP response status is within 200-299 range
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status} (${response.statusText || "Request failed"})`);
    }

    // Parse JSON payload into JavaScript objects
    const data = await response.json();
    allUsers = data;

    // Display success status and render users
    setStatus(`Successfully loaded ${allUsers.length} users.`, "success");
    renderUsers(allUsers);
  } catch (error) {
    // Gracefully handle network errors or non-2xx HTTP responses
    console.error("Failed to fetch users:", error);
    setStatus(`Could not load users: ${error.message}. Please check the network connection and try again.`, "error");
  } finally {
    // Re-enable the load button regardless of whether the request succeeded or failed
    loadUsersBtn.disabled = false;
  }
}

/**
 * Renders a given list of user objects to the DOM using createElement and textContent.
 * @param {Array<Object>} list - Array of user objects to render.
 */
function renderUsers(list) {
  // Clear the existing list contents
  usersList.innerHTML = "";

  // Handle empty match / list scenario
  if (list.length === 0) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "empty-state";
    emptyLi.textContent = "No users match your filter.";
    usersList.appendChild(emptyLi);
    return;
  }

  // Iterate over users and build structured DOM elements
  list.forEach((user) => {
    const li = document.createElement("li");
    li.className = "user-card";

    // User Name
    const nameEl = document.createElement("h2");
    nameEl.className = "user-name";
    nameEl.textContent = user.name;

    // User Details Container
    const detailsContainer = document.createElement("div");
    detailsContainer.className = "user-details";

    // Email Item
    const emailItem = document.createElement("span");
    emailItem.className = "detail-item";
    const emailLabel = document.createElement("strong");
    emailLabel.className = "detail-label";
    emailLabel.textContent = "Email:";
    const emailValue = document.createElement("span");
    emailValue.className = "detail-value";
    emailValue.textContent = user.email;
    emailItem.appendChild(emailLabel);
    emailItem.appendChild(emailValue);

    // City Item
    const cityItem = document.createElement("span");
    cityItem.className = "detail-item";
    const cityLabel = document.createElement("strong");
    cityLabel.className = "detail-label";
    cityLabel.textContent = "City:";
    const cityValue = document.createElement("span");
    cityValue.className = "detail-value";
    cityValue.textContent = user.address ? user.address.city : "N/A";
    cityItem.appendChild(cityLabel);
    cityItem.appendChild(cityValue);

    // Company Item
    const companyItem = document.createElement("span");
    companyItem.className = "detail-item";
    const companyLabel = document.createElement("strong");
    companyLabel.className = "detail-label";
    companyLabel.textContent = "Company:";
    const companyValue = document.createElement("span");
    companyValue.className = "detail-value";
    companyValue.textContent = user.company ? user.company.name : "N/A";
    companyItem.appendChild(companyLabel);
    companyItem.appendChild(companyValue);

    // Assemble user card
    detailsContainer.appendChild(emailItem);
    detailsContainer.appendChild(cityItem);
    detailsContainer.appendChild(companyItem);

    li.appendChild(nameEl);
    li.appendChild(detailsContainer);

    usersList.appendChild(li);
  });
}

// 3. Event Listeners

// Trigger fetch when clicking "Load Users"
loadUsersBtn.addEventListener("click", loadUsers);

// Filter in-memory array on user input without re-fetching from server
filterInput.addEventListener("input", (event) => {
  const searchTerm = event.target.value.toLowerCase().trim();

  // Filter stored users array case-insensitively by name
  const filteredUsers = allUsers.filter((user) =>
    user.name.toLowerCase().includes(searchTerm)
  );

  renderUsers(filteredUsers);
});
