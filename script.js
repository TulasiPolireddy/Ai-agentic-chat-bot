
const input = document.getElementById("userInput");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");

// Agent memory
let tasks = [];
let notes = [];

// Main agent function
function runAgent() {

    const userGoal = input.value.trim();

    if (!userGoal) return;

    welcome.style.display = "none";

    addMessage(userGoal, "user");

    input.value = "";

    // Step 1: Understand the goal
    const goal = userGoal.toLowerCase();

    // Step 2: Create a plan
    const plan = createPlan(goal);

    // Show agent activity
    const activity = document.createElement("div");
    activity.className = "message";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "✦";

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    const activityBox = document.createElement("div");
    activityBox.className = "agent-steps";
    activityBox.textContent =
        "1. Understanding your goal...\n" +
        "2. Selecting the right tool...\n" +
        "3. Executing the task...\n" +
        "4. Checking the result...";

    bubble.textContent = "Agent is working...";
    bubble.appendChild(activityBox);

    activity.appendChild(avatar);
    activity.appendChild(bubble);

    messages.appendChild(activity);

    // Step 3: Execute the selected tool
    setTimeout(() => {

        const result = executeTool(plan.tool, userGoal);

        // Step 4: Observe and respond
        bubble.textContent =
            "Goal: " + userGoal +
            "\n\nPlan: " + plan.description +
            "\n\nTool used: " + plan.tool +
            "\n\nResult: " + result +
            "\n\n✓ Task execution finished.";

        activity.scrollIntoView({
            behavior: "smooth",
            block: "end"
        });

    }, 700);
}


// Create a plan based on the user's goal
function createPlan(goal) {

    if (goal.includes("calculate") ||
        goal.includes("add") ||
        goal.includes("multiply") ||
        goal.includes("divide") ||
        goal.includes("subtract")) {

        return {
            tool: "Calculator",
            description: "Identify the mathematical expression and calculate the answer."
        };
    }

    if (goal.includes("date") ||
        goal.includes("today") ||
        goal.includes("time")) {

        return {
            tool: "Date Tool",
            description: "Retrieve the current date and time."
        };
    }

    if (goal.includes("create a task") ||
        goal.includes("add a task") ||
        goal.includes("remind me")) {

        return {
            tool: "Task Manager",
            description: "Create and save a new task."
        };
    }

    if (goal.includes("show my tasks") ||
        goal.includes("list my tasks")) {

        return {
            tool: "Task Manager",
            description: "Retrieve the saved task list."
        };
    }

    if (goal.includes("complete task") ||
        goal.includes("finish task")) {

        return {
            tool: "Task Manager",
            description: "Mark a task as completed."
        };
    }

    if (goal.includes("note") ||
        goal.includes("save this")) {

        return {
            tool: "Notes Tool",
            description: "Save the user's note."
        };
    }

    if (goal.includes("plan") ||
        goal.includes("steps") ||
        goal.includes("how to learn")) {

        return {
            tool: "Planning Tool",
            description: "Break the user's goal into smaller steps."
        };
    }

    return {
        tool: "General Assistant",
        description: "Understand the request and provide a response."
    };
}


// Execute the selected tool
function executeTool(tool, originalMessage) {

    const goal = originalMessage.toLowerCase();

    // Calculator tool
    if (tool === "Calculator") {

        const expression = originalMessage.match(
            /-?\d+(?:\.\d+)?(?:\s*[+\-*/]\s*-?\d+(?:\.\d+)?)+/
        );

        if (!expression) {
            return "Please provide a calculation, such as 25 + 30.";
        }

        const calculation = expression[0];

        // Allow only basic arithmetic characters
        if (!/^[\d+\-*/.\s]+$/.test(calculation)) {
            return "Invalid mathematical expression.";
        }

        try {
            const answer = Function(
                '"use strict"; return (' + calculation + ')'
            )();

            if (!Number.isFinite(answer)) {
                return "This calculation is not valid.";
            }

            return calculation + " = " + answer;

        } catch {
            return "I couldn't calculate that expression.";
        }
    }


    // Date and time tool
    if (tool === "Date Tool") {

        const now = new Date();

        return "Today's date: " +
            now.toLocaleDateString() +
            "\nCurrent time: " +
            now.toLocaleTimeString();
    }


    // Task manager tool
    if (tool === "Task Manager") {

        if (goal.includes("show my tasks") ||
            goal.includes("list my tasks")) {

            if (tasks.length === 0) {
                return "You don't have any saved tasks yet.";
            }

            return tasks.map((task, index) => {
                return (index + 1) + ". " +
                    (task.completed ? "✓ " : "○ ") +
                    task.name;
            }).join("\n");
        }

        if (goal.includes("complete task") ||
            goal.includes("finish task")) {

            const number = originalMessage.match(/\d+/);

            if (number) {
                const index = Number(number[0]) - 1;

                if (tasks[index]) {
                    tasks[index].completed = true;
                    return "Task completed: " + tasks[index].name;
                }
            }

            return "Please mention the task number. Example: Complete task 1.";
        }

        let taskName = originalMessage
            .replace(/create a task to/i, "")
            .replace(/create a task/i, "")
            .replace(/add a task to/i, "")
            .replace(/add a task/i, "")
            .replace(/remind me to/i, "")
            .trim();

        if (!taskName) {
            return "Please tell me what task you want to create.";
        }

        tasks.push({
            name: taskName,
            completed: false
        });

        return "Your task has been created successfully: " + taskName;
    }


    // Notes tool
    if (tool === "Notes Tool") {

        const note = originalMessage
            .replace(/save this note/i, "")
            .replace(/save this/i, "")
            .replace(/note:/i, "")
            .trim();

        if (!note) {
            return "Please provide the note you want to save.";
        }

        notes.push(note);

        return "Note saved successfully!\n\nSaved note: " + note;
    }


    // Planning tool
    if (tool === "Planning Tool") {

        return "Here is a simple action plan:\n\n" +
            "1. Define your main goal.\n" +
            "2. Learn the basic concepts.\n" +
            "3. Practice with small exercises.\n" +
            "4. Work on a practical project.\n" +
            "5. Review your progress and improve.\n\n" +
            "Your goal: " + originalMessage;
    }


    // General assistant
    return "I understand your request, but I don't have a suitable tool for it yet.\n\n" +
        "Try asking me to calculate something, create a task, save a note, " +
        "get today's date, or create a learning plan.";
}


// Display chat messages
function addMessage(text, sender) {

    const message = document.createElement("div");

    message.className = sender === "user"
        ? "message user-message"
        : "message";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = sender === "user" ? "You" : "✦";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    message.appendChild(avatar);
    message.appendChild(bubble);

    messages.appendChild(message);

    message.scrollIntoView({
        behavior: "smooth",
        block: "end"
    });
}


// Example prompts
function useExample(text) {
    input.value = text;
    runAgent();
}


// New chat
function newChat() {
    messages.innerHTML = "";
    welcome.style.display = "block";
    input.value = "";
}
