
let memory = JSON.parse(localStorage.getItem("novaMemory") || "[]");
let tasks = JSON.parse(localStorage.getItem("novaTasks") || "[]");

function saveData() {
    localStorage.setItem("novaMemory", JSON.stringify(memory));
    localStorage.setItem("novaTasks", JSON.stringify(tasks));
}

function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = "message " + type;
    div.textContent = text;
    document.getElementById("messages").appendChild(div);
    div.scrollIntoView({ behavior: "smooth" });
    return div;
}

function quickAsk(text) {
    document.getElementById("userInput").value = text;
    sendMessage();
}

function newChat() {
    document.getElementById("messages").innerHTML = "";
    document.getElementById("welcome").style.display = "block";
}

function showTasks() {
    document.getElementById("welcome").style.display = "none";

    const result = addMessage("MY SAVED TASKS\n" +
        (tasks.length ? tasks.map((t, i) => `${i + 1}. ${t}`).join("\n") :
        "No tasks saved yet."), "agent");
}

function detectIntent(text) {
    const t = text.toLowerCase();

    if (/remember|save a note|note that/.test(t))
        return "memory";

    if (/checklist|to-do|todo|task list/.test(t))
        return "tasks";

    if (/plan my day|make a plan|schedule/.test(t))
        return "planner";

    if (/calculate|what is|compute/.test(t))
        return "calculator";

    if (/show.*(notes|memory)|what did i ask you to remember/.test(t))
        return "recall";

    return "general";
}

function createPlan(intent) {
    const plans = {
        memory: ["Identify the information", "Save it in memory", "Confirm the saved information"],
        tasks: ["Understand the goal", "Create a task list", "Save the tasks"],
        planner: ["Understand your activities", "Organise the activities", "Generate a daily plan"],
        calculator: ["Read the numbers", "Execute the calculation", "Display the result"],
        recall: ["Access saved memory", "Retrieve stored information", "Display the information"],
        general: ["Understand your request", "Analyse the goal", "Suggest the next steps"]
    };

    return plans[intent];
}

function calculate(text) {
    const match = text.match(/(-?\d+(?:\.\d+)?)\s*(\+|-|\*|\/|% of)\s*(-?\d+(?:\.\d+)?)/i);

    if (!match) return null;

    const a = Number(match[1]);
    const op = match[2];
    const b = Number(match[3]);

    switch (op) {
        case "+": return a + b;
        case "-": return a - b;
        case "*": return a * b;
        case "/": return b === 0 ? "Cannot divide by zero" : a / b;
        case "% of": return (a / 100) * b;
    }
}

function executeTool(intent, text) {
    let result = "";

    if (intent === "memory") {
        const note = text.replace(/remember|save a note|note that/ig, "").trim();
        if (!note) return "Please tell me what you want me to remember.";
        memory.push(note);
        saveData();
        result = "Memory tool executed successfully.\nSaved: " + note;
    }

    else if (intent === "tasks") {
        const checklist = [
            "Understand the project requirements",
            "Prepare the project structure",
            "Develop the HTML structure",
            "Apply CSS styling",
            "Add JavaScript functionality",
            "Test the completed project"
        ];

        tasks.push(...checklist);
        saveData();
        result = "Task manager executed successfully:\n" +
            checklist.map((x, i) => `${i + 1}. ${x}`).join("\n");
    }

    else if (intent === "planner") {
        result = "Planner tool executed successfully:\n" +
            "1. Start with your most important activity.\n" +
            "2. Complete your study or work session.\n" +
            "3. Take a short break.\n" +
            "4. Continue with the next activity.\n" +
            "5. Review your progress.";
    }

    else if (intent === "calculator") {
        const answer = calculate(text);
        result = answer === null
            ? "Please enter a calculation such as 25 + 75 or 18% of 2450."
            : "Calculator tool executed successfully.\nResult: " + answer;
    }

    else if (intent === "recall") {
        result = "Saved memories:\n" +
            (memory.length ? memory.join("\n") : "No memories saved yet.");
    }

    else {
        result = "I can help with planning, calculations, saving information and creating checklists. Try one of those tasks!";
    }

    return result;
}

async function sendMessage() {
    const input = document.getElementById("userInput");
    const text = input.value.trim();

    if (!text) return;

    document.getElementById("welcome").style.display = "none";
    addMessage(text, "user");
    input.value = "";

    const intent = detectIntent(text);
    const plan = createPlan(intent);

    const agent = addMessage("AGENT THINKING...\n\n" +
        plan.map((step, i) => `${i + 1}. ${step}`).join("\n"), "agent");

    await new Promise(resolve => setTimeout(resolve, 800));

    const result = executeTool(intent, text);

    agent.textContent = "✦ NOVA AGENT\n\n" +
        "Goal identified: " + intent.toUpperCase() +
        "\n\nACTION PLAN:\n" +
        plan.map((step, i) => "✓ " + step).join("\n") +
        "\n\nTOOL EXECUTION:\n" + result;
}
