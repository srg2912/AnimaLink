document.addEventListener('DOMContentLoaded', () => {
    // --- Splash Screen Elements ---
    const splashScreenElement = document.getElementById('splash-screen');
    const appContainerElement = document.getElementById('app-container');
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
    
    const apiKeySupportsVisionCheckbox = document.getElementById('apiKeySupportsVision');

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
    const optOpenModdingFolderButton = document.getElementById('optOpenModdingFolder');

    // Restore Backup Modal Elements
    const restoreBackupModal = document.getElementById('restore-backup-modal');
    const closeRestoreBackupModalButton = document.getElementById('closeRestoreBackupModal');
    const backupSelectorInput = document.getElementById('backupSelectorInput');
    const applyRestoreBackupButton = document.getElementById('applyRestoreBackupButton');
    const restoreBackupError = document.getElementById('restoreBackupError');

    // Memory Viewer Modal
    const memoryViewerModal = document.getElementById('memory-viewer-modal');
    const closeMemoryViewerModalButton = document.getElementById('closeMemoryViewerModal');
    const memoryViewerTitle = document.getElementById('memoryViewerTitle');
    const memoryViewerContent = document.getElementById('memoryViewerContent');

    // Background Selector Modal Elements
    const changeBackgroundButton = document.getElementById('changeBackgroundButton');
    const backgroundSelectorModal = document.getElementById('background-selector-modal');
    const closeBackgroundSelectorModalButton = document.getElementById('closeBackgroundSelectorModal');
    const backgroundSelectorInput = document.getElementById('backgroundSelectorInput');
    const applyBackgroundButton = document.getElementById('applyBackgroundButton');

    // Music Settings Modal Elements
    const musicSettingsButton = document.getElementById('musicSettingsButton');
    const musicSettingsModal = document.getElementById('music-settings-modal');
    const closeMusicSettingsModalButton = document.getElementById('closeMusicSettingsModal');
    const musicTrackSelector = document.getElementById('musicTrackSelector');
    const musicVolumeSlider = document.getElementById('musicVolumeSlider');
    const bgMusicPlayer = document.getElementById('bgMusicPlayer'); 
    
    // --- State Variables ---
    let currentSpriteFolder = '';
    let isUserDataEditing = false;
    let isCharacterProfileEditing = false;
    let currentUserData = {};
    let currentCharacterSetupData = {}; 
    let currentCharacterPersonalityText = '';
    let visionSupportedByCurrentModel = false;
    let selectedImageBase64 = null;
    const LAST_BACKGROUND_KEY = 'lastSelectedBackground'; 
    const LAST_MUSIC_TRACK_KEY = 'lastSelectedMusicTrack';
    const LAST_MUSIC_VOLUME_KEY = 'lastMusicVolume';
    const DEFAULT_MUSIC_TRACK = 'Simple Piano Melody.mp3';
    const DEFAULT_MUSIC_VOLUME = 0.5;
    let initialMusicPlayAttempted = false;
    let userHasInteracted = false;

    // --- Helper Functions ---
    function showScreen(screenId) {
        Object.values(screens).forEach(screen => screen.style.display = 'none');
        if (screens[screenId]) {
            screens[screenId].style.display = 'block';
            
            if (screenId === 'game') {
                 appContainerElement.style.maxWidth = '100vw';
                 appContainerElement.style.padding = '0';
                 appContainerElement.style.backgroundColor = 'transparent'; 
                 document.body.style.backgroundColor = '#000000'; // Ensure body is black for game screen
            } else { // For setup screens (API key, user data, character setup)
                 appContainerElement.style.maxWidth = '800px';
                 appContainerElement.style.padding = '20px'; 
                 appContainerElement.style.backgroundColor = 'transparent'; 
                 document.body.style.backgroundColor = '#FFC5D3'; // Set body to pink for setup screens
            }
            toggleAttachButtonVisibility();
            if (screenId === 'game' && !initialMusicPlayAttempted) {
                playInitialMusic();
            }
        } else {
            console.error("Screen not found:", screenId);
        }
    }


    function showModal(modalElement) {
        if (modalElement) {
            modalElement.style.display = 'flex'; 
        }
    }

    function hideModal(modalElement) {
        if (modalElement) {
            modalElement.style.display = 'none';
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
            alert(finalMessage); 
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

            if (isInitialCheck && response.status === 404) {
                const responseDataOnError = await response.json().catch(() => ({ notFound: true, status: 404 }));
                return responseDataOnError; 
            }

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

            if (!response.ok) {
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
            if (currentSpriteFolder && !spriteName) spriteName = 'normal.png';
            else if (!currentSpriteFolder) { 
                characterSprite.style.opacity = 0;
                console.error("No sprite folder set for character.");
                return;
            }
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
                characterSprite.onload = () => characterSprite.style.opacity = 1; 
                characterSprite.onerror = () => { 
                    console.error(`Failed to load fallback normal.png in ${currentSpriteFolder}. Hiding sprite.`);
                    characterSprite.style.opacity = 0;
                };
            };
        }, 300);
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
        
        const lastBg = localStorage.getItem(LAST_BACKGROUND_KEY);
        backgroundImage.src = lastBg ? `/assets/backgrounds/${lastBg}` : '/assets/backgrounds/living_room.png';
        
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
            changeSprite('normal.png'); 
        }
        showScreen('game');
    }

    async function initializeApp() {
        initialMusicPlayAttempted = false;
        userHasInteracted = false;

        // Set up initial music volume from localStorage or default
        const lastVolume = parseFloat(localStorage.getItem(LAST_MUSIC_VOLUME_KEY)) || DEFAULT_MUSIC_VOLUME;
        bgMusicPlayer.volume = lastVolume;
        musicVolumeSlider.value = lastVolume;

        const apiKeyStatusResponse = await apiRequest('/api/status/api_key', 'GET', null, null, true);

        if (!apiKeyStatusResponse || apiKeyStatusResponse.networkError) {
            // showScreen will set body background
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
        apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel;

        if (!apiKeyStatusResponse.configured) {
            showScreen('apiKey');
            if (apiKeyStatusResponse.message) { 
                displayError(errorMessages.apiKey, apiKeyStatusResponse.message);
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
                if (forms.characterCreate && forms.characterCreate.name) { 
                    forms.characterCreate.name.value = currentCharacterSetupData.name || '';
                    forms.characterCreate.looks.value = currentCharacterSetupData.looks || '';
                    forms.characterCreate.personality.value = currentCharacterSetupData.rawPersonalityInput || ''; 
                    forms.characterCreate.language.value = currentCharacterSetupData.language || 'English';
                    forms.characterCreate.sprite.value = currentSpriteFolder || '';
                }
                
                await goToGameScreen(true); // This calls showScreen('game')
            } else {
                prefillUserDataForm(); 
                showScreen('characterSetup'); // This calls showScreen for a setup screen
                 if (charProfileResponse && charProfileResponse.error && !charProfileResponse.notFound) {
                    displayError(errorMessages.characterCreate, `Error fetching character profile: ${charProfileResponse.error}`);
                }
            }
        } else {
            prefillUserDataForm(); 
            showScreen('userData'); // This calls showScreen for a setup screen
            if (userDataResponse && userDataResponse.error && !userDataResponse.notFound) {
                displayError(errorMessages.userData, `Error fetching user data: ${userDataResponse.error}`);
            }
        }
        toggleAttachButtonVisibility(); 
    }

    // --- Music Helper Functions ---
    function playMusic(trackFilename, volume) {
        if (!trackFilename) return;
        
        const newSrc = `/assets/bg_music/${trackFilename}`;
        if (bgMusicPlayer.src !== newSrc || bgMusicPlayer.paused) {
            bgMusicPlayer.src = newSrc;
        }
        bgMusicPlayer.volume = volume;
        bgMusicPlayer.currentTime = 0; 

        const playPromise = bgMusicPlayer.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                initialMusicPlayAttempted = true; 
                userHasInteracted = true;
                console.log("Music playing:", trackFilename);
            }).catch(error => {
                console.warn("Music play failed:", error);
                initialMusicPlayAttempted = true;
            });
        } else {
            initialMusicPlayAttempted = true;
        }
    }

    function playInitialMusic() {
        if (initialMusicPlayAttempted && !bgMusicPlayer.paused) return;

        initialMusicPlayAttempted = true; 
        const lastTrack = localStorage.getItem(LAST_MUSIC_TRACK_KEY) || DEFAULT_MUSIC_TRACK;
        const lastVolume = parseFloat(localStorage.getItem(LAST_MUSIC_VOLUME_KEY)) || DEFAULT_MUSIC_VOLUME;
        
        // Update UI elements related to music settings
        musicVolumeSlider.value = lastVolume;
        // (Selector update happens when music menu is opened)

        bgMusicPlayer.src = `/assets/bg_music/${lastTrack}`;
        bgMusicPlayer.volume = lastVolume;
        
        // Try to play. A slight delay might help on some browsers after page load.
        setTimeout(() => {
            const playPromise = bgMusicPlayer.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    userHasInteracted = true; // Assume if it plays, interaction was allowed
                    console.log("Initial music started:", lastTrack);
                }).catch(error => {
                    console.warn("Initial music autoplay failed:", error);
                });
            }
        }, 100); // 100ms delay
    }
    
    // Call this after any *meaningful* user interaction to enable audio
    function markUserInteraction() {
        if (!userHasInteracted) {
            userHasInteracted = true;
            if (bgMusicPlayer.paused && bgMusicPlayer.src && initialMusicPlayAttempted) {
                 const playPromise = bgMusicPlayer.play();
                 if (playPromise !== undefined) {
                    playPromise.catch(e => console.warn("Playback attempt after explicit interaction mark failed:", e));
                 }
            } else if (!bgMusicPlayer.src && !initialMusicPlayAttempted) {
                playInitialMusic();
            }
        }
    }


    // --- Event Listeners (will be attached after splash) ---
    function attachEventListeners() {
        // General click listener to mark user interaction for audio playback
        document.body.addEventListener('click', markUserInteraction, { capture: true, once: true });

        forms.apiKey.addEventListener('submit', async (e) => {
            e.preventDefault();
            markUserInteraction();
            const formData = new FormData(forms.apiKey);
            const data = Object.fromEntries(formData.entries());
            data.supports_vision = apiKeySupportsVisionCheckbox.checked;

            const result = await apiRequest('/api/api_key', 'POST', data, errorMessages.apiKey); 
            if (result && result.model && !result.error) { 
                visionSupportedByCurrentModel = result.supports_vision || false;
                supportsVisionCheckbox.checked = visionSupportedByCurrentModel;
                await initializeApp(); // Re-initialize to reflect potential changes (like vision support)
            }
        });

        forms.userData.addEventListener('submit', async (e) => {
            e.preventDefault();
            markUserInteraction();
            const formData = new FormData(forms.userData);
            let data = Object.fromEntries(formData.entries());

            if (!data.name?.trim() || !data.gender?.trim() || !data.pronouns?.trim()) {
                displayError(errorMessages.userData, "Name, Gender, and Pronouns are required.");
                return;
            }

            let method = isUserDataEditing ? 'PATCH' : 'POST';
            const result = await apiRequest('/api/user_data', method, data, errorMessages.userData);
            
            if (result && (result.name || result.status === 201 || result.status === 200) && !result.error) {
                currentUserData = result.name ? result : { ...currentUserData, ...data };

                if (isUserDataEditing) {
                    alert('User data updated successfully!');
                    hideModal(optionsModal);
                    isUserDataEditing = false;
                    userDataSubmitButton.textContent = 'Save User Data';
                    // No need to call initializeApp() fully again if just editing,
                    // but if setup flow depends on it, then call it.
                    // For now, assume the next step is character setup or game.
                    showScreen('characterSetup'); // Or wherever appropriate after user data edit
                } else {
                    // This is initial setup
                    showScreen('characterSetup');
                }
            } else if (!result) {
                displayError(errorMessages.userData, "Failed to save user data. Unknown error.");
            }
        });

        forms.characterCreate.addEventListener('submit', async (e) => {
            e.preventDefault();
            markUserInteraction();
            const formData = new FormData(forms.characterCreate);
            const data = Object.fromEntries(formData.entries());
            
            if (!data.name?.trim() || !data.looks?.trim() || !data.personality?.trim() || !data.language?.trim() || !data.sprite?.trim()) {
                displayError(errorMessages.characterCreate, "All fields with * are required.");
                return;
            }
            
            const result = await apiRequest('/api/personality', 'POST', data, errorMessages.characterCreate);
            if (result && result.characterProfile && !result.error) {
                currentCharacterPersonalityText = result.characterProfile;
                const generalInfoResponse = await apiRequest('/api/personality', 'GET', null, errorMessages.characterCreate);
                if (generalInfoResponse && generalInfoResponse.general) {
                    currentCharacterSetupData = generalInfoResponse.general;
                    currentSpriteFolder = generalInfoResponse.general.sprite; 
                } else {
                    currentCharacterSetupData = { ...data, rawPersonalityInput: data.personality };
                    currentSpriteFolder = data.sprite; 
                }
                generatedPersonalityTextarea.value = result.characterProfile;
                characterEditSection.style.display = 'block';
            }
        });

        saveEditedPersonalityButton.addEventListener('click', async () => {
            markUserInteraction();
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
                    hideModal(optionsModal);
                    isCharacterProfileEditing = false;
                    // Need to reload game or specific parts if profile changes while in game
                    await goToGameScreen(true); // Reload game screen with potentially new profile effects
                } else {
                    // This is part of initial setup flow
                    characterEditSection.style.display = 'block'; 
                }
            }
        });
        
        continueToGameButtonElement.addEventListener('click', async () => {
            markUserInteraction();
            if (!currentCharacterSetupData.name) { 
                const formData = new FormData(forms.characterCreate);
                currentCharacterSetupData.name = formData.get('name');
                currentCharacterSetupData.looks = formData.get('looks');
                currentCharacterSetupData.language = formData.get('language');
                currentCharacterSetupData.sprite = formData.get('sprite');
            }
            if (!currentSpriteFolder && forms.characterCreate.sprite.value) {
                currentSpriteFolder = forms.characterCreate.sprite.value;
                if (currentCharacterSetupData) currentCharacterSetupData.sprite = currentSpriteFolder;
            }
            
            if (!currentSpriteFolder) {
                displayError(errorMessages.characterEdit, "Sprite folder is missing. Please fill the 'Sprite Folder To Use' field and generate/save the profile. Cannot continue.");
                return;
            }
            await goToGameScreen(false); 
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

        sendMessageButton.addEventListener('click', async () => {
            markUserInteraction();
            const messageText = userMessageInput.value.trim();
            if (!messageText && !selectedImageBase64) return;

            addMessageToDisplay('user', messageText || "[Image]", selectedImageBase64); 
            
            const payload = { message: messageText };
            if (selectedImageBase64) {
                payload.image_data = selectedImageBase64;
            }

            userMessageInput.value = '';
            removeImagePreview(); 
            sendMessageButton.disabled = true;
            attachImageButton.disabled = true;

            const result = await apiRequest('/api/message', 'POST', payload, errorMessages.gameScreen);
            
            sendMessageButton.disabled = false;
            if (visionSupportedByCurrentModel) attachImageButton.disabled = false;
            handleInteractionResponse(result);
        });
        userMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                sendMessageButton.click(); 
            }
        });

        performActionButton.addEventListener('click', async () => {
            markUserInteraction();
            const selectedAction = actionSelector.value;
            if (!selectedAction) return;

            performActionButton.disabled = true;
            const result = await apiRequest(`/api/interact/${selectedAction}`, 'POST', {}, errorMessages.gameScreen);
            performActionButton.disabled = false;
            handleInteractionResponse(result);
        });

        attachImageButton.addEventListener('click', () => {
            markUserInteraction();
            imageUploadInput.click();
        });

        imageUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)) {
                    alert('Invalid file type. Please select a PNG, JPG, GIF, or WEBP image.');
                    imageUploadInput.value = ''; 
                    return;
                }
                if (file.size > 7 * 1024 * 1024) { 
                    alert('File is too large. Please select an image under 7MB.');
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
            markUserInteraction();
            supportsVisionCheckbox.checked = visionSupportedByCurrentModel; 
            showModal(optionsModal);
        });
        closeOptionsModalButton.addEventListener('click', () => hideModal(optionsModal));
        
        supportsVisionCheckbox.addEventListener('change', async (event) => {
            const newVisionSupportStatus = event.target.checked;
            const result = await apiRequest('/api/config/vision', 'PATCH', { supports_vision: newVisionSupportStatus }, errorMessages.gameScreen);
            
            if (result && result.supports_vision !== undefined && !result.error) {
                visionSupportedByCurrentModel = result.supports_vision;
                apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel; 
                toggleAttachButtonVisibility();
                alert(`Vision support ${visionSupportedByCurrentModel ? 'enabled' : 'disabled'}.`);
            } else {
                supportsVisionCheckbox.checked = visionSupportedByCurrentModel; 
                alert('Failed to update vision support setting.');
            }
        });

        function closeModalOnClickOutside(event) {
            if (event.target === optionsModal) hideModal(optionsModal);
            if (event.target === memoryViewerModal) hideModal(memoryViewerModal);
            if (event.target === backgroundSelectorModal) hideModal(backgroundSelectorModal);
            if (event.target === musicSettingsModal) hideModal(musicSettingsModal);
            if (event.target === restoreBackupModal) hideModal(restoreBackupModal);
        }
        window.addEventListener('click', closeModalOnClickOutside);

        optChangeApiKey.addEventListener('click', () => {
            hideModal(optionsModal);
            showScreen('apiKey');
            forms.apiKey.reset(); 
            apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel; 
        });

        optChangeUserData.addEventListener('click', () => {
            hideModal(optionsModal);
            isUserDataEditing = true;
            userDataSubmitButton.textContent = 'Update User Data';
            prefillUserDataForm(); 
            showScreen('userData');
        });
        
        optChangeCharProfile.addEventListener('click', () => {
            hideModal(optionsModal);
            isCharacterProfileEditing = true;
            
            if (currentCharacterSetupData) {
                forms.characterCreate.name.value = currentCharacterSetupData.name || '';
                forms.characterCreate.looks.value = currentCharacterSetupData.looks || '';
                forms.characterCreate.personality.value = currentCharacterSetupData.rawPersonalityInput || ''; 
                forms.characterCreate.language.value = currentCharacterSetupData.language || '';
                forms.characterCreate.sprite.value = currentSpriteFolder || currentCharacterSetupData.sprite || '';
            }
            generatedPersonalityTextarea.value = currentCharacterPersonalityText || '';
            
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
                        li.innerHTML = contentHTML; 
                        li.appendChild(contentTextNode); 

                        if (entry.image_data && type === 'shortTerm') { 
                            const img = document.createElement('img');
                            img.src = entry.image_data;
                            img.alt = "User's image";
                            img.classList.add('message-image-thumbnail'); 
                            img.style.maxWidth = '150px'; 
                            img.style.marginTop = '5px';
                            li.appendChild(img);
                        }
                        ul.appendChild(li);
                    });
                    memoryViewerContent.appendChild(ul);
                }
            } else {
                memoryViewerContent.textContent = `Failed to load ${type === 'shortTerm' ? 'chat history' : 'diary'}. ${data?.error || data?.message || 'Unknown error.'}`;
            }
            showModal(memoryViewerModal);
        }

        optViewShortTermMemory.addEventListener('click', () => {
            hideModal(optionsModal);
            showMemory('shortTerm');
        });
        
        optViewLongTermMemory.addEventListener('click', () => {
            hideModal(optionsModal);
            showMemory('longTerm');
        });

        closeMemoryViewerModalButton.addEventListener('click', () => hideModal(memoryViewerModal));

        optCreateBackupButton.addEventListener('click', async () => {
            hideModal(optionsModal);
            const result = await apiRequest('/api/backups/create', 'POST', {}, errorMessages.gameScreen); 
            if (result && result.message && !result.error) {
                alert(result.message);
            } else {
                alert(`Backup creation failed: ${result?.error || 'Unknown error'}`);
            }
        });

        optRestoreCharacterButton.addEventListener('click', async () => {
            hideModal(optionsModal); // Hide the main options modal first
            displayError(restoreBackupError, ''); // Clear previous errors

            try {
                const backupListResponse = await apiRequest('/api/backups/list', 'GET', null, restoreBackupError);
                if (backupListResponse && Array.isArray(backupListResponse)) {
                    backupSelectorInput.innerHTML = ''; // Clear previous options
                    if (backupListResponse.length === 0) {
                        const option = document.createElement('option');
                        option.textContent = 'No backups found.';
                        option.disabled = true;
                        backupSelectorInput.appendChild(option);
                        applyRestoreBackupButton.disabled = true;
                    } else {
                        backupListResponse.forEach(backupInfo => {
                            const option = document.createElement('option');
                            // Value will be the characterName, which the backend uses to find the file
                            option.value = backupInfo.characterName; 
                            option.textContent = backupInfo.characterName.replace(/_/g, ' '); // Display name nicely
                            backupSelectorInput.appendChild(option);
                        });
                        applyRestoreBackupButton.disabled = false;
                    }
                    showModal(restoreBackupModal);
                } else {
                     // Error already displayed by apiRequest if restoreBackupError was passed
                    if (!restoreBackupError.textContent) {
                        displayError(restoreBackupError, backupListResponse?.error || 'Failed to load backup list.');
                    }
                     showModal(restoreBackupModal); // Show modal anyway to display error
                }
            } catch (error) {
                displayError(restoreBackupError, 'Error trying to fetch backup list: ' + error.message);
                showModal(restoreBackupModal); // Show modal to display error
            }
        });

        closeRestoreBackupModalButton.addEventListener('click', () => {
            hideModal(restoreBackupModal);
        });

        applyRestoreBackupButton.addEventListener('click', async () => {
            const selectedCharacterName = backupSelectorInput.value;
            if (!selectedCharacterName || backupSelectorInput.selectedOptions[0]?.disabled) {
                displayError(restoreBackupError, 'Please select a valid backup from the list.');
                return;
            }

            applyRestoreBackupButton.disabled = true;
            displayError(restoreBackupError, ''); // Clear previous errors

            // The characterName itself is used in the URL, backend constructs filename.
            const result = await apiRequest(`/api/backups/${selectedCharacterName}`, 'GET', null, restoreBackupError);
            
            applyRestoreBackupButton.disabled = false;

            if (result && result.message && !result.error) {
                alert(result.message); // Success message
                hideModal(restoreBackupModal);
                await initializeApp(); // Re-initialize the whole app to load new character
            } else {
                // Error is already displayed by apiRequest if restoreBackupError was passed.
                // If not, display a generic one.
                if (!restoreBackupError.textContent) {
                     displayError(restoreBackupError, `Failed to restore backup for "${selectedCharacterName}": ${result?.error || 'Backup not found or error occurred.'}`);
                }
            }
        });

        optCreateNewCharacterButton.addEventListener('click', async () => {
            hideModal(optionsModal);
            const confirmCreateNew = confirm("This will delete the current character's profile, memories, and chat history. Make a backup first if you want to save the current character. Continue to create a new character?");
            if (!confirmCreateNew) return;

            const result = await apiRequest('/api/memory', 'DELETE', null, errorMessages.gameScreen);
            if (result && result.success && !result.error) { 
                alert('Current character data deleted. You will now be taken to the character creation screen.');
                localStorage.removeItem(LAST_BACKGROUND_KEY); 
                localStorage.removeItem(LAST_MUSIC_TRACK_KEY); 
                localStorage.removeItem(LAST_MUSIC_VOLUME_KEY); 
                bgMusicPlayer.pause(); 
                bgMusicPlayer.src = ""; 
                initialMusicPlayAttempted = false; 
                userHasInteracted = false;


                currentUserData = {}; 
                currentCharacterPersonalityText = '';
                currentCharacterSetupData = {};
                currentSpriteFolder = '';
                messageDisplay.innerHTML = ''; 
                generatedPersonalityTextarea.value = ''; 
                forms.characterCreate.reset(); 
                characterEditSection.style.display = 'none';
                forms.characterCreate.style.display = 'block';
                continueToGameButtonElement.style.display = 'inline-block';
                await initializeApp(); 
            } else {
                alert(`Failed to delete current character data: ${result?.error || 'Unknown error'}`);
            }
        });

        // --- Background Change Logic ---
        changeBackgroundButton.addEventListener('click', async () => {
            markUserInteraction();
            try {
                displayError(errorMessages.gameScreen, ''); 
                const backgrounds = await apiRequest('/api/backgrounds', 'GET', null, errorMessages.gameScreen); 
                if (backgrounds && Array.isArray(backgrounds)) {
                    backgroundSelectorInput.innerHTML = ''; 
                    if (backgrounds.length === 0) {
                        const option = document.createElement('option');
                        option.textContent = 'No backgrounds found in assets/backgrounds';
                        option.disabled = true;
                        backgroundSelectorInput.appendChild(option);
                        applyBackgroundButton.disabled = true;
                    } else {
                        const lastBg = localStorage.getItem(LAST_BACKGROUND_KEY);
                        backgrounds.forEach(bgFile => {
                            const option = document.createElement('option');
                            option.value = bgFile;
                            option.textContent = bgFile.replace(/\.(png|jpe?g|gif|webp)$/i, '').replace(/_/g, ' ');
                            if (bgFile === lastBg) {
                                option.selected = true; 
                            }
                            backgroundSelectorInput.appendChild(option);
                        });
                        applyBackgroundButton.disabled = false;
                    }
                    showModal(backgroundSelectorModal);
                } else {
                    if (!errorMessages.gameScreen.textContent) { 
                        displayError(errorMessages.gameScreen, backgrounds?.error || 'Failed to load backgrounds list.');
                    }
                }
            } catch (error) { 
                displayError(errorMessages.gameScreen, 'Error trying to fetch backgrounds: ' + error.message);
            }
        });

        applyBackgroundButton.addEventListener('click', async () => {
            markUserInteraction();
            const selectedBackgroundFile = backgroundSelectorInput.value;
            if (!selectedBackgroundFile) {
                alert('Please select a background from the list.');
                return;
            }

            backgroundImage.src = `/assets/backgrounds/${selectedBackgroundFile}`;
            localStorage.setItem(LAST_BACKGROUND_KEY, selectedBackgroundFile); 
            hideModal(backgroundSelectorModal);
            applyBackgroundButton.disabled = true; 

            const payload = { backgroundName: selectedBackgroundFile };
            const result = await apiRequest(`/api/interact/background_change`, 'POST', payload, errorMessages.gameScreen);
            
            applyBackgroundButton.disabled = false; 

            handleInteractionResponse(result); 
        });

        closeBackgroundSelectorModalButton.addEventListener('click', () => {
            hideModal(backgroundSelectorModal);
        });

        // --- Music Settings Logic ---
        musicSettingsButton.addEventListener('click', async () => {
            markUserInteraction();
            try {
                displayError(errorMessages.gameScreen, '');
                const musicTracks = await apiRequest('/api/music', 'GET', null, errorMessages.gameScreen);
                if (musicTracks && Array.isArray(musicTracks)) {
                    musicTrackSelector.innerHTML = '';
                    if (musicTracks.length === 0) {
                        const option = document.createElement('option');
                        option.textContent = 'No music found in assets/bg_music';
                        option.disabled = true;
                        musicTrackSelector.appendChild(option);
                    } else {
                        const currentTrack = localStorage.getItem(LAST_MUSIC_TRACK_KEY) || DEFAULT_MUSIC_TRACK;
                        musicTracks.forEach(trackFile => {
                            const option = document.createElement('option');
                            option.value = trackFile;
                            option.textContent = trackFile.replace(/\.(mp3|wav|ogg)$/i, '').replace(/_/g, ' ');
                            if (trackFile === currentTrack) {
                                option.selected = true;
                            }
                            musicTrackSelector.appendChild(option);
                        });
                    }
                    musicVolumeSlider.value = bgMusicPlayer.volume; 
                    showModal(musicSettingsModal);
                } else {
                    if (!errorMessages.gameScreen.textContent) { 
                        displayError(errorMessages.gameScreen, musicTracks?.error || 'Failed to load music list.');
                    }
                }
            } catch (error) {
                displayError(errorMessages.gameScreen, 'Error trying to fetch music list: ' + error.message);
            }
        });

        musicTrackSelector.addEventListener('change', () => {
            const selectedTrack = musicTrackSelector.value;
            if (selectedTrack) {
                playMusic(selectedTrack, bgMusicPlayer.volume); 
                localStorage.setItem(LAST_MUSIC_TRACK_KEY, selectedTrack);
            }
        });

        musicVolumeSlider.addEventListener('input', () => { 
            const newVolume = parseFloat(musicVolumeSlider.value);
            bgMusicPlayer.volume = newVolume;
            localStorage.setItem(LAST_MUSIC_VOLUME_KEY, newVolume.toString());
        });

        closeMusicSettingsModalButton.addEventListener('click', () => {
            hideModal(musicSettingsModal);
        });

        // Modding folder button listener
        if (optOpenModdingFolderButton) {
            optOpenModdingFolderButton.addEventListener('click', () => {
                markUserInteraction(); 
                if (window.electronAPI && typeof window.electronAPI.openModdingFolder === 'function') {
                    window.electronAPI.openModdingFolder();
                } else {
                    console.error('electronAPI.openModdingFolder is not available. Ensure preload script is correctly configured.');
                    alert('Error: Could not open modding folder. This feature may not be available.');
                }
                hideModal(optionsModal); 
            });
        }
    }


    // --- Splash Screen Animation and App Initialization ---
    if (splashScreenElement && appContainerElement) {
        const FADE_IN_DURATION = 500;  // 1 second
        const HOLD_DURATION = 2000;  // 1 second (app initialization happens here)
        const FADE_OUT_DURATION = 1000; // 1 second

        // Start splash screen fade-in (from opacity 0 to 1)
        setTimeout(() => { // Ensures CSS transition applies correctly
            splashScreenElement.style.opacity = '1';
        }, 50); // Small delay

        // Prepare app initialization
        const appInitializationPromise = initializeApp();
        
        // Attach event listeners once DOM is ready for them (they are passive until interaction)
        attachEventListeners();

        // Wait for both app initialization AND minimum splash hold time to complete
        Promise.all([
            appInitializationPromise,
            new Promise(resolve => setTimeout(resolve, FADE_IN_DURATION + HOLD_DURATION)) // Min total display time before fadeout
        ]).then(() => {
            // Now start fading out the splash screen
            splashScreenElement.style.opacity = '0';

            // After fade-out animation completes, hide splash and show app
            setTimeout(() => {
                splashScreenElement.style.display = 'none';
                appContainerElement.style.display = 'block'; 
                // initializeApp() has already called showScreen(), which set the correct
                // body background and displayed the initial app screen.
            }, FADE_OUT_DURATION);
        }).catch(error => {
            console.error("Error during app initialization or splash sequence:", error);
            // Fallback: Ensure splash is removed and app container is visible
            // even if there was an error, so user isn't stuck on splash.
            // initializeApp should handle displaying specific error messages/screens.
            splashScreenElement.style.opacity = '0'; // Try to fade out
             setTimeout(() => {
                splashScreenElement.style.display = 'none';
                appContainerElement.style.display = 'block';
            }, FADE_OUT_DURATION);
        });

    } else {
        // Fallback if splash screen elements are not found
        console.warn("Splash screen element or app container not found. Initializing app directly.");
        if(appContainerElement) appContainerElement.style.display = 'block';
        // Directly initialize and set body background based on the first screen
        initializeApp().then(() => {
            attachEventListeners();
            // If initializeApp determined a screen, showScreen would have set the body bg.
            // If not, and we want a default, set it here. But initializeApp *should* show a screen.
        }).catch(error => {
            console.error("Error during direct app initialization:", error);
            // Potentially set a default body background for error states
            document.body.style.backgroundColor = '#FFC5D3'; // Or a neutral error color
        });
    }
});