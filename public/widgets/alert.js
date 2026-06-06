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

// Websocket and Queue
let ws = null;
let settings = {
  alertStyle: "1",
  followStyle: "1",
  shareStyle: "1",
  giftStyle: "1",
  subscribeStyle: "1",
  alertDuration: 4000,
  alertVolume: 0.5,
  soundboard: {}
};

const alertQueue = [];
let isAlertActive = false;
let activeAlert = null; // Stores current active alert details
const alertContainer = document.getElementById('alert-container');

function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl);
  
  // Parse allowed types from URL query params (e.g. ?types=follow,share)
  const urlParams = new URLSearchParams(window.location.search);
  const typesParam = urlParams.get('types');
  let allowedTypes = null;
  if (typesParam) {
    allowedTypes = typesParam.split(',').map(t => t.trim().toLowerCase());
  }
  
  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    
    switch (payload.event) {
      case 'settings':
      case 'settingsUpdated':
        settings = { ...settings, ...payload.data };
        applyCustomStyles();
        break;
        
      case 'follow':
        if (!allowedTypes || allowedTypes.includes('follow')) {
          enqueueAlert('follow', payload.data);
        }
        break;
        
      case 'share':
        if (!allowedTypes || allowedTypes.includes('share')) {
          enqueueAlert('share', payload.data);
        }
        break;
        
      case 'gift':
        if (!allowedTypes || allowedTypes.includes('gift')) {
          handleGiftEvent(payload.data);
        }
        break;
        
      case 'subscribe':
        if (!allowedTypes || allowedTypes.includes('subscribe')) {
          enqueueAlert('subscribe', payload.data);
        }
        break;
        
      case 'join':
        if (!allowedTypes || allowedTypes.includes('join')) {
          enqueueAlert('join', payload.data);
        }
        break;
        
      case 'playSound':
        // Direct sound trigger command from client/docks
        const key = payload.data; // e.g. "sb-follow", "sb-custom1"
        let soundSource = "none";
        
        if (key === 'sb-follow') soundSource = settings.soundboard.follow;
        else if (key === 'sb-share') soundSource = settings.soundboard.share;
        else if (key === 'sb-gift') soundSource = settings.soundboard.gift;
        else if (key === 'sb-subscribe') soundSource = settings.soundboard.subscribe;
        else if (key === 'sb-join') soundSource = settings.soundboard.join;
        else if (key === 'sb-custom1') soundSource = settings.soundboard.custom1;
        else if (key === 'sb-custom2') soundSource = settings.soundboard.custom2;
        
        playAudioSource(soundSource);
        break;
    }
  };
  
  ws.onclose = () => {
    setTimeout(initWebSocket, 2000);
  };
}

// Handle incoming gift event with live combo updates
function handleGiftEvent(data) {
  // Check if matching gift alert is currently active on screen
  if (activeAlert && 
      activeAlert.type === 'gift' && 
      activeAlert.uniqueId === data.uniqueId && 
      activeAlert.giftName === data.giftName) {
    
    // Clear active timeouts
    clearTimeout(activeAlert.timeoutExit);
    clearTimeout(activeAlert.timeoutRemove);
    
    // Accumulate count
    activeAlert.giftCount += data.giftCount;
    const totalCoins = Math.round(activeAlert.singleCoins * activeAlert.giftCount);
    
    // Update text
    if (activeAlert.descEl) {
      activeAlert.descEl.textContent = `Mengirim ${activeAlert.giftName} (${totalCoins} Koin)`;
    }
    
    // Update combo bubble with pulse animation
    if (activeAlert.comboEl) {
      activeAlert.comboEl.textContent = `x${activeAlert.giftCount}`;
      activeAlert.comboEl.classList.remove('pulse-combo-anim');
      void activeAlert.comboEl.offsetWidth; // Force DOM reflow
      activeAlert.comboEl.classList.add('pulse-combo-anim');
    }
    
    // Play alert sound again
    let soundSource = "none";
    if (settings.soundboard) {
      soundSource = settings.soundboard.gift;
    }
    playAudioSource(soundSource);
    
    // Reset exit and remove timeouts
    const duration = settings.alertDuration || 4000;
    const exitDuration = 400;
    const styleId = activeAlert.styleId;
    const card = activeAlert.card;
    
    card.classList.remove('style-' + styleId + '-exit');
    if (!card.classList.contains('style-' + styleId + '-enter')) {
      card.classList.add('style-' + styleId + '-enter');
    }
    
    activeAlert.timeoutExit = setTimeout(() => {
      card.classList.remove('style-' + styleId + '-enter');
      card.classList.remove('idle-animation');
      card.classList.add('style-' + styleId + '-exit');
    }, duration - exitDuration);
    
    activeAlert.timeoutRemove = setTimeout(() => {
      card.remove();
      activeAlert = null;
      isAlertActive = false;
      processQueue();
    }, duration);
    
  } else {
    // Check if we can aggregate with matching gift already waiting in queue
    let aggregated = false;
    for (let i = 0; i < alertQueue.length; i++) {
      const q = alertQueue[i];
      if (q.type === 'gift' && q.data.uniqueId === data.uniqueId && q.data.giftName === data.giftName) {
        q.data.giftCount += data.giftCount;
        q.data.coins += data.coins;
        aggregated = true;
        break;
      }
    }
    
    if (!aggregated) {
      enqueueAlert('gift', data);
    }
  }
}

// Push to alert queue
function enqueueAlert(type, data) {
  alertQueue.push({ type, data });
  processQueue();
}

// Process the next alert in line
function processQueue() {
  if (isAlertActive || alertQueue.length === 0) return;
  
  isAlertActive = true;
  const currentAlert = alertQueue.shift();
  displayAlert(currentAlert.type, currentAlert.data);
}

// Render the alert HTML structure and animate
function displayAlert(type, data) {
  // Determine style (1 to 10)
  let styleId = settings.alertStyle || "1";
  if (type === 'follow') styleId = settings.followStyle || styleId;
  else if (type === 'share') styleId = settings.shareStyle || styleId;
  else if (type === 'gift') styleId = settings.giftStyle || styleId;
  else if (type === 'subscribe') styleId = settings.subscribeStyle || styleId;
  else if (type === 'join') styleId = settings.joinStyle || styleId;

  // Single unit coins calculation
  const singleCoins = type === 'gift' ? (data.coins / data.giftCount) : 0;

  // Determine Title and Details
  let title = data.nickname || `@${data.uniqueId}`;
  let description = "";
  
  if (type === 'follow') {
    description = "Baru saja mengikuti host!";
  } else if (type === 'share') {
    description = "Membagikan live stream ini!";
  } else if (type === 'subscribe') {
    description = "Baru saja berlangganan (Subscribe)!";
  } else if (type === 'join') {
    description = "Baru bergabung ke live stream!";
  } else if (type === 'gift') {
    description = `Mengirim ${data.giftName} x${data.giftCount} (${data.coins} Koin)`;
  }

  // Create Element
  const card = document.createElement('div');
  card.className = `alert-card style-${styleId} style-${styleId}-enter`;
  
  // Set Profile Avatar
  const avatar = document.createElement('img');
  avatar.src = data.profilePictureUrl || 'https://i.pravatar.cc/100';
  avatar.className = 'alert-avatar animate-avatar';
  avatar.onerror = () => { avatar.src = 'https://i.pravatar.cc/100'; };
  card.appendChild(avatar);

  // If gift, append the gift image
  if (type === 'gift' && data.giftImage) {
    const giftImg = document.createElement('img');
    giftImg.src = data.giftImage;
    giftImg.className = 'animate-gift';
    giftImg.style.width = '60px';
    giftImg.style.height = '60px';
    giftImg.style.marginLeft = 'auto';
    giftImg.style.order = '3';
    card.appendChild(giftImg);
  }

  // Details
  const details = document.createElement('div');
  details.className = 'alert-details';
  
  const titleEl = document.createElement('div');
  titleEl.className = 'alert-title animate-title';
  titleEl.textContent = title;
  
  const descEl = document.createElement('div');
  descEl.className = 'alert-description animate-desc';
  descEl.textContent = description;
  
  details.appendChild(titleEl);
  details.appendChild(descEl);
  card.appendChild(details);

  // If gift, append the combo multiplier badge
  let comboEl = null;
  if (type === 'gift') {
    comboEl = document.createElement('div');
    comboEl.className = 'alert-combo-multiplier pulse-combo-anim';
    comboEl.textContent = `x${data.giftCount}`;
    card.appendChild(comboEl);
  }
  
  alertContainer.appendChild(card);

  // Play Sound mapping
  let soundSource = "none";
  if (settings.soundboard) {
    if (type === 'follow') soundSource = settings.soundboard.follow;
    else if (type === 'share') soundSource = settings.soundboard.share;
    else if (type === 'gift') soundSource = settings.soundboard.gift;
    else if (type === 'subscribe') soundSource = settings.soundboard.subscribe;
    else if (type === 'join') soundSource = settings.soundboard.join;
  }
  playAudioSource(soundSource);

  // Add subtle breathing idle after entrance finishes
  setTimeout(() => {
    card.classList.add('idle-animation');
  }, 700);

  // Set timeout to play exit animation
  const duration = settings.alertDuration || 4000;
  const exitDuration = 400; // css animation duration
  
  const timeoutExit = setTimeout(() => {
    card.classList.remove('style-' + styleId + '-enter');
    card.classList.remove('idle-animation');
    card.classList.add('style-' + styleId + '-exit');
  }, duration - exitDuration);

  // Remove element (preventing memory leaks) and process next in queue
  const timeoutRemove = setTimeout(() => {
    card.remove();
    activeAlert = null;
    isAlertActive = false;
    processQueue();
  }, duration);

  // Track active alert
  activeAlert = {
    type,
    uniqueId: data.uniqueId,
    giftName: type === 'gift' ? data.giftName : null,
    giftCount: type === 'gift' ? data.giftCount : 0,
    singleCoins: singleCoins,
    card,
    descEl,
    comboEl,
    timeoutExit,
    timeoutRemove,
    styleId,
    duration
  };
}

// Play sound helper
function playAudioSource(src) {
  if (!src || src === 'none') return;
  
  const vol = settings.alertVolume !== undefined ? settings.alertVolume : 0.5;

  if (src.startsWith('synth_')) {
    playSynthSound(src, vol);
  } else {
    const audio = new Audio(src);
    audio.volume = vol;
    audio.play().catch(err => {
      console.warn("Failed to play alert sound file:", err.message);
    });
  }
}

function applyCustomStyles() {
  let styleEl = document.getElementById('custom-alert-colors');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'custom-alert-colors';
    document.head.appendChild(styleEl);
  }
  const titleColor = settings.alertTitleColor || '#ffffff';
  const descColor = settings.alertDescColor || '#cccccc';
  
  styleEl.textContent = `
    .alert-title {
      color: ${titleColor} !important;
    }
    .alert-description {
      color: ${descColor} !important;
    }
  `;
}

// Start
initWebSocket();
