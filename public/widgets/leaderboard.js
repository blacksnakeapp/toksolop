let ws = null;
let settings = {
  leaderboardLimit: 5,
  leaderboardStyle: "1",
  leaderboardTitle: "TOP DONATOR"
};
let leaderboardData = [];

function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    
    switch (payload.event) {
      case 'settings':
      case 'settingsUpdated':
        settings = { ...settings, ...payload.data };
        updateSettingsUI();
        renderLeaderboard();
        break;
        
      case 'leaderboard':
        leaderboardData = payload.data;
        renderLeaderboard();
        break;
    }
  };
  
  ws.onclose = () => {
    setTimeout(initWebSocket, 2000);
  };
}

function updateSettingsUI() {
  const titleEl = document.getElementById('leaderboard-title');
  if (titleEl) {
    titleEl.textContent = settings.leaderboardTitle || "TOP DONATOR";
  }
  
  const wrapper = document.getElementById('leaderboard-wrapper');
  if (wrapper) {
    // Remove existing style classes and apply active leaderboardStyle
    wrapper.className = '';
    wrapper.classList.add(`style-${settings.leaderboardStyle || '1'}`);
  }
}

function renderLeaderboard() {
  const listEl = document.getElementById('leaderboard-list');
  if (!listEl) return;
  
  listEl.innerHTML = '';
  
  const limit = parseInt(settings.leaderboardLimit, 10) || 5;
  const itemsToShow = leaderboardData.slice(0, limit);
  
  if (itemsToShow.length === 0) {
    const noData = document.createElement('div');
    noData.className = 'leaderboard-empty';
    noData.textContent = 'Belum ada donasi';
    listEl.appendChild(noData);
    return;
  }
  
  itemsToShow.forEach((item, index) => {
    const rank = index + 1;
    const row = document.createElement('div');
    row.className = `leaderboard-item rank-${rank}`;
    row.style.setProperty('--delay', `${index * 0.08}s`);
    
    // Rank badge
    const badge = document.createElement('div');
    badge.className = 'rank-badge';
    badge.textContent = rank;
    row.appendChild(badge);
    
    // Avatar
    const avatar = document.createElement('img');
    avatar.src = item.profilePictureUrl || 'https://i.pravatar.cc/100';
    avatar.className = 'rank-avatar';
    avatar.onerror = () => { avatar.src = 'https://i.pravatar.cc/100'; };
    row.appendChild(avatar);
    
    // Name
    const nameEl = document.createElement('div');
    nameEl.className = 'rank-name';
    nameEl.textContent = item.nickname || `@${item.uniqueId}`;
    row.appendChild(nameEl);
    
    // Coins
    const coinsEl = document.createElement('div');
    coinsEl.className = 'rank-coins';
    coinsEl.innerHTML = `<span>${item.totalCoins.toLocaleString()}</span> Koin`;
    row.appendChild(coinsEl);
    
    listEl.appendChild(row);
  });
}

initWebSocket();
