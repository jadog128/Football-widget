
# One click setup 

https://football-widget.vercel.app/ 
This will download a installer and its done

# Image Gallery at the bottom

---

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

---

# Image Gallery

<img width="529" height="604" alt="image" src="https://github.com/user-attachments/assets/1d2aeef0-db27-4645-aecc-7c4dc13b0579" />
<img width="587" height="687" alt="image" src="https://github.com/user-attachments/assets/9e88cc9f-3887-4964-bc02-c3699ad24e00" />
<img width="591" height="692" alt="image" src="https://github.com/user-attachments/assets/8557f8a4-940f-4afa-8599-c23d169e748c" />
<img width="597" height="694" alt="image" src="https://github.com/user-attachments/assets/f72360f2-7ee6-4c58-a962-48e6018f2cf5" />
<img width="600" height="696" alt="image" src="https://github.com/user-attachments/assets/e74e381c-fc70-4bf3-b8e5-262f3a1e895b" />
<img width="591" height="700" alt="image" src="https://github.com/user-attachments/assets/8312c92f-5507-4b69-9851-d49321d7492f" />
<img width="591" height="700" alt="image" src="https://github.com/user-attachments/assets/17fa2025-8389-437f-a3b1-e29167f21521" />
<img width="591" height="700" alt="image" src="https://github.com/user-attachments/assets/c831d8b7-aab7-4265-8c1c-e00f85f65713" />
<img width="585" height="690" alt="image" src="https://github.com/user-attachments/assets/92e7a5be-4b9e-4f79-aaa0-a0466a6459fd" />
<img width="597" height="687" alt="image" src="https://github.com/user-attachments/assets/663d8f8a-9b68-4038-b21f-b88cf5708263" />
<img width="584" height="696" alt="image" src="https://github.com/user-attachments/assets/b97df88c-9c62-4ffb-b66f-d7d139c5d65b" />
<img width="517" height="580" alt="image" src="https://github.com/user-attachments/assets/005d045b-12ed-4a44-b84b-5b97eedb8ff1" />
<img width="515" height="235" alt="image" src="https://github.com/user-attachments/assets/53b8c8e8-5d13-4c75-b43a-9dfbc8481df7" />
<img width="452" height="198" alt="image" src="https://github.com/user-attachments/assets/ded3c564-1c30-441e-94d5-4ba2fe7aff00" />
<img width="200" height="190" alt="image" src="https://github.com/user-attachments/assets/b936e64f-d5e0-4b3a-94fb-39656d471549" />
<img width="177" height="149" alt="image" src="https://github.com/user-attachments/assets/16b34f4d-1311-4bde-bce8-ee077e1b9d60" />

---
