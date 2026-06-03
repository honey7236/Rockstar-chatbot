/* ==========================================================================
   RockStar AI Chatbot Client-Side Logic & Simulation (Diagnostic Patched)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log("RockStar Chatbot script loaded.");
    
    // DOM Elements
    const heroSection = document.getElementById('hero-section');
    const chatSection = document.getElementById('chat-section');
    const startChatBtn = document.getElementById('start-chat-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatForm = document.getElementById('chat-form');
    const sendBtn = document.getElementById('send-btn');
    
    // Header & Options Dropdown Elements
    const menuDotsBtn = document.getElementById('menu-dots-btn');
    const optionsDropdown = document.getElementById('options-dropdown');
    const soundToggleBtn = document.getElementById('sound-toggle-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    
    // API Modal Elements
    const apiKeyBtn = document.getElementById('api-key-btn');
    const apiKeyModal = document.getElementById('api-key-modal');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const closeApiModalBtn = document.getElementById('close-api-modal-btn');
    
    // Persona Modal Elements
    const personaBtn = document.getElementById('persona-btn');
    const personaModal = document.getElementById('persona-modal');
    const closePersonaModalBtn = document.getElementById('close-persona-modal-btn');
    const savePersonaBtn = document.getElementById('save-persona-btn');
    const customPersonaContainer = document.getElementById('custom-persona-container');
    const customPersonaInput = document.getElementById('custom-persona-input');
    const personaCards = document.querySelectorAll('.persona-card');
    
    const typingIndicator = document.getElementById('typing-indicator');

    // Hero Video Sound Elements
    const heroVideo = document.getElementById('hero-video');
    const heroSoundBtn = document.getElementById('hero-sound-btn');
    const heroSoundIcon = document.getElementById('hero-sound-icon');

    // Safe Storage Wrappers (prevent incognito/iframe sandboxing crashes)
    const storage = {
        getItem: (key) => {
            try { return localStorage.getItem(key); } catch (e) { return null; }
        },
        setItem: (key, val) => {
            try { localStorage.setItem(key, val); } catch (e) {}
        },
        removeItem: (key) => {
            try { localStorage.removeItem(key); } catch (e) {}
        }
    };

    // State Variables
    let soundEnabled = true;
    let messages = [];
    let audioContext = null;

    // Default bot greeting
    const DEFAULT_GREETING = {
        sender: 'bot',
        text: "👋 Hi! I'm RockStar. How can I help you today? I'm ready to chat using the Groq Python backend with Llama 3.3. Please make sure the local server is running and configure your Groq API Key in the API Settings (three dots '...')! 🚀🎸",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // ==========================================================================
    // Audio Synthesizer (Web Audio API)
    // ==========================================================================
    function initAudio() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn("AudioContext is not supported by this browser.", e);
            }
        }
    }

    function playTone(freq, type, duration, delay = 0, volume = 0.1) {
        if (!soundEnabled) return;
        try {
            initAudio();
            if (!audioContext) return;
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const osc = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            osc.type = type;
            osc.frequency.value = freq;
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + delay + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + delay + duration);
            
            osc.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            osc.start(audioContext.currentTime + delay);
            osc.stop(audioContext.currentTime + delay + duration);
        } catch (error) {
            console.warn('Audio feedback failed to play', error);
        }
    }

    function playSendSound() {
        playTone(600, 'sine', 0.12, 0, 0.08);
    }

    function playReceiveSound() {
        playTone(523.25, 'sine', 0.15, 0, 0.08); // C5
        playTone(659.25, 'sine', 0.15, 0.06, 0.08); // E5
        playTone(783.99, 'sine', 0.25, 0.12, 0.08); // G5
    }

    // ==========================================================================
    // Event Listeners for Dropdown Menu & Modals
    // ==========================================================================

    // Toggle options dropdown
    if (menuDotsBtn) {
        menuDotsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (optionsDropdown) optionsDropdown.classList.toggle('hidden');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        if (optionsDropdown) optionsDropdown.classList.add('hidden');
    });

    // Sound toggle
    if (soundToggleBtn) {
        soundToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            soundEnabled = !soundEnabled;
            if (soundEnabled) {
                soundToggleBtn.innerHTML = '<span class="dropdown-item-icon">🔊</span> Toggle Sound (On)';
                try { playTone(440, 'sine', 0.15, 0, 0.05); } catch (err) {}
            } else {
                soundToggleBtn.innerHTML = '<span class="dropdown-item-icon">🔇</span> Toggle Sound (Off)';
            }
            if (optionsDropdown) optionsDropdown.classList.add('hidden');
        });
    }

    // Clear chat history
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to clear all chat history?")) {
                messages = [DEFAULT_GREETING];
                saveChatHistory();
                if (chatMessages) {
                    chatMessages.innerHTML = '';
                    renderMessage(DEFAULT_GREETING);
                }
                try { playTone(300, 'sine', 0.2, 0, 0.05); } catch(err) {}
            }
            if (optionsDropdown) optionsDropdown.classList.add('hidden');
        });
    }

    // API Modal Event Listeners
    if (apiKeyBtn) {
        apiKeyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (optionsDropdown) optionsDropdown.classList.add('hidden');
            if (apiKeyInput) {
                apiKeyInput.value = storage.getItem('rockstar_groq_api_key') || '';
            }
            if (apiKeyModal) {
                apiKeyModal.classList.remove('hidden');
            }
        });
    }

    if (closeApiModalBtn) {
        closeApiModalBtn.addEventListener('click', () => {
            if (apiKeyModal) apiKeyModal.classList.add('hidden');
        });
    }

    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', () => {
            if (apiKeyInput) {
                const key = apiKeyInput.value.trim();
                if (key) {
                    storage.setItem('rockstar_groq_api_key', key);
                } else {
                    storage.removeItem('rockstar_groq_api_key');
                }
            }
            if (apiKeyModal) apiKeyModal.classList.add('hidden');
            try { playTone(600, 'sine', 0.1, 0, 0.05); } catch(err) {}
        });
    }

    // Close modal when clicking overlay background
    if (apiKeyModal) {
        apiKeyModal.addEventListener('click', (e) => {
            if (e.target === apiKeyModal) {
                apiKeyModal.classList.add('hidden');
            }
        });
    }

    // Persona Modal Event Listeners
    if (personaBtn) {
        personaBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (optionsDropdown) optionsDropdown.classList.add('hidden');
            
            const currentPersona = storage.getItem('rockstar_chatbot_persona') || 'friend';
            const customPersonaText = storage.getItem('rockstar_chatbot_custom_persona_text') || '';
            
            if (customPersonaInput) {
                customPersonaInput.value = customPersonaText;
            }
            
            personaCards.forEach(card => {
                const persona = card.getAttribute('data-persona');
                if (persona === currentPersona) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
            
            if (currentPersona === 'custom') {
                if (customPersonaContainer) customPersonaContainer.classList.remove('hidden');
            } else {
                if (customPersonaContainer) customPersonaContainer.classList.add('hidden');
            }
            
            if (personaModal) {
                personaModal.classList.remove('hidden');
            }
        });
    }

    if (closePersonaModalBtn) {
        closePersonaModalBtn.addEventListener('click', () => {
            if (personaModal) personaModal.classList.add('hidden');
        });
    }

    if (personaModal) {
        personaModal.addEventListener('click', (e) => {
            if (e.target === personaModal) {
                personaModal.classList.add('hidden');
            }
        });
    }

    personaCards.forEach(card => {
        card.addEventListener('click', () => {
            personaCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            const persona = card.getAttribute('data-persona');
            if (persona === 'custom') {
                if (customPersonaContainer) customPersonaContainer.classList.remove('hidden');
                if (customPersonaInput) customPersonaInput.focus();
            } else {
                if (customPersonaContainer) customPersonaContainer.classList.add('hidden');
            }
            try { playTone(500, 'sine', 0.08, 0, 0.05); } catch(err) {}
        });
    });

    if (savePersonaBtn) {
        savePersonaBtn.addEventListener('click', () => {
            let selectedPersona = 'friend';
            personaCards.forEach(card => {
                if (card.classList.contains('active')) {
                    selectedPersona = card.getAttribute('data-persona');
                }
            });
            
            let customText = '';
            if (customPersonaInput) {
                customText = customPersonaInput.value.trim();
            }
            
            storage.setItem('rockstar_chatbot_persona', selectedPersona);
            storage.setItem('rockstar_chatbot_custom_persona_text', customText);
            
            if (personaModal) personaModal.classList.add('hidden');
            try { playTone(600, 'sine', 0.1, 0, 0.05); } catch(err) {}
            
            // Immediately trigger persona-changed message from the bot
            let greetingText = "";
            if (selectedPersona === 'teacher') {
                greetingText = "📚 Class is in session! I'm now acting as your teacher and mentor. What subject are we focusing on today?";
            } else if (selectedPersona === 'brother') {
                greetingText = "👦 Yo! Big bro mode activated. I've got your back. What's on your mind?";
            } else if (selectedPersona === 'custom') {
                const desc = customText ? `"${customText}"` : "your custom characteristics";
                greetingText = `🎭 Understood! I've set my persona characteristics to: ${desc}. Let's chat. What can I help you with?`;
            } else {
                greetingText = "🎸 Back to friend mode! I'm ready to hang out and study together. Let's crush this!";
            }
            
            const systemAlertMsg = {
                sender: 'bot',
                text: greetingText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            messages.push(systemAlertMsg);
            saveChatHistory();
            renderMessage(systemAlertMsg);
            try { playReceiveSound(); } catch(err) {}
            scrollToBottom();
        });
    }

    // ==========================================================================
    // Core Layout Transitions
    // ==========================================================================
    if (startChatBtn) {
        startChatBtn.addEventListener('click', () => {
            console.log("Start Chat button clicked.");
            
            // Clean up landing interaction listeners
            document.removeEventListener('click', unmuteOnInteraction);
            document.removeEventListener('keydown', unmuteOnInteraction);
            
            // Pause video immediately to prevent audio bleed during fade transition
            if (heroVideo) {
                heroVideo.pause();
            }

            try {
                try {
                    initAudio();
                    playTone(523.25, 'sine', 0.2, 0, 0.1); 
                    playTone(659.25, 'sine', 0.25, 0.1, 0.1);
                } catch (audioError) {
                    console.warn('Audio Context initialization blocked or unsupported:', audioError);
                }

                if (heroSection) {
                    console.log("Hiding landing page card.");
                    heroSection.classList.add('fade-out');
                }

                setTimeout(() => {
                    try {
                        if (heroSection) heroSection.classList.add('hidden');
                        if (chatSection) {
                            console.log("Displaying chat interface.");
                            chatSection.classList.remove('hidden');
                            void chatSection.offsetWidth; // Force reflow
                            chatSection.classList.add('fade-in');
                        } else {
                            console.error("Chat section selector (#chat-section) not found!");
                        }

                        console.log("Loading history.");
                        loadChatHistory();
                        
                        if (chatInput) {
                            chatInput.focus();
                        }
                    } catch (innerErr) {
                        console.error("Error running transition layout change:", innerErr);
                        alert("Visual transition layout error: " + innerErr.message);
                    }
                }, 800);
            } catch (outerErr) {
                console.error("Error inside startChatBtn listener:", outerErr);
                alert("Initialization action error: " + outerErr.message);
            }
        });
    }

    // ==========================================================================
    // Input Handling
    // ==========================================================================
    if (chatInput) {
        chatInput.addEventListener('input', () => {
            if (!sendBtn) return;
            if (chatInput.value.trim() !== '') {
                sendBtn.removeAttribute('disabled');
            } else {
                sendBtn.setAttribute('disabled', 'true');
            }
        });
    }

    if (chatForm) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sendMessage();
        });
    }

    function sendMessage() {
        if (!chatInput) return;
        const text = chatInput.value.trim();
        if (text === '') return;

        try { playSendSound(); } catch(err) {}

        const userMsg = {
            sender: 'user',
            text: text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        messages.push(userMsg);
        saveChatHistory();
        renderMessage(userMsg);

        chatInput.value = '';
        if (sendBtn) sendBtn.setAttribute('disabled', 'true');

        scrollToBottom();
        getBotResponse(text);
    }

    // ==========================================================================
    // Bot Response Controller (Puter.js Free Keyless LLM)
    // ==========================================================================
    function getBotResponse(userText) {
        if (typingIndicator) typingIndicator.classList.remove('hidden');
        scrollToBottom();

        // Format history for API request
        // Grab the last 8 messages for context
        const recentHistory = messages.slice(-8).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text || ""
        }));

        const headers = {
            'Content-Type': 'application/json'
        };
        const savedKey = storage.getItem('rockstar_groq_api_key');
        if (savedKey) {
            headers['X-Groq-API-Key'] = savedKey;
        }

        const selectedPersona = storage.getItem('rockstar_chatbot_persona') || 'friend';
        const customPersonaText = storage.getItem('rockstar_chatbot_custom_persona_text') || '';

        // Try calling the local Python backend server first
        fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ 
                messages: recentHistory,
                persona: selectedPersona,
                customPersonaText: customPersonaText
            })
        })
        .then(async res => {
            if (!res.ok) {
                let errMsg = `Server returned status ${res.status}`;
                try {
                    const errData = await res.json();
                    if (errData && errData.error) errMsg = errData.error;
                } catch (e) {}
                throw new Error(errMsg);
            }
            return res.json();
        })
        .then(data => {
            if (typingIndicator) typingIndicator.classList.add('hidden');
            const botText = data.reply || "No reply received from server.";
            
            const botMsg = {
                sender: 'bot',
                text: botText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            messages.push(botMsg);
            saveChatHistory();
            renderMessage(botMsg);
            try { playReceiveSound(); } catch(err) {}
            scrollToBottom();
        })
        .catch(err => {
            console.warn("Python backend call failed, trying Puter.js fallback:", err);
            
            // Check if connection error (server not running)
            const isConnectionError = err.message.includes("Failed to fetch") || 
                                     err.name === "TypeError" || 
                                     err.message.includes("NetworkError");
            
            if (isConnectionError) {
                if (window.puter) {
                    callPuterFallback(recentHistory, "");
                } else {
                    showErrorOnChat("⚠️ Could not connect to the Python backend. Please start the server by running `python server.py` in your terminal and try again.");
                }
            } else {
                // If it is an API Key error or some other server-returned error, display it directly
                showErrorOnChat(`⚠️ Backend Error: ${err.message}`);
            }
        });
    }

    function callPuterFallback(recentHistory, warningPrefix = "") {
        const selectedPersona = storage.getItem('rockstar_chatbot_persona') || 'friend';
        const customPersonaText = storage.getItem('rockstar_chatbot_custom_persona_text') || '';
        
        let systemInstruction = "You are RockStar, a highly friendly, energetic, and helpful student companion and study partner. Answer student requests with concise, actionable, and encouraging advice. Use emojis where relevant. Keep it clean and readable. Always answer in character as RockStar.";
        
        if (selectedPersona === 'teacher') {
            systemInstruction = "You are RockStar, acting as a wise, patient, and knowledgeable teacher/mentor. Explain concepts in a clear, structured, and educational manner. Ask guiding questions to help the student learn, and provide constructive feedback. Keep it encouraging and readable. Always answer in character as a supportive teacher.";
        } else if (selectedPersona === 'brother') {
            systemInstruction = "You are RockStar, acting as a supportive, cool older brother. Speak in a casual, warm, and slightly teasing but highly caring tone. Use modern casual language/slang. Give down-to-earth advice, cheer the user on, and have their back. Keep it clean, fun, and readable. Always answer in character as a caring brother.";
        } else if (selectedPersona === 'custom') {
            systemInstruction = `You are RockStar, but you must adopt the following persona/characteristics: ${customPersonaText}. Answer the user's messages in character according to these guidelines. Keep it clean and readable.`;
        }

        const contents = [
            {
                role: "system",
                content: systemInstruction
            },
            ...recentHistory
        ];

        window.puter.ai.chat(contents)
        .then(response => {
            if (typingIndicator) typingIndicator.classList.add('hidden');
            
            let botText = "";
            if (typeof response === "string") {
                botText = response;
            } else if (response && typeof response === "object") {
                let target = response.message || response;
                
                if (typeof target === "string") {
                    botText = target;
                } else if (target && typeof target === "object") {
                    let content = target.content !== undefined ? target.content : target.text;
                    
                    if (typeof content === "string") {
                        botText = content;
                    } else if (Array.isArray(content)) {
                        botText = content
                            .map(item => {
                                if (typeof item === "string") return item;
                                if (item && typeof item === "object") return item.text || item.content || "";
                                return "";
                            })
                            .join("");
                    } else if (content && typeof content === "object") {
                        botText = content.text || content.content || JSON.stringify(content);
                    } else {
                        botText = target.text || target.content || JSON.stringify(target);
                    }
                } else {
                    botText = JSON.stringify(response);
                }
            } else {
                botText = "Hmm, I parsed that request but had trouble formulating a response. Mind trying again? 🧐";
            }

            const botMsg = {
                sender: 'bot',
                text: warningPrefix + botText,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            messages.push(botMsg);
            saveChatHistory();
            renderMessage(botMsg);
            try { playReceiveSound(); } catch(err) {}
            scrollToBottom();
        })
        .catch(err => {
            console.error("Puter fallback failed:", err);
            showErrorOnChat("⚠️ Both Python Backend and Puter.js fallback are currently unavailable.");
        });
    }

    function showErrorOnChat(errorText) {
        if (typingIndicator) typingIndicator.classList.add('hidden');
        const errorMsg = {
            sender: 'bot',
            text: errorText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        messages.push(errorMsg);
        saveChatHistory();
        renderMessage(errorMsg);
        try { playReceiveSound(); } catch(err) {}
        scrollToBottom();
    }

    // ==========================================================================
    // UI Helpers & LocalStorage Persistence
    // ==========================================================================
    function renderMessage(msg) {
        if (!chatMessages || !msg) return;
        const row = document.createElement('div');
        row.className = `message-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`;
        
        const safeText = escapeHTML(msg.text || "");
        const safeTime = escapeHTML(msg.timestamp || "");

        if (msg.sender === 'user') {
            row.innerHTML = `
                <div class="message-bubble-wrapper">
                    <div class="message-bubble">
                        <div class="message-text">${safeText}</div>
                    </div>
                    <span class="message-time">${safeTime}</span>
                </div>
            `;
        } else {
            row.innerHTML = `
                <div class="message-avatar">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="48" fill="#FFF8E7" stroke="#E6D3B3" stroke-width="2"/>
                        <rect x="18" y="42" width="10" height="16" rx="3" fill="#E2AB18"/>
                        <rect x="72" y="42" width="10" height="16" rx="3" fill="#E2AB18"/>
                        <rect x="47" y="16" width="6" height="12" fill="#E2AB18"/>
                        <circle cx="50" cy="14" r="6" fill="#F4C524"/>
                        <rect x="25" y="26" width="50" height="48" rx="15" fill="#F4C524" stroke="#D89E10" stroke-width="3"/>
                        <rect x="32" y="34" width="36" height="28" rx="8" fill="#202225"/>
                        <circle cx="43" cy="45" r="4.5" fill="#FFEAA7"/>
                        <circle cx="57" cy="45" r="4.5" fill="#FFEAA7"/>
                        <path d="M46 54C47.5 56 52.5 56 54 54" stroke="#FFEAA7" stroke-width="2.5" stroke-linecap="round"/>
                        <rect x="42" y="74" width="16" height="8" fill="#C08D0B"/>
                    </svg>
                </div>
                <div class="message-bubble-wrapper">
                    <div class="message-bubble">
                        <div class="message-text">${safeText}</div>
                    </div>
                    <span class="message-time">${safeTime}</span>
                </div>
            `;
        }
        
        chatMessages.appendChild(row);
    }

    function scrollToBottom() {
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function saveChatHistory() {
        storage.setItem('rockstar_chat_messages', JSON.stringify(messages));
    }

    function loadChatHistory() {
        if (!chatMessages) return;
        chatMessages.innerHTML = '';
        const saved = storage.getItem('rockstar_chat_messages');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    messages = parsed;
                } else {
                    messages = [DEFAULT_GREETING];
                }
            } catch (e) {
                messages = [DEFAULT_GREETING];
            }
        } else {
            messages = [DEFAULT_GREETING];
        }
        
        messages.forEach(msg => {
            if (msg) renderMessage(msg);
        });
        scrollToBottom();
    }

    function escapeHTML(str) {
        if (str === null || str === undefined) return "";
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ==========================================================================
    // Hero Video Sound Logic
    // ==========================================================================
    function updateHeroSoundIcon(isMuted) {
        if (!heroSoundIcon) return;
        if (isMuted) {
            heroSoundIcon.innerHTML = `
                <path d="M11 5L6 9H2V15H6L11 19V5Z" />
                <path d="M23 9L17 15M17 9L23 15" />
            `;
            if (heroSoundBtn) {
                heroSoundBtn.setAttribute('aria-label', 'Unmute Background Video');
                heroSoundBtn.title = 'Unmute Video';
            }
        } else {
            heroSoundIcon.innerHTML = `
                <path d="M11 5L6 9H2V15H6L11 19V5Z" />
                <path d="M15.54 8.46c.94.94 1.46 2.2 1.46 3.54s-.52 2.6-1.46 3.54M19.07 4.93c1.88 1.88 2.93 4.42 2.93 7.07s-1.05 5.19-2.93 7.07" />
            `;
            if (heroSoundBtn) {
                heroSoundBtn.setAttribute('aria-label', 'Mute Background Video');
                heroSoundBtn.title = 'Mute Video';
            }
        }
    }

    if (heroSoundBtn && heroVideo) {
        heroSoundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Toggle mute state
            heroVideo.muted = !heroVideo.muted;
            updateHeroSoundIcon(heroVideo.muted);
            
            // In case it was paused, play it
            if (heroVideo.paused) {
                heroVideo.play().catch(err => console.warn("Failed to play video:", err));
            }
        });
    }

    // Try to autoplay with sound on load, fallback to muted if blocked
    if (heroVideo) {
        // Set initially to unmuted to try unmuted autoplay
        heroVideo.muted = false;
        
        const playPromise = heroVideo.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log("Hero video autoplayed with sound.");
                updateHeroSoundIcon(false);
            }).catch(error => {
                console.warn("Hero video autoplay with sound was blocked. Falling back to muted autoplay.");
                heroVideo.muted = true;
                heroVideo.play().catch(err => console.error("Muted autoplay also failed:", err));
                updateHeroSoundIcon(true);
            });
        } else {
            updateHeroSoundIcon(heroVideo.muted);
        }
    }

    // Unmute on first user interaction anywhere if currently muted
    function unmuteOnInteraction() {
        if (heroVideo && heroVideo.muted) {
            heroVideo.muted = false;
            updateHeroSoundIcon(false);
            heroVideo.play().catch(err => console.warn(err));
        }
        document.removeEventListener('click', unmuteOnInteraction);
        document.removeEventListener('keydown', unmuteOnInteraction);
    }
    
    document.addEventListener('click', unmuteOnInteraction);
    document.addEventListener('keydown', unmuteOnInteraction);
});
