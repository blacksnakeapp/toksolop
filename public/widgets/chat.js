let ws = null;
let currentStyle = "1";
let settings = {};
window.settings = settings;
let tickerInterval = null;
let tickerQueue = [];
const chatContainer = document.getElementById('chat-container');
const activeAudios = [];

// Web Audio API Synthesizer (for zero-dependency audio alerts)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSynthSound(type, volume = 0.5) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  switch (type) {
    case 'synth_ding': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.3 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    }
    case 'synth_coin': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.15 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
      break;
    }
    case 'synth_cheer': {
      const bufferSize = audioCtx.sampleRate * 1.0;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
      filter.Q.setValueAtTime(2.0, now);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.15 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start(now);
      noise.stop(now + 1.0);
      break;
    }
    case 'synth_levelup': {
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2 * volume, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
      break;
    }
    case 'synth_horn': {
      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.3);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(155, now);
      osc2.frequency.linearRampToValueAtTime(185, now + 0.3);

      gain.gain.setValueAtTime(0.15 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.5);
      osc2.stop(now + 0.5);
      break;
    }
    case 'synth_clapping': {
      for (let i = 0; i < 8; i++) {
        const timeOffset = now + i * 0.08 + Math.random() * 0.02;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350 + Math.random() * 100, timeOffset);
        gain.gain.setValueAtTime(0.15 * volume, timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, timeOffset + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(timeOffset);
        osc.stop(timeOffset + 0.08);
      }
      break;
    }
    case 'synth_bell': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.3 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
      break;
    }
    case 'synth_error': {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      gain.gain.setValueAtTime(0.2 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    }
  }
}

let _soundPlaying = false;
function playAudioSource(src) {
  if (!src || src === 'none') return;
  if (_soundPlaying) return; // prevent overlapping sounds
  
  _soundPlaying = true;
  const vol = settings.alertVolume !== undefined ? settings.alertVolume : 0.5;

  const unlockSound = () => { _soundPlaying = false; };

  if (src.startsWith('synth_')) {
    playSynthSound(src, vol);
    setTimeout(unlockSound, 1000); // 1s cooldown for synth sound
  } else {
    // Relative paths in custom files
    const relativeSrc = src.startsWith('/') ? src : `/${src}`;
    const audio = new Audio(relativeSrc);
    audio.volume = vol;
    activeAudios.push(audio);
    audio.addEventListener('ended', () => {
      const index = activeAudios.indexOf(audio);
      if (index > -1) activeAudios.splice(index, 1);
      unlockSound();
    });
    audio.addEventListener('error', unlockSound);
    audio.play().catch(err => {
      console.warn("Failed to play chat sound file:", err.message);
      const index = activeAudios.indexOf(audio);
      if (index > -1) activeAudios.splice(index, 1);
      unlockSound();
    });
  }
}

function clearChatQueue() {
  if (tickerInterval) {
    clearInterval(tickerInterval);
    tickerInterval = null;
  }
  tickerQueue = [];
  chatContainer.innerHTML = '';

  // Hentikan semua audio yang sedang diputar
  activeAudios.forEach(audio => {
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch (e) {}
  });
  activeAudios.length = 0;
}

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
        window.settings = settings;
        updateStyle(settings.chatStyle || "1");
        applyCustomTypography();
        break;

      case 'tiktokStatus':
        if (payload.data && payload.data.status === 'disconnected') {
          clearChatQueue();
        }
        break;

      case 'clearOverlayQueue':
        clearChatQueue();
        break;

      case 'chat':
        appendChatMessage(payload.data);
        if (settings.soundboard && settings.soundboard.chat) {
          playAudioSource(settings.soundboard.chat);
        }
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
  if (currentStyle !== styleId) {
    currentStyle = styleId;

    if (currentStyle === "8") {
      chatContainer.className = "style-8-active";
      chatContainer.innerHTML = ''; // Clear everything (stays :empty until first message)
    } else {
      chatContainer.className = "";
      chatContainer.innerHTML = ''; // Reset existing messages completely
    }
  }
}

function appendChatMessage(data) {
  const item = document.createElement('div');
  item.className = `chat-item style-${currentStyle}`;

  // Siren beacon for Style 8
  if (currentStyle === "8") {
    // Hapus sirine dari pesan-pesan sebelumnya (hanya tampil di pesan terbaru)
    const oldSirens = chatContainer.querySelectorAll('.ticker-siren');
    oldSirens.forEach(s => s.remove());

    const siren = document.createElement('span');
    siren.className = 'ticker-siren';
    item.appendChild(siren);
  }

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

  if (currentStyle === "8") {
    let marquee = chatContainer.querySelector('marquee');
    if (!marquee) {
      marquee = document.createElement('marquee');
      marquee.className = "style-8-marquee";
      marquee.setAttribute("direction", "left");
      marquee.setAttribute("scrollamount", "4");
      marquee.setAttribute("scrolldelay", "0");
      chatContainer.appendChild(marquee);
    }
    
    marquee.appendChild(item);

    // Limit to 20 messages in marquee to prevent RAM bloat
    if (marquee.children.length > 20) {
      marquee.removeChild(marquee.firstChild);
    }
  } else {
    chatContainer.appendChild(item);
    // Standard vertical stream: Limit to 30 items
    const maxMessages = 30;
    while (chatContainer.children.length > maxMessages) {
      chatContainer.removeChild(chatContainer.firstChild);
    }
  }
}

// Start connection
initWebSocket();

// Monitor and clean up Style 8 marquee items that have scrolled off-screen
setInterval(() => {
  if (currentStyle === "8") {
    const marquee = chatContainer.querySelector('marquee');
    if (marquee) {
      const containerRect = chatContainer.getBoundingClientRect();
      const items = marquee.querySelectorAll('.chat-item');
      items.forEach(item => {
        const itemRect = item.getBoundingClientRect();
        // If the right edge of the chat item is to the left of the container's left edge
        if (itemRect.right < containerRect.left) {
          item.remove();
        }
      });

      // If no chat items are left in the marquee, remove the marquee so the container becomes :empty
      if (marquee.children.length === 0) {
        marquee.remove();
      }
    }
  }
}, 500);
