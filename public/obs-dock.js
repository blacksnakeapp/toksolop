let ws = null;
let currentUsername = "";
let connectionStatus = "disconnected";

// DOM elements
const statsActiveViewers = document.getElementById('stats-active-viewers');
const statsUniqueViewers = document.getElementById('stats-unique-viewers');
const statsLikes = document.getElementById('stats-likes');
const statsCoins = document.getElementById('stats-coins');

const inputUsername = document.getElementById('input-username');
const btnToggleConnection = document.getElementById('btn-toggle-connection');
const statusIndicator = document.getElementById('status-indicator');
const activityFeed = document.getElementById('activity-feed');

// Establish WS Connection
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    addFeedItem({ type: 'system', content: '[System] Terhubung ke server.' });
  };
  
  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    
    switch (payload.event) {
      case 'settings':
        currentUsername = payload.data.tiktokUsername || "";
        if (connectionStatus === 'disconnected') {
          inputUsername.value = currentUsername;
        }
        break;
        
      case 'stats':
        statsActiveViewers.textContent = payload.data.activeViewers.toLocaleString();
        statsUniqueViewers.textContent = payload.data.totalUniqueViewers.toLocaleString();
        statsLikes.textContent = payload.data.totalLikes.toLocaleString();
        statsCoins.textContent = payload.data.totalCoins.toLocaleString();
        break;
        
      case 'tiktokStatus':
        updateConnectionUI(payload.data);
        break;
        
      case 'chat':
        addFeedItem({
          type: 'chat',
          avatar: payload.data.profilePictureUrl,
          content: `<span class="user">@${payload.data.uniqueId}</span>: ${payload.data.comment}`
        });
        break;
        
      case 'gift':
        addFeedItem({
          type: 'gift',
          avatar: payload.data.profilePictureUrl,
          content: `🎁 <strong>@${payload.data.uniqueId}</strong> mengirim ${payload.data.giftName} x${payload.data.giftCount} (${payload.data.coins} koin)`
        });
        break;
        
      case 'follow':
        addFeedItem({
          type: 'follow',
          avatar: payload.data.profilePictureUrl,
          content: `➕ <strong>@${payload.data.uniqueId}</strong> mengikuti Anda`
        });
        break;
        
      case 'share':
        addFeedItem({
          type: 'share',
          avatar: payload.data.profilePictureUrl,
          content: `🔗 <strong>@${payload.data.uniqueId}</strong> membagikan stream`
        });
        break;
        
      case 'subscribe':
        addFeedItem({
          type: 'subscribe',
          avatar: payload.data.profilePictureUrl,
          content: `⭐ <strong>@${payload.data.uniqueId}</strong> berlangganan (Subscribe!)`
        });
        break;
        
      case 'join':
        addFeedItem({
          type: 'join',
          avatar: payload.data.profilePictureUrl,
          content: `🚪 <strong>@${payload.data.uniqueId}</strong> bergabung ke live stream`
        });
        break;
        
      case 'like':
        {
          const uId = payload.data.uniqueId;
          const currentCount = payload.data.likeCount || 1;
          if (!window.userLikesData) window.userLikesData = {};
          window.userLikesData[uId] = (window.userLikesData[uId] || 0) + currentCount;
          const totalUserLikes = window.userLikesData[uId];

          let existingEl = activityFeed.querySelector(`[data-user-like="${uId}"]`);
          if (existingEl) {
            const c = existingEl.querySelector('.item-content');
            if (c) c.innerHTML = `❤️ <strong>@${uId}</strong> menyukai stream (Total ${totalUserLikes} Likes)`;
            activityFeed.appendChild(existingEl);
            activityFeed.scrollTop = activityFeed.scrollHeight;
          } else {
            const div = document.createElement('div');
            div.className = 'feed-item system';
            div.setAttribute('data-user-like', uId);
            if (payload.data.profilePictureUrl) {
              const img = document.createElement('img');
              img.src = payload.data.profilePictureUrl;
              img.className = 'avatar-mini';
              img.onerror = () => { img.style.display = 'none'; };
              div.appendChild(img);
            }
            const contentDiv = document.createElement('div');
            contentDiv.className = 'item-content';
            contentDiv.innerHTML = `❤️ <strong>@${uId}</strong> menyukai stream (Total ${totalUserLikes} Likes)`;
            div.appendChild(contentDiv);
            activityFeed.appendChild(div);
            while (activityFeed.children.length > 40) activityFeed.removeChild(activityFeed.firstChild);
            activityFeed.scrollTop = activityFeed.scrollHeight;
          }
        }
        break;
    }
  };
  
  ws.onclose = () => {
    addFeedItem({ type: 'system', content: '[System] Terputus dari server. Mencoba kembali...' });
    setTimeout(initWebSocket, 2000);
  };
}

// Update connection button and statuses
function updateConnectionUI(statusData) {
  const { status, username, error } = statusData;
  connectionStatus = status;
  
  statusIndicator.className = "status-indicator";
  
  if (status === 'connected') {
    statusIndicator.classList.add('connected');
    btnToggleConnection.textContent = "Disconnect";
    btnToggleConnection.className = "btn btn-disconnect";
    inputUsername.value = username;
    inputUsername.disabled = true;
  } else if (status === 'connecting') {
    statusIndicator.classList.add('connecting');
    btnToggleConnection.textContent = "Connecting...";
    btnToggleConnection.className = "btn btn-connect";
    btnToggleConnection.disabled = true;
    inputUsername.disabled = true;
  } else {
    // disconnected or error
    btnToggleConnection.textContent = "Connect";
    btnToggleConnection.className = "btn btn-connect";
    btnToggleConnection.disabled = false;
    inputUsername.disabled = false;
    if (error) {
      addFeedItem({ type: 'system', content: `[Error] Gagal: ${error}` });
    }
  }
}

// Add item to scrolling log activity
function addFeedItem(item) {
  const div = document.createElement('div');
  div.className = `feed-item ${item.type}`;
  
  // Avatar
  if (item.avatar) {
    const img = document.createElement('img');
    img.src = item.avatar;
    img.className = 'avatar-mini';
    img.onerror = () => { img.style.display = 'none'; }; // Hide if broken
    div.appendChild(img);
  }
  
  // Content
  const contentDiv = document.createElement('div');
  contentDiv.className = 'item-content';
  contentDiv.innerHTML = item.content;
  div.appendChild(contentDiv);
  
  activityFeed.appendChild(div);
  
  // Recycle DOM nodes (max 40 items in DOM to avoid leaks)
  const maxItems = 40;
  while (activityFeed.children.length > maxItems) {
    activityFeed.removeChild(activityFeed.firstChild);
  }
  
  // Auto scroll to bottom
  activityFeed.scrollTop = activityFeed.scrollHeight;
}

// Connect / Disconnect trigger
btnToggleConnection.addEventListener('click', () => {
  if (connectionStatus === 'connected') {
    ws.send(JSON.stringify({ event: 'disconnect' }));
  } else {
    const username = inputUsername.value.trim();
    if (!username) return;
    ws.send(JSON.stringify({
      event: 'connect',
      data: { username }
    }));
  }
});

// Soundboard Trigger Keys
document.querySelectorAll('.sb-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const eventType = btn.getAttribute('data-event');
    // Request server to trigger sound mapped to this key
    ws.send(JSON.stringify({
      event: 'triggerSound',
      data: `sb-${eventType}` // e.g. sb-follow, sb-custom1
    }));
  });
});

// Simulator logic inside dock
document.querySelectorAll('.btn-sim').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.getAttribute('data-type');
    const uId = `sim_user_${Math.floor(100 + Math.random() * 900)}`;
    const nickName = `Simulated Viewer`;
    const profilePic = `https://i.pravatar.cc/100?u=${uId}`;
    
    let eventData = {
      uniqueId: uId,
      nickname: nickName,
      profilePictureUrl: profilePic
    };
    
    if (type === 'chat') {
      eventData.comment = "Halo dari OBS Dock Simulator!";
    } else if (type === 'gift') {
      eventData.giftName = "Mawar";
      eventData.coins = 1;
      eventData.giftImage = "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/54c55986427d14cb8d5930e466be5211.png~tplv-obj.png";
      eventData.giftCount = 1;
    } else if (type === 'like') {
      eventData.likeCount = 15;
    }
    
    ws.send(JSON.stringify({
      event: 'simulateEvent',
      data: {
        type,
        data: eventData
      }
    }));
  });
});

// Collapsible simulator toggle
const simulatorToggle = document.getElementById('simulator-toggle');
const simulatorBody = document.getElementById('simulator-body');
const chevron = simulatorToggle.querySelector('.chevron');

simulatorToggle.addEventListener('click', () => {
  const isHidden = simulatorBody.classList.toggle('hidden');
  chevron.textContent = isHidden ? '▼' : '▲';
});

// Start Websocket
initWebSocket();
