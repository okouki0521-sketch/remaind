/**
 * PastelMinder - Premium Mascot Reminder & Focus Assistant
 * Core Application Logic
 */

// --- APPLICATION STATE ---
const state = {
  reminders: [],
  activeCharacter: 'lumina',
  soundEnabled: true,
  vibrateEnabled: true,
  petHeartLevel: 20, // starts at 20% (Level 1)
  
  // Timer State
  timerDuration: 25 * 60, // 25 minutes default
  timerTimeLeft: 25 * 60,
  timerInterval: null,
  timerRunning: false,
  
  // Audio state
  audioCtx: null,
  activeAmbientSound: null, // 'rain' | 'waves' | 'forest' | null
  ambientNodes: {} // references to running synth nodes
};

// --- DATA DICTIONARIES (CHARACTER DIALOGS & QUOTES) ---
const mascotDialogs = {
  lumina: {
    welcome: [
      "こんにちは！今日の予定を教えてね。いつでも覚えるよ！🌟",
      "ルミナだよ！あなたの時間をきらきら輝かせる魔法をかけるね✨",
      "何か覚えておきたいことはある？準備万端だよ！"
    ],
    pet: [
      "わぁ、なでなでしてくれてありがとう！羽が喜びでパタパタしちゃう！🧚‍♀️",
      "えへへ、あったかくて優しい手だね。もっと頑張っちゃう！",
      "あなたのそばにいると、魔法のパワーがみなぎってくるよ！"
    ],
    feed: [
      "もぐもぐ…このこんぺいとう、星の味がしてとっても美味しい！🍬",
      "おやつタイム！これで頭の回転もバッチリ、予定もしっかり覚えるね！",
      "美味しいおやつをありがとう！きらきらエネルギーチャージ完了！"
    ],
    quotes: [
      "一歩ずつ、マイペースで進むのが一番ステキな近道なんだよ。🌸",
      "今日頑張ったことは、全部あなたの未来のきらめきになるよ！",
      "疲れたら深呼吸をしてね。ルミナがいつでも応援してるからね。"
    ],
    add: "了解です！魔法のメモ帳にしっかり記録したよ！指定の時間に呼んでね。🔔",
    alarm: "お時間ですよ！忘れずにやってみよう！頑張るあなたを応援してるよ！📣"
  },
  mochineko: {
    welcome: [
      "にゃ〜ん。今日はどんな予定があるのかにゃ？ごろごろ。",
      "もちねこだにゃ。あなたが予定を忘れないように、そばで見張ってるにゃ🐾",
      "のんびり、でもしっかり。やりたいことをメモしてにゃ。"
    ],
    pet: [
      "にゃ、にゃ〜ん…そこ、すごく気持ちいいにゃ…（ゴロゴロ…）😻",
      "なでなで大歓迎だにゃ。お返しにあなたの手のひらをスリスリするにゃ。",
      "ふにゃ〜、とろけちゃいそうだにゃ。あなたのこと大好きにゃ。"
    ],
    feed: [
      "カリカリ…うにゃー！この極上キャットフード、たまらんみゃ！🐟",
      "おやつをくれるなんて、なんて気がきく人間なんだにゃ！感謝するにゃ！",
      "ペロペロ…甘くて美味しいにゃ。これで次のリマインドまでバッチリだにゃ！"
    ],
    quotes: [
      "猫のように、時にはのんびりお昼寝するのも大切な仕事なんだにゃ。💤",
      "焦らなくても大丈夫だにゃ。明日は明日の風が吹くみゃ。",
      "完璧じゃなくてもいいにゃ。今のままで十分ハナマルだにゃ。"
    ],
    add: "おけにゃ！その予定、しっかり頭の毛づくろいと一緒に覚えておくみゃ。✍️",
    alarm: "お時間だにゃ！起きる時間、あるいはやる時間だにゃ！さあ、伸びをしてスタートにゃ！🐾"
  },
  robi: {
    welcome: [
      "システム起動！マスター、本日の予定を入力してください！🤖",
      "ロビです！私の超高性能プロセッサで、予定を1秒のズレもなく管理します！",
      "おぼえるタスクはありませんか？メモリーエリアは空いています！"
    ],
    pet: [
      "なでなでシグナルを受信！回路がじんわり温まっています！ビビッ⚡️",
      "マスターの手の温度を検知。大変心地よい刺激です。動作クロック上昇中！",
      "嬉しい機能がアクティブになりました！頭のアンテナがピコピコします！"
    ],
    feed: [
      "ガリガリ…ボルトチョコを検出！エネルギー充填率120%！⚡️",
      "高純度バッテリークッキーですね！処理速度が飛躍的にアップしました！",
      "燃料補給完了！これでバックグラウンド監視も超省電力でこなせます！"
    ],
    quotes: [
      "効率的なタスク管理のコツは、小さく分割して一つずつ処理することです。📈",
      "エラーが出ても大丈夫。それはバグではなく、成長のためのログです！",
      "今日もマスターの行動データは素晴らしい輝きを記録しています！"
    ],
    add: "タスク登録に成功しました！メモリーセクタへ安全に保存完了。定刻にシグナルを発信します。📡",
    alarm: "アラート！予定の時刻に達しました！タスク『%TEXT%』を実行してください！🚨"
  }
};

// --- DOM ELEMENTS ---
const elements = {
  body: document.body,
  btnSoundToggle: document.getElementById('btn-sound-toggle'),
  
  // Mascot Elements
  speechBubble: document.getElementById('speech-bubble'),
  mascots: {
    lumina: document.getElementById('mascot-lumina'),
    mochineko: document.getElementById('mascot-mochineko'),
    robi: document.getElementById('mascot-robi')
  },
  charSelectors: {
    lumina: document.getElementById('select-lumina'),
    mochineko: document.getElementById('select-mochineko'),
    robi: document.getElementById('select-robi')
  },
  
  // Panels & Navigation
  panels: {
    'panel-reminders': document.getElementById('panel-reminders'),
    'panel-timer': document.getElementById('panel-timer'),
    'panel-room': document.getElementById('panel-room')
  },
  navItems: document.querySelectorAll('.app-nav .nav-item'),
  
  // Reminder Input & List
  reminderText: document.getElementById('reminder-text'),
  btnVoice: document.getElementById('btn-voice'),
  reminderDate: document.getElementById('reminder-date'),
  reminderTime: document.getElementById('reminder-time'),
  btnAddReminder: document.getElementById('btn-add-reminder'),
  remindersList: document.getElementById('reminders-list'),
  filterTabs: document.querySelectorAll('.filter-tab'),
  presetBtns: document.querySelectorAll('.preset-btn'),
  
  // Focus Timer Elements
  timerMinutes: document.getElementById('timer-minutes'),
  timerSeconds: document.getElementById('timer-seconds'),
  timerProgress: document.querySelector('.timer-progress'),
  timerPresetBtns: document.querySelectorAll('.timer-preset-btn'),
  btnTimerToggle: document.getElementById('btn-timer-toggle'),
  btnTimerReset: document.getElementById('btn-timer-reset'),
  ambientBtns: document.querySelectorAll('.ambient-btn'),
  
  // Mascot Room Elements
  btnPetMascot: document.getElementById('btn-pet-mascot'),
  btnFeedMascot: document.getElementById('btn-feed-mascot'),
  btnRequestQuote: document.getElementById('btn-request-quote'),
  heartLevelBar: document.getElementById('heart-level-bar'),
  heartLevelText: document.getElementById('heart-level-text'),
  btnNotificationGrant: document.getElementById('btn-notification-grant'),
  chkVibrate: document.getElementById('chk-vibrate'),
  btnClearData: document.getElementById('btn-clear-data'),
  
  // Alarm Trigger Overlay
  alarmOverlay: document.getElementById('alarm-overlay'),
  alarmMascotSlot: document.getElementById('alarm-mascot-slot'),
  alarmReminderText: document.getElementById('alarm-reminder-text'),
  btnAlarmComplete: document.getElementById('btn-alarm-complete'),
  btnAlarmSnooze: document.getElementById('btn-alarm-snooze'),
  
  // Voice Overlay Elements
  voiceOverlay: document.getElementById('voice-overlay'),
  voiceLiveText: document.getElementById('voice-live-text'),
  btnVoiceCancel: document.getElementById('btn-voice-cancel')
};

// Current filter: 'active' or 'completed'
let currentFilter = 'active';

// --- INITIALIZATION ---
function init() {
  loadData();
  setupEventListeners();
  setDefaultDateTimeInputs();
  renderReminders();
  updateHeartProgress();
  
  // Register PWA Service Worker for offline and background notifications
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker registered successfully:', reg.scope))
      .catch(err => console.error('Service Worker registration failed:', err));
  }
  
  // Start the background checker for reminders (every second)
  setInterval(checkReminders, 1000);
}

// --- LOCAL STORAGE DATA LOAD/SAVE ---
function loadData() {
  try {
    const savedReminders = localStorage.getItem('pastel_reminders');
    state.reminders = savedReminders ? JSON.parse(savedReminders) : [];
    
    state.activeCharacter = localStorage.getItem('pastel_active_char') || 'lumina';
    state.soundEnabled = localStorage.getItem('pastel_sound') !== 'false';
    state.vibrateEnabled = localStorage.getItem('pastel_vibrate') !== 'false';
    state.petHeartLevel = parseInt(localStorage.getItem('pastel_heart') || '20', 10);
    
    // Apply initial configuration to UI
    switchCharacter(state.activeCharacter);
    updateSoundButtonUI();
    elements.chkVibrate.checked = state.vibrateEnabled;
    
    // Check if notification permission was already granted
    if (Notification.permission === 'granted') {
      elements.btnNotificationGrant.textContent = '許可済み';
      elements.btnNotificationGrant.classList.add('granted');
      elements.btnNotificationGrant.disabled = true;
    }
  } catch (e) {
    console.error("Local storage read error, resetting defaults.", e);
  }
}

function saveData() {
  try {
    localStorage.setItem('pastel_reminders', JSON.stringify(state.reminders));
    localStorage.setItem('pastel_active_char', state.activeCharacter);
    localStorage.setItem('pastel_sound', state.soundEnabled);
    localStorage.setItem('pastel_vibrate', state.vibrateEnabled);
    localStorage.setItem('pastel_heart', state.petHeartLevel);
  } catch (e) {
    console.error("Local storage write error.", e);
  }
}

// Set default inputs (Date: Today, Time: Now + 30 min)
function setDefaultDateTimeInputs() {
  const now = new Date();
  
  // Format Date YYYY-MM-DD
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  elements.reminderDate.value = `${yyyy}-${mm}-${dd}`;
  
  // Default Time: 30 minutes in the future rounded to nearest 5 mins
  const future = new Date(now.getTime() + 30 * 60 * 1000);
  const hour = String(future.getHours()).padStart(2, '0');
  const min = String(Math.round(future.getMinutes() / 5) * 5).padStart(2, '0');
  elements.reminderTime.value = `${hour}:${min}`;
}

// --- AUDIO UTILITIES (WEB AUDIO API CHIME & SYNTHS) ---

// Unlock browser audio context on user interaction
function initAudio() {
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.audioCtx.state === 'suspended') {
    state.audioCtx.resume();
  }
}

// Synthesize a beautiful pentatonic bell chime arpeggio
function playNotificationChime() {
  if (!state.soundEnabled) return;
  initAudio();
  
  const ctx = state.audioCtx;
  const now = ctx.currentTime;
  
  // Notes: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
  const notes = [523.25, 659.25, 784.00, 1046.50];
  
  notes.forEach((freq, idx) => {
    const playTime = now + (idx * 0.12); // cute arpeggio delay
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Smooth bell-like decay
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, playTime);
    
    // Add dynamic frequency vibrato for sparkle
    osc.frequency.exponentialRampToValueAtTime(freq * 1.005, playTime + 0.05);
    osc.frequency.exponentialRampToValueAtTime(freq, playTime + 0.3);
    
    gainNode.gain.setValueAtTime(0, playTime);
    gainNode.gain.linearRampToValueAtTime(0.3, playTime + 0.02); // fast attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, playTime + 0.8); // slow decay
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(playTime);
    osc.stop(playTime + 0.9);
  });
}

// Synthesize a soft pop sound for UI feedback
function playSoftPop() {
  if (!state.soundEnabled) return;
  initAudio();
  
  const ctx = state.audioCtx;
  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.08); // pitch sweep
  
  gainNode.gain.setValueAtTime(0.15, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.12);
}

// Ambient Noise Generator (Synthesizers)
function startAmbientSynth(type) {
  initAudio();
  stopAmbientSynth();
  
  const ctx = state.audioCtx;
  const now = ctx.currentTime;
  
  // 1. Noise Buffer Creator
  const bufferSize = ctx.sampleRate * 2;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1; // white noise
  }
  
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;
  
  const filter = ctx.createBiquadFilter();
  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(0, now);
  mainGain.gain.linearRampToValueAtTime(0.15, now + 1.5); // Fade in
  
  state.ambientNodes.source = noiseSource;
  state.ambientNodes.filter = filter;
  state.ambientNodes.gain = mainGain;
  
  if (type === 'rain') {
    // Rain Sound: Low-pass filtered noise with tiny amplitude mods
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, now);
    
    // Add tiny random amplitude crackles for drops
    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(1, now);
    
    const modOsc = ctx.createOscillator();
    modOsc.type = 'sine';
    modOsc.frequency.setValueAtTime(8, now); // 8 Hz LFO
    
    const modOscGain = ctx.createGain();
    modOscGain.gain.setValueAtTime(0.12, now);
    
    modOsc.connect(modOscGain);
    modOscGain.connect(modGain.gain);
    
    noiseSource.connect(modGain);
    modGain.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(ctx.destination);
    
    modOsc.start(now);
    state.ambientNodes.lfo = modOsc;
    
  } else if (type === 'waves') {
    // Ocean Waves: Deep bandpass noise swept slowly by a very low LFO
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(1.5, now);
    
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.12, now); // ~8 seconds wave swell cycle
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(250, now); // Sweep width
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    filter.frequency.setValueAtTime(320, now); // Midpoint frequency
    
    // Gentle volume modulation synced with swell
    const swellGain = ctx.createGain();
    swellGain.gain.setValueAtTime(0.3, now);
    
    const swellLFOGain = ctx.createGain();
    swellLFOGain.gain.setValueAtTime(0.2, now);
    lfo.connect(swellLFOGain);
    swellLFOGain.connect(swellGain.gain);
    
    noiseSource.connect(filter);
    filter.connect(swellGain);
    swellGain.connect(mainGain);
    mainGain.connect(ctx.destination);
    
    lfo.start(now);
    state.ambientNodes.lfo = lfo;
    
  } else if (type === 'forest') {
    // Forest: Low hum of wind + occasional synthesized bird chirps
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    
    // Wind gust slow LFO
    const windLFO = ctx.createOscillator();
    windLFO.type = 'sine';
    windLFO.frequency.setValueAtTime(0.08, now);
    
    const windLFOGain = ctx.createGain();
    windLFOGain.gain.setValueAtTime(200, now);
    windLFO.connect(windLFOGain);
    windLFOGain.connect(filter.frequency);
    
    noiseSource.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(ctx.destination);
    windLFO.start(now);
    
    state.ambientNodes.lfo = windLFO;
    
    // Forest Chimes trigger generator (simulates wind chimes or birds)
    state.ambientNodes.chimeInterval = setInterval(() => {
      if (!state.timerRunning) return;
      
      const cNow = ctx.currentTime;
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      
      chimeOsc.type = 'sine';
      // Random high frequency arpeggio notes
      const scale = [1500, 1800, 2200, 2700, 3100];
      const randomFreq = scale[Math.floor(Math.random() * scale.length)];
      chimeOsc.frequency.setValueAtTime(randomFreq, cNow);
      
      chimeGain.gain.setValueAtTime(0, cNow);
      chimeGain.gain.linearRampToValueAtTime(0.04, cNow + 0.05); // soft chime attack
      chimeGain.gain.exponentialRampToValueAtTime(0.001, cNow + 1.2); // long delay decay
      
      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      
      chimeOsc.start(cNow);
      chimeOsc.stop(cNow + 1.3);
    }, 4000); // Trigger every 4 seconds
  }
  
  noiseSource.start(now);
  state.activeAmbientSound = type;
}

function stopAmbientSynth() {
  const ctx = state.audioCtx;
  if (!ctx) return;
  
  const now = ctx.currentTime;
  
  // Clear bird chime timers
  if (state.ambientNodes.chimeInterval) {
    clearInterval(state.ambientNodes.chimeInterval);
  }
  
  // Gently fade out gain nodes to avoid harsh clicks
  if (state.ambientNodes.gain) {
    const prevGain = state.ambientNodes.gain;
    prevGain.gain.setValueAtTime(prevGain.gain.value, now);
    prevGain.gain.linearRampToValueAtTime(0, now + 0.5); // fade out over 0.5s
    
    setTimeout(() => {
      try {
        if (state.ambientNodes.source) state.ambientNodes.source.stop();
        if (state.ambientNodes.lfo) state.ambientNodes.lfo.stop();
      } catch (e) {}
    }, 600);
  }
  
  state.ambientNodes = {};
  state.activeAmbientSound = null;
}

// --- VIBRATION UTILITY ---
function triggerVibration(pattern) {
  if (state.vibrateEnabled && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
}

// --- MASCOT ROOM MANAGEMENT ---
function switchCharacter(charName) {
  state.activeCharacter = charName;
  saveData();
  
  // Update Body Theme CSS Classes
  elements.body.className = `character-${charName}`;
  
  // Toggle Active Mascot SVGs
  Object.keys(elements.mascots).forEach(key => {
    if (key === charName) {
      elements.mascots[key].classList.add('active');
    } else {
      elements.mascots[key].classList.remove('active');
    }
  });
  
  // Highlight active buttons
  Object.keys(elements.charSelectors).forEach(key => {
    if (key === charName) {
      elements.charSelectors[key].classList.add('active');
    } else {
      elements.charSelectors[key].classList.remove('active');
    }
  });
  
  // Change Character Welcoming dialogue
  setMascotSpeech(getRandomDialog('welcome'));
}

function getRandomDialog(type) {
  const char = state.activeCharacter;
  const list = mascotDialogs[char][type];
  if (Array.isArray(list)) {
    return list[Math.floor(Math.random() * list.length)];
  }
  return list; // Return direct string if it's not an array
}

function setMascotSpeech(text) {
  elements.speechBubble.textContent = text;
  
  // Trigger speech bubble animation bump
  elements.speechBubble.style.animation = 'none';
  void elements.speechBubble.offsetWidth; // trigger reflow
  elements.speechBubble.style.animation = 'float-bubble 3s ease-in-out infinite alternate';
}

function feedMascot() {
  initAudio();
  playSoftPop();
  
  // Add heart progress
  increaseHeartLevel(15);
  
  // Visual splash & say yummy dialog
  setMascotSpeech(getRandomDialog('feed'));
  triggerVibration([80, 50, 80]);
}

function petMascot() {
  initAudio();
  playSoftPop();
  
  // Add heart progress
  increaseHeartLevel(10);
  
  // Visual splash & say loving dialog
  setMascotSpeech(getRandomDialog('pet'));
  triggerVibration([60, 40, 60]);
}

function requestDailyQuote() {
  initAudio();
  playSoftPop();
  
  setMascotSpeech(getRandomDialog('quotes'));
  triggerVibration([40]);
}

function increaseHeartLevel(amount) {
  state.petHeartLevel = Math.min(100, state.petHeartLevel + amount);
  saveData();
  updateHeartProgress();
}

function updateHeartProgress() {
  elements.heartLevelBar.style.width = `${state.petHeartLevel}%`;
  
  // Map 0-100% to levels
  let lvl = 1;
  if (state.petHeartLevel >= 90) lvl = 5;
  else if (state.petHeartLevel >= 70) lvl = 4;
  else if (state.petHeartLevel >= 45) lvl = 3;
  else if (state.petHeartLevel >= 20) lvl = 2;
  
  elements.heartLevelText.textContent = `Lv.${lvl}`;
}

// --- REMINDER MANAGEMENT ---

function addReminder(text, dateStr, timeStr) {
  if (!text.trim()) {
    setMascotSpeech("おっと！覚えておく内容が書かれていないみたいだよ？");
    triggerVibration([100]);
    return;
  }
  
  const reminderDateTime = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  
  if (reminderDateTime <= now) {
    setMascotSpeech("あれれ？過去の時間は指定できないよ。これからの時間を教えてね！");
    triggerVibration([100]);
    return;
  }
  
  const id = Date.now().toString();
  const newReminder = {
    id,
    text: text.trim(),
    date: dateStr,
    time: timeStr,
    completed: false
  };
  
  state.reminders.push(newReminder);
  saveData();
  
  // Clear inputs
  elements.reminderText.value = '';
  setDefaultDateTimeInputs();
  
  renderReminders();
  
  // Speak happy confirmation
  setMascotSpeech(getRandomDialog('add'));
  playSoftPop();
  triggerVibration([50, 50]);
}

function toggleReminderComplete(id) {
  const index = state.reminders.findIndex(r => r.id === id);
  if (index !== -1) {
    state.reminders[index].completed = !state.reminders[index].completed;
    saveData();
    renderReminders();
    playSoftPop();
  }
}

function deleteReminder(id) {
  state.reminders = state.reminders.filter(r => r.id !== id);
  saveData();
  renderReminders();
  playSoftPop();
}

function renderReminders() {
  elements.remindersList.innerHTML = '';
  
  // Filter active vs completed
  const filtered = state.reminders.filter(r => {
    if (currentFilter === 'active') return !r.completed;
    if (currentFilter === 'completed') return r.completed;
  });
  
  // Sort by earliest scheduled first
  filtered.sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
  
  if (filtered.length === 0) {
    // Show empty state
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `
      <div class="empty-icon"><i class="fa-regular fa-note-sticky"></i></div>
      <p>今は${currentFilter === 'active' ? '未完了' : '完了した'}おぼえごとはありません。<br>のんびり過ごしてね！</p>
    `;
    elements.remindersList.appendChild(empty);
    return;
  }
  
  filtered.forEach(r => {
    const card = document.createElement('div');
    card.className = `reminder-card ${r.completed ? 'completed' : ''}`;
    
    // Check if overdue
    const isOverdue = new Date(`${r.date}T${r.time}`) < new Date() && !r.completed;
    
    // Readable Date display
    const d = new Date(`${r.date}T${r.time}`);
    const dateFormatted = `${d.getMonth() + 1}月${d.getDate()}日(${['日','月','火','水','木','金','土'][d.getDay()]}) ${r.time}`;
    
    card.innerHTML = `
      <div class="reminder-info">
        <span class="reminder-title">${escapeHTML(r.text)}</span>
        <span class="reminder-time ${isOverdue ? 'overdue' : ''}">
          <i class="fa-regular fa-clock"></i> ${dateFormatted} ${isOverdue ? '(遅れてるよ！)' : ''}
        </span>
      </div>
      <div class="reminder-actions">
        <button class="card-btn btn-complete" onclick="toggleReminderComplete('${r.id}')" title="完了">
          <i class="fa-solid ${r.completed ? 'fa-rotate-left' : 'fa-check'}"></i>
        </button>
        <button class="card-btn btn-delete" onclick="deleteReminder('${r.id}')" title="削除">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    `;
    elements.remindersList.appendChild(card);
  });
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// --- BACKGROUND REMINDER CHECKER & ALARM TRIGGER ---

let activeTriggeredReminder = null;

function checkReminders() {
  const now = new Date();
  
  // Format current local time key to match YYYY-MM-DD and HH:MM
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const currentDateStr = `${yyyy}-${mm}-${dd}`;
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const seconds = now.getSeconds();
  
  // Limit triggers to the first 5 seconds of the matched minute to avoid infinite loops
  if (seconds > 5) return;
  
  state.reminders.forEach(r => {
    if (!r.completed && r.date === currentDateStr && r.time === currentTimeStr && activeTriggeredReminder !== r.id) {
      triggerAlarm(r);
    }
  });
}

function triggerAlarm(reminder) {
  activeTriggeredReminder = reminder.id;
  
  // 1. Play synthesized bell chime
  playNotificationChime();
  
  // 2. Trigger rich Vibration (Alarm cadence: short bursts)
  triggerVibration([200, 100, 200, 100, 300, 150, 500]);
  
  // 3. Show System Push Notification (via Service Worker to support background display)
  if (Notification.permission === 'granted') {
    const notifyBody = mascotDialogs[state.activeCharacter].alarm.replace('%TEXT%', reminder.text);
    const options = {
      body: `【リマインド】${reminder.text}\n${notifyBody}`,
      icon: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/svgs/solid/wand-magic-sparkles.svg',
      vibrate: [200, 100, 200],
      tag: reminder.id,
      requireInteraction: true // keep notification active until user clicks
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification("PastelMinder", options);
      });
    } else {
      new Notification("PastelMinder", {
        body: options.body,
        icon: options.icon
      });
    }
  }
  
  // 4. Slide Up Alarm Screen Overlay
  elements.alarmReminderText.textContent = reminder.text;
  
  // Embed CURRENT ACTIVE mascot SVG in alarm overlay slot
  const activeSVG = document.querySelector(`.mascot-wrapper.active svg`);
  if (activeSVG) {
    elements.alarmMascotSlot.innerHTML = '';
    const clone = activeSVG.cloneNode(true);
    elements.alarmMascotSlot.appendChild(clone);
  }
  
  elements.alarmOverlay.classList.add('active');
}

function handleAlarmComplete() {
  if (activeTriggeredReminder) {
    toggleReminderComplete(activeTriggeredReminder);
  }
  closeAlarmOverlay();
}

function handleAlarmSnooze() {
  // Postpone alarm by 5 minutes in the future
  if (activeTriggeredReminder) {
    const index = state.reminders.findIndex(r => r.id === activeTriggeredReminder);
    if (index !== -1) {
      const now = new Date();
      const snoozeTime = new Date(now.getTime() + 5 * 60 * 1000); // +5 min
      
      const yyyy = snoozeTime.getFullYear();
      const mm = String(snoozeTime.getMonth() + 1).padStart(2, '0');
      const dd = String(snoozeTime.getDate()).padStart(2, '0');
      const hr = String(snoozeTime.getHours()).padStart(2, '0');
      const mn = String(snoozeTime.getMinutes()).padStart(2, '0');
      
      state.reminders[index].date = `${yyyy}-${mm}-${dd}`;
      state.reminders[index].time = `${hr}:${mn}`;
      saveData();
      
      setMascotSpeech("了解にゃ！眠いよね、あと5分したらまた呼びにくるからね！");
      renderReminders();
    }
  }
  closeAlarmOverlay();
}

function closeAlarmOverlay() {
  elements.alarmOverlay.classList.remove('active');
  activeTriggeredReminder = null;
  
  // Stop vibration
  if (navigator.vibrate) {
    navigator.vibrate(0);
  }
}

// --- FOCUS POMODORO TIMER MANAGEMENT ---

function setTimerDuration(minutes) {
  state.timerDuration = minutes * 60;
  state.timerTimeLeft = state.timerDuration;
  updateTimerDisplay();
  
  // Highlight active preset button
  elements.timerPresetBtns.forEach(btn => {
    if (parseInt(btn.dataset.duration, 10) === minutes) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function toggleTimer() {
  initAudio();
  playSoftPop();
  
  if (state.timerRunning) {
    // Pause
    clearInterval(state.timerInterval);
    state.timerRunning = false;
    elements.btnTimerToggle.innerHTML = '<i class="fa-solid fa-play"></i> スタート';
    stopAmbientSynth();
    
    // Update active ambient buttons UI
    elements.ambientBtns.forEach(btn => btn.classList.remove('active'));
    
  } else {
    // Start
    state.timerRunning = true;
    elements.btnTimerToggle.innerHTML = '<i class="fa-solid fa-pause"></i> 一時停止';
    
    // If a noise sound was preset, trigger synth!
    const activeAmbientBtn = document.querySelector('.ambient-btn.active');
    if (activeAmbientBtn) {
      startAmbientSynth(activeAmbientBtn.dataset.sound);
    }
    
    state.timerInterval = setInterval(() => {
      state.timerTimeLeft--;
      updateTimerDisplay();
      
      if (state.timerTimeLeft <= 0) {
        // Timer Complete!
        clearInterval(state.timerInterval);
        state.timerRunning = false;
        elements.btnTimerToggle.innerHTML = '<i class="fa-solid fa-play"></i> スタート';
        stopAmbientSynth();
        elements.ambientBtns.forEach(btn => btn.classList.remove('active'));
        
        // Complete alarms
        playNotificationChime();
        triggerVibration([300, 100, 300, 100, 500]);
        setMascotSpeech("素晴らしい！タイマー完了だよ！とってもよく頑張りました！大拍手！！🎉");
        increaseHeartLevel(20);
        
        // Return default time
        state.timerTimeLeft = state.timerDuration;
        updateTimerDisplay();
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  state.timerTimeLeft = state.timerDuration;
  elements.btnTimerToggle.innerHTML = '<i class="fa-solid fa-play"></i> スタート';
  updateTimerDisplay();
  stopAmbientSynth();
  elements.ambientBtns.forEach(btn => btn.classList.remove('active'));
  playSoftPop();
}

function updateTimerDisplay() {
  const m = Math.floor(state.timerTimeLeft / 60);
  const s = state.timerTimeLeft % 60;
  
  elements.timerMinutes.textContent = String(m).padStart(2, '0');
  elements.timerSeconds.textContent = String(s).padStart(2, '0');
  
  // Calculate SVG circular stroke offset: track radius is 85, length is 534
  const ratio = state.timerTimeLeft / state.timerDuration;
  const offset = 534 * (1 - ratio);
  elements.timerProgress.style.strokeDashoffset = offset;
}

// --- VOICE DICTATION & SPEECH PROCESSING ---

let recognition = null;
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new Speech();
  recognition.lang = 'ja-JP';
  recognition.interimResults = true;
  recognition.continuous = false;
}

function startVoiceInput() {
  if (!recognition) {
    setMascotSpeech("ごめんね、お使いのブラウザは音声入力に対応していないみたい。手入力で登録してね！");
    triggerVibration([150]);
    return;
  }
  
  initAudio();
  playSoftPop();
  
  elements.voiceLiveText.textContent = "音声認識を起動中...";
  elements.voiceOverlay.classList.add('active');
  triggerVibration([60]);
  
  recognition.start();
  
  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';
    
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }
    
    elements.voiceLiveText.textContent = finalTranscript || interimTranscript || "聞き取り中...";
    
    if (finalTranscript) {
      recognition.stop();
      setTimeout(() => {
        elements.voiceOverlay.classList.remove('active');
        processSpeechInput(finalTranscript);
      }, 700);
    }
  };
  
  recognition.onerror = (e) => {
    console.error("Speech recognition error:", e);
    elements.voiceLiveText.textContent = "エラーが発生しました";
    setTimeout(() => {
      elements.voiceOverlay.classList.remove('active');
    }, 1200);
  };
  
  recognition.onend = () => {
    elements.voiceOverlay.classList.remove('active');
  };
}

function processSpeechInput(transcript) {
  // Smart Regex Parsers to parse: "Task Title" + "DateTime Offset"
  let parsedText = transcript;
  let parsedMinutes = null;
  let parsedDateStr = elements.reminderDate.value;
  let parsedTimeStr = elements.reminderTime.value;
  
  // 1. Check for offset matches: "10分後", "5分後", "1時間後", "30分後"
  const minOffsetMatch = transcript.match(/(\d+)\s*分\s*後/);
  const hrOffsetMatch = transcript.match(/(\d+)\s*時間\s*後/);
  
  if (minOffsetMatch) {
    parsedMinutes = parseInt(minOffsetMatch[1], 10);
    parsedText = transcript.replace(minOffsetMatch[0], '');
  } else if (hrOffsetMatch) {
    parsedMinutes = parseInt(hrOffsetMatch[1], 10) * 60;
    parsedText = transcript.replace(hrOffsetMatch[0], '');
  }
  
  // Clean up filler speech like "にリマインドして", "を覚えて", "を追加"
  parsedText = parsedText.replace(/(に)?(リマインド|おぼえて|覚えて|追加|登録|教えて|いうタスク|というタスク|設定)/gi, '').trim();
  
  if (parsedMinutes !== null) {
    // Fill values based on offset
    const targetDate = new Date(Date.now() + parsedMinutes * 60 * 1000);
    
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    parsedDateStr = `${yyyy}-${mm}-${dd}`;
    
    const hr = String(targetDate.getHours()).padStart(2, '0');
    const mn = String(targetDate.getMinutes()).padStart(2, '0');
    parsedTimeStr = `${hr}:${mn}`;
    
    // Directly add
    addReminder(parsedText || "音声リマインダー", parsedDateStr, parsedTimeStr);
  } else {
    // If no offsets matched, pre-fill text input to let them customize time
    elements.reminderText.value = parsedText;
    setMascotSpeech(`「${parsedText}」を聞き取ったよ！いつ教えてほしいか設定してね！`);
  }
}

// --- GLOBAL EVENT LISTENERS BINDINGS ---
function setupEventListeners() {
  
  // Sound Switcher Header Icon
  elements.btnSoundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    saveData();
    updateSoundButtonUI();
    playSoftPop();
  });
  
  // Character Picker Buttons
  Object.keys(elements.charSelectors).forEach(key => {
    elements.charSelectors[key].addEventListener('click', () => {
      switchCharacter(key);
      initAudio();
      playSoftPop();
      triggerVibration([50]);
    });
  });
  
  // Mascot Tap directly triggers talking dialogue
  Object.keys(elements.mascots).forEach(key => {
    elements.mascots[key].addEventListener('click', () => {
      initAudio();
      playSoftPop();
      
      // Random dialog
      setMascotSpeech(getRandomDialog('welcome'));
      triggerVibration([40]);
    });
  });
  
  // Navigation Tabs Switching
  elements.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const targetPanel = e.currentTarget.dataset.target;
      
      // Update nav class
      elements.navItems.forEach(n => n.classList.remove('active'));
      e.currentTarget.classList.add('active');
      
      // Toggle panels display
      Object.keys(elements.panels).forEach(panelId => {
        if (panelId === targetPanel) {
          elements.panels[panelId].classList.add('active');
        } else {
          elements.panels[panelId].classList.remove('active');
        }
      });
      
      initAudio();
      playSoftPop();
      triggerVibration([40]);
    });
  });
  
  // Voice Input Buttons
  elements.btnVoice.addEventListener('click', startVoiceInput);
  elements.btnVoiceCancel.addEventListener('click', () => {
    if (recognition) {
      recognition.stop();
    }
    elements.voiceOverlay.classList.remove('active');
    playSoftPop();
  });
  
  // Quick Preset Buttons Offset calculations
  elements.presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const val = e.currentTarget.dataset.time;
      const now = new Date();
      
      initAudio();
      playSoftPop();
      triggerVibration([40]);
      
      if (val === 'tomorrow-9') {
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        elements.reminderDate.value = `${yyyy}-${mm}-${dd}`;
        elements.reminderTime.value = "09:00";
      } else {
        const offsetMin = parseInt(val, 10);
        const target = new Date(now.getTime() + offsetMin * 60 * 1000);
        const yyyy = target.getFullYear();
        const mm = String(target.getMonth() + 1).padStart(2, '0');
        const dd = String(target.getDate()).padStart(2, '0');
        
        elements.reminderDate.value = `${yyyy}-${mm}-${dd}`;
        
        const hr = String(target.getHours()).padStart(2, '0');
        const mn = String(target.getMinutes()).padStart(2, '0');
        elements.reminderTime.value = `${hr}:${mn}`;
      }
    });
  });
  
  // Add Reminder Button Submit
  elements.btnAddReminder.addEventListener('click', () => {
    const txt = elements.reminderText.value;
    const d = elements.reminderDate.value;
    const t = elements.reminderTime.value;
    addReminder(txt, d, t);
  });
  
  // Filter Tab Lists Complete vs Active toggles
  elements.filterTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      currentFilter = e.currentTarget.dataset.filter;
      
      elements.filterTabs.forEach(t => t.classList.remove('active'));
      e.currentTarget.classList.add('active');
      
      renderReminders();
      playSoftPop();
      triggerVibration([30]);
    });
  });
  
  // Alarm buttons Action triggers
  elements.btnAlarmComplete.addEventListener('click', handleAlarmComplete);
  elements.btnAlarmSnooze.addEventListener('click', handleAlarmSnooze);
  
  // Pomodoro Focus presets duration
  elements.timerPresetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const min = parseInt(e.currentTarget.dataset.duration, 10);
      setTimerDuration(min);
      playSoftPop();
      triggerVibration([30]);
    });
  });
  
  // Focus Timer Actions
  elements.btnTimerToggle.addEventListener('click', toggleTimer);
  elements.btnTimerReset.addEventListener('click', resetTimer);
  
  // Ambient Sound togglers in timer view
  elements.ambientBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const type = e.currentTarget.dataset.sound;
      
      initAudio();
      playSoftPop();
      triggerVibration([40]);
      
      if (e.currentTarget.classList.contains('active')) {
        // Toggle off
        e.currentTarget.classList.remove('active');
        stopAmbientSynth();
      } else {
        // Toggle on
        elements.ambientBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        if (state.timerRunning) {
          startAmbientSynth(type);
        } else {
          setMascotSpeech("タイマーが開始されると、この環境音が自動で再生されるよ！");
        }
      }
    });
  });
  
  // Mascot Interaction Room actions
  elements.btnPetMascot.addEventListener('click', petMascot);
  elements.btnFeedMascot.addEventListener('click', feedMascot);
  elements.btnRequestQuote.addEventListener('click', requestDailyQuote);
  
  // Push Notification permission granteer
  elements.btnNotificationGrant.addEventListener('click', () => {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        elements.btnNotificationGrant.textContent = '許可済み';
        elements.btnNotificationGrant.classList.add('granted');
        elements.btnNotificationGrant.disabled = true;
        setMascotSpeech("プッシュ通知を許可してくれてありがとう！バックグラウンドでも完璧に呼ぶね！🌟");
        playNotificationChime();
        triggerVibration([100, 50, 100]);
      } else {
        setMascotSpeech("通知が拒否されちゃった。予定の通知が受け取れなくなるかも…ブラウザの設定から変更してね。");
      }
    });
  });
  
  // Vibrate setting checkbox toggle
  elements.chkVibrate.addEventListener('change', (e) => {
    state.vibrateEnabled = e.target.checked;
    saveData();
    playSoftPop();
    if (state.vibrateEnabled) {
      triggerVibration([100]);
    }
  });
  
  // Wipe database setting
  elements.btnClearData.addEventListener('click', () => {
    if (confirm("本当に保存されているリマインダーやお部屋のデータを全てリセットしますか？")) {
      localStorage.clear();
      state.reminders = [];
      state.petHeartLevel = 20;
      state.activeCharacter = 'lumina';
      state.soundEnabled = true;
      state.vibrateEnabled = true;
      
      saveData();
      switchCharacter('lumina');
      renderReminders();
      updateHeartProgress();
      
      setMascotSpeech("データをきれいにクリアしたよ。また新しく予定を作っていこうね！🐾");
      triggerVibration([300, 100, 300]);
    }
  });
}

function updateSoundButtonUI() {
  if (state.soundEnabled) {
    elements.btnSoundToggle.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
    elements.btnSoundToggle.style.opacity = '1';
  } else {
    elements.btnSoundToggle.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
    elements.btnSoundToggle.style.opacity = '0.65';
  }
}

// Global hooks for onclick events in dynamically generated HTML
window.toggleReminderComplete = toggleReminderComplete;
window.deleteReminder = deleteReminder;

// Execute App on load
window.addEventListener('DOMContentLoaded', init);
