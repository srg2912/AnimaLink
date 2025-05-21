document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const screens = {
        apiKey: document.getElementById('api-key-screen'),
        userData: document.getElementById('user-data-screen'),
        characterSetup: document.getElementById('character-setup-screen'),
        game: document.getElementById('game-screen'),
    };

    const forms = {
        apiKey: document.getElementById('apiKeyForm'),
        userData: document.getElementById('userDataForm'),
        characterCreate: document.getElementById('characterCreateForm'),
    };

    const errorMessages = {
        apiKey: document.getElementById('apiKeyError'),
        userData: document.getElementById('userDataError'),
        characterCreate: document.getElementById('characterCreateError'),
        characterEdit: document.getElementById('characterEditError'),
        gameScreen: document.getElementById('gameScreenError'),
    };

    const characterEditSection = document.getElementById('character-edit-section');
    const generatedPersonalityTextarea = document.getElementById('generatedPersonality');
    const saveEditedPersonalityButton = document.getElementById('saveEditedPersonality');
    const continueToGameButton = document.getElementById('continueToGame');
    const userDataSubmitButton = document.getElementById('userDataSubmitButton');

    // Game Screen Elements
    const backgroundImage = document.getElementById('background-image');
    const characterSprite = document.getElementById('character-sprite');
    const messageDisplay = document.getElementById('message-display');
    const userMessageInput = document.getElementById('userMessageInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    
    // Options Modal Elements
    const optionsButton = document.getElementById('optionsButton');
    const optionsModal = document.getElementById('options-modal');
    const closeOptionsModalButton = document.getElementById('closeOptionsModal');
    const optChangeApiKey = document.getElementById('optChangeApiKey');
    const optChangeUserData = document.getElementById('optChangeUserData');
    const optChangeCharProfile = document.getElementById('optChangeCharProfile');
    const optViewShortTermMemory = document.getElementById('optViewShortTermMemory');
    const optViewLongTermMemory = document.getElementById('optViewLongTermMemory');

    // Memory Viewer Modal
    const memoryViewerModal = document.getElementById('memory-viewer-modal');
    const closeMemoryViewerModalButton = document.getElementById('closeMemoryViewerModal');
    const memoryViewerTitle = document.getElementById('memoryViewerTitle');
    const memoryViewerContent = document.getElementById('memoryViewerContent');
    
    // --- State Variables ---
    let currentSpriteFolder = '';
    let isUserDataEditing = false;
    let isCharacterProfileEditing = false;
    let currentUserData = {};
    let currentCharacterSetupData = {}; // To store initial {name, looks, sprite, language} for editing
    let currentCharacterPersonalityText = ''; // Store the personality text for editing


    // --- Helper Functions ---
    function showScreen(screenId) {
        Object.values(screens).forEach(screen => screen.style.display = 'none');
        if (screens[screenId]) {
            screens[screenId].style.display = 'block';
            // Special handling for game screen to take full viewport width if desired
            if (screenId === 'game') {
                 document.getElementById('app-container').style.maxWidth = '100vw';
                 document.getElementById('app-container').style.padding = '0';

            } else {
                 document.getElementById('app-container').style.maxWidth = '800px';
                 document.getElementById('app-container').style.padding = '20px';
            }
        }
    }

    function displayError(element, message) {
        if (element) {
            element.textContent = message;
            if (message) alert(message); // Also show an alert for immediate feedback
        } else {
            alert(message);
        }
    }

    async function apiRequest(url, method, body, errorElement) {
        try {
            const options = {
                method: method,
                headers: { 'Content-Type': 'application/json' },
            };
            if (body) {
                options.body = JSON.stringify(body);
            }
            const response = await fetch(url, options);
            const responseData = await response.json().catch(() => null); // Catch if no JSON body

            if (!response.ok) {
                const errorMsg = responseData?.error || `Request failed with status ${response.status}`;
                displayError(errorElement, errorMsg);
                return null;
            }
            if (errorElement) errorElement.textContent = ''; // Clear previous error
            return responseData || { success: true, status: response.status }; // Handle 204 no content
        } catch (error) {
            displayError(errorElement, `Network error: ${error.message}`);
            return null;
        }
    }

    function addMessageToDisplay(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(role === 'user' ? 'user-message' : 'assistant-message');
        messageDiv.textContent = content;
        messageDisplay.appendChild(messageDiv);
        messageDisplay.scrollTop = messageDisplay.scrollHeight; // Auto-scroll
    }

    async function changeSprite(spriteName) {
        if (!currentSpriteFolder || !spriteName) return;
        
        characterSprite.style.opacity = 0; // Start fade out

        // Wait for fade out, then change src, then fade in
        setTimeout(() => {
            characterSprite.src = `/assets/sprites/${currentSpriteFolder}/${spriteName}`;
            characterSprite.onload = () => {
                characterSprite.style.opacity = 1; // Fade in
            };
            characterSprite.onerror = () => {
                console.error(`Failed to load sprite: /assets/sprites/${currentSpriteFolder}/${spriteName}`);
                // Fallback or error message if needed
                characterSprite.src = `/assets/sprites/${currentSpriteFolder}/normal.png`; // Try default
                characterSprite.style.opacity = 1;
            };
        }, 500); // Match CSS transition time
    }

    // --- Event Listeners ---

    // API Key Form
    forms.apiKey.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(forms.apiKey);
        const data = Object.fromEntries(formData.entries());
        const result = await apiRequest('/api/api_key', 'POST', data, errorMessages.apiKey);
        if (result && result.model) {
            alert('API Key saved successfully!');
            showScreen('userData');
        }
    });

    // User Data Form (Handles both POST and PATCH)
    forms.userData.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(forms.userData);
        const data = Object.fromEntries(formData.entries());

        // Convert hobbies string to array if needed, or ensure backend handles string
        // For now, sending as string as backend seems to expect it.

        let result;
        if (isUserDataEditing) {
            result = await apiRequest('/api/user_data', 'PATCH', data, errorMessages.userData);
        } else {
            result = await apiRequest('/api/user_data', 'POST', data, errorMessages.userData);
        }

        if (result && (result.name || result.status === 201)) { // POST returns data, PATCH returns data
            currentUserData = result; // Store/update current user data
            alert('User data saved successfully!');
            if (isUserDataEditing) {
                optionsModal.style.display = 'none'; // Close options modal
                isUserDataEditing = false;
                userDataSubmitButton.textContent = 'Save User Data'; // Reset button text
            } else {
                showScreen('characterSetup');
            }
        }
    });

    // Character Create Form
    forms.characterCreate.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(forms.characterCreate);
        const data = Object.fromEntries(formData.entries());
        currentCharacterSetupData = data; // Store for potential editing later in options

        const result = await apiRequest('/api/personality', 'POST', data, errorMessages.characterCreate);
        if (result && result.characterProfile) {
            currentCharacterPersonalityText = result.characterProfile;
            generatedPersonalityTextarea.value = result.characterProfile;
            characterEditSection.style.display = 'block';
            currentSpriteFolder = data.sprite; // Save sprite folder
        }
    });

    // Save Edited Personality
    saveEditedPersonalityButton.addEventListener('click', async () => {
        const editedProfile = generatedPersonalityTextarea.value;
        if (!editedProfile.trim()) {
            displayError(errorMessages.characterEdit, 'Personality cannot be empty.');
            return;
        }
        const result = await apiRequest('/api/personality', 'PATCH', { edit: editedProfile }, errorMessages.characterEdit);
        if (result && result.characterProfile) {
            currentCharacterPersonalityText = result.characterProfile;
            alert('Character profile updated!');
            if (isCharacterProfileEditing) { // If editing from options menu
                optionsModal.style.display = 'none';
                isCharacterProfileEditing = false;
                // Restore normal char setup screen elements if they were hidden
                forms.characterCreate.style.display = 'block';
                continueToGameButton.style.display = 'inline-block'; // Show continue if hidden
            }
            // No automatic transition to game here, user clicks "Continue to Game"
        }
    });
    
    // Continue to Game
    continueToGameButton.addEventListener('click', () => {
        if (!currentSpriteFolder) {
            alert("Error: Sprite folder not set. Please complete character setup.");
            return;
        }
        backgroundImage.src = '/assets/backgrounds/living_room.png'; // Default background
        changeSprite('normal.png'); // Default sprite
        showScreen('game');
    });

    // Send Message
    sendMessageButton.addEventListener('click', async () => {
        const messageText = userMessageInput.value.trim();
        if (!messageText) return;

        addMessageToDisplay('user', messageText);
        userMessageInput.value = '';
        sendMessageButton.disabled = true;

        const result = await apiRequest('/api/message', 'POST', { message: messageText }, errorMessages.gameScreen);
        
        sendMessageButton.disabled = false;
        if (result && result.content) {
            addMessageToDisplay('assistant', result.content);
            if (result.sprite) {
                changeSprite(result.sprite);
            }
        } else {
            addMessageToDisplay('assistant', 'Sorry, I had trouble responding.');
        }
    });
    userMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessageButton.click();
        }
    });


    // --- Options Modal Logic ---
    optionsButton.addEventListener('click', () => optionsModal.style.display = 'block');
    closeOptionsModalButton.addEventListener('click', () => optionsModal.style.display = 'none');
    window.addEventListener('click', (event) => { // Close if clicked outside
        if (event.target === optionsModal) {
            optionsModal.style.display = 'none';
        }
        if (event.target === memoryViewerModal) {
            memoryViewerModal.style.display = 'none';
        }
    });

    optChangeApiKey.addEventListener('click', () => {
        optionsModal.style.display = 'none';
        showScreen('apiKey');
        // Clear form fields if needed, or pre-fill if API key was stored (not typical for keys)
        forms.apiKey.reset(); 
    });

    optChangeUserData.addEventListener('click', () => {
        optionsModal.style.display = 'none';
        isUserDataEditing = true;
        userDataSubmitButton.textContent = 'Update User Data';
        // Pre-fill form
        forms.userData.name.value = currentUserData.name || '';
        forms.userData.gender.value = currentUserData.gender || '';
        forms.userData.pronouns.value = currentUserData.pronouns || '';
        forms.userData.age.value = currentUserData.age || '';
        forms.userData.nickname.value = currentUserData.nickname || '';
        forms.userData.hobbies.value = currentUserData.hobbies || '';
        forms.userData.personality.value = currentUserData.personality || '';
        showScreen('userData');
    });
    
    optChangeCharProfile.addEventListener('click', () => {
        optionsModal.style.display = 'none';
        isCharacterProfileEditing = true;
        
        // Pre-fill character creation form for context, though it won't be submitted again for generation
        // The main part is editing the personality text.
        forms.characterCreate.name.value = currentCharacterSetupData.name || '';
        forms.characterCreate.looks.value = currentCharacterSetupData.looks || '';
        forms.characterCreate.personality.value = currentCharacterSetupData.personality || ''; // Original description
        forms.characterCreate.language.value = currentCharacterSetupData.language || '';
        forms.characterCreate.sprite.value = currentCharacterSetupData.sprite || '';
        
        generatedPersonalityTextarea.value = currentCharacterPersonalityText;
        
        characterEditSection.style.display = 'block';
        forms.characterCreate.style.display = 'none'; // Hide initial generation form
        continueToGameButton.style.display = 'none'; // Hide continue button during this edit mode

        showScreen('characterSetup');
    });

    async function showMemory(type) {
        const endpoint = type === 'shortTerm' ? '/api/memory/short_term' : '/api/memory/long_term';
        const title = type === 'shortTerm' ? 'Chat History (Short-Term Memory)' : "Character's Diary (Long-Term Memory)";
        
        const data = await apiRequest(endpoint, 'GET', null, null); // No specific error element for this modal
        
        memoryViewerTitle.textContent = title;
        memoryViewerContent.innerHTML = ''; // Clear previous

        if (data && Array.isArray(data)) {
            if (data.length === 0) {
                memoryViewerContent.textContent = 'No entries found.';
            } else {
                const ul = document.createElement('ul');
                ul.style.listStyleType = 'none';
                ul.style.paddingLeft = '0';
                data.forEach(entry => {
                    const li = document.createElement('li');
                    li.style.marginBottom = '10px';
                    li.style.padding = '8px';
                    li.style.border = '1px solid #eee';
                    li.style.borderRadius = '4px';
                    
                    let content = `<strong>${entry.role || 'Entry'} (${new Date(entry.timestamp).toLocaleString()}):</strong><br>`;
                    if (entry.sprite) content += `(Sprite: ${entry.sprite})<br>`;
                    content += entry.content;
                    li.innerHTML = content;
                    ul.appendChild(li);
                });
                memoryViewerContent.appendChild(ul);
            }
        } else {
            memoryViewerContent.textContent = `Failed to load ${type === 'shortTerm' ? 'chat history' : 'diary'}. Ensure backend endpoints GET /api/memory/short_term and GET /api/memory/long_term are available.`;
        }
        memoryViewerModal.style.display = 'block';
    }

    optViewShortTermMemory.addEventListener('click', () => {
        optionsModal.style.display = 'none';
        showMemory('shortTerm');
    });
    
    optViewLongTermMemory.addEventListener('click', () => {
        optionsModal.style.display = 'none';
        showMemory('longTerm');
    });

    closeMemoryViewerModalButton.addEventListener('click', () => memoryViewerModal.style.display = 'none');


    // --- Initial Setup ---
    showScreen('apiKey'); // Start with API Key screen
    // Or, if you want to persist state across sessions (e.g. using localStorage to remember API key setup)
    // you could check localStorage here and potentially skip to user data or character setup.
    // For now, always starts fresh.
});