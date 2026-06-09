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
  allEventsStyle: "1",
  alertDuration: 4000,
  alertVolume: 0.5,
  soundboard: {}
};
window.settings = settings;

const alertQueue = [];
let isAlertActive = false;
let activeAlert = null; // Stores current active alert details
const alertContainer = document.getElementById('alert-container');
const activeAudios = [];

// Parse allowed types from URL query params (e.g. ?types=follow,share)
const urlParams = new URLSearchParams(window.location.search);
const typesParam = urlParams.get('types');
let allowedTypes = null;
let isAllEventsWidget = false;

if (typesParam) {
  allowedTypes = typesParam.split(',').map(t => t.trim().toLowerCase());
  if (allowedTypes.length > 1) {
    isAllEventsWidget = true;
  }
} else {
  isAllEventsWidget = true;
  // By default, general alert/all-events widget should NOT handle chat comments as popups
  allowedTypes = ['follow', 'share', 'gift', 'subscribe', 'join'];
}

function clearAllAlerts() {
  alertQueue.length = 0;
  if (activeAlert) {
    clearTimeout(activeAlert.timeoutExit);
    clearTimeout(activeAlert.timeoutRemove);
    if (activeAlert.card) {
      activeAlert.card.remove();
    }
    activeAlert = null;
  }
  
  // Clear Carousel Queue
  carouselQueue.length = 0;
  isCarouselActive = false;
  clearTimeout(carouselTimeout);
  if (carouselCurrentStyleId && alertContainer.classList.contains(`nb-container-style-${carouselCurrentStyleId}`)) {
    alertContainer.className = '';
    carouselNodes = [];
    carouselCurrentIndex = -1;
    carouselCurrentStyleId = null;
  }

  alertContainer.innerHTML = '';
  isAlertActive = false;

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
        settings = { ...settings, ...payload.data };
        window.settings = settings;
        break;
        
      case 'tiktokStatus':
        if (payload.data && payload.data.status === 'disconnected') {
          clearAllAlerts();
        }
        break;

      case 'clearOverlayQueue':
        clearAllAlerts();
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

      case 'chat':
        if (!allowedTypes || allowedTypes.includes('chat')) {
          enqueueAlert('chat', payload.data);
        }
        break;
        
      case 'playSound':
        const key = payload.data;
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

    // Shake the entire box card during combo updates
    if (activeAlert.card) {
      activeAlert.card.classList.remove('shake-vibe-active');
      void activeAlert.card.offsetWidth; // Force DOM reflow
      activeAlert.card.classList.add('shake-vibe-active');
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
  if (isAllEventsWidget) {
    const styleId = parseInt(settings.allEventsStyle || "1", 10);
    if (styleId >= 6 && styleId <= 8) {
      enqueueCarousel(type, data, styleId);
      return;
    }
  }

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

// Helper to get safe image URLs (handles TikTok CORS proxying and offline fallback)
function getSafeImageUrl(url, isAvatar = false) {
  if (!url) {
    return isAvatar ? 'https://api.dicebear.com/7.x/adventurer/svg?seed=default' : '';
  }
  // Convert TikTok CDN to CORS-friendly proxy to prevent HTTP 403 blocks in WebView2/OBS
  if (url.includes('tiktokcdn.com')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
  }
  // Fallback for i.pravatar.cc which is highly unstable/blocked in some regions
  if (url.includes('pravatar.cc')) {
    const seed = url.split('u=')[1] || Math.floor(Math.random() * 1000);
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
  }
  return url;
}

// Render the alert HTML structure and animate
function displayAlert(type, data) {
  // Determine style (1 to 10 for individual alerts, ae-1 to ae-5 for all events)
  let styleId = settings.alertStyle || "1";
  if (isAllEventsWidget) {
    styleId = "ae-" + (settings.allEventsStyle || "1");
  } else {
    if (type === 'follow') styleId = settings.followStyle || styleId;
    else if (type === 'share') styleId = settings.shareStyle || styleId;
    else if (type === 'gift') styleId = settings.giftStyle || styleId;
    else if (type === 'subscribe') styleId = settings.subscribeStyle || styleId;
    else if (type === 'join') styleId = settings.joinStyle || styleId;
  }

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
  } else if (type === 'chat') {
    description = data.comment || "";
  }

  // Create Element
  const card = document.createElement('div');
  let eventClass = '';
  if (type === 'chat') eventClass = 'chat-event-card';
  else if (type === 'share') eventClass = 'share-event-card';
  else if (type === 'subscribe') eventClass = 'subscribe-event-card';
  else if (type === 'follow') eventClass = 'follow-event-card';
  else if (type === 'gift') eventClass = 'gift-event-card shake-vibe-active';
  
  card.className = `alert-card style-${styleId} style-${styleId}-enter ${eventClass}`;
  
  // Set Profile Avatar
  const avatar = document.createElement('img');
  avatar.src = getSafeImageUrl(data.profilePictureUrl, true);
  avatar.className = 'alert-avatar animate-avatar';
  avatar.onerror = () => { avatar.src = 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + (data.uniqueId || 'viewer'); };
  card.appendChild(avatar);

  // Append Sweetener Icon if follow, share, subscribe, or chat
  if (type === 'follow' || type === 'share' || type === 'subscribe' || type === 'chat') {
    const pemanisIcon = document.createElement('div');
    pemanisIcon.className = 'pemanis-icon';
    if (type === 'follow') {
      pemanisIcon.textContent = '🔔';
      pemanisIcon.classList.add('bell-icon');
    } else if (type === 'share') {
      pemanisIcon.textContent = '🔗';
      pemanisIcon.classList.add('share-icon');
    } else if (type === 'subscribe') {
      pemanisIcon.textContent = '👑';
      pemanisIcon.classList.add('crown-icon');
    } else if (type === 'chat') {
      pemanisIcon.textContent = '💬';
      pemanisIcon.classList.add('chat-icon');
    }
    card.appendChild(pemanisIcon);
  }

  // If gift, append the gift image
  if (type === 'gift' && data.giftImage) {
    const giftImg = document.createElement('img');
    giftImg.src = getSafeImageUrl(data.giftImage);
    giftImg.className = 'animate-gift';
    giftImg.style.width = '60px';
    giftImg.style.height = '60px';
    giftImg.style.marginLeft = 'auto';
    giftImg.style.order = '3';
    giftImg.onerror = () => {
      // Fallback to a beautiful gift icon if the image fails to load
      giftImg.src = 'https://cdn-icons-png.flaticon.com/128/833/833472.png';
    };
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

  // Tentukan warna judul dan deskripsi secara dinamis jika diubah oleh user
  let titleColor = '#ffffff';
  let descColor = '#cccccc';
  let isCustomTitleColor = false;
  let isCustomDescColor = false;

  if (isAllEventsWidget) {
    if (settings.allEventsTitleColor && settings.allEventsTitleColor !== '#ffffff') {
      titleColor = settings.allEventsTitleColor;
      isCustomTitleColor = true;
    }
    if (settings.allEventsDescColor && settings.allEventsDescColor !== '#e0e0e0') {
      descColor = settings.allEventsDescColor;
      isCustomDescColor = true;
    }
  } else if (type === 'follow') {
    if (settings.followTitleColor && settings.followTitleColor !== '#ffffff') {
      titleColor = settings.followTitleColor;
      isCustomTitleColor = true;
    }
    if (settings.followDescColor && settings.followDescColor !== '#cccccc') {
      descColor = settings.followDescColor;
      isCustomDescColor = true;
    }
  } else if (type === 'share') {
    if (settings.shareTitleColor && settings.shareTitleColor !== '#ffffff') {
      titleColor = settings.shareTitleColor;
      isCustomTitleColor = true;
    }
    if (settings.shareDescColor && settings.shareDescColor !== '#cccccc') {
      descColor = settings.shareDescColor;
      isCustomDescColor = true;
    }
  } else if (type === 'gift') {
    if (settings.giftTitleColor && settings.giftTitleColor !== '#ffffff') {
      titleColor = settings.giftTitleColor;
      isCustomTitleColor = true;
    }
    if (settings.giftDescColor && settings.giftDescColor !== '#cccccc') {
      descColor = settings.giftDescColor;
      isCustomDescColor = true;
    }
  } else if (type === 'subscribe') {
    if (settings.subscribeTitleColor && settings.subscribeTitleColor !== '#ffffff') {
      titleColor = settings.subscribeTitleColor;
      isCustomTitleColor = true;
    }
    if (settings.subscribeDescColor && settings.subscribeDescColor !== '#cccccc') {
      descColor = settings.subscribeDescColor;
      isCustomDescColor = true;
    }
  } else if (type === 'join') {
    if (settings.joinTitleColor && settings.joinTitleColor !== '#ffffff') {
      titleColor = settings.joinTitleColor;
      isCustomTitleColor = true;
    }
    if (settings.joinDescColor && settings.joinDescColor !== '#cccccc') {
      descColor = settings.joinDescColor;
      isCustomDescColor = true;
    }
  }

  // Terapkan warna judul
  const isGradientStyle = (styleId === '5' || styleId === 5 || styleId === '6' || styleId === 6);
  if (isGradientStyle) {
    if (isCustomTitleColor) {
      // Jika user mengkustomisasi warna, timpa gradien dengan warna solid kustom
      titleEl.style.setProperty('-webkit-background-clip', 'unset');
      titleEl.style.setProperty('background', 'none');
      titleEl.style.setProperty('-webkit-text-fill-color', titleColor);
      titleEl.style.color = titleColor;
      titleEl.style.setProperty('animation', 'none');
    }
    // Jika menggunakan default, biarkan CSS menangani gradien emas/pelangi bawaan tema
  } else {
    titleEl.style.setProperty('-webkit-text-fill-color', titleColor);
    titleEl.style.color = titleColor;
  }

  // Terapkan warna deskripsi
  if (isCustomDescColor) {
    descEl.style.setProperty('-webkit-text-fill-color', descColor);
    descEl.style.color = descColor;
  } else {
    // Biarkan CSS bawaan tema menangani warna deskripsi jika tidak dikustomisasi
  }
  
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
    // NOTE: chat sound is intentionally NOT played here - handled exclusively by chat.js overlay
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

// Play sound helper — with anti-spam guard: skip if a sound is already playing
let _soundPlaying = false;
function playAudioSource(src) {
  if (!src || src === 'none') return;
  if (_soundPlaying) return; // prevent overlapping sounds
  
  _soundPlaying = true;
  const vol = settings.alertVolume !== undefined ? settings.alertVolume : 0.5;

  const unlockSound = () => { _soundPlaying = false; };

  if (src.startsWith('synth_')) {
    playSynthSound(src, vol);
    // synth sounds are short, unlock after 400ms
    setTimeout(unlockSound, 400);
  } else {
    const audio = new Audio(src);
    audio.volume = vol;
    activeAudios.push(audio);
    audio.addEventListener('ended', () => {
      const index = activeAudios.indexOf(audio);
      if (index > -1) activeAudios.splice(index, 1);
      unlockSound();
    });
    audio.addEventListener('error', unlockSound);
    audio.play().catch(err => {
      console.warn("Failed to play alert sound file:", err.message);
      const index = activeAudios.indexOf(audio);
      if (index > -1) activeAudios.splice(index, 1);
      unlockSound();
    });
  }
}


// Display completely fresh non-blocking alerts (Styles 6 to 10)
function displayNonBlockingAlert(type, data, styleId) {
  let title = data.nickname || `@${data.uniqueId}`;
  let description = "";
  
  if (type === 'follow') description = "Baru saja mengikuti host!";
  else if (type === 'share') description = "Membagikan live stream ini!";
  else if (type === 'subscribe') description = "Baru saja berlangganan (Subscribe)!";
  else if (type === 'join') description = "Baru bergabung ke live stream!";
  else if (type === 'gift') description = `Mengirim ${data.giftName} x${data.giftCount} (${data.coins} Koin)`;
  else if (type === 'chat') description = data.comment || "";

  // Play sound
  let soundSource = "none";
  if (settings.soundboard) {
    if (type === 'follow') soundSource = settings.soundboard.follow;
    else if (type === 'share') soundSource = settings.soundboard.share;
    else if (type === 'gift') soundSource = settings.soundboard.gift;
    else if (type === 'subscribe') soundSource = settings.soundboard.subscribe;
    else if (type === 'join') soundSource = settings.soundboard.join;
    // NOTE: chat sound intentionally excluded here
  }
  playAudioSource(soundSource);

  const fullStyleId = "ae-" + styleId;
  const duration = settings.alertDuration || 4000;
  
  const card = document.createElement('div');
  card.className = `nb-card style-${fullStyleId}`;
  
  // Create content based on style
  if (styleId === 7) {
    // Top-Down Glass Feed
    if (!alertContainer.classList.contains('nb-container-style-7')) {
       alertContainer.className = 'nb-container-style-7';
       alertContainer.innerHTML = '';
    }
    card.innerHTML = `<img src="${getSafeImageUrl(data.profilePictureUrl, true)}" class="nb-avatar"> <span><strong>${title}</strong><br>${description}</span>`;
    
    // prepend to appear at the top
    alertContainer.insertBefore(card, alertContainer.firstChild);
    
    requestAnimationFrame(() => {
      card.classList.add('nb-enter');
    });
    
    const children = Array.from(alertContainer.children);
    if (children.length > 5) {
      children[children.length - 1].remove();
    }
  } else if (styleId === 8) {
    // Floating Bubbles
    alertContainer.className = 'nb-container-style-8';
    card.innerHTML = `<img src="${getSafeImageUrl(data.profilePictureUrl, true)}" class="nb-avatar"> <div class="nb-text-col"><strong>${title}</strong><br><span>${description}</span></div>`;
    card.style.left = Math.floor(Math.random() * 80) + 10 + '%';
    alertContainer.appendChild(card);
  } else if (styleId === 9) {
    // Minimalist Toast Stack
    if (!alertContainer.classList.contains('nb-container-style-9')) {
       alertContainer.className = 'nb-container-style-9';
    }
    card.innerHTML = `<div class="nb-toast-content"><img src="${getSafeImageUrl(data.profilePictureUrl, true)}" class="nb-avatar"> <div><strong>${title}</strong><br>${description}</div></div>`;
    alertContainer.appendChild(card);
    
    requestAnimationFrame(() => {
      card.classList.add('nb-enter');
    });
    
    const children = Array.from(alertContainer.children);
    if (children.length > 4) {
      children[0].remove();
    }
  } else if (styleId === 10) {
    // 3D Chaos Cloud
    alertContainer.className = 'nb-container-style-10';
    card.innerHTML = `<img src="${getSafeImageUrl(data.profilePictureUrl, true)}" class="nb-avatar"> <strong>${title}</strong><br><span style="font-size:10px">${description}</span>`;
    const randomX = Math.floor(Math.random() * 400) - 200;
    const randomY = Math.floor(Math.random() * 200) - 100;
    const randomZ = Math.floor(Math.random() * 40) - 20;
    card.style.transform = `translate(${randomX}px, ${randomY}px) rotateZ(${randomZ}deg) scale(0.1)`;
    alertContainer.appendChild(card);
    
    requestAnimationFrame(() => {
      card.style.transform = `translate(${randomX}px, ${randomY}px) rotateZ(${randomZ}deg) scale(1)`;
      card.style.opacity = '1';
    });
  }
  
  // Set self-destruct timeout
  setTimeout(() => {
    card.classList.add('nb-exit');
    if (styleId === 6 && window.style6Items) {
      window.style6Items = window.style6Items.filter(item => item !== card);
    }
    setTimeout(() => {
      card.remove();
      if (alertContainer.children.length === 0) {
         alertContainer.className = '';
      }
    }, 800); // Wait for exit animation
  }, duration);
}

let carouselQueue = [];
let isCarouselActive = false;
let carouselTimeout = null;
let carouselCurrentIndex = -1;
let carouselNodes = [];
let carouselCurrentStyleId = null;

function enqueueCarousel(type, data, styleId) {
  carouselQueue.push({ type, data, styleId });
  if (!isCarouselActive) {
    processCarouselQueue();
  }
}

function processCarouselQueue() {
  if (carouselQueue.length === 0) {
    isCarouselActive = false;
    carouselTimeout = setTimeout(() => {
      if (carouselCurrentStyleId && alertContainer.classList.contains(`nb-container-style-${carouselCurrentStyleId}`)) {
        alertContainer.innerHTML = '';
        alertContainer.className = '';
        carouselNodes = [];
        carouselCurrentIndex = -1;
        carouselCurrentStyleId = null;
      }
    }, settings.alertDuration || 4000);
    return;
  }

  isCarouselActive = true;
  clearTimeout(carouselTimeout);

  const current = carouselQueue.shift();
  const styleId = current.styleId;

  if (carouselCurrentStyleId !== styleId || !alertContainer.classList.contains(`nb-container-style-${styleId}`)) {
    alertContainer.className = `nb-container-style-${styleId}`;
    alertContainer.innerHTML = '';
    carouselNodes = [];
    carouselCurrentIndex = -1;
    carouselCurrentStyleId = styleId;
  }

  carouselCurrentIndex++;

  let title = current.data.nickname || `@${current.data.uniqueId}`;
  let description = "";
  if (current.type === 'follow') description = "Mengikuti host!";
  else if (current.type === 'share') description = "Membagikan live!";
  else if (current.type === 'subscribe') description = "Berlangganan!";
  else if (current.type === 'join') description = "Bergabung!";
  else if (current.type === 'gift') description = `${current.data.giftName} x${current.data.giftCount}`;
  else if (current.type === 'chat') description = current.data.comment || "";

  let soundSource = "none";
  if (settings.soundboard) {
    if (current.type === 'follow') soundSource = settings.soundboard.follow;
    else if (current.type === 'share') soundSource = settings.soundboard.share;
    else if (current.type === 'gift') soundSource = settings.soundboard.gift;
    else if (current.type === 'subscribe') soundSource = settings.soundboard.subscribe;
    else if (current.type === 'join') soundSource = settings.soundboard.join;
    // NOTE: chat sound intentionally excluded here
  }
  playAudioSource(soundSource);

  const nodeIndex = carouselCurrentIndex % 5;
  let card = carouselNodes[nodeIndex];
  if (!card) {
    card = document.createElement('div');
    card.className = `nb-card style-ae-${styleId}`;
    alertContainer.appendChild(card);
    carouselNodes[nodeIndex] = card;
  }

  card.style.transition = 'none';
  card.innerHTML = `<img src="${getSafeImageUrl(current.data.profilePictureUrl, true)}" class="nb-avatar"> <span class="nb-text"><strong>${title}</strong> ${description}</span>`;
  
  if (styleId === 6) card.style.transform = `translateY(150px) scale(0.5)`;
  else if (styleId === 7) card.style.transform = `translateY(-150px) scale(0.5)`; // comes from top
  else if (styleId === 8) card.style.transform = `translateX(800px) scale(0.5)`; // comes from right
  
  card.style.opacity = '0';
  card.style.filter = 'brightness(0)';
  
  void card.offsetWidth;

  for (let i = 0; i < 5; i++) {
    const node = carouselNodes[i];
    if (!node) continue;

    let absIdx = carouselCurrentIndex - ((carouselCurrentIndex - i) % 5);
    if (absIdx > carouselCurrentIndex) absIdx -= 5;
    if (absIdx < 0) continue;

    const offset = absIdx - carouselCurrentIndex; 
    
    node.style.transition = 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    let opacity = '0';
    let zIndex = '0';
    let filter = 'brightness(0.7)';
    let transform = '';

    if (styleId === 6) {
      if (offset === 0) {
        transform = `translateY(0px) scale(1)`; opacity = '1'; filter = 'brightness(1.2)'; zIndex = '10';
        node.innerHTML = `<div class="ae-6-dot"></div>` + node.innerHTML.replace('<div class="ae-6-dot"></div>', '');
      } else if (offset === -1) {
        transform = `translateY(-45px) scale(0.9)`; opacity = '0.75'; zIndex = '9';
      } else if (offset === -2) {
        transform = `translateY(-90px) scale(0.8)`; opacity = '0.5'; zIndex = '8';
      } else if (offset === -3 || offset === 2) {
        transform = `translateY(90px) scale(0.8)`; opacity = '0.5'; zIndex = '8';
      } else if (offset === -4 || offset === 1) {
        transform = `translateY(45px) scale(0.9)`; opacity = '0.75'; zIndex = '9';
      }
    } else if (styleId === 7) {
      // Reverse of Style 6
      if (offset === 0) {
        transform = `translateY(0px) scale(1)`; opacity = '1'; filter = 'brightness(1.2)'; zIndex = '10';
        node.innerHTML = `<div class="ae-6-dot"></div>` + node.innerHTML.replace('<div class="ae-6-dot"></div>', '');
      } else if (offset === -1) {
        transform = `translateY(45px) scale(0.9)`; opacity = '0.75'; zIndex = '9';
      } else if (offset === -2) {
        transform = `translateY(90px) scale(0.8)`; opacity = '0.5'; zIndex = '8';
      } else if (offset === -3 || offset === 2) {
        transform = `translateY(-90px) scale(0.8)`; opacity = '0.5'; zIndex = '8';
      } else if (offset === -4 || offset === 1) {
        transform = `translateY(-45px) scale(0.9)`; opacity = '0.75'; zIndex = '9';
      }
    } else if (styleId === 8) {
      // Horizontal version of Style 6 (1080px wide, modified to not overlap and have tight gaps)
      if (offset === 0) {
        transform = `translateX(0px) scale(1)`; opacity = '1'; filter = 'brightness(1.2)'; zIndex = '10';
      } else if (offset === -1) {
        transform = `translateX(-290px) scale(0.85)`; opacity = '0.75'; zIndex = '9';
      } else if (offset === -2) {
        transform = `translateX(-540px) scale(0.7)`; opacity = '0.5'; zIndex = '8';
      } else if (offset === -3 || offset === 2) {
        transform = `translateX(540px) scale(0.7)`; opacity = '0.5'; zIndex = '8';
      } else if (offset === -4 || offset === 1) {
        transform = `translateX(290px) scale(0.85)`; opacity = '0.75'; zIndex = '9';
      }
    }

    node.style.transform = transform;
    node.style.opacity = opacity;
    node.style.filter = filter;
    node.style.zIndex = zIndex;
    
    if (offset !== 0) {
      const dot = node.querySelector('.ae-6-dot'); if(dot) dot.remove();
    }
  }

  setTimeout(() => {
    processCarouselQueue();
  }, 1500);
}

// Start
initWebSocket();
