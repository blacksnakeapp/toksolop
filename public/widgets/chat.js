let ws = null;
let currentStyle = "1";
const chatContainer = document.getElementById('chat-container');

function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    
    switch (payload.event) {
      case 'settings':
      case 'settingsUpdated':
        updateStyle(payload.data.chatStyle || "1");
        break;
        
      case 'chat':
        appendChatMessage(payload.data);
        break;
    }
  };
  
  ws.onclose = () => {
    setTimeout(initWebSocket, 2000);
  };
}

function updateStyle(styleId) {
  currentStyle = styleId;
  
  if (currentStyle === "8") {
    chatContainer.className = "style-8-active";
  } else {
    chatContainer.className = "";
  }
}

function appendChatMessage(data) {
  const item = document.createElement('div');
  item.className = `chat-item style-${currentStyle}`;
  
  // Avatar
  const img = document.createElement('img');
  img.src = data.profilePictureUrl || 'https://i.pravatar.cc/100';
  img.className = 'chat-avatar';
  img.onerror = () => { img.src = 'https://i.pravatar.cc/100'; };
  item.appendChild(img);
  
  // Details
  const details = document.createElement('div');
  details.className = 'chat-details';
  
  const user = document.createElement('span');
  user.className = 'chat-user';
  user.textContent = data.nickname || `@${data.uniqueId}`;
  
  const msg = document.createElement('span');
  msg.className = 'chat-msg';
  // Potong pesan lebih dari 150 karakter agar tidak nutup layar
  const MAX_CHARS = 150;
  const rawMsg = data.comment || '';
  msg.textContent = rawMsg.length > MAX_CHARS ? rawMsg.substring(0, MAX_CHARS) + '...' : rawMsg;
  
  details.appendChild(user);
  details.appendChild(msg);
  item.appendChild(details);
  
  chatContainer.appendChild(item);
  
  // Clean up nodes to save RAM memory footprint
  if (currentStyle === "8") {
    // In ticker mode, remove message after its CSS translation animation finishes
    item.addEventListener('animationend', () => {
      item.remove();
    });
  } else {
    // Standard vertical stream: Limit to 30 items
    const maxMessages = 30;
    while (chatContainer.children.length > maxMessages) {
      chatContainer.removeChild(chatContainer.firstChild);
    }
  }
}

// Start connection
initWebSocket();
