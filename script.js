
const input = document.getElementById("messageInput");
const chat = document.getElementById("chat");
const welcome = document.getElementById("welcome");
const steps = document.getElementById("steps");
const status = document.getElementById("status");

let tasks = JSON.parse(localStorage.getItem("miloTasks") || "[]");
let notes = JSON.parse(localStorage.getItem("miloNotes") || "[]");
let conversations = JSON.parse(localStorage.getItem("miloHistory") || "[]");
let history = [];

function saveData() {
    localStorage.setItem("miloTasks", JSON.stringify(tasks));
    localStorage.setItem("miloNotes", JSON.stringify(notes));
    localStorage.setItem("miloHistory", JSON.stringify(conversations));
}

function addMessage(text, sender) {
    const row = document.createElement("div");
    row.className = "chat-row " + sender;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = sender === "user" ? "YOU" : "✳";

    const content = document.createElement("div");
    content.className = "message-content";

    const name = document.createElement("div");
    name.className = "sender";
    name.textContent = sender === "user" ? "You" : "Milo AI";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    content.append(name, bubble);
    row.append(avatar, content);
    chat.appendChild(row);

    chat.scrollTop = chat.scrollHeight;

    return row;
}

// Show agent steps
function showSteps(items, state = "working") {
    steps.innerHTML = "";

    status.textContent = state === "working" ? "WORKING" : "COMPLETED";
    status.className = state;

    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "step";

        const icon = document.createElement("div");
        icon.className = "step-icon";
        icon.textContent = "✓";

        const content = document.createElement("div");

        const title = document.createElement("b");
        title.textContent = item.title;

        const description = document.createElement("small");
        description.textContent = item.description;

        content.append(title, description);
        div.append(icon, content);
        steps.appendChild(div);
    });
}

// Plan the user's goal
function createPlan(message) {
    const text = message.toLowerCase();

    if (text.includes("calculate") ||
        text.includes("multiply") ||
        text.includes("divide") ||
        text.includes("add") ||
        text.includes("subtract")) {
        return {
            tool: "Calculator",
            steps: [
                "Understand the mathematical problem",
                "Select the calculator tool",
                "Calculate and verify the result"
            ]
        };
    }

    if (text.includes("create a task") ||
        text.includes("add a task")) {
        return {
            tool: "Task Manager",
            steps: [
                "Identify the task details",
                "Select the task manager",
                "Save the task"
            ]
        };
    }

    if (text.includes("show my tasks") ||
        text.includes("list my tasks") ||
        text.includes("complete task")) {
        return {
            tool: "Task Manager",
            steps: [
                "Understand the task request",
                "Retrieve the task list",
                "Update or display the result"
            ]
        };
    }

    if (text.includes("save a note") ||
        text.includes("save this note") ||
        text.includes("remember this")) {
        return {
            tool: "Notes",
            steps: [
                "Identify the information",
                "Select the notes tool",
                "Save the information"
            ]
        };
    }

    if (text.includes("show my notes")) {
        return {
            tool: "Notes",
            steps: [
                "Understand the request",
                "Retrieve saved notes",
                "Display the result"
            ]
        };
    }

    if (text.includes("date") || text.includes("time")) {
        return {
            tool: "Date & Time",
            steps: [
                "Understand the date request",
                "Access the system clock",
                "Return current date and time"
            ]
        };
    }

    if (text.includes("plan") || text.includes("learn") ||
        text.includes("steps") || text.includes("schedule")) {
        return {
            tool: "Planning Assistant",
            steps: [
                "Understand the main goal",
                "Break the goal into smaller tasks",
                "Create an action plan"
            ]
        };
    }

    return {
        tool: "General Assistant",
        steps: [
            "Understand the user's request",
            "Choose an appropriate response",
            "Prepare the result"
        ]
    };
}

// Run selected tool
function useTool(tool, message) {
    const text = message.toLowerCase();

    if (tool === "Calculator") {
        const expression = message.match(
            /-?\d+(?:\.\d+)?(?:\s*[+*/-]\s*-?\d+(?:\.\d+)?)+/
        );

        if (!expression) {
            return "Please provide a calculation like 250 * 35.";
        }

        const value = expression[0];

        try {
            if (!/^[\d+\-*/.\s]+$/.test(value)) {
                throw new Error("Invalid expression");
            }

            const result = Function(
                '"use strict"; return (' + value + ')'
            )();

            if (!Number.isFinite(result)) {
                throw new Error("Invalid result");
            }

            return value + " = " + result;
        } catch {
            return "I couldn't calculate that expression.";
        }
    }

    if (tool === "Task Manager") {
        if (text.includes("show my tasks") ||
            text.includes("list my tasks")) {
            if (!tasks.length) return "You don't have any tasks yet.";

            return tasks.map((task, index) =>
                `${index + 1}. ${task.done ? "✓" : "○"} ${task.name}`
            ).join("\n");
        }

        if (text.includes("complete task")) {
            const match = message.match(/\d+/);

            if (!match || !tasks[Number(match[0]) - 1]) {
                return "Please provide a valid task number.";
            }

            const task = tasks[Number(match[0]) - 1];
            task.done = true;
            saveData();

            return `Successfully completed: ${task.name}`;
        }

        const taskName = message
            .replace(/create a task to/i, "")
            .replace(/create a task/i, "")
            .replace(/add a task to/i, "")
            .replace(/add a task/i, "")
            .trim();

        if (!taskName) return "Tell me what task you want to create.";

        tasks.push({ name: taskName, done: false });
        saveData();

        return `Your task has been saved: ${taskName}`;
    }

    if (tool === "Notes") {
        if (text.includes("show my notes")) {
            if (!notes.length) return "No notes saved yet.";

            return notes.map((note, index) =>
                `${index + 1}. ${note}`
            ).join("\n");
        }

        const note = message
            .replace(/save a note/i, "")
            .replace(/save this note/i, "")
            .replace(/remember this/i, "")
            .trim();

        if (!note) return "Please provide the note to save.";

        notes.push(note);
        saveData();

        return "Note saved successfully:\n" + note;
    }

    if (tool === "Date & Time") {
        return "Today's date: " +
            new Date().toLocaleDateString() +
            "\nCurrent time: " +
            new Date().toLocaleTimeString();
    }

    if (tool === "Planning Assistant") {
        return createLearningPlan(message);
    }

    return generalReply(message);
}

// Create a simple goal-based plan
function createLearningPlan(message) {
    const goal = message.toLowerCase();

    if (goal.includes("javascript")) {
        return "Here is your JavaScript learning plan:\n\n" +
            "Day 1: Variables and data types\n" +
            "Day 2: Operators and conditions\n" +
            "Day 3: Loops and functions\n" +
            "Day 4: Arrays and objects\n" +
            "Day 5: DOM manipulation\n" +
            "Day 6: Events and forms\n" +
            "Day 7: Build a mini project\n\n" +
            "Your goal: " + message;
    }

    return "Here is your action plan:\n\n" +
        "1. Define your goal clearly.\n" +
        "2. Divide it into smaller steps.\n" +
        "3. Complete the first step.\n" +
        "4. Review your progress.\n" +
        "5. Improve and finish your goal.\n\n" +
        "Goal: " + message;
}

// General assistant responses
function generalReply(message) {
    const text = message.toLowerCase();

    if (text.includes("hello") || text.includes("hi")) {
        return "Hello! I'm Milo, your personal AI agent. What would you like me to accomplish today?";
    }

    if (text.includes("artificial intelligence") || text.includes("what is ai")) {
        return "Artificial Intelligence is technology that enables computers to perform tasks such as learning, understanding language, recognizing patterns and solving problems.";
    }

    if (text.includes("html")) {
        return "HTML is the structure of a website. It defines headings, paragraphs, images, links and other page elements.";
    }

    if (text.includes("css")) {
        return "CSS is used to style websites. It controls colors, layouts, fonts, spacing and responsive design.";
    }

    if (text.includes("javascript")) {
        return "JavaScript makes websites interactive. It handles buttons, forms, user actions and dynamic content.";
    }

    return "I have understood your request. My current demo tools support calculations, tasks, notes, date and time, and basic planning. I don't yet have a connected language model for unrestricted conversations or live research.";
}

// Main agent workflow
async function sendMessage() {
    const message = input.value.trim();

    if (!message) return;

    welcome.style.display = "none";

    addMessage(message, "user");
    input.value = "";
    input.style.height = "auto";

    const plan = createPlan(message);

    const activitySteps = [
        { title: "Goal understood", description: "Identified what you want to achieve." },
        { title: "Plan created", description: "Selected " + plan.tool + " for this request." },
        { title: "Executing tool", description: "Working on your requested task." }
    ];

    showSteps(activitySteps, "working");

    const loading = addMessage("Milo is working on your request...", "bot");

    await new Promise(resolve => setTimeout(resolve, 900));

    const result = useTool(plan.tool, message);

    loading.remove();

    addMessage(result, "bot");

    showSteps([
        { title: "Goal understood", description: "Request successfully identified." },
        { title: "Plan created", description: "Selected " + plan.tool + "." },
        { title: "Tool executed", description: result.length > 75 ? "Task processed and result generated." : result },
        { title: "Execution completed", description: "Your result is ready." }
    ], "done");

    history.push({ message, result });
    saveData();
    updateHistory();
}

// Suggested prompts
function usePrompt(text) {
    input.value = text;
    sendMessage();
}

// New conversation
function newChat() {
    chat.innerHTML = "";
    welcome.style.display = "block";
    history = [];

    steps.innerHTML = `
        <div class="empty">
            <span>◌</span>
            <b>Waiting for a goal</b>
            <p>Your agent activity will appear here.</p>
        </div>`;

    status.textContent = "IDLE";
    status.className = "";
}

// Task view
function showTasks() {
    const result = tasks.length
        ? tasks.map((task, index) =>
            `${index + 1}. ${task.done ? "✓" : "○"} ${task.name}`
        ).join("\n")
        : "No tasks saved yet.";

    welcome.style.display = "none";
    chat.innerHTML = "";
    addMessage("Here are your saved tasks:\n\n" + result, "bot");
}

// Notes view
function showNotes() {
    const result = notes.length
        ? notes.map((note, index) => `${index + 1}. ${note}`).join("\n")
        : "No notes saved yet.";

    welcome.style.display = "none";
    chat.innerHTML = "";
    addMessage("Here are your saved notes:\n\n" + result, "bot");
}

// Recent conversation list
function updateHistory() {
    const historyElement = document.getElementById("history");

    historyElement.innerHTML = "";

    history.slice(-5).reverse().forEach(item => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.textContent = "◦ " + item.message.slice(0, 25);
        historyElement.appendChild(div);
    });
}

// Enter to send, Shift+Enter for newline
input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// Auto-expand input
input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 120) + "px";
});
