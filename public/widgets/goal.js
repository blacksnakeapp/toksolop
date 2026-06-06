let ws = null;
let goals = {
  text: "Target Upgrade PC",
  target: 1000,
  current: 0
};

const titleEl = document.getElementById('goal-title');
const percentEl = document.getElementById('goal-percentage');
const fillEl = document.getElementById('goal-bar-fill');
const currentEl = document.getElementById('goal-current');
const targetEl = document.getElementById('goal-target');

function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    
    switch (payload.event) {
      case 'settings':
      case 'settingsUpdated':
        if (payload.data.goals) {
          goals = payload.data.goals;
        }
        applyCustomStyles(payload.data);
        updateGoalUI();
        break;
        
      case 'gift':
        // Instant client-side visual increment for maximum responsiveness
        const coins = payload.data.coins || 1;
        goals.current += coins;
        updateGoalUI();
        break;
    }
  };
  
  ws.onclose = () => {
    setTimeout(initWebSocket, 2000);
  };
}

function applyCustomStyles(data) {
  let styleEl = document.getElementById('custom-goal-colors');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'custom-goal-colors';
    document.head.appendChild(styleEl);
  }
  const color = data.goalFontColor || '#ffffff';
  styleEl.textContent = `
    body, #goal-container, #goal-title, #goal-percentage, #goal-target, #goal-current, .goal-bar-label {
      color: ${color} !important;
    }
  `;
}

function updateGoalUI() {
  titleEl.textContent = goals.text;
  targetEl.textContent = `${goals.target.toLocaleString()} Koin`;
  currentEl.textContent = goals.current.toLocaleString();
  
  // Calculate percentage
  const pct = goals.target > 0 ? Math.round((goals.current / goals.target) * 100) : 0;
  percentEl.textContent = `${pct}%`;
  
  // Fill width limit
  const fillWidth = Math.min(pct, 100);
  fillEl.style.width = `${fillWidth}%`;
}

// Start
initWebSocket();
