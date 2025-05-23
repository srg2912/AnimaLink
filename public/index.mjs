// index.mjs
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
    
    const apiKeySupportsVisionCheckbox = document.getElementById('apiKeySupportsVision'); // In API Key form

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
    const continueToGameButtonElement = document.getElementById('continueToGameButton');
    const userDataSubmitButton = document.getElementById('userDataSubmitButton');

    // Game Screen Elements
    const backgroundImage = document.getElementById('background-image');
    const characterSprite = document.getElementById('character-sprite');
    const messageDisplay = document.getElementById('message-display');
    const userMessageInput = document.getElementById('userMessageInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const actionSelector = document.getElementById('actionSelector');
    const performActionButton = document.getElementById('performActionButton');
    const attachImageButton = document.getElementById('attachImageButton');
    const imageUploadInput = document.getElementById('imageUpload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('imagePreview');
    const removeImagePreviewButton = document.getElementById('removeImagePreviewButton');
    
    // Options Modal Elements
    const optionsButton = document.getElementById('optionsButton');
    const optionsModal = document.getElementById('options-modal');
    const closeOptionsModalButton = document.getElementById('closeOptionsModal');
    const supportsVisionCheckbox = document.getElementById('supportsVisionCheckbox');
    const optChangeApiKey = document.getElementById('optChangeApiKey');
    const optChangeUserData = document.getElementById('optChangeUserData');
    const optChangeCharProfile = document.getElementById('optChangeCharProfile');
    const optViewShortTermMemory = document.getElementById('optViewShortTermMemory');
    const optViewLongTermMemory = document.getElementById('optViewLongTermMemory');
    const optCreateBackupButton = document.getElementById('optCreateBackup');
    const optRestoreCharacterButton = document.getElementById('optRestoreCharacter');
    const optCreateNewCharacterButton = document.getElementById('optCreateNewCharacter');

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
    let visionSupportedByCurrentModel = false;
    let selectedImageBase64 = null;


    // --- Helper Functions ---
    function showScreen(screenId) {
        Object.values(screens).forEach(screen => screen.style.display = 'none');
        if (screens[screenId]) {
            screens[screenId].style.display = 'block';
            const appContainer = document.getElementById('app-container');
            if (screenId === 'game') {
                 appContainer.style.maxWidth = '100vw';
                 appContainer.style.padding = '0';
                 appContainer.style.backgroundColor = 'transparent'; 
            } else {
                 appContainer.style.maxWidth = '800px';
                 appContainer.style.padding = '20px'; 
                 appContainer.style.backgroundColor = 'transparent'; 
            }
            // Toggle attach image button visibility based on screen and vision support
            toggleAttachButtonVisibility();
        } else {
            console.error("Screen not found:", screenId);
        }
    }

    function toggleAttachButtonVisibility() {
        if (visionSupportedByCurrentModel && screens.game.style.display === 'block') {
            attachImageButton.style.display = 'inline-block';
        } else {
            attachImageButton.style.display = 'none';
        }
    }

    function displayError(element, message) {
        const finalMessage = message || "An unknown error occurred.";
        if (element) {
            element.textContent = finalMessage;
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

            if (response.status === 204) { // No Content
                return { success: true, status: response.status };
            }

            if (isInitialCheck && response.status === 404) {
                // Try to parse JSON, but if it fails, return a simple notFound indicator
                const responseDataOnError = await response.json().catch(() => ({ notFound: true, status: 404 }));
                return responseDataOnError; 
            }

            // Try to parse JSON for all other cases
            const responseData = await response.json().catch(async (e) => {
                const text = await response.text().catch(() => "Could not read response text.");
                console.error("Failed to parse JSON response. Status:", response.status, "Response text:", text, "Error:", e);
                return { parseError: true, status: response.status, text: text }; 
            });

            if (responseData.parseError) {
                if (!isInitialCheck) {
                    displayError(errorElement, `Server returned non-JSON response (Status ${responseData.status}). Check console for details.`);
                }
                return responseData;
            }

            if (!response.ok) {ks
                if (!isInitialCheck || (responseData && responseData.error && response.status !== 404)) {
                    displayError(errorElement, responseData?.error || `Request failed: ${response.status} ${response.statusText}`);
                }
                return responseData;
            }
            return responseData;
        } catch (error) {
            console.error(`Network error or other issue in apiRequest for ${url}:`, error);
            if (!isInitialCheck) {
                displayError(errorElement, `Network error: ${error.message}`);
            }
            return { networkError: true, message: error.message };
        }
    }

    function addMessageToDisplay(role, content, imageData = null) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(role === 'user' ? 'user-message' : 'assistant-message');
        
        const textSpan = document.createElement('span');
        textSpan.textContent = content;
        messageDiv.appendChild(textSpan);

        if (imageData) {
            const img = document.createElement('img');
            img.src = imageData;
            img.alt = role === 'user' ? "User's image" : "Assistant's image";
            img.classList.add('message-image-thumbnail');
            messageDiv.appendChild(img);
        }
        
        messageDisplay.appendChild(messageDiv);
        messageDisplay.scrollTop = messageDisplay.scrollHeight; 
    }

    async function changeSprite(spriteName) {
        if (!currentSpriteFolder || !spriteName) {
            console.warn("Attempted to change sprite without folder or name:", currentSpriteFolder, spriteName);
            if (currentSpriteFolder && !spriteName) spriteName = 'normal.png'; // Fallback if name is missing but folder exists
            else if (!currentSpriteFolder) { // If no folder at all, cannot load any sprite
                characterSprite.style.opacity = 0;
                console.error("No sprite folder set for character.");
                return;
            }
        }
        
        characterSprite.style.opacity = 0;

        // Wait for opacity transition before changing src
        setTimeout(() => {
            const newSrc = `/assets/sprites/${currentSpriteFolder}/${spriteName}`;
            characterSprite.src = newSrc;
            characterSprite.onload = () => {
                characterSprite.style.opacity = 1; 
            };
            characterSprite.onerror = () => {
                console.error(`Failed to load sprite: ${newSrc}. Trying normal.png.`);
                characterSprite.src = `/assets/sprites/${currentSpriteFolder}/normal.png`; 
                characterSprite.onload = () => characterSprite.style.opacity = 1; // Show fallback
                characterSprite.onerror = () => { // If even normal.png fails in that folder
                    console.error(`Failed to load fallback normal.png in ${currentSpriteFolder}. Hiding sprite.`);
                    characterSprite.style.opacity = 0;
                };
            };
        }, 300);
    }

    async function initializeApp() {
        const apiKeyStatusResponse = await apiRequest('/api/status/api_key', 'GET', null, null, true);

        if (!apiKeyStatusResponse || apiKeyStatusResponse.networkError) {
            showScreen('apiKey');
            if (apiKeyStatusResponse && apiKeyStatusResponse.message) {
                 displayError(errorMessages.apiKey, `Network error checking API status: ${apiKeyStatusResponse.message}`);
            } else {
                 displayError(errorMessages.apiKey, "Could not connect to server to check API status.");
            }
            return;
        }
        
        visionSupportedByCurrentModel = apiKeyStatusResponse.supports_vision || false;
        supportsVisionCheckbox.checked = visionSupportedByCurrentModel;
        apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel; // Sync with API key form checkbox

        if (!apiKeyStatusResponse.configured) {
            showScreen('apiKey');
            if (apiKeyStatusResponse.message) {
                displayError(errorMessages.apiKey, apiKeyStatusResponse.message); // Show "not configured" message
            }
            return;
        }

        const userDataResponse = await apiRequest('/api/user_data', 'GET', null, null, true); 
        
        if (userDataResponse && userDataResponse.name && !userDataResponse.error && !userDataResponse.notFound) {
            currentUserData = userDataResponse;

            const charProfileResponse = await apiRequest('/api/personality', 'GET', null, null, true);
            if (charProfileResponse && charProfileResponse.profile && charProfileResponse.general?.sprite && !charProfileResponse.error && !charProfileResponse.notFound) {
                currentCharacterPersonalityText = charProfileResponse.profile;
                currentCharacterSetupData = charProfileResponse.general; 
                currentSpriteFolder = charProfileResponse.general.sprite;
                
                generatedPersonalityTextarea.value = currentCharacterPersonalityText;
                forms.characterCreate.name.value = currentCharacterSetupData.name || '';
                forms.characterCreate.looks.value = currentCharacterSetupData.looks || '';
                forms.characterCreate.personality.value = currentCharacterSetupData.rawPersonalityInput || ''; 
                forms.characterCreate.language.value = currentCharacterSetupData.language || 'English';
                forms.characterCreate.sprite.value = currentSpriteFolder || '';
                
                await goToGameScreen(true);
            } else {
                prefillUserDataForm(); 
                showScreen('characterSetup');
            }
        } else {
            showScreen('userData');
            if (userDataResponse && userDataResponse.error && !userDataResponse.notFound) { // If there was an error other than "not found"
                displayError(errorMessages.userData, `Error fetching user data: ${userDataResponse.error}`);
            }
        }
        toggleAttachButtonVisibility();
    }
    
    function prefillUserDataForm() {
         if (currentUserData && Object.keys(currentUserData).length > 0) {
            forms.userData.name.value = currentUserData.name || '';
            forms.userData.gender.value = currentUserData.gender || '';
            forms.userData.pronouns.value = currentUserData.pronouns || '';
            forms.userData.age.value = currentUserData.age || '';
            forms.userData.nickname.value = currentUserData.nickname || '';
            forms.userData.hobbies.value = currentUserData.hobbies || '';
            forms.userData.personality.value = currentUserData.personality || '';
        } else {
            forms.userData.reset();
        }
    }

    async function goToGameScreen(loadingExisting = false) {
        if (!currentSpriteFolder && currentCharacterSetupData && currentCharacterSetupData.sprite) {
            currentSpriteFolder = currentCharacterSetupData.sprite;
        }

        if (!currentSpriteFolder) {
            displayError(errorMessages.gameScreen, "Error: Sprite folder not set. Please complete character setup.");
            showScreen('characterSetup'); 
            return;
        }
        backgroundImage.src = '/assets/backgrounds/living_room.png';
        
        messageDisplay.innerHTML = '';
        if (loadingExisting) {
            const shortTermMemory = await apiRequest('/api/memory/short_term', 'GET', null, errorMessages.gameScreen);
            if (shortTermMemory && Array.isArray(shortTermMemory) && shortTermMemory.length > 0) {
                const lastAssistantMessage = [...shortTermMemory].reverse().find(msg => msg.role === 'assistant');
                if (lastAssistantMessage && lastAssistantMessage.sprite) {
                    changeSprite(lastAssistantMessage.sprite);
                } else {
                    changeSprite('normal.png');
                }
                shortTermMemory.slice(-10).forEach(msg => {
                    addMessageToDisplay(msg.role, msg.content, msg.image_data);
                });

            } else {
                changeSprite('normal.png');
                 if (shortTermMemory && shortTermMemory.error) {
                } else if (!Array.isArray(shortTermMemory)) {
                    displayError(errorMessages.gameScreen, "Failed to load chat history: Invalid response from server.");
                }
            }
        } else {
            changeSprite('normal.png'); // Default sprite for new game
        }
        showScreen('game');
    }

    async function initializeApp() {
        const apiKeyStatusResponse = await apiRequest('/api/status/api_key', 'GET', null, null, true);

        if (!apiKeyStatusResponse || apiKeyStatusResponse.networkError) {
            showScreen('apiKey');
            return;
        }
        
        // Update vision support state on the client
        visionSupportedByCurrentModel = apiKeyStatusResponse.supports_vision || false;
        supportsVisionCheckbox.checked = visionSupportedByCurrentModel;
        apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel;

        // If not configured, show API key screen
        if (!apiKeyStatusResponse.configured) {
            showScreen('apiKey');
            return;
        }

        // API Key is configured, proceed to check User Data
        const userDataResponse = await apiRequest('/api/user_data', 'GET', null, null, true); 
        
        if (userDataResponse && userDataResponse.name && !userDataResponse.error && !userDataResponse.notFound) {
            currentUserData = userDataResponse;

            // User Data exists, check Character Profile
            const charProfileResponse = await apiRequest('/api/personality', 'GET', null, null, true);
            if (charProfileResponse && charProfileResponse.profile && charProfileResponse.general?.sprite && !charProfileResponse.error && !charProfileResponse.notFound) {
                currentCharacterPersonalityText = charProfileResponse.profile;
                currentCharacterSetupData = charProfileResponse.general; 
                currentSpriteFolder = charProfileResponse.general.sprite;
                
                // Pre-fill character create form for editing context
                generatedPersonalityTextarea.value = currentCharacterPersonalityText;
                if (forms.characterCreate && forms.characterCreate.name) { // Check if form elements exist
                    forms.characterCreate.name.value = currentCharacterSetupData.name || '';
                    forms.characterCreate.looks.value = currentCharacterSetupData.looks || '';
                    forms.characterCreate.personality.value = currentCharacterSetupData.rawPersonalityInput || ''; 
                    forms.characterCreate.language.value = currentCharacterSetupData.language || 'English';
                    forms.characterCreate.sprite.value = currentSpriteFolder || '';
                }
                
                await goToGameScreen(true);
            } else {
                prefillUserDataForm(); 
                showScreen('characterSetup');
            }
        } else {
            showScreen('userData');
        }
        toggleAttachButtonVisibility(); 
    }

    // --- Event Listeners ---

    // API Key Form
    forms.apiKey.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(forms.apiKey);
        const data = Object.fromEntries(formData.entries());
        data.supports_vision = apiKeySupportsVisionCheckbox.checked; // Get from the form's checkbox

        const result = await apiRequest('/api/api_key', 'POST', data, errorMessages.apiKey); 
        if (result && result.model && !result.error) { 
            visionSupportedByCurrentModel = result.supports_vision || false;
            supportsVisionCheckbox.checked = visionSupportedByCurrentModel; // Sync options modal checkbox
            
            // Re-evaluate flow
            const userDataResponse = await apiRequest('/api/user_data', 'GET', null, null, true);
            if (userDataResponse && userDataResponse.name && !userDataResponse.error && !userDataResponse.notFound) {
                currentUserData = userDataResponse;
                const charProfileResponse = await apiRequest('/api/personality', 'GET', null, null, true);
                if (charProfileResponse && charProfileResponse.profile && charProfileResponse.general?.sprite && !charProfileResponse.error && !charProfileResponse.notFound) {
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

        // Ensure required fields are not empty before sending (frontend validation)
        if (!data.name?.trim() || !data.gender?.trim() || !data.pronouns?.trim()) {
            displayError(errorMessages.userData, "Name, Gender, and Pronouns are required.");
            return;
        }

        let result;
        let method = isUserDataEditing ? 'PATCH' : 'POST';
        result = await apiRequest('/api/user_data', method, data, errorMessages.userData);
        

        // Check for success (200 for PATCH, 201 for POST, or has 'name' property and no error)
        if (result && (result.name || result.status === 201 || result.status === 200) && !result.error) {
            currentUserData = result.name ? result : { ...currentUserData, ...data }; // Update local state

            if (isUserDataEditing) {
                alert('User data updated successfully!');
                optionsModal.style.display = 'none'; 
                isUserDataEditing = false;
                userDataSubmitButton.textContent = 'Save User Data';
                 showScreen('game');
            } else {
                const charProfileResponse = await apiRequest('/api/personality', 'GET', null, null, true);
                if (charProfileResponse && charProfileResponse.profile && charProfileResponse.general?.sprite && !charProfileResponse.error && !charProfileResponse.notFound) {
                    currentCharacterPersonalityText = charProfileResponse.profile;
                    currentCharacterSetupData = charProfileResponse.general;
                    currentSpriteFolder = charProfileResponse.general.sprite;
                    generatedPersonalityTextarea.value = currentCharacterPersonalityText;
                    await goToGameScreen(true);
                } else {
                    showScreen('characterSetup');
                }
            }
        } else if (result && result.error) {
        } else if (!result) {
            displayError(errorMessages.userData, "Failed to save user data. Unknown error.");
        }
    });

    // Character Create Form
    forms.characterCreate.addEventListener('submit', async (e) => {
         e.preventDefault();
        const formData = new FormData(forms.characterCreate);
        const data = Object.fromEntries(formData.entries());
        
        // Basic frontend validation
        if (!data.name?.trim() || !data.looks?.trim() || !data.personality?.trim() || !data.language?.trim() || !data.sprite?.trim()) {
            displayError(errorMessages.characterCreate, "All fields with * are required.");
            return;
        }
        
        const result = await apiRequest('/api/personality', 'POST', data, errorMessages.characterCreate);
        if (result && result.characterProfile && !result.error) {
            currentCharacterPersonalityText = result.characterProfile;
            const generalInfo = await apiRequest('/api/personality', 'GET', null, errorMessages.characterCreate);
            if (generalInfo && generalInfo.general) {
                currentCharacterSetupData = generalInfo.general;
            } else {
                 currentCharacterSetupData = data; // Fallback
            }

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
        if (result && result.characterProfile && !result.error) {
            currentCharacterPersonalityText = result.characterProfile;
            alert('Character profile updated!');
            if (isCharacterProfileEditing) { 
                optionsModal.style.display = 'none';
                isCharacterProfileEditing = false;
                characterEditSection.style.display = 'none'; 
                forms.characterCreate.style.display = 'block';
                showScreen('game');
            } else {
                 characterEditSection.style.display = 'block';
            }
        }
    });
    
    continueToGameButtonElement.addEventListener('click', async () => {
        if (!currentCharacterSetupData.sprite && forms.characterCreate.sprite.value) {
            currentCharacterSetupData.sprite = forms.characterCreate.sprite.value;
        }
        if(!currentSpriteFolder && currentCharacterSetupData.sprite) {
            currentSpriteFolder = currentCharacterSetupData.sprite;
        }
        if (!currentSpriteFolder) {
            displayError(errorMessages.characterEdit, "Sprite folder is missing. Cannot continue.");
            return;
        }
        await goToGameScreen(false); // Not loading existing, it's a new setup
    });

    async function handleInteractionResponse(result) {
        if (result && result.content) {
            addMessageToDisplay('assistant', result.content);
            if (result.sprite) {
                changeSprite(result.sprite);
            }
        } else {
            const errorMessage = result?.error || "LLM interaction request failed or returned an invalid response.";
            addMessageToDisplay('assistant', `Sorry, I had trouble responding. (${errorMessage})`);
            if (!result?.error && errorMessages.gameScreen) {
                 displayError(errorMessages.gameScreen, errorMessage);
            }
        }
    }

    // Send Message
    sendMessageButton.addEventListener('click', async () => {
        const messageText = userMessageInput.value.trim();
        if (!messageText && !selectedImageBase64) return;

        // Add user message to display (with potential image)
        addMessageToDisplay('user', messageText || "[Image]", selectedImageBase64); // Display "[Image]" if no text
        
        const payload = { message: messageText };
        if (selectedImageBase64) {
            payload.image_data = selectedImageBase64;
        }

        userMessageInput.value = '';
        removeImagePreview(); // Clear preview and selectedImageBase64
        sendMessageButton.disabled = true;
        attachImageButton.disabled = true;

        const result = await apiRequest('/api/message', 'POST', payload, errorMessages.gameScreen);
        
        sendMessageButton.disabled = false;
        if (visionSupportedByCurrentModel) attachImageButton.disabled = false;
        handleInteractionResponse(result);
    });
    userMessageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Allow shift+enter for new lines if textarea
            e.preventDefault(); // Prevent default newline in input if it's not a textarea
            sendMessageButton.click();
        }
    });

    // Perform Action Button
    performActionButton.addEventListener('click', async () => {
        const selectedAction = actionSelector.value;
        if (!selectedAction) return;

        performActionButton.disabled = true;

        const result = await apiRequest(`/api/interact/${selectedAction}`, 'POST', {}, errorMessages.gameScreen);
        
        performActionButton.disabled = false;
        handleInteractionResponse(result);
    });

    // Image Attachment Logic
    attachImageButton.addEventListener('click', () => {
        imageUploadInput.click();
    });

    imageUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            // Simple validation for image types (more robust on backend if needed)
            if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)) {
                alert('Invalid file type. Please select a PNG, JPG, GIF, or WEBP image.');
                imageUploadInput.value = ''; // Reset file input
                return;
            }
            // Optional: File size check (e.g., < 5MB)
            if (file.size > 7 * 1024 * 1024) { // 5 MB
                 alert('File is too large. Please select an image under 5MB.');
                 imageUploadInput.value = '';
                 return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                selectedImageBase64 = e.target.result;
                imagePreview.src = selectedImageBase64;
                imagePreviewContainer.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        }
        imageUploadInput.value = '';
    });

    function removeImagePreview() {
        selectedImageBase64 = null;
        imagePreview.src = '#';
        imagePreviewContainer.style.display = 'none';
        imageUploadInput.value = '';
    }
    removeImagePreviewButton.addEventListener('click', removeImagePreview);


    // --- Options Modal Logic ---
    optionsButton.addEventListener('click', () => {
        supportsVisionCheckbox.checked = visionSupportedByCurrentModel; // Sync before showing
        optionsModal.style.display = 'block';
    });
    closeOptionsModalButton.addEventListener('click', () => optionsModal.style.display = 'none');
    
    supportsVisionCheckbox.addEventListener('change', async (event) => {
        const newVisionSupportStatus = event.target.checked;
        const result = await apiRequest('/api/config/vision', 'PATCH', { supports_vision: newVisionSupportStatus }, errorMessages.gameScreen); // Use gameScreen error for feedback
        
        if (result && result.supports_vision !== undefined && !result.error) {
            visionSupportedByCurrentModel = result.supports_vision;
            apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel; // Sync API key form checkbox
            toggleAttachButtonVisibility();
            alert(`Vision support ${visionSupportedByCurrentModel ? 'enabled' : 'disabled'}.`);
        } else {
            // Revert checkbox if update failed
            supportsVisionCheckbox.checked = visionSupportedByCurrentModel; 
            alert('Failed to update vision support setting.');
        }
    });

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
        apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel; // Pre-fill based on current state
    });

    optChangeUserData.addEventListener('click', () => {
        optionsModal.style.display = 'none';
        isUserDataEditing = true;
        userDataSubmitButton.textContent = 'Update User Data';
        prefillUserDataForm(); 
        showScreen('userData');
    });
    
    optChangeCharProfile.addEventListener('click', () => {
        optionsModal.style.display = 'none';
        isCharacterProfileEditing = true;
        
        // Pre-fill the create form with existing setup data
        forms.characterCreate.name.value = currentCharacterSetupData.name || '';
        forms.characterCreate.looks.value = currentCharacterSetupData.looks || '';
        forms.characterCreate.personality.value = currentCharacterSetupData.rawPersonalityInput || ''; 
        forms.characterCreate.language.value = currentCharacterSetupData.language || '';
        forms.characterCreate.sprite.value = currentSpriteFolder || currentCharacterSetupData.sprite || '';
        
        generatedPersonalityTextarea.value = currentCharacterPersonalityText;
        
        forms.characterCreate.style.display = 'none';
        characterEditSection.style.display = 'block';
        continueToGameButtonElement.style.display = 'none';

        showScreen('characterSetup');
    });

    async function showMemory(type) {
        const endpoint = type === 'shortTerm' ? '/api/memory/short_term' : '/api/memory/long_term';
        const title = type === 'shortTerm' ? 'Chat History (Short-Term Memory)' : "Character's Diary (Long-Term Memory)";
        
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
                    
                    const contentTextNode = document.createTextNode(entry.content);
                    li.innerHTML = contentHTML; // Set HTML part first
                    li.appendChild(contentTextNode); // Then append text node

                    if (entry.image_data && type === 'shortTerm') { // Show image for short term (user messages)
                        const img = document.createElement('img');
                        img.src = entry.image_data;
                        img.alt = "User's image";
                        img.classList.add('message-image-thumbnail'); // Reuse class
                        img.style.maxWidth = '150px'; // Larger preview in modal
                        img.style.marginTop = '5px';
                        li.appendChild(img);
                    }
                    ul.appendChild(li);
                });
                memoryViewerContent.appendChild(ul);
            }
        } else {
            memoryViewerContent.textContent = `Failed to load ${type === 'shortTerm' ? 'chat history' : 'diary'}. ${data?.error || data?.message || 'Unknown error.'} (Endpoint: ${endpoint})`;
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

    // Create Backup Button
    optCreateBackupButton.addEventListener('click', async () => {
        optionsModal.style.display = 'none';
        const result = await apiRequest('/api/backups/create', 'POST', {}, errorMessages.gameScreen); // Use gameScreen error for feedback
        if (result && result.message && !result.error) {
            alert(result.message);
        } else {
            alert(`Backup creation failed: ${result?.error || 'Unknown error'}`);
        }
    });

    // Restore Character Button
    optRestoreCharacterButton.addEventListener('click', async () => {
        optionsModal.style.display = 'none';
        const confirmRestore = confirm("Restoring a backup will overwrite the current character's data and chat history. Please make a backup of the current character first if needed. Continue?");
        if (!confirmRestore) return;

        const characterName = prompt("Enter the exact name of the character whose backup you want to restore:");
        if (characterName === null) return; // User pressed Cancel
        if (!characterName.trim()) {
            alert("Character name cannot be empty.");
            return;
        }

        const result = await apiRequest(`/api/backups/${characterName.trim()}`, 'GET', null, errorMessages.gameScreen);
        if (result && result.message && !result.error) {
            alert(result.message);
            // Reload application state to reflect restored data
            await refreshAppAndCharacterData();
        } else {
            alert(`Failed to restore backup for "${characterName.trim()}": ${result?.error || 'Backup not found or error occurred.'}`);
        }
    });

    // Create New Character Button
    optCreateNewCharacterButton.addEventListener('click', async () => {
        optionsModal.style.display = 'none';
        const confirmCreateNew = confirm("This will delete the current character's profile, memories, and chat history. Make a backup first if you want to save the current character. Continue to create a new character?");
        if (!confirmCreateNew) return;

        const result = await apiRequest('/api/memory', 'DELETE', null, errorMessages.gameScreen);
        // DELETE /api/memory returns 204 on success, so result.success will be true
        if (result && result.success && !result.error) {
            alert('Current character data deleted. You will now be taken to the character creation screen.');
            // Clear local state related to the old character immediately
            currentCharacterPersonalityText = '';
            currentCharacterSetupData = {};
            currentSpriteFolder = '';
            messageDisplay.innerHTML = ''; 
            generatedPersonalityTextarea.value = ''; 
            forms.characterCreate.reset(); 
            characterEditSection.style.display = 'none';
            forms.characterCreate.style.display = 'block';
             continueToGameButtonElement.style.display = 'inline-block';

            showScreen('characterSetup');
            const apiKeyStatusResponse = await apiRequest('/api/status/api_key', 'GET', null, null, true);
            if (apiKeyStatusResponse) {
                visionSupportedByCurrentModel = apiKeyStatusResponse.supports_vision || false;
                supportsVisionCheckbox.checked = visionSupportedByCurrentModel;
                apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel;
                toggleAttachButtonVisibility();
            }

        } else {
            alert(`Failed to delete current character data: ${result?.error || 'Unknown error'}`);
        }
    });

    // --- Initial Setup ---
    initializeApp();
});