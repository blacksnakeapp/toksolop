const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// TikTok Live Connector (imported safely)
// v2.x: WebcastReceiver renamed to TikTokLiveConnection
let TikTokLiveConnection;
try {
  const connector = require('tiktok-live-connector');
  TikTokLiveConnection = connector.TikTokLiveConnection;
  if (!TikTokLiveConnection) {
    // Fallback: some builds may still export as WebcastReceiver
    TikTokLiveConnection = connector.WebcastReceiver;
  }
} catch (e) {
  console.warn("TikTok Live Connector library not loaded yet or failed to import:", e.message);
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Resolve local working directory for config and custom sounds (next to .exe)
const isPackaged = typeof process.pkg !== 'undefined';
const localDir = isPackaged ? path.dirname(process.execPath) : __dirname;
const configPath = path.join(localDir, 'config.json');
const soundsDir = path.join(localDir, 'custom_sounds');

// Ensure custom_sounds directory exists
if (!fs.existsSync(soundsDir)) {
  try {
    fs.mkdirSync(soundsDir, { recursive: true });
    console.log(`Created custom sounds directory at: ${soundsDir}`);
  } catch (err) {
    console.error(`Failed to create custom sounds directory:`, err);
  }
}

// Serve embedded dashboard & overlays (inside packaged binary)
// For pkg, __dirname points to the virtual filesystem inside the exe
app.use(express.static(path.join(__dirname, 'public')));

// Serve custom sound files next to the exe
app.use('/sounds/custom', express.static(soundsDir));

// Initial default configuration
const defaultSettings = {
  tiktokUsername: "",
  chatStyle: "1", // 1 to 10
  alertStyle: "1", // 1 to 10
  followStyle: "1", // 1 to 10
  shareStyle: "1", // 1 to 10
  giftStyle: "1", // 1 to 10
  subscribeStyle: "1", // 1 to 10
  joinStyle: "1", // 1 to 10
  alertDuration: 4000,
  alertVolume: 0.5,
  subathonSeconds: 3600,
  subathonActive: false,
  leaderboardLimit: 5,
  leaderboardStyle: "1",
  leaderboardTitle: "TOP DONATOR",
  rules: {
    follow: 5, // +5s
    share: 10, // +10s
    like: 1,   // +1s per 100 likes
    gift: 2,   // +2s per coin
    subscribe: 30, // +30s
    join: 0 // +0s
  },
  goals: {
    target: 1000,
    current: 0,
    text: "Target Upgrade PC"
  },
  soundboard: {
    // Event to Sound mapping (custom files or synth frequencies)
    follow: "synth_cheer",
    share: "synth_ding",
    gift: "synth_coin",
    subscribe: "synth_levelup",
    join: "synth_ding",
    custom1: "synth_horn",
    custom2: "synth_clapping",
    custom3: "synth_bell",
    custom4: "synth_error"
  }
};

// Load settings
let settings = { ...defaultSettings };
if (fs.existsSync(configPath)) {
  try {
    const rawData = fs.readFileSync(configPath, 'utf8');
    settings = JSON.parse(rawData);
    console.log("Settings loaded successfully.");
  } catch (e) {
    console.warn("Failed to parse config.json, using defaults.");
  }
} else {
  fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), 'utf8');
  console.log("Default config.json created next to the application.");
}

// Live Stream Session Statistics
let streamStats = {
  activeViewers: 0,
  totalUniqueViewers: 0,
  totalLikes: 0,
  totalCoins: 0
};
const uniqueViewersSet = new Set();

// Persistent Leaderboard Data
const leaderboardPath = path.join(localDir, 'leaderboard.json');
let leaderboardData = {};

if (fs.existsSync(leaderboardPath)) {
  try {
    leaderboardData = JSON.parse(fs.readFileSync(leaderboardPath, 'utf8'));
    console.log("Leaderboard data loaded successfully.");
  } catch (err) {
    console.warn("Failed to parse leaderboard.json, starting fresh.");
    leaderboardData = {};
  }
}

function saveLeaderboard() {
  try {
    fs.writeFileSync(leaderboardPath, JSON.stringify(leaderboardData, null, 2), 'utf8');
  } catch (err) {
    console.error("Failed to save leaderboard data:", err.message);
  }
}

function getSortedLeaderboard() {
  return Object.values(leaderboardData)
    .sort((a, b) => b.totalCoins - a.totalCoins);
}

function updateLeaderboard(uniqueId, nickname, profilePictureUrl, coins) {
  if (coins <= 0) return;
  if (!leaderboardData[uniqueId]) {
    leaderboardData[uniqueId] = {
      uniqueId,
      nickname: nickname || uniqueId,
      profilePictureUrl: profilePictureUrl || 'https://i.pravatar.cc/100',
      totalCoins: 0
    };
  }
  leaderboardData[uniqueId].totalCoins += coins;
  leaderboardData[uniqueId].nickname = nickname || leaderboardData[uniqueId].nickname;
  if (profilePictureUrl) {
    leaderboardData[uniqueId].profilePictureUrl = profilePictureUrl;
  }
  saveLeaderboard();
  broadcast({ event: 'leaderboard', data: getSortedLeaderboard() });
}

// Create HTTP Server
const server = http.createServer(app);

// Create WebSocket Server
const wss = new WebSocket.Server({ server });

// Broadcast helper
function broadcast(payload) {
  const dataString = JSON.stringify(payload);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(dataString);
    }
  });
}

// REST API Endpoints
app.get('/api/settings', (req, res) => {
  res.json(settings);
});

app.post('/api/settings', (req, res) => {
  settings = { ...settings, ...req.body };
  try {
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), 'utf8');
    broadcast({ event: 'settingsUpdated', data: settings });
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: "Failed to save settings file." });
  }
});

app.get('/api/sounds', (req, res) => {
  // Read custom sounds dir
  fs.readdir(soundsDir, (err, files) => {
    if (err) {
      return res.json([]);
    }
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.mp4'];
    const soundFiles = files.filter(file => {
      return audioExtensions.includes(path.extname(file).toLowerCase());
    });
    res.json(soundFiles);
  });
});

app.get('/api/stats', (req, res) => {
  res.json(streamStats);
});

app.post('/api/stats/reset', (req, res) => {
  streamStats = {
    activeViewers: 0,
    totalUniqueViewers: 0,
    totalLikes: 0,
    totalCoins: 0
  };
  uniqueViewersSet.clear();
  broadcast({ event: 'stats', data: streamStats });
  res.json({ success: true });
});

// TikTok Live Connection Instance
let tiktokConnection = null;

function connectTikTok(username) {
  if (!TikTokLiveConnection) {
    console.error("TikTok Live Connector library not loaded. Cannot connect.");
    broadcast({ event: 'tiktokStatus', data: { status: 'error', message: 'TikTok Connector library missing' } });
    return;
  }

  if (tiktokConnection) {
    try {
      tiktokConnection.disconnect();
    } catch(e){}
    tiktokConnection = null;
  }

  console.log(`Attempting to connect to TikTok username: ${username}`);
  broadcast({ event: 'tiktokStatus', data: { status: 'connecting', username } });

  try {
    tiktokConnection = new TikTokLiveConnection(username, {
      enableExtendedGiftInfo: true
    });

    tiktokConnection.connect()
      .then(state => {
        console.log(`Connected to room: ${state.roomId}`);
        broadcast({ event: 'tiktokStatus', data: { status: 'connected', username, roomId: state.roomId } });
        
        // Seed unique viewers count
        streamStats.activeViewers = state.viewerCount || 0;
        broadcast({ event: 'stats', data: streamStats });
      })
      .catch(err => {
        console.error("Failed to connect to TikTok Live:", err);
        broadcast({ event: 'tiktokStatus', data: { status: 'disconnected', username, error: err.message } });
        tiktokConnection = null;
      });

    // Helper: extract user fields from v2.x nested structure
    // Tries every known path for profile picture across v2.x variations
    let _debugLoggedOnce = false;
    function extractUser(data) {
      const u = data.user || data;

      // Debug: log raw user object ONCE to help diagnose field names
      if (!_debugLoggedOnce && data.user) {
        _debugLoggedOnce = true;
        console.log('[DEBUG] Raw data.user sample:', JSON.stringify(data.user, null, 2).substring(0, 800));
      }

      // Try every known profile picture path in v2.x
      const pic =
        (u.profilePicture  && u.profilePicture.urlList  && u.profilePicture.urlList[0])  ||
        (u.avatarThumb     && u.avatarThumb.urlList     && u.avatarThumb.urlList[0])     ||
        (u.avatarMedium    && u.avatarMedium.urlList    && u.avatarMedium.urlList[0])    ||
        (u.avatarLarger    && u.avatarLarger.urlList    && u.avatarLarger.urlList[0])    ||
        (u.avatar          && u.avatar.urlList          && u.avatar.urlList[0])          ||
        (u.profilePicture  && typeof u.profilePicture === 'string' && u.profilePicture)  ||
        u.profilePictureUrl || data.profilePictureUrl || null;

      return {
        uniqueId: u.uniqueId || data.uniqueId || 'unknown',
        nickname: u.nickname || u.displayId || data.nickname || u.uniqueId || 'Unknown',
        profilePictureUrl: pic
      };
    }

    // Handle TikTok events
    tiktokConnection.on('chat', data => {
      const user = extractUser(data);
      uniqueViewersSet.add(user.uniqueId);
      streamStats.totalUniqueViewers = uniqueViewersSet.size;
      
      const payload = {
        uniqueId: user.uniqueId,
        nickname: user.nickname,
        profilePictureUrl: user.profilePictureUrl,
        comment: data.comment,
        isModerator: data.isModerator || (data.user && data.user.isModerator),
        isSubscriber: data.isSubscriber || (data.user && data.user.isSubscriber)
      };
      
      broadcast({ event: 'chat', data: payload });
      broadcast({ event: 'stats', data: streamStats });
    });

    tiktokConnection.on('gift', data => {
      const user = extractUser(data);
      uniqueViewersSet.add(user.uniqueId);
      streamStats.totalUniqueViewers = uniqueViewersSet.size;
      
      const diamondCount = data.diamondCount || (data.gift && data.gift.diamondCount) || 1;
      const repeatCount = data.repeatCount || 1;
      const coinCount = diamondCount * repeatCount;
      streamStats.totalCoins += coinCount;
      
      // Update Goal progress
      settings.goals.current += coinCount;

      const giftName = data.giftName || (data.gift && data.gift.name) || 'Gift';
      const giftImage = data.giftPictureUrl || (data.gift && data.gift.imageUrl) || null;
      
      const payload = {
        uniqueId: user.uniqueId,
        nickname: user.nickname,
        profilePictureUrl: user.profilePictureUrl,
        giftName: giftName,
        giftCount: repeatCount,
        giftImage: giftImage,
        coins: coinCount
      };

      broadcast({ event: 'gift', data: payload });
      broadcast({ event: 'stats', data: streamStats });
      updateLeaderboard(payload.uniqueId, payload.nickname, payload.profilePictureUrl, coinCount);
      
      // Auto-save goals progress
      fs.writeFile(configPath, JSON.stringify(settings, null, 2), () => {});
    });

    tiktokConnection.on('follow', data => {
      const user = extractUser(data);
      uniqueViewersSet.add(user.uniqueId);
      streamStats.totalUniqueViewers = uniqueViewersSet.size;

      const payload = {
        uniqueId: user.uniqueId,
        nickname: user.nickname,
        profilePictureUrl: user.profilePictureUrl
      };

      broadcast({ event: 'follow', data: payload });
      broadcast({ event: 'stats', data: streamStats });
    });

    tiktokConnection.on('share', data => {
      const user = extractUser(data);
      uniqueViewersSet.add(user.uniqueId);
      streamStats.totalUniqueViewers = uniqueViewersSet.size;

      const payload = {
        uniqueId: user.uniqueId,
        nickname: user.nickname,
        profilePictureUrl: user.profilePictureUrl
      };

      broadcast({ event: 'share', data: payload });
      broadcast({ event: 'stats', data: streamStats });
    });

    tiktokConnection.on('subscribe', data => {
      const user = extractUser(data);
      uniqueViewersSet.add(user.uniqueId);
      streamStats.totalUniqueViewers = uniqueViewersSet.size;

      const payload = {
        uniqueId: user.uniqueId,
        nickname: user.nickname,
        profilePictureUrl: user.profilePictureUrl
      };

      broadcast({ event: 'subscribe', data: payload });
      broadcast({ event: 'stats', data: streamStats });
    });

    tiktokConnection.on('member', data => {
      const user = extractUser(data);
      uniqueViewersSet.add(user.uniqueId);
      streamStats.totalUniqueViewers = uniqueViewersSet.size;

      const payload = {
        uniqueId: user.uniqueId,
        nickname: user.nickname,
        profilePictureUrl: user.profilePictureUrl
      };

      broadcast({ event: 'join', data: payload });
      broadcast({ event: 'stats', data: streamStats });
    });

    tiktokConnection.on('like', data => {
      const user = extractUser(data);
      uniqueViewersSet.add(user.uniqueId);
      streamStats.totalUniqueViewers = uniqueViewersSet.size;
      
      streamStats.totalLikes += (data.likeCount || data.totalLikeCount || 1);

      const payload = {
        uniqueId: user.uniqueId,
        nickname: user.nickname,
        profilePictureUrl: user.profilePictureUrl,
        likeCount: data.likeCount || data.totalLikeCount || 1
      };

      broadcast({ event: 'like', data: payload });
      broadcast({ event: 'stats', data: streamStats });
    });

    tiktokConnection.on('roomUser', data => {
      streamStats.activeViewers = data.viewerCount || 0;
      broadcast({ event: 'stats', data: streamStats });
    });

    tiktokConnection.on('disconnected', () => {
      console.log("TikTok Connection disconnected.");
      broadcast({ event: 'tiktokStatus', data: { status: 'disconnected', username } });
      tiktokConnection = null;
    });

    tiktokConnection.on('error', err => {
      console.error("TikTok Connection error:", err);
      broadcast({ event: 'tiktokStatus', data: { status: 'error', username, error: err.message } });
    });

  } catch (err) {
    console.error("Error setting up TikTok live connector:", err);
    broadcast({ event: 'tiktokStatus', data: { status: 'disconnected', error: err.message } });
  }
}

function disconnectTikTok() {
  if (tiktokConnection) {
    try {
      tiktokConnection.disconnect();
      console.log("Disconnected manually.");
    } catch(e) {
      console.error("Disconnect error:", e);
    }
    tiktokConnection = null;
  }
  broadcast({ event: 'tiktokStatus', data: { status: 'disconnected' } });
}

// WebSocket Message Handlers
wss.on('connection', ws => {
  console.log("WS Client connected.");
  
  // Send current settings, stats & leaderboard to newly connected widget/dock
  ws.send(JSON.stringify({ event: 'settings', data: settings }));
  ws.send(JSON.stringify({ event: 'stats', data: streamStats }));
  ws.send(JSON.stringify({ event: 'leaderboard', data: getSortedLeaderboard() }));
  
  if (tiktokConnection) {
    ws.send(JSON.stringify({ event: 'tiktokStatus', data: { status: 'connected', username: settings.tiktokUsername } }));
  } else {
    ws.send(JSON.stringify({ event: 'tiktokStatus', data: { status: 'disconnected' } }));
  }

  ws.on('message', message => {
    try {
      const payload = JSON.parse(message);
      
      // Handle events triggered from simulator or dock controls
      switch (payload.event) {
        case 'connect':
          settings.tiktokUsername = payload.data.username;
          fs.writeFile(configPath, JSON.stringify(settings, null, 2), () => {});
          connectTikTok(payload.data.username);
          break;
          
        case 'disconnect':
          disconnectTikTok();
          break;
          
        case 'resetLeaderboard':
          leaderboardData = {};
          saveLeaderboard();
          broadcast({ event: 'leaderboard', data: [] });
          console.log("Leaderboard reset successfully.");
          break;
          
        case 'simulateEvent':
          // Simulate incoming TikTok live stream events
          const simType = payload.data.type;
          const simData = payload.data.data;
          
          console.log(`Simulating event: ${simType}`);
          
          if (simType === 'chat') {
            uniqueViewersSet.add(simData.uniqueId);
            streamStats.totalUniqueViewers = uniqueViewersSet.size;
            broadcast({ event: 'chat', data: simData });
          } else if (simType === 'gift') {
            uniqueViewersSet.add(simData.uniqueId);
            streamStats.totalUniqueViewers = uniqueViewersSet.size;
            streamStats.totalCoins += simData.coins;
            settings.goals.current += simData.coins;
            broadcast({ event: 'gift', data: simData });
            updateLeaderboard(simData.uniqueId, simData.nickname, simData.profilePictureUrl, simData.coins);
            fs.writeFile(configPath, JSON.stringify(settings, null, 2), () => {});
          } else if (simType === 'follow') {
            uniqueViewersSet.add(simData.uniqueId);
            streamStats.totalUniqueViewers = uniqueViewersSet.size;
            broadcast({ event: 'follow', data: simData });
          } else if (simType === 'share') {
            uniqueViewersSet.add(simData.uniqueId);
            streamStats.totalUniqueViewers = uniqueViewersSet.size;
            broadcast({ event: 'share', data: simData });
          } else if (simType === 'subscribe') {
            uniqueViewersSet.add(simData.uniqueId);
            streamStats.totalUniqueViewers = uniqueViewersSet.size;
            broadcast({ event: 'subscribe', data: simData });
          } else if (simType === 'join') {
            uniqueViewersSet.add(simData.uniqueId);
            streamStats.totalUniqueViewers = uniqueViewersSet.size;
            broadcast({ event: 'join', data: simData });
          } else if (simType === 'like') {
            uniqueViewersSet.add(simData.uniqueId);
            streamStats.totalUniqueViewers = uniqueViewersSet.size;
            streamStats.totalLikes += simData.likeCount;
            broadcast({ event: 'like', data: simData });
          } else if (simType === 'stats') {
            streamStats.activeViewers = simData.activeViewers;
            streamStats.totalUniqueViewers = simData.totalUniqueViewers;
          }
          
          broadcast({ event: 'stats', data: streamStats });
          break;

        case 'triggerSound':
          // Manual soundboard playback command to widgets
          broadcast({ event: 'playSound', data: payload.data });
          break;
          
        default:
          console.log("Unknown WS event:", payload.event);
      }
    } catch (e) {
      console.error("Error parsing WS client message:", e);
    }
  });

  ws.on('close', () => {
    console.log("WS Client disconnected.");
  });
});

// Start listening
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`   SolopTik Server is running on http://localhost:${PORT}`);
  console.log(`=======================================================`);
  console.log(`   Dashboard:      http://localhost:${PORT}/index.html`);
  console.log(`   Control Dock:   http://localhost:${PORT}/control-dock.html`);
  console.log(`   OBS Side Dock:  http://localhost:${PORT}/obs-dock.html`);
  console.log(`=======================================================`);
  console.log(`   Overlays (Add as Browser Sources in OBS):`);
  console.log(`   - Alert:        http://localhost:${PORT}/widgets/alert.html`);
  console.log(`   - Chat:         http://localhost:${PORT}/widgets/chat.html`);
  console.log(`   - Subathon:     http://localhost:${PORT}/widgets/subathon.html`);
  console.log(`   - Gift Goal:    http://localhost:${PORT}/widgets/goal.html`);
  console.log(`=======================================================`);
});
