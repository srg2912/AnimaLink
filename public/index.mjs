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
    const continueToGameButtonElement = document.getElementById('continueToGameButton'); // Renamed to avoid conflict
    const userDataSubmitButton = document.getElementById('userDataSubmitButton');

    // Game Screen Elements
    const backgroundImage = document.getElementById('background-image');
    const characterSprite = document.getElementById('character-sprite');
    const messageDisplay = document.getElementById('message-display');
    const userMessageInput = document.getElementById('userMessageInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const actionSelector = document.getElementById('actionSelector');
    const performActionButton = document.getElementById('performActionButton');
    
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
    let currentCharacterSetupData = {}; 
    let currentCharacterPersonalityText = '';

    // --- Helper Functions ---
    function showScreen(screenId) {
        Object.values(screens).forEach(screen => screen.style.display = 'none');
        if (screens[screenId]) {
            screens[screenId].style.display = 'block';
            const appContainer = document.getElementById('app-container');
            if (screenId === 'game') {
                 appContainer.style.maxWidth = '100vw';
                 appContainer.style.padding = '0';
                 appContainer.style.backgroundColor = 'transparent'; // Game screen has its own bg
            } else {
                 appContainer.style.maxWidth = '800px';
                 appContainer.style.padding = '20px'; // Re-apply padding for form screens
                 appContainer.style.backgroundColor = 'transparent'; // Let body bg show through
            }
        } else {
            console.error("Screen not found:", screenId);
        }
    }

    function displayError(element, message) {
        const finalMessage = message || "An unknown error occurred.";
        if (element) {
            element.textContent = finalMessage;
            // No more alert spam, error is displayed on screen
        } else {
            console.error("Error display element not found. Message:", finalMessage);
            alert(finalMessage); // Fallback alert
        }
         if(message && element) element.style.display = 'block';
         else if (element) element.style.display = 'none';
    }

    async function apiRequest(url, method, body, errorElement, isInitialCheck = false) {
        try {
            const options = {
                method: method,
                headers: { 'Content-Type': 'application/json' },
            };
            if (body) {
                options.body = JSON.stringify(body);
            }
            const response = await fetch(url, options);
            
            if (errorElement) displayError(errorElement, '');

            if (response.status === 204) {
                return { success: true, status: response.status };
            }

            // For initial checks, a 404 might be expected (e.g. data not found)
            // and isn't necessarily an "error" to display prominently yet.
            if (isInitialCheck && response.status === 404) {
                // Try to parse JSON still, backend might send { error: "..." }
                const responseDataOnError = await response.json().catch(() => ({ notFound: true }));
                return responseDataOnError; 
            }

            const responseData = await response.json().catch(e => {
                return { parseError: true, status: response.status, text: response.text() }; 
            });

            if (responseData.parseError) {
                const text = await responseData.text;
                if (!isInitialCheck) displayError(errorElement, `Server returned non-JSON response (Status ${responseData.status}).`);
                return null;
            }

            if (!response.ok) {
                // For initial checks, don't always display error if it's just "not found"
                if (!isInitialCheck || (responseData && responseData.error && response.status !== 404)) {
                    displayError(errorElement, responseData?.error || `Request failed: ${response.status} ${response.statusText}`);
                }
                return responseData; // Return error responseData for initial checks to inspect
            }
            return responseData;
        } catch (error) {
            if (!isInitialCheck) displayError(errorElement, `Network error: ${error.message}`);
            return { networkError: true, message: error.message }; // Indicate network error for initial checks
        }
    }

    function addMessageToDisplay(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(role === 'user' ? 'user-message' : 'assistant-message');
        // Sanitize content before setting as textContent to prevent XSS if content could be HTML
        // For now, assuming content is plain text from LLM. If it could be HTML, use a sanitizer.
        messageDiv.textContent = content;
        messageDisplay.appendChild(messageDiv);
        messageDisplay.scrollTop = messageDisplay.scrollHeight; 
    }

    async function changeSprite(spriteName) {
        if (!currentSpriteFolder || !spriteName) {
            console.warn("Attempted to change sprite without folder or name:", currentSpriteFolder, spriteName);
            // Fallback to a default if possible, or ensure normal.png exists
            if (currentSpriteFolder && !spriteName) spriteName = 'normal.png';
            else return;
        }
        
        characterSprite.style.opacity = 0;

        setTimeout(() => {
            const newSrc = `/assets/sprites/${currentSpriteFolder}/${spriteName}`;
            characterSprite.src = newSrc;
            characterSprite.onload = () => {
                characterSprite.style.opacity = 1; 
            };
            characterSprite.onerror = () => {
                console.error(`Failed to load sprite: ${newSrc}. Trying normal.png.`);
                characterSprite.src = `/assets/sprites/${currentSpriteFolder}/normal.png`; 
                characterSprite.style.opacity = 1;
            };
        }, 300); // Shorter transition for snappier feel
    }

    async function initializeApp() {
        // 1. Check API Key Status
        const apiKeyStatus = await apiRequest('/api/status/api_key', 'GET', null, null, true);

        if (!apiKeyStatus || apiKeyStatus.networkError || !apiKeyStatus.configured) {
            // If network error, or explicitly not configured, or status check fails unexpectedly
            showScreen('apiKey');
            if (apiKeyStatus && apiKeyStatus.message && !apiKeyStatus.configured) {
                // Optionally display a subtle message if server said "not configured"
                console.info("API Key status:", apiKeyStatus.message);
            }
            return;
        }

        // 2. API Key is configured, check User Data
        // Pass `true` for isInitialCheck to apiRequest
        const userDataResponse = await apiRequest('/api/user_data', 'GET', null, null, true); 
        
        // userDataResponse will be null on network error, or an object.
        // If 404, it might have { error: "User data not found." } or { notFound: true }
        // If 200, it's the user data.
        if (userDataResponse && userDataResponse.name && !userDataResponse.error) { // Ensure it's actual data, not an error obj
            currentUserData = userDataResponse;

            // 3. User Data exists, check Character Profile
            const charProfileResponse = await apiRequest('/api/personality', 'GET', null, null, true);
            if (charProfileResponse && charProfileResponse.profile && charProfileResponse.general?.sprite && !charProfileResponse.error) {
                currentCharacterPersonalityText = charProfileResponse.profile;
                currentCharacterSetupData = charProfileResponse.general; // Store the whole general object
                currentSpriteFolder = charProfileResponse.general.sprite;
                
                generatedPersonalityTextarea.value = currentCharacterPersonalityText;
                forms.characterCreate.name.value = currentCharacterSetupData.name || '';
                forms.characterCreate.looks.value = currentCharacterSetupData.looks || '';
                // The 'personality' in characterCreate form is the user's *description input*, not the generated profile
                // So, we don't pre-fill it from generatedPersonalityTextarea here unless that's desired for editing.
                // For now, assume currentCharacterSetupData might hold the original input if we stored it.
                // If not, it will be blank if editing an existing profile from scratch.
                forms.characterCreate.personality.value = currentCharacterSetupData.rawPersonalityInput || ''; // Hypothetical field
                forms.characterCreate.language.value = currentCharacterSetupData.language || 'English';
                forms.characterCreate.sprite.value = currentSpriteFolder || '';
                
                await goToGameScreen(true);
            } else {
                // User data exists, but no character profile
                prefillUserDataForm(); // Ensure user data form is pre-filled for context if they go back
                showScreen('characterSetup');
            }
        } else {
            // API Key OK, but No User Data (or error fetching it other than network)
            showScreen('userData');
        }
    }
    
    function prefillUserDataForm() {
        if (currentUserData && currentUserData.name) {
            forms.userData.name.value = currentUserData.name || '';
            forms.userData.gender.value = currentUserData.gender || '';
            forms.userData.pronouns.value = currentUserData.pronouns || '';
            forms.userData.age.value = currentUserData.age || '';
            forms.userData.nickname.value = currentUserData.nickname || '';
            forms.userData.hobbies.value = currentUserData.hobbies || '';
            forms.userData.personality.value = currentUserData.personality || '';
        }
    }

    async function goToGameScreen(loadingExisting = false) {
        if (!currentSpriteFolder) {
            displayError(errorMessages.gameScreen, "Error: Sprite folder not set. Please complete character setup.");
            showScreen('characterSetup'); // Go back if something is wrong
            return;
        }
        backgroundImage.src = '/assets/backgrounds/living_room.png';
        
        if (loadingExisting) {
            // If loading an existing game, try to fetch last message for context or sprite
            const shortTermMemory = await apiRequest('/api/memory/short_term', 'GET', null, null);
            if (shortTermMemory && shortTermMemory.length > 0) {
                const lastAssistantMessage = [...shortTermMemory].reverse().find(msg => msg.role === 'assistant');
                if (lastAssistantMessage && lastAssistantMessage.sprite) {
                    changeSprite(lastAssistantMessage.sprite);
                } else {
                    changeSprite('normal.png');
                }
                // Optionally populate some recent messages
                messageDisplay.innerHTML = ''; // Clear previous messages
                shortTermMemory.slice(-6).forEach(msg => addMessageToDisplay(msg.role, msg.content));

            } else {
                changeSprite('normal.png'); // Default if no history
            }
        } else {
            changeSprite('normal.png'); // Default sprite for new game
        }
        showScreen('game');
    }

    // --- Event Listeners ---

    // API Key Form
    forms.apiKey.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(forms.apiKey);
        const data = Object.fromEntries(formData.entries());
        // Pass errorMessages.apiKey for displaying errors directly related to this form submission
        const result = await apiRequest('/api/api_key', 'POST', data, errorMessages.apiKey); 
        if (result && result.model) { // POST to /api/api_key returns the saved data
            // API Key saved, now re-evaluate the flow as if starting initializeApp's checks
            const userDataResponse = await apiRequest('/api/user_data', 'GET', null, null, true);
            if (userDataResponse && userDataResponse.name && !userDataResponse.error) {
                currentUserData = userDataResponse;
                const charProfileResponse = await apiRequest('/api/personality', 'GET', null, null, true);
                if (charProfileResponse && charProfileResponse.profile && charProfileResponse.general?.sprite && !charProfileResponse.error) {
                    currentCharacterPersonalityText = charProfileResponse.profile;
                    currentCharacterSetupData = charProfileResponse.general;
                    currentSpriteFolder = charProfileResponse.general.sprite;
                    generatedPersonalityTextarea.value = currentCharacterPersonalityText;
                    await goToGameScreen(true);
                } else {
                    prefillUserDataForm();
                    showScreen('characterSetup');
                }
            } else {
                showScreen('userData');
            }
        }
    });

    // User Data Form
    forms.userData.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(forms.userData);
        let data = Object.fromEntries(formData.entries());

        let result;
        if (isUserDataEditing) {
            result = await apiRequest('/api/user_data', 'PATCH', data, errorMessages.userData);
        } else {
            result = await apiRequest('/api/user_data', 'POST', data, errorMessages.userData);
        }

        if (result && (result.name || (result.status === 201 || result.status === 200) ) && !result.error ) {
            if (result.name) currentUserData = result; 
            else currentUserData = {...currentUserData, ...data}; 

            if (isUserDataEditing) {
                alert('User data updated successfully!');
                optionsModal.style.display = 'none'; 
                isUserDataEditing = false;
                userDataSubmitButton.textContent = 'Save User Data';
            } else {
                alert('User data saved successfully!');
                const charProfileResponse = await apiRequest('/api/personality', 'GET', null, null, true);
                if (charProfileResponse && charProfileResponse.profile && charProfileResponse.general?.sprite && !charProfileResponse.error) {
                    currentCharacterPersonalityText = charProfileResponse.profile;
                    currentCharacterSetupData = charProfileResponse.general;
                    currentSpriteFolder = charProfileResponse.general.sprite;
                    generatedPersonalityTextarea.value = currentCharacterPersonalityText;
                    await goToGameScreen(true);
                } else {
                    showScreen('characterSetup');
                }
            }
        }
    });

    // Character Create Form
    forms.characterCreate.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(forms.characterCreate);
        const data = Object.fromEntries(formData.entries());
        
        const result = await apiRequest('/api/personality', 'POST', data, errorMessages.characterCreate);
        if (result && result.characterProfile) {
            currentCharacterPersonalityText = result.characterProfile;
            currentCharacterSetupData = data; // Store the submitted form data for name, looks, sprite
            generatedPersonalityTextarea.value = result.characterProfile;
            characterEditSection.style.display = 'block';
            currentSpriteFolder = data.sprite; 
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
            if (isCharacterProfileEditing) { 
                optionsModal.style.display = 'none';
                isCharacterProfileEditing = false;
                characterEditSection.style.display = 'none'; // Hide edit section
                forms.characterCreate.style.display = 'block';
                continueToGameButtonElement.style.display = 'inline-block'; 
                // No automatic screen change, stay in current context (e.g. game)
            } else {
                 // If was in initial setup, stay on characterSetup screen to click "Continue"
                 characterEditSection.style.display = 'block'; // Keep it visible
            }
        }
    });
    
    // Continue to Game Button (from initial setup)
    continueToGameButtonElement.addEventListener('click', () => {
        goToGameScreen(false); // Not loading existing, it's a new setup
    });

    async function handleInteractionResponse(result) {
        if (result && result.content) {
            addMessageToDisplay('assistant', result.content);
            if (result.sprite) {
                changeSprite(result.sprite);
            }
        } else {
            addMessageToDisplay('assistant', 'Sorry, I had trouble responding to that action.');
            displayError(errorMessages.gameScreen, result?.error || "LLM interaction request failed.");
        }
    }

    // Send Message
    sendMessageButton.addEventListener('click', async () => {
        const messageText = userMessageInput.value.trim();
        if (!messageText) return;

        addMessageToDisplay('user', messageText);
        userMessageInput.value = '';
        sendMessageButton.disabled = true;

        const result = await apiRequest('/api/message', 'POST', { message: messageText }, errorMessages.gameScreen);
        
        sendMessageButton.disabled = false;
        handleInteractionResponse(result);
    });
    userMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessageButton.click();
        }
    });

    // Perform Action Button
    performActionButton.addEventListener('click', async () => {
        const selectedAction = actionSelector.value;
        if (!selectedAction) return;

        // Optionally display a system message for the user's action
        // addMessageToDisplay('user', `(You performed action: ${selectedAction})`);
        performActionButton.disabled = true;

        const result = await apiRequest(`/api/interact/${selectedAction}`, 'POST', {}, errorMessages.gameScreen);
        
        performActionButton.disabled = false;
        handleInteractionResponse(result);
    });


    // --- Options Modal Logic ---
    optionsButton.addEventListener('click', () => optionsModal.style.display = 'block');
    closeOptionsModalButton.addEventListener('click', () => optionsModal.style.display = 'none');
    
    function closeModalOnClickOutside(event) {
        if (event.target === optionsModal) {
            optionsModal.style.display = 'none';
        }
        if (event.target === memoryViewerModal) {
            memoryViewerModal.style.display = 'none';
        }
    }
    window.addEventListener('click', closeModalOnClickOutside);


    optChangeApiKey.addEventListener('click', () => {
        optionsModal.style.display = 'none';
        showScreen('apiKey');
        forms.apiKey.reset(); 
    });

    optChangeUserData.addEventListener('click', () => {
        optionsModal.style.display = 'none';
        isUserDataEditing = true;
        userDataSubmitButton.textContent = 'Update User Data';
        prefillUserDataForm(); // Use the helper to pre-fill
        showScreen('userData');
    });
    
    optChangeCharProfile.addEventListener('click', () => {
        optionsModal.style.display = 'none';
        isCharacterProfileEditing = true;
        
        forms.characterCreate.name.value = currentCharacterSetupData.name || '';
        forms.characterCreate.looks.value = currentCharacterSetupData.looks || '';
        // The textarea 'charPersonalityDesc' is the *original* description.
        // The 'generatedPersonalityTextarea' is for the LLM-generated or edited profile.
        forms.characterCreate.personality.value = currentCharacterSetupData.personality || ''; 
        forms.characterCreate.language.value = currentCharacterSetupData.language || '';
        forms.characterCreate.sprite.value = currentSpriteFolder || ''; // currentCharacterSetupData.sprite
        
        generatedPersonalityTextarea.value = currentCharacterPersonalityText; // The actual profile text
        
        characterEditSection.style.display = 'block';
        forms.characterCreate.style.display = 'none'; 
        continueToGameButtonElement.style.display = 'none';

        showScreen('characterSetup');
    });

    async function showMemory(type) {
        const endpoint = type === 'shortTerm' ? '/api/memory/short_term' : '/api/memory/long_term';
        const title = type === 'shortTerm' ? 'Chat History (Short-Term Memory)' : "Character's Diary (Long-Term Memory)";
        
        // Pass null for errorElement, as modal has its own feedback structure
        const data = await apiRequest(endpoint, 'GET', null, null); 
        
        memoryViewerTitle.textContent = title;
        memoryViewerContent.innerHTML = ''; 

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
                    li.style.border = '1px solid rgba(255,255,255,0.2)';
                    li.style.borderRadius = '4px';
                    
                    let contentHTML = `<strong>${entry.role || 'Entry'} (${new Date(entry.timestamp).toLocaleString()}):</strong><br>`;
                    if (entry.sprite) contentHTML += `(Sprite: ${entry.sprite})<br>`;
                    // Create a text node for content to prevent XSS if it somehow contains HTML
                    const contentTextNode = document.createTextNode(entry.content);
                    li.innerHTML = contentHTML;
                    li.appendChild(contentTextNode);
                    ul.appendChild(li);
                });
                memoryViewerContent.appendChild(ul);
            }
        } else {
            memoryViewerContent.textContent = `Failed to load ${type === 'shortTerm' ? 'chat history' : 'diary'}. Server might be down or endpoint misconfigured. (Expected ${endpoint})`;
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
    initializeApp();
});