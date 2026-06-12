# Football Widget

A neat, retro-style desktop widget that sits on your screen to show live and upcoming football fixtures, broadcaster info, and win probabilities. 

It runs on Electron and React, staying clean and transparent on your desktop.

## Key Features

*   **Size Toggle**: Cycle through Wide (490x185), Compact (210x220), and Mini (90x95) forms by clicking the size button or double-clicking the widget.
*   **Translucent Design**: A seamless backdrop lets your desktop wallpaper/theme gradient bleed through the widget and panels nicely.
*   **Pixel Mascot**: Animated retro character that reacts to match statuses (sleeps when no games are on, hypes up for kickoffs, alerts during live matches).
*   **Local AI Assistant**: Slide open the bottom chatbox to chat with a built-in AI about match statistics, form, or general queries. Works securely using your own Gemini or OpenRouter API keys saved locally in your app configuration.
*   **Interactive Mini-Game**: Play a quick retro-style mini-game right inside the customizer.
*   **Custom Mascot Canvas**: Design your own custom 12x14 grid mascot art using a pixel canvas.
*   **Audio & Speech**: Chiptune sound synthesis for alerts and retro text-to-speech commentary.
*   **Live Match Stats & H2H**: Expand upcoming or recent results to view deterministic game events, historical team head-to-heads, and possession statistics.
*   **Keyboard Navigation**: Press Left/Right arrow keys on your keyboard to flip through the active match carousel.

---

## Setup & Installation

### 1. Grab dependencies
Make sure Node.js is installed. Run this in your terminal:
```bash
npm install
```

### 2. Run in Development Mode
To test it with simulated matches immediately:
```bash
npm run dev
```

### 3. Fetch Real Matches
By default, the widget uses real FIFA World Cup 2026 mock schedules. To use real-time ESPN schedules and live feeds, it will attempt to fetch from ESPN's public endpoints out-of-the-box. 

If you want to use dedicated paid keys, copy `.env.example` to `.env` and fill in your RapidAPI key (`api-football`) or `football-data` credentials.

### 4. Build and Package
To build the setup installer (.exe for Windows or DMG for macOS):
```bash
npm run package
```
This drops the installer executable inside the `./release/` directory.

---

## API Keys (AI Assistant)
To talk to the AI Assistant:
1. Open the Widget Customizer (click the Gear icon `⚙` on the widget).
2. Go to the **Settings** tab.
3. Enter your Gemini or OpenRouter API key. 
4. The key is stored locally in your computer's user preferences directory. It is never sent to any third party other than Google or OpenRouter servers.

---

## Configuration & File Guide

*   `electron/main.js`: Electron initialization, window sizing, tray controls, global hotkeys, and API integration.
*   `src/store/widgetStore.js`: Zustand store for state management (carousel indexes, theme styling, chat history).
*   `src/components/WidgetAiChatbox.jsx`: Clean sans-serif chat interface connected to the bottom of the widget.
*   `src/components/MatchPanel.jsx`: Drop-down list showing fixture results, upcoming games, and head-to-head records.
*   `src/utils/audioService.js` / `src/utils/textToSpeech.js`: Web Audio retro synth sounds and speaker functions.
*   `src/components/CustomizerApp.jsx`: Settings control panel dashboard.
