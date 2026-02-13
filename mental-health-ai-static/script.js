const state = {
    currentTab: 'home', // Start on Home
    moodScore: 50, // 0-100 (Neutral start)
    stressLevel: 20, // 0-100 (Low start)
    interactionCount: 0,
    chatHistory: [],
    history: [] // { mood: number, stress: number, time: string }
};

// --- DOM Elements ---
const views = {
    home: document.getElementById('home-view'),
    chat: document.getElementById('chat-view'),
    dashboard: document.getElementById('dashboard-view'),
    resources: document.getElementById('resources-view')
};

const chatElements = {
    messagesContainer: document.getElementById('chat-messages'),
    input: document.getElementById('user-input'),
    sendBtn: document.getElementById('send-btn'),
    typingIndicator: document.getElementById('typing-indicator')
};

const dashboardElements = {
    mood: document.getElementById('current-mood'),
    stress: document.getElementById('stress-level'),
    interactions: document.getElementById('interaction-count'),
    scoreValue: document.getElementById('health-score-value'),
    scoreCircle: document.getElementById('score-circle-path'),
    healthStatus: document.getElementById('health-status'),
    healthTrend: document.getElementById('health-trend'),
    chartContainer: document.querySelector('.placeholder-chart'),
    chartLabels: document.querySelector('.chart-labels')
};

// --- Navigation ---
function switchTab(tabName) {
    // Update State
    state.currentTab = tabName;

    // Update UI (Views)
    Object.values(views).forEach(view => {
        view.style.display = 'none';
        view.classList.remove('active');
    });

    const activeView = views[tabName];
    if (activeView) {
        activeView.style.display = 'flex';
        // Small timeout to allow display:block to apply before opacity transition
        setTimeout(() => activeView.classList.add('active'), 10);
    }

    // Update Sidebar Active State
    document.querySelectorAll('.nav-links li').forEach(li => {
        if (li.innerText.toLowerCase().includes(tabName)) {
            li.classList.add('active');
        } else {
            li.classList.remove('active');
        }
    });

    // Refresh Dashboard if selected
    if (tabName === 'dashboard') {
        updateDashboard();
    }
}

// --- Chat Logic ---

// Simple "AI" Rules for Simulation
const responses = [
    {
        keywords: ['sad', 'depressed', 'unhappy', 'cry', 'down'],
        reply: "I hear that you're feeling down. It simulates a heavy feeling, doesn't it? Can you tell me a bit more about what's making you feel this way?",
        moodChange: -10,
        stressChange: 5
    },
    {
        keywords: ['anxious', 'scared', 'nervous', 'panic', 'worry'],
        reply: "It sounds like anxiety is present right now. Let's take a slow breath together. Would you like to try a quick grounding exercise?",
        moodChange: -5,
        stressChange: 15
    },
    {
        keywords: ['happy', 'good', 'great', 'excited', 'joy'],
        reply: "I'm really glad to hear that! Celebrating these moments is important. What's the best part of your day so far?",
        moodChange: 10,
        stressChange: -5
    },
    {
        keywords: ['tired', 'exhausted', 'sleepy', 'drained'],
        reply: "Exhaustion can be physically and emotionally taxing. Have you been able to get any rest lately?",
        moodChange: -5,
        stressChange: 5
    },
    {
        keywords: ['stress', 'busy', 'work', 'overwhelmed'],
        reply: "It sounds like you have a lot on your plate. Remember, you can only do one thing at a time. What's the most pressing thing right now?",
        moodChange: -5,
        stressChange: 10
    },
    {
        keywords: ['help', 'suicide', 'kill', 'end it'],
        reply: "I am an AI and cannot provide crisis support. If you are in danger, please contact emergency services or a crisis helpline immediately. There is help available.",
        moodChange: -50,
        stressChange: 50,
        isCrisis: true
    }
];

const defaultResponses = [
    "I'm listening. Please go on.",
    "Tell me more about that.",
    "How does that make you feel?",
    "I'm here for you."
];

function analyzeInput(text) {
    const lowerText = text.toLowerCase();

    // Check for matching keywords
    for (const rule of responses) {
        for (const keyword of rule.keywords) {
            if (lowerText.includes(keyword)) {
                return rule;
            }
        }
    }

    return null;
}

function updateState(analysis) {
    state.interactionCount++;

    if (analysis) {
        // Clamp values between 0 and 100
        state.moodScore = Math.max(0, Math.min(100, state.moodScore + (analysis.moodChange || 0)));
        state.stressLevel = Math.max(0, Math.min(100, state.stressLevel + (analysis.stressChange || 0)));
    }

    // Add to History
    const now = new Date();
    state.history.push({
        mood: state.moodScore,
        stress: state.stressLevel,
        time: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
    });
}

function updateDashboard() {
    // Mood Text
    let moodText = "Neutral";
    if (state.moodScore > 75) moodText = "Positive";
    else if (state.moodScore > 40) moodText = "Stable";
    else moodText = "Low";

    dashboardElements.mood.innerText = moodText;
    dashboardElements.mood.style.color = state.moodScore < 40 ? '#E74C3C' : '#E0E6ED';

    // Stress Text
    let stressText = "Moderate";
    if (state.stressLevel < 30) stressText = "Low";
    else if (state.stressLevel > 70) stressText = "High";

    dashboardElements.stress.innerText = stressText;
    dashboardElements.stress.style.color = state.stressLevel > 70 ? '#E74C3C' : '#E0E6ED';

    // Interactions
    dashboardElements.interactions.innerText = state.interactionCount;

    // --- Health Score Calculation ---
    // Formula: Start at 50 (Neutral).
    // Add Mood (scaled 0-50).
    // Subtract Stress (scaled 0-50).
    // Result normalized to 0-100.

    // Simplification: Average of Mood and Inverse Stress
    // Mood: 100 is best. Stress: 0 is best.
    // Score = (Mood + (100 - Stress)) / 2

    const healthScore = Math.round((state.moodScore + (100 - state.stressLevel)) / 2);

    // Animate Counter (simple set for now)
    dashboardElements.scoreValue.innerText = healthScore;

    // Update Circle Stroke (100 is full circle)
    // Stroke-dasharray: value, 100
    dashboardElements.scoreCircle.setAttribute('stroke-dasharray', `${healthScore}, 100`);

    // Update Color Class based on Score
    dashboardElements.scoreCircle.classList.remove('high', 'medium', 'low');
    if (healthScore >= 70) dashboardElements.scoreCircle.classList.add('high'); // Green
    else if (healthScore >= 40) dashboardElements.scoreCircle.classList.add('medium'); // Yellow
    else dashboardElements.scoreCircle.classList.add('low'); // Red

    // Update Status Text
    let statusText = "Stable";
    if (healthScore >= 80) statusText = "Thriving";
    else if (healthScore >= 60) statusText = "Good";
    else if (healthScore >= 40) statusText = "Coping";
    else statusText = "Needs Attention";

    dashboardElements.healthStatus.innerText = statusText;

    // Update Trend (Mock logic for now, could compare to previous state if stored)
    const trendElement = dashboardElements.healthTrend;
    // ... logic to update trend icon/color if history existed

    // --- Update Chart ---
    renderChart();
}

function renderChart() {
    const container = dashboardElements.chartContainer;
    const labelsContainer = dashboardElements.chartLabels;

    // Clear existing
    container.innerHTML = '';
    labelsContainer.innerHTML = '';

    // Use last 5-7 data points
    const dataToShow = state.history.slice(-7);

    if (dataToShow.length === 0) {
        container.innerHTML = '<div style="width:100%; text-align:center; color: var(--text-secondary); align-self:center;">No data yet. Chat to start tracking.</div>';
        return;
    }

    dataToShow.forEach((data, index) => {
        // Bar for Mood
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${data.mood}%`;
        bar.title = `Mood: ${data.mood} | Stress: ${data.stress}`;

        // Dynamic color based on mood
        if (data.mood > 60) bar.style.background = 'var(--secondary-color)';
        else if (data.mood < 40) bar.style.background = 'var(--danger-color)';
        else bar.style.background = 'var(--primary-color)';

        container.appendChild(bar);

        // Label
        const label = document.createElement('span');
        label.innerText = data.time;
        labelsContainer.appendChild(label);
    });
}

function addMessage(text, sender) {
    const div = document.createElement('div');
    div.className = `message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerText = text;

    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    const now = new Date();
    timeDiv.innerText = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    div.appendChild(contentDiv);
    div.appendChild(timeDiv);

    chatElements.messagesContainer.appendChild(div);

    // Auto scroll to bottom
    chatElements.messagesContainer.scrollTop = chatElements.messagesContainer.scrollHeight;
}

async function handleUserMessage() {
    const text = chatElements.input.value.trim();
    if (!text) return;

    // Clear Input
    chatElements.input.value = '';

    // Add User Message
    addMessage(text, 'user');

    // Show Typing Indicator
    chatElements.typingIndicator.style.display = 'block';

    // Simulate Network/Processing Delay (1-2 seconds)
    const delay = Math.random() * 1000 + 1000;

    setTimeout(() => {
        // Hide Indicator
        chatElements.typingIndicator.style.display = 'none';

        // Analyze & Respond
        const analysis = analyzeInput(text);
        updateState(analysis);

        let reply = "";
        if (analysis) {
            reply = analysis.reply;
        } else {
            reply = defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
        }

        addMessage(reply, 'ai');

    }, delay);
}

// --- Event Listeners ---
chatElements.sendBtn.addEventListener('click', handleUserMessage);

chatElements.input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserMessage();
    }
});

// Initialize Icons (Lucide is globally available via script tag)
window.onload = () => {
    // Initial State Check
    updateDashboard();
};
