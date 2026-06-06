let ws = null;
let currentStyle = "1";
let settings = {};
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
        settings = payload.data;
        updateStyle(settings.chatStyle || "1");
        applyCustomTypography();
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

function applyCustomTypography() {
  let styleEl = document.getElementById('custom-typography-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'custom-typography-styles';
    document.head.appendChild(styleEl);
  }
  
  const font = settings.chatFont || 'Inter';
  const size = settings.chatFontSize || 13;
  const userColor = settings.chatUsernameColor || '#00f0ff';
  const msgColor = settings.chatMessageColor || '#ffffff';
  
  styleEl.textContent = `
    #chat-container, .chat-item, .chat-user, .chat-msg {
      font-family: '${font}', sans-serif !important;
    }
    .chat-user {
      color: ${userColor} !important;
    }
    .chat-msg {
      font-size: ${size}px !important;
      color: ${msgColor} !important;
    }
  `;
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
  // Potong pesan dinamis berdasarkan setelan max chars
  const MAX_CHARS = settings.chatMaxChars || 150;
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
