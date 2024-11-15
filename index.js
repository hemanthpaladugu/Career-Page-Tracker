const inputEl1 = document.getElementById("input-el1"); // Company Name input
const inputEl2 = document.getElementById("input-el2"); // Career Page URL input
const inputBtn = document.getElementById("input-btn"); // SAVE INPUT button
const ulEl = document.getElementById("ul-el"); // List to display leads
const deleteBtn = document.getElementById("delete-btn"); // DELETE ALL button
const linkBtn = document.getElementById("link-btn"); // GET LINK button
const messageDiv = document.getElementById("message"); // Message display area
const searchInput = document.getElementById("search-input"); // Search input

let allLeads = []; // Cached list of all leads

/**
 * Displays a message to the user.
 * @param {string} type - Type of message ('success' or 'error').
 * @param {string} text - The message text to display.
 */
function showMessage(type, text) {
    messageDiv.className = ""; // Reset classes
    messageDiv.classList.add(type === 'error' ? 'error' : 'success');
    messageDiv.innerHTML = text; // Use innerHTML to allow HTML tags like <mark>
    messageDiv.classList.remove('hidden');
    
    // Hide the message after 3 seconds
    setTimeout(() => {
        messageDiv.classList.add('hidden');
    }, 3000);
}

/**
 * Enables dark mode by adding the 'dark-mode' class to the body.
 */
function enableDarkMode() {
    document.body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'enabled');
}

/**
 * Disables dark mode by removing the 'dark-mode' class from the body.
 */
function disableDarkMode() {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'disabled');
}

/**
 * Loads leads from the server and renders them.
 */
async function loadAndRenderLeads() {
    try {
        const leads = await fetchLeads();
        allLeads = leads; // Cache the leads
        renderLeads(leads);
    } catch (error) {
        showMessage('error', 'Failed to load leads.');
        console.error('Error loading leads:', error);
    }
}

/**
 * Fetches all leads from the backend server.
 * @returns {Promise<Array>} - A promise that resolves to an array of leads.
 */
async function fetchLeads() {
    const response = await fetch('http://localhost:3001/leads');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return await response.json();
}

/**
 * Renders the list of leads in the UI.
 * @param {Array} leads - Array of lead objects to display.
 * @param {string} [query=""] - Optional search query to highlight matches.
 */
function renderLeads(leads, query = "") {
    // Clear the existing list
    ulEl.innerHTML = "";

    leads.forEach((lead) => {
        // Highlight matching text if a query is provided
        const name = query ? highlightText(lead.name, query) : lead.name;
        const url = query ? highlightText(lead.url, query) : lead.url;

        // Create list item
        const li = document.createElement('li');

        // Create link element
        const a = document.createElement('a');
        a.href = lead.url;
        a.target = '_blank';
        a.innerHTML = `<h2><b>${name}</b></h2>`;

        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('delete-btn');
        deleteBtn.textContent = 'Delete Entry';
        deleteBtn.dataset.id = lead._id;

        // Append link and button to list item
        li.appendChild(a);
        li.appendChild(deleteBtn);

        // Append list item to the list
        ulEl.appendChild(li);

        // Add event listener to the delete button
        deleteBtn.addEventListener('click', async function() {
            const id = deleteBtn.getAttribute('data-id');
            await deleteLead(id);
        });
    });
}

/**
 * Highlights the matching text in a string based on the query.
 * @param {string} text - The original text.
 * @param {string} query - The search query to highlight.
 * @returns {string} - The text with matching parts wrapped in <mark> tags.
 */
function highlightText(text, query) {
    const escapedQuery = escapeRegExp(query);
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param {string} string - The string to escape.
 * @returns {string} - The escaped string.
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Saves a new lead to the backend server.
 * @param {string} name - The company name.
 * @param {string} url - The career page URL.
 * @returns {Promise<void>}
 */
async function saveLead(name, url) {
    try {
        const response = await fetch('http://localhost:3001/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, url })
        });
        
        if (response.status === 201) { // Created
            const newLead = await response.json();
            showMessage('success', 'Lead added successfully!');
            allLeads.push(newLead); // Update the cached leads
            renderLeads(allLeads); // Re-render with the new lead
        } else if (response.status === 409) { // Conflict (duplicate)
            const errorData = await response.json();
            showMessage('error', errorData.error || 'Duplicate lead.');
        } else {
            const errorData = await response.json();
            showMessage('error', errorData.error || 'Failed to add lead.');
        }
    } catch (error) {
        showMessage('error', 'An error occurred while adding the lead.');
        console.error('Error saving lead:', error);
    }
}

/**
 * Deletes a lead by its ID from the backend server.
 * @param {string} id - The ID of the lead to delete.
 * @returns {Promise<void>}
 */
async function deleteLead(id) {
    try {
        const response = await fetch(`http://localhost:3001/leads/${id}`, { method: 'DELETE' });
        if (response.ok) {
            showMessage('success', 'Lead deleted successfully!');
            // Remove the deleted lead from the cached list
            allLeads = allLeads.filter(lead => lead._id !== id);
            renderLeads(allLeads);
        } else {
            const errorData = await response.json();
            showMessage('error', errorData.error || 'Failed to delete lead.');
        }
    } catch (error) {
        showMessage('error', 'An error occurred while deleting the lead.');
        console.error('Error deleting lead:', error);
    }
}

/**
 * Deletes all leads from the backend server after user confirmation.
 */
deleteBtn.addEventListener("dblclick", async function() {
    const confirmDelete = confirm("Are you sure you want to delete all leads? This action cannot be undone.");
    if (confirmDelete) {
        try {
            const response = await fetch('http://localhost:3001/leads', {
                method: 'DELETE'
            });
            if (response.ok) {
                showMessage('success', 'All leads deleted successfully!');
                allLeads = []; // Clear the cached leads
                renderLeads(allLeads);
            } else {
                const errorData = await response.json();
                showMessage('error', errorData.error || 'Failed to delete all leads.');
            }
        } catch (error) {
            showMessage('error', 'An error occurred while deleting all leads.');
            console.error('Error deleting all leads:', error);
        }
    }
});

/**
 * Adds the current active tab's URL as a new lead.
 */
linkBtn.addEventListener("click", function() {
    chrome.tabs.query({ active: true, currentWindow: true }, async function(tabs) {
        const linkName = inputEl1.value.trim();
        const linkURL = tabs[0].url.trim();

        if (linkName !== "" && linkURL !== "") {
            await saveLead(linkName, linkURL);
            inputEl1.value = "";
        } else {
            showMessage('error', "Please enter a name for the link!");
        }
    });
});

/**
 * Adds a manually entered lead based on input fields.
 */
inputBtn.addEventListener("click", async function() {
    const linkName = inputEl1.value.trim();
    const linkURL = inputEl2.value.trim();

    if (linkName && linkURL) {
        await saveLead(linkName, linkURL);
        inputEl1.value = "";
        inputEl2.value = "";
    } else {
        showMessage('error', "Please enter both a name and a URL!");
    }
});

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param {Function} func - The function to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
            clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => func.apply(context, args), delay);
    }
}

/**
 * Handles the search input by filtering and rendering leads.
 */
function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();

    if (query === "") {
        // If search query is empty, display all leads
        renderLeads(allLeads);
    } else {
        // Filter leads based on query matching name or url
        const filteredLeads = allLeads.filter(lead => 
            lead.name.toLowerCase().includes(query) || lead.url.toLowerCase().includes(query)
        );
        renderLeads(filteredLeads, query); // Pass the query for highlighting
    }
}

// Add event listener to the search input with debounce
searchInput.addEventListener("input", debounce(handleSearch, 300));

/**
 * Initializes the application by loading leads and setting up dark mode.
 */
document.addEventListener('DOMContentLoaded', async () => {
    await loadAndRenderLeads();

    // Load dark mode state from local storage
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    if (isDarkMode) {
        enableDarkMode();
        document.getElementById('dark-mode-toggle').checked = true;
    }

    // Event listener for dark mode toggle switch
    document.getElementById('dark-mode-toggle').addEventListener('change', function() {
        if (this.checked) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });
});
