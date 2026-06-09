let ws = null;
let currentUsername = "";
let connectionStatus = "disconnected";

// DOM elements
const valViewers = document.getElementById('val-viewers');
const valUnique = document.getElementById('val-unique');
const valLikes = document.getElementById('val-likes');
const valCoins = document.getElementById('val-coins');

const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const inputUsername = document.getElementById('input-username');
const btnConnect = document.getElementById('btn-connect');
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
      case 'settingsUpdated':
        currentUsername = payload.data.tiktokUsername || "";
        if (connectionStatus === 'disconnected') {
          inputUsername.value = currentUsername;
        }
        break;
        
      case 'stats':
        valViewers.textContent = payload.data.activeViewers.toLocaleString();
        valUnique.textContent = payload.data.totalUniqueViewers.toLocaleString();
        valLikes.textContent = payload.data.totalLikes.toLocaleString();
        valCoins.textContent = payload.data.totalCoins.toLocaleString();
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
          
          if (!window.userLikesData) {
            window.userLikesData = {};
          }
          window.userLikesData[uId] = (window.userLikesData[uId] || 0) + currentCount;
          const totalUserLikes = window.userLikesData[uId];

          let existingLikeElement = activityFeed.querySelector(`[data-user-like="${uId}"]`);
          if (existingLikeElement) {
            const msgDiv = existingLikeElement.querySelector('.msg');
            if (msgDiv) {
              msgDiv.innerHTML = `❤️ <strong>@${uId}</strong> menyukai stream (Total ${totalUserLikes} Likes)`;
            }
            activityFeed.appendChild(existingLikeElement);
            activityFeed.scrollTop = activityFeed.scrollHeight;
          } else {
            addFeedItem({
              type: 'system',
              avatar: payload.data.profilePictureUrl,
              content: `❤️ <strong>@${uId}</strong> menyukai stream (Total ${totalUserLikes} Likes)`,
              userLikeId: uId
            });
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

// Update connection status
function updateConnectionUI(statusData) {
  const { status, username, error } = statusData;
  connectionStatus = status;
  
  statusDot.className = "status-dot";
  
  if (status === 'connected') {
    statusDot.classList.add('connected');
    statusText.textContent = `Connected`;
    btnConnect.textContent = "Disconnect";
    btnConnect.className = "btn btn-danger btn-block";
    inputUsername.value = username;
    inputUsername.disabled = true;
  } else if (status === 'connecting') {
    statusDot.classList.add('connecting');
    statusText.textContent = `Connecting`;
    btnConnect.textContent = "Connecting...";
    btnConnect.className = "btn btn-primary btn-block";
    btnConnect.disabled = true;
    inputUsername.disabled = true;
  } else {
    statusText.textContent = `Disconnected`;
    btnConnect.textContent = "Connect";
    btnConnect.className = "btn btn-primary btn-block";
    btnConnect.disabled = false;
    inputUsername.disabled = false;
    if (error) {
      addFeedItem({ type: 'system', content: `[Error] Koneksi gagal: ${error}` });
    }
  }
}

// Add item to log
function addFeedItem(item) {
  const div = document.createElement('div');
  div.className = `feed-item ${item.type}`;
  if (item.userLikeId) {
    div.setAttribute('data-user-like', item.userLikeId);
  }
  
  // Avatar
  if (item.avatar) {
    const img = document.createElement('img');
    img.src = item.avatar;
    img.className = 'avatar-mini';
    img.onerror = () => { img.style.display = 'none'; };
    div.appendChild(img);
  }
  
  // Message
  const msgDiv = document.createElement('div');
  msgDiv.className = 'msg';
  msgDiv.innerHTML = item.content;
  div.appendChild(msgDiv);
  
  activityFeed.appendChild(div);
  
  // Enforce memory collection (max 30 items)
  const maxItems = 30;
  while (activityFeed.children.length > maxItems) {
    activityFeed.removeChild(activityFeed.firstChild);
  }
  
  activityFeed.scrollTop = activityFeed.scrollHeight;
}

// Connect / Disconnect button click
btnConnect.addEventListener('click', () => {
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
document.querySelectorAll('.sb-key').forEach(btn => {
  btn.addEventListener('click', () => {
    const eventType = btn.getAttribute('data-event');
    ws.send(JSON.stringify({
      event: 'triggerSound',
      data: `sb-${eventType}`
    }));
  });
});

// Simulator triggers
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
      eventData.comment = "Halo dari Standalone Control Dock!";
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

// Collapsible panels
function setupCollapsible(sectionId, headerId) {
  const section = document.getElementById(sectionId);
  const header = document.getElementById(headerId);
  
  header.addEventListener('click', () => {
    section.classList.toggle('collapsed');
  });
}
setupCollapsible('sec-connection', 'header-connection');
setupCollapsible('sec-simulator', 'header-simulator');


// Start WebSocket
initWebSocket();
