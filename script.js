
const userInput = document.getElementById("userInput");
const messages = document.getElementById("messages");

function showSection(section) {
    document.querySelectorAll(".section").forEach(item => {
        item.classList.remove("active");
    });

    document.getElementById(section).classList.add("active");

    const titles = {
        chat: "AI Chat",
        agents: "AI Agents",
        tasks: "Task Manager",
        research: "Research Assistant",
        files: "File Assistant",
        automation: "Automation Center"
    };

    document.getElementById("pageTitle").textContent = titles[section];
}

function addMessage(text, type) {
    const message = document.createElement("div");
    message.className = "message " + type;
    message.textContent = text;

    messages.appendChild(message);
    messages.scrollTop = messages.scrollHeight;
}

function suggest(text) {
    showSection("chat");
    userInput.value = text;
    sendMessage();
}

function newChat() {
    messages.innerHTML = "";
    document.getElementById("welcome").style.display = "block";
    showSection("chat");
}

function detectAgent(text) {
    const input = text.toLowerCase();

    if (/research|search|find|information/.test(input)) {
        return "Research Agent";
    }

    if (/plan|schedule|organize|trip/.test(input)) {
        return "Planning Agent";
    }

    if (/task|project|steps|goal|website/.test(input)) {
        return "Task Agent";
    }

    return "Analysis Agent";
}

function generateResponse(text) {
    const input = text.toLowerCase();

    if (/hello|hi\b|hey/.test(input)) {
        return "Hello! Welcome to NEXA AI. How can I help you today?";
    }

    if (/who are you|what can you do/.test(input)) {
        return "I am NEXA AI, your agentic assistant. I can help with research, planning, task management, file previews and workflow demonstrations.";
    }

    if (/research|search|find|information/.test(input)) {
        return `🔎 RESEARCH AGENT

I will organize your research into these steps:

1. Understand the research topic.
2. Identify important questions.
3. Find relevant information from reliable sources.
4. Compare findings.
5. Prepare a summary.

Note: Live web searching is not connected in this prototype.`;
    }

    if (/plan|schedule|organize|trip/.test(input)) {
        return `📅 PLANNING AGENT

Here is your suggested plan:

1. Identify your main goal.
2. List important activities.
3. Set priorities.
4. Assign time slots.
5. Review your progress.

Your plan is ready for customization!`;
    }

    if (/task|project|steps|goal|website/.test(input)) {
        return `⚙️ TASK AGENT

I have prepared these project steps:

1. Define project requirements.
2. Create the HTML structure.
3. Design the CSS layout.
4. Implement JavaScript.
5. Test the application.
6. Publish the project.

You can manage these tasks in the Task Manager.`;
    }

    return `🤖 NEXA AI

I understood your request:

"${text}"

My agentic workflow:

1. Understand your objective.
2. Break it into smaller tasks.
3. Assign the appropriate AI agent.
4. Prepare a suggested solution.
5. Review the result.

This is a simulated response. Connect an AI API for genuine AI reasoning.`;
}

function sendMessage() {
    const text = userInput.value.trim();

    if (!text) return;

    document.getElementById("welcome").style.display = "none";

    addMessage(text, "user");
    userInput.value = "";

    const agent = detectAgent(text);

    addMessage("✦ " + agent + " is processing your request...", "bot");

    setTimeout(() => {
        const lastBotMessage = messages.lastElementChild;
        if (lastBotMessage) lastBotMessage.remove();

        addMessage(generateResponse(text), "bot");
    }, 700);
}

userInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// TASK MANAGER

function addTask() {
    const input = document.getElementById("taskInput");
    const text = input.value.trim();

    if (!text) return;

    const list = document.getElementById("taskList");

    const li = document.createElement("li");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    const label = document.createElement("span");
    label.textContent = text;

    checkbox.addEventListener("change", function() {
        li.classList.toggle("done", checkbox.checked);
    });

    const remove = document.createElement("button");
    remove.textContent = "Delete";

    remove.onclick = function() {
        li.remove();
    };

    li.append(checkbox, label, remove);
    list.appendChild(li);

    input.value = "";
}

// RESEARCH ASSISTANT

function researchTopic() {
    const topic = document.getElementById("researchInput").value.trim();

    if (!topic) {
        alert("Please enter a research topic.");
        return;
    }

    document.getElementById("researchResult").textContent =
        `Research topic: ${topic}

Research framework:

1. Background and introduction.
2. Important concepts.
3. Main research questions.
4. Reliable sources to investigate.
5. Comparison and analysis.
6. Summary and conclusion.

Note: This is a research outline, not live web research.`;
}

// FILE ASSISTANT

function readFile(input) {
    const file = input.files[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".txt")) {
        alert("This demo supports TXT files only.");
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert("Please select a file smaller than 2 MB.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
        document.getElementById("fileResult").textContent =
            "File: " + file.name + "\n\n" + event.target.result;
    };

    reader.readAsText(file);
}

function attachFile(input) {
    const file = input.files[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".txt")) {
        alert("This demo supports TXT files only.");
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert("Please select a file smaller than 2 MB.");
        return;
    }

    showSection("files");

    const reader = new FileReader();

    reader.onload = function(event) {
        document.getElementById("fileResult").textContent =
            "File: " + file.name + "\n\n" + event.target.result;
    };

    reader.readAsText(file);
}

// VOICE ASSISTANT

function startVoice() {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Voice recognition is not supported in this browser.");
        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.onresult = function(event) {
        userInput.value = event.results[0][0].transcript;
    };

    recognition.start();
}
