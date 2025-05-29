document.addEventListener('DOMContentLoaded', () => {
    // --- Splash Screen Elements ---
    const splashScreenElement = document.getElementById('splash-screen');
    const appContainerElement = document.getElementById('app-container');
    // --- DOM Elements ---
    const screens = {
        apiKey: document.getElementById('api-key-screen'),
        userData: document.getElementById('user-data-screen'),
        characterChoice: document.getElementById('character-choice-screen'), // New screen
        characterSetup: document.getElementById('character-setup-screen'),
        game: document.getElementById('game-screen'),
    };

    const forms = {
        apiKey: document.getElementById('apiKeyForm'),
        userData: document.getElementById('userDataForm'),
        characterCreate: document.getElementById('characterCreateForm'),
    };
    
    const apiKeySupportsVisionCheckbox = document.getElementById('apiKeySupportsVision');
    const charSpriteFolderSelector = document.getElementById('charSpriteFolderSelector');

    const errorMessages = {
        apiKey: document.getElementById('apiKeyError'),
        userData: document.getElementById('userDataError'),
        characterChoice: document.getElementById('characterChoiceError'), // New error message
        characterCreate: document.getElementById('characterCreateError'),
        characterEdit: document.getElementById('characterEditError'),
        gameScreen: document.getElementById('gameScreenError'),
        restoreBackup: document.getElementById('restoreBackupError') 
    };

    // Character Choice Screen Elements
    const choiceCreateNewButton = document.getElementById('choiceCreateNewButton');
    const choiceShowRestoreOptionsButton = document.getElementById('choiceShowRestoreOptionsButton');
    const restoreOptionsSection = document.getElementById('restore-options-section');
    const choiceBackupSelector = document.getElementById('choiceBackupSelector');
    const choiceApplyRestoreButton = document.getElementById('choiceApplyRestoreButton');

    const characterCreateFormSubmitButton = forms.characterCreate.querySelector('button[type="submit"]');    
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

    // Restore Backup Modal Elements (for Options)
    const restoreBackupModal = document.getElementById('restore-backup-modal');
    const closeRestoreBackupModalButton = document.getElementById('closeRestoreBackupModal');
    const backupSelectorInput = document.getElementById('backupSelectorInput'); // This is for the options modal
    const applyRestoreBackupButton = document.getElementById('applyRestoreBackupButton'); // This is for the options modal

    // Memory Viewer Modal
    const memoryViewerModal = document.getElementById('memory-viewer-modal');
    const closeMemoryViewerModalButton = document.getElementById('closeMemoryViewerModal');
    const memoryViewerTitle = document.getElementById('memoryViewerTitle');
    const memoryViewerContent = document.getElementById('memoryViewerContent');

    // Background Selector Modal Elements
    const changeBackgroundButton = document.getElementById('changeBackgroundButton');
    const backgroundSelectorModal = document.getElementById('background-selector-modal');
    const closeBackgroundSelectorModalButton = document.getElementById('closeBackgroundSelectorModal');
    const backgroundSelectorInput = document.getElementById('backgroundSelectorInput'); // For background modal
    const applyBackgroundButton = document.getElementById('applyBackgroundButton');

    // Music Settings Modal Elements
    const musicSettingsButton = document.getElementById('musicSettingsButton');
    const musicSettingsModal = document.getElementById('music-settings-modal');
    const closeMusicSettingsModalButton = document.getElementById('closeMusicSettingsModal');
    const musicTrackSelector = document.getElementById('musicTrackSelector');
    const musicVolumeSlider = document.getElementById('musicVolumeSlider');
    const bgMusicPlayer = document.getElementById('bgMusicPlayer'); 
    
    // In-game Notification & Confirmation Elements
    const inGameNotificationsContainer = document.getElementById('in-game-notifications-container');
    const confirmationModal = document.getElementById('confirmation-modal');
    const confirmationTitleElement = document.getElementById('confirmation-title');
    const confirmationMessageElement = document.getElementById('confirmation-message');
    const confirmYesButton = document.getElementById('confirm-yes-button');
    const confirmNoButton = document.getElementById('confirm-no-button');
    const closeConfirmationModalInternalButton = document.getElementById('closeConfirmationModalInternalButton');


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
    let _resolveConfirmationPromise = null;


    // --- Helper Functions ---

    function showInGameNotification(message, type = 'info', duration = 5000) {
        if (!inGameNotificationsContainer) {
            console.warn("In-game notification container not found. Falling back to console log:", message);
            return;
        }

        const notification = document.createElement('div');
        notification.classList.add('in-game-notification', `in-game-notification-${type}`);
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        notification.appendChild(messageSpan);

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.classList.add('in-game-notification-close');
        closeButton.onclick = () => {
            notification.classList.remove('fade-in'); 
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300); 
        };
        notification.appendChild(closeButton);

        inGameNotificationsContainer.appendChild(notification);

        setTimeout(() => notification.classList.add('fade-in'), 10);


        if (duration > 0) {
            setTimeout(() => {
                notification.classList.remove('fade-in');
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300); 
            }, duration);
        }
    }

    function showInGameConfirmation(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            _resolveConfirmationPromise = resolve; 

            if (!confirmationModal || !confirmationTitleElement || !confirmationMessageElement || !confirmYesButton || !confirmNoButton) {
                console.warn("Confirmation modal elements not found. Falling back to window.confirm.");
                const result = window.confirm(message); 
                resolve(result);
                return;
            }

            confirmationTitleElement.textContent = title;
            confirmationMessageElement.textContent = message;
            
            showModal(confirmationModal); 
        });
    }

    async function populateSpriteFolderSelector(selectedValue = null) {
        if (!charSpriteFolderSelector) return;
        charSpriteFolderSelector.disabled = true;
        charSpriteFolderSelector.innerHTML = '<option value="" disabled selected>Loading sprite folders...</option>';


        try {
            const spriteFolders = await apiRequest('/api/sprites/folders', 'GET', null, errorMessages.characterCreate);
            charSpriteFolderSelector.innerHTML = ''; 

            if (spriteFolders && Array.isArray(spriteFolders) && spriteFolders.length > 0) {
                const placeholderOption = document.createElement('option');
                placeholderOption.value = "";
                placeholderOption.textContent = "Select a sprite folder";
                placeholderOption.disabled = true;
                if (!selectedValue) placeholderOption.selected = true;
                charSpriteFolderSelector.appendChild(placeholderOption);

                spriteFolders.forEach(folderName => {
                    const option = document.createElement('option');
                    option.value = folderName;
                    option.textContent = folderName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    charSpriteFolderSelector.appendChild(option);
                });

                if (selectedValue) {
                    charSpriteFolderSelector.value = selectedValue;
                     if (charSpriteFolderSelector.selectedIndex === -1 || charSpriteFolderSelector.value !== selectedValue) {
                        console.warn(`Sprite folder "${selectedValue}" not found in selector. Defaulting selection.`);
                        if (charSpriteFolderSelector.options.length > 1 && charSpriteFolderSelector.options[0].disabled) charSpriteFolderSelector.selectedIndex = 1; 
                        else if (charSpriteFolderSelector.options.length > 0) charSpriteFolderSelector.selectedIndex = 0;
                    }
                } else {
                     if (charSpriteFolderSelector.options.length > 0 && charSpriteFolderSelector.options[0].disabled) charSpriteFolderSelector.selectedIndex = 0;
                }
                charSpriteFolderSelector.disabled = false;

            } else {
                const option = document.createElement('option');
                option.value = "";
                option.textContent = "No sprite folders found";
                option.disabled = true;
                option.selected = true;
                charSpriteFolderSelector.appendChild(option);
                charSpriteFolderSelector.disabled = true;
                if (spriteFolders && spriteFolders.error) {
                    // Error already handled
                } else if (Array.isArray(spriteFolders) && spriteFolders.length === 0) {
                    displayError(errorMessages.characterCreate, "No sprite folders found in your assets/sprites directory. Please add some character sprite folders there and refresh or restart.");
                }
            }
        } catch (error) {
            console.error("Error populating sprite folder selector:", error);
            displayError(errorMessages.characterCreate, "Could not load sprite folders. Check console.");
            charSpriteFolderSelector.innerHTML = '<option value="" disabled selected>Error loading folders</option>';
            charSpriteFolderSelector.disabled = true;
        }
    }

    // Reusable function to populate backup selectors
    async function populateBackupSelector(selectorElement, errorDisplayElement, applyButtonElement = null) {
        if (!selectorElement) return;
        selectorElement.disabled = true;
        selectorElement.innerHTML = '<option value="" disabled selected>Loading backups...</option>';
        if (applyButtonElement) applyButtonElement.disabled = true;
        if (errorDisplayElement) displayError(errorDisplayElement, '');

        try {
            const backupListResponse = await apiRequest('/api/backups/list', 'GET', null, errorDisplayElement);
            selectorElement.innerHTML = ''; // Clear loading message

            if (backupListResponse && Array.isArray(backupListResponse)) {
                if (backupListResponse.length === 0) {
                    const option = document.createElement('option');
                    option.textContent = 'No backups found.';
                    option.disabled = true;
                    option.selected = true;
                    selectorElement.appendChild(option);
                    selectorElement.disabled = true;
                    if (applyButtonElement) applyButtonElement.disabled = true;
                } else {
                    const placeholder = document.createElement('option');
                    placeholder.value = "";
                    placeholder.textContent = "Select a backup";
                    placeholder.disabled = true;
                    placeholder.selected = true;
                    selectorElement.appendChild(placeholder);

                    backupListResponse.forEach(backupInfo => {
                        const option = document.createElement('option');
                        option.value = backupInfo.characterName; 
                        option.textContent = backupInfo.characterName.replace(/_/g, ' '); 
                        selectorElement.appendChild(option);
                    });
                    selectorElement.disabled = false;
                    if (applyButtonElement) applyButtonElement.disabled = false; // Enable button if list populated
                }
            } else {
                const option = document.createElement('option');
                option.textContent = 'Error loading backups';
                option.disabled = true;
                option.selected = true;
                selectorElement.appendChild(option);
                selectorElement.disabled = true;
                if (applyButtonElement) applyButtonElement.disabled = true;
                if (errorDisplayElement && !errorDisplayElement.textContent) { // Only display if not already set by apiRequest
                    displayError(errorDisplayElement, backupListResponse?.error || 'Failed to load backup list.');
                }
            }
        } catch (error) {
            selectorElement.innerHTML = '<option value="" disabled selected>Error</option>';
            selectorElement.disabled = true;
            if (applyButtonElement) applyButtonElement.disabled = true;
            if (errorDisplayElement) displayError(errorDisplayElement, 'Error trying to fetch backup list: ' + error.message);
        }
    }


    function showScreen(screenId) {
        Object.values(screens).forEach(screen => screen.style.display = 'none');
        if (screens[screenId]) {
            screens[screenId].style.display = 'block';
            
            if (screenId === 'game') {
                 appContainerElement.style.maxWidth = '100vw';
                 appContainerElement.style.padding = '0';
                 appContainerElement.style.backgroundColor = 'transparent'; 
                 document.body.style.backgroundColor = '#000000'; 
            } else { 
                 appContainerElement.style.maxWidth = '800px';
                 appContainerElement.style.padding = '20px'; 
                 appContainerElement.style.backgroundColor = 'transparent'; 
                 document.body.style.backgroundColor = '#FFC5D3'; 
            }

            if (screenId === 'characterSetup' && !isCharacterProfileEditing) {
                populateSpriteFolderSelector(); 
            }
            if (screenId === 'characterChoice') {
                // Reset restore options section visibility and clear previous errors
                if (restoreOptionsSection) restoreOptionsSection.style.display = 'none';
                if (errorMessages.characterChoice) displayError(errorMessages.characterChoice, '');
                // The backup selector (choiceBackupSelector) will be populated on demand
                // when 'choiceShowRestoreOptionsButton' is clicked.
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
        const finalMessage = message || ""; 
        if (element) {
            element.textContent = finalMessage;
            element.style.display = finalMessage ? 'block' : 'none';
        } else {
            console.warn("Error display element not found in UI for message:", finalMessage);
            if (finalMessage) {
                 showInGameNotification(finalMessage, 'error', 7000); 
            }
        }
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
            
            if (errorElement && (!isInitialCheck || response.ok)) {
                 displayError(errorElement, ''); 
            }

            if (response.status === 204) { 
                return { success: true, status: response.status };
            }

            if (isInitialCheck && response.status === 404) {
                const responseDataOnError = await response.json().catch(() => ({ notFound: true, status: 404, error: "Resource not found." }));
                return responseDataOnError; 
            }

            const responseData = await response.json().catch(async (e) => {
                const text = await response.text().catch(() => "Could not read response text.");
                console.error("Failed to parse JSON response. Status:", response.status, "Response text:", text, "Error:", e);
                return { parseError: true, status: response.status, text: text }; 
            });

            if (responseData.parseError) {
                const errorMsg = `Server returned non-JSON response (Status ${responseData.status}). Check console for details.`;
                if (errorElement) {
                    displayError(errorElement, errorMsg);
                } else if (!isInitialCheck) { 
                    showInGameNotification(errorMsg, 'error');
                }
                return responseData;
            }

            if (!response.ok) {
                const errorToDisplay = responseData?.error || `Request failed: ${response.status} ${response.statusText}`;
                if (errorElement && (!isInitialCheck || (isInitialCheck && response.status !== 404))) {
                    displayError(errorElement, errorToDisplay);
                } else if (!isInitialCheck && !errorElement) { 
                    showInGameNotification(errorToDisplay, 'error');
                }
                return { ...responseData, error: errorToDisplay, status: response.status }; 
            }
            return responseData;
        } catch (error) {
            console.error(`Network error or other issue in apiRequest for ${url}:`, error);
            const networkErrorMsg = `Network error: ${error.message}. Check if the server is running.`;
            if (errorElement) { 
                displayError(errorElement, networkErrorMsg);
            } else if (!isInitialCheck) { 
                 showInGameNotification(networkErrorMsg, 'error');
            }
            return { networkError: true, message: error.message, error: networkErrorMsg };
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

    async function goToGameScreen(isNewCharacterSetup = false) {
        if (!currentSpriteFolder && currentCharacterSetupData && currentCharacterSetupData.sprite) {
            currentSpriteFolder = currentCharacterSetupData.sprite;
        }

        if (!currentSpriteFolder) {
            displayError(errorMessages.gameScreen, "Error: Sprite folder not set. Please complete character setup.");
            showScreen('characterSetup'); 
            return;
        }
        
        const lastBg = localStorage.getItem(LAST_BACKGROUND_KEY);
        if (backgroundImage) backgroundImage.src = lastBg ? `/assets/backgrounds/${lastBg}` : '/assets/backgrounds/living_room.png';
        
        if (messageDisplay) messageDisplay.innerHTML = '';
        if (isNewCharacterSetup) {
            await changeSprite('normal.png'); 
        } else { // Loading existing character (could be just restored or pre-existing)
            const shortTermMemory = await apiRequest('/api/memory/short_term', 'GET', null, errorMessages.gameScreen);
            if (shortTermMemory && Array.isArray(shortTermMemory) && shortTermMemory.length > 0) {
                const lastAssistantMessage = [...shortTermMemory].reverse().find(msg => msg.role === 'assistant');
                if (lastAssistantMessage && lastAssistantMessage.sprite) {
                    await changeSprite(lastAssistantMessage.sprite); 
                } else {
                    await changeSprite('normal.png'); 
                }
                shortTermMemory.slice(-10).forEach(msg => {
                    addMessageToDisplay(msg.role, msg.content, msg.image_data);
                });

            } else {
                await changeSprite('normal.png'); 
                 if (shortTermMemory && shortTermMemory.error) {
                    // Error already handled
                 } else if (shortTermMemory && !Array.isArray(shortTermMemory)) {
                    displayError(errorMessages.gameScreen, "Failed to load chat history: Invalid response from server.");
                }
            }
        }
        showScreen('game');
        toggleAttachButtonVisibility();
    }

    async function determineInitialScreenAndPrepareData() {
        const apiKeyStatusResponse = await apiRequest('/api/status/api_key', 'GET', null, null, true);

        if (!apiKeyStatusResponse || apiKeyStatusResponse.networkError) {
            if (apiKeyStatusResponse && apiKeyStatusResponse.message) {
                 displayError(errorMessages.apiKey, `Network error checking API status: ${apiKeyStatusResponse.message}`);
            } else {
                 displayError(errorMessages.apiKey, "Could not connect to server to check API status.");
            }
            return 'apiKey';
        }
        
        visionSupportedByCurrentModel = apiKeyStatusResponse.supports_vision || false;
        if(supportsVisionCheckbox) supportsVisionCheckbox.checked = visionSupportedByCurrentModel;
        if(apiKeySupportsVisionCheckbox) apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel;

        if (!apiKeyStatusResponse.configured) {
            return 'apiKey';
        }

        const userDataResponse = await apiRequest('/api/user_data', 'GET', null, null, true); 
        
        if (userDataResponse && userDataResponse.name && !userDataResponse.error && !userDataResponse.notFound) {
            currentUserData = userDataResponse;

            const charProfileResponse = await apiRequest('/api/personality', 'GET', null, null, true);
            if (charProfileResponse && charProfileResponse.profile && charProfileResponse.general?.sprite && !charProfileResponse.error && !charProfileResponse.notFound) {
                currentCharacterPersonalityText = charProfileResponse.profile;
                currentCharacterSetupData = charProfileResponse.general; 
                currentSpriteFolder = charProfileResponse.general.sprite;
                
                if (generatedPersonalityTextarea) generatedPersonalityTextarea.value = currentCharacterPersonalityText;
                if (forms.characterCreate && forms.characterCreate.name) { 
                    forms.characterCreate.name.value = currentCharacterSetupData.name || '';
                    forms.characterCreate.looks.value = currentCharacterSetupData.looks || '';
                    forms.characterCreate.personality.value = currentCharacterSetupData.rawPersonalityInput || ''; 
                    forms.characterCreate.language.value = currentCharacterSetupData.language || 'English';
                }
                // Data for game screen is prepped here before returning 'game'
                const lastBg = localStorage.getItem(LAST_BACKGROUND_KEY);
                if (backgroundImage) backgroundImage.src = lastBg ? `/assets/backgrounds/${lastBg}` : '/assets/backgrounds/living_room.png';
                
                if (messageDisplay) messageDisplay.innerHTML = '';
                const shortTermMemory = await apiRequest('/api/memory/short_term', 'GET', null, errorMessages.gameScreen);
                if (shortTermMemory && Array.isArray(shortTermMemory) && shortTermMemory.length > 0) {
                    const lastAssistantMessage = [...shortTermMemory].reverse().find(msg => msg.role === 'assistant');
                    if (lastAssistantMessage && lastAssistantMessage.sprite) {
                        await changeSprite(lastAssistantMessage.sprite); 
                    } else {
                        await changeSprite('normal.png'); 
                    }
                    shortTermMemory.slice(-10).forEach(msg => {
                        addMessageToDisplay(msg.role, msg.content, msg.image_data);
                    });
                } else {
                    await changeSprite('normal.png'); 
                     if (shortTermMemory && shortTermMemory.error) {
                        // Error already handled
                     } else if (shortTermMemory && !Array.isArray(shortTermMemory)) {
                        displayError(errorMessages.gameScreen, "Failed to load chat history: Invalid response from server.");
                    }
                }
                return 'game';

            } else { // User data exists, but no character profile
                prefillUserDataForm(); 
                 if (charProfileResponse && charProfileResponse.error && !charProfileResponse.notFound) { 
                    displayError(errorMessages.characterCreate, `Error fetching character profile: ${charProfileResponse.error}`);
                }
                return 'characterChoice'; // New: Go to character choice screen
            }
        } else { // No user data
            prefillUserDataForm(); 
            if (userDataResponse && userDataResponse.error && !userDataResponse.notFound) { 
                displayError(errorMessages.userData, `Error fetching user data: ${userDataResponse.error}`);
            }
            return 'userData';
        }
    }


    function playMusic(trackFilename, volume) {
        if (!trackFilename || !bgMusicPlayer) return;
        
        const newSrc = `/assets/bg_music/${trackFilename}`;
        if (!bgMusicPlayer.src.endsWith(newSrc) || bgMusicPlayer.paused) {
            bgMusicPlayer.src = newSrc;
        }
        bgMusicPlayer.volume = volume;
         if(bgMusicPlayer.readyState >= 2 && bgMusicPlayer.currentTime > 0 && bgMusicPlayer.src.endsWith(newSrc)) {
            // No reset
        } else {
            bgMusicPlayer.currentTime = 0; 
        }

        const playPromise = bgMusicPlayer.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                userHasInteracted = true; 
                console.log("Music playing:", trackFilename);
            }).catch(error => {
                console.warn("Music play failed for track:", trackFilename, error);
            });
        }
    }

    function playInitialMusic() {
        if (initialMusicPlayAttempted && !bgMusicPlayer.paused) {
            return;
        }
        if(initialMusicPlayAttempted && bgMusicPlayer.paused && !userHasInteracted) {
            return;
        }
        initialMusicPlayAttempted = true; 
        const lastTrack = localStorage.getItem(LAST_MUSIC_TRACK_KEY) || DEFAULT_MUSIC_TRACK;
        const lastVolume = parseFloat(localStorage.getItem(LAST_MUSIC_VOLUME_KEY)) || DEFAULT_MUSIC_VOLUME;
        if (musicVolumeSlider) musicVolumeSlider.value = lastVolume;
        if (!bgMusicPlayer) return;
        bgMusicPlayer.src = `/assets/bg_music/${lastTrack}`;
        bgMusicPlayer.volume = lastVolume;
        setTimeout(() => {
            const playPromise = bgMusicPlayer.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    userHasInteracted = true; 
                }).catch(error => {
                    console.warn("Initial music autoplay failed:", error.name, error.message);
                });
            }
        }, 100); 
    }
    
    function markUserInteraction() {
        if (!userHasInteracted) {
            userHasInteracted = true;
            if (bgMusicPlayer && bgMusicPlayer.paused && bgMusicPlayer.src && initialMusicPlayAttempted) {
                 const playPromise = bgMusicPlayer.play();
                 if (playPromise !== undefined) {
                    playPromise.catch(e => console.warn("Playback attempt after explicit interaction mark failed:", e));
                 }
            } else if (bgMusicPlayer && !bgMusicPlayer.src && !initialMusicPlayAttempted) {
                playInitialMusic();
            }
        }
    }

    async function handleInteractionResponse(result) {
        if (result && result.content) {
            addMessageToDisplay('assistant', result.content);
            if (result.sprite) {
                await changeSprite(result.sprite);
            }
            if (errorMessages.gameScreen) displayError(errorMessages.gameScreen, ''); 
        } else {
            const errorMessage = result?.error || "LLM interaction request failed or returned an invalid response.";
            addMessageToDisplay('assistant', `Sorry, I had trouble responding. (${errorMessage})`);
            if (errorMessages.gameScreen) {
                displayError(errorMessages.gameScreen, errorMessage);
            }
        }
    }

    async function refreshCurrentScreenState() {
        // This is a more focused refresh after certain actions, like restoring a character
        // or completing a setup step.
        const nextScreen = await determineInitialScreenAndPrepareData();
        showScreen(nextScreen);
        toggleAttachButtonVisibility();
    }


    function attachEventListeners() {
        document.body.addEventListener('click', markUserInteraction, { capture: true, once: true });

        if (confirmYesButton && confirmNoButton && closeConfirmationModalInternalButton && confirmationModal) {
            confirmYesButton.onclick = () => {
                hideModal(confirmationModal);
                if (_resolveConfirmationPromise) _resolveConfirmationPromise(true); _resolveConfirmationPromise = null; };
            confirmNoButton.onclick = () => {
                hideModal(confirmationModal);
                if (_resolveConfirmationPromise) _resolveConfirmationPromise(false); _resolveConfirmationPromise = null; };
            closeConfirmationModalInternalButton.onclick = () => {
                hideModal(confirmationModal);
                if (_resolveConfirmationPromise) _resolveConfirmationPromise(false); _resolveConfirmationPromise = null; };
        }


        forms.apiKey.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(forms.apiKey);
            const data = Object.fromEntries(formData.entries());
            data.supports_vision = apiKeySupportsVisionCheckbox.checked;
            const result = await apiRequest('/api/api_key', 'POST', data, errorMessages.apiKey); 
            if (result && result.model && !result.error) { 
                visionSupportedByCurrentModel = result.supports_vision || false;
                if (supportsVisionCheckbox) supportsVisionCheckbox.checked = visionSupportedByCurrentModel;
                await refreshCurrentScreenState();
            }
        });

        forms.userData.addEventListener('submit', async (e) => {
            e.preventDefault();
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
                    showInGameNotification('User data updated successfully!', 'success');
                    hideModal(optionsModal);
                    isUserDataEditing = false;
                    userDataSubmitButton.textContent = 'Save User Data';
                    await refreshCurrentScreenState(); // Refresh to ensure consistency if game was active
                } else {
                    // After initial user data submission, go to character choice screen
                    showScreen('characterChoice'); 
                }
            } else if (!result) {
                displayError(errorMessages.userData, "Failed to save user data. Unknown error.");
            }
        });

        // Character Choice Screen Listeners
        if (choiceCreateNewButton) {
            choiceCreateNewButton.addEventListener('click', () => {
                showScreen('characterSetup');
                // Ensure character setup form is in "create" mode, not "edit"
                resetCharacterSetupToCreationMode(); 
            });
        }

        if (choiceShowRestoreOptionsButton) {
            choiceShowRestoreOptionsButton.addEventListener('click', async () => {
                if (restoreOptionsSection.style.display === 'none') {
                    restoreOptionsSection.style.display = 'block';
                    await populateBackupSelector(choiceBackupSelector, errorMessages.characterChoice, choiceApplyRestoreButton);
                } else {
                    restoreOptionsSection.style.display = 'none';
                }
            });
        }

        if (choiceApplyRestoreButton) {
            choiceApplyRestoreButton.addEventListener('click', async () => {
                const selectedCharacterName = choiceBackupSelector.value;
                if (!selectedCharacterName || choiceBackupSelector.selectedOptions[0]?.disabled) {
                    displayError(errorMessages.characterChoice, 'Please select a valid backup from the list.');
                    return;
                }
                choiceApplyRestoreButton.disabled = true;
                displayError(errorMessages.characterChoice, ''); 

                const result = await apiRequest(`/api/backups/${selectedCharacterName}`, 'GET', null, errorMessages.characterChoice);
                choiceApplyRestoreButton.disabled = false;

                if (result && result.message && !result.error) {
                    showInGameNotification(result.message, 'success');
                    // After successful restore from choice screen, go to game
                    await refreshCurrentScreenState(); // This will determine 'game' screen
                } else {
                    if (!errorMessages.characterChoice.textContent) { // Avoid overwriting specific API error
                        displayError(errorMessages.characterChoice, `Failed to restore backup for "${selectedCharacterName}": ${result?.error || 'Backup not found or error occurred.'}`);
                    }
                }
            });
        }


        forms.characterCreate.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(forms.characterCreate);
            const data = Object.fromEntries(formData.entries());
            if (!data.name?.trim() || !data.looks?.trim() || !data.personality?.trim() || !data.language?.trim() || !data.sprite?.trim()) {
                displayError(errorMessages.characterCreate, "All fields with * are required. Please select a sprite folder.");
                return;
            }
            characterCreateFormSubmitButton.disabled = true; 
            const result = await apiRequest('/api/personality', 'POST', data, errorMessages.characterCreate);
            characterCreateFormSubmitButton.disabled = false; 
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
                continueToGameButtonElement.style.display = 'inline-block';
                if (isCharacterProfileEditing) { 
                     showInGameNotification('Character details updated and profile regenerated!', 'success');
                }
            }
        });

        saveEditedPersonalityButton.addEventListener('click', async () => {
            const editedProfileText = generatedPersonalityTextarea.value;
            const formData = new FormData(forms.characterCreate);
            const generalDataFromForm = Object.fromEntries(formData.entries());
            if (!generalDataFromForm.name?.trim() || !generalDataFromForm.looks?.trim() || !generalDataFromForm.language?.trim() || !generalDataFromForm.sprite?.trim()) {
                displayError(errorMessages.characterEdit, "Cannot save: Core character details (Name, Character Gender, Language, Sprite Folder) are required and cannot be empty.");
                return;
            }
             if (!editedProfileText.trim() && !generalDataFromForm.personality?.trim()) {
                displayError(errorMessages.characterEdit, 'Either the generated profile text or the personality description must be filled.');
                return;
            }
            const patchData = { edit: editedProfileText.trim() };
            patchData.general = {
                name: generalDataFromForm.name,
                looks: generalDataFromForm.looks,
                sprite: generalDataFromForm.sprite,
                language: generalDataFromForm.language,
                rawPersonalityInput: generalDataFromForm.personality 
            };
            saveEditedPersonalityButton.disabled = true;
            const result = await apiRequest('/api/personality', 'PATCH', patchData, errorMessages.characterEdit);
            saveEditedPersonalityButton.disabled = false;
            if (result && (result.characterProfile !== undefined || result.message) && !result.error) {
                if (result.characterProfile !== undefined) { 
                    currentCharacterPersonalityText = result.characterProfile;
                    generatedPersonalityTextarea.value = result.characterProfile; 
                }
                if (result.general) {
                    currentCharacterSetupData = result.general;
                    currentSpriteFolder = result.general.sprite;
                } else { 
                    const generalInfoResponse = await apiRequest('/api/personality', 'GET', null, errorMessages.characterEdit);
                    if (generalInfoResponse && generalInfoResponse.general) {
                        currentCharacterSetupData = generalInfoResponse.general;
                        currentSpriteFolder = generalInfoResponse.general.sprite;
                    }
                }
                showInGameNotification('Character data saved successfully!', 'success');
                if (isCharacterProfileEditing) {
                    resetCharacterSetupToCreationMode(); 
                    isCharacterProfileEditing = false; 
                    await goToGameScreen(false); 
                    hideModal(optionsModal); 
                } else { 
                    characterEditSection.style.display = 'block'; 
                    continueToGameButtonElement.style.display = 'inline-block';
                }
            }
        });
        
        continueToGameButtonElement.addEventListener('click', async () => {
            if (!currentCharacterSetupData.name || !currentCharacterSetupData.sprite) { 
                const formData = new FormData(forms.characterCreate);
                currentCharacterSetupData.name = formData.get('name');
                currentCharacterSetupData.looks = formData.get('looks');
                currentCharacterSetupData.language = formData.get('language');
                currentCharacterSetupData.sprite = formData.get('sprite');
                currentCharacterSetupData.rawPersonalityInput = formData.get('personality');
                currentSpriteFolder = formData.get('sprite');
            }
            if (!currentSpriteFolder) {
                displayError(errorMessages.characterEdit, "Sprite folder is missing. Please select a sprite folder and generate/save the profile. Cannot continue.");
                return;
            }
            await goToGameScreen(true); 
        });


        sendMessageButton.addEventListener('click', async () => {
            const messageText = userMessageInput.value.trim();
            if (!messageText && !selectedImageBase64) return;
            addMessageToDisplay('user', messageText || "[Image]", selectedImageBase64); 
            const payload = { message: messageText };
            if (selectedImageBase64) payload.image_data = selectedImageBase64;
            userMessageInput.value = '';
            removeImagePreview(); 
            sendMessageButton.disabled = true;
            attachImageButton.disabled = true;
            const result = await apiRequest('/api/message', 'POST', payload, errorMessages.gameScreen);
            sendMessageButton.disabled = false;
            if (visionSupportedByCurrentModel) attachImageButton.disabled = false;
            await handleInteractionResponse(result);
        });
        userMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessageButton.click(); }
        });

        performActionButton.addEventListener('click', async () => {
            const selectedAction = actionSelector.value;
            if (!selectedAction) return;
            performActionButton.disabled = true;
            const result = await apiRequest(`/api/interact/${selectedAction}`, 'POST', {}, errorMessages.gameScreen);
            performActionButton.disabled = false;
            await handleInteractionResponse(result);
        });

        attachImageButton.addEventListener('click', () => imageUploadInput.click());
        imageUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)) {
                    showInGameNotification('Invalid file type. Please select a PNG, JPG, GIF, or WEBP image.', 'error');
                    imageUploadInput.value = ''; return; }
                if (file.size > 7 * 1024 * 1024) { 
                    showInGameNotification('File is too large. Please select an image under 7MB.', 'error');
                    imageUploadInput.value = ''; return; }
                const reader = new FileReader();
                reader.onload = (e) => {
                    selectedImageBase64 = e.target.result;
                    imagePreview.src = selectedImageBase64;
                    imagePreviewContainer.style.display = 'flex'; };
                reader.readAsDataURL(file);
            }
            imageUploadInput.value = '';
        });
        function removeImagePreview() {
            selectedImageBase64 = null; imagePreview.src = '#'; imagePreviewContainer.style.display = 'none'; imageUploadInput.value = ''; }
        removeImagePreviewButton.addEventListener('click', removeImagePreview);


        optionsButton.addEventListener('click', () => {
            if(supportsVisionCheckbox) supportsVisionCheckbox.checked = visionSupportedByCurrentModel; 
            showModal(optionsModal); });
        closeOptionsModalButton.addEventListener('click', () => {
            if (isCharacterProfileEditing) { resetCharacterSetupToCreationMode(); isCharacterProfileEditing = false; }
            hideModal(optionsModal); });
        
        supportsVisionCheckbox.addEventListener('change', async (event) => {
            const newVisionSupportStatus = event.target.checked;
            const result = await apiRequest('/api/config/vision', 'PATCH', { supports_vision: newVisionSupportStatus }, errorMessages.gameScreen);
            if (result && result.supports_vision !== undefined && !result.error) {
                visionSupportedByCurrentModel = result.supports_vision;
                if(apiKeySupportsVisionCheckbox) apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel; 
                toggleAttachButtonVisibility();
                showInGameNotification(`Vision support ${visionSupportedByCurrentModel ? 'enabled' : 'disabled'}.`, 'info');
            } else {
                supportsVisionCheckbox.checked = visionSupportedByCurrentModel; 
                showInGameNotification('Failed to update vision support setting.', 'error');
            }
        });

        function closeModalOnClickOutside(event) {
            if (event.target === optionsModal) {
                if (isCharacterProfileEditing) { resetCharacterSetupToCreationMode(); isCharacterProfileEditing = false; }
                hideModal(optionsModal); }
            if (event.target === memoryViewerModal) hideModal(memoryViewerModal);
            if (event.target === backgroundSelectorModal) hideModal(backgroundSelectorModal);
            if (event.target === musicSettingsModal) hideModal(musicSettingsModal);
            if (event.target === restoreBackupModal) hideModal(restoreBackupModal);
            if (event.target === confirmationModal) { 
                hideModal(confirmationModal);
                if (_resolveConfirmationPromise) _resolveConfirmationPromise(false); _resolveConfirmationPromise = null; }
        }
        window.addEventListener('click', closeModalOnClickOutside);

        optChangeApiKey.addEventListener('click', async () => {
            hideModal(optionsModal); showScreen('apiKey'); forms.apiKey.reset(); displayError(errorMessages.apiKey, ''); 
            const apiKeyModelInput = document.getElementById('model');
            const apiKeyKeyInput = document.getElementById('key');
            const apiKeyEndpointInput = document.getElementById('endpoint');
            try {
                const currentApiKeyConfig = await apiRequest('/api/api_key_data', 'GET', null, null, true);
                if (currentApiKeyConfig && !currentApiKeyConfig.error && !currentApiKeyConfig.notFound) {
                    if (apiKeyModelInput) apiKeyModelInput.value = currentApiKeyConfig.model || '';
                    if (apiKeyKeyInput) apiKeyKeyInput.value = currentApiKeyConfig.key || ''; 
                    if (apiKeyEndpointInput) apiKeyEndpointInput.value = currentApiKeyConfig.base_url || '';
                    if(apiKeySupportsVisionCheckbox) apiKeySupportsVisionCheckbox.checked = currentApiKeyConfig.supports_vision !== undefined ? currentApiKeyConfig.supports_vision : visionSupportedByCurrentModel;
                } else if (currentApiKeyConfig && currentApiKeyConfig.error && !currentApiKeyConfig.notFound) {
                    console.error("Error fetching API key data for pre-fill:", currentApiKeyConfig.error);
                    displayError(errorMessages.apiKey, `Could not load current API key settings: ${currentApiKeyConfig.error}`);
                }
                if(apiKeySupportsVisionCheckbox) apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel;
            } catch (error) { 
                console.error("Network or other error fetching API key data for pre-fill:", error);
                displayError(errorMessages.apiKey, "Could not load current API key settings due to a network or system error.");
                if(apiKeySupportsVisionCheckbox) apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel;
            }
        });
        optChangeUserData.addEventListener('click', async () => {
            hideModal(optionsModal); isUserDataEditing = true; userDataSubmitButton.textContent = 'Update User Data';
            prefillUserDataForm(); showScreen('userData');
        });
        
        optChangeCharProfile.addEventListener('click', async () => {
            hideModal(optionsModal); isCharacterProfileEditing = true;
            const charProfileResponse = await apiRequest('/api/personality', 'GET', null, errorMessages.characterCreate, true);
            if (charProfileResponse && charProfileResponse.profile !== undefined && charProfileResponse.general && !charProfileResponse.error) {
                currentCharacterPersonalityText = charProfileResponse.profile;
                currentCharacterSetupData = charProfileResponse.general;
                currentSpriteFolder = charProfileResponse.general.sprite;
                forms.characterCreate.name.value = currentCharacterSetupData.name || '';
                forms.characterCreate.looks.value = currentCharacterSetupData.looks || '';
                forms.characterCreate.personality.value = currentCharacterSetupData.rawPersonalityInput || '';
                forms.characterCreate.language.value = currentCharacterSetupData.language || 'English';
                await populateSpriteFolderSelector(currentCharacterSetupData.sprite || ''); 
                generatedPersonalityTextarea.value = currentCharacterPersonalityText;
                characterEditSection.style.display = 'block';
                characterCreateFormSubmitButton.textContent = 'Regenerate Character Profile'; 
                saveEditedPersonalityButton.textContent = 'Save All Character Data';
                continueToGameButtonElement.style.display = 'none'; 
            } else {
                showInGameNotification('Could not load character profile for editing.', 'error');
                isCharacterProfileEditing = false; return; 
            }
            showScreen('characterSetup');
        });

        function resetCharacterSetupToCreationMode() {
            if (characterCreateFormSubmitButton) characterCreateFormSubmitButton.textContent = 'Generate Character Profile';
            saveEditedPersonalityButton.textContent = 'Save Edited Profile'; 
            continueToGameButtonElement.style.display = 'none';
            forms.characterCreate.reset(); 
            generatedPersonalityTextarea.value = '';
            populateSpriteFolderSelector(); 
            forms.characterCreate.style.display = 'block';
            characterEditSection.style.display = 'none'; 
        }


        optCreateNewCharacterButton.addEventListener('click', async () => {
            hideModal(optionsModal);
            const confirmCreateNew = await showInGameConfirmation(
                "This will delete the current character's profile, memories, and chat history.\nMake a backup first if you want to save the current character.\n\nContinue to create a new character?",
                "Create New Character Confirmation"
            );
            if (!confirmCreateNew) return;

            const result = await apiRequest('/api/memory', 'DELETE', null, errorMessages.gameScreen);
            if (result && (result.success || result.status === 204) && !result.error) {
                showInGameNotification('Current character data deleted.', 'info', 4000);
                localStorage.removeItem(LAST_BACKGROUND_KEY);
                localStorage.removeItem(LAST_MUSIC_TRACK_KEY);
                localStorage.removeItem(LAST_MUSIC_VOLUME_KEY);
                if (bgMusicPlayer) { bgMusicPlayer.pause(); bgMusicPlayer.src = ""; }
                initialMusicPlayAttempted = false;
                currentCharacterPersonalityText = ''; currentCharacterSetupData = {}; currentSpriteFolder = '';
                if(messageDisplay) messageDisplay.innerHTML = '';
                resetCharacterSetupToCreationMode(); 
                isCharacterProfileEditing = false;
                // Do NOT wipe currentUserData or isUserDataEditing here, as user data persists.
                // The flow should now go to character choice screen if user data exists.
                await refreshCurrentScreenState(); // This will take to characterChoice if currentUserData exists
            } else {
                 showInGameNotification(`Failed to delete current character data: ${result?.error || 'Unknown error'}`, 'error');
            }
        });

    async function showMemory(type) {
        const endpoint = type === 'shortTerm' ? '/api/memory/short_term' : '/api/memory/long_term';
        const title = type === 'shortTerm' ? 'Chat History (Short-Term Memory)' : "Character's Diary (Long-Term Memory)";
        const data = await apiRequest(endpoint, 'GET', null, null); 
        memoryViewerTitle.textContent = title; memoryViewerContent.innerHTML = ''; 
        if (data && Array.isArray(data)) {
            if (data.length === 0) { memoryViewerContent.textContent = 'No entries found.';
            } else {
                const ul = document.createElement('ul'); ul.style.listStyleType = 'none'; ul.style.paddingLeft = '0';
                const characterDisplayName = currentCharacterSetupData?.name || 'Character';
                const userDisplayName = currentUserData?.name || 'User';
                data.forEach(entry => {
                    const li = document.createElement('li');
                    li.style.marginBottom = '10px'; li.style.padding = '8px'; li.style.border = '1px solid rgba(255,255,255,0.2)'; li.style.borderRadius = '4px';
                    let displayName, roleClass;
                    if (entry.role === 'assistant') { displayName = characterDisplayName; roleClass = 'memory-char-header'; } 
                    else if (entry.role === 'user') { displayName = userDisplayName; roleClass = 'memory-user-header'; } 
                    else { displayName = entry.role || 'Entry'; roleClass = 'memory-generic-header'; }
                    let headerHTML = `<span class="${roleClass}"><strong>${displayName}</strong> (${new Date(entry.timestamp).toLocaleString()})</span><br>`;
                    if (entry.sprite && entry.role === 'assistant') headerHTML += `<span class="memory-sprite-info">(Sprite: ${entry.sprite})</span><br>`;
                    li.innerHTML = headerHTML;
                    const contentTextNode = document.createTextNode(entry.content);
                    li.appendChild(contentTextNode);
                    if (entry.image_data && type === 'shortTerm') { 
                        const img = document.createElement('img'); img.src = entry.image_data; img.alt = "User's image";
                        img.classList.add('message-image-thumbnail'); img.style.marginTop = '5px'; li.appendChild(img); }
                    ul.appendChild(li); });
                memoryViewerContent.appendChild(ul); }
        } else {
            memoryViewerContent.textContent = `Failed to load ${type === 'shortTerm' ? 'chat history' : 'diary'}. ${data?.error || data?.message || 'Unknown error.'}`;
        }
        showModal(memoryViewerModal);
    }

        optViewShortTermMemory.addEventListener('click', () => { hideModal(optionsModal); showMemory('shortTerm'); });
        optViewLongTermMemory.addEventListener('click', async () => {
            hideModal(optionsModal); showMemory('longTerm'); 
            const interactionApiUrl = '/api/interact/view_diary';
            apiRequest(interactionApiUrl, 'POST', {}, errorMessages.gameScreen)
                .then(result => { handleInteractionResponse(result); })
                .catch(error => { handleInteractionResponse({ error: error.message || "Failed to get character reaction for diary view." }); });
        });
        closeMemoryViewerModalButton.addEventListener('click', () => hideModal(memoryViewerModal));

        optCreateBackupButton.addEventListener('click', async () => {
            hideModal(optionsModal);
            const result = await apiRequest('/api/backups/create', 'POST', {}, errorMessages.gameScreen); 
            if (result && result.message && !result.error) showInGameNotification(result.message, 'success');
            else if (!errorMessages.gameScreen.textContent) showInGameNotification(`Backup creation failed: ${result?.error || 'Unknown error'}`, 'error');
        });

        optRestoreCharacterButton.addEventListener('click', async () => { // This is for the Options Modal
            hideModal(optionsModal); 
            await populateBackupSelector(backupSelectorInput, errorMessages.restoreBackup, applyRestoreBackupButton);
            showModal(restoreBackupModal);
        });

        closeRestoreBackupModalButton.addEventListener('click', () => hideModal(restoreBackupModal) );
        applyRestoreBackupButton.addEventListener('click', async () => { // For Options Modal
            const selectedCharacterName = backupSelectorInput.value;
            if (!selectedCharacterName || backupSelectorInput.selectedOptions[0]?.disabled) {
                displayError(errorMessages.restoreBackup, 'Please select a valid backup from the list.'); return; }
            applyRestoreBackupButton.disabled = true; displayError(errorMessages.restoreBackup, ''); 
            const result = await apiRequest(`/api/backups/${selectedCharacterName}`, 'GET', null, errorMessages.restoreBackup);
            applyRestoreBackupButton.disabled = false;
            if (result && result.message && !result.error) {
                showInGameNotification(result.message, 'success'); 
                hideModal(restoreBackupModal);
                await refreshCurrentScreenState(); 
            } else if (!errorMessages.restoreBackup.textContent) {
                 displayError(errorMessages.restoreBackup, `Failed to restore backup for "${selectedCharacterName}": ${result?.error || 'Backup not found or error occurred.'}`);
            }
        });


        changeBackgroundButton.addEventListener('click', async () => {
            try {
                displayError(errorMessages.gameScreen, ''); 
                const backgrounds = await apiRequest('/api/backgrounds', 'GET', null, errorMessages.gameScreen); 
                if (backgrounds && Array.isArray(backgrounds)) {
                    backgroundSelectorInput.innerHTML = ''; 
                    if (backgrounds.length === 0) {
                        const option = document.createElement('option'); option.textContent = 'No backgrounds found in assets/backgrounds'; option.disabled = true;
                        backgroundSelectorInput.appendChild(option); applyBackgroundButton.disabled = true;
                    } else {
                        const lastBg = localStorage.getItem(LAST_BACKGROUND_KEY);
                        backgrounds.forEach(bgFile => {
                            const option = document.createElement('option'); option.value = bgFile;
                            option.textContent = bgFile.replace(/\.(png|jpe?g|gif|webp)$/i, '').replace(/_/g, ' ');
                            if (bgFile === lastBg) option.selected = true; 
                            backgroundSelectorInput.appendChild(option); });
                        applyBackgroundButton.disabled = false; }
                    showModal(backgroundSelectorModal);
                } else if (!errorMessages.gameScreen.textContent) { 
                    displayError(errorMessages.gameScreen, backgrounds?.error || 'Failed to load backgrounds list.'); }
            } catch (error) { 
                displayError(errorMessages.gameScreen, 'Error trying to fetch backgrounds: ' + error.message); }
        });
        applyBackgroundButton.addEventListener('click', async () => {
            const selectedBackgroundFile = backgroundSelectorInput.value;
            if (!selectedBackgroundFile || backgroundSelectorInput.selectedOptions[0]?.disabled) {
                showInGameNotification('Please select a background from the list.', 'warning'); return; }
            backgroundImage.src = `/assets/backgrounds/${selectedBackgroundFile}`;
            localStorage.setItem(LAST_BACKGROUND_KEY, selectedBackgroundFile); 
            hideModal(backgroundSelectorModal); applyBackgroundButton.disabled = true; 
            const payload = { backgroundName: selectedBackgroundFile };
            const result = await apiRequest(`/api/interact/background_change`, 'POST', payload, errorMessages.gameScreen);
            applyBackgroundButton.disabled = false; 
            await handleInteractionResponse(result); 
        });
        closeBackgroundSelectorModalButton.addEventListener('click', () => hideModal(backgroundSelectorModal) );

        musicSettingsButton.addEventListener('click', async () => {
            try {
                displayError(errorMessages.gameScreen, '');
                const musicTracks = await apiRequest('/api/music', 'GET', null, errorMessages.gameScreen);
                if (musicTracks && Array.isArray(musicTracks)) {
                    musicTrackSelector.innerHTML = '';
                    if (musicTracks.length === 0) {
                        const option = document.createElement('option'); option.textContent = 'No music found in assets/bg_music'; option.disabled = true;
                        musicTrackSelector.appendChild(option);
                    } else {
                        const currentTrack = localStorage.getItem(LAST_MUSIC_TRACK_KEY) || DEFAULT_MUSIC_TRACK;
                        musicTracks.forEach(trackFile => {
                            const option = document.createElement('option'); option.value = trackFile;
                            option.textContent = trackFile.replace(/\.(mp3|wav|ogg)$/i, '').replace(/_/g, ' ');
                            if (trackFile === currentTrack) option.selected = true;
                            musicTrackSelector.appendChild(option); }); }
                    if (bgMusicPlayer) musicVolumeSlider.value = bgMusicPlayer.volume; 
                    showModal(musicSettingsModal);
                } else if (!errorMessages.gameScreen.textContent) { 
                    displayError(errorMessages.gameScreen, musicTracks?.error || 'Failed to load music list.'); }
            } catch (error) {
                displayError(errorMessages.gameScreen, 'Error trying to fetch music list: ' + error.message); }
        });
        musicTrackSelector.addEventListener('change', () => {
            const selectedTrack = musicTrackSelector.value;
            if (selectedTrack && bgMusicPlayer) {
                playMusic(selectedTrack, bgMusicPlayer.volume); 
                localStorage.setItem(LAST_MUSIC_TRACK_KEY, selectedTrack); }
        });
        musicVolumeSlider.addEventListener('input', () => { 
            if (bgMusicPlayer) {
                const newVolume = parseFloat(musicVolumeSlider.value);
                bgMusicPlayer.volume = newVolume;
                localStorage.setItem(LAST_MUSIC_VOLUME_KEY, newVolume.toString()); }
        });
        closeMusicSettingsModalButton.addEventListener('click', () => hideModal(musicSettingsModal) );

        if (optOpenModdingFolderButton) {
            optOpenModdingFolderButton.addEventListener('click', () => {
                if (window.electronAPI && typeof window.electronAPI.openModdingFolder === 'function') window.electronAPI.openModdingFolder();
                else { console.error('electronAPI.openModdingFolder is not available.'); showInGameNotification('Error: Could not open modding folder.', 'error'); }
                hideModal(optionsModal); 
            });
        }
    }


    // --- App Initialization Sequence ---
    async function initializeApp() {
        initialMusicPlayAttempted = false; userHasInteracted = false;
        if (bgMusicPlayer && musicVolumeSlider) {
            const lastVolume = parseFloat(localStorage.getItem(LAST_MUSIC_VOLUME_KEY)) || DEFAULT_MUSIC_VOLUME;
            bgMusicPlayer.volume = lastVolume; musicVolumeSlider.value = lastVolume; }
        attachEventListeners(); 
        if (splashScreenElement && appContainerElement) {
            const FADE_IN_DURATION = 500; const HOLD_DURATION = 2000; const FADE_OUT_DURATION = 1000; 
            document.body.style.backgroundColor = '#000000'; appContainerElement.style.display = 'none'; 
            splashScreenElement.style.display = 'flex';
            setTimeout(() => { splashScreenElement.style.opacity = '1'; }, 50); 
            let screenIdToShow;
            try { screenIdToShow = await determineInitialScreenAndPrepareData(); 
            } catch (error) {
                console.error("Error determining initial screen and preparing data:", error);
                showInGameNotification("Critical error during app setup. Please check logs. Displaying API key screen as fallback.", "error", 0);
                screenIdToShow = 'apiKey'; }
            await new Promise(resolve => setTimeout(resolve, FADE_IN_DURATION + HOLD_DURATION));
            splashScreenElement.style.opacity = '0';
            setTimeout(() => {
                splashScreenElement.style.display = 'none'; appContainerElement.style.display = 'block'; 
                showScreen(screenIdToShow); toggleAttachButtonVisibility(); playInitialMusic(); 
            }, FADE_OUT_DURATION); 
        } else { 
            console.warn("Splash screen element or app container not found. Initializing app directly.");
            document.body.style.backgroundColor = '#000000'; 
            if(appContainerElement) appContainerElement.style.display = 'block';
            let screenIdToShow;
            try { screenIdToShow = await determineInitialScreenAndPrepareData();
            } catch (error) {
                console.error("Error during direct app initialization (determining screen):", error);
                showInGameNotification("Critical error during app setup. Displaying API key screen.", "error", 0);
                screenIdToShow = 'apiKey'; }
            showScreen(screenIdToShow); toggleAttachButtonVisibility(); playInitialMusic(); 
        }
    }
    initializeApp();
});