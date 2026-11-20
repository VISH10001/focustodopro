import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { loadUserData, saveUserData } from './cloudSync';  
import {
  Search, Sun, Calendar, CalendarDays, CheckCircle2, Inbox, Plus, Play, Pause,
  Volume2, VolumeX, Maximize2, Minimize2, BarChart3,
  Settings, Trophy, Bell, Crown, ChevronDown, ChevronRight, ChevronLeft,
  Trash2, Check, X, Clock, Sliders, User, Palette,
  FolderKanban, Info, Download, RefreshCw, Tag, Folder, MoreHorizontal,
  Sunrise, AlertCircle, Flag, LayoutGrid, CalendarCheck, CalendarClock, Music, Timer,
  Archive, RotateCcw
} from 'lucide-react';

// ============================================================================
// 1. WEB AUDIO API SOUND & WHITE NOISE ENGINE (Zero External Audio Dependencies)
// ============================================================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.noiseNode = null;
    this.gainNode = null;
    this.tickInterval = null;
    this.activeNoise = 'none';
    this.noiseVolume = 0.7;
    this.alarmVolume = 0.8;
    this.clickVolume = 0.65;
    this.clickEnabled = true;
    this.clickStyle = 'Alien Tech Click';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setAlarmVolume(vol) {
    this.alarmVolume = Math.min(1, Math.max(0, vol));
  }

  setNoiseVolume(vol) {
    this.noiseVolume = Math.min(1, Math.max(0, vol));
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setTargetAtTime(this.noiseVolume * 0.25, this.ctx.currentTime, 0.05);
    }
  }

  setClickSettings(enabled, vol, style = 'Alien Tech Click') {
    this.clickEnabled = Boolean(enabled);
    this.clickVolume = Math.min(1, Math.max(0, vol));
    if (style) this.clickStyle = style;
  }

  playTechClick(overrideStyle = null) {
    if (!this.clickEnabled || this.clickVolume <= 0) return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      const peak = Math.max(0.008, 0.2 * this.clickVolume);
      const style = overrideStyle || this.clickStyle || 'Alien Tech Click';

      if (style === 'Cyber Blip') {
        // Sound 2: Descending/ascending alien liquid synth blip
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, now);
        osc.frequency.exponentialRampToValueAtTime(1680, now + 0.025);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.075);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.085);
        return;
      }

      if (style === 'Telemetry Pulse') {
        // Sound 4: Rapid dual alien computer telemetry chirp
        [1560, 2080].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.032);
          gain.gain.setValueAtTime(0.001, now + idx * 0.032);
          gain.gain.exponentialRampToValueAtTime(peak * 0.85, now + idx * 0.032 + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.032 + 0.028);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.032);
          osc.stop(now + idx * 0.032 + 0.03);
        });
        return;
      }

      if (style === 'Quantum Sonar') {
        // Sound 6: Deep alien sonar synth pulse
        const osc = this.ctx.createOscillator();
        const sub = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        sub.type = 'triangle';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.09);
        sub.frequency.setValueAtTime(270, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.095);
        osc.connect(gain);
        sub.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        sub.start(now);
        osc.stop(now + 0.1);
        sub.stop(now + 0.1);
        return;
      }

      // Default — Sound 3: Crisp Alien-Tech Mechanical & Crystalline Digital Click
      const carrier = this.ctx.createOscillator();
      const mod = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const masterGain = this.ctx.createGain();

      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(1650, now);
      carrier.frequency.exponentialRampToValueAtTime(3100, now + 0.012);
      carrier.frequency.exponentialRampToValueAtTime(890, now + 0.042);

      mod.type = 'triangle';
      mod.frequency.setValueAtTime(3800, now);
      mod.frequency.exponentialRampToValueAtTime(1750, now + 0.04);
      modGain.gain.setValueAtTime(480, now);
      modGain.gain.exponentialRampToValueAtTime(12, now + 0.04);

      masterGain.gain.setValueAtTime(0.0008, now);
      masterGain.gain.exponentialRampToValueAtTime(peak, now + 0.003);
      masterGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.046);

      mod.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(masterGain);
      masterGain.connect(this.ctx.destination);

      carrier.start(now);
      mod.start(now);
      carrier.stop(now + 0.05);
      mod.stop(now + 0.05);
    } catch (e) {}
  }

  playTaskComplete() {
    try {
      this.init();
      const now = this.ctx.currentTime;
      const peak = Math.max(0.02, 0.24 * this.alarmVolume);
      // Sound 1: Warm wooden marimba / resonant dual-tone completion chime
      const notes = [523.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const overtone = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.11;

        osc.type = 'sine';
        overtone.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        overtone.frequency.setValueAtTime(freq * 2, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.34);

        osc.connect(gain);
        overtone.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        overtone.start(start);
        osc.stop(start + 0.36);
        overtone.stop(start + 0.36);
      });
    } catch (e) {}
  }

  playAlarm(type = 'Alien Fanfare') {
    if (!type || type === 'None' || type === 'none') return;
    try {
      this.init();
      const now = this.ctx.currentTime;
      const peak = Math.max(0.02, 0.28 * this.alarmVolume);

      const patterns = {
        'Alien Fanfare': { freqs: [587.33, 880, 1174.66, 1567.98], wave: 'sine', step: 0.12 },
        'Marimba Chime': { freqs: [523.25, 659.25, 783.99, 1046.5], wave: 'triangle', step: 0.13 },
        'Telemetry Alert': { freqs: [1320, 1760, 1320, 1980, 1560], wave: 'sine', step: 0.085 },
        'Quantum Sonar': { freqs: [440, 554.37, 440, 659.25], wave: 'sine', step: 0.19 },
        'Cyber Blip': { freqs: [880, 1320, 990, 1480], wave: 'triangle', step: 0.11 },
        Timer: { freqs: [523.25, 659.25, 783.99, 1046.5], wave: 'sine', step: 0.16 },
        Bell1: { freqs: [880, 1318.5, 1760], wave: 'sine', step: 0.22 },
        Bell2: { freqs: [659.25, 987.77, 1318.5], wave: 'triangle', step: 0.24 },
        Beeps: { freqs: [920, 920, 920, 920], wave: 'square', step: 0.14 },
        'Bicycle Bell': { freqs: [1480, 1567.98, 1480, 1567.98], wave: 'sine', step: 0.09 },
        'Toy Noisemaker Honk': { freqs: [340, 290, 360], wave: 'sawtooth', step: 0.18 },
        'Clown Horn': { freqs: [420, 310, 440], wave: 'sawtooth', step: 0.16 },
      };

      const cfg = patterns[type] || patterns['Alien Fanfare'];
      cfg.freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = cfg.wave;
        osc.frequency.setValueAtTime(freq, now + idx * cfg.step);
        gain.gain.setValueAtTime(0.001, now + idx * cfg.step);
        gain.gain.exponentialRampToValueAtTime(peak, now + idx * cfg.step + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * cfg.step + 0.44);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * cfg.step);
        osc.stop(now + idx * cfg.step + 0.48);
      });
    } catch (e) {}
  }

  setWhiteNoise(mode) {
    this.stopWhiteNoise();
    this.activeNoise = mode;
    if (!mode || mode === 'off' || mode === 'None') return;

    try {
      this.init();
      if (mode === 'Tic-tac' || mode === 'Countdown') {
        let high = true;
        const triggerTick = () => {
          if (!this.ctx) return;
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(high ? 980 : 740, now);
          high = !high;
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.exponentialRampToValueAtTime(
            Math.max(0.01, this.noiseVolume * 0.16),
            now + 0.005
          );
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
        };
        triggerTick();
        this.tickInterval = setInterval(triggerTick, mode === 'Countdown' ? 500 : 1000);
        return;
      }

      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0.0;
      const roughnessMap = {
        Rain: 0.08,
        rain: 0.08,
        Stream: 0.06,
        'Ocean Shore': 0.03,
        Wind: 0.045,
        forest: 0.045,
        'Wind With Crickets': 0.05,
        Wilderness: 0.04,
        Bonfire: 0.07,
        Cafe: 0.025,
        brown: 0.025,
        Library: 0.018,
        'Class Room': 0.03,
        'Frogs At Night': 0.035,
      };
      const alpha = roughnessMap[mode] || 0.04;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + alpha * white) / (1 + alpha);
        lastOut = output[i];
        output[i] *= 2.4;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const freqMap = {
        Rain: 1150,
        rain: 1150,
        Stream: 950,
        'Ocean Shore': 520,
        Wind: 680,
        forest: 680,
        'Wind With Crickets': 1400,
        Wilderness: 750,
        Bonfire: 880,
        Cafe: 420,
        brown: 420,
        Library: 320,
        'Class Room': 500,
        'Frogs At Night': 820,
      };
      filter.frequency.value = freqMap[mode] || 700;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = this.noiseVolume * 0.25;

      this.noiseNode.connect(filter);
      filter.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      this.noiseNode.start(0);
    } catch (e) {}
  }

  stopWhiteNoise() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    if (this.noiseNode) {
      try {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
      } catch (e) {}
      this.noiseNode = null;
    }
  }
}

const soundEngine = new SoundEngine();

const PROJECT_PALETTE = [
  '#b4b8bf', '#7ba4f7', '#5ec2eb', '#f5a742', '#d953b8',
  '#f0567a', '#f7d547', '#f07848', '#52b77a', '#9c7df2',
  '#2bb5db', '#9be396', '#5c7cfa', '#4c6ef5', '#da63d1',
  '#f06565', '#adb5bd', '#96d9c6', '#c29970', '#5c5f66',
];

const INITIAL_PROJECTS = [];

const getDateStr = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatHoursMins = (totalMins) => {
  const safe = Math.max(0, Math.round(totalMins));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return {
    h,
    m,
    text: h > 0 ? `${h}h ${m}m` : `${m}m`,
  };
};

const formatTimerDisplay = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const TomatoIcon = ({ filled = true, size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="shrink-0">
    <circle
      cx="12"
      cy="13"
      r="8.5"
      fill={filled ? '#ef5350' : 'rgba(239, 83, 80, 0.28)'}
    />
    <path
      d="M12 4.5 C10 2.5, 8 4, 9 5.5 C10.5 4.5, 13.5 4.5, 15 5.5 C16 4, 14 2.5, 12 4.5 Z"
      fill={filled ? '#4ade80' : 'rgba(74, 222, 128, 0.45)'}
    />
  </svg>
);

const FocusLogoSVG = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0 rounded-xl">
    <defs>
      <linearGradient id="focusLogoGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff6b2b" />
        <stop offset="100%" stopColor="#ff1e56" />
      </linearGradient>
    </defs>
    <rect width="48" height="48" rx="12" fill="url(#focusLogoGrad)" />
    {Array.from({ length: 12 }).map((_, i) => (
      <line
        key={i}
        x1="24"
        y1="7"
        x2="24"
        y2="11"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        transform={`rotate(${i * 30} 24 24)`}
      />
    ))}
    <path
      d="M18 24.5 L22.5 29 L31 19.5"
      fill="none"
      stroke="#ffffff"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TargetIconSVG = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className="shrink-0">
    <path d="M13 38 L9 44" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M35 38 L39 44" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
    <circle cx="24" cy="24" r="18" fill="#2563eb" />
    <circle cx="24" cy="24" r="13.5" fill="#f59e0b" />
    <circle cx="24" cy="24" r="9.2" fill="#ef4444" />
    <circle cx="24" cy="24" r="5" fill="#f59e0b" />
    <circle cx="24" cy="24" r="2.2" fill="#ef4444" />
    <line x1="24" y1="24" x2="39" y2="9" stroke="#334155" strokeWidth="2.6" strokeLinecap="round" />
    <polygon points="37,6 43,5 40,10" fill="#ef4444" />
    <polygon points="42,11 43,5 38,8" fill="#dc2626" />
  </svg>
);

const SidebarToggleSVG = ({ isOpen }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <line x1="9" y1="3" x2="9" y2="21" />
    {isOpen ? <polyline points="15 9 12 12 15 15" /> : <polyline points="13 9 16 12 13 15" />}
  </svg>
);

const ToggleRow = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-200 text-xs sm:text-sm">{label}</span>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-10 h-5 rounded-full transition p-0.5 shrink-0 ${
        checked ? 'bg-[#f25551]' : 'bg-[#36363d]'
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

const createInitialTasks = () => [];

const createInitialSessions = () => [];

const DEFAULT_SETTINGS = {
  username: 'onlyvishal',
  email: 'onlyvishal247@gmail.com',
  avatarUrl: '',
  pomodoroLength: 100,
  shortBreakLength: 5,
  longBreakLength: 15,
  longBreakAfter: 4,
  autoStartNext: false,
  autoStartBreak: false,
  disableBreak: true,
  playCompletionSound: true,
  clickSoundEnabled: true,
  clickSoundVolume: 75,
  clickSoundStyle: 'Alien Tech Click',
  addTasksOnTop: true,
  focusTimeRanking: true,
  forestFeature: true,
  groupFeature: true,
  showProjectsSection: true,
  smartListVisibility: {
    today: true,
    overdue: false,
    tomorrow: true,
    week: true,
    next7: false,
    highPriority: false,
    mediumPriority: false,
    lowPriority: false,
    planned: true,
    all: false,
    someday: false,
    completed: true,
    tasks: true,
  },
  dailyGoalHours: 8,
  alarmVolume: 90,
  focusAlarm: 'Alien Fanfare',
  breakAlarm: 'Marimba Chime',
  alarmSound: 'Alien Fanfare',
  whiteNoiseVolume: 85,
  defaultWhiteNoise: 'None',
  darkMode: 'Automatic',
  focusWallpaper: 'forest',
};

export default function App({ user, onLogout }) {
  const todayStr = getDateStr(0);
  const weekEndStr = getDateStr(7);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudHasData, setCloudHasData] = useState(false);

  // One-time migration to wipe legacy demo data so the app starts completely fresh
  useState(() => {
    try {
      if (!localStorage.getItem('ftd_clean_slate_v2')) {
        [
          'ftd_projects_v1',
          'ftd_tasks_v1',
          'ftd_sessions_v1',
          'ftd_deleted_history_v1',
          'ftd_settings_v1',
          'ftd_tags_v1',
          'ftd_folders_v1',
          'ftd_tab_goals_v1',
          'ftd_date_goals_v1',
        ].forEach((k) => localStorage.removeItem(k));
        localStorage.setItem('ftd_clean_slate_v2', 'true');
      }
    } catch (e) {}
    return true;
  });

  // Persistent State in localStorage
  const [projects, setProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('ftd_projects_v2');
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch (e) {
      return INITIAL_PROJECTS;
    }
  });

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('ftd_tasks_v2');
      return saved ? JSON.parse(saved) : createInitialTasks();
    } catch (e) {
      return createInitialTasks();
    }
  });

  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('ftd_sessions_v2');
      return saved ? JSON.parse(saved) : createInitialSessions();
    } catch (e) {
      return createInitialSessions();
    }
  });

  const [deletedHistory, setDeletedHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('ftd_deleted_history_v2');
      return saved ? JSON.parse(saved) : { projects: [], tasks: [] };
    } catch (e) {
      return { projects: [], tasks: [] };
    }
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ftd_settings_v2');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ftd_projects_v2', JSON.stringify(projects));
    } catch (e) {}
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('ftd_tasks_v2', JSON.stringify(tasks));
    } catch (e) {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('ftd_sessions_v2', JSON.stringify(sessions));
    } catch (e) {}
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem('ftd_deleted_history_v2', JSON.stringify(deletedHistory));
    } catch (e) {}
  }, [deletedHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('ftd_settings_v2', JSON.stringify(settings));
    } catch (e) {}
  }, [settings]);

  useEffect(() => {
    soundEngine.setAlarmVolume((settings.alarmVolume ?? 90) / 100);
  }, [settings.alarmVolume]);

  useEffect(() => {
    soundEngine.setNoiseVolume((settings.whiteNoiseVolume ?? 85) / 100);
  }, [settings.whiteNoiseVolume]);

  useEffect(() => {
    soundEngine.setClickSettings(
      settings.clickSoundEnabled ?? true,
      (settings.clickSoundVolume ?? 75) / 100,
      settings.clickSoundStyle || 'Alien Tech Click'
    );
  }, [settings.clickSoundEnabled, settings.clickSoundVolume, settings.clickSoundStyle]);

  // Navigation & UI Modals
  const [activeView, setActiveView] = useState('workspace'); // 'workspace' | 'focus' | 'reports' | 'settings'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTabViewExpanded, setIsTabViewExpanded] = useState(true);
  const [isProjectViewExpanded, setIsProjectViewExpanded] = useState(true);
  const [isEditingProjectSectionTitle, setIsEditingProjectSectionTitle] = useState(false);
  const [projectSectionTitleDraft, setProjectSectionTitleDraft] = useState('');
  const [activeFilter, setActiveFilter] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [openedTaskDetailId, setOpenedTaskDetailId] = useState(null);
  const [activeNoteEditor, setActiveNoteEditor] = useState(null);
  const [noteMenuOpen, setNoteMenuOpen] = useState(false);
  const [noteFormatOpen, setNoteFormatOpen] = useState(false);
  const [noteLabelInputOpen, setNoteLabelInputOpen] = useState(false);
  const [newNoteLabelText, setNewNoteLabelText] = useState('');
  const [noteVersionModalOpen, setNoteVersionModalOpen] = useState(false);
  const [noteDrawingModalOpen, setNoteDrawingModalOpen] = useState(false);
  const [editingSessionCommentId, setEditingSessionCommentId] = useState(null);
  const [sessionCommentDraft, setSessionCommentDraft] = useState('');
  const drawingCanvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isUserHistoryOpen, setIsUserHistoryOpen] = useState(false);
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [achievementCalView, setAchievementCalView] = useState('weekly'); // 'weekly' | 'monthly'
  const [achCalYear, setAchCalYear] = useState(() => new Date().getFullYear());
  const [achCalMonth, setAchCalMonth] = useState(() => new Date().getMonth());
  const [timesCompletedOffset, setTimesCompletedOffset] = useState(0);
  const [streakCelebrationData, setStreakCelebrationData] = useState(null);
  const lastCelebratedStreakRef = useRef(0);
  const [historyFilterTab, setHistoryFilterTab] = useState('all'); // 'all' | 'projects' | 'tasks' | 'deleted' | 'sessions'
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState('Just now');

  // Per-Tab Date / Week Offsets & Per-Date / Per-Tab Goals
  const [tabOffsets, setTabOffsets] = useState({});
  const [futureTabOffsets, setFutureTabOffsets] = useState({ tomorrow: 0, planned: 0 });
  const [dateGoals, setDateGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('ftd_date_goals_v2');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [tabGoals, setTabGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('ftd_tab_goals_v2');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Independent Per-Project / Per-Tab Taskbar Drafts & Popover State
  const [taskbarDrafts, setTaskbarDrafts] = useState({});
  const currentDraft = taskbarDrafts[activeFilter] || {
    title: '',
    pomodoros: 1,
    due: 'today',
    projectId: '',
    customDate: getDateStr(0),
    reminderType: 'none',
    reminderSchedule: 'always',
    reminderTime: '',
    reminderAlarm: true,
  };
  const updateCurrentDraft = useCallback(
    (patch) => {
      setTaskbarDrafts((prev) => {
        const existing = prev[activeFilter] || {
          title: '',
          pomodoros: 1,
          due: 'today',
          projectId: '',
          customDate: getDateStr(0),
          reminderType: 'none',
          reminderSchedule: 'always',
          reminderTime: '',
          reminderAlarm: true,
        };
        const nextVal = typeof patch === 'function' ? patch(existing) : { ...existing, ...patch };
        return { ...prev, [activeFilter]: nextVal };
      });
    },
    [activeFilter]
  );

  const newTaskTitle = currentDraft.title;
  const setNewTaskTitle = (val) => updateCurrentDraft({ title: val });
  const newTaskPomodoros = currentDraft.pomodoros;
  const setNewTaskPomodoros = (val) => updateCurrentDraft({ pomodoros: val });
  const newTaskDue = currentDraft.due;
  const setNewTaskDue = (val) => updateCurrentDraft({ due: val });
  const newTaskProjectId = currentDraft.projectId;
  const setNewTaskProjectId = (val) => updateCurrentDraft({ projectId: val });
  const newTaskCustomDate = currentDraft.customDate;
  const setNewTaskCustomDate = (val) => updateCurrentDraft({ customDate: val });
  const newTaskReminderType = currentDraft.reminderType;
  const setNewTaskReminderType = (val) => updateCurrentDraft({ reminderType: val });
  const newTaskReminderSchedule = currentDraft.reminderSchedule;
  const setNewTaskReminderSchedule = (val) => updateCurrentDraft({ reminderSchedule: val });
  const newTaskReminderTime = currentDraft.reminderTime;
  const setNewTaskReminderTime = (val) => updateCurrentDraft({ reminderTime: val });
  const newTaskReminderAlarm = currentDraft.reminderAlarm;
  const setNewTaskReminderAlarm = (val) => updateCurrentDraft({ reminderAlarm: val });

  const [assignNewProjectToTask, setAssignNewProjectToTask] = useState(false);
  const [taskbarPopoverMode, setTaskbarPopoverMode] = useState(null); // null | 'todayClock' | 'thisWeek' | 'calendar'
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderModalContext, setReminderModalContext] = useState('task');
  const [isTimeClockPickerOpen, setIsTimeClockPickerOpen] = useState(false);
  const [tempReminderHour, setTempReminderHour] = useState('12');
  const [tempReminderMinute, setTempReminderMinute] = useState('00');
  const [plannerCalYear, setPlannerCalYear] = useState(() => new Date().getFullYear());
  const [plannerCalMonth, setPlannerCalMonth] = useState(() => new Date().getMonth());
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState('');
  const [projectStatusConfirm, setProjectStatusConfirm] = useState(null); // { id, name, nextInactive }
  const [liveClock, setLiveClock] = useState(() => new Date());

  // Project / Tag / Folder Modals & Menus
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_PALETTE[0]);
  const [newProjectParentId, setNewProjectParentId] = useState(null);
  const [newProjectReminderTime, setNewProjectReminderTime] = useState('');
  const [newProjectReminderType, setNewProjectReminderType] = useState('none');
  const [expandedProjects, setExpandedProjects] = useState({});
  const [projectMenuId, setProjectMenuId] = useState(null);
  const [taskMenuId, setTaskMenuId] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);

  const [tags, setTags] = useState(() => {
    try {
      const saved = localStorage.getItem('ftd_tags_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const [folders, setFolders] = useState(() => {
    try {
      const saved = localStorage.getItem('ftd_folders_v2');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [expandedFolders, setExpandedFolders] = useState({});
  const [isAddFolderOpen, setIsAddFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');


  // Load this user's data from Supabase
  useEffect(() => {
    let cancelled = false;

    async function loadCloudData() {
      if (!user?.id) return;

      try {
        const cloudData = await loadUserData(user.id);
        if (cancelled) return;
setCloudReady(true);
setCloudHasData(Boolean(cloudData));

        // If this account has no cloud data yet,
        // keep the existing local data unchanged.
        if (!cloudData || cancelled) return;

        setProjects(cloudData.projects ?? INITIAL_PROJECTS);
        setTasks(cloudData.tasks ?? createInitialTasks());
        setSessions(cloudData.sessions ?? createInitialSessions());
        setDeletedHistory(
          cloudData.deletedHistory ?? { projects: [], tasks: [] }
        );
        setSettings({
          ...DEFAULT_SETTINGS,
          ...(cloudData.settings ?? {}),
        });
        setDateGoals(cloudData.dateGoals ?? {});
        setTabGoals(cloudData.tabGoals ?? {});
        setTags(cloudData.tags ?? []);
        setFolders(cloudData.folders ?? []);
      } catch (error) {
        console.error('Cloud data loading failed:', error);
      }
    }

    loadCloudData();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);


  useEffect(() => {
    try {
      localStorage.setItem('ftd_tags_v2', JSON.stringify(tags));
    } catch (e) {}
  }, [tags]);

  useEffect(() => {
    try {
      localStorage.setItem('ftd_folders_v2', JSON.stringify(folders));
    } catch (e) {}
  }, [folders]);

  useEffect(() => {
    try {
      localStorage.setItem('ftd_tab_goals_v2', JSON.stringify(tabGoals));
    } catch (e) {}
  }, [tabGoals]);

  useEffect(() => {
    try {
      localStorage.setItem('ftd_date_goals_v2', JSON.stringify(dateGoals));
    } catch (e) {}
  }, [dateGoals]);

  // Automatically sync changes to this user's cloud account
  useEffect(() => {
    if (!user?.id || !cloudReady || !cloudHasData) return;

    const timeout = setTimeout(() => {
      saveUserData(user.id, {
        projects,
        tasks,
        sessions,
        deletedHistory,
        settings,
        dateGoals,
        tabGoals,
        tags,
        folders,
      }).catch((error) => {
        console.error('Cloud save failed:', error);
      });
    }, 1000);

    return () => clearTimeout(timeout);
  }, [
    user?.id,
    cloudReady,
    cloudHasData,
    projects,
    tasks,
    sessions,
    deletedHistory,
    settings,
    dateGoals,
    tabGoals,
    tags,
    folders,
  ]);

  // Live 1-second clock tick for the 24-hour Study Trend live time indicator
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setLiveClock(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Timer & Focus State
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [timerMode, setTimerMode] = useState('countdown'); // 'countdown' | 'stopwatch'
  const [timerStatus, setTimerStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'break'
  const [secondsLeft, setSecondsLeft] = useState(() => settings.pomodoroLength * 60);
  const [elapsedStopwatchSecs, setElapsedStopwatchSecs] = useState(0);
  const [whiteNoise, setWhiteNoise] = useState('off');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFlipClockFullscreen, setIsFlipClockFullscreen] = useState(false);
  const [isDrumRolling, setIsDrumRolling] = useState(false);
  const [isEditingCustomMins, setIsEditingCustomMins] = useState(false);
  const [customMinsInput, setCustomMinsInput] = useState('100');
  const [isStopConfirmOpen, setIsStopConfirmOpen] = useState(false);
  const [isTimerModeModalOpen, setIsTimerModeModalOpen] = useState(false);
  const [pendingTimerMode, setPendingTimerMode] = useState('countdown');
  const drumRollTimeoutRef = useRef(null);
  const touchStartYRef = useRef(null);

  // Reports & Calendar State
  const [reportPeriod, setReportPeriod] = useState('Daily');
  const [pomodoroRecordsPage, setPomodoroRecordsPage] = useState(0);
  const [focusTimeCardOffset, setFocusTimeCardOffset] = useState(0);
  const [showFocusCardTasks, setShowFocusCardTasks] = useState(true);
  const [goalCalendarYear, setGoalCalendarYear] = useState(() => new Date().getFullYear());
  const [goalCalendarMonth, setGoalCalendarMonth] = useState(() => new Date().getMonth());
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [tempGoalHours, setTempGoalHours] = useState(settings.dailyGoalHours);
  const [focusChartTab, setFocusChartTab] = useState('Daily');
  const [focusChartPage, setFocusChartPage] = useState(0);
  const [hoveredFocusIdx, setHoveredFocusIdx] = useState(null);
  const [taskChartTab, setTaskChartTab] = useState('Daily');
  const [taskChartPage, setTaskChartPage] = useState(0);
  const [hoveredTaskIdx, setHoveredTaskIdx] = useState(null);
  const [studyTrendTab, setStudyTrendTab] = useState('Daily');
  const [studyTrendPage, setStudyTrendPage] = useState(0);

  // Settings & Toast State
  const [settingsTab, setSettingsTab] = useState('account');
  const [toastMsg, setToastMsg] = useState('');
  const toastTimeoutRef = useRef(null);

  // Account Sub-Modals in Settings
  const [accountModal, setAccountModal] = useState(null);
  const [pendingBackupRestore, setPendingBackupRestore] = useState(null);
  const [tempEmail, setTempEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [openAlarmDropdown, setOpenAlarmDropdown] = useState(null);
  const avatarInputRef = useRef(null);
  const backupInputRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMsg(''), 3200);
  }, []);

  // Only sessions >= 15 minutes affect statistics, trends, and reports
  const validSessions = useMemo(
    () => sessions.filter((s) => (Number(s.durationMins) || 0) >= 15),
    [sessions]
  );

  // Real-time Streak (>= 15m/day) & Daily Achievement Medals (Bronze, Silver, Gold, Uranium)
  const streakAndAchievements = useMemo(() => {
    const dailyTotals = {};
    validSessions.forEach((s) => {
      if (!s.date) return;
      dailyTotals[s.date] = (dailyTotals[s.date] || 0) + (Number(s.durationMins) || 0);
    });

    const getMedalForMins = (mins) => {
      if (mins >= 720) {
        return {
          tier: 'uranium',
          label: 'Uranium',
          range: '12h – 15h',
          color: '#22c55e',
          bg: 'rgba(34, 197, 94, 0.18)',
          border: '#22c55e',
        };
      }
      if (mins >= 480) {
        return {
          tier: 'gold',
          label: 'Gold',
          range: '8h – 12h',
          color: '#eab308',
          bg: 'rgba(234, 179, 8, 0.18)',
          border: '#eab308',
        };
      }
      if (mins >= 300) {
        return {
          tier: 'silver',
          label: 'Silver',
          range: '5h – 8h',
          color: '#9ca3af',
          bg: 'rgba(156, 163, 175, 0.18)',
          border: '#9ca3af',
        };
      }
      if (mins >= 120) {
        return {
          tier: 'bronze',
          label: 'Bronze',
          range: '2h – 5h',
          color: '#ef5350',
          bg: 'rgba(239, 83, 80, 0.18)',
          border: '#ef5350',
        };
      }
      return null;
    };

    let bronzeCount = 0;
    let silverCount = 0;
    let goldCount = 0;
    let uraniumCount = 0;
    const medalByDate = {};

    Object.entries(dailyTotals).forEach(([dateKey, mins]) => {
      const m = getMedalForMins(mins);
      if (m) {
        medalByDate[dateKey] = m;
        if (m.tier === 'bronze') bronzeCount += 1;
        else if (m.tier === 'silver') silverCount += 1;
        else if (m.tier === 'gold') goldCount += 1;
        else if (m.tier === 'uranium') uraniumCount += 1;
      }
    });

    const totalMedals = bronzeCount + silverCount + goldCount + uraniumCount;

    // Qualified streak days: >= 15 mins in a day
    const qualifiedDates = Object.keys(dailyTotals)
      .filter((d) => dailyTotals[d] >= 15)
      .sort();

    // Calculate Longest Streak & collect all continuous streak runs
    let longestStreak = 0;
    let runningStreak = 0;
    let prevDateObj = null;
    const allStreakRuns = [];
    qualifiedDates.forEach((dStr) => {
      const [yy, mm, dd] = dStr.split('-').map(Number);
      const curObj = new Date(yy, mm - 1, dd);
      if (prevDateObj) {
        const diffDays = Math.round((curObj - prevDateObj) / 86400000);
        if (diffDays === 1) {
          runningStreak += 1;
        } else if (diffDays > 1) {
          allStreakRuns.push(runningStreak);
          runningStreak = 1;
        }
      } else {
        runningStreak = 1;
      }
      if (runningStreak > longestStreak) longestStreak = runningStreak;
      prevDateObj = curObj;
    });
    if (runningStreak > 0) allStreakRuns.push(runningStreak);

    // Calculate Current Streak (consecutive days ending Today or Yesterday)
    let currentStreak = 0;
    const todayMins = dailyTotals[todayStr] || 0;
    let checkOffset = todayMins >= 15 ? 0 : -1;
    while (true) {
      const checkStr = getDateStr(checkOffset);
      if ((dailyTotals[checkStr] || 0) >= 15) {
        currentStreak += 1;
        checkOffset -= 1;
      } else {
        break;
      }
    }

    // Dynamic "Total time completed" stats with Backward/Forward offset
    const fmtYMD = (dt) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
        dt.getDate()
      ).padStart(2, '0')}`;

    const refDate = new Date();
    refDate.setHours(0, 0, 0, 0);

    // Week window shifted by timesCompletedOffset weeks
    const wkRef = new Date(refDate);
    wkRef.setDate(refDate.getDate() - timesCompletedOffset * 7);
    const wkDow = (wkRef.getDay() + 6) % 7;
    const wkStartObj = new Date(wkRef);
    wkStartObj.setDate(wkRef.getDate() - wkDow);
    const wkEndObj = new Date(wkStartObj);
    wkEndObj.setDate(wkStartObj.getDate() + 6);
    const wkStartStr = fmtYMD(wkStartObj);
    const wkEndStr = fmtYMD(wkEndObj);

    // Month window shifted by timesCompletedOffset months
    const mRef = new Date(refDate.getFullYear(), refDate.getMonth() - timesCompletedOffset, 1);
    const monthPrefix = `${mRef.getFullYear()}-${String(mRef.getMonth() + 1).padStart(2, '0')}`;

    // Year window shifted by timesCompletedOffset years
    const targetYear = refDate.getFullYear() - timesCompletedOffset;
    const yearPrefix = `${targetYear}-`;

    const monthNamesShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const periodPeriodTitle =
      timesCompletedOffset === 0
        ? 'Current Period'
        : `${wkStartObj.getDate()} ${monthNamesShort[wkStartObj.getMonth()]} • ${monthNamesShort[mRef.getMonth()]} ${targetYear}`;

    const weekQualDates = qualifiedDates.filter((d) => d >= wkStartStr && d <= wkEndStr);
    const monthQualDates = qualifiedDates.filter((d) => d.startsWith(monthPrefix));
    const yearQualDates = qualifiedDates.filter((d) => d.startsWith(yearPrefix));

    const sumMinsForDates = (dateList) =>
      dateList.reduce((acc, d) => acc + (dailyTotals[d] || 0), 0);

    const timesCompletedWeekLabel =
      timesCompletedOffset === 0
        ? 'This week'
        : `Week (${wkStartObj.getDate()} ${monthNamesShort[wkStartObj.getMonth()]} - ${wkEndObj.getDate()} ${monthNamesShort[wkEndObj.getMonth()]})`;
    const timesCompletedMonthLabel =
      timesCompletedOffset === 0
        ? 'This month'
        : `${monthNamesShort[mRef.getMonth()]} ${mRef.getFullYear()}`;
    const timesCompletedYearLabel =
      timesCompletedOffset === 0 ? 'This year' : `Year ${targetYear}`;

    const timesCompletedThisWeekMins = sumMinsForDates(weekQualDates);
    const timesCompletedThisMonthMins = sumMinsForDates(monthQualDates);
    const timesCompletedThisYearMins = sumMinsForDates(yearQualDates);
    const timesCompletedAllMins = sumMinsForDates(qualifiedDates);

    // Per-Type Streak & Medal Collection Stats (Bronze 2-5h, Silver 5-8h, Gold 8-12h, Uranium 12-15h)
    const computeTierStreakStats = (predicateFn) => {
      const matchingDates = Object.keys(dailyTotals)
        .filter((d) => predicateFn(dailyTotals[d]))
        .sort();
      let best = 0;
      let run = 0;
      let prev = null;
      matchingDates.forEach((dStr) => {
        const [yy, mm, dd] = dStr.split('-').map(Number);
        const cur = new Date(yy, mm - 1, dd);
        if (prev) {
          const diff = Math.round((cur - prev) / 86400000);
          run = diff === 1 ? run + 1 : 1;
        } else {
          run = 1;
        }
        if (run > best) best = run;
        prev = cur;
      });
      let curStreak = 0;
      let off = predicateFn(dailyTotals[todayStr] || 0) ? 0 : -1;
      while (true) {
        const cStr = getDateStr(off);
        if (predicateFn(dailyTotals[cStr] || 0)) {
          curStreak += 1;
          off -= 1;
        } else {
          break;
        }
      }
      return {
        totalCollected: matchingDates.length,
        currentStreak: curStreak,
        bestStreak: best,
      };
    };

    const perTypeStreaks = [
      {
        id: 'bronze',
        label: 'Bronze (2h–5h)',
        color: '#ef5350',
        ...computeTierStreakStats((m) => m >= 120 && m < 300),
      },
      {
        id: 'silver',
        label: 'Silver (5h–8h)',
        color: '#9ca3af',
        ...computeTierStreakStats((m) => m >= 300 && m < 480),
      },
      {
        id: 'gold',
        label: 'Gold (8h–12h)',
        color: '#eab308',
        ...computeTierStreakStats((m) => m >= 480 && m < 720),
      },
      {
        id: 'uranium',
        label: 'Uranium (12h–15h)',
        color: '#22c55e',
        ...computeTierStreakStats((m) => m >= 720),
      },
    ];

    const challengeMilestones = [1, 7, 15, 30, 60, 100, 180, 365];
    const challengeCollectionCounts = {};
    challengeMilestones.forEach((targetDays) => {
      challengeCollectionCounts[targetDays] = allStreakRuns.reduce(
        (acc, runLen) => acc + Math.floor(runLen / targetDays),
        0
      );
    });
    const totalStreakMedalsCollected = Object.values(challengeCollectionCounts).reduce(
      (acc, v) => acc + v,
      0
    );
    const nextAwardDays =
      challengeMilestones.find((m) => m > longestStreak) || 365;

    return {
      dailyTotals,
      medalByDate,
      getMedalForMins,
      bronzeCount,
      silverCount,
      goldCount,
      uraniumCount,
      totalMedals,
      currentStreak,
      longestStreak,
      periodPeriodTitle,
      timesCompletedWeekLabel,
      timesCompletedMonthLabel,
      timesCompletedYearLabel,
      timesCompletedThisWeek: weekQualDates.length,
      timesCompletedThisMonth: monthQualDates.length,
      timesCompletedThisYear: yearQualDates.length,
      timesCompletedAll: qualifiedDates.length,
      timesCompletedThisWeekMins,
      timesCompletedThisMonthMins,
      timesCompletedThisYearMins,
      timesCompletedAllMins,
      perTypeStreaks,
      challengeMilestones,
      challengeCollectionCounts,
      totalStreakMedalsCollected,
      nextAwardDays,
    };
  }, [validSessions, todayStr, timesCompletedOffset]);

  // Trigger "Well done!" Streak Celebration Modal when a new best streak milestone is achieved
  useEffect(() => {
    const best = streakAndAchievements.longestStreak;
    if (lastCelebratedStreakRef.current === 0) {
      lastCelebratedStreakRef.current = best;
      return;
    }
    if (
      best > lastCelebratedStreakRef.current &&
      streakAndAchievements.challengeMilestones.includes(best)
    ) {
      lastCelebratedStreakRef.current = best;
      setStreakCelebrationData({
        streakDays: best,
        nextAward: streakAndAchievements.nextAwardDays,
      });
      soundEngine.playAlarm(settings.focusAlarm || 'Alien Fanfare');
    } else if (best > lastCelebratedStreakRef.current) {
      lastCelebratedStreakRef.current = best;
    }
  }, [
    streakAndAchievements.longestStreak,
    streakAndAchievements.challengeMilestones,
    streakAndAchievements.nextAwardDays,
    settings.focusAlarm,
  ]);

  // ============================================================================
  // 7. POMODORO COMPLETION, TIMER INTERVAL & DRUM-ROLL HANDLERS
  // ============================================================================
  const completePomodoroSession = useCallback(
    (completedMins, isManualStop = false) => {
      const safeMins = Math.max(0, Math.round(completedMins));
      if (safeMins < 15) {
        if (isManualStop) {
          showToast('Sessions under 15 minutes are not recorded in statistics');
        }
        return;
      }

      const taskObj = tasks.find((t) => t.id === selectedTaskId);
      const projObj = taskObj
        ? projects.find((p) => p.id === taskObj.projectId)
        : projects[0];
      const now = new Date();
      const endHour = now.getHours() + now.getMinutes() / 60;
      const startHour = Math.max(0, endHour - safeMins / 60);

      const newSession = {
        id: `s-${Date.now()}`,
        date: getDateStr(0),
        taskId: taskObj ? taskObj.id : '',
        taskTitle: taskObj ? taskObj.title : 'Focus Session',
        projectId: projObj ? projObj.id : 'proj-na',
        projectName: projObj ? projObj.name : 'Tasks',
        projectColor: projObj ? projObj.color : '#3b82f6',
        startHour,
        durationMins: safeMins,
      };

      setSessions((prev) => [...prev, newSession]);

      if (taskObj) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskObj.id
              ? { ...t, completedPomodoros: t.completedPomodoros + 1 }
              : t
          )
        );
      }
    },
    [tasks, projects, selectedTaskId, showToast]
  );

  // Main Countdown / Stopwatch Ticker
  useEffect(() => {
    if (timerStatus !== 'running' && timerStatus !== 'break') return;

    const interval = setInterval(() => {
      if (timerMode === 'stopwatch' && timerStatus === 'running') {
        setElapsedStopwatchSecs((prev) => prev + 1);
        return;
      }

      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerStatus === 'running') {
            completePomodoroSession(settings.pomodoroLength, false);
            soundEngine.playAlarm(settings.focusAlarm || 'Alien Fanfare');
            if (settings.disableBreak) {
              setTimerStatus(settings.autoStartNext ? 'running' : 'idle');
              return settings.pomodoroLength * 60;
            }
            setTimerStatus(settings.autoStartBreak ? 'break' : 'idle');
            return settings.shortBreakLength * 60;
          } else {
            soundEngine.playAlarm(settings.breakAlarm || 'Marimba Chime');
            setTimerStatus(settings.autoStartNext ? 'running' : 'idle');
            return settings.pomodoroLength * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [
    timerStatus,
    timerMode,
    settings.pomodoroLength,
    settings.shortBreakLength,
    settings.disableBreak,
    settings.autoStartNext,
    settings.autoStartBreak,
    settings.focusAlarm,
    settings.breakAlarm,
    completePomodoroSession,
  ]);

  // Scheduled Task Reminder & Alarm Checker
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const curDate = getDateStr(0);
      const curTime = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      tasks.forEach((t) => {
        if (
          !t.completed &&
          t.dueDate === curDate &&
          t.reminderTime === curTime &&
          !t.reminderTriggered
        ) {
          if (t.reminderAlarm || t.reminderType === 'alarm') {
            soundEngine.playAlarm(settings.focusAlarm || 'Alien Fanfare');
          } else {
            soundEngine.playTechClick('Quantum Sonar');
          }
          showToast(`Reminder: "${t.title}" (${curTime})`);
          setTasks((prev) =>
            prev.map((item) =>
              item.id === t.id ? { ...item, reminderTriggered: true } : item
            )
          );
        }
      });
    };
    const timer = setInterval(checkReminders, 10000);
    return () => clearInterval(timer);
  }, [tasks, settings.focusAlarm, settings.alarmSound, showToast]);

  const updateFlexibleMinutes = (mins) => {
    const clamped = Math.max(1, Math.min(480, Math.round(mins)));
    setSettings((prev) => ({ ...prev, pomodoroLength: clamped }));
    if (timerStatus === 'idle' && timerMode === 'countdown') {
      setSecondsLeft(clamped * 60);
    }
  };

  const handleTimerWheel = (e) => {
    if (timerStatus !== 'idle' || timerMode !== 'countdown') return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1;
    updateFlexibleMinutes(settings.pomodoroLength + delta);
    setIsDrumRolling(true);
    if (drumRollTimeoutRef.current) clearTimeout(drumRollTimeoutRef.current);
    drumRollTimeoutRef.current = setTimeout(() => setIsDrumRolling(false), 900);
  };

  const handleDialTouchStart = (e) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleDialTouchMove = (e) => {
    if (
      touchStartYRef.current === null ||
      timerStatus !== 'idle' ||
      timerMode !== 'countdown'
    )
      return;
    const diff = touchStartYRef.current - e.touches[0].clientY;
    if (Math.abs(diff) >= 14) {
      updateFlexibleMinutes(settings.pomodoroLength + (diff > 0 ? 1 : -1));
      touchStartYRef.current = e.touches[0].clientY;
      setIsDrumRolling(true);
    }
  };

  const handleDialTouchEnd = () => {
    touchStartYRef.current = null;
    if (drumRollTimeoutRef.current) clearTimeout(drumRollTimeoutRef.current);
    drumRollTimeoutRef.current = setTimeout(() => setIsDrumRolling(false), 900);
  };

  const handleWhiteNoiseChange = (mode) => {
    setWhiteNoise(mode);
    soundEngine.setWhiteNoise(mode);
  };

  const toggleBrowserFullscreen = () => {
    const next = !isFlipClockFullscreen;
    setIsFlipClockFullscreen(next);
    if (next) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const handleConfirmStopPomodoro = () => {
    const elapsedMins =
      timerMode === 'countdown'
        ? Math.floor((settings.pomodoroLength * 60 - secondsLeft) / 60)
        : Math.floor(elapsedStopwatchSecs / 60);
    completePomodoroSession(elapsedMins, true);
    setTimerStatus('idle');
    setSecondsLeft(settings.pomodoroLength * 60);
    setElapsedStopwatchSecs(0);
    setIsStopConfirmOpen(false);
  };

  const openTimerModeDialog = () => {
    setPendingTimerMode(timerMode);
    setIsTimerModeModalOpen(true);
  };

  const handleApplyTimerMode = () => {
    setTimerMode(pendingTimerMode);
    setTimerStatus('idle');
    setSecondsLeft(settings.pomodoroLength * 60);
    setElapsedStopwatchSecs(0);
    setIsTimerModeModalOpen(false);
  };

  // ============================================================================
  // 8. PER-TAB DATE / WEEK NAVIGATION & FILTERED TASK / STATS MEMOS
  // ============================================================================
  const tomorrowStr = getDateStr(1);
  const activeTabOffset = tabOffsets[activeFilter] || 0;
  const isWeekTab = !searchQuery.trim() && activeFilter === 'week';
  const isTomorrowTab = !searchQuery.trim() && activeFilter === 'tomorrow';
  const isPlannedTab = !searchQuery.trim() && activeFilter === 'planned';
  const isFuturePlannerTab = isTomorrowTab || isPlannedTab;

  const weekTabRange = useMemo(() => {
    const monthShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const fmtYMD = (dt) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
        dt.getDate()
      ).padStart(2, '0')}`;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dow = (now.getDay() + 6) % 7;
    const wkStart = new Date(now);
    wkStart.setDate(now.getDate() - dow - activeTabOffset * 7);
    const wkEnd = new Date(wkStart);
    wkEnd.setDate(wkStart.getDate() + 6);

    const startStr = fmtYMD(wkStart);
    const endStr = fmtYMD(wkEnd);
    const label =
      activeTabOffset === 0
        ? 'This Week'
        : `${wkStart.getDate()} ${monthShort[wkStart.getMonth()]} - ${wkEnd.getDate()} ${monthShort[wkEnd.getMonth()]}`;

    return { startStr, endStr, label };
  }, [activeTabOffset]);

  const selectedWorkspaceDateStr = getDateStr(-activeTabOffset);
  const tomorrowTargetDateStr = getDateStr(1 + (futureTabOffsets.tomorrow || 0));
  const plannedTargetDateStr = getDateStr(futureTabOffsets.planned || 0);

  const targetDateStr = isTomorrowTab
    ? tomorrowTargetDateStr
    : isPlannedTab
    ? plannedTargetDateStr
    : selectedWorkspaceDateStr;

  const isHistoricalReadOnly =
    !searchQuery.trim() &&
    !isFuturePlannerTab &&
    (isWeekTab ? activeTabOffset > 0 : activeTabOffset > 0);

  const activeTabGoalHours = useMemo(() => {
    if (activeFilter === 'today') {
      return dateGoals[selectedWorkspaceDateStr] ?? settings.dailyGoalHours;
    }
    if (activeFilter.startsWith('proj-')) {
      return tabGoals[activeFilter] ?? 4;
    }
    return settings.dailyGoalHours;
  }, [
    activeFilter,
    dateGoals,
    selectedWorkspaceDateStr,
    tabGoals,
    settings.dailyGoalHours,
  ]);

  const formatShortDateLabel = useCallback((dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const monthIdx = parseInt(month, 10) - 1;
    const mName = monthNames[monthIdx] || month;
    return `${day.padStart(2, '0')}-${mName}-${year.slice(-2)}`;
  }, []);

  const getWeekdayTitle = useCallback((dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  const activeViewMeta = useMemo(() => {
    if (searchQuery.trim()) return { title: `Search: "${searchQuery.trim()}"` };
    if (activeFilter === 'today') {
      if (activeTabOffset === 0) return { title: 'Today' };
      if (activeTabOffset === 1) return { title: 'Yesterday' };
      return { title: getWeekdayTitle(selectedWorkspaceDateStr) };
    }
    if (activeFilter === 'tomorrow') {
      if ((futureTabOffsets.tomorrow || 0) === 0) return { title: 'Tomorrow' };
      return { title: getWeekdayTitle(tomorrowTargetDateStr) };
    }
    const smartMap = {
      today: 'Today',
      overdue: 'Overdue',
      tomorrow: 'Tomorrow',
      week: 'This Week',
      next7: 'Next 7 Days',
      highPriority: 'High Priority',
      mediumPriority: 'Medium Priority',
      lowPriority: 'Low Priority',
      planned: 'Planned',
      all: 'All',
      someday: 'Someday',
      completed: 'Completed',
      tasks: 'Tasks',
    };
    if (smartMap[activeFilter]) return { title: smartMap[activeFilter] };
    const proj = projects.find((p) => p.id === activeFilter);
    return { title: proj ? proj.name : 'Tasks' };
  }, [
    activeFilter,
    activeTabOffset,
    futureTabOffsets.tomorrow,
    getWeekdayTitle,
    projects,
    searchQuery,
    selectedWorkspaceDateStr,
    tomorrowTargetDateStr,
  ]);

  const filteredTasks = useMemo(() => {
    let list = tasks.filter((t) => !t.archived);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    } else if (activeFilter === 'today') {
      if (activeTabOffset === 0) {
        list = list.filter(
          (t) =>
            t.dueDate === todayStr ||
            (t.completed && t.completedDate === todayStr)
        );
      } else {
        const sessionTaskIds = new Set(
          validSessions
            .filter((s) => s.date === selectedWorkspaceDateStr && s.taskId)
            .map((s) => s.taskId)
        );
        list = list.filter(
          (t) =>
            t.dueDate === selectedWorkspaceDateStr ||
            t.completedDate === selectedWorkspaceDateStr ||
            sessionTaskIds.has(t.id)
        );
      }
    } else if (activeFilter === 'overdue') {
      list = list.filter((t) => !t.completed && t.dueDate && t.dueDate < todayStr);
    } else if (activeFilter === 'tomorrow') {
      list = list.filter((t) => t.dueDate === tomorrowTargetDateStr);
    } else if (activeFilter === 'week') {
      const weekSessionTaskIds = new Set(
        validSessions
          .filter(
            (s) =>
              s.date >= weekTabRange.startStr &&
              s.date <= weekTabRange.endStr &&
              s.taskId
          )
          .map((s) => s.taskId)
      );
      list = list.filter(
        (t) =>
          (t.dueDate &&
            t.dueDate >= weekTabRange.startStr &&
            t.dueDate <= weekTabRange.endStr) ||
          (t.completedDate &&
            t.completedDate >= weekTabRange.startStr &&
            t.completedDate <= weekTabRange.endStr) ||
          weekSessionTaskIds.has(t.id)
      );
    } else if (activeFilter === 'next7') {
      list = list.filter(
        (t) => t.dueDate && t.dueDate >= todayStr && t.dueDate <= weekEndStr
      );
    } else if (activeFilter === 'planned') {
      list = list.filter((t) => Boolean(t.dueDate) && t.dueDate >= plannedTargetDateStr);
    } else if (activeFilter === 'someday') {
      list = list.filter((t) => !t.dueDate);
    } else if (activeFilter === 'highPriority') {
      list = list.filter((t) => t.estPomodoros >= 3);
    } else if (activeFilter === 'mediumPriority') {
      list = list.filter((t) => t.estPomodoros === 2);
    } else if (activeFilter === 'lowPriority') {
      list = list.filter((t) => t.estPomodoros <= 1);
    } else if (activeFilter === 'completed') {
      list = list.filter((t) => t.completed);
    } else if (activeFilter.startsWith('proj-')) {
      const childProjIds = projects
        .filter((p) => p.parentId === activeFilter)
        .map((p) => p.id);
      const validIds = new Set([activeFilter, ...childProjIds]);
      const projSessionTaskIds = new Set(
        validSessions
          .filter((s) => s.date === selectedWorkspaceDateStr && s.taskId)
          .map((s) => s.taskId)
      );
      list = list.filter(
        (t) =>
          validIds.has(t.projectId) &&
          (t.dueDate === selectedWorkspaceDateStr ||
            t.completedDate === selectedWorkspaceDateStr ||
            projSessionTaskIds.has(t.id))
      );
    }

    return list;
  }, [
    tasks,
    projects,
    validSessions,
    activeFilter,
    activeTabOffset,
    selectedWorkspaceDateStr,
    tomorrowTargetDateStr,
    plannedTargetDateStr,
    weekTabRange,
    searchQuery,
    todayStr,
    weekEndStr,
  ]);

  const activeTasks = useMemo(
    () => filteredTasks.filter((t) => !t.completed),
    [filteredTasks]
  );

  const completedTasks = useMemo(
    () => filteredTasks.filter((t) => t.completed),
    [filteredTasks]
  );

  const sidebarCounts = useMemo(() => {
    const incomplete = tasks.filter((t) => !t.completed && !t.archived);
    const todayTasks = incomplete.filter((t) => t.dueDate === todayStr);
    const weekTasks = incomplete.filter(
      (t) => t.dueDate && t.dueDate >= todayStr && t.dueDate <= weekEndStr
    );
    return {
      today: {
        count: todayTasks.length,
        mins: todayTasks.reduce(
          (acc, t) =>
            acc +
            Math.max(0, t.estPomodoros - t.completedPomodoros) * settings.pomodoroLength,
          0
        ),
      },
      week: {
        count: weekTasks.length,
        mins: weekTasks.reduce(
          (acc, t) =>
            acc +
            Math.max(0, t.estPomodoros - t.completedPomodoros) * settings.pomodoroLength,
          0
        ),
      },
      all: {
        count: incomplete.length,
        mins: incomplete.reduce(
          (acc, t) =>
            acc +
            Math.max(0, t.estPomodoros - t.completedPomodoros) * settings.pomodoroLength,
          0
        ),
      },
    };
  }, [tasks, todayStr, weekEndStr, settings.pomodoroLength]);

  const workspaceStats = useMemo(() => {
    const isProjectTab = !searchQuery.trim() && activeFilter.startsWith('proj-');
    const projectScopeIds = isProjectTab
      ? new Set([
          activeFilter,
          ...projects.filter((p) => p.parentId === activeFilter).map((p) => p.id),
        ])
      : null;

    const kpiSourceTasks = isProjectTab
      ? tasks.filter((t) => !t.archived && projectScopeIds.has(t.projectId))
      : null;
    const kpiActiveTasks = isProjectTab
      ? kpiSourceTasks.filter((t) => !t.completed)
      : activeTasks;
    const kpiCompletedTasks = isProjectTab
      ? kpiSourceTasks.filter((t) => t.completed)
      : completedTasks;

    const estimatedMins = kpiActiveTasks.reduce(
      (acc, t) =>
        acc +
        Math.max(0, t.estPomodoros - t.completedPomodoros) * settings.pomodoroLength,
      0
    );
    const toCompleteCount = kpiActiveTasks.length;

    if (isWeekTab) {
      const weekSessions = validSessions.filter(
        (s) => s.date >= weekTabRange.startStr && s.date <= weekTabRange.endStr
      );
      const weekTotalMins = weekSessions.reduce((acc, s) => acc + s.durationMins, 0);
      const weekAvgDailyMins = Math.round(weekTotalMins / 7);

      const past4Start = getDateStr(-28 - activeTabOffset * 7);
      const past4End = getDateStr(-1 - activeTabOffset * 7);
      const past4Sessions = validSessions.filter(
        (s) => s.date >= past4Start && s.date <= past4End
      );
      const past4AvgDailyMins = Math.round(
        past4Sessions.reduce((acc, s) => acc + s.durationMins, 0) / 28
      );
      const baselineDailyMins = Math.max(
        past4AvgDailyMins,
        Math.max(1, settings.dailyGoalHours) * 60
      );

      return {
        estimatedMins,
        toCompleteCount,
        elapsedMins: weekTotalMins,
        completedCount: completedTasks.length,
        selectedDayFocusMins: weekTotalMins,
        weekAvgDailyMins,
        weekBaselineDailyMins: baselineDailyMins,
      };
    }

    const selectedDayFocusMins = validSessions
      .filter((s) => {
        if (s.date !== targetDateStr) return false;
        if (isProjectTab) return projectScopeIds.has(s.projectId);
        return true;
      })
      .reduce((acc, s) => acc + s.durationMins, 0);

    const elapsedMins =
      activeFilter === 'today'
        ? selectedDayFocusMins
        : isProjectTab
        ? validSessions
            .filter((s) => projectScopeIds.has(s.projectId))
            .reduce((acc, s) => acc + s.durationMins, 0)
        : Math.max(
            selectedDayFocusMins,
            filteredTasks.reduce((acc, t) => acc + t.completedPomodoros * 25, 0)
          );

    return {
      estimatedMins,
      toCompleteCount,
      elapsedMins,
      completedCount: kpiCompletedTasks.length,
      selectedDayFocusMins,
      weekAvgDailyMins: 0,
      weekBaselineDailyMins: 0,
    };
  }, [
    tasks,
    activeTasks,
    completedTasks,
    filteredTasks,
    projects,
    validSessions,
    activeFilter,
    activeTabOffset,
    searchQuery,
    isWeekTab,
    weekTabRange,
    targetDateStr,
    settings.pomodoroLength,
    settings.dailyGoalHours,
  ]);

  const reportStats = useMemo(() => {
    const todaySessions = validSessions.filter((s) => s.date === todayStr);
    const todayFocusMins = todaySessions.reduce((acc, s) => acc + s.durationMins, 0);

    const weekStartStr = getDateStr(-6);
    const weekSessions = validSessions.filter(
      (s) => s.date >= weekStartStr && s.date <= todayStr
    );
    const weekFocusMins = weekSessions.reduce((acc, s) => acc + s.durationMins, 0);

    const totalFocusMins = validSessions.reduce((acc, s) => acc + s.durationMins, 0);

    const activeCompletedToday = tasks.filter(
      (t) => t.completed && (t.completedDate || todayStr) === todayStr
    ).length;
    const deletedCompletedToday = (deletedHistory.tasks || []).filter(
      (t) => t.completed && (t.completedDate || todayStr) === todayStr
    ).length;
    const todayCompletedTasks = activeCompletedToday + deletedCompletedToday;

    const activeCompletedWeek = tasks.filter((t) => {
      if (!t.completed) return false;
      const cDate = t.completedDate || todayStr;
      return cDate >= weekStartStr && cDate <= todayStr;
    }).length;
    const deletedCompletedWeek = (deletedHistory.tasks || []).filter((t) => {
      if (!t.completed) return false;
      const cDate = t.completedDate || todayStr;
      return cDate >= weekStartStr && cDate <= todayStr;
    }).length;
    const weekCompletedTasks = activeCompletedWeek + deletedCompletedWeek;

    const totalCompletedTasks =
      tasks.filter((t) => t.completed).length +
      (deletedHistory.tasks || []).filter((t) => t.completed).length;

    const distMap = {};
    validSessions.forEach((s) => {
      if (!distMap[s.projectId]) {
        const proj =
          projects.find((p) => p.id === s.projectId) ||
          (deletedHistory.projects || []).find((p) => p.id === s.projectId);
        distMap[s.projectId] = {
          id: s.projectId,
          name: proj ? proj.name : s.projectName || 'Tasks',
          color: proj ? proj.color : s.projectColor || '#3b82f6',
          mins: 0,
        };
      }
      distMap[s.projectId].mins += s.durationMins;
    });
    const projectDistribution = Object.values(distMap).sort((a, b) => b.mins - a.mins);

    const totalDistMins = projectDistribution.reduce((acc, p) => acc + p.mins, 0);

    return {
      todaySessions,
      todayFocusMins,
      weekFocusMins,
      totalFocusMins,
      todayCompletedTasks,
      weekCompletedTasks,
      totalCompletedTasks,
      projectDistribution,
      totalDistMins,
    };
  }, [validSessions, tasks, deletedHistory, projects, todayStr]);

  const currentActiveTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || activeTasks[0] || null,
    [tasks, selectedTaskId, activeTasks]
  );

  // ============================================================================
  // TASK, PROJECT, TAG & FOLDER CRUD HANDLERS
  // ============================================================================
  const handleAddTask = (e) => {
    if (e) e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;

    const targetProjectId = activeFilter.startsWith('proj-')
      ? activeFilter
      : newTaskProjectId === 'none'
      ? ''
      : newTaskProjectId;

    const dueDate =
      newTaskDue === 'calendar' && newTaskCustomDate
        ? newTaskCustomDate
        : isFuturePlannerTab
        ? newTaskCustomDate ||
          (isTomorrowTab
            ? tomorrowTargetDateStr
            : isWeekTab
            ? weekTabRange.startStr
            : plannedTargetDateStr)
        : newTaskDue === 'today'
        ? todayStr
        : newTaskDue === 'week'
        ? newTaskCustomDate || weekEndStr
        : '';

    const hasReminder = newTaskReminderType !== 'none' && Boolean(newTaskReminderTime);

    const newTask = {
      id: `t-${Date.now()}`,
      title: trimmed,
      projectId: targetProjectId,
      estPomodoros: newTaskPomodoros,
      completedPomodoros: 0,
      completed: false,
      createdAt: todayStr,
      notes: [],
      dueDate,
      completedDate: null,
      reminderType: newTaskReminderType,
      reminderSchedule: newTaskReminderSchedule,
      reminderTime: hasReminder ? newTaskReminderTime : '',
      reminderAlarm: newTaskReminderType === 'alarm' || newTaskReminderAlarm,
    };

    setTasks((prev) => (settings.addTasksOnTop ? [newTask, ...prev] : [...prev, newTask]));
    updateCurrentDraft({
      title: '',
      reminderTime: '',
      reminderType: 'none',
    });
    setTaskbarPopoverMode(null);
    const projObj = targetProjectId ? projects.find((p) => p.id === targetProjectId) : null;
    showToast(
      hasReminder
        ? `Scheduled "${trimmed}"${projObj ? ` (${projObj.name})` : ''} • ${newTaskReminderType === 'alarm' ? 'Alarm' : 'Reminder'} at ${newTaskReminderTime}`
        : projObj
        ? `Added "${trimmed}" to ${projObj.name}`
        : `Added task "${trimmed}"`
    );
  };

  const handleToggleTaskComplete = (taskId) => {
    let completedTaskTitle = '';
    let wasCompleted = false;

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextCompleted = !t.completed;
        wasCompleted = nextCompleted;
        completedTaskTitle = t.title;
        return {
          ...t,
          completed: nextCompleted,
          completedDate: nextCompleted ? todayStr : null,
          completedPomodoros:
            nextCompleted && t.completedPomodoros === 0 && t.estPomodoros > 0
              ? t.estPomodoros
              : t.completedPomodoros,
        };
      })
    );

    if (wasCompleted) {
      if (settings.playCompletionSound) {
        soundEngine.playTaskComplete();
      }
      if (selectedTaskId === taskId) {
        const nextCandidate = tasks.find((t) => t.id !== taskId && !t.completed);
        setSelectedTaskId(nextCandidate ? nextCandidate.id : '');
      }
      showToast(`Completed "${completedTaskTitle}"`);
    }
  };

  const handleDeleteTask = (taskId) => {
    const target = tasks.find((t) => t.id === taskId);
    if (target) {
      const proj = projects.find((p) => p.id === target.projectId);
      const taskMins = validSessions
        .filter((s) => s.taskId === target.id)
        .reduce((acc, s) => acc + s.durationMins, 0);
      setDeletedHistory((prev) => ({
        ...prev,
        tasks: [
          {
            ...target,
            projectName: proj ? proj.name : 'Tasks',
            projectColor: proj ? proj.color : '#3b82f6',
            recordedMins: taskMins,
            deletedAt: todayStr,
          },
          ...(prev.tasks || []),
        ],
      }));
    }
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTaskId === taskId) {
      setSelectedTaskId('');
    }
    showToast('Task moved to User History (statistics preserved)');
  };

  const handleLaunchFocusForTask = (task) => {
    setSelectedTaskId(task.id);
    setActiveView('focus');
    soundEngine.init();
    setTimerStatus('running');
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    const trimmed = newProjectName.trim();
    if (!trimmed) return;
    const newProj = {
      id: `proj-${Date.now()}`,
      name: trimmed,
      color: newProjectColor,
      parentId: newProjectParentId || null,
      completed: false,
      reminderTime: newProjectReminderType !== 'none' ? newProjectReminderTime : '',
      reminderType: newProjectReminderType,
    };
    setProjects((prev) => [...prev, newProj]);
    if (newProjectParentId) {
      setExpandedProjects((prev) => ({ ...prev, [newProjectParentId]: true }));
    }
    setTabGoals((prev) => ({ ...prev, [newProj.id]: 4 }));
    setTabOffsets((prev) => ({ ...prev, [newProj.id]: 0 }));

    if (assignNewProjectToTask) {
      setNewTaskProjectId(newProj.id);
      const pendingTaskText = newTaskTitle.trim();
      if (pendingTaskText) {
        const dueDate = isFuturePlannerTab
          ? newTaskCustomDate ||
            (isTomorrowTab
              ? tomorrowTargetDateStr
              : isWeekTab
              ? weekTabRange.startStr
              : plannedTargetDateStr)
          : newTaskDue === 'today'
          ? todayStr
          : newTaskDue === 'week'
          ? weekEndStr
          : '';
        const hasReminder = newTaskReminderType !== 'none' && Boolean(newTaskReminderTime);
        const autoTask = {
          id: `t-${Date.now() + 1}`,
          title: pendingTaskText,
          projectId: newProj.id,
          estPomodoros: newTaskPomodoros,
          completedPomodoros: 0,
          completed: false,
          createdAt: todayStr,
          notes: [],
          dueDate,
          completedDate: null,
          reminderType: newTaskReminderType,
          reminderSchedule: newTaskReminderSchedule,
          reminderTime: hasReminder ? newTaskReminderTime : '',
          reminderAlarm: newTaskReminderType === 'alarm' || newTaskReminderAlarm,
        };
        setTasks((prev) => (settings.addTasksOnTop ? [autoTask, ...prev] : [...prev, autoTask]));
        setNewTaskTitle('');
        setNewTaskReminderTime('');
        setNewTaskReminderType('none');
      }
      setAssignNewProjectToTask(false);
    } else {
      setActiveFilter(newProj.id);
    }

    setNewProjectName('');
    setNewProjectParentId(null);
    setNewProjectReminderTime('');
    setNewProjectReminderType('none');
    setIsAddProjectOpen(false);
    showToast(
      assignNewProjectToTask
        ? `Created project "${trimmed}" and linked to task`
        : newProj.reminderTime
        ? `Created ${newProj.parentId ? 'sub-project' : 'project'} "${trimmed}" with reminder at ${newProj.reminderTime}`
        : `Created ${newProj.parentId ? 'sub-project' : 'project'} "${trimmed}"`
    );
  };

  const handleConfirmToggleProjectActive = () => {
    if (!projectStatusConfirm) return;
    const { id, name, nextInactive } = projectStatusConfirm;
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, inactive: nextInactive } : p))
    );
    setProjectStatusConfirm(null);
    showToast(
      nextInactive
        ? `Project "${name}" set to Inactive (still visible in Project menu)`
        : `Project "${name}" is now Active`
    );
  };

  const handleArchiveProject = (proj) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === proj.id ? { ...p, archived: true } : p))
    );
    if (activeFilter === proj.id) {
      setActiveFilter('today');
    }
    setProjectMenuId(null);
    showToast(`Archived project "${proj.name}"`);
  };

  const handleRestoreProject = (projId) => {
    const target = projects.find((p) => p.id === projId);
    setProjects((prev) =>
      prev.map((p) => (p.id === projId ? { ...p, archived: false } : p))
    );
    if (target) {
      showToast(`Restored project "${target.name}"`);
    }
  };

  const handleArchiveTask = (task) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, archived: true, archivedAt: todayStr } : t
      )
    );
    if (selectedTaskId === task.id) {
      setSelectedTaskId('');
    }
    setTaskMenuId(null);
    showToast(`Archived task "${task.title}" (statistics preserved)`);
  };

  const handleRestoreTask = (taskId) => {
    const target = tasks.find((t) => t.id === taskId);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, archived: false } : t))
    );
    if (target) {
      showToast(`Restored task "${target.title}"`);
    }
  };

  const handleToggleProjectComplete = (proj) => {
    const nextState = !proj.completed;
    setProjects((prev) =>
      prev.map((p) => (p.id === proj.id ? { ...p, completed: nextState } : p))
    );
    setTasks((prev) =>
      prev.map((t) =>
        t.projectId === proj.id
          ? {
              ...t,
              completed: nextState,
              completedDate: nextState ? t.completedDate || todayStr : null,
            }
          : t
      )
    );
    setProjectMenuId(null);
    showToast(nextState ? `Completed project "${proj.name}"` : `Reopened "${proj.name}"`);
  };

  const handleConfirmDeleteProject = () => {
    if (!deletingProject) return;
    const childIds = projects
      .filter((p) => p.parentId === deletingProject.id)
      .map((p) => p.id);
    const allDeletingIds = new Set([deletingProject.id, ...childIds]);
    const targetProj = projects.find((p) => p.id === deletingProject.id);
    const projTasks = tasks.filter((t) => allDeletingIds.has(t.projectId));
    const projMins = validSessions
      .filter((s) => allDeletingIds.has(s.projectId))
      .reduce((acc, s) => acc + s.durationMins, 0);

    if (targetProj) {
      setDeletedHistory((prev) => ({
        projects: [
          {
            ...targetProj,
            recordedMins: projMins,
            taskCount: projTasks.length,
            deletedAt: todayStr,
          },
          ...(prev.projects || []),
        ],
        tasks: [
          ...projTasks.map((t) => ({
            ...t,
            projectName: targetProj.name,
            projectColor: targetProj.color,
            recordedMins: validSessions
              .filter((s) => s.taskId === t.id)
              .reduce((acc, s) => acc + s.durationMins, 0),
            deletedAt: todayStr,
          })),
          ...(prev.tasks || []),
        ],
      }));
    }

    setProjects((prev) => prev.filter((p) => !allDeletingIds.has(p.id)));
    setTasks((prev) => prev.filter((t) => !allDeletingIds.has(t.projectId)));
    if (allDeletingIds.has(activeFilter)) {
      setActiveFilter('today');
    }
    showToast(`Project "${deletingProject.name}" moved to User History (statistics preserved)`);
    setDeletingProject(null);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    setTags((prev) => [...prev, { id: `tag-${Date.now()}`, name: trimmed }]);
    setNewTagName('');
    setIsAddTagOpen(false);
    showToast(`Added tag #${trimmed}`);
  };

  const handleAddFolder = (e) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    setFolders((prev) => [...prev, { id: `folder-${Date.now()}`, name: trimmed }]);
    setNewFolderName('');
    setIsAddFolderOpen(false);
    showToast(`Created folder "${trimmed}"`);
  };

  const buildBackupPayload = () => ({
    format: 'focus-to-do-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      projects,
      tasks,
      sessions,
      deletedHistory,
      settings,
      tags,
      folders,
      tabGoals,
      dateGoals,
    },
  });

  const downloadBackup = (payload, filename) => {
    try {
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return true;
    } catch (e) {
      showToast('Could not download the backup. Please try again.');
      return false;
    }
  };

  const handleExportBackup = () => {
    const downloaded = downloadBackup(
      JSON.stringify(buildBackupPayload(), null, 2),
      `focus-todo-backup-${todayStr}.json`
    );
    if (downloaded) showToast('Complete backup JSON downloaded');
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    // Allow the same file to be selected again after a cancelled or failed restore.
    e.target.value = '';
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showToast('Backup is too large to restore in this browser.');
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => showToast('Could not read that backup file.');
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ''));
        // Also accept the older export format produced by earlier versions of this app.
        const imported = parsed?.data || parsed;
        const isObject = (value) =>
          Boolean(value) && typeof value === 'object' && !Array.isArray(value);

        const hasValidCoreArrays =
          isObject(imported) &&
          (Array.isArray(imported.projects) ||
            Array.isArray(imported.tasks) ||
            Array.isArray(imported.sessions) ||
            isObject(imported.deletedHistory));

        if (!hasValidCoreArrays) {
          throw new Error('Invalid backup');
        }

        const restored = {
          projects: Array.isArray(imported.projects) ? imported.projects : [],
          tasks: Array.isArray(imported.tasks) ? imported.tasks : [],
          sessions: Array.isArray(imported.sessions) ? imported.sessions : [],
          deletedHistory: isObject(imported.deletedHistory)
            ? {
                projects: Array.isArray(imported.deletedHistory.projects)
                  ? imported.deletedHistory.projects
                  : [],
                tasks: Array.isArray(imported.deletedHistory.tasks)
                  ? imported.deletedHistory.tasks
                  : [],
              }
            : { projects: [], tasks: [] },
          settings: isObject(imported.settings)
            ? { ...DEFAULT_SETTINGS, ...imported.settings }
            : DEFAULT_SETTINGS,
          tags: Array.isArray(imported.tags) ? imported.tags : [],
          folders: Array.isArray(imported.folders) ? imported.folders : [],
          tabGoals: isObject(imported.tabGoals) ? imported.tabGoals : {},
          dateGoals: isObject(imported.dateGoals) ? imported.dateGoals : {},
        };

        const summary = `${restored.projects.length} projects, ${restored.tasks.length} tasks, and ${restored.sessions.length} focus sessions`;
        setPendingBackupRestore({
          restored,
          summary,
          fileName: file.name,
        });
      } catch (error) {
        showToast('This is not a valid Focus To-Do backup file.');
      }
    };
    reader.readAsText(file);
  };

  const confirmBackupRestore = () => {
    if (!pendingBackupRestore) return;
    const { restored, summary } = pendingBackupRestore;
    try {
      downloadBackup(
        JSON.stringify(buildBackupPayload(), null, 2),
        `focus-todo-before-restore-${todayStr}.json`
      );
    } catch (e) {}

    setProjects(restored.projects);
    setTasks(restored.tasks);
    setSessions(restored.sessions);
    setDeletedHistory(restored.deletedHistory);
    setSettings(restored.settings);
    setTags(restored.tags);
    setFolders(restored.folders);
    setTabGoals(restored.tabGoals);
    setDateGoals(restored.dateGoals);
    setSelectedTaskId('');
    setActiveFilter('today');
    setPendingBackupRestore(null);
    showToast(`Backup restored: ${summary}`);
  };

  const handleResetDemoData = () => {
    setProjects(INITIAL_PROJECTS);
    setTasks(createInitialTasks());
    setSessions(createInitialSessions());
    setDeletedHistory({ projects: [], tasks: [] });
    setSettings(DEFAULT_SETTINGS);
    setTags([]);
    setFolders([]);
    setTabGoals({});
    setDateGoals({});
    setSelectedTaskId('');
    setActiveFilter('today');
    try {
      localStorage.removeItem('ftd_projects_v2');
      localStorage.removeItem('ftd_tasks_v2');
      localStorage.removeItem('ftd_sessions_v2');
      localStorage.removeItem('ftd_deleted_history_v2');
      localStorage.removeItem('ftd_settings_v2');
      localStorage.removeItem('ftd_tags_v2');
      localStorage.removeItem('ftd_folders_v2');
      localStorage.removeItem('ftd_tab_goals_v2');
      localStorage.removeItem('ftd_date_goals_v2');
    } catch (e) {}
    showToast('All user data reset to a clean slate');
  };

  const isAmoled = settings.darkMode === 'AMOLED Black';

  // ============================================================================
  // 9. RENDER: FULLSCREEN FOCUS TIMER VIEW
  // ============================================================================
  const renderFocusView = () => {
    const displaySecs = timerMode === 'countdown' ? secondsLeft : elapsedStopwatchSecs;
    const totalSecs =
      timerStatus === 'break'
        ? settings.shortBreakLength * 60
        : Math.max(60, settings.pomodoroLength * 60);
    const progressFraction =
      timerMode === 'countdown'
        ? Math.min(1, Math.max(0, 1 - displaySecs / totalSecs))
        : (displaySecs % 3600) / 3600;

    const totalTicks = 120;
    const activeTicksCount = Math.floor(progressFraction * totalTicks);
    const ticks = Array.from({ length: totalTicks }, (_, i) => i);

    const todayFocusFormatted = formatHoursMins(reportStats.todayFocusMins);
    const focusSidebarTasks = tasks.filter(
      (t) => t.dueDate === todayStr || t.projectId === 'proj-pe' || t.id === selectedTaskId
    );

    const wallpaperStyles = {
      forest:
        'radial-gradient(circle at 38% 48%, rgba(16, 68, 54, 0.55) 0%, rgba(10, 18, 16, 0.96) 72%), repeating-linear-gradient(115deg, rgba(16, 185, 129, 0.05) 0px, rgba(16, 185, 129, 0.05) 2px, transparent 2px, transparent 18px), linear-gradient(135deg, #071915 0%, #0f1315 100%)',
      ocean:
        'radial-gradient(circle at 65% 25%, rgba(14, 165, 233, 0.42) 0%, rgba(12, 24, 34, 0.94) 68%), linear-gradient(145deg, #083344 0%, #0e7490 48%, #27272a 100%)',
      woods:
        'radial-gradient(circle at 48% 28%, rgba(132, 204, 22, 0.34) 0%, rgba(18, 24, 15, 0.96) 72%), linear-gradient(160deg, #1a2e05 0%, #273912 45%, #111610 100%)',
      fuji:
        'radial-gradient(circle at 50% 25%, rgba(129, 140, 248, 0.38) 0%, rgba(15, 17, 30, 0.96) 74%), linear-gradient(180deg, #1e1b4b 0%, #312e81 45%, #0f172a 100%)',
    };

    const currentMins = Math.max(1, Math.min(480, Math.round(settings.pomodoroLength)));
    const prev3 = currentMins - 3 >= 1 ? `${currentMins - 3}:00` : '';
    const prev2 = currentMins - 2 >= 1 ? `${currentMins - 2}:00` : '';
    const prev1 = currentMins - 1 >= 1 ? `${currentMins - 1}:00` : '';
    const next1 = currentMins + 1 <= 480 ? `${currentMins + 1}:00` : '';
    const next2 = currentMins + 2 <= 480 ? `${currentMins + 2}:00` : '';
    const next3 = currentMins + 3 <= 480 ? `${currentMins + 3}:00` : '';

    return (
      <div
        className="fixed inset-0 z-50 flex flex-col lg:flex-row text-white overflow-hidden select-none"
        style={{
          background: wallpaperStyles[settings.focusWallpaper] || wallpaperStyles.forest,
        }}
      >
        {/* Left / Center Timer Stage */}
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveView('workspace')}
                title="Minimize Focus View"
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={toggleBrowserFullscreen}
                title="Toggle Fullscreen Flip Clock"
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center my-auto py-2">
            {/* Active Task Selector Pill */}
            <div className="w-full max-w-md mb-6 px-4 py-2.5 rounded-xl bg-[#1c1c1e]/85 backdrop-blur-md border border-white/10 flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() =>
                    currentActiveTask && handleToggleTaskComplete(currentActiveTask.id)
                  }
                  className="w-4 h-4 rounded-full border border-gray-400 hover:border-[#ef5350] flex items-center justify-center shrink-0 transition"
                >
                  {currentActiveTask?.completed && (
                    <Check className="w-3 h-3 text-[#ef5350]" />
                  )}
                </button>
                <div className="truncate">
                  <div className="text-xs sm:text-sm font-medium text-gray-100 truncate">
                    {currentActiveTask ? currentActiveTask.title : 'Free Focus Session'}
                  </div>
                  {currentActiveTask && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {Array.from({
                        length: Math.max(
                          1,
                          Math.min(
                            8,
                            Math.max(
                              currentActiveTask.estPomodoros,
                              currentActiveTask.completedPomodoros
                            )
                          )
                        ),
                      }).map((_, i) => (
                        <TomatoIcon
                          key={i}
                          filled={i < currentActiveTask.completedPomodoros}
                          size={11}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {currentActiveTask && (
                <button
                  type="button"
                  onClick={() => setSelectedTaskId('')}
                  className="p-1 text-gray-400 hover:text-white transition"
                  title="Clear task selection"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Radial 120-Tick Pomodoro Dial */}
            <div
              onWheel={handleTimerWheel}
              onTouchStart={handleDialTouchStart}
              onTouchMove={handleDialTouchMove}
              onTouchEnd={handleDialTouchEnd}
              className={`relative flex items-center justify-center ${
                timerStatus === 'idle' && timerMode === 'countdown'
                  ? 'cursor-ns-resize'
                  : 'cursor-default'
              }`}
            >
              <svg className="w-72 h-72 sm:w-[370px] sm:h-[370px]" viewBox="0 0 360 360">
                <defs>
                  <linearGradient id="topNeedleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef5350" stopOpacity="1" />
                    <stop offset="100%" stopColor="#ef5350" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {(timerStatus === 'running' || timerStatus === 'paused') && (
                  <g>
                    <line
                      x1="180"
                      y1="16"
                      x2="180"
                      y2="78"
                      stroke="url(#topNeedleGrad)"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {ticks.map((idx) => {
                  const angle = idx * 3;
                  const isActive = idx <= activeTicksCount;
                  const isTopTick =
                    idx === 0 && (timerStatus === 'running' || timerStatus === 'paused');
                  return (
                    <line
                      key={idx}
                      x1="180"
                      y1="16"
                      x2="180"
                      y2="29"
                      stroke={
                        isTopTick
                          ? '#ef5350'
                          : timerStatus === 'break'
                          ? isActive
                            ? '#22c55e'
                            : 'rgba(255,255,255,0.22)'
                          : isActive && (timerStatus === 'running' || timerStatus === 'paused')
                          ? '#ef5350'
                          : 'rgba(255,255,255,0.34)'
                      }
                      strokeWidth={isTopTick ? '3.5' : '2.4'}
                      strokeLinecap="round"
                      transform={`rotate(${angle} 180 180)`}
                      className="transition-colors duration-200"
                    />
                  );
                })}
              </svg>

              {/* Center Time Display + Drum-Roll Wheel Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto">
                {timerStatus === 'idle' && timerMode === 'countdown' && isDrumRolling ? (
                  <div className="flex flex-col items-center justify-center leading-none select-none">
                    <span className="text-lg sm:text-xl font-extralight text-white/15 tracking-wider h-5">
                      {prev3}
                    </span>
                    <span className="text-2xl sm:text-3xl font-extralight text-white/25 tracking-wider h-7">
                      {prev2}
                    </span>
                    <span className="text-3xl sm:text-4xl font-extralight text-white/45 tracking-wider h-9">
                      {prev1}
                    </span>
                    <span className="text-5xl sm:text-6xl font-light text-white tracking-tight my-1">
                      {formatTimerDisplay(displaySecs)}
                    </span>
                    <span className="text-3xl sm:text-4xl font-extralight text-white/45 tracking-wider h-9">
                      {next1}
                    </span>
                    <span className="text-2xl sm:text-3xl font-extralight text-white/25 tracking-wider h-7">
                      {next2}
                    </span>
                    <span className="text-lg sm:text-xl font-extralight text-white/15 tracking-wider h-5">
                      {next3}
                    </span>
                  </div>
                ) : isEditingCustomMins && timerStatus === 'idle' && timerMode === 'countdown' ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const parsed = parseInt(customMinsInput, 10);
                      if (!Number.isNaN(parsed)) updateFlexibleMinutes(parsed);
                      setIsEditingCustomMins(false);
                    }}
                    className="flex flex-col items-center"
                  >
                    <input
                      type="number"
                      min="1"
                      max="480"
                      autoFocus
                      value={customMinsInput}
                      onChange={(e) => setCustomMinsInput(e.target.value)}
                      onBlur={() => {
                        const parsed = parseInt(customMinsInput, 10);
                        if (!Number.isNaN(parsed)) updateFlexibleMinutes(parsed);
                        setIsEditingCustomMins(false);
                      }}
                      className="w-36 text-center bg-black/40 border border-[#ef5350] rounded-xl text-4xl sm:text-5xl font-light text-white py-1.5 focus:outline-none"
                    />
                    <span className="text-[11px] text-gray-300 mt-1.5">
                      Enter 1 – 480 mins
                    </span>
                  </form>
                ) : (
                  <div
                    onClick={() => {
                      if (timerStatus === 'idle' && timerMode === 'countdown') {
                        setCustomMinsInput(String(currentMins));
                        setIsEditingCustomMins(true);
                      }
                    }}
                    title={
                      timerStatus === 'idle' && timerMode === 'countdown'
                        ? 'Scroll mouse wheel or click to set 1 – 480 mins'
                        : ''
                    }
                    className="flex flex-col items-center group"
                  >
                    <div className="text-5xl sm:text-7xl font-extralight tracking-tight text-white tabular-nums">
                      {formatTimerDisplay(displaySecs)}
                    </div>
                    {timerStatus === 'idle' && timerMode === 'countdown' && (
                      <div className="mt-2 flex items-center gap-1.5 opacity-75 group-hover:opacity-100 transition">
                        {[25, 60, 100, 220, 480].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateFlexibleMinutes(preset);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              currentMins === preset
                                ? 'bg-[#ef5350] border-[#ef5350] text-white font-medium'
                                : 'bg-black/30 border-white/15 text-gray-300 hover:text-white hover:border-white/40'
                            }`}
                          >
                            {preset}m
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Primary Focus Control Buttons */}
            <div className="mt-7 flex items-center gap-4">
              {timerStatus === 'idle' && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.init();
                    setTimerStatus('running');
                  }}
                  className="px-8 py-3 rounded-full bg-white text-[#14532d] hover:bg-gray-100 font-semibold text-sm flex items-center gap-2.5 shadow-xl transition transform active:scale-95"
                >
                  <Play className="w-4 h-4 fill-[#14532d] text-[#14532d]" />
                  <span>Start to Focus</span>
                </button>
              )}

              {(timerStatus === 'running' || timerStatus === 'break') && (
                <button
                  type="button"
                  onClick={() => setTimerStatus('paused')}
                  className="px-10 py-2.5 rounded-full bg-transparent hover:bg-white/10 text-white border border-white/70 font-medium text-sm transition transform active:scale-95"
                >
                  Pause
                </button>
              )}

              {timerStatus === 'paused' && (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setTimerStatus('running')}
                    className="px-8 py-2.5 rounded-full bg-white hover:bg-gray-100 text-[#14532d] font-semibold text-sm shadow-lg transition transform active:scale-95"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsStopConfirmOpen(true)}
                    className="px-9 py-2.5 rounded-full bg-transparent hover:bg-white/10 text-white border border-white/70 font-medium text-sm transition transform active:scale-95"
                  >
                    Stop
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom 3 Action Icons: Fullscreen, Timer Mode, White Noise */}
          <div className="flex items-center justify-center gap-10 pb-1">
            <button
              type="button"
              onClick={toggleBrowserFullscreen}
              className="flex flex-col items-center gap-1.5 text-gray-300 hover:text-white transition group"
            >
              <div className="w-7 h-7 rounded bg-white text-[#121214] flex items-center justify-center font-bold text-xs shadow">
                25
              </div>
              <span className="text-[11px] text-gray-300 group-hover:text-white">Fullscreen</span>
            </button>

            <button
              type="button"
              onClick={openTimerModeDialog}
              className="flex flex-col items-center gap-1.5 text-gray-300 hover:text-white transition group"
            >
              <div className="w-7 h-7 flex items-center justify-center">
                {timerMode === 'countdown' ? (
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 2h12v6l-4 4 4 4v6H6v-6l4-4-4-4V2z" />
                  </svg>
                ) : (
                  <Clock className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="text-[11px] text-gray-300 group-hover:text-white">Timer Mode</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  handleWhiteNoiseChange(
                    whiteNoise === 'off'
                      ? 'rain'
                      : whiteNoise === 'rain'
                      ? 'forest'
                      : whiteNoise === 'forest'
                      ? 'brown'
                      : 'off'
                  )
                }
                className="flex flex-col items-center gap-1.5 text-gray-300 hover:text-white transition group"
              >
                <div className="w-7 h-7 flex items-center justify-center">
                  <Volume2
                    className={`w-5 h-5 ${
                      whiteNoise !== 'off' ? 'text-[#ef5350]' : 'text-white'
                    }`}
                  />
                </div>
                <span className="text-[11px] text-gray-300 group-hover:text-white">
                  {whiteNoise === 'off' ? 'White Noise' : `Noise: ${whiteNoise}`}
                </span>
              </button>
            </div>
          </div>

          {/* PURE-BLACK FLIP-CLOCK FULLSCREEN OVERLAY WITH BLUE PROGRESS TIMER BAR */}
          {isFlipClockFullscreen && (() => {
            const flipMins = String(Math.floor(displaySecs / 60)).padStart(2, '0');
            const flipSecs = String(displaySecs % 60).padStart(2, '0');
            const barFillPct = Math.min(100, Math.max(0, Math.round(progressFraction * 100)));
            const elapsedMinsDisplay = Math.floor((totalSecs - displaySecs) / 60);

            return (
              <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 sm:p-8 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipClockFullscreen(false);
                    if (document.fullscreenElement) {
                      document.exitFullscreen?.().catch(() => {});
                    }
                    setIsFullscreen(false);
                  }}
                  title="Exit Flip Clock Fullscreen"
                  className="absolute top-5 right-5 w-6 h-6 rounded-full bg-white text-black hover:bg-gray-200 flex items-center justify-center shadow-lg transition"
                >
                  <X className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                {/* Blue Real-Time Progress Timer Bar */}
                <div className="w-full max-w-[330px] sm:max-w-[540px] mb-5">
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5 px-0.5">
                    <span className="truncate font-medium text-gray-300">
                      {currentActiveTask ? currentActiveTask.title : 'Focus Session'}
                    </span>
                  </div>
                  <div className="relative w-full h-7 rounded-lg bg-[#161618] border border-[#2a2a2f] p-1 overflow-hidden">
                    <div
                      className="h-full rounded-md bg-[#3b82f6] transition-all duration-500 ease-out"
                      style={{
                        width: `${barFillPct === 0 ? 0 : Math.max(3, barFillPct)}%`,
                        boxShadow: barFillPct > 0 ? '0 0 14px rgba(59, 130, 246, 0.5)' : 'none',
                      }}
                    />
                    <div className="absolute inset-0 px-3 flex items-center justify-between text-xs pointer-events-none">
                      <span className="font-semibold text-white drop-shadow">
                        {timerMode === 'countdown'
                          ? `${elapsedMinsDisplay}m elapsed (${barFillPct}%)`
                          : `${Math.floor(elapsedStopwatchSecs / 60)}m`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Split Flip-Clock Cards (MM | SS) */}
                <div className="flex items-center justify-center gap-3 sm:gap-5">
                  <div className="relative w-36 h-44 sm:w-64 sm:h-72 rounded-2xl bg-[#1c1c1c] flex items-center justify-center overflow-hidden shadow-2xl">
                    <span className="text-7xl sm:text-[148px] font-bold tracking-tighter text-[#c4c4c4] tabular-nums leading-none">
                      {flipMins}
                    </span>
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-black" />
                  </div>

                  <div className="relative w-36 h-44 sm:w-64 sm:h-72 rounded-2xl bg-[#1c1c1c] flex items-center justify-center overflow-hidden shadow-2xl">
                    <span className="text-7xl sm:text-[148px] font-bold tracking-tighter text-[#c4c4c4] tabular-nums leading-none">
                      {flipSecs}
                    </span>
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-black" />
                  </div>
                </div>

                {/* Bottom Circular Controls */}
                <div className="mt-7 flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (timerStatus === 'running' || timerStatus === 'break') {
                        setTimerStatus('paused');
                      } else {
                        soundEngine.init();
                        setTimerStatus('running');
                      }
                    }}
                    title={timerStatus === 'running' ? 'Pause' : 'Start / Resume'}
                    className="w-8 h-8 rounded-full bg-[#e5e5e5] hover:bg-white text-[#4b5563] flex items-center justify-center shadow-lg transition transform active:scale-95"
                  >
                    {timerStatus === 'running' || timerStatus === 'break' ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>

                  {timerStatus !== 'idle' && (
                    <button
                      type="button"
                      onClick={() => setIsStopConfirmOpen(true)}
                      title="Stop Pomodoro"
                      className="w-8 h-8 rounded-full bg-[#e5e5e5] hover:bg-white text-[#4b5563] flex items-center justify-center shadow-lg transition transform active:scale-95"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.8]" />
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Stop Confirmation Dialog */}
          {isStopConfirmOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl bg-[#202024] border border-white/10 p-6 shadow-2xl">
                <div className="flex items-start gap-4">
                  <FocusLogoSVG size={44} />
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Stop This Pomodoro?
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Are you sure to stop timing?
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2.5 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsStopConfirmOpen(false)}
                    className="px-5 py-1.5 rounded-lg bg-transparent hover:bg-white/5 border border-gray-600 text-xs text-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmStopPomodoro}
                    className="px-6 py-1.5 rounded-lg bg-[#ef5350] hover:bg-[#e53935] text-xs font-medium text-white transition shadow"
                  >
                    Stop
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Timer Mode Selector Dialog */}
          {isTimerModeModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="w-full max-w-xs rounded-2xl bg-[#202024] border border-white/10 p-5 shadow-2xl">
                <h3 className="text-center text-sm font-semibold text-white mb-4">
                  Timer Mode
                </h3>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPendingTimerMode('countdown')}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      pendingTimerMode === 'countdown'
                        ? 'bg-[#2c2c31] border-white/15'
                        : 'bg-transparent border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="pr-3">
                      <div className="text-sm font-semibold text-white">
                        {currentMins}:00 &rarr; 00:00
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        Count down from {currentMins}:00 until the end of the time.
                      </p>
                    </div>
                    {pendingTimerMode === 'countdown' && (
                      <Check className="w-4 h-4 text-[#ef5350] shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPendingTimerMode('stopwatch')}
                    className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between ${
                      pendingTimerMode === 'stopwatch'
                        ? 'bg-[#2c2c31] border-white/15'
                        : 'bg-transparent border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="pr-3">
                      <div className="text-sm font-semibold text-white">
                        00:00 &rarr; &infin;
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        Start counting from 00:00 until stop manually.
                      </p>
                    </div>
                    {pendingTimerMode === 'stopwatch' && (
                      <Check className="w-4 h-4 text-[#ef5350] shrink-0" />
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2.5 mt-5">
                  <button
                    type="button"
                    onClick={() => setIsTimerModeModalOpen(false)}
                    className="px-4 py-1.5 rounded-lg bg-transparent hover:bg-white/5 border border-gray-600 text-xs text-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyTimerMode}
                    className="px-6 py-1.5 rounded-lg bg-[#ef5350] hover:bg-[#e53935] text-xs font-medium text-white transition shadow"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Focus Sidebar Drawer */}
        <div className="w-full lg:w-80 bg-[#141416]/90 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-white/10 p-4 flex flex-col gap-4 max-h-[42vh] lg:max-h-none overflow-y-auto">
          <div className="rounded-xl bg-[#1e1e22]/90 border border-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-300 font-medium mb-2">
              <span className="w-1 h-3.5 rounded-full bg-[#ef5350]" />
              <span>Focus Time of Today</span>
            </div>
            <div className="flex items-baseline gap-1 text-[#ef5350]">
              <span className="text-3xl font-light">{todayFocusFormatted.h}</span>
              <span className="text-xs text-gray-400">h</span>
              <span className="text-3xl font-light ml-1">{todayFocusFormatted.m}</span>
              <span className="text-xs text-gray-400">m</span>
            </div>
          </div>

          <div className="rounded-xl bg-[#1e1e22]/90 border border-white/5 p-4 flex-1 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                <span className="w-1 h-3.5 rounded-full bg-[#ef5350]" />
                <span>Today</span>
              </div>
              <span className="text-[11px] text-gray-500">{focusSidebarTasks.length} tasks</span>
            </div>

            <div className="space-y-2 overflow-y-auto pr-1 flex-1">
              {focusSidebarTasks.map((t) => {
                const isSelected = t.id === selectedTaskId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className={`p-2.5 rounded-lg border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#2a2a30] border-[#ef5350]/50'
                        : 'bg-[#252529]/70 border-white/5 hover:bg-[#2a2a2f]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTaskComplete(t.id);
                        }}
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition ${
                          t.completed
                            ? 'bg-emerald-500 text-black'
                            : 'border border-gray-500 hover:border-[#ef5350]'
                        }`}
                      >
                        {t.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTaskId(t.id);
                          setTimerStatus('running');
                        }}
                        className="w-4 h-4 rounded-full bg-[#ef5350]/20 text-[#ef5350] flex items-center justify-center shrink-0"
                      >
                        <Play className="w-2 h-2 fill-current ml-0.5" />
                      </button>

                      <div className="truncate">
                        <div
                          className={`text-xs truncate ${
                            t.completed ? 'line-through text-gray-500' : 'text-gray-200'
                          }`}
                        >
                          {t.title}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {Array.from({
                            length: Math.max(1, Math.min(5, t.estPomodoros)),
                          }).map((_, idx) => (
                            <TomatoIcon
                              key={idx}
                              filled={idx < t.completedPomodoros}
                              size={9}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-[#1e1e22]/90 border border-white/5 p-4">
            <div className="flex items-center gap-2 text-xs text-gray-300 font-medium mb-3">
              <span className="w-1 h-3.5 rounded-full bg-[#ef5350]" />
              <span>Today&apos;s Focus Time Records</span>
            </div>
            <div className="relative h-2.5 rounded-full bg-[#2c2c30] overflow-hidden">
              {reportStats.todaySessions.map((s) => {
                const leftPct = Math.min(95, Math.max(0, (s.startHour / 24) * 100));
                const widthPct = Math.max(2.5, ((s.durationMins / 60) / 24) * 100);
                const proj = projects.find((p) => p.id === s.projectId);
                return (
                  <div
                    key={s.id}
                    title={`${s.taskTitle} (${s.durationMins}m)`}
                    className="absolute top-0 bottom-0 rounded-xs"
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: proj ? proj.color : '#3b82f6',
                    }}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-gray-500 mt-1.5">
              <span>06:00</span>
              <span>12:00</span>
              <span>16:00</span>
              <span>22:00</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // 10. RENDER: STATISTICS & REPORTS MODAL/PAGE
  // ============================================================================
  const renderReportsView = () => {
    const totalFmt = formatHoursMins(reportStats.totalFocusMins);
    const weekFmt = formatHoursMins(reportStats.weekFocusMins);
    const todayFmt = formatHoursMins(reportStats.todayFocusMins);

    const timelineDays = Array.from({ length: 14 }, (_, i) => {
      const offsetFromToday = -pomodoroRecordsPage * 14 - i;
      const dateStr = getDateStr(offsetFromToday);
      const d = new Date();
      d.setDate(d.getDate() + offsetFromToday);
      const label =
        offsetFromToday === 0
          ? 'Today'
          : offsetFromToday === -1
          ? 'Yesterday'
          : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      return { dateStr, label, isToday: offsetFromToday === 0 };
    });

    const totalDistMins = Math.max(1, reportStats.totalDistMins);
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPercent = 0;

    const buildChartBuckets = (mode, pageOffset, metricType) => {
      const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const fmtLocal = (dt) => {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const buckets = [];

      if (mode === 'Daily') {
        for (let i = 13; i >= 0; i--) {
          const offsetDays = -pageOffset * 14 - i;
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() + offsetDays);
          const dStr = fmtLocal(d);
          const isToday = dStr === todayStr;

          const shortLabel = isToday
            ? 'Today'
            : i === 13 || i === 7 || d.getDate() === 1
            ? `${d.getDate()} ${monthShort[d.getMonth()]}`
            : `${d.getDate()}`;
          const tooltipTitle = isToday
            ? `Today (${d.getDate()} ${monthShort[d.getMonth()]} ${d.getFullYear()})`
            : `${d.getDate()} ${monthShort[d.getMonth()]} ${d.getFullYear()}`;

          buckets.push({
            key: dStr,
            shortLabel,
            tooltipTitle,
            isHighlight: isToday,
            matchDate: (dateStr) => dateStr === dStr,
          });
        }
      } else if (mode === 'Weekly') {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dayOfWeek = (now.getDay() + 6) % 7;
        const currentWeekMon = new Date(now);
        currentWeekMon.setDate(now.getDate() - dayOfWeek + -pageOffset * 14 * 7);

        for (let i = 13; i >= 0; i--) {
          const wkStart = new Date(currentWeekMon);
          wkStart.setDate(currentWeekMon.getDate() - i * 7);
          const wkEnd = new Date(wkStart);
          wkEnd.setDate(wkStart.getDate() + 6);

          const startStr = fmtLocal(wkStart);
          const endStr = fmtLocal(wkEnd);
          const rangeLabel = `${wkStart.getDate()} ${monthShort[wkStart.getMonth()]}-${wkEnd.getDate()} ${monthShort[wkEnd.getMonth()]}`;

          buckets.push({
            key: `${startStr}_${endStr}`,
            shortLabel: i === 13 || i === 0 ? rangeLabel : '',
            tooltipTitle: rangeLabel,
            isHighlight: todayStr >= startStr && todayStr <= endStr,
            matchDate: (dateStr) => Boolean(dateStr && dateStr >= startStr && dateStr <= endStr),
          });
        }
      } else if (mode === 'Monthly') {
        const now = new Date();
        const anchorMonth = new Date(now.getFullYear(), now.getMonth() + -pageOffset * 14, 1);

        for (let i = 13; i >= 0; i--) {
          const mDate = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() - i, 1);
          const y = mDate.getFullYear();
          const m = mDate.getMonth();
          const prefix = `${y}-${String(m + 1).padStart(2, '0')}`;
          const label = `${monthShort[m]} ${y}`;

          buckets.push({
            key: prefix,
            shortLabel: i === 13 || i === 6 || i === 0 ? label : '',
            tooltipTitle: label,
            isHighlight: y === now.getFullYear() && m === now.getMonth(),
            matchDate: (dateStr) => Boolean(dateStr && dateStr.startsWith(prefix)),
          });
        }
      } else {
        const currentYear = new Date().getFullYear();
        const centerYear = currentYear - pageOffset * 5;
        const startYear = centerYear - 5;

        for (let i = 0; i < 11; i++) {
          const y = startYear + i;
          const prefix = `${y}-`;
          buckets.push({
            key: String(y),
            shortLabel: i === 0 || i === 5 || i === 10 ? String(y) : '',
            tooltipTitle: String(y),
            isHighlight: y === currentYear,
            matchDate: (dateStr) => Boolean(dateStr && dateStr.startsWith(prefix)),
          });
        }
      }

      return buckets.map((b) => {
        if (metricType === 'focus') {
          const matchedSessions = validSessions.filter((s) => b.matchDate(s.date));
          const totalMins = matchedSessions.reduce((acc, s) => acc + s.durationMins, 0);
          const byProjMap = {};
          matchedSessions.forEach((s) => {
            byProjMap[s.projectId] = (byProjMap[s.projectId] || 0) + s.durationMins;
          });
          const byProject = Object.entries(byProjMap).map(([projectId, mins]) => {
            const proj =
              projects.find((p) => p.id === projectId) ||
              (deletedHistory.projects || []).find((p) => p.id === projectId);
            return {
              projectId,
              mins,
              color: proj ? proj.color : '#3b82f6',
              name: proj ? proj.name : 'Tasks',
            };
          });
          return { ...b, totalValue: totalMins, byProject };
        } else {
          const allTasksPool = [...tasks, ...(deletedHistory.tasks || [])];
          const matchedTasks = allTasksPool.filter(
            (t) =>
              t.completed &&
              ((t.completedDate && b.matchDate(t.completedDate)) ||
                (!t.completedDate && b.matchDate(todayStr)))
          );
          const totalTasks = matchedTasks.length;
          const byProjMap = {};
          matchedTasks.forEach((t) => {
            byProjMap[t.projectId] = (byProjMap[t.projectId] || 0) + 1;
          });
          const byProject = Object.entries(byProjMap).map(([projectId, count]) => {
            const proj =
              projects.find((p) => p.id === projectId) ||
              (deletedHistory.projects || []).find((p) => p.id === projectId);
            return {
              projectId,
              count,
              color: proj ? proj.color : '#eab308',
              name: proj ? proj.name : 'Tasks',
            };
          });
          return { ...b, totalValue: totalTasks, byProject };
        }
      });
    };

    const focusChartData = buildChartBuckets(focusChartTab, focusChartPage, 'focus');
    const maxFocusBarMins = Math.max(240, ...focusChartData.map((d) => d.totalValue));
    const maxFocusAxisHours = Math.max(4, Math.ceil(maxFocusBarMins / 60 / 2) * 2);
    const focusYAxisTicks = [
      maxFocusAxisHours,
      Math.round(maxFocusAxisHours * 0.75),
      Math.round(maxFocusAxisHours * 0.5),
      Math.round(maxFocusAxisHours * 0.25),
      0,
    ];
    const topFocusBucketMins = Math.max(0, ...focusChartData.map((d) => d.totalValue));
    const avgFocusBucketMins = Math.round(
      focusChartData.reduce((acc, d) => acc + d.totalValue, 0) / Math.max(1, focusChartData.length)
    );

    const taskChartData = buildChartBuckets(taskChartTab, taskChartPage, 'task');
    const maxTaskAxisCount = Math.max(
      4,
      Math.ceil(Math.max(0, ...taskChartData.map((d) => d.totalValue)) / 2) * 2
    );
    const taskYAxisTicks = [
      maxTaskAxisCount,
      Math.round(maxTaskAxisCount * 0.75),
      Math.round(maxTaskAxisCount * 0.5),
      Math.round(maxTaskAxisCount * 0.25),
      0,
    ];
    const topTaskBucketCount = Math.max(0, ...taskChartData.map((d) => d.totalValue));
    const avgTaskBucketCount = (
      taskChartData.reduce((acc, d) => acc + d.totalValue, 0) / Math.max(1, taskChartData.length)
    ).toFixed(1);

    const getFocusCardPeriodInfo = () => {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const fmtLocal = (dt) => {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const day = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      if (reportPeriod === 'Daily') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - focusTimeCardOffset);
        const dStr = fmtLocal(d);
        const label =
          focusTimeCardOffset === 0
            ? 'Today'
            : focusTimeCardOffset === 1
            ? 'Yesterday'
            : `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        return {
          label,
          matchDate: (dateStr) => dateStr === dStr,
        };
      }

      if (reportPeriod === 'Weekly') {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const dayOfWeek = (now.getDay() + 6) % 7;
        const wkStart = new Date(now);
        wkStart.setDate(now.getDate() - dayOfWeek - focusTimeCardOffset * 7);
        const wkEnd = new Date(wkStart);
        wkEnd.setDate(wkStart.getDate() + 6);
        const sStr = fmtLocal(wkStart);
        const eStr = fmtLocal(wkEnd);
        const label =
          focusTimeCardOffset === 0
            ? 'This Week'
            : `${wkStart.getDate()} ${monthNames[wkStart.getMonth()]} - ${wkEnd.getDate()} ${monthNames[wkEnd.getMonth()]}`;
        return {
          label,
          matchDate: (dateStr) => Boolean(dateStr && dateStr >= sStr && dateStr <= eStr),
        };
      }

      if (reportPeriod === 'Monthly') {
        const now = new Date();
        const mDate = new Date(now.getFullYear(), now.getMonth() - focusTimeCardOffset, 1);
        const y = mDate.getFullYear();
        const m = mDate.getMonth();
        const prefix = `${y}-${String(m + 1).padStart(2, '0')}`;
        const label = `${monthNames[m]} ${y}`;
        return {
          label,
          matchDate: (dateStr) => Boolean(dateStr && dateStr.startsWith(prefix)),
        };
      }

      const year = new Date().getFullYear() - focusTimeCardOffset;
      const prefix = `${year}-`;
      return {
        label: String(year),
        matchDate: (dateStr) => Boolean(dateStr && dateStr.startsWith(prefix)),
      };
    };

    const focusCardPeriod = getFocusCardPeriodInfo();
    const focusCardSessions = validSessions.filter((s) => focusCardPeriod.matchDate(s.date));
    const focusCardTotalMins = focusCardSessions.reduce((acc, s) => acc + s.durationMins, 0);

    const focusCardBreakdown = (() => {
      const map = {};
      focusCardSessions.forEach((s) => {
        const key = showFocusCardTasks ? s.taskTitle : s.projectId;
        if (!map[key]) {
          const proj =
            projects.find((p) => p.id === s.projectId) ||
            (deletedHistory.projects || []).find((p) => p.id === s.projectId);
          map[key] = {
            title: showFocusCardTasks ? s.taskTitle : proj?.name || s.projectName || 'Tasks',
            mins: 0,
            color: proj ? proj.color : s.projectColor || '#3b82f6',
          };
        }
        map[key].mins += s.durationMins;
      });
      return Object.values(map).sort((a, b) => b.mins - a.mins);
    })();

    const currentRealYear = new Date().getFullYear();
    const minAllowedYear = currentRealYear - 5;
    const maxAllowedYear = currentRealYear + 5;
    const monthNamesShort = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const firstDayOfMonth = new Date(goalCalendarYear, goalCalendarMonth, 1);
    const startWeekdayMonFirst = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInCurrentMonth = new Date(goalCalendarYear, goalCalendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(goalCalendarYear, goalCalendarMonth, 0).getDate();

    const formatYMD = (y, m, d) =>
      `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const calendarCells = [];
    for (let i = startWeekdayMonFirst - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = goalCalendarMonth === 0 ? 11 : goalCalendarMonth - 1;
      const prevY = goalCalendarMonth === 0 ? goalCalendarYear - 1 : goalCalendarYear;
      calendarCells.push({
        day: dayNum,
        dateStr: formatYMD(prevY, prevM, dayNum),
        inMonth: false,
      });
    }
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      calendarCells.push({
        day: d,
        dateStr: formatYMD(goalCalendarYear, goalCalendarMonth, d),
        inMonth: true,
      });
    }
    const remainingCells = 42 - calendarCells.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextM = goalCalendarMonth === 11 ? 0 : goalCalendarMonth + 1;
      const nextY = goalCalendarMonth === 11 ? goalCalendarYear + 1 : goalCalendarYear;
      calendarCells.push({
        day: d,
        dateStr: formatYMD(nextY, nextM, d),
        inMonth: false,
      });
    }

    const dailyMinutesMap = {};
    validSessions.forEach((s) => {
      dailyMinutesMap[s.date] = (dailyMinutesMap[s.date] || 0) + s.durationMins;
    });

    const goalTargetMins = Math.max(0, settings.dailyGoalHours * 60);
    const currentMonthCells = calendarCells.filter((c) => c.inMonth);

    let monthFocusDaysCount = 0;
    let monthCompletedGoalDaysCount = 0;
    let monthGoalProgressSum = 0;

    currentMonthCells.forEach((cell) => {
      const mins = dailyMinutesMap[cell.dateStr] || 0;
      if (mins > 0) {
        monthFocusDaysCount += 1;
        const cellGoalMins = (dateGoals[cell.dateStr] ?? settings.dailyGoalHours) * 60;
        if (cellGoalMins === 0 || mins >= cellGoalMins) {
          monthCompletedGoalDaysCount += 1;
        }
        monthGoalProgressSum +=
          cellGoalMins > 0 ? Math.min(1, mins / cellGoalMins) : 1;
      }
    });

    const monthGoalCompletionRate =
      monthFocusDaysCount > 0
        ? Math.round((monthGoalProgressSum / monthFocusDaysCount) * 100)
        : 0;

    const handlePrevMonth = () => {
      if (goalCalendarMonth === 0) {
        if (goalCalendarYear > minAllowedYear) {
          setGoalCalendarYear((y) => y - 1);
          setGoalCalendarMonth(11);
        }
      } else {
        setGoalCalendarMonth((m) => m - 1);
      }
    };

    const handleNextMonth = () => {
      if (goalCalendarMonth === 11) {
        if (goalCalendarYear < maxAllowedYear) {
          setGoalCalendarYear((y) => y + 1);
          setGoalCalendarMonth(0);
        }
      } else {
        setGoalCalendarMonth((m) => m + 1);
      }
    };

    return (
      <div className="fixed inset-0 z-50 bg-[#121214] text-gray-100 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="h-14 px-6 border-b border-[#242428] flex items-center justify-between bg-[#18181b] shrink-0">
          <div className="w-8" />
          <h2 className="text-sm sm:text-base font-semibold text-white tracking-wide">
            Report
          </h2>
          <button
            type="button"
            onClick={() => setActiveView('workspace')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            title="Close Report"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Scrollable Analytics Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Row 1: 6 Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              {
                label: 'Total Focus Time',
                color: '#ef5350',
                content: (
                  <div className="flex items-baseline gap-0.5 text-[#ef5350]">
                    <span className="text-2xl sm:text-3xl font-light">{totalFmt.h}</span>
                    <span className="text-xs">h</span>
                    <span className="text-2xl sm:text-3xl font-light ml-1">{totalFmt.m}</span>
                    <span className="text-xs">m</span>
                  </div>
                ),
              },
              {
                label: 'Focus Time of This Week',
                color: '#ef5350',
                content: (
                  <div className="flex items-baseline gap-0.5 text-[#ef5350]">
                    <span className="text-2xl sm:text-3xl font-light">{weekFmt.h}</span>
                    <span className="text-xs">h</span>
                    <span className="text-2xl sm:text-3xl font-light ml-1">{weekFmt.m}</span>
                    <span className="text-xs">m</span>
                  </div>
                ),
              },
              {
                label: 'Focus Time of Today',
                color: '#ef5350',
                content: (
                  <div className="flex items-baseline gap-0.5 text-[#ef5350]">
                    <span className="text-2xl sm:text-3xl font-light">{todayFmt.h}</span>
                    <span className="text-xs">h</span>
                    <span className="text-2xl sm:text-3xl font-light ml-1">{todayFmt.m}</span>
                    <span className="text-xs">m</span>
                  </div>
                ),
              },
              {
                label: 'Total Completed Tasks',
                color: '#3b82f6',
                content: (
                  <div className="text-2xl sm:text-3xl font-light text-[#3b82f6]">
                    {reportStats.totalCompletedTasks}
                  </div>
                ),
              },
              {
                label: 'Tasks Completed This Week',
                color: '#3b82f6',
                content: (
                  <div className="text-2xl sm:text-3xl font-light text-[#3b82f6]">
                    {reportStats.weekCompletedTasks}
                  </div>
                ),
              },
              {
                label: 'Tasks Completed Today',
                color: '#3b82f6',
                content: (
                  <div className="text-2xl sm:text-3xl font-light text-[#3b82f6]">
                    {reportStats.todayCompletedTasks}
                  </div>
                ),
              },
            ].map((card, i) => (
              <div
                key={i}
                className="rounded-xl bg-[#1c1c1f] border border-[#28282c] p-4 flex flex-col justify-between min-h-[104px]"
              >
                <div className="flex items-center gap-2 text-xs text-gray-300">
                  <span
                    className="w-1 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: card.color }}
                  />
                  <span className="line-clamp-2">{card.label}</span>
                </div>
                <div className="mt-3">{card.content}</div>
              </div>
            ))}
          </div>

          {/* Row 2: Pomodoro Records Gantt Timeline & Focus Time Task Bars */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 rounded-xl bg-[#1c1c1f] border border-[#28282c] p-5">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-semibold text-white">Pomodoro Records</h3>

                <div className="flex items-center gap-1.5">
                  {pomodoroRecordsPage !== 0 && (
                    <button
                      type="button"
                      onClick={() => setPomodoroRecordsPage(0)}
                      className="px-2 py-1 rounded-md bg-[#26262b] hover:bg-[#323238] text-[10px] text-gray-300 transition mr-1"
                    >
                      Today
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPomodoroRecordsPage((p) => p + 1)}
                    title="Previous 14 Days"
                    className="w-7 h-7 rounded-lg bg-[#2a2a30] hover:bg-[#35353d] flex items-center justify-center text-gray-300 hover:text-white transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPomodoroRecordsPage((p) => p - 1)}
                    title="Upcoming 14 Days"
                    className="w-7 h-7 rounded-lg bg-[#2a2a30] hover:bg-[#35353d] flex items-center justify-center text-gray-300 hover:text-white transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center text-[11px] text-gray-400 pl-20 pr-2 mb-1.5">
                {['0:00', '2:00', '4:00', '6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map(
                  (hr) => (
                    <div key={hr} className="flex-1 text-left">
                      {hr}
                    </div>
                  )
                )}
              </div>

              <div className="divide-y divide-[#252529] border-t border-b border-[#252529]">
                {timelineDays.map((day) => {
                  const daySessions = validSessions.filter((s) => s.date === day.dateStr);
                  return (
                    <div key={day.dateStr} className="flex items-center h-6">
                      <div
                        className={`w-20 text-[11px] pr-2 shrink-0 truncate ${
                          day.isToday ? 'text-gray-200 font-medium' : 'text-gray-400'
                        }`}
                      >
                        {day.label}
                      </div>
                      <div className="flex-1 h-full relative bg-[#18181b] border-l border-r border-[#252529]">
                        <div className="absolute inset-0 grid grid-cols-12 pointer-events-none">
                          {Array.from({ length: 12 }).map((_, cIdx) => (
                            <div
                              key={cIdx}
                              className="border-r border-[#222226] last:border-r-0 h-full"
                            />
                          ))}
                        </div>
                        {daySessions.map((s) => {
                          const leftPct = Math.min(96, Math.max(0, (s.startHour / 24) * 100));
                          const widthPct = Math.max(1.5, ((s.durationMins / 60) / 24) * 100);
                          const proj =
                            projects.find((p) => p.id === s.projectId) ||
                            (deletedHistory.projects || []).find((p) => p.id === s.projectId);
                          return (
                            <div
                              key={s.id}
                              title={`${s.taskTitle} (${s.durationMins}m)`}
                              className="absolute top-0.5 bottom-0.5 rounded-[1px] hover:brightness-110 transition z-10"
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                backgroundColor: proj ? proj.color : s.projectColor || '#3b82f6',
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 4 Cols: Focus Time Card */}
            <div className="lg:col-span-4 rounded-xl bg-[#1c1c1f] border border-[#28282c] p-5 flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-white">Focus Time</h3>
                <button
                  type="button"
                  onClick={() => setShowFocusCardTasks((prev) => !prev)}
                  className="px-2.5 py-1 rounded-md bg-[#2a2a30] hover:bg-[#34343c] text-[11px] text-gray-200 transition"
                >
                  {showFocusCardTasks ? 'Show Tasks' : 'Show Projects'}
                </button>
              </div>
              <div className="text-xs text-gray-400 mb-3">
                Total focus time: {formatHoursMins(focusCardTotalMins).text}
              </div>

              <div className="grid grid-cols-4 bg-[#141416] p-0.5 rounded-lg border border-[#28282c] mb-3">
                {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setReportPeriod(t);
                      setFocusTimeCardOffset(0);
                    }}
                    className={`py-1 rounded-md text-[11px] font-medium transition ${
                      reportPeriod === t
                        ? 'bg-[#2c2c31] text-white shadow'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mb-5">
                <button
                  type="button"
                  onClick={() => setFocusTimeCardOffset((prev) => prev + 1)}
                  className="w-7 h-7 rounded-lg bg-[#2a2a30] hover:bg-[#35353d] flex items-center justify-center text-gray-300 hover:text-white transition"
                  title="Previous Period"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-gray-200">
                  {focusCardPeriod.label}
                </span>
                <button
                  type="button"
                  onClick={() => setFocusTimeCardOffset((prev) => prev - 1)}
                  className="w-7 h-7 rounded-lg bg-[#2a2a30] hover:bg-[#35353d] flex items-center justify-center text-gray-300 hover:text-white transition"
                  title="Next Period"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {focusCardBreakdown.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-gray-500">
                  <svg
                    className="w-11 h-11 stroke-current mb-2 opacity-60"
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="1.5"
                  >
                    <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
                    <path d="M3.27 6.96L12 12.01l8.73-5.05" />
                    <path d="M12 22.08V12" />
                    <path d="M7.5 4.21l9 5.19" />
                  </svg>
                  <span className="text-xs text-gray-500">No Data</span>
                </div>
              ) : (
                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                  {focusCardBreakdown.map((item, idx) => {
                    const maxMins = Math.max(1, focusCardBreakdown[0]?.mins || 1);
                    const pct = Math.min(100, Math.round((item.mins / maxMins) * 100));
                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="text-xs text-gray-200 font-medium truncate">
                          {item.title}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-[#26262a] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, backgroundColor: item.color }}
                            />
                          </div>
                          <span className="text-[11px] text-gray-400 w-14 text-right shrink-0">
                            {formatHoursMins(item.mins).text}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Project Time Distribution Donut Chart & Focus Time Goal Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-xl bg-[#1c1c1f] border border-[#28282c] p-5 flex flex-col justify-between">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-sm font-semibold text-white">Project Time Distribution</h3>
                <div className="flex items-center gap-1 bg-[#141416] p-1 rounded-lg border border-[#28282c]">
                  {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setReportPeriod(t)}
                      className={`px-2.5 py-1 rounded text-[11px] transition ${
                        reportPeriod === t ? 'bg-[#2c2c31] text-white' : 'text-gray-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto py-4">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-48 h-48 -rotate-90" viewBox="0 0 180 180">
                    {reportStats.projectDistribution.map((proj) => {
                      const pct = proj.mins / totalDistMins;
                      const strokeDasharray = `${pct * circumference} ${circumference}`;
                      const strokeDashoffset = -accumulatedPercent * circumference;
                      accumulatedPercent += pct;
                      return (
                        <circle
                          key={proj.id}
                          cx="90"
                          cy="90"
                          r={radius}
                          fill="transparent"
                          stroke={proj.color}
                          strokeWidth="22"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex items-baseline gap-0.5 text-[#ef5350]">
                      <span className="text-2xl font-light">
                        {formatHoursMins(reportStats.totalDistMins).h}
                      </span>
                      <span className="text-xs">h</span>
                      <span className="text-2xl font-light ml-1">
                        {formatHoursMins(reportStats.totalDistMins).m}
                      </span>
                      <span className="text-xs">m</span>
                    </div>
                  </div>
                </div>

                <div className="w-full sm:w-64 space-y-2.5">
                  {reportStats.projectDistribution.map((proj) => {
                    const pct = Math.round((proj.mins / totalDistMins) * 100);
                    return (
                      <div
                        key={proj.id}
                        className="p-3 rounded-xl bg-[#242428] border border-white/5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-1.5 h-4 rounded-full"
                            style={{ backgroundColor: proj.color }}
                          />
                          <div>
                            <div className="text-xs font-medium text-gray-200">{proj.name}</div>
                            <div className="text-[11px] text-gray-400">
                              {formatHoursMins(proj.mins).text} &bull; {pct}%
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl bg-[#1c1c1f] border border-[#28282c] p-5 relative">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-sm font-semibold text-white">Focus Time Goal</h3>
                <button
                  type="button"
                  onClick={() => {
                    setTempGoalHours(settings.dailyGoalHours);
                    setIsGoalModalOpen(true);
                  }}
                  className="px-3 py-1 rounded-md bg-[#2a2a30] hover:bg-[#35353d] text-xs text-gray-200 font-medium transition"
                >
                  Goal: {settings.dailyGoalHours}H
                </button>
              </div>

              <div className="text-[11px] text-gray-400 mb-4 leading-relaxed">
                Focus Days: {monthFocusDaysCount} days, &nbsp;Completed Goal Days:{' '}
                {monthCompletedGoalDaysCount} days, &nbsp;Goal Completion Rate:{' '}
                {monthGoalCompletionRate}%
              </div>

              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={goalCalendarYear === minAllowedYear && goalCalendarMonth === 0}
                  className="w-7 h-7 rounded-lg bg-[#2a2a30] hover:bg-[#35353d] disabled:opacity-30 flex items-center justify-center text-gray-300 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1.5">
                  <select
                    value={goalCalendarMonth}
                    onChange={(e) => setGoalCalendarMonth(Number(e.target.value))}
                    className="bg-transparent text-xs font-medium text-gray-200 focus:outline-none cursor-pointer hover:text-white"
                  >
                    {monthNamesShort.map((mName, idx) => (
                      <option key={mName} value={idx} className="bg-[#202024] text-gray-200">
                        {mName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={goalCalendarYear}
                    onChange={(e) => setGoalCalendarYear(Number(e.target.value))}
                    className="bg-transparent text-xs font-medium text-gray-200 focus:outline-none cursor-pointer hover:text-white"
                  >
                    {Array.from({ length: 11 }, (_, i) => minAllowedYear + i).map((yr) => (
                      <option key={yr} value={yr} className="bg-[#202024] text-gray-200">
                        {yr}
                      </option>
                    ))}
                  </select>
                  {(goalCalendarYear !== new Date().getFullYear() ||
                    goalCalendarMonth !== new Date().getMonth()) && (
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setGoalCalendarYear(now.getFullYear());
                        setGoalCalendarMonth(now.getMonth());
                      }}
                      className="ml-1 px-1.5 py-0.5 rounded bg-[#ef5350]/20 text-[#ef5350] text-[10px] hover:bg-[#ef5350]/30 transition"
                    >
                      Today
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={goalCalendarYear === maxAllowedYear && goalCalendarMonth === 11}
                  className="w-7 h-7 rounded-lg bg-[#2a2a30] hover:bg-[#35353d] disabled:opacity-30 flex items-center justify-center text-gray-300 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-y-2 text-center text-xs mb-2">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
                  <div key={d} className="text-gray-500 text-[11px] font-medium">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
                {calendarCells.map((cell, idx) => {
                  const dayMins = dailyMinutesMap[cell.dateStr] || 0;
                  const isTodayCell = cell.dateStr === todayStr;
                  const hasFocus = dayMins > 0;
                  const cellGoal = dateGoals[cell.dateStr] ?? settings.dailyGoalHours;
                  const cellGoalMins = Math.max(0, cellGoal * 60);
                  const progressRatio =
                    cellGoalMins > 0
                      ? Math.min(1, dayMins / cellGoalMins)
                      : hasFocus
                      ? 1
                      : 0;
                  const ringRadius = 15;
                  const ringCircumference = 2 * Math.PI * ringRadius;
                  const dashArray = `${progressRatio * ringCircumference} ${ringCircumference}`;

                  return (
                    <div
                      key={`${cell.dateStr}-${idx}`}
                      title={
                        hasFocus
                          ? `${cell.dateStr}: ${formatHoursMins(dayMins).text} / Goal ${cellGoal}h (${Math.round(progressRatio * 100)}%)`
                          : `${cell.dateStr}: 0m`
                      }
                      className="flex items-center justify-center py-0.5"
                    >
                      <div className="relative w-9 h-9 flex items-center justify-center">
                        {hasFocus && cell.inMonth && (
                          <svg
                            className="absolute inset-0 w-9 h-9 -rotate-90 pointer-events-none"
                            viewBox="0 0 36 36"
                          >
                            <circle
                              cx="18"
                              cy="18"
                              r={ringRadius}
                              fill="transparent"
                              stroke="#111113"
                              strokeWidth="2.6"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r={ringRadius}
                              fill="transparent"
                              stroke={progressRatio >= 1 ? '#22c55e' : '#ef5350'}
                              strokeWidth="2.6"
                              strokeLinecap="round"
                              strokeDasharray={dashArray}
                            />
                          </svg>
                        )}
                        <span
                          className={`text-xs font-semibold select-none ${
                            !cell.inMonth
                              ? 'text-gray-500/60 font-normal'
                              : isTodayCell
                              ? 'text-[#ef5350]'
                              : 'text-gray-100'
                          }`}
                        >
                          {cell.day}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 4: Focus Time Bar Chart & Task Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-xl bg-[#1c1c1f] border border-[#28282c] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h3 className="text-sm font-semibold text-white">Focus Time Chart</h3>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#141416] p-0.5 rounded-lg border border-[#28282c]">
                    {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          setFocusChartTab(tab);
                          setFocusChartPage(0);
                          setHoveredFocusIdx(null);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                          focusChartTab === tab
                            ? 'bg-[#2c2c31] text-white font-medium'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setFocusChartPage((p) => p + 1)}
                      className="w-6 h-6 rounded-md bg-[#2a2a30] hover:bg-[#35353d] flex items-center justify-center text-gray-300"
                      title="Previous Period"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setFocusChartPage((p) => p - 1)}
                      className="w-6 h-6 rounded-md bg-[#2a2a30] hover:bg-[#35353d] flex items-center justify-center text-gray-300"
                      title="Next Period"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-gray-400 mb-6">
                Top: {formatHoursMins(topFocusBucketMins).text} &nbsp;&nbsp; Average:{' '}
                {formatHoursMins(avgFocusBucketMins).text}
              </div>

              <div className="relative h-48 pl-7 flex flex-col justify-between">
                {focusYAxisTicks.map((val, idx) => (
                  <div
                    key={idx}
                    className="relative flex items-center border-b border-[#252529] w-full h-0"
                  >
                    <span className="absolute -left-7 text-[10px] text-gray-500">{val}</span>
                  </div>
                ))}

                <div className="absolute inset-0 left-7 flex items-end justify-between px-2 pt-2">
                  {focusChartData.map((col, idx) => {
                    const isHovered = hoveredFocusIdx === idx;
                    const maxAxisMins = maxFocusAxisHours * 60;
                    return (
                      <div
                        key={col.key}
                        onMouseEnter={() => setHoveredFocusIdx(idx)}
                        onMouseLeave={() => setHoveredFocusIdx(null)}
                        className="relative flex-1 h-full flex flex-col items-center justify-end group cursor-pointer"
                      >
                        {isHovered && (
                          <>
                            <div className="absolute -top-11 z-20 px-2.5 py-1 rounded-lg bg-[#f25551] text-white shadow-xl text-center whitespace-nowrap pointer-events-none">
                              <div className="text-xs font-semibold leading-tight">
                                {formatHoursMins(col.totalValue).text}
                              </div>
                              <div className="text-[10px] opacity-95 leading-tight">
                                {col.tooltipTitle}
                              </div>
                            </div>
                            <div className="absolute top-0 bottom-0 w-[1.5px] bg-[#f25551] pointer-events-none z-10" />
                          </>
                        )}

                        <div className="w-3 sm:w-4 flex flex-col-reverse rounded-t-xs overflow-hidden z-10">
                          {col.byProject.map((seg) => {
                            const hPct = Math.min(100, (seg.mins / maxAxisMins) * 100);
                            return (
                              <div
                                key={seg.projectId}
                                style={{
                                  height: `${Math.max(3, (hPct / 100) * 184)}px`,
                                  backgroundColor: seg.color,
                                }}
                                className="w-full border-t border-[#1c1c1f]/40"
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pl-7 mt-2 flex items-center justify-between text-[10px] text-gray-400">
                {focusChartData.map((col) => (
                  <div
                    key={col.key}
                    className={`flex-1 text-center truncate ${
                      col.isHighlight ? 'text-white font-semibold' : ''
                    }`}
                  >
                    {col.shortLabel}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-[#1c1c1f] border border-[#28282c] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <h3 className="text-sm font-semibold text-white">Task Chart</h3>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#141416] p-0.5 rounded-lg border border-[#28282c]">
                    {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => {
                          setTaskChartTab(tab);
                          setTaskChartPage(0);
                          setHoveredTaskIdx(null);
                        }}
                        className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                          taskChartTab === tab
                            ? 'bg-[#2c2c31] text-white font-medium'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTaskChartPage((p) => p + 1)}
                      className="w-6 h-6 rounded-md bg-[#2a2a30] hover:bg-[#35353d] flex items-center justify-center text-gray-300"
                      title="Previous Period"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskChartPage((p) => p - 1)}
                      className="w-6 h-6 rounded-md bg-[#2a2a30] hover:bg-[#35353d] flex items-center justify-center text-gray-300"
                      title="Next Period"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-gray-400 mb-6">
                Top : {topTaskBucketCount} Tasks &nbsp;&nbsp; Average : {avgTaskBucketCount} Tasks
              </div>

              <div className="relative h-48 pl-7 flex flex-col justify-between">
                {taskYAxisTicks.map((val, idx) => (
                  <div
                    key={idx}
                    className="relative flex items-center border-b border-[#252529] w-full h-0"
                  >
                    <span className="absolute -left-7 text-[10px] text-gray-500">{val}</span>
                  </div>
                ))}

                <div className="absolute inset-0 left-7 flex items-end justify-between px-2 pt-2">
                  {taskChartData.map((col, idx) => {
                    const isHovered = hoveredTaskIdx === idx;
                    return (
                      <div
                        key={col.key}
                        onMouseEnter={() => setHoveredTaskIdx(idx)}
                        onMouseLeave={() => setHoveredTaskIdx(null)}
                        className="relative flex-1 h-full flex flex-col items-center justify-end group cursor-pointer"
                      >
                        {isHovered && (
                          <>
                            <div className="absolute -top-11 z-20 px-2.5 py-1 rounded-lg bg-[#f25551] text-white shadow-xl text-center whitespace-nowrap pointer-events-none">
                              <div className="text-xs font-semibold leading-tight">
                                {col.totalValue} Tasks
                              </div>
                              <div className="text-[10px] opacity-95 leading-tight">
                                {col.tooltipTitle}
                              </div>
                            </div>
                            <div className="absolute top-0 bottom-0 w-[1.5px] bg-[#f25551] pointer-events-none z-10" />
                          </>
                        )}

                        <div className="w-3 sm:w-4 flex flex-col-reverse rounded-t-xs overflow-hidden z-10">
                          {col.byProject.map((seg) => {
                            const hPct = Math.min(100, (seg.count / maxTaskAxisCount) * 100);
                            return (
                              <div
                                key={seg.projectId}
                                style={{
                                  height: `${Math.max(4, (hPct / 100) * 184)}px`,
                                  backgroundColor: seg.color,
                                }}
                                className="w-full border-t border-[#1c1c1f]/40"
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pl-7 mt-2 flex items-center justify-between text-[10px] text-gray-400">
                {taskChartData.map((col) => (
                  <div
                    key={col.key}
                    className={`flex-1 text-center truncate ${
                      col.isHighlight ? 'text-white font-semibold' : ''
                    }`}
                  >
                    {col.shortLabel}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 5: Real-Time Study Trend Graph (Edge-Aligned Blue Baseline + Dynamic Average) */}
          <div className="rounded-xl bg-[#1c1c1f] border border-[#28282c] p-5">
            {(() => {
              const monthNamesShort = [
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
              ];
              const weekdayNamesShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
              const fmtLocal = (dt) => {
                const y = dt.getFullYear();
                const m = String(dt.getMonth() + 1).padStart(2, '0');
                const day = String(dt.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
              };

              let trendPoints = [];
              let periodRangeBadge = '';
              let fixedMaxAxisHours = 16;

              if (studyTrendTab === 'Daily') {
                fixedMaxAxisHours = 16;
                for (let i = 13; i >= 0; i--) {
                  const offsetDays = -studyTrendPage * 14 - i;
                  const d = new Date();
                  d.setHours(0, 0, 0, 0);
                  d.setDate(d.getDate() + offsetDays);
                  const dStr = fmtLocal(d);
                  const mins = validSessions
                    .filter((s) => s.date === dStr)
                    .reduce((acc, s) => acc + s.durationMins, 0);
                  const label =
                    offsetDays === 0
                      ? 'Today'
                      : offsetDays === -1
                      ? 'Yesterday'
                      : `${monthNamesShort[d.getMonth()]} ${d.getDate()}`;
                  trendPoints.push({
                    key: dStr,
                    label,
                    fullTitle: `${d.getDate()} ${monthNamesShort[d.getMonth()]} ${d.getFullYear()}`,
                    mins,
                    isHighlight: offsetDays === 0,
                  });
                }
                periodRangeBadge = `${trendPoints[0]?.fullTitle} – ${trendPoints[trendPoints.length - 1]?.fullTitle}`;
              } else if (studyTrendTab === 'Weekly') {
                fixedMaxAxisHours = 16;
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const dayOfWeek = (now.getDay() + 6) % 7;
                const weekMonday = new Date(now);
                weekMonday.setDate(now.getDate() - dayOfWeek - studyTrendPage * 7);

                for (let i = 0; i < 7; i++) {
                  const d = new Date(weekMonday);
                  d.setDate(weekMonday.getDate() + i);
                  const dStr = fmtLocal(d);
                  const mins = validSessions
                    .filter((s) => s.date === dStr)
                    .reduce((acc, s) => acc + s.durationMins, 0);
                  const isToday = dStr === todayStr;
                  trendPoints.push({
                    key: dStr,
                    label: isToday
                      ? `Today (${weekdayNamesShort[i]})`
                      : `${weekdayNamesShort[i]} ${d.getDate()}`,
                    fullTitle: `${weekdayNamesShort[i]}, ${d.getDate()} ${monthNamesShort[d.getMonth()]} ${d.getFullYear()}`,
                    mins,
                    isHighlight: isToday,
                  });
                }
                const wkEnd = new Date(weekMonday);
                wkEnd.setDate(weekMonday.getDate() + 6);
                periodRangeBadge = `${weekMonday.getDate()} ${monthNamesShort[weekMonday.getMonth()]} – ${wkEnd.getDate()} ${monthNamesShort[wkEnd.getMonth()]} ${wkEnd.getFullYear()}`;
              } else if (studyTrendTab === 'Monthly') {
                fixedMaxAxisHours = 16;
                const now = new Date();
                const targetMonthDate = new Date(
                  now.getFullYear(),
                  now.getMonth() - studyTrendPage,
                  1
                );
                const y = targetMonthDate.getFullYear();
                const m = targetMonthDate.getMonth();
                const daysInMonth = new Date(y, m + 1, 0).getDate();

                for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
                  const dStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const mins = validSessions
                    .filter((s) => s.date === dStr)
                    .reduce((acc, s) => acc + s.durationMins, 0);
                  const isToday = dStr === todayStr;
                  trendPoints.push({
                    key: dStr,
                    label: isToday ? 'Today' : `${dayNum}`,
                    fullTitle: `${dayNum} ${monthNamesShort[m]} ${y}`,
                    mins,
                    isHighlight: isToday,
                  });
                }
                periodRangeBadge = `${monthNamesShort[m]} ${y} (${daysInMonth} Days)`;
              } else {
                const now = new Date();
                const targetYear = now.getFullYear() - studyTrendPage;
                for (let m = 0; m < 12; m++) {
                  const prefix = `${targetYear}-${String(m + 1).padStart(2, '0')}`;
                  const mins = validSessions
                    .filter((s) => s.date && s.date.startsWith(prefix))
                    .reduce((acc, s) => acc + s.durationMins, 0);
                  const isCurrentMonth =
                    targetYear === now.getFullYear() && m === now.getMonth();
                  trendPoints.push({
                    key: prefix,
                    label: monthNamesShort[m],
                    fullTitle: `${monthNamesShort[m]} ${targetYear}`,
                    mins,
                    isHighlight: isCurrentMonth,
                  });
                }
                const maxMonthHours = Math.max(
                  16,
                  ...trendPoints.map((p) => Math.ceil(p.mins / 60))
                );
                fixedMaxAxisHours = Math.max(16, Math.ceil(maxMonthHours / 8) * 8);
                periodRangeBadge = `Year ${targetYear} (Jan – Dec)`;
              }

              const yTicks = Array.from({ length: 9 }, (_, idx) =>
                Math.round(fixedMaxAxisHours - idx * (fixedMaxAxisHours / 8))
              );

              const svgW = 860;
              const svgH = 220;
              const padL = 0;
              const padR = 0;
              const padT = 26;
              const padB = 18;
              const plotW = svgW - padL - padR;
              const plotH = svgH - padT - padB;
              const nCols = Math.max(1, trendPoints.length);

              const coords = trendPoints.map((d, idx) => {
                const prevMins = idx > 0 ? trendPoints[idx - 1].mins : d.mins;
                const trendDir =
                  idx === 0
                    ? 'neutral'
                    : d.mins > prevMins
                    ? 'up'
                    : d.mins < prevMins
                    ? 'down'
                    : 'neutral';
                const pointColor =
                  trendDir === 'up'
                    ? '#22c55e'
                    : trendDir === 'down'
                    ? '#ef5350'
                    : '#3b82f6';

                const x = padL + ((idx + 0.5) / nCols) * plotW;
                const clampedHours = Math.min(fixedMaxAxisHours, d.mins / 60);
                const y =
                  padT +
                  plotH -
                  (clampedHours / Math.max(1, fixedMaxAxisHours)) * plotH;
                return { ...d, x, y, trendDir, pointColor };
              });

              const areaPoints =
                coords.length > 0
                  ? `0,${padT + plotH} ` +
                    coords.map((c) => `${c.x},${c.y}`).join(' ') +
                    ` ${svgW},${padT + plotH}`
                  : '';

              const totalWindowMins = trendPoints.reduce((acc, p) => acc + p.mins, 0);
              const avgWindowMins = Math.round(
                totalWindowMins / Math.max(1, trendPoints.length)
              );

              return (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                        <h3 className="text-sm font-semibold text-white">
                          {studyTrendTab} Study Trend
                        </h3>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {periodRangeBadge} &bull; Average:{' '}
                        <span className="text-gray-200 font-medium">
                          {formatHoursMins(avgWindowMins).text}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center bg-[#141416] p-0.5 rounded-lg border border-[#28282c]">
                        {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => {
                              setStudyTrendTab(tab);
                              setStudyTrendPage(0);
                            }}
                            className={`px-3 py-1 rounded-md text-xs transition ${
                              studyTrendTab === tab
                                ? 'bg-[#2c2c31] text-white font-medium shadow'
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        {studyTrendPage !== 0 && (
                          <button
                            type="button"
                            onClick={() => setStudyTrendPage(0)}
                            className="px-2 py-1 rounded-md bg-[#26262b] hover:bg-[#323238] text-[10px] text-gray-300 transition mr-0.5"
                          >
                            Current
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setStudyTrendPage((p) => p + 1)}
                          title="Previous Period"
                          className="w-7 h-7 rounded-lg bg-[#2a2a30] hover:bg-[#35353d] flex items-center justify-center text-gray-300 hover:text-white transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudyTrendPage((p) => p - 1)}
                          title="Next Period"
                          className="w-7 h-7 rounded-lg bg-[#2a2a30] hover:bg-[#35353d] flex items-center justify-center text-gray-300 hover:text-white transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-stretch gap-3">
                    <div
                      className="flex flex-col justify-between text-[11px] text-gray-500 w-10 text-right shrink-0"
                      style={{ paddingTop: '20px', paddingBottom: '28px' }}
                    >
                      {yTicks.map((hr, idx) => (
                        <span key={idx}>{hr === 0 ? '0' : `${hr}h`}</span>
                      ))}
                    </div>

                    <div className="flex-1 overflow-x-auto">
                      <div className="min-w-[660px]">
                        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-56 overflow-visible">
                          <defs>
                            <linearGradient id="studyTrendGradBlue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.26" />
                              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {yTicks.map((hr, idx) => {
                            const y = padT + (idx / 8) * plotH;
                            return (
                              <line
                                key={idx}
                                x1={0}
                                y1={y}
                                x2={svgW}
                                y2={y}
                                stroke={idx === 8 ? '#333338' : '#26262b'}
                                strokeWidth={idx === 8 ? '1.5' : '1'}
                                strokeDasharray={idx === 8 ? '' : '4 5'}
                              />
                            );
                          })}

                          {areaPoints && (
                            <polygon points={areaPoints} fill="url(#studyTrendGradBlue)" />
                          )}

                          {coords.length > 0 && (
                            <line
                              x1={0}
                              y1={padT + plotH}
                              x2={coords[0].x}
                              y2={coords[0].y}
                              stroke={coords[0].pointColor}
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          )}

                          {coords.map((pt, idx) => {
                            if (idx === 0) return null;
                            const prev = coords[idx - 1];
                            return (
                              <line
                                key={`seg-${pt.key}`}
                                x1={prev.x}
                                y1={prev.y}
                                x2={pt.x}
                                y2={pt.y}
                                stroke={pt.pointColor}
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            );
                          })}

                          {coords.length > 0 && (
                            <line
                              x1={coords[coords.length - 1].x}
                              y1={coords[coords.length - 1].y}
                              x2={svgW}
                              y2={coords[coords.length - 1].y}
                              stroke="#3b82f6"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />
                          )}

                          {coords.map((pt) => {
                            const showLabel =
                              studyTrendTab !== 'Monthly' ||
                              pt.mins > 0 ||
                              pt.isHighlight;
                            return (
                              <g key={pt.key} className="group cursor-pointer">
                                <title>{`${pt.fullTitle}: ${formatHoursMins(pt.mins).text}`}</title>
                                {showLabel && (
                                  <text
                                    x={pt.x}
                                    y={pt.y - 11}
                                    textAnchor="middle"
                                    fill={
                                      pt.isHighlight
                                        ? '#60a5fa'
                                        : pt.mins > 0
                                        ? pt.pointColor
                                        : '#6b7280'
                                    }
                                    fontSize={studyTrendTab === 'Monthly' ? '9' : '10'}
                                    fontWeight={pt.isHighlight || pt.mins > 0 ? '600' : '400'}
                                  >
                                    {pt.mins > 0 ? formatHoursMins(pt.mins).text : '0m'}
                                  </text>
                                )}

                                {pt.isHighlight && (
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="9"
                                    fill={pt.pointColor}
                                    fillOpacity="0.22"
                                  />
                                )}

                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={studyTrendTab === 'Monthly' ? '3.5' : '4.5'}
                                  fill="#1c1c1f"
                                  stroke={pt.pointColor}
                                  strokeWidth="2.8"
                                />
                              </g>
                            );
                          })}
                        </svg>

                        <div className="flex items-center justify-between mt-1">
                          {coords.map((pt) => (
                            <div
                              key={pt.key}
                              className={`text-center truncate ${
                                studyTrendTab === 'Monthly' ? 'text-[9px]' : 'text-[10px]'
                              } ${
                                pt.isHighlight ? 'text-[#60a5fa] font-semibold' : 'text-gray-400'
                              }`}
                              style={{ width: `${100 / coords.length}%` }}
                            >
                              {pt.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // 11. RENDER: SETTINGS MODAL
  // ============================================================================
  const renderSettingsModal = () => {
    const alarmOptions = [
      'None',
      'Alien Fanfare',
      'Marimba Chime',
      'Telemetry Alert',
      'Quantum Sonar',
      'Cyber Blip',
      'Timer',
      'Bell1',
      'Bell2',
      'Beeps',
      'Bicycle Bell',
      'Toy Noisemaker Honk',
      'Clown Horn',
    ];

    const whiteNoiseOptions = [
      { id: 'None', label: 'None', accent: '#3f3f46', isNone: true },
      { id: 'Tic-tac', label: 'Tic-tac', accent: '#d6b49c' },
      { id: 'Countdown', label: 'Countdown', accent: '#f59e0b' },
      { id: 'Wind With Crickets', label: 'Wind With Crickets', accent: '#3b82f6' },
      { id: 'Class Room', label: 'Class Room', accent: '#eab308' },
      { id: 'Wilderness', label: 'Wilderness', accent: '#10b981' },
      { id: 'Stream', label: 'Stream', accent: '#06b6d4' },
      { id: 'Ocean Shore', label: 'Ocean Shore', accent: '#0284c7' },
      { id: 'Rain', label: 'Rain', accent: '#60a5fa' },
      { id: 'Cafe', label: 'Cafe', accent: '#b45309' },
      { id: 'Bonfire', label: 'Bonfire', accent: '#f97316' },
      { id: 'Library', label: 'Library', accent: '#92400e' },
      { id: 'Wind', label: 'Wind', accent: '#a3e635' },
      { id: 'Frogs At Night', label: 'Frogs At Night', accent: '#2563eb' },
    ];

    const smartListItems = [
      { key: 'today', label: 'Today', icon: Sun, color: '#22c55e' },
      { key: 'overdue', label: 'Overdue', icon: AlertCircle, color: '#ef5350' },
      { key: 'tomorrow', label: 'Tomorrow', icon: Sunrise, color: '#f97316' },
      { key: 'week', label: 'This Week', icon: Calendar, color: '#a855f7' },
      { key: 'next7', label: 'Next 7 Days', icon: CalendarDays, color: '#14b8a6' },
      { key: 'highPriority', label: 'High Priority', icon: Flag, color: '#ef5350' },
      { key: 'mediumPriority', label: 'Medium Priority', icon: Flag, color: '#eab308' },
      { key: 'lowPriority', label: 'Low Priority', icon: Flag, color: '#22c55e' },
      { key: 'planned', label: 'Planned', icon: CalendarCheck, color: '#3b82f6' },
      { key: 'all', label: 'All', icon: LayoutGrid, color: '#f97316' },
      { key: 'someday', label: 'Someday', icon: CalendarClock, color: '#8b5cf6' },
      { key: 'completed', label: 'Completed', icon: CheckCircle2, color: '#6b7280' },
      { key: 'tasks', label: 'Tasks', icon: Inbox, color: '#3b82f6' },
    ];

    const smartVisibility = settings.smartListVisibility || DEFAULT_SETTINGS.smartListVisibility;

    return (
      <div
        onClick={() => setOpenAlarmDropdown(null)}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl rounded-2xl bg-[#18181b] border border-[#2a2a2f] shadow-2xl overflow-hidden flex flex-col h-[88vh]"
        >
          <div className="px-6 py-4 border-b border-[#26262a] flex items-center justify-between shrink-0">
            <div className="w-6" />
            <h2 className="text-base font-semibold text-white tracking-wide">Settings</h2>
            <button
              type="button"
              onClick={() => setActiveView('workspace')}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-44 sm:w-56 bg-[#161619] border-r border-[#242429] p-3 space-y-1 shrink-0 overflow-y-auto">
              {[
                { id: 'account', label: 'Account', icon: User, iconColor: 'text-gray-300' },
                { id: 'premium', label: 'Premium', icon: Crown, iconColor: 'text-amber-400' },
                { id: 'general', label: 'General', icon: Sliders, iconColor: 'text-gray-300' },
                { id: 'pomodoro', label: 'Pomodoro Timer', icon: Timer, iconColor: 'text-gray-300' },
                { id: 'projects', label: 'Projects', icon: FolderKanban, iconColor: 'text-gray-300' },
                { id: 'appearance', label: 'Appearance', icon: Palette, iconColor: 'text-gray-300' },
                { id: 'about', label: 'About', icon: Info, iconColor: 'text-gray-300' },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = settingsTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSettingsTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition ${
                      active
                        ? 'bg-[#2a2a2f] text-white'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${tab.iconColor}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 p-6 sm:p-8 overflow-y-auto text-sm">
              {settingsTab === 'account' && (
                <div className="max-w-lg space-y-6">
                  <div className="flex items-center">
                    <span className="w-40 text-gray-200 text-xs sm:text-sm">Avatar</span>
                    <div className="flex items-center gap-3">
                      {settings.avatarUrl ? (
                        <img
                          src={settings.avatarUrl}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover border border-white/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#e4e4e7] flex items-center justify-center text-gray-500">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setSettings((prev) => ({
                              ...prev,
                              avatarUrl: String(reader.result || ''),
                            }));
                            showToast('Avatar updated!');
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="px-4 py-1.5 rounded-lg bg-[#222226] hover:bg-[#2c2c32] border border-[#34343b] text-xs text-gray-200 transition"
                      >
                        Upload
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="w-40 text-gray-200 text-xs sm:text-sm">Username</span>
                    <input
                      type="text"
                      value={settings.username}
                      onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                      className="px-3.5 py-2 rounded-lg bg-[#222226] border border-[#34343b] text-white text-xs sm:text-sm w-56 focus:outline-none focus:border-[#ef5350]"
                    />
                  </div>

                  <div className="flex items-center">
                    <span className="w-40 text-gray-200 text-xs sm:text-sm">Account</span>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-gray-200 text-xs sm:text-sm">{settings.email}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTempEmail(settings.email);
                          setAccountModal('email');
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#222226] hover:bg-[#2c2c32] border border-[#34343b] text-xs text-gray-200 transition"
                      >
                        Change Account
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="w-40 text-gray-200 text-xs sm:text-sm">Password</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTempPassword('');
                        setAccountModal('password');
                      }}
                      className="px-4 py-1.5 rounded-lg bg-[#222226] hover:bg-[#2c2c32] border border-[#34343b] text-xs text-gray-200 transition"
                    >
                      Change Password
                    </button>
                  </div>

                  <div className="flex items-center pt-1">
                    <span className="w-40 text-gray-200 text-xs sm:text-sm">Account Management</span>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setAccountModal('deleteData')}
                        className="px-4 py-1.5 rounded-lg bg-[#222226] hover:bg-[#ef5350]/15 border border-[#ef5350]/70 text-xs text-[#ef5350] transition"
                      >
                        Delete Data
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountModal('deleteData')}
                        className="px-4 py-1.5 rounded-lg bg-[#222226] hover:bg-[#ef5350]/15 border border-[#ef5350]/70 text-xs text-[#ef5350] transition"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#26262a] flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#222226] hover:bg-[#2c2c32] border border-[#34343b] text-xs text-gray-200 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export JSON Backup
                    </button>
                    <input
                      ref={backupInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={handleImportBackup}
                    />
                    <button
                      type="button"
                      onClick={() => backupInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-lg bg-[#222226] hover:bg-[#2c2c32] border border-[#34343b] text-xs text-gray-200 transition"
                    >
                      Import / Restore Backup
                    </button>
                  </div>
                  <p className="pt-2 text-[11px] text-gray-500">
                    Restore replaces this browser&apos;s data. A safety backup downloads before restoring.
                  </p>
                </div>
              )}

              {settingsTab === 'premium' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-[#2c2c32] bg-[#1b1b1f] p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { title: 'Synchronize data within all devices.', color: '#ef5350', icon: RefreshCw },
                      { title: 'Check more historical pomodoro records and completed tasks.', color: '#f59e0b', icon: Clock },
                      { title: 'Cloud backup.', color: '#3b82f6', icon: Download },
                      { title: 'Add and edit pomodoro records manually.', color: '#22c55e', icon: Timer },
                      { title: 'Detailed statistics report.', color: '#ef5350', icon: BarChart3 },
                      { title: 'Feature of repeating tasks.', color: '#3b82f6', icon: Check },
                      { title: 'Unlimited quantity of projects.', color: '#2dd4bf', icon: FolderKanban },
                      { title: 'Feature of reminding tasks.', color: '#ef5350', icon: Bell },
                      { title: 'Tags for tasks.', color: '#fb923c', icon: Tag },
                      { title: 'More white noise and alarm sounds.', color: '#3b82f6', icon: Music },
                      { title: 'Folders for projects.', color: '#ef5350', icon: Folder },
                      { title: 'More Themes.', color: '#f97316', icon: Palette },
                    ].map((feat, idx) => {
                      const FeatIcon = feat.icon;
                      return (
                        <div key={idx} className="flex items-start gap-3.5">
                          <div
                            className="p-2 rounded-xl shrink-0"
                            style={{ backgroundColor: `${feat.color}20`, color: feat.color }}
                          >
                            <FeatIcon className="w-5 h-5" />
                          </div>
                          <span className="text-xs sm:text-sm text-gray-200 leading-snug">
                            {feat.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center text-xs text-emerald-400 font-medium">
                    Personal Edition: All Pro Features Active
                  </div>
                </div>
              )}

              {settingsTab === 'general' && (
                <div className="max-w-lg space-y-6">
                  <div className="space-y-4">
                    <ToggleRow
                      label="Play task completion sound"
                      checked={settings.playCompletionSound}
                      onChange={(val) => setSettings({ ...settings, playCompletionSound: val })}
                    />
                    <ToggleRow
                      label="Futuristic UI click sound"
                      checked={settings.clickSoundEnabled ?? true}
                      onChange={(val) => {
                        setSettings({ ...settings, clickSoundEnabled: val });
                        soundEngine.setClickSettings(
                          val,
                          (settings.clickSoundVolume ?? 75) / 100,
                          settings.clickSoundStyle || 'Alien Tech Click'
                        );
                        if (val) soundEngine.playTechClick();
                      }}
                    />
                    {(settings.clickSoundEnabled ?? true) && (
                      <div className="space-y-3 pl-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-gray-300 text-xs sm:text-sm">Click Sound Effect</span>
                          <select
                            value={settings.clickSoundStyle || 'Alien Tech Click'}
                            onChange={(e) => {
                              const nextStyle = e.target.value;
                              setSettings({ ...settings, clickSoundStyle: nextStyle });
                              soundEngine.setClickSettings(
                                true,
                                (settings.clickSoundVolume ?? 75) / 100,
                                nextStyle
                              );
                              soundEngine.playTechClick(nextStyle);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#222226] border border-[#34343b] text-white text-xs w-44 focus:outline-none"
                          >
                            <option value="Alien Tech Click">Alien Tech Click</option>
                            <option value="Cyber Blip">Cyber Blip</option>
                            <option value="Telemetry Pulse">Telemetry Pulse</option>
                            <option value="Quantum Sonar">Quantum Sonar</option>
                          </select>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-300 text-xs sm:text-sm">Click Sound Volume</span>
                            <span className="text-[11px] text-gray-400 tabular-nums">
                              {settings.clickSoundVolume ?? 75}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={settings.clickSoundVolume ?? 75}
                            onChange={(e) => {
                              const nextVol = Number(e.target.value);
                              setSettings({ ...settings, clickSoundVolume: nextVol });
                              soundEngine.setClickSettings(
                                true,
                                nextVol / 100,
                                settings.clickSoundStyle || 'Alien Tech Click'
                              );
                            }}
                            onMouseUp={() => soundEngine.playTechClick()}
                            onTouchEnd={() => soundEngine.playTechClick()}
                            style={{ accentColor: '#f25551' }}
                            className="w-44 h-1.5 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                    <ToggleRow
                      label="Add new tasks on top"
                      checked={settings.addTasksOnTop}
                      onChange={(val) => setSettings({ ...settings, addTasksOnTop: val })}
                    />
                  </div>

                  <div className="border-t border-[#26262a] pt-5 space-y-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-white">Feature toggles</h4>
                    <ToggleRow
                      label="Focus Time Ranking"
                      checked={settings.focusTimeRanking}
                      onChange={(val) => setSettings({ ...settings, focusTimeRanking: val })}
                    />
                    <ToggleRow
                      label="Forest"
                      checked={settings.forestFeature}
                      onChange={(val) => setSettings({ ...settings, forestFeature: val })}
                    />
                    <ToggleRow
                      label="Group"
                      checked={settings.groupFeature}
                      onChange={(val) => setSettings({ ...settings, groupFeature: val })}
                    />
                    <ToggleRow
                      label="Projects Section (Sidebar)"
                      checked={settings.showProjectsSection ?? true}
                      onChange={(val) => setSettings({ ...settings, showProjectsSection: val })}
                    />
                  </div>
                </div>
              )}

              {settingsTab === 'pomodoro' && (
                <div className="max-w-2xl space-y-6">
                  <div className="max-w-md space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-200 text-xs sm:text-sm">Pomodoro Length</span>
                      <select
                        value={settings.pomodoroLength}
                        onChange={(e) => updateFlexibleMinutes(Number(e.target.value))}
                        className="px-3.5 py-2 rounded-lg bg-[#222226] border border-[#34343b] text-white text-xs sm:text-sm w-48 focus:outline-none"
                      >
                        {[15, 20, 25, 30, 45, 50, 60, 90, 100, 120, 180, 220, 240, 300, 360, 480].map(
                          (m) => (
                            <option key={m} value={m}>
                              {m} Minutes
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-200 text-xs sm:text-sm">Short Break Length</span>
                      <select
                        value={settings.shortBreakLength}
                        onChange={(e) =>
                          setSettings({ ...settings, shortBreakLength: Number(e.target.value) })
                        }
                        className="px-3.5 py-2 rounded-lg bg-[#222226] border border-[#34343b] text-white text-xs sm:text-sm w-48 focus:outline-none"
                      >
                        {[3, 5, 10, 15, 20].map((m) => (
                          <option key={m} value={m}>
                            {m} Minutes
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-200 text-xs sm:text-sm">Long Break Length</span>
                      <select
                        value={settings.longBreakLength}
                        onChange={(e) =>
                          setSettings({ ...settings, longBreakLength: Number(e.target.value) })
                        }
                        className="px-3.5 py-2 rounded-lg bg-[#222226] border border-[#34343b] text-white text-xs sm:text-sm w-48 focus:outline-none"
                      >
                        {[10, 15, 20, 25, 30, 45].map((m) => (
                          <option key={m} value={m}>
                            {m} Minutes
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-200 text-xs sm:text-sm">Long Break After</span>
                      <select
                        value={settings.longBreakAfter}
                        onChange={(e) =>
                          setSettings({ ...settings, longBreakAfter: Number(e.target.value) })
                        }
                        className="px-3.5 py-2 rounded-lg bg-[#222226] border border-[#34343b] text-white text-xs sm:text-sm w-48 focus:outline-none"
                      >
                        {[2, 3, 4, 5, 6].map((p) => (
                          <option key={p} value={p}>
                            {p} Pomodoros
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="max-w-md border-t border-[#26262a] pt-5 space-y-4">
                    <ToggleRow
                      label="Auto Start of Next Pomodoro"
                      checked={settings.autoStartNext}
                      onChange={(val) => setSettings({ ...settings, autoStartNext: val })}
                    />
                    <ToggleRow
                      label="Auto Start of Break"
                      checked={settings.autoStartBreak}
                      onChange={(val) => setSettings({ ...settings, autoStartBreak: val })}
                    />
                    <ToggleRow
                      label="Disable Break"
                      checked={settings.disableBreak}
                      onChange={(val) => setSettings({ ...settings, disableBreak: val })}
                    />
                  </div>

                  {/* Alarm Sound Section with Live Volume Slider */}
                  <div className="max-w-md border-t border-[#26262a] pt-5 space-y-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-white">Alarm Sound</h4>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-200 text-xs sm:text-sm">Volume</span>
                        <span className="text-[11px] text-gray-400 tabular-nums">
                          {settings.alarmVolume}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.alarmVolume}
                        onChange={(e) => {
                          const nextVol = Number(e.target.value);
                          setSettings({ ...settings, alarmVolume: nextVol });
                          soundEngine.setAlarmVolume(nextVol / 100);
                        }}
                        onMouseUp={() => soundEngine.playAlarm(settings.focusAlarm || 'Timer')}
                        onTouchEnd={() => soundEngine.playAlarm(settings.focusAlarm || 'Timer')}
                        style={{ accentColor: '#f25551' }}
                        className="w-48 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="relative flex items-center justify-between">
                      <span className="text-gray-200 text-xs sm:text-sm">Focus Alarm</span>
                      <div className="relative w-48">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenAlarmDropdown((prev) => (prev === 'focus' ? null : 'focus'));
                          }}
                          className="w-full px-3.5 py-2 rounded-lg bg-[#222226] border border-[#34343b] text-white text-xs sm:text-sm flex items-center justify-between"
                        >
                          <span className="truncate">{settings.focusAlarm}</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        {openAlarmDropdown === 'focus' && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 mt-1.5 w-52 rounded-xl bg-[#222226] border border-[#36363e] shadow-2xl py-1.5 z-50 max-h-60 overflow-y-auto"
                          >
                            {alarmOptions.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setSettings({
                                    ...settings,
                                    focusAlarm: opt,
                                    alarmSound: opt,
                                  });
                                  soundEngine.playAlarm(opt);
                                  setOpenAlarmDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-xs sm:text-sm text-gray-200 hover:bg-white/10 flex items-center justify-between"
                              >
                                <span>{opt}</span>
                                {settings.focusAlarm === opt && (
                                  <Check className="w-4 h-4 text-[#f25551]" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative flex items-center justify-between">
                      <span className="text-gray-200 text-xs sm:text-sm">Break Alarm</span>
                      <div className="relative w-48">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenAlarmDropdown((prev) => (prev === 'break' ? null : 'break'));
                          }}
                          className="w-full px-3.5 py-2 rounded-lg bg-[#222226] border border-[#34343b] text-white text-xs sm:text-sm flex items-center justify-between"
                        >
                          <span className="truncate">{settings.breakAlarm}</span>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>

                        {openAlarmDropdown === 'break' && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 mt-1.5 w-52 rounded-xl bg-[#222226] border border-[#36363e] shadow-2xl py-1.5 z-50 max-h-60 overflow-y-auto"
                          >
                            {alarmOptions.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  setSettings({ ...settings, breakAlarm: opt });
                                  soundEngine.playAlarm(opt);
                                  setOpenAlarmDropdown(null);
                                }}
                                className="w-full px-4 py-2 text-left text-xs sm:text-sm text-gray-200 hover:bg-white/10 flex items-center justify-between"
                              >
                                <span>{opt}</span>
                                {settings.breakAlarm === opt && (
                                  <Check className="w-4 h-4 text-[#f25551]" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* White Noise Section with Live Volume Slider */}
                  <div className="border-t border-[#26262a] pt-5 space-y-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-white">White Noise</h4>

                    <div className="max-w-md flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-200 text-xs sm:text-sm">Volume</span>
                        <span className="text-[11px] text-gray-400 tabular-nums">
                          {settings.whiteNoiseVolume}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={settings.whiteNoiseVolume}
                        onChange={(e) => {
                          const nextVol = Number(e.target.value);
                          setSettings({ ...settings, whiteNoiseVolume: nextVol });
                          soundEngine.setNoiseVolume(nextVol / 100);
                          if (
                            soundEngine.activeNoise === 'none' &&
                            (settings.defaultWhiteNoise || 'None') !== 'None'
                          ) {
                            soundEngine.setWhiteNoise(settings.defaultWhiteNoise);
                          }
                        }}
                        style={{ accentColor: '#f25551' }}
                        className="w-48 h-1.5 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {whiteNoiseOptions.map((wn) => {
                        const isSelected = (settings.defaultWhiteNoise || 'None') === wn.id;
                        const artworkMap = {
                          'Tic-tac': 'radial-gradient(circle at 50% 45%, #f5f5f4 0%, #d6d3d1 55%, #78716c 100%)',
                          Countdown: 'radial-gradient(circle at 40% 40%, #fbbf24 0%, #92400e 58%, #292524 100%)',
                          'Wind With Crickets': 'linear-gradient(180deg, #1e3a8a 0%, #3b82f6 55%, #0f172a 100%)',
                          'Class Room': 'linear-gradient(135deg, #fde68a 0%, #d97706 60%, #78350f 100%)',
                          Wilderness: 'linear-gradient(160deg, #34d399 0%, #065f46 58%, #064e3b 100%)',
                          Stream: 'linear-gradient(135deg, #e0f2fe 0%, #0284c7 55%, #1e293b 100%)',
                          'Ocean Shore': 'linear-gradient(135deg, #0891b2 0%, #22d3ee 50%, #e7e5e4 100%)',
                          Rain: 'radial-gradient(circle at 35% 30%, #93c5fd 0%, #1d4ed8 60%, #172554 100%)',
                          Cafe: 'radial-gradient(circle at 50% 45%, #fef3c7 0%, #92400e 55%, #27272a 100%)',
                          Bonfire: 'radial-gradient(circle at 50% 60%, #fef08a 0%, #ea580c 52%, #1c1917 100%)',
                          Library: 'linear-gradient(135deg, #b45309 0%, #78350f 55%, #292524 100%)',
                          Wind: 'linear-gradient(160deg, #fef08a 0%, #a3e635 52%, #3f6212 100%)',
                          'Frogs At Night': 'linear-gradient(180deg, #1d4ed8 0%, #1e40af 58%, #090d16 100%)',
                        };
                        return (
                          <div
                            key={wn.id}
                            onClick={() => {
                              setSettings({ ...settings, defaultWhiteNoise: wn.id });
                              handleWhiteNoiseChange(wn.id === 'None' ? 'off' : wn.id);
                            }}
                            className={`group cursor-pointer flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition ${
                              isSelected
                                ? 'bg-[#222227] border-[#3d3d47]'
                                : 'bg-[#1b1b1f] border-[#28282e] hover:border-[#36363e]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/15 shadow-inner overflow-hidden"
                                style={{
                                  background: wn.isNone
                                    ? '#27272a'
                                    : artworkMap[wn.id] ||
                                      `radial-gradient(circle at 30% 30%, ${wn.accent}, #18181b)`,
                                }}
                              >
                                {wn.isNone && <VolumeX className="w-4 h-4 text-gray-400" />}
                              </div>
                              <span className="text-xs sm:text-sm text-gray-200 truncate">
                                {wn.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 shrink-0">
                              {!wn.isNone && (
                                <button
                                  type="button"
                                  title={`Preview ${wn.label}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    soundEngine.setWhiteNoise(wn.id);
                                    showToast(`Previewing ${wn.label}`);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-white transition"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                              )}

                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'border-[#f25551] bg-[#f25551]'
                                    : 'border-gray-500 bg-transparent'
                                }`}
                              >
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#18181b]" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'projects' && (
                <div className="max-w-lg space-y-5">
                  <div className="rounded-xl bg-[#1e1e23] border border-[#2c2c34] p-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-white">
                        Projects Section (Sidebar ON / OFF)
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Turn ON or OFF your subject projects list in the left sidebar
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings({
                          ...settings,
                          showProjectsSection: !(settings.showProjectsSection ?? true),
                        })
                      }
                      className={`w-11 h-6 rounded-full transition p-0.5 shrink-0 ${
                        (settings.showProjectsSection ?? true) ? 'bg-[#f25551]' : 'bg-[#36363d]'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          (settings.showProjectsSection ?? true)
                            ? 'translate-x-5'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="rounded-xl bg-[#1b1b1f] border border-[#28282e] divide-y divide-[#25252b]">
                    {smartListItems.map((item) => {
                      const ItemIcon = item.icon;
                      const enabled = !!smartVisibility[item.key];
                      return (
                        <div
                          key={item.key}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <ItemIcon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
                            <span
                              className={`text-xs sm:text-sm transition ${
                                enabled ? 'text-gray-100' : 'text-gray-500 line-through'
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                smartListVisibility: {
                                  ...smartVisibility,
                                  [item.key]: !enabled,
                                },
                              })
                            }
                            className={`w-10 h-5 rounded-full transition p-0.5 shrink-0 ${
                              enabled ? 'bg-[#f25551]' : 'bg-[#36363d]'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {settingsTab === 'appearance' && (
                <div className="max-w-xl space-y-6">
                  <div className="flex items-center justify-between max-w-md">
                    <span className="text-gray-200 text-xs sm:text-sm">Dark Mode</span>
                    <select
                      value={settings.darkMode || 'Automatic'}
                      onChange={(e) => setSettings({ ...settings, darkMode: e.target.value })}
                      className="px-3.5 py-2 rounded-lg bg-[#222226] border border-[#34343b] text-white text-xs sm:text-sm w-48 focus:outline-none"
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Dark">Dark</option>
                      <option value="AMOLED Black">AMOLED Black</option>
                    </select>
                  </div>

                  <div className="border-t border-[#26262a] pt-5 space-y-4">
                    <h4 className="text-xs sm:text-sm font-semibold text-white">Theme</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        {
                          id: 'forest',
                          label: 'Botanical Leaves',
                          bg: 'radial-gradient(circle at 38% 52%, rgba(20, 118, 92, 0.65) 0%, rgba(10, 22, 19, 0.96) 72%), repeating-linear-gradient(125deg, rgba(16, 185, 129, 0.14) 0px, rgba(16, 185, 129, 0.14) 3px, transparent 3px, transparent 14px), linear-gradient(135deg, #06211b 0%, #0d1514 100%)',
                        },
                        {
                          id: 'ocean',
                          label: 'Turquoise Ocean Shore',
                          bg: 'linear-gradient(135deg, #083344 0%, #0e7490 42%, #38bdf8 66%, #f5f5f4 76%, #d6d3d1 100%)',
                        },
                        {
                          id: 'woods',
                          label: 'Sunlit Pine Forest',
                          bg: 'radial-gradient(circle at 52% 20%, rgba(254, 240, 138, 0.55) 0%, transparent 45%), repeating-linear-gradient(90deg, rgba(20, 35, 12, 0.7) 0px, rgba(20, 35, 12, 0.7) 6px, transparent 6px, transparent 26px), linear-gradient(180deg, #65a30d 0%, #3f6212 55%, #1a2e05 100%)',
                        },
                        {
                          id: 'fuji',
                          label: 'Starry Mount Fuji',
                          bg: 'radial-gradient(circle at 22% 22%, #ffffff 1px, transparent 1.5px), radial-gradient(circle at 75% 18%, #ffffff 1px, transparent 1.5px), linear-gradient(180deg, #1e1b4b 0%, #3730a3 48%, #6366f1 68%, #1e293b 100%)',
                        },
                      ].map((theme) => {
                        const selected = settings.focusWallpaper === theme.id;
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => setSettings({ ...settings, focusWallpaper: theme.id })}
                            className={`relative h-36 rounded-xl overflow-hidden border transition text-left ${
                              selected
                                ? 'border-[#f25551] ring-1 ring-[#f25551] shadow-lg'
                                : 'border-[#2c2c34] hover:border-[#42424d]'
                            }`}
                            style={{ background: theme.bg }}
                          >
                            <span className="sr-only">{theme.label}</span>
                            {selected && (
                              <div className="absolute bottom-2.5 right-2.5 w-5 h-5 rounded-full bg-[#f25551] flex items-center justify-center text-white shadow">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'about' && (
                <div className="max-w-md flex flex-col items-center text-center py-8 space-y-4">
                  <FocusLogoSVG size={64} />
                  <div>
                    <h3 className="text-lg font-semibold text-white">Focus To-Do</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Personal Study &amp; Pomodoro Timer Edition &bull; v3.2
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Built for deep focus sessions (up to 480 minutes), project-based study
                    tracking, real-time analytics, and offline local persistence.
                  </p>
                </div>
              )}
            </div>
          </div>

          {pendingBackupRestore && (
            <div className="fixed inset-0 z-[75] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-2xl bg-[#1a1a1f] border border-[#2f2f38] p-5 shadow-2xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Restore JSON Backup
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[300px]">
                      {pendingBackupRestore.fileName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingBackupRestore(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-xl bg-[#222229] border border-[#30303a] p-3 text-xs text-gray-200 space-y-1.5">
                  <p className="font-medium text-white">
                    Found {pendingBackupRestore.summary}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Restoring will replace your current browser data. A safety backup of your current data will download automatically first.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPendingBackupRestore(null)}
                    className="px-3.5 py-2 rounded-lg bg-[#25252c] hover:bg-[#303039] text-xs font-medium text-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmBackupRestore}
                    className="px-4 py-2 rounded-lg bg-[#ef5350] hover:bg-[#e53935] text-xs font-semibold text-white transition"
                  >
                    Restore Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {accountModal && (
            <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
              <div className="w-full max-w-sm rounded-2xl bg-[#222227] border border-[#34343c] p-6 space-y-4 shadow-2xl">
                {accountModal === 'email' && (
                  <>
                    <h4 className="text-sm font-semibold text-white">Change Account Email</h4>
                    <input
                      type="email"
                      value={tempEmail}
                      onChange={(e) => setTempEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#18181b] border border-[#36363e] text-xs text-white focus:outline-none focus:border-[#f25551]"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setAccountModal(null)}
                        className="px-4 py-1.5 rounded-lg bg-[#2a2a30] text-xs text-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (tempEmail.trim()) {
                            setSettings({ ...settings, email: tempEmail.trim() });
                            showToast('Account email updated');
                          }
                          setAccountModal(null);
                        }}
                        className="px-5 py-1.5 rounded-lg bg-[#f25551] text-xs font-medium text-white"
                      >
                        Save
                      </button>
                    </div>
                  </>
                )}

                {accountModal === 'password' && (
                  <>
                    <h4 className="text-sm font-semibold text-white">Change Password</h4>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={tempPassword}
                      onChange={(e) => setTempPassword(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg bg-[#18181b] border border-[#36363e] text-xs text-white focus:outline-none focus:border-[#f25551]"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setAccountModal(null)}
                        className="px-4 py-1.5 rounded-lg bg-[#2a2a30] text-xs text-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (tempPassword.trim()) {
                            showToast('Password updated successfully');
                          }
                          setAccountModal(null);
                        }}
                        className="px-5 py-1.5 rounded-lg bg-[#f25551] text-xs font-medium text-white"
                      >
                        Update
                      </button>
                    </div>
                  </>
                )}

                {accountModal === 'deleteData' && (
                  <>
                    <h4 className="text-sm font-semibold text-white">Reset / Delete All Data?</h4>
                    <p className="text-xs text-gray-400">
                      This will clear your custom tasks and reset to default study data.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setAccountModal(null)}
                        className="px-4 py-1.5 rounded-lg bg-[#2a2a30] text-xs text-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleResetDemoData();
                          setAccountModal(null);
                        }}
                        className="px-5 py-1.5 rounded-lg bg-[#f25551] text-xs font-medium text-white"
                      >
                        Confirm
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // 12. RENDER: USER HISTORY & CLASSIFIED ARCHIVE MODAL
  // ============================================================================
  const renderUserHistoryModal = () => {
    const q = historySearchQuery.trim().toLowerCase();

    const allProjectsList = [
      ...projects.map((p) => ({
        ...p,
        status: p.archived ? 'Archived' : p.completed ? 'Completed' : 'Active',
        recordedMins: validSessions
          .filter((s) => s.projectId === p.id)
          .reduce((acc, s) => acc + s.durationMins, 0),
        taskCount: tasks.filter((t) => t.projectId === p.id).length,
      })),
      ...(deletedHistory.projects || []).map((p) => ({
        ...p,
        status: 'Deleted',
      })),
    ].filter((p) => !q || p.name.toLowerCase().includes(q));

    const allTasksList = [
      ...tasks.map((t) => {
        const proj =
          projects.find((p) => p.id === t.projectId) ||
          (deletedHistory.projects || []).find((p) => p.id === t.projectId);
        return {
          ...t,
          projectName: proj ? proj.name : 'Tasks',
          projectColor: proj ? proj.color : '#3b82f6',
          status: t.archived ? 'Archived' : t.completed ? 'Completed' : 'Active',
          recordedMins: validSessions
            .filter((s) => s.taskId === t.id)
            .reduce((acc, s) => acc + s.durationMins, 0),
        };
      }),
      ...(deletedHistory.tasks || []).map((t) => ({
        ...t,
        status: 'Deleted',
      })),
    ].filter(
      (t) =>
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.projectName || '').toLowerCase().includes(q)
    );

    const archivedProjectsOnly = projects.filter(
      (p) => p.archived && (!q || p.name.toLowerCase().includes(q))
    );

    const archivedTasksOnly = tasks
      .filter(
        (t) =>
          t.archived &&
          (!q ||
            t.title.toLowerCase().includes(q) ||
            (projects.find((p) => p.id === t.projectId)?.name || '')
              .toLowerCase()
              .includes(q))
      )
      .map((t) => {
        const proj = projects.find((p) => p.id === t.projectId);
        return {
          ...t,
          projectName: proj ? proj.name : 'Tasks',
          projectColor: proj ? proj.color : '#3b82f6',
          recordedMins: validSessions
            .filter((s) => s.taskId === t.id)
            .reduce((acc, s) => acc + s.durationMins, 0),
        };
      });

    const deletedItemsOnly = {
      projects: (deletedHistory.projects || []).filter(
        (p) => !q || p.name.toLowerCase().includes(q)
      ),
      tasks: (deletedHistory.tasks || []).filter(
        (t) =>
          !q ||
          t.title.toLowerCase().includes(q) ||
          (t.projectName || '').toLowerCase().includes(q)
      ),
    };

    const sortedValidSessions = [...validSessions]
      .sort((a, b) => b.date.localeCompare(a.date) || b.startHour - a.startHour)
      .filter(
        (s) =>
          !q ||
          s.taskTitle.toLowerCase().includes(q) ||
          (s.projectName || '').toLowerCase().includes(q)
      );

    return (
      <div
        onClick={() => setIsUserHistoryOpen(false)}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl rounded-2xl bg-[#18181b] border border-[#2a2a2f] shadow-2xl overflow-hidden flex flex-col h-[86vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#26262c] flex items-center justify-between bg-[#1c1c20] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#ef5350]/15 text-[#ef5350] flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-white">
                  User History &amp; Classified Archive
                </h2>
                <p className="text-[11px] text-gray-400">
                  All active, completed &amp; deleted projects/tasks &bull; Only sessions &ge; 15m affect statistics
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsUserHistoryOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs & Search */}
          <div className="px-6 py-3 border-b border-[#242429] bg-[#161619] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center bg-[#121214] p-1 rounded-xl border border-[#28282e]">
              {[
                { id: 'all', label: 'Overview' },
                { id: 'projects', label: `Projects (${allProjectsList.length})` },
                { id: 'tasks', label: `Tasks (${allTasksList.length})` },
                {
                  id: 'archived',
                  label: `Archived (${archivedProjectsOnly.length + archivedTasksOnly.length})`,
                },
                {
                  id: 'deleted',
                  label: `Deleted (${deletedItemsOnly.projects.length + deletedItemsOnly.tasks.length})`,
                },
                { id: 'sessions', label: `Focus Logs (${sortedValidSessions.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setHistoryFilterTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    historyFilterTab === t.id
                      ? 'bg-[#2a2a30] text-white shadow'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter history..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                className="w-full bg-[#202025] border border-[#2f2f37] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ef5350]"
              />
            </div>
          </div>

          {/* Classified History Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-[#1e1e23] border border-[#2a2a32] p-3.5">
                <div className="text-[11px] text-gray-400">Total Projects</div>
                <div className="text-xl font-semibold text-white mt-0.5">
                  {allProjectsList.length}
                </div>
              </div>
              <div className="rounded-xl bg-[#1e1e23] border border-[#2a2a32] p-3.5">
                <div className="text-[11px] text-gray-400">Total Tasks</div>
                <div className="text-xl font-semibold text-white mt-0.5">
                  {allTasksList.length}
                </div>
              </div>
              <div className="rounded-xl bg-[#1e1e23] border border-[#2a2a32] p-3.5">
                <div className="text-[11px] text-gray-400">Archived / Deleted</div>
                <div className="text-xl font-semibold text-[#ef5350] mt-0.5">
                  {deletedItemsOnly.projects.length + deletedItemsOnly.tasks.length}
                </div>
              </div>
              <div className="rounded-xl bg-[#1e1e23] border border-[#2a2a32] p-3.5">
                <div className="text-[11px] text-gray-400">Recorded Study (&ge;15m)</div>
                <div className="text-xl font-semibold text-emerald-400 mt-0.5">
                  {formatHoursMins(
                    sortedValidSessions.reduce((acc, s) => acc + s.durationMins, 0)
                  ).text}
                </div>
              </div>
            </div>

            {/* SECTION 1: PROJECTS CLASSIFICATION */}
            {(historyFilterTab === 'all' || historyFilterTab === 'projects') && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <FolderKanban className="w-3.5 h-3.5 text-[#ef5350]" />
                  Projects Classification ({allProjectsList.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allProjectsList.map((proj) => (
                    <div
                      key={`${proj.id}-${proj.status}`}
                      className="p-3.5 rounded-xl bg-[#1d1d22] border border-[#292930] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color }}
                        />
                        <div className="truncate">
                          <div className="text-xs sm:text-sm font-medium text-gray-100 truncate">
                            {proj.name}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {proj.taskCount || 0} tasks &bull; Studied:{' '}
                            {formatHoursMins(proj.recordedMins || 0).text}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                          proj.status === 'Deleted'
                            ? 'bg-[#ef5350]/15 text-[#ef5350]'
                            : proj.status === 'Archived'
                            ? 'bg-amber-500/15 text-amber-400'
                            : proj.status === 'Completed'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}
                      >
                        {proj.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: ALL TASKS CLASSIFICATION */}
            {(historyFilterTab === 'all' || historyFilterTab === 'tasks') && (
              <div className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Tasks History ({allTasksList.length})
                </h3>
                <div className="space-y-2">
                  {allTasksList.map((t) => (
                    <div
                      key={`${t.id}-${t.status}`}
                      className="px-4 py-2.5 rounded-xl bg-[#1d1d22] border border-[#292930] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: t.projectColor }}
                        />
                        <div className="truncate">
                          <div
                            className={`text-xs sm:text-sm truncate ${
                              t.completed ? 'text-gray-300' : 'text-gray-100'
                            }`}
                          >
                            {t.title}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {t.projectName}
                            {t.dueDate ? ` • Date: ${t.dueDate}` : ''}
                            {t.recordedMins > 0
                              ? ` • Focus: ${formatHoursMins(t.recordedMins).text}`
                              : ''}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                          t.status === 'Deleted'
                            ? 'bg-[#ef5350]/15 text-[#ef5350]'
                            : t.status === 'Archived'
                            ? 'bg-amber-500/15 text-amber-400'
                            : t.status === 'Completed'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-blue-500/15 text-blue-400'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2B: ARCHIVED PROJECTS & TASKS WITH RESTORE */}
            {historyFilterTab === 'archived' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Archive className="w-3.5 h-3.5" />
                    Archived Projects ({archivedProjectsOnly.length})
                  </h3>
                  {archivedProjectsOnly.length === 0 ? (
                    <p className="text-xs text-gray-500">No archived projects yet.</p>
                  ) : (
                    archivedProjectsOnly.map((p) => {
                      const pMins = validSessions
                        .filter((s) => s.projectId === p.id)
                        .reduce((acc, s) => acc + s.durationMins, 0);
                      return (
                        <div
                          key={p.id}
                          className="px-4 py-3 rounded-xl bg-[#1d1d22] border border-[#2c2c34] flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: p.color }}
                            />
                            <div className="truncate">
                              <div className="text-xs font-medium text-gray-200 truncate">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-gray-400">
                                Studied: {formatHoursMins(pMins).text}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRestoreProject(p.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-medium text-emerald-400 flex items-center gap-1.5 transition shrink-0"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Archive className="w-3.5 h-3.5" />
                    Archived Tasks ({archivedTasksOnly.length})
                  </h3>
                  {archivedTasksOnly.length === 0 ? (
                    <p className="text-xs text-gray-500">No archived tasks yet.</p>
                  ) : (
                    archivedTasksOnly.map((t) => (
                      <div
                        key={t.id}
                        className="px-4 py-3 rounded-xl bg-[#1d1d22] border border-[#2c2c34] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-200 truncate">
                            {t.title}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Project: {t.projectName}
                            {t.archivedAt ? ` • Archived on ${t.archivedAt}` : ''}
                            {t.recordedMins > 0
                              ? ` • Focus: ${formatHoursMins(t.recordedMins).text}`
                              : ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRestoreTask(t.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-xs font-medium text-emerald-400 flex items-center gap-1.5 transition shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SECTION 3: DELETED ARCHIVE */}
            {historyFilterTab === 'deleted' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ef5350] flex items-center gap-2">
                    <FolderKanban className="w-3.5 h-3.5" />
                    Deleted Projects ({deletedItemsOnly.projects.length})
                  </h3>
                  {deletedItemsOnly.projects.length === 0 ? (
                    <p className="text-xs text-gray-500">No deleted projects yet.</p>
                  ) : (
                    deletedItemsOnly.projects.map((p, idx) => (
                      <div
                        key={`${p.id}-${idx}`}
                        className="px-4 py-3 rounded-xl bg-[#1d1d22] border border-[#2c2c34] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          <div>
                            <div className="text-xs font-medium text-gray-200">{p.name}</div>
                            <div className="text-[11px] text-gray-400">
                              Deleted on {p.deletedAt} &bull; Preserved Focus:{' '}
                              {formatHoursMins(p.recordedMins || 0).text}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ef5350]/15 text-[#ef5350]">
                          Deleted Project
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#ef5350] flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" />
                    Deleted Tasks ({deletedItemsOnly.tasks.length})
                  </h3>
                  {deletedItemsOnly.tasks.length === 0 ? (
                    <p className="text-xs text-gray-500">No deleted tasks yet.</p>
                  ) : (
                    deletedItemsOnly.tasks.map((t, idx) => (
                      <div
                        key={`${t.id}-${idx}`}
                        className="px-4 py-3 rounded-xl bg-[#1d1d22] border border-[#2c2c34] flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-medium text-gray-200">{t.title}</div>
                          <div className="text-[11px] text-gray-400">
                            Project: {t.projectName} &bull; Deleted on {t.deletedAt} &bull;
                            Focus: {formatHoursMins(t.recordedMins || 0).text}
                          </div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ef5350]/15 text-[#ef5350]">
                          Deleted Task
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SECTION 4: FOCUS LOGS (>= 15 MIN) */}
            {historyFilterTab === 'sessions' && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Valid Focus Sessions (&ge; 15m) ({sortedValidSessions.length})
                </h3>
                {sortedValidSessions.map((s) => {
                  const proj =
                    projects.find((p) => p.id === s.projectId) ||
                    (deletedHistory.projects || []).find((p) => p.id === s.projectId);
                  return (
                    <div
                      key={s.id}
                      className="px-4 py-2.5 rounded-xl bg-[#1d1d22] border border-[#292930] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{
                            backgroundColor: proj ? proj.color : s.projectColor || '#3b82f6',
                          }}
                        />
                        <div className="truncate">
                          <div className="text-xs font-medium text-gray-100 truncate">
                            {s.taskTitle}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {proj ? proj.name : s.projectName || 'Tasks'} &bull; {s.date}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-400 shrink-0">
                        {formatHoursMins(s.durationMins).text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // 13. MAIN APP SHELL (TOP BAR + LEFT SIDEBAR + WORKSPACE + FLOATING PLAYER)
  // ============================================================================
  return (
    <div
      onClickCapture={(e) => {
        const interactiveEl = e.target.closest(
          'button, select, input[type="range"], input[type="checkbox"], [role="button"], .cursor-pointer'
        );
        if (interactiveEl && !interactiveEl.disabled) {
          soundEngine.playTechClick();
        }
      }}
      onClick={() => {
        if (projectMenuId) setProjectMenuId(null);
        if (taskMenuId) setTaskMenuId(null);
        if (isProfileMenuOpen) setIsProfileMenuOpen(false);
        if (taskbarPopoverMode) setTaskbarPopoverMode(null);
      }}
      className={`h-screen w-screen ${
        isAmoled ? 'bg-black' : 'bg-[#121214]'
      } text-gray-100 flex flex-col overflow-hidden select-none font-sans`}
    >
      {/* Top Desktop Window / Action Bar */}
      <header
        className={`h-11 ${
          isAmoled ? 'bg-black' : 'bg-[#18181b]'
        } border-b border-[#242429] px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0`}
      >
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            title={isSidebarOpen ? 'Hide sidebar' : 'Open sidebar'}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition flex items-center gap-1.5"
          >
            <SidebarToggleSVG isOpen={isSidebarOpen} />
          </button>
          <FocusLogoSVG size={22} />
          <span className="text-xs font-semibold text-gray-200 tracking-wide hidden sm:inline">
            Focus To-Do
          </span>
        </div>

        {/* Top Center Search Bar */}
        <div className="relative flex-1 max-w-md mx-2">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#222226] border border-[#2f2f37] focus:border-[#3b82f6] rounded-lg pl-8 pr-7 py-1 text-xs text-white placeholder-gray-500 focus:outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              title="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Red Fireball Streak Pill */}
          <button
            type="button"
            onClick={() => setIsAchievementsModalOpen(true)}
            title="Learning Streak & Daily Medal Achievements"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#222228] hover:bg-[#2c2c34] border border-[#ef5350]/35 transition mr-1"
          >
            <span className="w-5 h-5 rounded-full bg-[#ef5350]/20 flex items-center justify-center">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C12 2 17.5 6.8 17.5 13C17.5 16.59 14.81 19.5 11.5 19.5C8.19 19.5 5.5 16.59 5.5 13C5.5 10.7 6.65 8.55 8.2 7.1C8.1 8.6 8.85 9.8 9.9 10.2C9.6 7.4 10.6 4.4 12 2Z"
                  fill="#ef5350"
                />
                <path
                  d="M11.8 11.5C11.8 11.5 14.3 13.4 14.3 15.8C14.3 17.3 13.1 18.5 11.6 18.5C10.1 18.5 8.9 17.3 8.9 15.8C8.9 14.2 10.3 12.6 11.8 11.5Z"
                  fill="#fca5a5"
                />
              </svg>
            </span>
            <span className="text-xs font-semibold text-gray-100 tabular-nums">
              {streakAndAchievements.currentStreak}{' '}
              {streakAndAchievements.currentStreak === 1 ? 'day' : 'days'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {}}
            title="Goal Target"
            className="p-1.5 rounded-lg hover:bg-white/10 transition flex items-center justify-center"
          >
            <TargetIconSVG size={19} />
          </button>
          <button
            type="button"
            onClick={() => setIsAchievementsModalOpen(true)}
            title="Achievements & Medals"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <Trophy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveView('reports')}
            title="Statistics & Reports"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => showToast('All study reminders are up to date')}
            title="Notifications"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <Bell className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSettingsTab('account');
              setActiveView('settings');
            }}
            title="Settings"
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Split Content: Left Sidebar + Right Task Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR (Hidden temporarily while searching or when collapsed by user) */}
        {!searchQuery.trim() && (
          <aside
            className={`${isSidebarOpen ? 'w-64 border-r border-[#242429]' : 'w-0 border-r-0'} ${
              isAmoled ? 'bg-black' : 'bg-[#18181b]'
            } flex flex-col justify-between transition-all duration-200 overflow-hidden shrink-0`}
          >
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {/* User Profile Header + Dropdown Menu */}
              <div className="relative">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsProfileMenuOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition"
                >
                  {settings.avatarUrl ? (
                    <img
                      src={settings.avatarUrl}
                      alt="User"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#2c2c30] flex items-center justify-center text-gray-300 font-semibold text-xs">
                      {settings.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-200 truncate">
                    {settings.username}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-500 ml-auto transition-transform ${
                      isProfileMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {isProfileMenuOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute left-1 right-1 mt-1.5 rounded-xl bg-[#242429] border border-[#34343c] shadow-2xl py-2 z-50 text-xs"
                  >
                    <div className="px-4 py-1 text-[11px] text-gray-400">
                      Last synced: {lastSyncedAt}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setLastSyncedAt('Just now');
                        setIsProfileMenuOpen(false);
                        showToast('Data synced locally');
                      }}
                      className="w-full text-left px-4 py-2 text-gray-100 hover:bg-white/10 transition"
                    >
                      Sync Now
                    </button>

                    <div className="my-1.5 border-t border-[#32323a]" />

                    <div className="px-4 py-1 text-[11px] text-emerald-400">
                      Personal Edition: Active
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setSettingsTab('premium');
                        setActiveView('settings');
                      }}
                      className="w-full text-left px-4 py-2 text-gray-100 hover:bg-white/10 transition"
                    >
                      Upgrade to Premium
                    </button>

                    <div className="my-1.5 border-t border-[#32323a]" />

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setSettingsTab('account');
                        setActiveView('settings');
                      }}
                      className="w-full text-left px-4 py-2 text-gray-100 hover:bg-white/10 transition"
                    >
                      Account Settings
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setHistoryFilterTab('all');
                        setHistorySearchQuery('');
                        setIsUserHistoryOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-100 hover:bg-white/10 flex items-center justify-between transition"
                    >
                      <span>User History</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#ef5350]/20 text-[#ef5350] text-[10px] font-medium">
                        {projects.length +
                          (deletedHistory.projects || []).length +
                          tasks.length +
                          (deletedHistory.tasks || []).length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        showToast(`Signed in locally as ${settings.username}`);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-100 hover:bg-white/10 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              {/* TAB VIEW (Fixed Header Below Search Bar with Expand / Contract Toggle) */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => setIsTabViewExpanded((prev) => !prev)}
                  className="w-full px-2.5 py-2 rounded-xl bg-[#202025] hover:bg-[#26262c] border border-[#2c2c34] flex items-center justify-between text-[11px] font-semibold tracking-wider text-gray-300 uppercase transition"
                >
                  <span>TAB VIEW</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                      isTabViewExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isTabViewExpanded && (
                  <div className="space-y-0.5 pt-1">
                    {[
                      {
                        id: 'today',
                        label: 'Today',
                        icon: Sun,
                        color: '#22c55e',
                        timeText:
                          sidebarCounts.today.mins > 0
                            ? formatHoursMins(sidebarCounts.today.mins).text
                            : '0m',
                        count: sidebarCounts.today.count,
                      },
                      {
                        id: 'overdue',
                        label: 'Overdue',
                        icon: AlertCircle,
                        color: '#ef5350',
                        timeText: '',
                        count: tasks.filter(
                          (t) => !t.completed && t.dueDate && t.dueDate < todayStr
                        ).length,
                      },
                      {
                        id: 'tomorrow',
                        label: 'Tomorrow',
                        icon: Sunrise,
                        color: '#f97316',
                        timeText: '0m',
                        count: tasks.filter(
                          (t) => !t.completed && t.dueDate === tomorrowStr
                        ).length,
                      },
                      {
                        id: 'week',
                        label: 'This Week',
                        icon: Calendar,
                        color: '#a855f7',
                        timeText:
                          sidebarCounts.week.mins > 0
                            ? formatHoursMins(sidebarCounts.week.mins).text
                            : '0m',
                        count: sidebarCounts.week.count,
                      },
                      {
                        id: 'next7',
                        label: 'Next 7 Days',
                        icon: CalendarDays,
                        color: '#14b8a6',
                        timeText: '',
                        count: tasks.filter(
                          (t) =>
                            !t.completed &&
                            t.dueDate &&
                            t.dueDate >= todayStr &&
                            t.dueDate <= weekEndStr
                        ).length,
                      },
                      {
                        id: 'highPriority',
                        label: 'High Priority',
                        icon: Flag,
                        color: '#ef5350',
                        timeText: '',
                        count: tasks.filter((t) => !t.completed && t.estPomodoros >= 3)
                          .length,
                      },
                      {
                        id: 'mediumPriority',
                        label: 'Medium Priority',
                        icon: Flag,
                        color: '#eab308',
                        timeText: '',
                        count: tasks.filter((t) => !t.completed && t.estPomodoros === 2)
                          .length,
                      },
                      {
                        id: 'lowPriority',
                        label: 'Low Priority',
                        icon: Flag,
                        color: '#22c55e',
                        timeText: '',
                        count: tasks.filter((t) => !t.completed && t.estPomodoros <= 1)
                          .length,
                      },
                      {
                        id: 'planned',
                        label: 'Planned',
                        icon: CalendarCheck,
                        color: '#3b82f6',
                        timeText: '0m',
                        count: tasks.filter((t) => !t.completed && Boolean(t.dueDate))
                          .length,
                      },
                      {
                        id: 'all',
                        label: 'All',
                        icon: LayoutGrid,
                        color: '#f97316',
                        timeText: '',
                        count: tasks.filter((t) => !t.completed).length,
                      },
                      {
                        id: 'someday',
                        label: 'Someday',
                        icon: CalendarClock,
                        color: '#8b5cf6',
                        timeText: '',
                        count: tasks.filter((t) => !t.completed && !t.dueDate).length,
                      },
                      {
                        id: 'completed',
                        label: 'Completed',
                        icon: CheckCircle2,
                        color: '#6b7280',
                        timeText: '',
                        count: null,
                      },
                      {
                        id: 'tasks',
                        label: 'Tasks',
                        icon: Inbox,
                        color: '#3b82f6',
                        timeText:
                          sidebarCounts.all.mins > 0
                            ? formatHoursMins(sidebarCounts.all.mins).text
                            : '0m',
                        count: sidebarCounts.all.count,
                      },
                    ]
                      .filter(
                        (item) =>
                          (settings.smartListVisibility ||
                            DEFAULT_SETTINGS.smartListVisibility)[item.id]
                      )
                      .map((item) => {
                        const Icon = item.icon;
                        const isSelected = activeFilter === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveFilter(item.id)}
                            className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs transition ${
                              isSelected
                                ? 'bg-[#28282f] text-white font-semibold'
                                : 'text-gray-300 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Icon
                                className="w-4 h-4 shrink-0"
                                style={{ color: item.color }}
                              />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.count !== null && (
                              <div className="flex items-center gap-2 text-[11px] text-gray-500 shrink-0 tabular-nums">
                                {item.timeText && <span>{item.timeText}</span>}
                                <span>{item.count}</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* PROJECTS VIEW (Editable Section Name + Expand / Contract Toggle) */}
              {(settings.showProjectsSection ?? true) && (
                <div className="space-y-1 pt-1">
                  <div className="px-2.5 py-2 rounded-xl bg-[#202025] border border-[#2c2c34] flex items-center justify-between">
                    {isEditingProjectSectionTitle ? (
                      <input
                        type="text"
                        autoFocus
                        value={projectSectionTitleDraft}
                        onChange={(e) => setProjectSectionTitleDraft(e.target.value)}
                        onBlur={() => {
                          if (projectSectionTitleDraft.trim()) {
                            setSettings((prev) => ({
                              ...prev,
                              projectsSectionTitle: projectSectionTitleDraft.trim(),
                            }));
                          }
                          setIsEditingProjectSectionTitle(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                          if (e.key === 'Escape') setIsEditingProjectSectionTitle(false);
                        }}
                        className="w-full bg-[#141418] border border-[#ef5350] rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white focus:outline-none"
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setProjectSectionTitleDraft(
                            settings.projectsSectionTitle || 'PROJECTS'
                          );
                          setIsEditingProjectSectionTitle(true);
                        }}
                        title="Click to edit section title"
                        className="text-[11px] font-semibold tracking-wider text-gray-300 uppercase cursor-text hover:text-white truncate"
                      >
                        {settings.projectsSectionTitle || 'PROJECTS'}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsProjectViewExpanded((prev) => !prev)}
                      title={
                        isProjectViewExpanded ? 'Contract Projects' : 'Expand Projects'
                      }
                      className="p-0.5 text-gray-400 hover:text-white transition shrink-0"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isProjectViewExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {isProjectViewExpanded && (
                    <div className="space-y-0.5 pt-1">
                      {projects
                        .filter((p) => !p.parentId && !p.archived)
                        .map((proj) => {
                          const subProjs = projects.filter(
                            (sp) => sp.parentId === proj.id && !sp.archived
                          );
                          const isSelected = activeFilter === proj.id;
                          const projIncomplete = tasks.filter(
                            (t) =>
                              !t.completed &&
                              (t.projectId === proj.id ||
                                subProjs.some((sp) => sp.id === t.projectId))
                          );
                          const projEstMins = projIncomplete.reduce(
                            (acc, t) =>
                              acc +
                              Math.max(0, t.estPomodoros - t.completedPomodoros) *
                                settings.pomodoroLength,
                            0
                          );
                          const isSubExpanded = expandedProjects[proj.id] ?? true;

                          return (
                            <div key={proj.id} className="relative">
                              <div
                                onClick={() => setActiveFilter(proj.id)}
                                className={`group w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs cursor-pointer transition ${
                                  isSelected
                                    ? 'bg-[#28282f] border border-[#ef5350]/45 text-white font-semibold'
                                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                                } ${proj.inactive ? 'opacity-55' : ''}`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className="w-2.5 h-2.5 rounded-full shrink-0"
                                    style={{ backgroundColor: proj.color }}
                                  />
                                  <span
                                    className={`truncate ${
                                      proj.completed ? 'line-through text-gray-500' : ''
                                    }`}
                                  >
                                    {proj.name}
                                  </span>
                                  {proj.inactive && (
                                    <span className="px-1.5 py-0.2 rounded bg-gray-700/60 text-[9px] text-gray-400">
                                      Inactive
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {subProjs.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setExpandedProjects((prev) => ({
                                          ...prev,
                                          [proj.id]: !isSubExpanded,
                                        }));
                                      }}
                                      className="p-0.5 text-gray-500 hover:text-white"
                                    >
                                      <ChevronDown
                                        className={`w-3 h-3 transition-transform ${
                                          isSubExpanded ? 'rotate-180' : ''
                                        }`}
                                      />
                                    </button>
                                  )}

                                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500 group-hover:hidden tabular-nums">
                                    <span>
                                      {projEstMins > 0
                                        ? formatHoursMins(projEstMins).text
                                        : '0m'}
                                    </span>
                                    <span>{projIncomplete.length}</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setProjectMenuId((prev) =>
                                        prev === proj.id ? null : proj.id
                                      );
                                    }}
                                    className="hidden group-hover:flex p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white"
                                  >
                                    <MoreHorizontal className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Project Context Menu (Includes + Add Sub-Project here!) */}
                              {projectMenuId === proj.id && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-1 mt-1 w-48 rounded-xl bg-[#242429] border border-[#36363f] shadow-2xl py-1.5 z-50 text-xs"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProjectMenuId(null);
                                      setNewProjectParentId(proj.id);
                                      setAssignNewProjectToTask(false);
                                      setNewProjectName('');
                                      setNewProjectColor(proj.color);
                                      setIsAddProjectOpen(true);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-[#ef5350] hover:bg-white/10 font-medium flex items-center gap-2 transition"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Sub-Project</span>
                                  </button>
                                  <div className="my-1 border-t border-[#32323a]" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProjectMenuId(null);
                                      setProjectStatusConfirm({
                                        id: proj.id,
                                        name: proj.name,
                                        nextInactive: !proj.inactive,
                                      });
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-gray-200 hover:bg-white/10 transition"
                                  >
                                    {proj.inactive ? 'Activate Project' : 'Inactivate Project'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProjectMenuId(null);
                                      setEditingProject({ ...proj });
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-gray-200 hover:bg-white/10 transition"
                                  >
                                    Edit Project
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleProjectComplete(proj)}
                                    className="w-full text-left px-3.5 py-2 text-gray-200 hover:bg-white/10 transition"
                                  >
                                    {proj.completed ? 'Reopen Project' : 'Complete'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleArchiveProject(proj)}
                                    className="w-full text-left px-3.5 py-2 text-gray-200 hover:bg-white/10 transition"
                                  >
                                    Archive Project
                                  </button>
                                  <div className="my-1 border-t border-[#32323a]" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProjectMenuId(null);
                                      setDeletingProject(proj);
                                    }}
                                    className="w-full text-left px-3.5 py-2 text-[#ef5350] hover:bg-white/10 transition"
                                  >
                                    Delete Project
                                  </button>
                                </div>
                              )}

                              {/* Nested Sub-Projects List */}
                              {subProjs.length > 0 && isSubExpanded && (
                                <div className="pl-5 space-y-0.5 mt-0.5">
                                  {subProjs.map((sp) => {
                                    const spSelected = activeFilter === sp.id;
                                    const spTasks = tasks.filter(
                                      (t) => !t.completed && t.projectId === sp.id
                                    );
                                    return (
                                      <div
                                        key={sp.id}
                                        onClick={() => setActiveFilter(sp.id)}
                                        className={`group px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs cursor-pointer transition ${
                                          spSelected
                                            ? 'bg-[#28282f] text-white font-medium'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          <span
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: sp.color }}
                                          />
                                          <span className="truncate">{sp.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] text-gray-500">
                                            {spTasks.length}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDeletingProject(sp);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-[#ef5350]"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}

                      {/* Folders */}
                      {folders.map((folder) => {
                        const isExpanded = expandedFolders[folder.id] ?? true;
                        return (
                          <div key={folder.id} className="pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedFolders((prev) => ({
                                  ...prev,
                                  [folder.id]: !isExpanded,
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <Folder className="w-3.5 h-3.5 text-[#ef5350]" />
                                <span>{folder.name}</span>
                              </div>
                              <ChevronDown
                                className={`w-3 h-3 transition-transform ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}

                      {/* Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 px-2 pt-2">
                          {tags.map((tag) => (
                            <span
                              key={tag.id}
                              className="px-2 py-0.5 rounded-full bg-[#222228] text-[10px] text-gray-300 flex items-center gap-1"
                            >
                              <Tag className="w-2.5 h-2.5 text-[#ef5350]" />
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          {/* Sidebar Footer: + Add Project, Tag, Folder */}
          <div className="p-3 border-t border-[#242429] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setNewProjectParentId(null);
                setAssignNewProjectToTask(false);
                setNewProjectName('');
                setIsAddProjectOpen(true);
              }}
              className="flex items-center gap-2 text-[#ef5350] hover:text-[#f87171] font-medium px-2 py-1 rounded-lg hover:bg-white/5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
            <div className="flex items-center gap-1 text-[#ef5350]">
              <button
                type="button"
                onClick={() => setIsAddTagOpen(true)}
                title="Add Tag"
                className="p-1.5 rounded-lg hover:bg-white/10 transition"
              >
                <Tag className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsAddFolderOpen(true)}
                title="Add Folder"
                className="p-1.5 rounded-lg hover:bg-white/10 transition"
              >
                <Folder className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>
        )}

        {/* RIGHT MAIN WORKSPACE */}
        <main
          className={`flex-1 flex flex-col overflow-hidden ${
            isAmoled ? 'bg-black' : 'bg-[#121214]'
          } relative`}
        >
          {searchQuery.trim() ? (
            /* TEMPORARY CLEAN SEARCH RESULTS VIEW (App UI Hidden While Searching) */
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-12 max-w-4xl w-full mx-auto space-y-4">
              <div className="flex items-center justify-between border-b border-[#24242a] pb-3">
                <div className="flex items-center gap-2.5">
                  <Search className="w-4 h-4 text-[#ef5350]" />
                  <h2 className="text-sm sm:text-base font-semibold text-white">
                    Search Results for &quot;{searchQuery.trim()}&quot;
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#222228] text-xs text-gray-400">
                    {filteredTasks.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1 rounded-lg bg-[#222228] hover:bg-[#2d2d35] text-xs text-gray-200 flex items-center gap-1.5 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Exit Search</span>
                </button>
              </div>

              <div className="space-y-2">
                {filteredTasks.map((task) => {
                  const proj = task.projectId
                    ? projects.find((p) => p.id === task.projectId)
                    : null;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setOpenedTaskDetailId(task.id)}
                      className="group rounded-xl bg-[#18181b] hover:bg-[#1e1e23] border border-[#24242a] px-4 py-3 flex items-center justify-between gap-3 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTaskComplete(task.id);
                          }}
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition ${
                            task.completed
                              ? 'bg-emerald-500 text-black'
                              : 'border border-gray-500 hover:border-[#ef5350]'
                          }`}
                        >
                          {task.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-xs sm:text-sm truncate ${
                              task.completed ? 'line-through text-gray-500' : 'text-gray-100'
                            }`}
                          >
                            {task.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            {proj && (
                              <span
                                className="text-[10px] font-medium flex items-center gap-1"
                                style={{ color: proj.color }}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: proj.color }}
                                />
                                {proj.name}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className="text-[10px] text-gray-500">
                                {task.dueDate === todayStr ? 'Today' : task.dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <div className="text-center py-16 text-xs text-gray-500">
                    No matching tasks found for &quot;{searchQuery.trim()}&quot;.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 pt-6 pb-28 max-w-5xl w-full mx-auto space-y-5">
            {/* Workspace Header & Project Layout (Green KPI -> Yellow Date/Efficiency -> Purple Sub-Projects) */}
            {(() => {
              const isProjectView = !searchQuery.trim() && activeFilter.startsWith('proj-');
              const dateSwitcherAndEfficiency = (
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 flex-1 min-w-0 w-full">
                  {!searchQuery.trim() && (
                    <div className="flex items-center gap-1 bg-[#1b1b1f] border border-[#2a2a30] rounded-xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (isTomorrowTab) {
                            setFutureTabOffsets((prev) => ({
                              ...prev,
                              tomorrow: Math.max(0, (prev.tomorrow || 0) - 1),
                            }));
                          } else if (isPlannedTab) {
                            setFutureTabOffsets((prev) => ({
                              ...prev,
                              planned: Math.max(0, (prev.planned || 0) - 1),
                            }));
                          } else {
                            setTabOffsets((prev) => ({
                              ...prev,
                              [activeFilter]: (prev[activeFilter] || 0) + 1,
                            }));
                          }
                        }}
                        disabled={
                          isFuturePlannerTab &&
                          (isTomorrowTab
                            ? (futureTabOffsets.tomorrow || 0) <= 0
                            : (futureTabOffsets.planned || 0) <= 0)
                        }
                        title={
                          isFuturePlannerTab
                            ? 'Earlier Date'
                            : isWeekTab
                            ? 'Previous Week'
                            : 'Previous Date'
                        }
                        className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (isTomorrowTab) {
                            setFutureTabOffsets((prev) => ({ ...prev, tomorrow: 0 }));
                          } else if (isPlannedTab) {
                            setFutureTabOffsets((prev) => ({ ...prev, planned: 0 }));
                          } else {
                            setTabOffsets((prev) => ({ ...prev, [activeFilter]: 0 }));
                          }
                        }}
                        className={`${
                          isWeekTab ? 'w-36' : 'w-28'
                        } px-2 py-0.5 text-center text-xs font-medium text-gray-200 hover:text-white whitespace-nowrap tabular-nums transition`}
                      >
                        {isTomorrowTab
                          ? formatShortDateLabel(tomorrowTargetDateStr)
                          : isPlannedTab
                          ? formatShortDateLabel(plannedTargetDateStr)
                          : isWeekTab
                          ? weekTabRange.label
                          : formatShortDateLabel(selectedWorkspaceDateStr)}
                      </button>

                      <button
                        type="button"
                        disabled={!isFuturePlannerTab && !isProjectView && activeTabOffset <= 0}
                        onClick={() => {
                          if (isTomorrowTab) {
                            setFutureTabOffsets((prev) => ({
                              ...prev,
                              tomorrow: (prev.tomorrow || 0) + 1,
                            }));
                          } else if (isPlannedTab) {
                            setFutureTabOffsets((prev) => ({
                              ...prev,
                              planned: (prev.planned || 0) + 1,
                            }));
                          } else if (isProjectView) {
                            setTabOffsets((prev) => ({
                              ...prev,
                              [activeFilter]: (prev[activeFilter] || 0) - 1,
                            }));
                          } else {
                            setTabOffsets((prev) => ({
                              ...prev,
                              [activeFilter]: Math.max(0, (prev[activeFilter] || 0) - 1),
                            }));
                          }
                        }}
                        title={
                          isFuturePlannerTab
                            ? 'Future Date'
                            : isWeekTab
                            ? 'Next Week'
                            : 'Next Date'
                        }
                        className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {!searchQuery.trim() && !isFuturePlannerTab && (
                    <div className="hidden sm:flex items-center gap-2 flex-1 min-w-0">
                      {(() => {
                        const focusMins = workspaceStats.selectedDayFocusMins;
                        const goalTotalMins = isWeekTab
                          ? Math.max(1, workspaceStats.weekBaselineDailyMins * 7)
                          : Math.max(1, activeTabGoalHours * 60);
                        const pct = Math.min(100, Math.round((focusMins / goalTotalMins) * 100));

                        let tier = {
                          label: 'Low Efficiency',
                          barColor: '#ef4444',
                          glow: 'rgba(239, 68, 68, 0.35)',
                        };
                        if (pct >= 100) {
                          tier = {
                            label: 'Max Output',
                            barColor: '#22c55e',
                            glow: 'rgba(34, 197, 94, 0.45)',
                          };
                        } else if (pct >= 75) {
                          tier = {
                            label: 'Peak Focus',
                            barColor: '#ec4899',
                            glow: 'rgba(236, 72, 153, 0.45)',
                          };
                        } else if (pct >= 50) {
                          tier = {
                            label: 'High Flow',
                            barColor: '#eab308',
                            glow: 'rgba(234, 179, 8, 0.38)',
                          };
                        } else if (pct >= 25) {
                          tier = {
                            label: 'Steady Progress',
                            barColor: '#fb923c',
                            glow: 'rgba(251, 146, 60, 0.35)',
                          };
                        }

                        return (
                          <div className="relative flex-1 min-w-[200px] h-8 rounded-lg bg-[#18181b] border border-[#2a2a30] p-1 overflow-hidden">
                            <div
                              className="h-full rounded-md transition-all duration-500 ease-out"
                              style={{
                                width: `${pct === 0 ? 0 : Math.max(4, pct)}%`,
                                backgroundColor: tier.barColor,
                                boxShadow: pct > 0 ? `0 0 12px ${tier.glow}` : 'none',
                              }}
                            />
                            <div className="absolute inset-0 px-2.5 flex items-center justify-between text-[11px] pointer-events-none">
                              <span className="font-semibold text-white drop-shadow">
                                {formatHoursMins(focusMins).text}{' '}
                                <span className="font-normal opacity-90">
                                  ({isWeekTab
                                    ? `Avg ${formatHoursMins(workspaceStats.weekAvgDailyMins).text}/d • ${pct}%`
                                    : `${pct}%`})
                                </span>
                              </span>
                              <span className="font-medium text-gray-200 text-[10px]">
                                {tier.label}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {(activeFilter === 'today' || activeFilter.startsWith('proj-')) && (
                        <button
                          type="button"
                          onClick={() => {
                            setTempGoalHours(activeTabGoalHours);
                            setIsGoalModalOpen(true);
                          }}
                          title="Adjust Focus Goal (0h - 18h)"
                          className="h-8 px-2.5 rounded-lg bg-[#1d1d22] hover:bg-[#27272e] border border-[#2e2e36] text-[11px] font-medium text-gray-200 hover:text-white whitespace-nowrap shrink-0 transition"
                        >
                          Goal: {activeTabGoalHours}H
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );

              if (!isProjectView) {
                return (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 w-full">
                      <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight sm:w-40 shrink-0 truncate">
                        {activeViewMeta.title}
                      </h1>
                      {dateSwitcherAndEfficiency}
                    </div>
                  </div>
                );
              }

              const estFmt = formatHoursMins(workspaceStats.estimatedMins);
              const elapFmt = formatHoursMins(workspaceStats.elapsedMins);
              const subProjs = projects.filter(
                (p) => p.parentId === activeFilter && !p.archived
              );

              return (
                <>
                  {/* 1. Project Title */}
                  <div className="flex items-center justify-between gap-3">
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {activeViewMeta.title}
                    </h1>
                  </div>

                  {/* 2. Green Box: Fixed Project-Total 4-Column KPI Summary */}
                  <div className="rounded-2xl bg-[#18181b] border border-[#242429] p-4 sm:p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#26262c] text-center">
                      <div className="py-1 px-2">
                        <div className="flex items-baseline justify-center gap-0.5 text-[#ef5350]">
                          <span className="text-2xl sm:text-3xl font-light">{estFmt.h}</span>
                          <span className="text-xs text-gray-400">h</span>
                          <span className="text-2xl sm:text-3xl font-light ml-1">{estFmt.m}</span>
                          <span className="text-xs text-gray-400">m</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Estimated Time</div>
                      </div>

                      <div className="py-1 px-2">
                        <div className="text-2xl sm:text-3xl font-light text-[#ef5350]">
                          {workspaceStats.toCompleteCount}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Tasks to be Completed</div>
                      </div>

                      <div className="py-1 px-2">
                        <div className="flex items-baseline justify-center gap-0.5 text-[#ef5350]">
                          <span className="text-2xl sm:text-3xl font-light">{elapFmt.h}</span>
                          <span className="text-xs text-gray-400">h</span>
                          <span className="text-2xl sm:text-3xl font-light ml-1">{elapFmt.m}</span>
                          <span className="text-xs text-gray-400">m</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Elapsed Time</div>
                      </div>

                      <div className="py-1 px-2">
                        <div className="text-2xl sm:text-3xl font-light text-[#ef5350]">
                          {workspaceStats.completedCount}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Completed Tasks</div>
                      </div>
                    </div>
                  </div>

                  {/* 3. Yellow Panel: Per-Date Switcher + Daily Efficiency + Goal */}
                  {dateSwitcherAndEfficiency}

                  {/* 4. Purple Box: Sub-Projects (below Yellow Panel when inside a parent project with sub-projects) */}
                  {subProjs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-gray-400">Sub-Projects:</span>
                      {subProjs.map((sp) => (
                        <button
                          key={sp.id}
                          type="button"
                          onClick={() => setActiveFilter(sp.id)}
                          className="px-3 py-1 rounded-full bg-[#1c1c21] hover:bg-[#26262e] border border-[#2e2e38] text-xs text-gray-200 flex items-center gap-2 transition"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: sp.color }}
                          />
                          <span>{sp.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}

            {/* TODAY PANEL: 24-HOUR STUDY TREND LINE GRAPH + COMPACT 4-COLUMN KPI SUMMARY */}
            {activeFilter === 'today' &&
              !searchQuery.trim() &&
              (() => {
                const daySessions = validSessions
                  .filter((s) => s.date === selectedWorkspaceDateStr)
                  .sort((a, b) => a.startHour - b.startHour);

                const isToday = selectedWorkspaceDateStr === todayStr;
                const liveHour =
                  liveClock.getHours() +
                  liveClock.getMinutes() / 60 +
                  liveClock.getSeconds() / 3600;
                const liveX = (Math.min(24, Math.max(0, liveHour)) / 24) * 960;
                const liveTimeText = liveClock.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                const plottedSessions = isToday
                  ? daySessions.filter((s) => s.startHour <= liveHour)
                  : daySessions;

                const maxMins = Math.max(60, ...plottedSessions.map((s) => s.durationMins));
                const svgW = 960;
                const svgH = 148;
                const baselineY = 128;
                const topPad = 28;
                const usableH = baselineY - topPad;

                const rawPts = [];
                plottedSessions.forEach((s, idx) => {
                  const startX = Math.max(
                    0,
                    Math.min(isToday ? liveX : svgW, (s.startHour / 24) * svgW)
                  );
                  const endHourClamped = isToday
                    ? Math.min(liveHour, s.startHour + s.durationMins / 60)
                    : Math.min(24, s.startHour + s.durationMins / 60);
                  const endX = Math.max(
                    startX + 4,
                    Math.min(isToday ? liveX : svgW, (endHourClamped / 24) * svgW)
                  );
                  const midX = (startX + endX) / 2;
                  const peakY =
                    baselineY - Math.min(1, s.durationMins / maxMins) * usableH;

                  if (idx === 0) {
                    rawPts.push({ x: startX, y: baselineY, isPeak: false });
                  } else {
                    const prevEndX = rawPts[rawPts.length - 1].x;
                    if (startX - prevEndX > 6) {
                      rawPts.push({
                        x: (prevEndX + startX) / 2,
                        y: baselineY,
                        isPeak: false,
                      });
                    }
                  }

                  rawPts.push({
                    x: midX,
                    y: peakY,
                    isPeak: true,
                    mins: s.durationMins,
                    title: s.taskTitle,
                    id: s.id,
                  });
                  rawPts.push({ x: endX, y: baselineY, isPeak: false });
                });

                const hasLiveSessionRunning =
                  isToday &&
                  timerStatus === 'running' &&
                  (timerMode === 'countdown'
                    ? settings.pomodoroLength * 60 - secondsLeft >= 60
                    : elapsedStopwatchSecs >= 60);

                if (hasLiveSessionRunning) {
                  const activeRunMins =
                    timerMode === 'countdown'
                      ? Math.floor((settings.pomodoroLength * 60 - secondsLeft) / 60)
                      : Math.floor(elapsedStopwatchSecs / 60);
                  const liveStartHour = Math.max(0, liveHour - activeRunMins / 60);
                  const liveStartX = (liveStartHour / 24) * svgW;
                  const livePeakY =
                    baselineY - Math.min(1, activeRunMins / maxMins) * usableH;

                  if (
                    rawPts.length === 0 ||
                    liveStartX - rawPts[rawPts.length - 1].x > 4
                  ) {
                    rawPts.push({ x: liveStartX, y: baselineY, isPeak: false });
                  }
                  rawPts.push({
                    x: liveX,
                    y: livePeakY,
                    isPeak: true,
                    isLivePoint: true,
                    mins: activeRunMins,
                    title: currentActiveTask?.title || 'Active Focus',
                    id: 'live-active-node',
                  });
                }

                const plottedNodes = rawPts.map((pt, i) => {
                  const prevY = i > 0 ? rawPts[i - 1].y : baselineY;
                  const isRising = pt.y < prevY - 1;
                  const isFalling = pt.y > prevY + 1;
                  const segColor = isRising
                    ? '#22c55e'
                    : isFalling
                    ? '#ef5350'
                    : '#3b82f6';
                  return { ...pt, segColor };
                });

                const firstX = plottedNodes.length > 0 ? plottedNodes[0].x : 0;
                const lastX =
                  plottedNodes.length > 0
                    ? plottedNodes[plottedNodes.length - 1].x
                    : isToday
                    ? liveX
                    : svgW;

                const areaPoints =
                  plottedNodes.length > 0
                    ? `${firstX},${baselineY} ` +
                      plottedNodes.map((p) => `${p.x},${p.y}`).join(' ') +
                      ` ${lastX},${baselineY}`
                    : '';

                const timelineSlots = Array.from({ length: 13 }, (_, i) => i * 2);
                const estFmt = formatHoursMins(workspaceStats.estimatedMins);
                const elapFmt = formatHoursMins(workspaceStats.elapsedMins);

                return (
                  <div className="rounded-2xl bg-[#18181b] border border-[#242429] p-4 sm:p-5 space-y-4">
                    <div className="space-y-1.5">
                      <svg
                        viewBox={`0 0 ${svgW} ${svgH}`}
                        className="w-full h-36 sm:h-40 overflow-visible"
                      >
                        <defs>
                          <linearGradient id="todayTrendArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.24" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {[36, 82].map((gy) => (
                          <line
                            key={gy}
                            x1="0"
                            y1={gy}
                            x2={svgW}
                            y2={gy}
                            stroke="#26262b"
                            strokeDasharray="4 5"
                            strokeWidth="1"
                          />
                        ))}

                        <line
                          x1="0"
                          y1={baselineY}
                          x2={svgW}
                          y2={baselineY}
                          stroke="#2b2b32"
                          strokeWidth="1.2"
                        />

                        {plottedNodes.length === 0 ? (
                          <line
                            x1="0"
                            y1={baselineY}
                            x2={isToday ? liveX : svgW}
                            y2={baselineY}
                            stroke="#3b82f6"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                          />
                        ) : (
                          <>
                            <polygon points={areaPoints} fill="url(#todayTrendArea)" />
                            {firstX > 0 && (
                              <line
                                x1="0"
                                y1={baselineY}
                                x2={firstX}
                                y2={baselineY}
                                stroke="#3b82f6"
                                strokeWidth="2.8"
                                strokeLinecap="round"
                              />
                            )}
                            {plottedNodes.map((pt, idx) => {
                              if (idx === 0) return null;
                              const prev = plottedNodes[idx - 1];
                              return (
                                <line
                                  key={`seg-${idx}`}
                                  x1={prev.x}
                                  y1={prev.y}
                                  x2={pt.x}
                                  y2={pt.y}
                                  stroke={pt.segColor}
                                  strokeWidth="2.8"
                                  strokeLinecap="round"
                                />
                              );
                            })}
                            {isToday ? (
                              liveX > lastX && (
                                <line
                                  x1={lastX}
                                  y1={baselineY}
                                  x2={liveX}
                                  y2={baselineY}
                                  stroke="#3b82f6"
                                  strokeWidth="2.8"
                                  strokeLinecap="round"
                                />
                              )
                            ) : (
                              lastX < svgW && (
                                <line
                                  x1={lastX}
                                  y1={baselineY}
                                  x2={svgW}
                                  y2={baselineY}
                                  stroke="#3b82f6"
                                  strokeWidth="2.8"
                                  strokeLinecap="round"
                                />
                              )
                            )}
                          </>
                        )}

                        {isToday && (
                          <g>
                            <line
                              x1={liveX}
                              y1={16}
                              x2={liveX}
                              y2={baselineY}
                              stroke="#ffffff"
                              strokeDasharray="3 3"
                              strokeWidth="1.6"
                            />
                            <circle cx={liveX} cy={14} r="3.5" fill="#ffffff" />
                            <text
                              x={liveX > svgW - 110 ? liveX - 8 : liveX + 8}
                              y={11}
                              textAnchor={liveX > svgW - 110 ? 'end' : 'start'}
                              fill="#ffffff"
                              fontSize="10.5"
                              fontWeight="600"
                            >
                              LIVE {liveTimeText}
                            </text>
                          </g>
                        )}

                        {plottedNodes
                          .filter((p) => p.isPeak)
                          .map((pt) => (
                            <g key={pt.id}>
                              <title>{`${pt.title}: ${formatHoursMins(pt.mins).text}`}</title>
                              <text
                                x={pt.x}
                                y={pt.y - 10}
                                textAnchor="middle"
                                fill={pt.isLivePoint ? '#ffffff' : pt.segColor}
                                fontSize="11"
                                fontWeight="600"
                              >
                                {pt.isLivePoint
                                  ? `+${pt.mins}m`
                                  : formatHoursMins(pt.mins).text}
                              </text>
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r="4.5"
                                fill="#18181b"
                                stroke={pt.isLivePoint ? '#ffffff' : pt.segColor}
                                strokeWidth="2.6"
                              />
                            </g>
                          ))}
                      </svg>

                      <div className="relative h-3 rounded-full bg-[#242429] overflow-hidden">
                        {plottedSessions.map((s) => {
                          const leftPct = Math.min(97, Math.max(0, (s.startHour / 24) * 100));
                          const widthPct = Math.max(
                            1.4,
                            ((s.durationMins / 60) / 24) * 100
                          );
                          const proj = projects.find((p) => p.id === s.projectId);
                          return (
                            <div
                              key={s.id}
                              title={`${s.taskTitle} (${formatHoursMins(s.durationMins).text})`}
                              className="absolute top-0 bottom-0"
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                                backgroundColor: proj ? proj.color : '#3b82f6',
                              }}
                            />
                          );
                        })}
                        {isToday && (
                          <div
                            title={`Live Time: ${liveTimeText}`}
                            className="absolute top-0 bottom-0 w-0.5 bg-white shadow"
                            style={{
                              left: `${Math.min(99.5, Math.max(0, (liveHour / 24) * 100))}%`,
                            }}
                          />
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5 tabular-nums">
                        {timelineSlots.map((hr) => (
                          <span key={hr}>{`${String(hr).padStart(2, '0')}:00`}</span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-[#26262c] pt-4 grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#26262c] text-center">
                      <div className="py-1 px-2">
                        <div className="flex items-baseline justify-center gap-0.5 text-[#ef5350]">
                          <span className="text-2xl sm:text-3xl font-light">{estFmt.h}</span>
                          <span className="text-xs text-gray-400">h</span>
                          <span className="text-2xl sm:text-3xl font-light ml-1">
                            {estFmt.m}
                          </span>
                          <span className="text-xs text-gray-400">m</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Estimated Time</div>
                      </div>

                      <div className="py-1 px-2">
                        <div className="text-2xl sm:text-3xl font-light text-[#ef5350]">
                          {workspaceStats.toCompleteCount}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Tasks to be Completed</div>
                      </div>

                      <div className="py-1 px-2">
                        <div className="flex items-baseline justify-center gap-0.5 text-[#ef5350]">
                          <span className="text-2xl sm:text-3xl font-light">{elapFmt.h}</span>
                          <span className="text-xs text-gray-400">h</span>
                          <span className="text-2xl sm:text-3xl font-light ml-1">
                            {elapFmt.m}
                          </span>
                          <span className="text-xs text-gray-400">m</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Elapsed Time</div>
                      </div>

                      <div className="py-1 px-2">
                        <div className="text-2xl sm:text-3xl font-light text-[#ef5350]">
                          {workspaceStats.completedCount}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Completed Tasks</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* ALL OTHER TABS: COMPACT HORIZONTAL 4-COLUMN KPI SUMMARY CARD */}
            {((activeFilter !== 'today' && !activeFilter.startsWith('proj-')) || Boolean(searchQuery.trim())) &&
              (() => {
                const estFmt = formatHoursMins(workspaceStats.estimatedMins);
                const elapFmt = formatHoursMins(workspaceStats.elapsedMins);
                return (
                  <div className="rounded-2xl bg-[#18181b] border border-[#242429] p-4 sm:p-5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#26262c] text-center">
                      <div className="py-1 px-2">
                        <div className="flex items-baseline justify-center gap-0.5 text-[#ef5350]">
                          <span className="text-2xl sm:text-3xl font-light">{estFmt.h}</span>
                          <span className="text-xs text-gray-400">h</span>
                          <span className="text-2xl sm:text-3xl font-light ml-1">
                            {estFmt.m}
                          </span>
                          <span className="text-xs text-gray-400">m</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Estimated Time</div>
                      </div>

                      <div className="py-1 px-2">
                        <div className="text-2xl sm:text-3xl font-light text-[#ef5350]">
                          {workspaceStats.toCompleteCount}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Tasks to be Completed</div>
                      </div>

                      <div className="py-1 px-2">
                        <div className="flex items-baseline justify-center gap-0.5 text-[#ef5350]">
                          <span className="text-2xl sm:text-3xl font-light">{elapFmt.h}</span>
                          <span className="text-xs text-gray-400">h</span>
                          <span className="text-2xl sm:text-3xl font-light ml-1">
                            {elapFmt.m}
                          </span>
                          <span className="text-xs text-gray-400">m</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Elapsed Time</div>
                      </div>

                      <div className="py-1 px-2">
                        <div className="text-2xl sm:text-3xl font-light text-[#ef5350]">
                          {workspaceStats.completedCount}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Completed Tasks</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

            {/* INDEPENDENT ADD TASK BAR (Available in All Tabs Except Completed & Past Read-Only Dates) */}
            {activeFilter !== 'completed' && !isHistoricalReadOnly && (
              <div className="relative">
                <form
                  onSubmit={handleAddTask}
                  className="rounded-xl bg-[#18181b] border border-[#28282f] focus-within:border-[#ef5350]/60 px-4 py-2.5 flex flex-wrap items-center gap-3 transition"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (newTaskTitle.trim()) {
                        handleAddTask();
                      } else if (activeFilter.startsWith('proj-')) {
                        const curProj = projects.find((p) => p.id === activeFilter);
                        if (curProj) {
                          setProjectStatusConfirm({
                            id: curProj.id,
                            name: curProj.name,
                            nextInactive: !curProj.inactive,
                          });
                        }
                      } else {
                        showToast('Type a task title or click + in a project to toggle status');
                      }
                    }}
                    title={
                      newTaskTitle.trim()
                        ? 'Add Task'
                        : activeFilter.startsWith('proj-')
                        ? 'Activate / Inactivate Project'
                        : 'Add Task'
                    }
                    className="p-1 rounded-lg text-gray-400 hover:text-[#ef5350] hover:bg-white/5 transition shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder={
                      isTomorrowTab
                        ? `Plan a task in "Tomorrow", press 「Enter」 to save`
                        : isPlannedTab
                        ? `Plan a task in "Planned", press 「Enter」 to save`
                        : `Add a task to "${activeViewMeta.title}", press 「Enter」 to save`
                    }
                    className="flex-1 min-w-[160px] bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none"
                  />

                  {/* Project Selector (Available in All Non-Project Tabs except Completed, with None + Add Project) */}
                  {!activeFilter.startsWith('proj-') && (
                    <select
                      value={newTaskProjectId || 'none'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__add_project__') {
                          setAssignNewProjectToTask(true);
                          setNewProjectParentId(null);
                          setNewProjectName('');
                          setIsAddProjectOpen(true);
                        } else {
                          setNewTaskProjectId(val === 'none' ? '' : val);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#222227] border border-[#32323a] text-xs text-gray-200 focus:outline-none focus:border-[#ef5350]"
                    >
                      <option value="none">None</option>
                      {projects
                        .filter((p) => !p.archived)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      <option value="__add_project__">+ Add Project</option>
                    </select>
                  )}

                  {/* Pomodoro Estimation Tomatoes (1 - 5) */}
                  <div className="flex items-center gap-1 pr-2 border-r border-[#2a2a32]">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setNewTaskPomodoros(num)}
                        title={`${num} Pomodoro${num > 1 ? 's' : ''}`}
                        className="p-0.5 hover:scale-110 transition"
                      >
                        <TomatoIcon filled={num <= newTaskPomodoros} size={13} />
                      </button>
                    ))}
                  </div>

                  {/* Tab-Specific Date / Clock / Week Controls */}
                  {isTomorrowTab ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewTaskDue('calendar');
                        setNewTaskCustomDate(tomorrowTargetDateStr);
                        setTaskbarPopoverMode((prev) =>
                          prev === 'todayClock' ? null : 'todayClock'
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#ef5350]/15 border border-[#ef5350]/45 text-xs text-[#ef5350] font-medium flex items-center gap-1.5 transition"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {newTaskReminderTime
                          ? `Tomorrow • ${newTaskReminderTime}`
                          : 'Tomorrow'}
                      </span>
                    </button>
                  ) : isWeekTab ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTaskbarPopoverMode((prev) =>
                          prev === 'thisWeek' ? null : 'thisWeek'
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#222227] hover:bg-[#2b2b32] border border-[#32323a] text-xs text-gray-200 flex items-center gap-1.5 transition"
                    >
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>
                        {newTaskDue === 'week' && newTaskCustomDate
                          ? new Date(`${newTaskCustomDate}T00:00:00`).toLocaleDateString(
                              'en-US',
                              { day: 'numeric', weekday: 'long' }
                            )
                          : 'This Week'}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {/* Today Clock Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewTaskDue('today');
                          setNewTaskCustomDate(todayStr);
                          setTaskbarPopoverMode((prev) =>
                            prev === 'todayClock' ? null : 'todayClock'
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition ${
                          newTaskDue === 'today'
                            ? 'bg-[#ef5350]/15 border-[#ef5350]/45 text-[#ef5350] font-medium'
                            : 'bg-[#222227] border-[#32323a] text-gray-300 hover:text-white'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {newTaskDue === 'today' && newTaskReminderTime
                            ? `Today • ${newTaskReminderTime}`
                            : 'Today'}
                        </span>
                      </button>

                      {/* This Week Selector Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskbarPopoverMode((prev) =>
                            prev === 'thisWeek' ? null : 'thisWeek'
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition ${
                          newTaskDue === 'week'
                            ? 'bg-purple-500/15 border-purple-500/45 text-purple-300 font-medium'
                            : 'bg-[#222227] border-[#32323a] text-gray-300 hover:text-white'
                        }`}
                      >
                        <span>
                          {newTaskDue === 'week' && newTaskCustomDate
                            ? new Date(`${newTaskCustomDate}T00:00:00`).toLocaleDateString(
                                'en-US',
                                { day: 'numeric', weekday: 'long' }
                              )
                            : 'This Week'}
                        </span>
                      </button>

                      {/* No Date / Calendar Picker Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskbarPopoverMode((prev) =>
                            prev === 'calendar' ? null : 'calendar'
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1.5 transition ${
                          newTaskDue === 'calendar'
                            ? 'bg-blue-500/15 border-blue-500/45 text-blue-300 font-medium'
                            : 'bg-[#222227] border-[#32323a] text-gray-300 hover:text-white'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {newTaskDue === 'calendar' && newTaskCustomDate
                            ? newTaskCustomDate
                            : 'No Date'}
                        </span>
                      </button>
                    </div>
                  )}
                </form>

                {/* POPOVER 1: TODAY / TOMORROW CLOCK TIME, REMINDER & ALARM */}
                {taskbarPopoverMode === 'todayClock' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#1e1e23] border border-[#34343e] p-4 shadow-2xl z-40 space-y-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#ef5350]" />
                        {isTomorrowTab ? 'Tomorrow Time & Alarm' : 'Today Time & Alarm'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTaskbarPopoverMode(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300">Reminder Time</span>
                      <input
                        type="time"
                        value={newTaskReminderTime || '12:00'}
                        onChange={(e) => {
                          setNewTaskReminderTime(e.target.value);
                          if (newTaskReminderType === 'none') {
                            setNewTaskReminderType('notification');
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#141418] border border-[#34343e] text-xs text-white focus:outline-none focus:border-[#ef5350]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300">Trigger Sound Alarm</span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextAlarm = !newTaskReminderAlarm;
                          setNewTaskReminderAlarm(nextAlarm);
                          setNewTaskReminderType(nextAlarm ? 'alarm' : 'notification');
                        }}
                        className={`w-10 h-5 rounded-full p-0.5 transition ${
                          newTaskReminderAlarm ? 'bg-[#ef5350]' : 'bg-[#34343e]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform ${
                            newTaskReminderAlarm ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setNewTaskReminderTime('');
                          setNewTaskReminderType('none');
                          setTaskbarPopoverMode(null);
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-[#282830] text-xs text-gray-300 hover:text-white"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newTaskReminderTime) setNewTaskReminderTime('12:00');
                          if (newTaskReminderType === 'none') {
                            setNewTaskReminderType(
                              newTaskReminderAlarm ? 'alarm' : 'notification'
                            );
                          }
                          setTaskbarPopoverMode(null);
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-[#ef5350] text-xs font-semibold text-white"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                )}

                {/* POPOVER 2: CURRENT WEEK DAY SELECTOR (Month Header + "20 Friday" without Year) */}
                {taskbarPopoverMode === 'thisWeek' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#1e1e23] border border-[#34343e] overflow-hidden shadow-2xl z-40"
                  >
                    <div className="px-4 py-2.5 border-b border-[#2c2c35] text-center text-xs font-semibold text-white">
                      {new Date().toLocaleDateString('en-US', { month: 'long' })}
                    </div>
                    <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                      {Array.from({ length: 7 }, (_, idx) => {
                        const d = new Date();
                        d.setDate(d.getDate() + idx);
                        const ymd = `${d.getFullYear()}-${String(
                          d.getMonth() + 1
                        ).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        const dayLabel = `${d.getDate()} ${d.toLocaleDateString('en-US', {
                          weekday: 'long',
                        })}`;
                        const isSelected =
                          newTaskDue === 'week' && newTaskCustomDate === ymd;
                        return (
                          <button
                            key={ymd}
                            type="button"
                            onClick={() => {
                              setNewTaskDue('week');
                              setNewTaskCustomDate(ymd);
                              setTaskbarPopoverMode(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                              isSelected
                                ? 'bg-[#ef5350] text-white font-semibold'
                                : 'text-gray-200 hover:bg-white/10'
                            }`}
                          >
                            <span>{dayLabel}</span>
                            {idx === 0 && (
                              <span
                                className={`text-[10px] ${
                                  isSelected ? 'text-white/90' : 'text-[#ef5350]'
                                }`}
                              >
                                Today
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* POPOVER 3: FULL CALENDAR PICKER ("No Date") */}
                {taskbarPopoverMode === 'calendar' && (() => {
                  const monthFull = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December',
                  ];
                  const firstDow = new Date(plannerCalYear, plannerCalMonth, 1).getDay();
                  const daysInM = new Date(plannerCalYear, plannerCalMonth + 1, 0).getDate();
                  const cells = [];
                  for (let i = 0; i < firstDow; i++) cells.push(null);
                  for (let d = 1; d <= daysInM; d++) {
                    cells.push(
                      `${plannerCalYear}-${String(plannerCalMonth + 1).padStart(2, '0')}-${String(
                        d
                      ).padStart(2, '0')}`
                    );
                  }
                  return (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#1e1e23] border border-[#34343e] p-4 shadow-2xl z-40 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            plannerCalMonth === 0
                              ? (setPlannerCalYear((y) => y - 1), setPlannerCalMonth(11))
                              : setPlannerCalMonth((m) => m - 1)
                          }
                          className="p-1 rounded hover:bg-white/10 text-gray-300"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold text-white">
                          {monthFull[plannerCalMonth]} {plannerCalYear}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            plannerCalMonth === 11
                              ? (setPlannerCalYear((y) => y + 1), setPlannerCalMonth(0))
                              : setPlannerCalMonth((m) => m + 1)
                          }
                          className="p-1 rounded hover:bg-white/10 text-gray-300"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 text-center text-[10px] text-gray-500">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                          <div key={d}>{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        {cells.map((ymd, idx) =>
                          !ymd ? (
                            <div key={`empty-${idx}`} />
                          ) : (
                            <button
                              key={ymd}
                              type="button"
                              onClick={() => {
                                setNewTaskDue('calendar');
                                setNewTaskCustomDate(ymd);
                                setTaskbarPopoverMode(null);
                              }}
                              className={`w-7 h-7 rounded-full mx-auto flex items-center justify-center transition ${
                                newTaskDue === 'calendar' && newTaskCustomDate === ymd
                                  ? 'bg-[#ef5350] text-white font-bold'
                                  : ymd === todayStr
                                  ? 'text-[#ef5350] font-semibold hover:bg-white/10'
                                  : 'text-gray-200 hover:bg-white/10'
                              }`}
                            >
                              {Number(ymd.split('-')[2])}
                            </button>
                          )
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#2c2c35]">
                        <button
                          type="button"
                          onClick={() => {
                            setNewTaskDue('none');
                            setNewTaskCustomDate('');
                            setTaskbarPopoverMode(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-[#282830] text-xs text-gray-300 hover:text-white"
                        >
                          No Date
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskbarPopoverMode(null)}
                          className="px-4 py-1 rounded-lg bg-[#ef5350] text-xs font-semibold text-white"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* ACTIVE TASK LIST */}
            <div className="space-y-2">
              {activeTasks.map((task) => {
                const proj = task.projectId
                  ? projects.find((p) => p.id === task.projectId)
                  : null;
                const canOpenTaskDetail =
                  activeFilter === 'today' || activeFilter.startsWith('proj-');
                return (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (canOpenTaskDetail) {
                        setOpenedTaskDetailId(task.id);
                      }
                    }}
                    className={`relative group rounded-xl bg-[#18181b] hover:bg-[#1e1e23] border border-[#24242a] px-4 py-3 flex items-center justify-between gap-3 transition ${
                      canOpenTaskDetail ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleTaskComplete(task.id);
                        }}
                        className="w-4 h-4 rounded-full border border-gray-500 hover:border-[#ef5350] flex items-center justify-center shrink-0 transition"
                      />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunchFocusForTask(task);
                        }}
                        title="Start Pomodoro for this task"
                        className="w-5 h-5 rounded-full bg-[#ef5350]/15 text-[#ef5350] hover:bg-[#ef5350] hover:text-white flex items-center justify-center shrink-0 transition"
                      >
                        <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                      </button>

                      <div className="min-w-0 flex-1">
                        {editingTaskId === task.id ? (
                          <input
                            type="text"
                            autoFocus
                            value={editingTaskTitle}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditingTaskTitle(e.target.value)}
                            onBlur={() => {
                              if (editingTaskTitle.trim()) {
                                setTasks((prev) =>
                                  prev.map((item) =>
                                    item.id === task.id
                                      ? { ...item, title: editingTaskTitle.trim() }
                                      : item
                                  )
                                );
                              }
                              setEditingTaskId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.currentTarget.blur();
                            }}
                            className="w-full bg-[#121215] border border-[#ef5350] rounded px-2 py-0.5 text-xs sm:text-sm text-white focus:outline-none"
                          />
                        ) : (
                          <div
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingTaskId(task.id);
                              setEditingTaskTitle(task.title);
                            }}
                            className="text-xs sm:text-sm text-gray-100 truncate"
                          >
                            {task.title}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {Array.from({
                            length: Math.max(
                              1,
                              Math.min(8, Math.max(task.estPomodoros, task.completedPomodoros))
                            ),
                          }).map((_, idx) => (
                            <TomatoIcon
                              key={idx}
                              filled={idx < task.completedPomodoros}
                              size={10}
                            />
                          ))}
                          {proj && (
                            <span
                              className="text-[10px] font-medium flex items-center gap-1"
                              style={{ color: proj.color }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: proj.color }}
                              />
                              {proj.name}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-[10px] text-gray-500">
                              {task.dueDate === todayStr ? 'Today' : task.dueDate}
                            </span>
                          )}
                          {task.reminderTime && (
                            <span className="text-[10px] text-[#ef5350] flex items-center gap-0.5">
                              <Bell className="w-2.5 h-2.5" />
                              {task.reminderTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Task Right Actions: Three-Dot Menu, Archive Button, Delete Button */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTaskMenuId((prev) => (prev === task.id ? null : task.id));
                        }}
                        title="Task Options"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveTask(task);
                        }}
                        title="Archive Task"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-white/5 transition"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        title="Delete Task"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-500 hover:text-[#ef5350] hover:bg-white/5 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Created Task Three-Dot Popup Menu */}
                    {taskMenuId === task.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-3 top-11 w-44 rounded-xl bg-[#242429] border border-[#36363f] shadow-2xl py-1.5 z-50 text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setTaskMenuId(null);
                            handleLaunchFocusForTask(task);
                          }}
                          className="w-full text-left px-3.5 py-2 text-gray-200 hover:bg-white/10 transition"
                        >
                          Start Focus
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTaskMenuId(null);
                            setEditingTaskId(task.id);
                            setEditingTaskTitle(task.title);
                          }}
                          className="w-full text-left px-3.5 py-2 text-gray-200 hover:bg-white/10 transition"
                        >
                          Edit Task
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTaskMenuId(null);
                            handleToggleTaskComplete(task.id);
                          }}
                          className="w-full text-left px-3.5 py-2 text-gray-200 hover:bg-white/10 transition"
                        >
                          Complete
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchiveTask(task)}
                          className="w-full text-left px-3.5 py-2 text-gray-200 hover:bg-white/10 transition"
                        >
                          Archive Task
                        </button>
                        <div className="my-1 border-t border-[#32323a]" />
                        <button
                          type="button"
                          onClick={() => {
                            setTaskMenuId(null);
                            handleDeleteTask(task.id);
                          }}
                          className="w-full text-left px-3.5 py-2 text-[#ef5350] hover:bg-white/10 transition"
                        >
                          Delete Task
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {activeTasks.length === 0 && (
                <div className="text-center py-10 text-xs text-gray-500">
                  No pending tasks in this view.
                </div>
              )}
            </div>

            {/* COMPLETED TASKS ACCORDION */}
            {completedTasks.length > 0 && (
              <div className="pt-2">
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowCompleted((prev) => !prev)}
                    className="px-4 py-1.5 rounded-full bg-[#1e1e23] hover:bg-[#26262e] border border-[#2d2d36] text-xs text-gray-300 flex items-center gap-1.5 transition"
                  >
                    <span>
                      {showCompleted
                        ? `Hide Completed Tasks (${completedTasks.length})`
                        : `Show Completed Tasks (${completedTasks.length})`}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        showCompleted ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                </div>

                {(showCompleted || activeFilter === 'completed') && (
                  <div className="mt-3 space-y-2">
                    {completedTasks.map((task) => {
                      const proj = task.projectId
                        ? projects.find((p) => p.id === task.projectId)
                        : null;
                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            if (
                              activeFilter === 'today' ||
                              activeFilter.startsWith('proj-')
                            ) {
                              setOpenedTaskDetailId(task.id);
                            }
                          }}
                          className="group rounded-xl bg-[#161619] border border-[#222228] px-4 py-2.5 flex items-center justify-between gap-3 opacity-75 hover:opacity-100 cursor-pointer transition"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleTaskComplete(task.id);
                              }}
                              className="w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0"
                            >
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </button>
                            <span className="text-xs sm:text-sm text-gray-400 line-through truncate">
                              {task.title}
                            </span>
                            {proj && (
                              <span
                                className="text-[10px] font-medium shrink-0"
                                style={{ color: proj.color }}
                              >
                                {proj.name}
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-[#ef5350]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Floating Bottom Mini-Player Pill */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
            <div
              onClick={() => setActiveView('focus')}
              className="flex items-center gap-3.5 px-4 py-2 rounded-2xl bg-[#1b1b20]/95 backdrop-blur-md border border-[#2e2e36] shadow-2xl cursor-pointer hover:border-[#42424d] transition"
            >
              <div className="w-8 h-8 rounded-full border-2 border-[#ef5350] flex items-center justify-center text-[11px] font-semibold text-white">
                {timerMode === 'countdown'
                  ? Math.ceil(secondsLeft / 60)
                  : Math.floor(elapsedStopwatchSecs / 60)}
              </div>
              <span className="text-xs sm:text-sm text-gray-200 max-w-[160px] sm:max-w-[220px] truncate">
                {currentActiveTask?.title || 'Focus Session'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (timerStatus === 'running') {
                    setTimerStatus('paused');
                  } else {
                    soundEngine.init();
                    setTimerStatus('running');
                  }
                }}
                className="w-8 h-8 rounded-full border border-white/25 hover:border-white flex items-center justify-center text-white transition"
              >
                {timerStatus === 'running' ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                )}
              </button>
            </div>
          </div>
            </>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODALS: ADD PROJECT / EDIT PROJECT / DELETE PROJECT / TAG / FOLDER   */}
      {/* ==================================================================== */}
      {(isAddProjectOpen || editingProject) && (
        <div
          onClick={() => {
            setIsAddProjectOpen(false);
            setNewProjectParentId(null);
            setAssignNewProjectToTask(false);
            setEditingProject(null);
          }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={editingProject ? handleSaveEditProject : handleAddProject}
            className="w-full max-w-sm rounded-2xl bg-[#222227] border border-[#34343c] p-6 space-y-5 shadow-2xl"
          >
            <div className="text-center">
              <h3 className="text-base font-semibold text-white">
                {editingProject
                  ? 'Edit Project'
                  : newProjectParentId
                  ? 'Add Sub-Project'
                  : 'Add Project'}
              </h3>
              {!editingProject && newProjectParentId && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Under:{' '}
                  <span className="text-[#ef5350] font-medium">
                    {projects.find((p) => p.id === newProjectParentId)?.name || 'Project'}
                  </span>
                </p>
              )}
            </div>
            <input
              type="text"
              autoFocus
              value={editingProject ? editingProject.name : newProjectName}
              onChange={(e) =>
                editingProject
                  ? setEditingProject({ ...editingProject, name: e.target.value })
                  : setNewProjectName(e.target.value)
              }
              placeholder={newProjectParentId ? 'Sub-Project Name' : 'Project Name'}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#2a2a30] border border-[#3c3c46] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ef5350]"
            />
            <div className="grid grid-cols-10 gap-2">
              {PROJECT_PALETTE.map((c) => {
                const selectedColor = editingProject ? editingProject.color : newProjectColor;
                const isSelected = selectedColor.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      editingProject
                        ? setEditingProject({ ...editingProject, color: c })
                        : setNewProjectColor(c)
                    }
                    className="w-6 h-6 rounded-full flex items-center justify-center transition transform hover:scale-110"
                    style={{ backgroundColor: c }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#18181b] stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* Project Reminder Time Trigger (Clean Clock Button without --:-- --) */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#ef5350]" />
                Reminder Time
              </span>
              <button
                type="button"
                onClick={() => {
                  const ctx = editingProject ? 'editProject' : 'addProject';
                  setReminderModalContext(ctx);
                  const currentVal = editingProject
                    ? editingProject.reminderTime
                    : newProjectReminderTime;
                  if (currentVal && currentVal.includes(':')) {
                    const [hh, mm] = currentVal.split(':');
                    setTempReminderHour(hh);
                    setTempReminderMinute(mm);
                  } else {
                    setTempReminderHour('12');
                    setTempReminderMinute('00');
                  }
                  setIsReminderModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#2a2a32] border border-[#34343c] text-xs text-white flex items-center gap-2 transition"
              >
                {(() => {
                  const activeTime = editingProject
                    ? editingProject.reminderTime
                    : newProjectReminderTime;
                  const activeType = editingProject
                    ? editingProject.reminderType
                    : newProjectReminderType;
                  return activeTime && activeType !== 'none' ? (
                    <span>{activeTime}</span>
                  ) : null;
                })()}
                <Clock className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddProjectOpen(false);
                  setNewProjectParentId(null);
                  setAssignNewProjectToTask(false);
                  setEditingProject(null);
                }}
                className="px-5 py-2 rounded-lg bg-[#2a2a30] hover:bg-[#34343c] text-xs font-medium text-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-[#ef5350] hover:bg-[#e53935] text-xs font-medium text-white transition"
              >
                OK
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================================== */}
      {/* CUSTOM "NEW REMINDER" MODAL + DIGITAL HOUR:MINUTE PICKER             */}
      {/* ==================================================================== */}
      {isReminderModalOpen && (
        <div
          onClick={() => setIsReminderModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl bg-[#18181b] border border-[#2e2e36] overflow-hidden shadow-2xl"
          >
            <div className="pt-5 pb-4 px-5 text-center border-b border-[#25252b]">
              <h3 className="text-xs font-medium text-gray-400 mb-2">New reminder</h3>
              <button
                type="button"
                onClick={() => setIsTimeClockPickerOpen(true)}
                className="inline-flex flex-col items-center group"
              >
                <span className="text-3xl font-bold text-white tracking-wider group-hover:text-[#ef5350] transition tabular-nums">
                  {`${tempReminderHour.padStart(2, '0')}:${tempReminderMinute.padStart(2, '0')}`}
                </span>
                <span className="text-[11px] text-[#ef5350] mt-0.5">Reminder time</span>
              </button>
            </div>

            <div className="p-4 border-b border-[#25252b] space-y-2.5">
              <div className="text-[11px] font-medium text-[#ef5350]">Reminder type</div>
              <div className="grid grid-cols-3 rounded-xl bg-[#222227] p-1">
                {[
                  { id: 'none', label: "Don't remind", icon: Bell },
                  { id: 'notification', label: 'Notification', icon: Bell },
                  { id: 'alarm', label: 'Alarm', icon: Clock },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = newTaskReminderType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNewTaskReminderType(item.id)}
                      className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 text-[10px] font-medium transition ${
                        active
                          ? 'bg-[#3b2328] text-[#ef5350]'
                          : 'text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 space-y-2.5">
              <div className="text-[11px] font-medium text-[#ef5350]">Reminder schedule</div>
              {[
                { id: 'always', label: 'Always enabled' },
                { id: 'weekdays', label: 'Specific days of the week' },
                { id: 'daysBefore', label: 'Days before' },
              ].map((opt) => {
                const selected = newTaskReminderSchedule === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNewTaskReminderSchedule(opt.id)}
                    className="w-full flex items-center gap-2.5 py-1 text-left text-xs text-gray-200 hover:text-white transition"
                  >
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        selected ? 'border-[#ef5350]' : 'border-gray-500'
                      }`}
                    >
                      {selected && <span className="w-2 h-2 rounded-full bg-[#ef5350]" />}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 border-t border-[#25252b] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(false)}
                className="py-3 text-center text-gray-300 hover:bg-white/5 border-r border-[#25252b] transition"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  const formatted = `${tempReminderHour.padStart(2, '0')}:${tempReminderMinute.padStart(2, '0')}`;
                  const effectiveType =
                    newTaskReminderType === 'none' ? 'notification' : newTaskReminderType;
                  if (reminderModalContext === 'addProject') {
                    setNewProjectReminderTime(formatted);
                    setNewProjectReminderType(effectiveType);
                  } else if (reminderModalContext === 'editProject' && editingProject) {
                    setEditingProject({
                      ...editingProject,
                      reminderTime: formatted,
                      reminderType: effectiveType,
                    });
                  } else {
                    setNewTaskReminderTime(formatted);
                    setNewTaskReminderType(effectiveType);
                    setNewTaskReminderAlarm(effectiveType === 'alarm');
                  }
                  setIsReminderModalOpen(false);
                  showToast(`Reminder set for ${formatted}`);
                }}
                className="py-3 text-center text-[#ef5350] hover:bg-white/5 transition"
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL HOUR : MINUTE PICKER MODAL */}
      {isTimeClockPickerOpen && (
        <div
          onClick={() => setIsTimeClockPickerOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[260px] rounded-2xl bg-[#1c1c20] border border-[#32323a] p-5 shadow-2xl space-y-4"
          >
            <div className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
              REMINDER TIME
            </div>

            <div className="flex items-center justify-center gap-2">
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={tempReminderHour}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(23, Number(e.target.value) || 0));
                    setTempReminderHour(String(v).padStart(2, '0'));
                  }}
                  className="w-20 h-16 rounded-xl bg-[#3b2328] border-2 border-[#ef5350] text-center text-3xl font-semibold text-white focus:outline-none tabular-nums"
                />
                <span className="text-[10px] text-gray-400 mt-1">Hour</span>
              </div>

              <span className="text-3xl font-bold text-gray-300 pb-4">:</span>

              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={tempReminderMinute}
                  onChange={(e) => {
                    const v = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                    setTempReminderMinute(String(v).padStart(2, '0'));
                  }}
                  className="w-20 h-16 rounded-xl bg-[#27272d] border border-[#383842] text-center text-3xl font-semibold text-gray-200 focus:outline-none focus:border-[#ef5350] tabular-nums"
                />
                <span className="text-[10px] text-gray-400 mt-1">Minute</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5 pt-1">
              {['06:00', '09:00', '12:00', '17:00', '20:00'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    const [hh, mm] = preset.split(':');
                    setTempReminderHour(hh);
                    setTempReminderMinute(mm);
                  }}
                  className="px-2 py-0.5 rounded bg-[#26262c] hover:bg-[#32323a] text-[10px] text-gray-300"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <div className="flex items-center gap-4 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setIsTimeClockPickerOpen(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setIsTimeClockPickerOpen(false)}
                  className="text-[#ef5350] hover:text-[#f87171] transition"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT ACTIVATE / INACTIVATE CONFIRMATION MODAL */}
      {projectStatusConfirm && (
        <div
          onClick={() => setProjectStatusConfirm(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#222227] border border-[#34343c] p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-semibold text-white">
              {projectStatusConfirm.nextInactive
                ? 'Inactivate Project?'
                : 'Activate Project?'}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {projectStatusConfirm.nextInactive
                ? `Do you want to inactivate "${projectStatusConfirm.name}"? It will remain visible in your Project menu unless you delete or archive it.`
                : `Do you want to activate "${projectStatusConfirm.name}" again?`}
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setProjectStatusConfirm(null)}
                className="px-4 py-2 rounded-lg bg-[#2a2a30] text-xs text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleProjectActive}
                className="px-5 py-2 rounded-lg bg-[#ef5350] text-xs font-medium text-white hover:bg-[#e53935]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingProject && (
        <div
          onClick={() => setDeletingProject(null)}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#222227] border border-[#34343c] p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-semibold text-white">Delete Project?</h3>
            <p className="text-xs text-gray-400">
              Are you sure you want to delete{' '}
              <span className="text-white font-medium">&quot;{deletingProject.name}&quot;</span>? It will be archived in User History while preserving all statistics.
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProject(null)}
                className="px-4 py-2 rounded-lg bg-[#2a2a30] text-xs text-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProject}
                className="px-5 py-2 rounded-lg bg-[#ef5350] text-xs font-medium text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddTagOpen && (
        <div
          onClick={() => setIsAddTagOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleAddTag}
            className="w-full max-w-sm rounded-2xl bg-[#222227] border border-[#34343c] p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-center text-base font-semibold text-white">Add Tag</h3>
            <input
              type="text"
              autoFocus
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag name (e.g. Exam, Revision)"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#2a2a30] border border-[#3c3c46] text-sm text-white focus:outline-none focus:border-[#ef5350]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddTagOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#2a2a30] text-xs text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#ef5350] text-xs font-medium text-white"
              >
                OK
              </button>
            </div>
          </form>
        </div>
      )}

      {isAddFolderOpen && (
        <div
          onClick={() => setIsAddFolderOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleAddFolder}
            className="w-full max-w-sm rounded-2xl bg-[#222227] border border-[#34343c] p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-center text-base font-semibold text-white">Add Folder</h3>
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name (e.g. Semester 5)"
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#2a2a30] border border-[#3c3c46] text-sm text-white focus:outline-none focus:border-[#ef5350]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddFolderOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#2a2a30] text-xs text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#ef5350] text-xs font-medium text-white"
              >
                OK
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FOCUS TIME GOAL PICKER MODAL (0h - 18h Adjustable Per Date / Per Project) */}
      {isGoalModalOpen && activeView === 'workspace' && (
        <div
          onClick={() => setIsGoalModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? 1 : -1;
              setTempGoalHours((prev) => Math.max(0, Math.min(18, prev + delta)));
            }}
            className="w-72 rounded-2xl bg-[#25252b] border border-white/10 p-5 shadow-2xl"
          >
            <h4 className="text-center text-sm font-medium text-gray-100 mb-1">
              Focus Time Goal
            </h4>
            <p className="text-center text-[11px] text-gray-400 mb-3">
              {activeFilter === 'today'
                ? `Date: ${selectedWorkspaceDateStr} (Max 18h)`
                : `${activeViewMeta.title} (Max 18h)`}
            </p>

            <div className="relative rounded-xl bg-[#34343b] py-2 px-3 flex flex-col items-center justify-center select-none overflow-hidden">
              {[-2, -1, 0, 1, 2].map((offset) => {
                const val = tempGoalHours + offset;
                const isValid = val >= 0 && val <= 18;
                const isCenter = offset === 0;
                return (
                  <button
                    key={offset}
                    type="button"
                    disabled={!isValid}
                    onClick={() => isValid && setTempGoalHours(val)}
                    className={`w-full py-1.5 text-center transition rounded-lg ${
                      isCenter
                        ? 'bg-[#46464f] text-white font-semibold text-sm shadow-inner my-0.5'
                        : isValid
                        ? 'text-gray-400 hover:text-gray-200 text-xs'
                        : 'opacity-0 pointer-events-none text-xs'
                    }`}
                  >
                    {isValid ? `${val}h` : '-'}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 mt-4">
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="flex-1 py-2 rounded-lg bg-transparent hover:bg-white/5 border border-gray-600 text-xs text-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const clamped = Math.max(0, Math.min(18, tempGoalHours));
                  if (activeFilter === 'today') {
                    setDateGoals((prev) => ({
                      ...prev,
                      [selectedWorkspaceDateStr]: clamped,
                    }));
                    if (selectedWorkspaceDateStr === todayStr) {
                      setSettings((prev) => ({ ...prev, dailyGoalHours: clamped }));
                    }
                    showToast(`Goal for ${selectedWorkspaceDateStr} set to ${clamped}h`);
                  } else if (activeFilter.startsWith('proj-')) {
                    setTabGoals((prev) => ({ ...prev, [activeFilter]: clamped }));
                    showToast(`${activeViewMeta.title} Goal set to ${clamped}h`);
                  } else {
                    setSettings((prev) => ({ ...prev, dailyGoalHours: clamped }));
                    showToast(`Daily Focus Goal updated to ${clamped}h`);
                  }
                  setIsGoalModalOpen(false);
                }}
                className="flex-1 py-2 rounded-lg bg-[#ef5350] hover:bg-[#e53935] text-xs font-medium text-white transition shadow"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL'S GOAL PICKER (0h - 18h) */}
      {isGoalModalOpen && activeView === 'reports' && (
        <div
          onClick={() => setIsGoalModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? 1 : -1;
              setTempGoalHours((prev) => Math.max(0, Math.min(18, prev + delta)));
            }}
            className="w-72 rounded-2xl bg-[#25252b] border border-white/10 p-5 shadow-2xl"
          >
            <h4 className="text-center text-sm font-medium text-gray-100 mb-3">
              Focus Time Goal
            </h4>

            <div className="relative rounded-xl bg-[#34343b] py-2 px-3 flex flex-col items-center justify-center select-none overflow-hidden">
              {[-2, -1, 0, 1, 2].map((offset) => {
                const val = tempGoalHours + offset;
                const isValid = val >= 0 && val <= 18;
                const isCenter = offset === 0;
                return (
                  <button
                    key={offset}
                    type="button"
                    disabled={!isValid}
                    onClick={() => isValid && setTempGoalHours(val)}
                    className={`w-full py-1.5 text-center transition rounded-lg ${
                      isCenter
                        ? 'bg-[#46464f] text-white font-semibold text-sm shadow-inner my-0.5'
                        : isValid
                        ? 'text-gray-400 hover:text-gray-200 text-xs'
                        : 'opacity-0 pointer-events-none text-xs'
                    }`}
                  >
                    {isValid ? `${val}h` : '-'}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 mt-4">
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                className="flex-1 py-2 rounded-lg bg-transparent hover:bg-white/5 border border-gray-600 text-xs text-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const clamped = Math.max(0, Math.min(18, tempGoalHours));
                  setSettings((prev) => ({
                    ...prev,
                    dailyGoalHours: clamped,
                  }));
                  setDateGoals((prev) => ({
                    ...prev,
                    [todayStr]: clamped,
                  }));
                  setIsGoalModalOpen(false);
                  showToast(`Daily Focus Goal updated to ${clamped}h`);
                }}
                className="flex-1 py-2 rounded-lg bg-[#ef5350] hover:bg-[#e53935] text-xs font-medium text-white transition shadow"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN FOCUS TIMER VIEW */}
      {activeView === 'focus' && renderFocusView()}

      {/* STATISTICS & REPORTS VIEW */}
      {activeView === 'reports' && renderReportsView()}

      {/* SETTINGS MODAL */}
      {activeView === 'settings' && renderSettingsModal()}

      {/* USER HISTORY & CLASSIFIED ARCHIVE MODAL */}
      {isUserHistoryOpen && renderUserHistoryModal()}

      {/* TASK DETAIL, GOOGLE KEEP NOTES & PLAY HISTORY PAGE (Today & Project Tabs Only) */}
      {openedTaskDetailId && (() => {
        const detailTask = tasks.find((t) => t.id === openedTaskDetailId);
        if (!detailTask) return null;
        const detailProj = projects.find((p) => p.id === detailTask.projectId);
        const taskNotes = detailTask.notes || [];
        const taskPlaySessions = validSessions
          .filter(
            (s) =>
              s.taskId === detailTask.id ||
              s.taskTitle.toLowerCase() === detailTask.title.toLowerCase()
          )
          .sort((a, b) => b.date.localeCompare(a.date) || b.startHour - a.startHour);
        const totalTaskPlayedMins = taskPlaySessions.reduce(
          (acc, s) => acc + s.durationMins,
          0
        );
        const createdDateLabel =
          detailTask.createdAt || detailTask.dueDate || detailTask.completedDate || todayStr;

        const formatHourMinute = (hrFloat) => {
          const totalM = Math.max(0, Math.round((hrFloat || 0) * 60));
          const hh24 = Math.floor(totalM / 60) % 24;
          const mm = totalM % 60;
          const suffix = hh24 >= 12 ? 'PM' : 'AM';
          const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
          return `${String(hh12).padStart(2, '0')}:${String(mm).padStart(2, '0')} ${suffix}`;
        };

        const openNewNoteComposer = () => {
          const initialDraft = {
            id: `note-${Date.now()}`,
            title: '',
            content: '',
            bold: false,
            italic: false,
            heading: false,
            showTickBoxes: false,
            tickItems: [],
            labels: [],
            drawingUrl: '',
            archived: false,
            updatedAt: new Date().toLocaleString(),
            versions: [],
          };
          setActiveNoteEditor({
            ...initialDraft,
            undoStack: [],
            redoStack: [],
          });
          setNoteMenuOpen(false);
          setNoteFormatOpen(false);
          setNoteLabelInputOpen(false);
        };

        const openExistingNote = (noteObj) => {
          setActiveNoteEditor({
            ...noteObj,
            tickItems: noteObj.tickItems || [],
            labels: noteObj.labels || [],
            versions: noteObj.versions || [],
            undoStack: [],
            redoStack: [],
          });
          setNoteMenuOpen(false);
          setNoteFormatOpen(false);
          setNoteLabelInputOpen(false);
        };

        const pushNoteEdit = (updater) => {
          setActiveNoteEditor((prev) => {
            if (!prev) return prev;
            const snapshot = {
              title: prev.title,
              content: prev.content,
              bold: prev.bold,
              italic: prev.italic,
              heading: prev.heading,
              showTickBoxes: prev.showTickBoxes,
              tickItems: prev.tickItems,
              labels: prev.labels,
              drawingUrl: prev.drawingUrl,
            };
            const nextState = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
            return {
              ...nextState,
              undoStack: [...(prev.undoStack || []).slice(-19), snapshot],
              redoStack: [],
            };
          });
        };

        const handleUndoNote = () => {
          setActiveNoteEditor((prev) => {
            if (!prev || !prev.undoStack || prev.undoStack.length === 0) return prev;
            const last = prev.undoStack[prev.undoStack.length - 1];
            const currentSnap = {
              title: prev.title,
              content: prev.content,
              bold: prev.bold,
              italic: prev.italic,
              heading: prev.heading,
              showTickBoxes: prev.showTickBoxes,
              tickItems: prev.tickItems,
              labels: prev.labels,
              drawingUrl: prev.drawingUrl,
            };
            return {
              ...prev,
              ...last,
              undoStack: prev.undoStack.slice(0, -1),
              redoStack: [...(prev.redoStack || []), currentSnap],
            };
          });
        };

        const handleRedoNote = () => {
          setActiveNoteEditor((prev) => {
            if (!prev || !prev.redoStack || prev.redoStack.length === 0) return prev;
            const nextSnap = prev.redoStack[prev.redoStack.length - 1];
            const currentSnap = {
              title: prev.title,
              content: prev.content,
              bold: prev.bold,
              italic: prev.italic,
              heading: prev.heading,
              showTickBoxes: prev.showTickBoxes,
              tickItems: prev.tickItems,
              labels: prev.labels,
              drawingUrl: prev.drawingUrl,
            };
            return {
              ...prev,
              ...nextSnap,
              undoStack: [...(prev.undoStack || []), currentSnap],
              redoStack: prev.redoStack.slice(0, -1),
            };
          });
        };

        const handleSaveAndCloseNote = (overrideArchived = null) => {
          if (!activeNoteEditor) return;
          const hasAnyContent =
            activeNoteEditor.title.trim() ||
            activeNoteEditor.content.trim() ||
            (activeNoteEditor.tickItems || []).some((ti) => ti.text.trim()) ||
            Boolean(activeNoteEditor.drawingUrl);

          if (!hasAnyContent) {
            setActiveNoteEditor(null);
            setNoteMenuOpen(false);
            return;
          }

          const nowStamp = new Date().toLocaleString();
          const finalNote = {
            id: activeNoteEditor.id,
            title: activeNoteEditor.title,
            content: activeNoteEditor.content,
            bold: activeNoteEditor.bold,
            italic: activeNoteEditor.italic,
            heading: activeNoteEditor.heading,
            showTickBoxes: activeNoteEditor.showTickBoxes,
            tickItems: activeNoteEditor.tickItems || [],
            labels: activeNoteEditor.labels || [],
            drawingUrl: activeNoteEditor.drawingUrl || '',
            archived:
              overrideArchived !== null ? overrideArchived : Boolean(activeNoteEditor.archived),
            updatedAt: nowStamp,
            versions: [
              {
                savedAt: nowStamp,
                title: activeNoteEditor.title || 'Untitled Note',
                content:
                  activeNoteEditor.content ||
                  (activeNoteEditor.tickItems || []).map((t) => t.text).join(', '),
              },
              ...(activeNoteEditor.versions || []).slice(0, 9),
            ],
          };

          setTasks((prev) =>
            prev.map((t) => {
              if (t.id !== detailTask.id) return t;
              const existing = t.notes || [];
              const existsIdx = existing.findIndex((n) => n.id === finalNote.id);
              const nextNotes =
                existsIdx >= 0
                  ? existing.map((n, idx) => (idx === existsIdx ? finalNote : n))
                  : [finalNote, ...existing];
              return { ...t, notes: nextNotes };
            })
          );

          setActiveNoteEditor(null);
          setNoteMenuOpen(false);
          if (overrideArchived === true) {
            showToast('Note archived');
          }
        };

        const handleMakeCopyNote = () => {
          if (!activeNoteEditor) return;
          const copyNote = {
            id: `note-${Date.now()}`,
            title: activeNoteEditor.title ? `${activeNoteEditor.title} (Copy)` : 'Copy of note',
            content: activeNoteEditor.content,
            bold: activeNoteEditor.bold,
            italic: activeNoteEditor.italic,
            heading: activeNoteEditor.heading,
            showTickBoxes: activeNoteEditor.showTickBoxes,
            tickItems: (activeNoteEditor.tickItems || []).map((ti, idx) => ({
              ...ti,
              id: `ti-${Date.now()}-${idx}`,
            })),
            labels: [...(activeNoteEditor.labels || [])],
            drawingUrl: activeNoteEditor.drawingUrl || '',
            archived: false,
            updatedAt: new Date().toLocaleString(),
            versions: [],
          };
          setTasks((prev) =>
            prev.map((t) =>
              t.id === detailTask.id ? { ...t, notes: [copyNote, ...(t.notes || [])] } : t
            )
          );
          setNoteMenuOpen(false);
          showToast('Note copy created');
        };

        const handleDeleteCurrentNote = () => {
          if (!activeNoteEditor) return;
          setTasks((prev) =>
            prev.map((t) =>
              t.id === detailTask.id
                ? { ...t, notes: (t.notes || []).filter((n) => n.id !== activeNoteEditor.id) }
                : t
            )
          );
          setActiveNoteEditor(null);
          setNoteMenuOpen(false);
          showToast('Note deleted');
        };

        return (
          <div
            onClick={() => {
              setNoteMenuOpen(false);
            }}
            className="fixed inset-0 z-50 bg-[#121214] text-gray-100 flex flex-col overflow-hidden"
          >
            {/* Top Task Page Navigation Header */}
            <div className="h-14 px-4 sm:px-6 border-b border-[#242429] bg-[#18181b] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (activeNoteEditor) handleSaveAndCloseNote();
                  setOpenedTaskDetailId(null);
                }}
                className="p-2 rounded-lg bg-[#232329] hover:bg-[#2e2e36] text-gray-200 hover:text-white flex items-center gap-1.5 text-xs font-medium transition shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <h2 className="flex-1 text-center text-sm sm:text-base font-semibold text-white truncate px-2">
                {detailTask.title}
              </h2>

              <button
                type="button"
                onClick={() => {
                  if (activeNoteEditor) handleSaveAndCloseNote();
                  setOpenedTaskDetailId(null);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition shrink-0"
                title="Close Task Page"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Task Detail Page Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl w-full mx-auto">
              {/* 1. TASK INFORMATION SUMMARY BAR */}
              <div className="rounded-2xl bg-[#1a1a1e] border border-[#2a2a32] p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-[11px] text-gray-400">Date of Creation</div>
                  <div className="text-sm font-semibold text-white mt-1 tabular-nums">
                    {createdDateLabel}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400">Project</div>
                  <div
                    className="text-sm font-semibold mt-1 truncate"
                    style={{ color: detailProj?.color || '#3b82f6' }}
                  >
                    {detailProj?.name || 'Tasks'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400">Total Played Time</div>
                  <div className="text-sm font-semibold text-[#ef5350] mt-1 tabular-nums">
                    {formatHoursMins(totalTaskPlayedMins).text}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-gray-400">Play Sessions</div>
                  <div className="text-sm font-semibold text-emerald-400 mt-1 tabular-nums">
                    {taskPlaySessions.length}{' '}
                    {taskPlaySessions.length === 1 ? 'session' : 'sessions'}
                  </div>
                </div>
              </div>

              {/* 2. ADD NOTE SECTION (Google Keep-Style Composer & Saved Notes) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-[#ef5350]" />
                    <h3 className="text-sm font-semibold text-white">Task Notes</h3>
                  </div>
                  {!activeNoteEditor && (
                    <button
                      type="button"
                      onClick={openNewNoteComposer}
                      className="px-3.5 py-1.5 rounded-xl bg-[#ef5350] hover:bg-[#e53935] text-xs font-semibold text-white flex items-center gap-1.5 shadow transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add note</span>
                    </button>
                  )}
                </div>

                {/* Google Keep Note Card Composer (Matching image_0548c6.png) */}
                {activeNoteEditor ? (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-2xl bg-[#202124] border border-[#3c4043] shadow-2xl p-4 space-y-3 relative"
                  >
                    {/* Drawing Preview if attached */}
                    {activeNoteEditor.drawingUrl && (
                      <div className="relative rounded-xl overflow-hidden border border-[#3c4043] bg-[#141416]">
                        <img
                          src={activeNoteEditor.drawingUrl}
                          alt="Note drawing"
                          className="w-full max-h-56 object-contain"
                        />
                        <button
                          type="button"
                          onClick={() => pushNoteEdit({ drawingUrl: '' })}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-gray-300 hover:text-white"
                          title="Remove drawing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Title Input */}
                    <input
                      type="text"
                      value={activeNoteEditor.title}
                      onChange={(e) => pushNoteEdit({ title: e.target.value })}
                      placeholder="Title"
                      className="w-full bg-transparent text-base font-semibold text-gray-100 placeholder-gray-400 focus:outline-none"
                    />

                    {/* Take a note... OR Tick Boxes Mode */}
                    {activeNoteEditor.showTickBoxes ? (
                      <div className="space-y-2">
                        {(activeNoteEditor.tickItems || []).map((ti, idx) => (
                          <div key={ti.id} className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={ti.checked}
                              onChange={() =>
                                pushNoteEdit((prev) => ({
                                  ...prev,
                                  tickItems: prev.tickItems.map((item, i) =>
                                    i === idx ? { ...item, checked: !item.checked } : item
                                  ),
                                }))
                              }
                              className="w-4 h-4 accent-[#ef5350] cursor-pointer"
                            />
                            <input
                              type="text"
                              value={ti.text}
                              onChange={(e) =>
                                pushNoteEdit((prev) => ({
                                  ...prev,
                                  tickItems: prev.tickItems.map((item, i) =>
                                    i === idx ? { ...item, text: e.target.value } : item
                                  ),
                                }))
                              }
                              placeholder="List item..."
                              className={`flex-1 bg-transparent text-xs sm:text-sm focus:outline-none ${
                                ti.checked ? 'line-through text-gray-500' : 'text-gray-200'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                pushNoteEdit((prev) => ({
                                  ...prev,
                                  tickItems: prev.tickItems.filter((_, i) => i !== idx),
                                }))
                              }
                              className="text-gray-500 hover:text-gray-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            pushNoteEdit((prev) => ({
                              ...prev,
                              tickItems: [
                                ...(prev.tickItems || []),
                                { id: `ti-${Date.now()}`, text: '', checked: false },
                              ],
                            }))
                          }
                          className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 pt-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>List item</span>
                        </button>
                      </div>
                    ) : (
                      <textarea
                        rows={4}
                        autoFocus
                        value={activeNoteEditor.content}
                        onChange={(e) => pushNoteEdit({ content: e.target.value })}
                        placeholder="Take a note..."
                        className={`w-full bg-transparent text-gray-200 placeholder-gray-400 focus:outline-none resize-none leading-relaxed ${
                          activeNoteEditor.heading ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'
                        } ${activeNoteEditor.bold ? 'font-bold' : 'font-normal'} ${
                          activeNoteEditor.italic ? 'italic' : ''
                        }`}
                      />
                    )}

                    {/* Labels Chips */}
                    {(activeNoteEditor.labels || []).length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {activeNoteEditor.labels.map((lbl) => (
                          <span
                            key={lbl}
                            className="px-2.5 py-0.5 rounded-full bg-[#2e3035] text-[11px] text-gray-200 flex items-center gap-1.5"
                          >
                            <span>{lbl}</span>
                            <button
                              type="button"
                              onClick={() =>
                                pushNoteEdit((prev) => ({
                                  ...prev,
                                  labels: prev.labels.filter((l) => l !== lbl),
                                }))
                              }
                              className="text-gray-400 hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Inline Label Input if triggered */}
                    {noteLabelInputOpen && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          autoFocus
                          value={newNoteLabelText}
                          onChange={(e) => setNewNoteLabelText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newNoteLabelText.trim()) {
                              e.preventDefault();
                              const clean = newNoteLabelText.trim();
                              if (!(activeNoteEditor.labels || []).includes(clean)) {
                                pushNoteEdit((prev) => ({
                                  ...prev,
                                  labels: [...(prev.labels || []), clean],
                                }));
                              }
                              setNewNoteLabelText('');
                              setNoteLabelInputOpen(false);
                            }
                          }}
                          placeholder="Enter label name & press Enter..."
                          className="px-3 py-1 rounded-lg bg-[#18181c] border border-[#3c4043] text-xs text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setNoteLabelInputOpen(false)}
                          className="text-xs text-gray-400 hover:text-white"
                        >
                          Done
                        </button>
                      </div>
                    )}

                    {/* Optional Formatting Bar (A) */}
                    {noteFormatOpen && (
                      <div className="flex items-center gap-2 pt-1 pb-1 border-t border-[#2f3136]">
                        <button
                          type="button"
                          onClick={() => pushNoteEdit((p) => ({ ...p, heading: !p.heading }))}
                          className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                            activeNoteEditor.heading
                              ? 'bg-[#3c4043] text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          H1
                        </button>
                        <button
                          type="button"
                          onClick={() => pushNoteEdit((p) => ({ ...p, bold: !p.bold }))}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            activeNoteEditor.bold
                              ? 'bg-[#3c4043] text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => pushNoteEdit((p) => ({ ...p, italic: !p.italic }))}
                          className={`px-2.5 py-1 rounded text-xs italic transition ${
                            activeNoteEditor.italic
                              ? 'bg-[#3c4043] text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          I
                        </button>
                      </div>
                    )}

                    {/* Bottom Google Keep Action Bar (Only the Allowed Icons from image_0548c6.png) */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#2f3136]">
                      <div className="flex items-center gap-1 sm:gap-2 relative">
                        {/* A (Text Formatting) */}
                        <button
                          type="button"
                          onClick={() => setNoteFormatOpen((prev) => !prev)}
                          title="Formatting options"
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold underline transition ${
                            noteFormatOpen
                              ? 'bg-[#3c4043] text-white'
                              : 'text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          A
                        </button>

                        {/* Archive Box Icon */}
                        <button
                          type="button"
                          onClick={() => handleSaveAndCloseNote(true)}
                          title="Archive note"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-white/10 transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Three-Dot More Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNoteMenuOpen((prev) => !prev);
                            }}
                            title="More"
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                              noteMenuOpen
                                ? 'bg-[#3c4043] text-white'
                                : 'text-gray-300 hover:bg-white/10'
                            }`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {noteMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-0 mt-1.5 w-48 rounded-xl bg-[#28292d] border border-[#3c4043] shadow-2xl py-1.5 z-50 text-xs text-gray-200"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setNoteMenuOpen(false);
                                  setNoteLabelInputOpen(true);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-white/10 transition"
                              >
                                Add label
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNoteMenuOpen(false);
                                  setNoteDrawingModalOpen(true);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-white/10 transition"
                              >
                                Add drawing
                              </button>
                              <button
                                type="button"
                                onClick={handleMakeCopyNote}
                                className="w-full text-left px-4 py-2 hover:bg-white/10 transition"
                              >
                                Make a copy
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  pushNoteEdit((prev) => {
                                    const nextTick = !prev.showTickBoxes;
                                    const converted =
                                      nextTick && (prev.tickItems || []).length === 0
                                        ? (prev.content || '')
                                            .split('\n')
                                            .filter((line) => line.trim())
                                            .map((line, i) => ({
                                              id: `ti-${Date.now()}-${i}`,
                                              text: line,
                                              checked: false,
                                            }))
                                        : prev.tickItems;
                                    return {
                                      ...prev,
                                      showTickBoxes: nextTick,
                                      tickItems:
                                        converted && converted.length > 0
                                          ? converted
                                          : [{ id: `ti-${Date.now()}`, text: '', checked: false }],
                                    };
                                  });
                                  setNoteMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-white/10 transition"
                              >
                                {activeNoteEditor.showTickBoxes
                                  ? 'Hide tick boxes'
                                  : 'Show tick boxes'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setNoteMenuOpen(false);
                                  setNoteVersionModalOpen(true);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-white/10 transition"
                              >
                                Version history
                              </button>
                              <div className="my-1 border-t border-[#3c4043]" />
                              <button
                                type="button"
                                onClick={handleDeleteCurrentNote}
                                className="w-full text-left px-4 py-2 hover:bg-white/10 text-[#ef5350] transition"
                              >
                                Delete note
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Undo */}
                        <button
                          type="button"
                          disabled={!(activeNoteEditor.undoStack || []).length}
                          onClick={handleUndoNote}
                          title="Undo"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-white/10 disabled:opacity-30 transition"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Redo */}
                        <button
                          type="button"
                          disabled={!(activeNoteEditor.redoStack || []).length}
                          onClick={handleRedoNote}
                          title="Redo"
                          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:bg-white/10 disabled:opacity-30 transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSaveAndCloseNote()}
                        className="px-4 py-1.5 rounded-lg hover:bg-white/10 text-xs font-semibold text-gray-200 transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={openNewNoteComposer}
                    className="w-full text-left px-4 py-3 rounded-xl bg-[#202124] hover:bg-[#26272b] border border-[#34363b] text-xs sm:text-sm text-gray-400 flex items-center justify-between transition"
                  >
                    <span>Take a note...</span>
                    <span className="text-[11px] text-[#ef5350] font-medium">+ Add note</span>
                  </button>
                )}

                {/* Saved Notes Grid */}
                {taskNotes.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {taskNotes.map((note) => (
                      <div
                        key={note.id}
                        onClick={() => openExistingNote(note)}
                        className="rounded-xl bg-[#202124] hover:bg-[#26272b] border border-[#34363b] p-4 space-y-2 cursor-pointer transition"
                      >
                        {note.drawingUrl && (
                          <img
                            src={note.drawingUrl}
                            alt="Sketch"
                            className="w-full h-28 object-contain rounded-lg bg-[#141416] border border-[#2f3136]"
                          />
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-white truncate">
                            {note.title || 'Untitled Note'}
                          </div>
                          {note.archived && (
                            <span className="px-2 py-0.5 rounded bg-gray-700/50 text-[10px] text-gray-300">
                              Archived
                            </span>
                          )}
                        </div>
                        {note.showTickBoxes ? (
                          <div className="space-y-1">
                            {(note.tickItems || []).slice(0, 4).map((ti) => (
                              <div
                                key={ti.id}
                                className={`text-xs flex items-center gap-2 ${
                                  ti.checked ? 'line-through text-gray-500' : 'text-gray-300'
                                }`}
                              >
                                <span>{ti.checked ? '☑' : '☐'}</span>
                                <span className="truncate">{ti.text}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p
                            className={`text-xs text-gray-300 line-clamp-3 whitespace-pre-line ${
                              note.bold ? 'font-bold' : ''
                            } ${note.italic ? 'italic' : ''}`}
                          >
                            {note.content}
                          </p>
                        )}
                        {(note.labels || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {note.labels.map((l) => (
                              <span
                                key={l}
                                className="px-2 py-0.5 rounded-full bg-[#2e3035] text-[10px] text-gray-300"
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. TASK PLAY HISTORY & PER-SESSION COMMENTS */}
              <div className="rounded-2xl bg-[#1a1a1e] border border-[#2a2a32] p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#ef5350]" />
                  <h3 className="text-sm font-semibold text-white">
                    Play History &amp; Session Log
                  </h3>
                </div>

                {taskPlaySessions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    No focus sessions (&ge; 15m) recorded for this task yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[#26262e] border-t border-b border-[#26262e]">
                    {taskPlaySessions.map((sess) => {
                      const endHr = (sess.startHour || 0) + (sess.durationMins || 0) / 60;
                      const isEditingComment = editingSessionCommentId === sess.id;
                      return (
                        <div key={sess.id} className="py-3.5 space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="px-2.5 py-1 rounded-lg bg-[#232329] text-xs font-medium text-gray-200 tabular-nums">
                                {sess.date}
                              </span>
                              <span className="text-xs text-gray-400 tabular-nums">
                                {formatHourMinute(sess.startHour)} &ndash;{' '}
                                {formatHourMinute(endHr)}
                              </span>
                            </div>

                            {/* Played Minutes + Comment Option Right Beside Time */}
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs font-semibold text-emerald-400 tabular-nums">
                                {formatHoursMins(sess.durationMins).text} ({sess.durationMins} mins)
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditingComment) {
                                    setEditingSessionCommentId(null);
                                  } else {
                                    setEditingSessionCommentId(sess.id);
                                    setSessionCommentDraft(sess.comment || '');
                                  }
                                }}
                                title="Add or edit comment for this session"
                                className={`px-2.5 py-1 rounded-lg border text-[11px] flex items-center gap-1 transition ${
                                  sess.comment
                                    ? 'bg-[#ef5350]/15 border-[#ef5350]/45 text-[#ef5350]'
                                    : 'bg-[#232329] border-[#32323c] text-gray-300 hover:text-white'
                                }`}
                              >
                                <Info className="w-3 h-3" />
                                <span>{sess.comment ? 'Edit Comment' : 'Comment'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Existing Session Comment Display */}
                          {sess.comment && !isEditingComment && (
                            <div className="ml-2 pl-3 border-l-2 border-[#ef5350]/50 text-xs text-gray-300">
                              {sess.comment}
                            </div>
                          )}

                          {/* Inline Session Comment Editor */}
                          {isEditingComment && (
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                autoFocus
                                value={sessionCommentDraft}
                                onChange={(e) => setSessionCommentDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setSessions((prev) =>
                                      prev.map((item) =>
                                        item.id === sess.id
                                          ? { ...item, comment: sessionCommentDraft.trim() }
                                          : item
                                      )
                                    );
                                    setEditingSessionCommentId(null);
                                    showToast('Session comment saved');
                                  }
                                }}
                                placeholder="Write a comment about what you studied in this session..."
                                className="flex-1 px-3 py-1.5 rounded-lg bg-[#141417] border border-[#3c3c46] text-xs text-white focus:outline-none focus:border-[#ef5350]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setSessions((prev) =>
                                    prev.map((item) =>
                                      item.id === sess.id
                                        ? { ...item, comment: sessionCommentDraft.trim() }
                                        : item
                                    )
                                  );
                                  setEditingSessionCommentId(null);
                                  showToast('Session comment saved');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-[#ef5350] text-xs font-medium text-white"
                              >
                                Save
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* DRAWING PAD MODAL ("Add drawing") */}
            {noteDrawingModalOpen && (
              <div
                onClick={() => setNoteDrawingModalOpen(false)}
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md rounded-2xl bg-[#202124] border border-[#3c4043] p-5 space-y-4 shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Add drawing</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const canvas = drawingCanvasRef.current;
                        if (canvas) {
                          const ctx = canvas.getContext('2d');
                          ctx.clearRect(0, 0, canvas.width, canvas.height);
                        }
                      }}
                      className="text-xs text-[#ef5350] hover:underline"
                    >
                      Clear
                    </button>
                  </div>

                  <canvas
                    ref={drawingCanvasRef}
                    width={400}
                    height={220}
                    onMouseDown={(e) => {
                      const canvas = drawingCanvasRef.current;
                      if (!canvas) return;
                      const rect = canvas.getBoundingClientRect();
                      const ctx = canvas.getContext('2d');
                      ctx.strokeStyle = '#ef5350';
                      ctx.lineWidth = 2.5;
                      ctx.lineCap = 'round';
                      ctx.beginPath();
                      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                      isDrawingRef.current = true;
                    }}
                    onMouseMove={(e) => {
                      if (!isDrawingRef.current) return;
                      const canvas = drawingCanvasRef.current;
                      if (!canvas) return;
                      const rect = canvas.getBoundingClientRect();
                      const ctx = canvas.getContext('2d');
                      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
                      ctx.stroke();
                    }}
                    onMouseUp={() => {
                      isDrawingRef.current = false;
                    }}
                    onMouseLeave={() => {
                      isDrawingRef.current = false;
                    }}
                    className="w-full h-52 rounded-xl bg-[#141416] border border-[#34363b] cursor-crosshair"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setNoteDrawingModalOpen(false)}
                      className="px-4 py-1.5 rounded-lg bg-[#2c2d31] text-xs text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const canvas = drawingCanvasRef.current;
                        if (canvas) {
                          const dataUrl = canvas.toDataURL('image/png');
                          pushNoteEdit({ drawingUrl: dataUrl });
                        }
                        setNoteDrawingModalOpen(false);
                      }}
                      className="px-5 py-1.5 rounded-lg bg-[#ef5350] text-xs font-semibold text-white"
                    >
                      Attach Drawing
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* NOTE VERSION HISTORY MODAL */}
            {noteVersionModalOpen && activeNoteEditor && (
              <div
                onClick={() => setNoteVersionModalOpen(false)}
                className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-sm rounded-2xl bg-[#202124] border border-[#3c4043] p-5 space-y-3 shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">Version history</h4>
                    <button
                      type="button"
                      onClick={() => setNoteVersionModalOpen(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {(activeNoteEditor.versions || []).length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">
                      No earlier versions saved yet.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {activeNoteEditor.versions.map((ver, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#18181c] border border-[#2f3136] text-xs space-y-1"
                        >
                          <div className="text-[10px] text-[#ef5350] font-medium">
                            {ver.savedAt}
                          </div>
                          <div className="font-semibold text-gray-200">{ver.title}</div>
                          <div className="text-gray-400 truncate">{ver.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* LEARNING STREAK & DAILY MEDAL ACHIEVEMENTS MODAL */}
      {isAchievementsModalOpen && (() => {
        const monthShort = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];
        const monthFull = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ];

        // Build 4-week rolling Sunday-Saturday calendar ending on current week
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const sunOffset = now.getDay(); // 0 = Sun ... 6 = Sat
        const currentWeekSun = new Date(now);
        currentWeekSun.setDate(now.getDate() - sunOffset);

        const formatYMDLocal = (dt) =>
          `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
            dt.getDate()
          ).padStart(2, '0')}`;

        const weeklyRows = [3, 2, 1, 0].map((weeksAgo) => {
          const wkStart = new Date(currentWeekSun);
          wkStart.setDate(currentWeekSun.getDate() - weeksAgo * 7);
          const wkEnd = new Date(wkStart);
          wkEnd.setDate(wkStart.getDate() + 6);

          const rowLabel =
            weeksAgo === 0
              ? 'This week'
              : wkStart.getMonth() === wkEnd.getMonth()
              ? `${monthShort[wkStart.getMonth()]} ${wkStart.getDate()} - ${wkEnd.getDate()}`
              : `${monthShort[wkStart.getMonth()]} ${wkStart.getDate()} - ${monthShort[wkEnd.getMonth()]} ${wkEnd.getDate()}`;

          const days = Array.from({ length: 7 }, (_, dIdx) => {
            const dObj = new Date(wkStart);
            dObj.setDate(wkStart.getDate() + dIdx);
            const dStr = formatYMDLocal(dObj);
            const mins = streakAndAchievements.dailyTotals[dStr] || 0;
            const medal = streakAndAchievements.medalByDate[dStr] || null;
            return {
              dateStr: dStr,
              dayNum: dObj.getDate(),
              isToday: dStr === todayStr,
              mins,
              medal,
            };
          });

          return { weeksAgo, rowLabel, days };
        });

        // Original Full Month Calendar Grid (matching image_b3204b.png)
        const firstDow = new Date(achCalYear, achCalMonth, 1).getDay();
        const daysInM = new Date(achCalYear, achCalMonth + 1, 0).getDate();
        const prevDays = new Date(achCalYear, achCalMonth, 0).getDate();
        const monthCells = [];
        for (let i = firstDow - 1; i >= 0; i--) {
          const pm = achCalMonth === 0 ? 11 : achCalMonth - 1;
          const py = achCalMonth === 0 ? achCalYear - 1 : achCalYear;
          const dStr = `${py}-${String(pm + 1).padStart(2, '0')}-${String(prevDays - i).padStart(2, '0')}`;
          monthCells.push({
            day: prevDays - i,
            dateStr: dStr,
            inMonth: false,
            mins: streakAndAchievements.dailyTotals[dStr] || 0,
            medal: streakAndAchievements.medalByDate[dStr] || null,
          });
        }
        for (let d = 1; d <= daysInM; d++) {
          const dStr = `${achCalYear}-${String(achCalMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          monthCells.push({
            day: d,
            dateStr: dStr,
            inMonth: true,
            mins: streakAndAchievements.dailyTotals[dStr] || 0,
            medal: streakAndAchievements.medalByDate[dStr] || null,
          });
        }
        while (monthCells.length < 42) {
          const d = monthCells.length - (firstDow + daysInM) + 1;
          const nm = achCalMonth === 11 ? 0 : achCalMonth + 1;
          const ny = achCalMonth === 11 ? achCalYear + 1 : achCalYear;
          const dStr = `${ny}-${String(nm + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          monthCells.push({
            day: d,
            dateStr: dStr,
            inMonth: false,
            mins: streakAndAchievements.dailyTotals[dStr] || 0,
            medal: streakAndAchievements.medalByDate[dStr] || null,
          });
        }

        const medalTiers = [
          {
            id: 'bronze',
            name: 'Bronze Medal',
            rule: '2h – 5h in a day',
            count: streakAndAchievements.bronzeCount,
            color: '#ef5350',
            bg: 'rgba(239, 83, 80, 0.14)',
          },
          {
            id: 'silver',
            name: 'Silver Medal',
            rule: '5h – 8h in a day',
            count: streakAndAchievements.silverCount,
            color: '#9ca3af',
            bg: 'rgba(156, 163, 175, 0.14)',
          },
          {
            id: 'gold',
            name: 'Gold Medal',
            rule: '8h – 12h in a day',
            count: streakAndAchievements.goldCount,
            color: '#eab308',
            bg: 'rgba(234, 179, 8, 0.14)',
          },
          {
            id: 'uranium',
            name: 'Uranium Medal',
            rule: '12h – 15h in a day',
            count: streakAndAchievements.uraniumCount,
            color: '#22c55e',
            bg: 'rgba(34, 197, 94, 0.14)',
          },
        ];

        return (
          <div
            onClick={() => setIsAchievementsModalOpen(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl bg-[#18181b] border border-[#2c2c34] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Top Bar */}
              <div className="px-6 py-4 border-b border-[#25252b] flex items-center justify-between bg-[#1c1c20] shrink-0">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Learning streak
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Study <span className="text-gray-200 font-semibold">15 min</span> to achieve the daily goal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAchievementsModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {/* Streak Summary Card (CURRENT | LONGEST + Red Fireball Icon + SEE ALL ACHIEVEMENTS >) */}
                <div className="rounded-2xl bg-[#1e1e23] border border-[#2d2d36] p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 sm:gap-8">
                      <div>
                        <div className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                          CURRENT
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-[#ef5350] mt-1 tabular-nums">
                          {streakAndAchievements.currentStreak}{' '}
                          {streakAndAchievements.currentStreak === 1 ? 'day' : 'days'}
                        </div>
                      </div>

                      <div className="h-10 w-[1px] bg-[#2e2e38]" />

                      <div>
                        <div className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
                          LONGEST
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-white mt-1 tabular-nums">
                          {streakAndAchievements.longestStreak}{' '}
                          {streakAndAchievements.longestStreak === 1 ? 'day' : 'days'}
                        </div>
                      </div>
                    </div>

                    {/* Overlapping Red Fireball & Longest Flame Badges */}
                    <div className="relative flex items-center pr-2">
                      <div className="w-12 h-12 rounded-full bg-[#ef5350]/20 border border-[#ef5350]/40 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 2C12 2 17.5 6.8 17.5 13C17.5 16.59 14.81 19.5 11.5 19.5C8.19 19.5 5.5 16.59 5.5 13C5.5 10.7 6.65 8.55 8.2 7.1C8.1 8.6 8.85 9.8 9.9 10.2C9.6 7.4 10.6 4.4 12 2Z"
                            fill="#ef5350"
                          />
                          <path
                            d="M11.8 11.5C11.8 11.5 14.3 13.4 14.3 15.8C14.3 17.3 13.1 18.5 11.6 18.5C10.1 18.5 8.9 17.3 8.9 15.8C8.9 14.2 10.3 12.6 11.8 11.5Z"
                            fill="#fecaca"
                          />
                        </svg>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/40 flex items-center justify-center -ml-3 mt-4">
                        <Trophy className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#2a2a33] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 bg-[#151518] p-1 rounded-lg border border-[#2a2a32]">
                      <button
                        type="button"
                        onClick={() => setAchievementCalView('weekly')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                          achievementCalView === 'weekly'
                            ? 'bg-[#2a2a32] text-white'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        Weekly Circles
                      </button>
                      <button
                        type="button"
                        onClick={() => setAchievementCalView('monthly')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                          achievementCalView === 'monthly'
                            ? 'bg-[#2a2a32] text-white'
                            : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        Original Calendar
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setAchievementCalView((prev) =>
                          prev === 'weekly' ? 'monthly' : 'weekly'
                        )
                      }
                      className="text-xs font-semibold tracking-wide text-gray-200 hover:text-[#ef5350] flex items-center gap-1 transition"
                    >
                      <span>SEE ALL ACHIEVEMENTS</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Calendar Section: Weekly Circles OR Original Month Calendar with Colored Achievement Circles */}
                <div className="rounded-2xl bg-[#1e1e23] border border-[#2d2d36] p-5">
                  {achievementCalView === 'weekly' ? (
                    <div className="space-y-4">
                      {/* Weekday Header: S M T W T F S */}
                      <div className="grid grid-cols-12 items-center text-center text-xs font-semibold text-gray-400">
                        <div className="col-span-4 text-left" />
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayLetter, idx) => (
                          <div
                            key={idx}
                            className={`col-span-1 ${
                              idx === new Date().getDay() ? 'text-white font-bold' : ''
                            }`}
                          >
                            {dayLetter}
                          </div>
                        ))}
                        <div className="col-span-1" />
                      </div>

                      {/* 4 Weekly Rows */}
                      {weeklyRows.map((row) => (
                        <div
                          key={row.rowLabel}
                          className="grid grid-cols-12 items-center text-center"
                        >
                          <div
                            className={`col-span-4 text-left text-xs ${
                              row.weeksAgo === 0
                                ? 'font-bold text-white'
                                : 'text-gray-400'
                            }`}
                          >
                            {row.rowLabel}
                          </div>

                          {row.days.map((d) => {
                            const medal = d.medal;
                            const has15m = d.mins >= 15;
                            return (
                              <div
                                key={d.dateStr}
                                className="col-span-1 flex items-center justify-center"
                              >
                                <div
                                  title={`${d.dateStr}: ${formatHoursMins(d.mins).text}${
                                    medal ? ` • ${medal.label} Medal (${medal.range})` : ''
                                  }`}
                                  style={{
                                    borderColor: medal
                                      ? medal.color
                                      : has15m
                                      ? '#52525b'
                                      : '#2f2f38',
                                    backgroundColor: medal
                                      ? medal.bg
                                      : has15m
                                      ? 'rgba(255,255,255,0.06)'
                                      : 'transparent',
                                  }}
                                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[11px] font-semibold transition"
                                >
                                  {medal ? (
                                    <span style={{ color: medal.color }}>{d.dayNum}</span>
                                  ) : (
                                    <span
                                      className={
                                        d.isToday
                                          ? 'text-[#ef5350] font-bold'
                                          : has15m
                                          ? 'text-gray-200'
                                          : 'text-gray-600'
                                      }
                                    >
                                      {d.dayNum}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          <div className="col-span-1" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Original Monthly Calendar (matching image_b3204b.png) with Achievement Circles */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <button
                          type="button"
                          onClick={() =>
                            achCalMonth === 0
                              ? (setAchCalYear((y) => y - 1), setAchCalMonth(11))
                              : setAchCalMonth((m) => m - 1)
                          }
                          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold text-white">
                          {monthFull[achCalMonth]} {achCalYear}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            achCalMonth === 11
                              ? (setAchCalYear((y) => y + 1), setAchCalMonth(0))
                              : setAchCalMonth((m) => m + 1)
                          }
                          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-300"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 text-center text-xs text-gray-500 font-medium">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                          <div key={d}>{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-y-2 text-center text-xs">
                        {monthCells.map((c, idx) => {
                          const isTodayCell = c.dateStr === todayStr;
                          const medal = c.medal;
                          const has15m = c.mins >= 15;
                          return (
                            <div
                              key={`${c.dateStr}-${idx}`}
                              className="flex items-center justify-center py-0.5"
                            >
                              <div
                                title={`${c.dateStr}: ${formatHoursMins(c.mins).text}${
                                  medal ? ` • ${medal.label} Medal (${medal.range})` : ''
                                }`}
                                style={{
                                  borderColor:
                                    medal && c.inMonth
                                      ? medal.color
                                      : has15m && c.inMonth
                                      ? '#52525b'
                                      : 'transparent',
                                  backgroundColor:
                                    medal && c.inMonth
                                      ? medal.bg
                                      : has15m && c.inMonth
                                      ? 'rgba(255,255,255,0.06)'
                                      : 'transparent',
                                }}
                                className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium transition"
                              >
                                <span
                                  style={{
                                    color:
                                      medal && c.inMonth
                                        ? medal.color
                                        : !c.inMonth
                                        ? '#52525b'
                                        : isTodayCell
                                        ? '#ef5350'
                                        : '#e4e4e7',
                                  }}
                                >
                                  {c.day}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* TOTAL STREAK CARD FOR EACH TYPE (Bronze, Silver, Gold, Uranium) */}
                <div className="rounded-2xl bg-[#1e1e23] border border-[#2d2d36] p-5 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ef5350]" />
                      <h3 className="text-sm font-semibold text-white">
                        Total Card Collection &amp; Streak by Type
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#282830] border border-[#363642] text-[11px] font-semibold text-white tabular-nums">
                      Total Collection: {streakAndAchievements.totalMedals} Medals
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {streakAndAchievements.perTypeStreaks.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-[#16161a] border border-[#292932] p-4 flex flex-col justify-between space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className="text-xs sm:text-sm font-semibold"
                            style={{ color: item.color }}
                          >
                            {item.label}
                          </span>
                          <span
                            style={{
                              borderColor: `${item.color}55`,
                              backgroundColor: `${item.color}18`,
                              color: item.color,
                            }}
                            className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border tabular-nums"
                          >
                            Total: {item.totalCollected}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1.5 border-t border-[#24242c] text-xs">
                          <div>
                            <span className="text-gray-500 text-[10px] block">Current</span>
                            <span className="font-bold text-white tabular-nums">
                              {item.currentStreak} {item.currentStreak === 1 ? 'day' : 'days'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-500 text-[10px] block">Best Streak</span>
                            <span
                              className="font-bold tabular-nums"
                              style={{ color: item.color }}
                            >
                              {item.bestStreak} {item.bestStreak === 1 ? 'day' : 'days'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TOTAL TIME COMPLETED CARD WITH BACKWARD & FORWARD NAVIGATION */}
                <div className="rounded-2xl bg-[#161619] border border-[#2b2b34] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setTimesCompletedOffset((prev) => prev + 1)}
                      title="Previous Period"
                      className="w-8 h-8 rounded-lg bg-[#232329] hover:bg-[#2e2e36] flex items-center justify-center text-gray-300 hover:text-white transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col items-center">
                      <span className="px-4 py-1.5 rounded-xl bg-[#232329] text-xs sm:text-sm font-medium text-gray-100">
                        Total time completed
                      </span>
                      {timesCompletedOffset > 0 && (
                        <button
                          type="button"
                          onClick={() => setTimesCompletedOffset(0)}
                          className="text-[10px] text-[#ef5350] hover:underline mt-1"
                        >
                          Back to Current
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={timesCompletedOffset <= 0}
                      onClick={() =>
                        setTimesCompletedOffset((prev) => Math.max(0, prev - 1))
                      }
                      title="Next Period"
                      className="w-8 h-8 rounded-lg bg-[#232329] hover:bg-[#2e2e36] disabled:opacity-35 disabled:cursor-not-allowed flex items-center justify-center text-gray-300 hover:text-white transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="divide-y divide-[#25252d] border-t border-b border-[#25252d] text-xs sm:text-sm">
                    {[
                      {
                        label: streakAndAchievements.timesCompletedWeekLabel,
                        mins: streakAndAchievements.timesCompletedThisWeekMins,
                        days: streakAndAchievements.timesCompletedThisWeek,
                      },
                      {
                        label: streakAndAchievements.timesCompletedMonthLabel,
                        mins: streakAndAchievements.timesCompletedThisMonthMins,
                        days: streakAndAchievements.timesCompletedThisMonth,
                      },
                      {
                        label: streakAndAchievements.timesCompletedYearLabel,
                        mins: streakAndAchievements.timesCompletedThisYearMins,
                        days: streakAndAchievements.timesCompletedThisYear,
                      },
                      {
                        label: 'All',
                        mins: streakAndAchievements.timesCompletedAllMins,
                        days: streakAndAchievements.timesCompletedAll,
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between py-3 px-1"
                      >
                        <span className="text-gray-300">{row.label}</span>
                        <div className="flex items-center gap-2.5 tabular-nums">
                          <span className="text-xs text-gray-400">
                            ({row.days} {row.days === 1 ? 'day' : 'days'})
                          </span>
                          <span className="font-semibold text-white">
                            {formatHoursMins(row.mins).text}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* STREAK CHALLENGE BADGE CARD WITH PARTICULAR MEDAL TOTAL COLLECTION */}
                <div className="rounded-2xl bg-[#161619] border border-[#2b2b34] p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-7 h-7 rounded-full bg-[#ef5350]/15 flex items-center justify-center text-[#ef5350]">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <span className="px-4 py-1.5 rounded-xl bg-[#232329] text-xs sm:text-sm font-medium text-gray-200">
                      Streak challenge
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-[#232329] text-[11px] font-semibold text-[#ef5350] tabular-nums">
                      Total: {streakAndAchievements.totalStreakMedalsCollected}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {streakAndAchievements.challengeMilestones.map((daysTarget) => {
                      const particularMedalTotal =
                        streakAndAchievements.challengeCollectionCounts[daysTarget] || 0;
                      const unlocked =
                        streakAndAchievements.longestStreak >= daysTarget ||
                        particularMedalTotal > 0;
                      const nextTarget =
                        streakAndAchievements.challengeMilestones.find(
                          (m) => m > daysTarget
                        ) || 365;
                      return (
                        <button
                          key={daysTarget}
                          type="button"
                          onClick={() => {
                            if (unlocked) {
                              setStreakCelebrationData({
                                streakDays: daysTarget,
                                nextAward: nextTarget,
                              });
                              soundEngine.playAlarm(settings.focusAlarm || 'Alien Fanfare');
                            } else {
                              showToast(
                                `Reach a ${daysTarget}-day continuous study streak (≥15m/day) to unlock!`
                              );
                            }
                          }}
                          className="flex flex-col items-center shrink-0 group"
                        >
                          <div
                            className={`relative w-16 h-20 rounded-2xl flex items-center justify-center border transition ${
                              unlocked
                                ? 'bg-[#261b1e] border-[#ef5350]/45 shadow-lg group-hover:scale-105'
                                : 'bg-[#202025] border-[#2c2c35] opacity-80'
                            }`}
                          >
                            {/* Particular Medal Total Collection Pill */}
                            <span
                              className={`absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold tabular-nums ${
                                particularMedalTotal > 0
                                  ? 'bg-[#ef5350] text-white'
                                  : 'bg-[#2b2b33] text-gray-400'
                              }`}
                            >
                              ×{particularMedalTotal}
                            </span>

                            {unlocked ? (
                              /* Unlocked Coral/Red Star Ribbon Medal */
                              <svg width="38" height="44" viewBox="0 0 48 56" fill="none">
                                <path d="M16 32L12 52L24 45L36 52L32 32H16Z" fill="#3b82f6" />
                                <circle cx="24" cy="22" r="16" fill="#ef5350" />
                                <circle cx="24" cy="22" r="12" fill="#f87171" />
                                <path
                                  d="M24 14L26.3 18.8L31.6 19.5L27.8 23.2L28.7 28.5L24 26L19.3 28.5L20.2 23.2L16.4 19.5L21.7 18.8L24 14Z"
                                  fill="#fee2e2"
                                />
                              </svg>
                            ) : (
                              /* Locked Dark Gray Padlock Ribbon Medal */
                              <svg width="38" height="44" viewBox="0 0 48 56" fill="none">
                                <path d="M16 32L12 52L24 45L36 52L32 32H16Z" fill="#3f3f46" />
                                <circle cx="24" cy="22" r="16" fill="#52525b" />
                                <circle cx="24" cy="22" r="12" fill="#3f3f46" />
                                <rect x="19" y="21" width="10" height="8" rx="2" fill="#71717a" />
                                <path
                                  d="M21 21V18.5C21 16.8 22.3 15.5 24 15.5C25.7 15.5 27 16.8 27 18.5V21"
                                  stroke="#71717a"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span
                            className={`text-[11px] mt-2 font-medium ${
                              unlocked ? 'text-gray-200' : 'text-gray-400'
                            }`}
                          >
                            {daysTarget} {daysTarget === 1 ? 'day' : 'days'}
                          </span>
                          <span className="text-[9px] text-gray-500 tabular-nums">
                            Collected: {particularMedalTotal}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* "WELL DONE!" STREAK MILESTONE CELEBRATION MODAL (Matching Screenshot 1) */}
      {streakCelebrationData && (
        <div
          onClick={() => setStreakCelebrationData(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-3xl bg-[#18181b] border border-[#2d2d36] overflow-hidden shadow-2xl text-center relative"
          >
            {/* Header */}
            <div className="py-4 border-b border-[#25252b] text-sm font-semibold text-gray-200">
              Well done!
            </div>

            {/* Confetti + Medal Artwork + Username + New Best Streak */}
            <div className="relative py-7 px-6 flex flex-col items-center overflow-hidden">
              {/* Confetti Particles */}
              <div className="pointer-events-none absolute inset-0">
                <span className="absolute top-5 left-8 w-2 h-2 bg-[#ef5350] rotate-12 rounded-[1px]" />
                <span className="absolute top-8 right-10 w-2.5 h-1.5 bg-[#f87171] -rotate-45 rounded-[1px]" />
                <span className="absolute top-16 left-5 w-1.5 h-2.5 bg-[#fca5a5] rotate-45 rounded-[1px]" />
                <span className="absolute top-20 right-7 w-2 h-2 bg-[#ef5350] rotate-12 rounded-[1px]" />
                <span className="absolute bottom-14 left-10 w-2 h-1.5 bg-[#f87171] -rotate-12 rounded-[1px]" />
                <span className="absolute bottom-16 right-12 w-1.5 h-2 bg-[#fca5a5] rotate-45 rounded-[1px]" />
              </div>

              {/* Striped Circular Backdrop + Red Star Ribbon Medal */}
              <div className="w-28 h-28 rounded-full bg-[#222227] border border-[#2e2e36] flex items-center justify-center mb-4 shadow-inner">
                <svg width="64" height="74" viewBox="0 0 48 56" fill="none">
                  <path d="M16 32L12 52L24 45L36 52L32 32H16Z" fill="#3b82f6" />
                  <circle cx="24" cy="22" r="16" fill="#ef5350" />
                  <circle cx="24" cy="22" r="12.5" fill="#f87171" />
                  <path
                    d="M24 13.5L26.5 18.6L32.1 19.4L28 23.3L29 28.9L24 26.2L19 28.9L20 23.3L15.9 19.4L21.5 18.6L24 13.5Z"
                    fill="#fee2e2"
                  />
                </svg>
              </div>

              <div className="text-sm font-semibold text-[#ef5350] mb-1">
                {settings.username}
              </div>
              <div className="text-xs text-gray-400">New best streak</div>
              <div className="text-xl font-bold text-[#ef5350] mt-1 tabular-nums">
                {streakCelebrationData.streakDays}{' '}
                {streakCelebrationData.streakDays === 1 ? 'day' : 'days'}
              </div>
            </div>

            {/* Next Award Row */}
            <div className="py-3 border-t border-[#25252b] text-xs text-gray-400">
              Next Award: {streakCelebrationData.nextAward} days
            </div>

            {/* SHARE Button */}
            <button
              type="button"
              onClick={() => {
                const shareText = `${settings.username} achieved a ${streakCelebrationData.streakDays}-day study streak on Focus To-Do!`;
                navigator.clipboard?.writeText(shareText).catch(() => {});
                showToast('Streak achievement copied to clipboard!');
              }}
              className="w-full py-3.5 border-t border-[#25252b] text-xs font-bold tracking-wider text-[#ef5350] hover:bg-white/5 transition"
            >
              SHARE
            </button>

            {/* CLOSE Button */}
            <button
              type="button"
              onClick={() => setStreakCelebrationData(null)}
              className="w-full py-3.5 border-t border-[#25252b] text-xs font-bold tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      {/* Non-intrusive Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-20 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#242429] border border-[#383842] text-xs text-white shadow-2xl">
          {toastMsg}
        </div>
      )}
    </div>
  );
}