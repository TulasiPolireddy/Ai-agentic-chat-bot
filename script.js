// IMPORTANT: Replace this with your deployed Cloudflare Worker URL.
const API_URL = "PASTE_YOUR_CLOUDFLARE_WORKER_URL_HERE";

const $ = id => document.getElementById(id);

let tasks = JSON.parse(localStorage.getItem("milo_tasks") || "[]");
let notes = JSON.parse(localStorage.getItem("milo_notes") || "[]");
let history = JSON.parse(localStorage.getItem("milo_history") || "[]");

function saveData() {
  localStorage.setItem("milo_tasks", JSON.stringify(tasks));
  localStorage.setItem("milo_notes", JSON.stringify(notes));
  localStorage.setItem("milo_history", JSON.stringify(history));
  updateWorkspace();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function addMessage(role, text) {
  const welcome = document.querySelector(".welcome");
  if (welcome) welcome.remove();

  const row = document.createElement("div");
  row.className = `message ${role}`;

  if (role === "assistant") {
    row.innerHTML = `
      <div class="avatar">✦</div>
      <div class="bubble">${escapeHTML(text)}</div>
    `;
  } else {
    row.innerHTML = `
      <div class="bubble">${escapeHTML(text)}</div>
    `;
  }

  $("messages").appendChild(row);
  $("messages").scrollTop = $("messages").scrollHeight;
}

function addActivity(text) {
  const activity = $("activity");

  const empty = activity.querySelector(".activity-empty");
  if (empty) empty.remove();

  const item = document.createElement("div");
  item.className = "activity-item";
  item.textContent = text;

  activity.appendChild(item);

  while (activity.children.length > 12) {
    activity.firstElementChild.remove();
  }
}

function showTyping() {
  const row = document.createElement("div");
  row.className = "message assistant";
  row.id = "typing";
  row.innerHTML = `
    <div class="avatar">✦</div>
    <div class="bubble">Milo is thinking...</div>
  `;
  $("messages").appendChild(row);
  $("messages").scrollTop = $("messages").scrollHeight;
}

function removeTyping() {
  $("typing")?.remove();
}

function updateWorkspace() {
  $("taskCount").textContent = tasks.length;
  $("noteCount").textContent = notes.length;
  renderTasks();
  renderNotes();
}

function renderTasks() {
  const container = $("taskList");
  container.innerHTML = "";

  if (!tasks.length) {
    container.innerHTML = '<div class="empty-card">No tasks yet. Ask Milo to create one!</div>';
    return;
  }

  tasks.forEach((task, index) => {
    const card = document.createElement("div");
    card.className = "data-card";
    card.innerHTML = `
      <strong>${escapeHTML(task.title)}</strong>
      <small>${task.done ? "Completed" : "Pending"}</small>
    `;

    const button = document.createElement("button");
    button.textContent = task.done ? "Undo" : "Mark complete";
    button.className = "task-action";
    button.style.cssText =
      "margin-top:10px;padding:7px 10px;border:0;border-radius:7px;background:#eeeaff;color:#634bd1;cursor:pointer";

    button.addEventListener("click", () => {
      tasks[index].done = !tasks[index].done;
      saveData();
    });

    card.appendChild(button);
    container.appendChild(card);
  });
}

function renderNotes() {
  const container = $("noteList");
  container.innerHTML = "";

  if (!notes.length) {
    container.innerHTML = '<div class="empty-card">No saved notes yet. Ask Milo to remember something!</div>';
    return;
  }

  notes.forEach(note => {
    const card = document.createElement("div");
    card.className = "data-card";
    card.innerHTML = `
      <strong>${escapeHTML(note.title)}</strong>
      <p>${escapeHTML(note.content)}</p>
    `;
    container.appendChild(card);
  });
}

function showView(view) {
  document.querySelectorAll(".view").forEach(section => {
    section.classList.add("hidden");
  });

  const selected = {
    chat: "chatView",
    tasks: "tasksView",
    notes: "notesView"
  }[view];

  $(selected).classList.remove("hidden");

  document.querySelectorAll(".nav").forEach(button => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  $("pageTitle").textContent = {
    chat: "AI Assistant",
    tasks: "Task Manager",
    notes: "Saved Notes"
  }[view];
}

document.querySelectorAll(".nav").forEach(button => {
  button.addEventListener("click", () => {
    showView(button.dataset.view);
  });
});

document.querySelectorAll(".suggestion").forEach(button => {
  button.addEventListener("click", () => {
    $("userInput").value = button.textContent;
    $("chatForm").requestSubmit();
  });
});

function restoreChat() {
  if (!history.length) return;

  const welcome = document.querySelector(".welcome");
  if (welcome) welcome.remove();

  history.forEach(message => {
    if (message.role === "user" || message.role === "assistant") {
      addMessage(message.role, message.content);
    }
  });
}

async function sendMessage(message) {
  if (!message.trim()) return;

  if (!API_URL.startsWith("https://")) {
    addMessage("assistant",
      "Milo's AI connection is not configured yet. Please deploy the Cloudflare Worker and add its URL to script.js."
    );
    return;
  }

  addMessage("user", message);

  history.push({ role: "user", content: message });
  saveData();

  $("sendBtn").disabled = true;
  showTyping();
  $("activity").innerHTML = "";
  addActivity("Understanding your request...");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history.slice(-16),
        tasks,
        notes
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "The AI service returned an error.");
    }

    removeTyping();

    tasks = Array.isArray(data.tasks) ? data.tasks : tasks;
    notes = Array.isArray(data.notes) ? data.notes : notes;

    (data.activity || []).forEach(addActivity);

    const reply = data.reply || "I completed the request, but didn't receive a text response.";

    addMessage("assistant", reply);
    history.push({ role: "assistant", content: reply });

    saveData();

  } catch (error) {
    removeTyping();

    addMessage("assistant",
      "I couldn't connect to my AI service. " + error.message +
      "\n\nPlease check your Worker URL, API key and deployment settings."
    );

    addActivity("The request could not be completed.");
  } finally {
    $("sendBtn").disabled = false;
    $("userInput").focus();
  }
}

$("chatForm").addEventListener("submit", event => {
  event.preventDefault();

  const message = $("userInput").value.trim();
  if (!message) return;

  $("userInput").value = "";
  sendMessage(message);
});

$("userInput").addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    $("chatForm").requestSubmit();
  }
});

updateWorkspace();
restoreChat();
