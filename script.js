
/* =========================================
   NOVA PERSONAL AI AGENT
   Dynamic rule-based agent - No API
========================================= */

const $ = id => document.getElementById(id);

let memories = JSON.parse(localStorage.getItem("nova_memories") || "[]");
let notes = JSON.parse(localStorage.getItem("nova_notes") || "[]");
let tasks = JSON.parse(localStorage.getItem("nova_tasks") || "[]");

let lastActivity = [];

/* STORAGE */

function saveStorage() {
    localStorage.setItem("nova_memories", JSON.stringify(memories));
    localStorage.setItem("nova_notes", JSON.stringify(notes));
    localStorage.setItem("nova_tasks", JSON.stringify(tasks));
}

/* CHAT INTERFACE */

function addUserMessage(text) {
    const div = document.createElement("div");
    div.className = "message user-message";
    div.textContent = text;
    $("messages").appendChild(div);
    scrollChat();
}

function addBotMessage(text) {
    const div = document.createElement("div");
    div.className = "message bot-message";

    const label = document.createElement("div");
    label.className = "bot-label";
    label.textContent = "✦ NOVA";

    const content = document.createElement("div");
    content.className = "bot-content";
    content.textContent = text;

    div.append(label, content);
    $("messages").appendChild(div);
    scrollChat();
}

function addRichMessage(title, lines, type = "plan") {
    const div = document.createElement("div");
    div.className = "message bot-message";

    const label = document.createElement("div");
    label.className = "bot-label";
    label.textContent = "✦ NOVA · " + title;

    div.appendChild(label);

    lines.forEach((line, index) => {
        const item = document.createElement("div");
        item.className = type === "task" ? "task-item" : "plan-item";

        if (type === "task") {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";

            const span = document.createElement("span");
            span.textContent = line;

            checkbox.addEventListener("change", () => {
                item.classList.toggle("done", checkbox.checked);
            });

            item.append(checkbox, span);
        } else {
            item.textContent = line;
        }

        div.appendChild(item);
    });

    $("messages").appendChild(div);
    scrollChat();
}

function scrollChat() {
    $("chatArea").scrollTop = $("chatArea").scrollHeight;
}

function activity(lines) {
    lastActivity = lines;

    $("activityLog").textContent = lines.join("  →  ");
    $("activityStatus").textContent = "Completed";
}

function newChat() {
    $("messages").innerHTML = "";
    $("welcome").style.display = "block";
    $("activityLog").textContent = "Waiting for your request...";
    $("activityStatus").textContent = "Ready";
}

/* REQUEST UNDERSTANDING */

function detectIntent(text) {
    const t = text.toLowerCase();

    if (/\b(remember|memorize|save.*important|don't forget|do not forget)\b/.test(t))
        return "memory";

    if (/\b(show|find|recall|retrieve|what did i tell you|what do you remember)\b/.test(t)
        && /\b(memory|memories|remember|notes|note)\b/.test(t))
        return "recall";

    if (/\b(save|write|store|create)\b/.test(t) && /\b(note|notes)\b/.test(t))
        return "note";

    if (/\b(show|view|read|find|open)\b/.test(t) && /\b(notes|saved notes)\b/.test(t))
        return "showNotes";

    if (/\b(calculate|compute|solve|what is|how much is)\b/.test(t)
        && /[\d]/.test(t))
        return "calculator";

    if (/\b(weekly plan|plan my week|week schedule|organize my week|organise my week)\b/.test(t))
        return "weekly";

    if (/\b(plan|schedule|organize my day|organise my day|routine|timetable)\b/.test(t))
        return "planner";

    if (/\b(checklist|to-do list|todo list|things to do|list of things)\b/.test(t))
        return "checklist";

    if (/\b(show|view|list|track)\b/.test(t) && /\b(tasks|my task)\b/.test(t))
        return "showTasks";

    if (/\b(add|create|remind me to)\b/.test(t) && /\b(task|tasks|to do)\b/.test(t))
        return "addTask";

    if (/\b(help|what can you do|features)\b/.test(t))
        return "help";

    return "general";
}

/* AGENT PLANNING */

function makeAgentPlan(intent, text) {
    const plans = {
        memory: [
            "Understanding the information to remember",
            "Extracting the important detail",
            "Saving it to persistent browser memory"
        ],
        recall: [
            "Accessing saved information",
            "Searching stored memories",
            "Preparing the matching results"
        ],
        note: [
            "Understanding the note",
            "Preparing the note content",
            "Saving it to the notes manager"
        ],
        showNotes: [
            "Opening the notes manager",
            "Retrieving saved notes",
            "Displaying the results"
        ],
        calculator: [
            "Understanding the mathematical expression",
            "Processing the numbers and operators",
            "Calculating the result"
        ],
        planner: [
            "Understanding your available time",
            "Extracting your activities and priorities",
            "Building a personalised schedule"
        ],
        weekly: [
            "Identifying your weekly goals",
            "Distributing activities across the week",
            "Generating a weekly schedule"
        ],
        checklist: [
            "Identifying the purpose of your checklist",
            "Selecting relevant task categories",
            "Generating a customised checklist"
        ],
        addTask: [
            "Identifying the new task",
            "Adding it to your task manager",
            "Saving your task"
        ],
        showTasks: [
            "Accessing the task manager",
            "Retrieving saved tasks",
            "Displaying task progress"
        ],
        help: [
            "Understanding your question",
            "Checking available agent capabilities",
            "Preparing guidance"
        ],
        general: [
            "Analysing your message",
            "Identifying the type of assistance needed",
            "Preparing a relevant response"
        ]
    };

    return plans[intent] || plans.general;
}

/* TEXT EXTRACTION */

function cleanText(text) {
    return text
        .replace(/[.!?]+$/g, "")
        .trim();
}

function extractAfterKeywords(text, keywords) {
    const lower = text.toLowerCase();

    for (const keyword of keywords) {
        const index = lower.indexOf(keyword);

        if (index !== -1) {
            return cleanText(text.substring(index + keyword.length)
                .replace(/^(is|that|about|:)\s*/i, ""));
        }
    }

    return "";
}

/* MEMORY TOOL */

function rememberInformation(text) {
    const content = extractAfterKeywords(text, [
        "remember that",
        "remember",
        "memorize that",
        "memorize",
        "don't forget that",
        "do not forget that",
        "save important"
    ]);

    if (!content) {
        return "What information would you like me to remember?";
    }

    memories.push({
        text: content,
        date: new Date().toLocaleString()
    });

    saveStorage();

    return "I've saved this information in your memory:\n\n" +
        content +
        "\n\nYou can ask me to recall it whenever you need it.";
}

function recallMemory(text) {
    const query = text.toLowerCase()
        .replace(/show|find|recall|retrieve|what do you remember|what did i tell you/gi, "")
        .replace(/my|saved|the|about|memory|memories/gi, "")
        .trim();

    let results = memories;

    if (query) {
        const matches = memories.filter(item =>
            item.text.toLowerCase().includes(query)
        );

        if (matches.length) results = matches;
    }

    if (!results.length) {
        return "Your memory is currently empty. Tell me something important and I'll save it.";
    }

    return "Here is the information stored in your memory:\n\n" +
        results.map((item, i) =>
            `${i + 1}. ${item.text}\nSaved: ${item.date}`
        ).join("\n\n");
}

/* NOTES TOOL */

function saveNote(text) {
    const content = extractAfterKeywords(text, [
        "save a note",
        "save note",
        "write a note",
        "create a note",
        "save this note",
        "note:"
    ]);

    if (!content) {
        return "Please provide the content you want to save as a note.";
    }

    notes.push({
        text: content,
        date: new Date().toLocaleString()
    });

    saveStorage();

    return "Your note has been saved successfully:\n\n" + content;
}

function showNotes() {
    if (!notes.length) {
        addBotMessage("You haven't saved any notes yet.");
        return;
    }

    addRichMessage(
        "SAVED NOTES",
        notes.map((note, i) =>
            `${i + 1}. ${note.text} — ${note.date}`
        )
    );
}

/* CALCULATOR TOOL */

function calculateExpression(expression) {
    let exp = expression.toLowerCase()
        .replace(/,/g, "")
        .replace(/(\d+(?:\.\d+)?)\s*% of\s*(\d+(?:\.\d+)?)/g,
            "($1/100*$2)")
        .replace(/(\d+(?:\.\d+)?)%/g, "($1/100)")
        .replace(/\bplus\b/g, "+")
        .replace(/\bminus\b/g, "-")
        .replace(/\btimes\b/g, "*")
        .replace(/\bmultiplied by\b/g, "*")
        .replace(/\bdivided by\b/g, "/")
        .replace(/\bmodulo\b/g, "%");

    exp = exp.replace(/^(calculate|compute|solve|what is|how much is)\s*/i, "");

    if (!/^[\d+\-*/().%\s]+$/.test(exp)) {
        return null;
    }

    const tokens = exp.match(/\d+(?:\.\d+)?|[+\-*/()%]/g);

    if (!tokens || tokens.join("") !== exp.replace(/\s/g, "")) {
        return null;
    }

    let position = 0;

    function expression() {
        let value = term();

        while (tokens[position] === "+" || tokens[position] === "-") {
            const operator = tokens[position++];
            const right = term();
            value = operator === "+" ? value + right : value - right;
        }

        return value;
    }

    function term() {
        let value = factor();

        while (["*", "/", "%"].includes(tokens[position])) {
            const operator = tokens[position++];
            const right = factor();

            if (operator === "*") value *= right;
            if (operator === "/") value /= right;
            if (operator === "%") value %= right;
        }

        return value;
    }

    function factor() {
        const token = tokens[position++];

        if (token === "-") return -factor();
        if (token === "+") return factor();

        if (token === "(") {
            const value = expression();

            if (tokens[position++] !== ")") {
                throw new Error("Missing closing bracket");
            }

            return value;
        }

        const value = Number(token);

        if (!Number.isFinite(value)) {
            throw new Error("Invalid number");
        }

        return value;
    }

    try {
        const result = expression();

        if (position !== tokens.length || !Number.isFinite(result)) {
            return null;
        }

        return Number(result.toFixed(8));
    } catch {
        return null;
    }
}

/* DYNAMIC CHECKLIST GENERATOR */

function generateChecklist(text) {
    const t = text.toLowerCase();

    let category = "General project";
    let items = [];

    const categories = [
        {
            words: ["birthday", "party", "celebration"],
            name: "Birthday / Party",
            items: [
                "Decide the date, time and venue",
                "Prepare the guest list",
                "Choose a theme and decorations",
                "Plan food, drinks and cake",
                "Arrange invitations",
                "Prepare music and entertainment",
                "Check the arrangements before the event"
            ]
        },
        {
            words: ["travel", "trip", "vacation", "holiday"],
            name: "Travel",
            items: [
                "Choose the destination",
                "Confirm travel dates and budget",
                "Book transportation",
                "Arrange accommodation",
                "Prepare identification and travel documents",
                "Create a packing list",
                "Plan places to visit",
                "Check bookings before departure"
            ]
        },
        {
            words: ["website", "web development", "portfolio", "coding"],
            name: "Website Development",
            items: [
                "Define the website purpose",
                "Identify the target audience",
                "Plan website pages and sections",
                "Create the HTML structure",
                "Develop responsive CSS styling",
                "Implement JavaScript functionality",
                "Test navigation and interactions",
                "Check mobile responsiveness",
                "Publish the website"
            ]
        },
        {
            words: ["exam", "study", "revision", "college"],
            name: "Study / Exam",
            items: [
                "Identify subjects and syllabus",
                "Divide topics into smaller sections",
                "Prioritise difficult chapters",
                "Prepare study sessions",
                "Practise important questions",
                "Revise completed topics",
                "Take a mock test",
                "Review mistakes"
            ]
        },
        {
            words: ["interview", "job", "career", "resume"],
            name: "Job Preparation",
            items: [
                "Identify the target role",
                "Update your resume",
                "Research the organisation",
                "Review relevant technical concepts",
                "Practise interview questions",
                "Prepare a self-introduction",
                "Arrange required documents",
                "Review interview details"
            ]
        },
        {
            words: ["shopping", "grocery", "buy"],
            name: "Shopping",
            items: [
                "Identify what you need",
                "Prepare a shopping list",
                "Set a budget",
                "Compare available options",
                "Prioritise essential items",
                "Check quantities and prices",
                "Review your purchases"
            ]
        },
        {
            words: ["project", "application", "software", "system"],
            name: "Project Development",
            items: [
                "Define the project objective",
                "Collect requirements",
                "Plan the main features",
                "Choose the technologies",
                "Design the interface",
                "Develop the core functionality",
                "Test the application",
                "Fix errors and improve performance",
                "Prepare the final demonstration"
            ]
        },
        {
            words: ["fitness", "workout", "exercise", "gym"],
            name: "Fitness",
            items: [
                "Define your fitness goal",
                "Choose suitable activities",
                "Plan exercise sessions",
                "Schedule rest and recovery",
                "Prepare meals and hydration",
                "Track your progress",
                "Review your routine"
            ]
        }
    ];

    const match = categories.find(group =>
        group.words.some(word => t.includes(word))
    );

    if (match) {
        category = match.name;
        items = [...match.items];
    } else {
        const subject = extractAfterKeywords(text, [
            "checklist for",
            "checklist about",
            "checklist to",
            "checklist",
            "list for"
        ]);

        const topic = subject || "your activity";

        items = [
            `Define the main objective of ${topic}`,
            "Identify the requirements",
            "List the necessary resources",
            "Divide the work into smaller steps",
            "Prioritise important activities",
            "Set realistic deadlines",
            "Complete the planned activities",
            "Review the final result"
        ];
    }

    // Add personalised tasks using details found in the request.

    if (/\bbudget|cost|money|expenses\b/.test(t)) {
        items.push("Review the budget and expected expenses");
    }

    if (/\bdeadline|due date|urgent\b/.test(t)) {
        items.push("Set deadlines and prioritise urgent work");
    }

    if (/\bteam|friends|family|group\b/.test(t)) {
        items.push("Coordinate responsibilities with everyone involved");
    }

    if (/\bonline|internet|website\b/.test(t) &&
        !items.some(x => x.toLowerCase().includes("website"))) {
        items.push("Check online resources and requirements");
    }

    return { category, items };
}

/* TASK MANAGER */

function addTask(text) {
    const content = extractAfterKeywords(text, [
        "add a task",
        "add task",
        "create a task",
        "remind me to"
    ]);

    if (!content) {
        return "Tell me the task you want to add.";
    }

    tasks.push({
        text: content,
        completed: false
    });

    saveStorage();

    return "Task added successfully:\n\n" + content;
}

function showTasks() {
    if (!tasks.length) {
        addBotMessage("Your task manager is empty. Ask me to add a task or create a checklist.");
        return;
    }

    const div = document.createElement("div");
    div.className = "message bot-message";

    const heading = document.createElement("div");
    heading.className = "bot-label";
    heading.textContent = "✦ YOUR TASK MANAGER";

    div.appendChild(heading);

    tasks.forEach((task, index) => {
        const row = document.createElement("div");
        row.className = "task-item" + (task.completed ? " done" : "");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;

        const label = document.createElement("span");
        label.textContent = task.text;

        checkbox.addEventListener("change", () => {
            task.completed = checkbox.checked;
            saveStorage();
            row.classList.toggle("done", task.completed);
        });

        row.append(checkbox, label);
        div.appendChild(row);
    });

    $("messages").appendChild(div);
    scrollChat();
}

/* DYNAMIC DAY PLANNER */

function extractActivities(text) {
    let cleaned = text.toLowerCase();

    cleaned = cleaned.replace(
        /\b(plan|schedule|organize|organise|create|make|prepare)\b/g, ""
    );

    const patterns = [
        /(?:i have|i need to|i must|i want to|including|activities are|my tasks are)\s+(.+)/i,
        /(?:from my day|today i need|today i have)\s+(.+)/i
    ];

    let extracted = "";

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            extracted = match[1];
            break;
        }
    }

    if (!extracted) {
        extracted = text
            .replace(/\b(my day|today|tomorrow|daily|routine|schedule|day)\b/gi, "")
            .trim();
    }

    extracted = extracted
        .replace(/\b(for|the|a|an|please|can you|could you)\b/gi, " ")
        .replace(/\b(from \d{1,2}(?::\d{2})?\s*(?:am|pm)?\s*to \d{1,2}(?::\d{2})?\s*(?:am|pm)?)\b/gi, "")
        .replace(/\b\d+\s*(?:hours?|hrs?)\b/gi, "")
        .replace(/\b(today|tomorrow|daily|my day)\b/gi, "");

    return extracted.split(/\s*(?:,| and | then )\s*/i)
        .map(x => x.trim())
        .filter(x => x.length > 2)
        .map(x => x.replace(/^(to|and)\s+/i, ""))
        .filter(x => !/^(need|have|want|must|should)$/i.test(x))
        .slice(0, 10);
}

function getAvailableHours(text) {
    const match = text.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);

    if (match) return Math.min(16, Math.max(1, Number(match[1])));

    return 8;
}

function createDayPlan(text) {
    let activities = extractActivities(text);

    const keywords = text.toLowerCase();

    if (!activities.length) {
        activities = ["Important personal work", "Learning or study", "Exercise", "Rest and personal time"];
    }

    const hours = getAvailableHours(text);

    const priority = activities.map((activity, index) => {
        const a = activity.toLowerCase();

        let weight = 1;

        if (/\b(exam|deadline|urgent|important|submission|interview)\b/.test(a))
            weight += 3;

        if (/\b(study|work|project|meeting)\b/.test(a))
            weight += 2;

        if (/\b(rest|break|relax|sleep)\b/.test(a))
            weight -= 0.5;

        if (/\b(urgent|important|exam|deadline)\b/.test(keywords) &&
            index === 0) weight += 1;

        return { activity, weight: Math.max(0.5, weight) };
    });

    priority.sort((a, b) => b.weight - a.weight);

    const totalWeight = priority.reduce((sum, item) => sum + item.weight, 0);

    let currentHour = 8;
    const schedule = [];

    priority.forEach(item => {
        const duration = Math.max(
            0.5,
            Math.round((hours * item.weight / totalWeight) * 2) / 2
        );

        const end = currentHour + duration;

        const format = h => {
            const hour = Math.floor(h);
            const mins = h % 1 ? "30" : "00";
            const display = hour % 12 || 12;
            return display + ":" + mins + (hour >= 12 ? " PM" : " AM");
        };

        schedule.push(
            `${format(currentHour)} – ${format(end)} | ${item.activity} (${duration} hrs)`
        );

        currentHour = end + 0.25;
    });

    return {
        activities: priority,
        schedule,
        hours
    };
}

/* WEEKLY PLANNER */

function createWeeklyPlan(text) {
    const days = [
        "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday", "Sunday"
    ];

    let activities = extractActivities(text);

    if (!activities.length) {
        activities = [
            "Main priority work",
            "Learning and improvement",
            "Personal responsibilities",
            "Exercise and wellness"
        ];
    }

    return days.map((day, index) => {
        const activity = activities[index % activities.length];
        return `${day}: ${activity} — review progress and adjust priorities`;
    });
}

/* GENERAL REQUEST HANDLER */

function generalResponse(text) {
    const t = text.toLowerCase();

    if (/\b(hello|hi|hey|good morning|good evening)\b/.test(t)) {
        return "Hello! I'm Nova, your personal task assistant. Tell me what you want to accomplish today. I can help you plan, organise, calculate, save notes and manage tasks.";
    }

    if (/\b(thank you|thanks)\b/.test(t)) {
        return "You're welcome! Let me know what else you'd like to organise or work on.";
    }

    if (/\b(who are you|what are you)\b/.test(t)) {
        return "I'm Nova, a browser-based personal agent prototype. I use JavaScript to understand requests, create action plans, execute tools and store your information.";
    }

    if (/\b(study|exam|learning)\b/.test(t)) {
        return "I can help you organise your learning. Tell me your subjects, available study hours and exam date, and I'll create a study plan based on those details.";
    }

    if (/\b(work|office|job)\b/.test(t)) {
        return "I can help organise your workday. Tell me your working hours, tasks and priorities so I can prepare a practical schedule.";
    }

    if (/\b(budget|expenses|spending)\b/.test(t)) {
        return "I can organise your expenses. Send me your expense amounts and categories, and I'll calculate the total and help you organise them.";
    }

    if (/\b(help|support|suggest)\b/.test(t)) {
        return "Tell me what you want to achieve. I can help you break it into smaller steps, organise your time and track your progress.";
    }

    return "I understand that you're asking about: " + text +
        "\n\nI can help turn this into an actionable task. Try giving me your goal, relevant details and any deadlines. I can create a plan, checklist, note or task list based on that information.";
}

/* TOOL EXECUTION */

function executeAgent(intent, text) {

    switch (intent) {

        case "memory":
            return rememberInformation(text);

        case "recall":
            return recallMemory(text);

        case "note":
            return saveNote(text);

        case "showNotes":
            showNotes();
            return "Your saved notes are displayed above.";

        case "calculator": {
            const result = calculateExpression(text);

            return result === null
                ? "I couldn't interpret that expression. Try an expression like 125 + 75, 18% of 2450 or (50 + 25) * 2."
                : "Calculation completed successfully.\n\nYour answer is: " + result;
        }

        case "planner": {
            const plan = createDayPlan(text);

            addRichMessage("YOUR PERSONAL DAY PLAN", plan.schedule);

            return `I've prepared a schedule based on ${plan.activities.length} activities and approximately ${plan.hours} available hours. You can adjust the activities or timings in your next message.`;
        }

        case "weekly": {
            const plan = createWeeklyPlan(text);

            addRichMessage("YOUR WEEKLY PLAN", plan);

            return "Your weekly schedule has been generated using the activities identified in your request.";
        }

        case "checklist": {
            const result = generateChecklist(text);

            addRichMessage(
                result.category.toUpperCase() + " CHECKLIST",
                result.items,
                "task"
            );

            return `I've generated ${result.items.length} checklist items for your ${result.category.toLowerCase()} activity. Tick the boxes as you complete them.`;
        }

        case "addTask":
            return addTask(text);

        case "showTasks":
            showTasks();
            return "Your saved tasks are displayed above.";

        case "help":
            return "Here's what I can do:\n\n• Create personalised daily and weekly plans\n• Save and recall important memories\n• Create and retrieve notes\n• Generate purpose-based checklists\n• Calculate mathematical expressions\n• Add and track tasks\n\nTell me your goal in your own words.";

        default:
            return generalResponse(text);
    }
}

/* MAIN AGENT WORKFLOW */

async function sendMessage() {
    const input = $("userInput");
    const text = input.value.trim();

    if (!text) return;

    $("welcome").style.display = "none";
    addUserMessage(text);

    input.value = "";
    $("sendButton").disabled = true;
    $("activityStatus").textContent = "Working...";

    const intent = detectIntent(text);
    const plan = makeAgentPlan(intent, text);

    activity([
        "Request received",
        "Intent identified: " + intent,
        "Planning actions"
    ]);

    const thinking = document.createElement("div");
    thinking.className = "message bot-message";
    thinking.textContent = "✦ Nova is analysing your request...";
    $("messages").appendChild(thinking);

    await new Promise(resolve => setTimeout(resolve, 450));

    activity([
        "Understanding goal",
        ...plan
    ]);

    await new Promise(resolve => setTimeout(resolve, 450));

    const result = executeAgent(intent, text);

    thinking.remove();

    addBotMessage(result);

    activity([
        "Goal identified",
        "Action plan created",
        "Tool selected",
        "Tool executed",
        "Result delivered"
    ]);

    $("sendButton").disabled = false;
    input.focus();
}

/* SIDEBAR SHORTCUTS */

function quickAsk(text) {
    $("userInput").value = text;
    sendMessage();
}

function showMemory() {
    $("welcome").style.display = "none";

    addBotMessage(
        memories.length
            ? "SAVED MEMORY\n\n" + memories.map((m, i) =>
                `${i + 1}. ${m.text} (${m.date})`
            ).join("\n\n")
            : "Your memory is empty. Ask me to remember something important."
    );
}

$("userInput").addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});
