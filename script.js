// ---------- Config ----------
const MODEL = "claude-sonnet-5-5";   // change to any model your key can use
const API_URL = "https://api.anthropic.com/v1/messages";
const MAX_STEPS = 6;                 // safety limit on the agent loop

// ---------- DOM ----------
const messagesEl = document.getElementById("messages");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const keyInput = document.getElementById("api-key");
const saveKeyBtn = document.getElementById("save-key");

// ---------- State ----------
let apiKey = "";
try { apiKey = localStorage.getItem("anthropic_key") || ""; } catch (e) {}
if (apiKey) keyInput.value = apiKey;

const history = [];   // full conversation sent to the API
const notes = [];     // memory for the notepad tool

// ---------- Tools the agent can use ----------
const tools = [
  {
    name: "calculator",
    description: "Evaluate a math expression, e.g. '2450 * 0.18'. Supports + - * / % ( ) and decimals.",
    input_schema: {
      type: "object",
      properties: { expression: { type: "string", description: "The math expression" } },
      required: ["expression"]
    }
  },
  {
    name: "get_current_time",
    description: "Get the user's current local date and time.",
    input_schema: { type: "object", properties: {} }
  },
  {
    name: "save_note",
    description: "Save a short note to the notepad.",
    input_schema: {
      type: "object",
      properties: { text: { type: "string", description: "The note text" } },
      required: ["text"]
    }
  },
  {
    name: "read_notes",
    description: "Read all notes saved in the notepad.",
    input_schema: { type: "object", properties: {} }
  }
];

const toolFunctions = {
  calculator({ expression }) {
    if (!/^[0-9+\-*/%().\s]+$/.test(expression)) {
      throw new Error("Only numbers and + - * / % ( ) are allowed.");
    }
    return String(Function(`"use strict"; return (${expression})`)());
  },
  get_current_time() {
    return new Date().toString();
  },
  save_note({ text }) {
    notes.push(text);
    return `Saved. You now have ${notes.length} note(s).`;
  },
  read_notes() {
    return notes.length ? notes.map((n, i) => `${i + 1}. ${n}`).join("\n") : "No notes yet.";
  }
};

// ---------- UI helpers ----------
function addMessage(text, type) {
  const div = document.createElement("div");
  div.className = `msg ${type}`;
  div.textContent = text;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

function setBusy(busy) {
  sendBtn.disabled = busy;
  inputEl.disabled = busy;
  if (!busy) inputEl.focus();
}

// ---------- API call ----------
async function callModel() {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: "You are a helpful agent. Use tools when they help, and keep answers short.",
      tools,
      messages: history
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Request failed (${res.status})`);
  }
  return res.json();
}

// ---------- The agent loop ----------
// Ask the model -> if it wants tools, run them -> send results back -> repeat.
async function runAgent() {
  for (let step = 0; step < MAX_STEPS; step++) {
    const data = await callModel();
    history.push({ role: "assistant", content: data.content });

    for (const block of data.content) {
      if (block.type === "text" && block.text.trim()) addMessage(block.text, "bot");
    }

    if (data.stop_reason !== "tool_use") return;

    const results = [];
    for (const block of data.content) {
      if (block.type !== "tool_use") continue;

      let output, isError = false;
      try {
        output = toolFunctions[block.name](block.input);
      } catch (e) {
        output = `Error: ${e.message}`;
        isError = true;
      }

      addMessage(`${block.name}(${JSON.stringify(block.input)}) -> ${output}`, "tool");
      results.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: output,
        is_error: isError
      });
    }

    history.push({ role: "user", content: results });
  }
  addMessage("Stopped: reached the step limit.", "error");
}

// ---------- Events ----------
saveKeyBtn.addEventListener("click", () => {
  apiKey = keyInput.value.trim();
  try { localStorage.setItem("anthropic_key", apiKey); } catch (e) {}
  addMessage(apiKey ? "API key saved in this browser." : "API key cleared.", "bot");
});

formEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;

  if (!apiKey) {
    addMessage("Add your Anthropic API key above first.", "error");
    return;
  }

  addMessage(text, "user");
  history.push({ role: "user", content: text });
  inputEl.value = "";
  setBusy(true);

  try {
    await runAgent();
  } catch (e) {
    addMessage(e.message, "error");
    history.pop();
  } finally {
    setBusy(false);
  }
});
