// Web Audio API Synthesizer sounds for instant out-of-the-box alerts
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSynthSound(type) {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  switch (type) {
    case 'synth_ding': {
      // Clean high chime
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    }
    case 'synth_coin': {
      // Double coin sound (like retro Mario)
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
      break;
    }
    case 'synth_cheer': {
      // Synthesized wind-like noise sweep representing cheers
      const bufferSize = audioCtx.sampleRate * 1.0; // 1 second
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
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.start(now);
      noise.stop(now + 1.0);
      break;
    }
    case 'synth_levelup': {
      // Rising arpeggio
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
      break;
    }
    case 'synth_horn': {
      // Aggressive retro synthesizer alarm/horn
      const osc = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.3);
      
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(155, now);
      osc2.frequency.linearRampToValueAtTime(185, now + 0.3);
      
      gain.gain.setValueAtTime(0.15, now);
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
      // Rapid burst clap sounds
      for (let i = 0; i < 8; i++) {
        const timeOffset = now + i * 0.08 + Math.random() * 0.02;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350 + Math.random() * 100, timeOffset);
        gain.gain.setValueAtTime(0.15, timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, timeOffset + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(timeOffset);
        osc.stop(timeOffset + 0.08);
      }
      break;
    }
    case 'synth_bell': {
      // Deep cathedral bell toll
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now); // A3
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
      break;
    }
    case 'synth_error': {
      // Low buzz error sound
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
    }
  }
}

// State variables
let settings = {};
let stats = {};
let customSounds = [];
let ws = null;

// DOM Elements
const inputUsername = document.getElementById('input-username');
const btnConnect = document.getElementById('btn-connect');
const btnDisconnect = document.getElementById('btn-disconnect');
const connectionStatusDot = document.getElementById('connection-status-dot');
const connectionStatusText = document.getElementById('connection-status-text');

// Stats Elements
const headerViewers = document.getElementById('header-viewers');
const headerCoins = document.getElementById('header-coins');
const statsActiveViewers = document.getElementById('stats-active-viewers');
const statsUniqueViewers = document.getElementById('stats-unique-viewers');
const statsLikes = document.getElementById('stats-likes');
const statsCoins = document.getElementById('stats-coins');
const btnResetStats = document.getElementById('btn-reset-stats');

// Tab System
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');
const pageTitle = document.getElementById('page-title');
const pageDesc = document.getElementById('page-desc');

navItems.forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const tabId = item.getAttribute('data-tab');
    
    navItems.forEach(i => i.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));
    
    item.classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    // Update header labels
    pageTitle.textContent = item.textContent.trim();
    if (tabId === 'connection') pageDesc.textContent = "Sambungkan akun TikTok Live Anda dan monitor stats.";
    if (tabId === 'styles') pageDesc.textContent = "Pilih gaya tampilan overlay yang paling cocok dengan nuansa streaming Anda.";
    if (tabId === 'rules') pageDesc.textContent = "Pengaturan target goal koin dan penambahan waktu marathon subathon.";
    if (tabId === 'soundboard') pageDesc.textContent = "Petakan suara kustom Anda atau gunakan synthesizer bawaan.";
    if (tabId === 'simulator') pageDesc.textContent = "Uji coba visual alert, chat, subathon timer, dan goal bar secara offline.";
    if (tabId === 'obs-links') pageDesc.textContent = "Salin URL untuk dipasang di OBS Studio sebagai Browser Source.";
  });
});

// Launch Standalone Control Dock
document.getElementById('btn-open-dock').addEventListener('click', () => {
  const width = 360;
  const height = 680;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  window.open(
    '/control-dock.html',
    'SolopTikControlDock',
    `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes`
  );
});

// Load Custom Sounds from server api
async function loadCustomSounds() {
  try {
    const res = await fetch('/api/sounds');
    customSounds = await res.json();
    populateSoundDropdowns();
  } catch (err) {
    console.error("Failed to load custom sounds list:", err);
  }
}

// Populate soundboard selects
function populateSoundDropdowns() {
  const selects = document.querySelectorAll('.select-sound-source');
  selects.forEach(select => {
    const currentValue = select.value;
    
    // Clear custom options (keep synths and none)
    const originalOptionsCount = 5; // number of built-in/none options
    while (select.options.length > originalOptionsCount) {
      select.remove(originalOptionsCount);
    }
    
    // Add custom file options
    customSounds.forEach(soundFile => {
      const option = document.createElement('option');
      option.value = `/sounds/custom/${soundFile}`;
      option.textContent = `Custom: ${soundFile}`;
      select.appendChild(option);
    });
    
    // Restore value if existed
    select.value = currentValue;
  });
}

// Establish WS Connection
function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log("WebSocket connected to backend.");
    addLog("[System] Koneksi ke backend server aktif.");
  };
  
  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    
    switch (payload.event) {
      case 'settings':
        settings = payload.data;
        updateFormValues();
        break;
        
      case 'settingsUpdated':
        settings = payload.data;
        updateFormValues();
        addLog("[System] Setelan diperbarui.");
        break;
        
      case 'stats':
        stats = payload.data;
        updateStatsUI();
        break;
        
      case 'tiktokStatus':
        updateTikTokStatusUI(payload.data);
        break;
        
      case 'playSound':
        const soundSource = payload.data;
        playAudioSource(soundSource);
        break;
        
      // Log stream events in simulator log
      case 'chat':
        addLog(`[Chat] @${payload.data.uniqueId}: ${payload.data.comment}`);
        break;
      case 'gift':
        addLog(`[Gift] @${payload.data.uniqueId} mengirim ${payload.data.giftName} x${payload.data.giftCount} (${payload.data.coins} Koin)`);
        break;
      case 'follow':
        addLog(`[Follow] @${payload.data.uniqueId} mengikuti host!`);
        break;
      case 'share':
        addLog(`[Share] @${payload.data.uniqueId} membagikan live stream!`);
        break;
      case 'subscribe':
        addLog(`[Subscribe] @${payload.data.uniqueId} men-subscribe channel!`);
        break;
      case 'join':
        addLog(`[Join] @${payload.data.uniqueId} bergabung ke live stream!`);
        break;
      case 'like':
        addLog(`[Like] @${payload.data.uniqueId} menyukai stream x${payload.data.likeCount}`);
        break;
    }
  };
  
  ws.onclose = () => {
    console.log("WebSocket disconnected. Reconnecting...");
    addLog("[System] Koneksi terputus. Mencoba menghubungkan kembali...");
    setTimeout(initWebSocket, 2000);
  };
}

// Update form inputs from loaded settings
function updateFormValues() {
  inputUsername.value = settings.tiktokUsername || "";
  
  // Styles
  document.getElementById('select-style-chat').value = settings.chatStyle;
  document.getElementById('select-style-follow').value = settings.followStyle;
  document.getElementById('select-style-share').value = settings.shareStyle;
  document.getElementById('select-style-gift').value = settings.giftStyle;
  document.getElementById('select-style-subscribe').value = settings.subscribeStyle;
  document.getElementById('select-style-join').value = settings.joinStyle || "1";
  document.getElementById('input-alert-duration').value = settings.alertDuration;
  
  // Chat Typography
  document.getElementById('input-chat-max-chars').value = settings.chatMaxChars || 150;
  document.getElementById('select-chat-font').value = settings.chatFont || "Inter";
  document.getElementById('input-chat-font-size').value = settings.chatFontSize || 13;
  document.getElementById('input-chat-user-color').value = settings.chatUsernameColor || "#00f0ff";
  document.getElementById('input-chat-msg-color').value = settings.chatMessageColor || "#ffffff";

  // Other Overlays Color Customization
  document.getElementById('input-alert-title-color').value = settings.alertTitleColor || "#ffffff";
  document.getElementById('input-alert-desc-color').value = settings.alertDescColor || "#cccccc";
  document.getElementById('input-goal-font-color').value = settings.goalFontColor || "#ffffff";
  document.getElementById('input-subathon-font-color').value = settings.subathonFontColor || "#ffffff";
  document.getElementById('input-leaderboard-font-color').value = settings.leaderboardFontColor || "#ffffff";

  // Leaderboard
  document.getElementById('input-leaderboard-title').value = settings.leaderboardTitle || 'TOP DONATOR';
  document.getElementById('input-leaderboard-limit').value = settings.leaderboardLimit || 5;
  document.getElementById('select-leaderboard-style').value = settings.leaderboardStyle || '1';
  
  // Goals
  document.getElementById('input-goal-text').value = settings.goals.text;
  document.getElementById('input-goal-target').value = settings.goals.target;
  document.getElementById('input-goal-current').value = settings.goals.current;
  
  // Subathon
  const totalSeconds = settings.subathonSeconds;
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  
  document.getElementById('input-timer-hours').value = hrs;
  document.getElementById('input-timer-mins').value = mins;
  document.getElementById('input-timer-secs').value = secs;
  
  document.getElementById('rule-follow').value = settings.rules.follow;
  document.getElementById('rule-share').value = settings.rules.share;
  document.getElementById('rule-like').value = settings.rules.like;
  document.getElementById('rule-gift').value = settings.rules.gift;
  document.getElementById('rule-subscribe').value = settings.rules.subscribe;
  
  const btnTimer = document.getElementById('btn-control-timer');
  if (settings.subathonActive) {
    btnTimer.textContent = "Hentikan Timer";
    btnTimer.className = "btn btn-danger";
  } else {
    btnTimer.textContent = "Mulai Timer";
    btnTimer.className = "btn btn-success";
  }

  // Soundboard
  if (settings.soundboard) {
    document.getElementById('sb-follow').value = settings.soundboard.follow || "none";
    document.getElementById('sb-share').value = settings.soundboard.share || "none";
    document.getElementById('sb-gift').value = settings.soundboard.gift || "none";
    document.getElementById('sb-subscribe').value = settings.soundboard.subscribe || "none";
    document.getElementById('sb-join').value = settings.soundboard.join || "none";
    document.getElementById('sb-custom1').value = settings.soundboard.custom1 || "none";
    document.getElementById('sb-custom2').value = settings.soundboard.custom2 || "none";
  }
}

// Update stats panels
function updateStatsUI() {
  headerViewers.textContent = stats.activeViewers.toLocaleString();
  headerCoins.textContent = stats.totalCoins.toLocaleString();
  
  statsActiveViewers.textContent = stats.activeViewers.toLocaleString();
  statsUniqueViewers.textContent = stats.totalUniqueViewers.toLocaleString();
  statsLikes.textContent = stats.totalLikes.toLocaleString();
  statsCoins.textContent = stats.totalCoins.toLocaleString();
}

// Update TikTok Status badges + banner + toast
function updateTikTokStatusUI(statusData) {
  const { status, username, error } = statusData;

  // --- Header dot ---
  connectionStatusDot.className = 'dot live-dot';

  if (status === 'connected') {
    connectionStatusDot.classList.add('connected');
    connectionStatusText.textContent = `Live: @${username}`;
    btnConnect.disabled = true;
    btnConnect.classList.add('disabled');
    btnDisconnect.disabled = false;
    btnDisconnect.classList.remove('disabled');
    addLog(`[System] Sukses terhubung ke room @${username}`);
    updateStatusBanner('connected', `Terhubung ke @${username}`, 'Stream live sedang dipantau. Event chat, gift, dan follow akan masuk secara real-time.', '🟢');
    showToast('success', '🎉 Berhasil Terhubung!', `Live stream @${username} sedang aktif dipantau.`, 5000);

  } else if (status === 'connecting') {
    connectionStatusDot.classList.add('connecting');
    connectionStatusText.textContent = `Menghubungkan...`;
    btnConnect.disabled = true;
    btnConnect.classList.add('disabled');
    btnDisconnect.disabled = false;
    btnDisconnect.classList.remove('disabled');
    updateStatusBanner('connecting', 'Menghubungkan...', `Sedang mencoba terhubung ke room live @${username || '...'}. Harap tunggu.`, '⏳');
    showToast('info', '🔄 Menghubungkan', `Menghubungkan ke live stream @${username || ''}...`, 3000);

  } else {
    // disconnected or error
    const isError = !!error;
    connectionStatusText.textContent = isError ? `Error: ${error}` : 'Disconnected';
    btnConnect.disabled = false;
    btnConnect.classList.remove('disabled');
    btnDisconnect.disabled = true;
    btnDisconnect.classList.add('disabled');

    if (isError) {
      addLog(`[Error] Gagal terhubung ke TikTok: ${error}`);
      updateStatusBanner('error', 'Gagal Terhubung', error, '❌');
      showToast('error', '❌ Koneksi Gagal', error.length > 80 ? error.substring(0, 80) + '...' : error, 7000);
    } else {
      addLog(`[System] Terputus dari TikTok Live.`);
      updateStatusBanner('disconnected', 'Tidak Terhubung', 'Masukkan username TikTok dan klik Connect Live untuk mulai memantau stream Anda.', '📡');
      // Only show toast if we were previously connected (not on initial load)
      if (connectionStatusText.dataset.wasConnected) {
        showToast('warning', '🔌 Terputus', 'Koneksi ke TikTok Live terputus.', 4000);
      }
    }
    delete connectionStatusText.dataset.wasConnected;
  }

  // Track if was ever connected for disconnect toast
  if (status === 'connected') connectionStatusText.dataset.wasConnected = '1';
}

// Update the big banner card in Connection tab
function updateStatusBanner(state, label, sub, icon) {
  const banner = document.getElementById('connection-banner');
  const bannerLabel = document.getElementById('banner-label');
  const bannerSub = document.getElementById('banner-sub');
  const bannerIcon = document.getElementById('banner-icon');
  if (!banner) return;
  // Remove all state classes
  banner.classList.remove('state-disconnected', 'state-connecting', 'state-connected', 'state-error');
  banner.classList.add(`state-${state}`);
  if (bannerLabel) bannerLabel.textContent = label;
  if (bannerSub) bannerSub.textContent = sub;
  if (bannerIcon) bannerIcon.textContent = icon;
}

// Show a toast notification
// type: 'success' | 'error' | 'info' | 'warning'
function showToast(type, title, message, duration = 5000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '🚫' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="dismissToast(this.parentElement)">✕</button>
    <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
  `;

  container.appendChild(toast);

  // Auto dismiss
  const timer = setTimeout(() => dismissToast(toast), duration);
  toast._timer = timer;
}

function dismissToast(toast) {
  if (!toast || toast.classList.contains('dismissing')) return;
  clearTimeout(toast._timer);
  toast.classList.add('dismissing');
  setTimeout(() => toast.remove(), 380);
}

// Play sound helper
function playAudioSource(src) {
  if (!src || src === 'none') return;
  
  if (src.startsWith('synth_')) {
    playSynthSound(src);
  } else {
    // Custom file play
    const audio = new Audio(src);
    audio.volume = settings.alertVolume !== undefined ? settings.alertVolume : 0.5;
    audio.play().catch(err => {
      console.warn('Failed to play audio file:', err.message);
    });
  }
}

// Add logs in Simulator logs Console
const simLog = document.getElementById('sim-log');
function addLog(text) {
  if (!simLog) return;
  const time = new Date().toLocaleTimeString();
  simLog.innerHTML += `\n[${time}] ${text}`;
  simLog.scrollTop = simLog.scrollHeight;
}

// Actions handlers
btnConnect.addEventListener('click', () => {
  const username = inputUsername.value.trim();
  if (!username) return;
  ws.send(JSON.stringify({
    event: 'connect',
    data: { username }
  }));
});

btnDisconnect.addEventListener('click', () => {
  ws.send(JSON.stringify({
    event: 'disconnect'
  }));
});

btnResetStats.addEventListener('click', () => {
  if (confirm("Reset seluruh data statistik live stream saat ini?")) {
    fetch('/api/stats/reset', { method: 'POST' });
  }
});

// Styles Form Submit
document.getElementById('styles-form').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const updatedStyles = {
    chatStyle: document.getElementById('select-style-chat').value,
    followStyle: document.getElementById('select-style-follow').value,
    shareStyle: document.getElementById('select-style-share').value,
    giftStyle: document.getElementById('select-style-gift').value,
    subscribeStyle: document.getElementById('select-style-subscribe').value,
    joinStyle: document.getElementById('select-style-join').value,
    alertDuration: parseInt(document.getElementById('input-alert-duration').value, 10) || 4000,
    
    // Chat Typography
    chatMaxChars: parseInt(document.getElementById('input-chat-max-chars').value, 10) || 150,
    chatFont: document.getElementById('select-chat-font').value,
    chatFontSize: parseInt(document.getElementById('input-chat-font-size').value, 10) || 13,
    chatUsernameColor: document.getElementById('input-chat-user-color').value,
    chatMessageColor: document.getElementById('input-chat-msg-color').value,

    // Other Overlays Custom Colors
    alertTitleColor: document.getElementById('input-alert-title-color').value,
    alertDescColor: document.getElementById('input-alert-desc-color').value,
    goalFontColor: document.getElementById('input-goal-font-color').value,
    subathonFontColor: document.getElementById('input-subathon-font-color').value,
    leaderboardFontColor: document.getElementById('input-leaderboard-font-color').value,

    leaderboardTitle: document.getElementById('input-leaderboard-title').value || 'TOP DONATOR',
    leaderboardLimit: parseInt(document.getElementById('input-leaderboard-limit').value, 10) || 5,
    leaderboardStyle: document.getElementById('select-leaderboard-style').value
  };
  
  saveSettings(updatedStyles);
});

// Save Goals
document.getElementById('btn-save-goals').addEventListener('click', () => {
  const goals = {
    goals: {
      text: document.getElementById('input-goal-text').value,
      target: parseInt(document.getElementById('input-goal-target').value, 10) || 1000,
      current: parseInt(document.getElementById('input-goal-current').value, 10) || 0
    }
  };
  saveSettings(goals);
});

// Control Subathon Timer toggle
document.getElementById('btn-control-timer').addEventListener('click', () => {
  const active = !settings.subathonActive;
  
  // Calculate seconds input
  const hrs = parseInt(document.getElementById('input-timer-hours').value, 10) || 0;
  const mins = parseInt(document.getElementById('input-timer-mins').value, 10) || 0;
  const secs = parseInt(document.getElementById('input-timer-secs').value, 10) || 0;
  
  const totalSeconds = hrs * 3600 + mins * 60 + secs;
  
  const subUpdate = {
    subathonActive: active,
    subathonSeconds: totalSeconds
  };
  
  saveSettings(subUpdate);
});

// Save Subathon Rules
document.getElementById('btn-save-subathon').addEventListener('click', () => {
  const rules = {
    rules: {
      follow: parseInt(document.getElementById('rule-follow').value, 10) || 0,
      share: parseInt(document.getElementById('rule-share').value, 10) || 0,
      like: parseInt(document.getElementById('rule-like').value, 10) || 0,
      gift: parseInt(document.getElementById('rule-gift').value, 10) || 0,
      subscribe: parseInt(document.getElementById('rule-subscribe').value, 10) || 0
    }
  };
  saveSettings(rules);
});

// Save Soundboard mappings
document.getElementById('btn-save-soundboard').addEventListener('click', () => {
  const soundboard = {
    soundboard: {
      follow: document.getElementById('sb-follow').value,
      share: document.getElementById('sb-share').value,
      gift: document.getElementById('sb-gift').value,
      subscribe: document.getElementById('sb-subscribe').value,
      join: document.getElementById('sb-join').value,
      custom1: document.getElementById('sb-custom1').value,
      custom2: document.getElementById('sb-custom2').value
    }
  };
  saveSettings(soundboard);
});

// Reset Leaderboard
document.getElementById('btn-reset-leaderboard').addEventListener('click', () => {
  if (confirm('Reset semua data papan peringkat donatur? Semua data koin akan dihapus permanen!')) {
    ws.send(JSON.stringify({ event: 'resetLeaderboard' }));
    addLog('[System] Papan peringkat berhasil direset.');
  }
});

// Save settings REST wrapper
async function saveSettings(payload) {
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      alert("Settings saved successfully!");
    } else {
      alert("Failed to save settings.");
    }
  } catch (err) {
    console.error("Save error:", err);
    alert("Error communicating with server.");
  }
}

// Copy Widget link functionality
document.querySelectorAll('.btn-copy').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const input = document.getElementById(targetId);
    
    // Resolve absolute address
    const tempInput = document.createElement('input');
    tempInput.value = `${window.location.protocol}//${window.location.host}/${input.value.replace(/^http:\/\/localhost:3000\//, '')}`;
    document.body.appendChild(tempInput);
    
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    const originalText = btn.textContent;
    btn.textContent = "Copied!";
    btn.className = "btn btn-success";
    setTimeout(() => {
      btn.textContent = originalText;
      btn.className = "btn btn-secondary";
    }, 1500);
  });
});

// Trigger sound locally
document.querySelectorAll('.btn-play-sound').forEach(btn => {
  btn.addEventListener('click', () => {
    const eventType = btn.getAttribute('data-event');
    let soundSrc = "none";
    
    if (eventType === 'follow') soundSrc = document.getElementById('sb-follow').value;
    else if (eventType === 'share') soundSrc = document.getElementById('sb-share').value;
    else if (eventType === 'gift') soundSrc = document.getElementById('sb-gift').value;
    else if (eventType === 'subscribe') soundSrc = document.getElementById('sb-subscribe').value;
    else if (eventType === 'join') soundSrc = document.getElementById('sb-join').value;
    else if (eventType === 'custom1') soundSrc = document.getElementById('sb-custom1').value;
    else if (eventType === 'custom2') soundSrc = document.getElementById('sb-custom2').value;
    
    playAudioSource(soundSrc);
  });
});

// Simulator triggers
document.querySelectorAll('.btn-sim').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.getAttribute('data-type');
    const uId = `user_${Math.floor(1000 + Math.random() * 9000)}`;
    const nickName = `Viewer ${Math.floor(100 + Math.random() * 900)}`;
    // Simulated random avatar url
    const profilePic = `https://i.pravatar.cc/100?u=${uId}`;
    
    let eventData = {
      uniqueId: uId,
      nickname: nickName,
      profilePictureUrl: profilePic
    };
    
    if (type === 'chat') {
      eventData.comment = document.getElementById('sim-chat-msg').value;
    } else if (type === 'gift') {
      const select = document.getElementById('sim-gift-type');
      const option = select.options[select.selectedIndex];
      eventData.giftName = select.value;
      eventData.coins = parseInt(option.getAttribute('data-coins'), 10);
      eventData.giftImage = option.getAttribute('data-img');
      eventData.giftCount = 1;
    } else if (type === 'like') {
      eventData.likeCount = parseInt(document.getElementById('sim-like-count').value, 10) || 10;
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

// Live Preview Panel Logic
const btnPrevChat = document.getElementById('btn-prev-chat');
const btnPrevFollow = document.getElementById('btn-prev-follow');
const btnPrevShare = document.getElementById('btn-prev-share');
const btnPrevGift = document.getElementById('btn-prev-gift');
const btnPrevSubscribe = document.getElementById('btn-prev-subscribe');
const btnPrevJoin = document.getElementById('btn-prev-join');
const btnPrevSubathon = document.getElementById('btn-prev-subathon');
const btnPrevGoal = document.getElementById('btn-prev-goal');
const btnPrevLeaderboard = document.getElementById('btn-prev-leaderboard');
const previewIframe = document.getElementById('preview-iframe');
const btnTriggerPreviewSim = document.getElementById('btn-trigger-preview-sim');
let activePreviewMode = 'chat';

const previewButtons = [
  btnPrevChat, btnPrevFollow, btnPrevShare, btnPrevGift, btnPrevSubscribe, btnPrevJoin, btnPrevSubathon, btnPrevGoal, btnPrevLeaderboard
];

if (btnPrevChat && btnPrevFollow && btnPrevShare && btnPrevGift && btnPrevSubscribe && btnPrevJoin && btnPrevSubathon && btnPrevGoal && previewIframe && btnTriggerPreviewSim) {
  btnPrevChat.addEventListener('click', () => {
    setActivePreview('chat', './widgets/chat.html', btnPrevChat);
  });
  btnPrevFollow.addEventListener('click', () => {
    setActivePreview('follow', './widgets/alert.html', btnPrevFollow);
  });
  btnPrevShare.addEventListener('click', () => {
    setActivePreview('share', './widgets/alert.html', btnPrevShare);
  });
  btnPrevGift.addEventListener('click', () => {
    setActivePreview('gift', './widgets/alert.html', btnPrevGift);
  });
  btnPrevSubscribe.addEventListener('click', () => {
    setActivePreview('subscribe', './widgets/alert.html', btnPrevSubscribe);
  });
  btnPrevJoin.addEventListener('click', () => {
    setActivePreview('join', './widgets/alert.html', btnPrevJoin);
  });
  btnPrevSubathon.addEventListener('click', () => {
    setActivePreview('subathon', './widgets/subathon.html', btnPrevSubathon);
  });
  btnPrevGoal.addEventListener('click', () => {
    setActivePreview('goal', './widgets/goal.html', btnPrevGoal);
  });
  if (btnPrevLeaderboard) {
    btnPrevLeaderboard.addEventListener('click', () => {
      setActivePreview('leaderboard', './widgets/leaderboard.html', btnPrevLeaderboard);
    });
  }

  // Automatically sync style values when changed
  const syncSelects = [
    'select-style-chat', 'select-style-follow', 'select-style-share', 
    'select-style-gift', 'select-style-subscribe', 'select-style-join', 'input-alert-duration',
    'input-goal-text', 'input-goal-target', 'input-goal-current',
    'rule-follow', 'rule-share', 'rule-like', 'rule-gift', 'rule-subscribe',
    'input-leaderboard-title', 'input-leaderboard-limit', 'select-leaderboard-style'
  ];
  syncSelects.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', syncPreviewStyle);
      el.addEventListener('input', syncPreviewStyle);
    }
  });

  previewIframe.addEventListener('load', syncPreviewStyle);

  btnTriggerPreviewSim.addEventListener('click', () => {
    const uId = `user_${Math.floor(1000 + Math.random() * 9000)}`;
    const nickName = `Previewer ${Math.floor(100 + Math.random() * 900)}`;
    const profilePic = `https://i.pravatar.cc/100?u=${uId}`;
    
    let eventData = {
      uniqueId: uId,
      nickname: nickName,
      profilePictureUrl: profilePic
    };

    let type = 'chat';
    
    if (activePreviewMode === 'chat') {
      type = 'chat';
      eventData.comment = "Ini contoh komentar live stream chat!";
    } else if (activePreviewMode === 'follow') {
      type = 'follow';
    } else if (activePreviewMode === 'share') {
      type = 'share';
    } else if (activePreviewMode === 'subscribe') {
      type = 'subscribe';
    } else if (activePreviewMode === 'join') {
      type = 'join';
    } else if (activePreviewMode === 'gift') {
      type = 'gift';
      eventData.giftName = "Mawar";
      eventData.coins = 1;
      eventData.giftImage = "https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/54c55986427d14cb8d5930e466be5211.png~tplv-obj.png";
      eventData.giftCount = 1;
    } else if (activePreviewMode === 'subathon') {
      type = 'follow'; // follow adds seconds
    } else if (activePreviewMode === 'goal') {
      type = 'gift';
      eventData.giftName = "Kopi";
      eventData.coins = 5;
      eventData.giftCount = 1;
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        event: 'simulateEvent',
        data: {
          type,
          data: eventData
        }
      }));
    }
  });
}

function syncPreviewStyle() {
  if (!previewIframe || !previewIframe.contentWindow) return;
  
  const chatStyle = document.getElementById('select-style-chat').value;
  const followStyle = document.getElementById('select-style-follow').value;
  const shareStyle = document.getElementById('select-style-share').value;
  const giftStyle = document.getElementById('select-style-gift').value;
  const subscribeStyle = document.getElementById('select-style-subscribe').value;
  const joinStyle = document.getElementById('select-style-join').value;
  const duration = parseInt(document.getElementById('input-alert-duration').value, 10) || 4000;

  try {
    const iframeWin = previewIframe.contentWindow;
    
    // Sync settings object in iframe context
    if (iframeWin.settings) {
      iframeWin.settings.chatStyle = chatStyle;
      iframeWin.settings.followStyle = followStyle;
      iframeWin.settings.shareStyle = shareStyle;
      iframeWin.settings.giftStyle = giftStyle;
      iframeWin.settings.subscribeStyle = subscribeStyle;
      iframeWin.settings.joinStyle = joinStyle;
      iframeWin.settings.alertDuration = duration;
      
      if (iframeWin.settings.rules) {
        iframeWin.settings.rules.follow = parseInt(document.getElementById('rule-follow').value, 10) || 5;
        iframeWin.settings.rules.share = parseInt(document.getElementById('rule-share').value, 10) || 10;
        iframeWin.settings.rules.like = parseInt(document.getElementById('rule-like').value, 10) || 1;
        iframeWin.settings.rules.gift = parseInt(document.getElementById('rule-gift').value, 10) || 2;
        iframeWin.settings.rules.subscribe = parseInt(document.getElementById('rule-subscribe').value, 10) || 30;
      }
    }
    
    // Sync Goals
    if (iframeWin.goals) {
      iframeWin.goals.text = document.getElementById('input-goal-text').value;
      iframeWin.goals.target = parseInt(document.getElementById('input-goal-target').value, 10) || 1000;
      iframeWin.goals.current = parseInt(document.getElementById('input-goal-current').value, 10) || 0;
      if (typeof iframeWin.updateGoalUI === 'function') {
        iframeWin.updateGoalUI();
      }
    }
    
    // Sync Chat Layout style class
    if (typeof iframeWin.updateStyle === 'function') {
      iframeWin.updateStyle(chatStyle);
    }
  } catch (err) {
    console.warn("Could not sync preview style to iframe:", err);
  }
}

function setActivePreview(mode, src, button) {
  activePreviewMode = mode;
  previewIframe.src = src;
  
  previewButtons.forEach(btn => {
    if (btn) btn.classList.remove('active');
  });
  if (button) button.classList.add('active');
}

// Gift Combo Simulator - send 5 rapid gifts of same type
const btnSimGiftCombo = document.getElementById('btn-sim-gift-combo');
if (btnSimGiftCombo) {
  btnSimGiftCombo.addEventListener('click', () => {
    const select = document.getElementById('sim-gift-combo-type');
    const option = select.options[select.selectedIndex];
    const giftName = select.value;
    const coinsPerGift = parseInt(option.getAttribute('data-coins'), 10);
    const giftImage = option.getAttribute('data-img');
    const uId = `user_combo_${Math.floor(1000 + Math.random() * 9000)}`;
    const nickName = `ComboViewer ${Math.floor(100 + Math.random() * 900)}`;
    const profilePic = `https://i.pravatar.cc/100?u=${uId}`;

    let delay = 0;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            event: 'simulateEvent',
            data: {
              type: 'gift',
              data: {
                uniqueId: uId,
                nickname: nickName,
                profilePictureUrl: profilePic,
                giftName: giftName,
                coins: coinsPerGift,
                giftImage: giftImage,
                giftCount: 1
              }
            }
          }));
        }
      }, delay);
      delay += 400; // 400ms interval between each gift
    }
    addLog(`[Combo Sim] Mengirim 5x ${giftName} beruntun dari @${nickName}`);
  });
}

// Init on load
window.addEventListener('DOMContentLoaded', () => {
  loadCustomSounds();
  initWebSocket();
});


