# RockStar AI Chatbot 🎸🤖

A complete, high-fidelity, frontend-only AI chatbot designed specifically for students as a study partner and friend. It features a cinematic, fullscreen video background landing page, a fluid glassmorphism chat interface, synthesized retro-futuristic sound effects, and persistent conversation history.

## 🚀 Live Demo & Getting Started

To run this application locally:
1. Clone or download this repository.
2. Ensure the assets are in the `/assets/` directory:
   - `assets/hero_section_video.mp4` (Cinematic fullscreen landing video)
   - `assets/chat box image.jpeg` (Background wallpaper for the chat screen)
3. Open `index.html` directly in any modern web browser (Double-click or drag-and-drop).
4. No servers, node modules, or external databases are required!

---

## 📂 Folder Structure

```text
/
├── index.html                  # Main application markup
├── css/
│   └── style.css               # Core design tokens, animations, and layouts
├── js/
│   └── script.js               # Chatbot logic, sound synthesizer, and routing
├── assets/
│   ├── hero_section_video.mp4  # Landing screen background video
│   └── chat box image.jpeg     # Chat page background image
└── README.md                   # This documentation file
```

---

## ✨ Features

### 🎥 Cinematic Hero Section
- Fullscreen autoplaying video overlayed with a glassmorphic content card.
- Text shadows and glowing accent gradients ensuring premium legibility.
- Responsive button micro-animations (pulsing shadow glow and translation cues).

### 🌌 Smooth Transitions
- Clicking **Start Chat** fades and scales out the landing page while sliding in the main chat board without a page refresh.
- Fluid fade-in animations for individual chat bubbles as they appear.

### 💎 Premium Glassmorphism Interface
- Transparent frosted-glass containers overlaying the background image using high-quality CSS `backdrop-filter`.
- custom scrollbars, bouncing typing indicator, and glowing activity dots.
- Collapsible sidebar for desktop viewports containing quick-trigger suggestions.

### 🧠 Hybrid Intelligent Simulation Engine
- **Direct Gemini LLM Integration:** Provide your Google Gemini API key in the options menu to activate real-time LLM replies from Google's `gemini-1.5-flash` model.
- **Conversational Memory:** The API context builder supplies the last 8 messages of history so the chatbot has active memory of the conversation.
- **Offline Mode Fallback:** If no API key is specified (or internet is disconnected), RockStar gracefully falls back to a locally processed rule-based responder covering:
  - **Greetings** (Hey, hello, yo)
  - **Exams & Tests** (Active recall, stress mitigation, Pomodoro technique)
  - **College Projects** (Project structure, ideas, repository documentation)
  - **Assignments** (Outlining essays, Feynman technique, preventing plagiarism)
  - **Programming** (Debugging guidelines, clean functions, tutorial practices)
  - **Study Tips & Productivity** (Focused blocks, spaced repetition, MIT tasks)
  - **Time Management** (Eisenhower Matrix, Parkinson's Law)
  - **General College Advice** (Healthy nutrition, professor office hours)
- Multi-response pools for randomized conversational variety.

### 🔊 Retro-Futuristic Audio Feedback
- Synthesized sound design powered by the browser's native **Web Audio API**.
- Clean click feedback tone on message dispatch and a futuristic triple-tone chime on reply arrival.
- Header-level dropdown menu to easily toggle sounds on and off.

### 💾 Conversation Persistence
- Automatic local storage state management that stores message lists and timestamps, reloading them upon entering the chat screen.
- A **Clear Chat** action to safely wipe cache and restore the bot's default greeting.

---

## 🛠️ Built With

- **HTML5**: Semantic tags, responsive layouts.
- **CSS3**: Custom variables, custom-keyframes, mobile-first design queries, flex alignment.
- **Vanilla JavaScript**: Fetch client calls to Google Gemini API, Web Audio synthesis, LocalStorage interface, regex-based message routing.

---

## 📄 License
This project is open-source and free to adapt for school assignments and learning portfolios. Make it your own!
