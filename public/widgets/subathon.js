let ws = null;
let settings = {
  subathonSeconds: 3600,
  subathonActive: false,
  rules: {
    follow: 5,
    share: 10,
    like: 1,
    gift: 2,
    subscribe: 30
  }
};
window.settings = settings;

let localSeconds = 3600;
let timerInterval = null;
let saveTimeout = null;
let accumulatedLikes = 0;

const clockEl = document.getElementById('timer-clock');
const alertEl = document.getElementById('timer-alert');

function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    
    switch (payload.event) {
      case 'settings':
      case 'settingsUpdated':
        const prevActive = settings.subathonActive;
        const prevSeconds = settings.subathonSeconds;
        
        settings = { ...settings, ...payload.data };
        window.settings = settings;
        applyCustomStyles();
        
        // Sync local seconds if server sent a different value
        if (Math.abs(localSeconds - settings.subathonSeconds) > 3 || prevSeconds !== settings.subathonSeconds) {
          localSeconds = settings.subathonSeconds;
          updateClockUI();
        }
        
        // Sync active state
        if (settings.subathonActive) {
          startTimer();
        } else {
          stopTimer();
        }
        break;
        
      case 'follow':
        handleTimeAddition(settings.rules.follow, "Follow");
        break;
        
      case 'share':
        handleTimeAddition(settings.rules.share, "Share");
        break;
        
      case 'subscribe':
        handleTimeAddition(settings.rules.subscribe, "Sub");
        break;
        
      case 'gift':
        const giftCoins = payload.data.coins || 1;
        const addGiftSeconds = giftCoins * settings.rules.gift;
        handleTimeAddition(addGiftSeconds, `Gift (${giftCoins} Koin)`);
        break;
        
      case 'like':
        accumulatedLikes += (payload.data.likeCount || 1);
        if (accumulatedLikes >= 100) {
          const multiplier = Math.floor(accumulatedLikes / 100);
          const addLikeSeconds = multiplier * settings.rules.like;
          accumulatedLikes = accumulatedLikes % 100;
          handleTimeAddition(addLikeSeconds, `${multiplier * 100} Likes`);
        }
        break;
    }
  };
  
  ws.onclose = () => {
    stopTimer();
    setTimeout(initWebSocket, 2000);
  };
}

function updateClockUI() {
  const hrs = Math.floor(localSeconds / 3600);
  const mins = Math.floor((localSeconds % 3600) / 60);
  const secs = localSeconds % 60;
  
  const hStr = hrs.toString().padStart(2, '0');
  const mStr = mins.toString().padStart(2, '0');
  const sStr = secs.toString().padStart(2, '0');
  
  clockEl.textContent = `${hStr}:${mStr}:${sStr}`;
}

function startTimer() {
  if (timerInterval) return;
  
  timerInterval = setInterval(() => {
    if (localSeconds > 0) {
      localSeconds--;
      updateClockUI();
      
      // Save countdown progress to backend config files (throttled every 5 seconds)
      triggerThrottledSave();
    } else {
      stopTimer();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function handleTimeAddition(secondsToAdd, sourceName) {
  if (!secondsToAdd || secondsToAdd <= 0) return;
  
  localSeconds += secondsToAdd;
  updateClockUI();
  
  // Show Visual Alert Popup
  alertEl.textContent = `+${secondsToAdd}s (${sourceName})`;
  alertEl.classList.remove('animate');
  void alertEl.offsetWidth; // Trigger reflow to restart animation
  alertEl.classList.add('animate');
  
  // Instantly trigger a save when time is added so stats aren't lost
  saveTimeToServer();
}

function triggerThrottledSave() {
  if (saveTimeout) return;
  
  saveTimeout = setTimeout(() => {
    saveTimeToServer();
    saveTimeout = null;
  }, 5000); // Save every 5s
}

async function saveTimeToServer() {
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subathonSeconds: localSeconds })
    });
  } catch (err) {
    console.warn("Failed to persist timer seconds back to server:", err);
  }
}

function applyCustomStyles() {
  let styleEl = document.getElementById('custom-subathon-colors');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'custom-subathon-colors';
    document.head.appendChild(styleEl);
  }
  const color = settings.subathonFontColor || '#ffffff';
  styleEl.textContent = `
    body, #timer-container, #timer-title, #timer-clock, #timer-alert {
      color: ${color} !important;
    }
  `;
}

// Start
initWebSocket();
updateClockUI();
