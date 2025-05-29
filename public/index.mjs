document.addEventListener('DOMContentLoaded', () => {
    // --- Splash Screen Elements ---
    const splashScreenElement = document.getElementById('splash-screen');
    const appContainerElement = document.getElementById('app-container');
    // --- DOM Elements ---
    const screens = {
        apiKey: document.getElementById('api-key-screen'),
        userData: document.getElementById('user-data-screen'),
        characterChoice: document.getElementById('character-choice-screen'), 
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
        characterChoice: document.getElementById('characterChoiceError'), 
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
    const backupSelectorInput = document.getElementById('backupSelectorInput'); 
    const applyRestoreBackupButton = document.getElementById('applyRestoreBackupButton'); 

    // Memory Viewer Modal
    const memoryViewerModal = document.getElementById('memory-viewer-modal');
    const closeMemoryViewerModalButton = document.getElementById('closeMemoryViewerModal');
    const memoryViewerTitle = document.getElementById('memoryViewerTitle');
    const memoryViewerContent = document.getElementById('memoryViewerContent');

    // Background Selector Modal Elements
    const changeBackgroundButton = document.getElementById('changeBackgroundButton');
    const backgroundSelectorModal = document.getElementById('background-selector-modal');
    const closeBackgroundSelectorModalButton = document.getElementById('closeBackgroundSelectorModal');
    const backgroundSelectorInputModal = document.getElementById('backgroundSelectorInput'); 
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
                const result = window.confirm(message); 
                resolve(result); return;
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
                placeholderOption.value = ""; placeholderOption.textContent = "Select a sprite folder";
                placeholderOption.disabled = true; if (!selectedValue) placeholderOption.selected = true;
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
                        if (charSpriteFolderSelector.options.length > 1 && charSpriteFolderSelector.options[0].disabled) charSpriteFolderSelector.selectedIndex = 1; 
                        else if (charSpriteFolderSelector.options.length > 0) charSpriteFolderSelector.selectedIndex = 0;
                    }
                } else if (charSpriteFolderSelector.options.length > 0 && charSpriteFolderSelector.options[0].disabled) charSpriteFolderSelector.selectedIndex = 0;
                charSpriteFolderSelector.disabled = false;
            } else {
                const option = document.createElement('option');
                option.value = ""; option.textContent = "No sprite folders found";
                option.disabled = true; option.selected = true;
                charSpriteFolderSelector.appendChild(option); charSpriteFolderSelector.disabled = true;
                if (spriteFolders && Array.isArray(spriteFolders) && spriteFolders.length === 0) {
                    displayError(errorMessages.characterCreate, "No sprite folders found in your assets/sprites directory. Please add some character sprite folders there and refresh or restart.");
                }
            }
        } catch (error) {
            displayError(errorMessages.characterCreate, "Could not load sprite folders. Check console.");
            charSpriteFolderSelector.innerHTML = '<option value="" disabled selected>Error loading folders</option>';
            charSpriteFolderSelector.disabled = true;
        }
    }

    async function populateBackupSelector(selectorElement, errorDisplayElement, applyButtonElement = null) {
        if (!selectorElement) return;
        selectorElement.disabled = true;
        selectorElement.innerHTML = '<option value="" disabled selected>Loading backups...</option>';
        if (applyButtonElement) applyButtonElement.disabled = true;
        if (errorDisplayElement) displayError(errorDisplayElement, '');
        try {
            const backupListResponse = await apiRequest('/api/backups/list', 'GET', null, errorDisplayElement);
            selectorElement.innerHTML = ''; 
            if (backupListResponse && Array.isArray(backupListResponse)) {
                if (backupListResponse.length === 0) {
                    const option = document.createElement('option');
                    option.textContent = 'No backups found.'; option.disabled = true; option.selected = true;
                    selectorElement.appendChild(option); selectorElement.disabled = true;
                    if (applyButtonElement) applyButtonElement.disabled = true;
                } else {
                    const placeholder = document.createElement('option');
                    placeholder.value = ""; placeholder.textContent = "Select a backup";
                    placeholder.disabled = true; placeholder.selected = true;
                    selectorElement.appendChild(placeholder);
                    backupListResponse.forEach(backupInfo => {
                        const option = document.createElement('option');
                        option.value = backupInfo.characterName; 
                        option.textContent = backupInfo.characterName.replace(/_/g, ' '); 
                        selectorElement.appendChild(option);
                    });
                    selectorElement.disabled = false;
                    if (applyButtonElement) applyButtonElement.disabled = false; 
                }
            } else {
                const option = document.createElement('option');
                option.textContent = 'Error loading backups'; option.disabled = true; option.selected = true;
                selectorElement.appendChild(option); selectorElement.disabled = true;
                if (applyButtonElement) applyButtonElement.disabled = true;
                if (errorDisplayElement && !errorDisplayElement.textContent) { 
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
            
            // Apply classes to appContainer and body for CSS-driven styling
            if (screenId === 'game') {
                appContainerElement.classList.remove('form-view-active');
                appContainerElement.classList.add('game-view-active');
                document.body.classList.remove('body-form-view');
                document.body.classList.add('body-game-view');
            } else { 
                appContainerElement.classList.remove('game-view-active');
                appContainerElement.classList.add('form-view-active');
                document.body.classList.remove('body-game-view');
                document.body.classList.add('body-form-view');
            }

            if (screenId === 'characterSetup' && !isCharacterProfileEditing) {
                populateSpriteFolderSelector(); 
            }
            if (screenId === 'characterChoice') {
                if (restoreOptionsSection) restoreOptionsSection.style.display = 'none';
                if (errorMessages.characterChoice) displayError(errorMessages.characterChoice, '');
            }
        } else {
            console.error("Screen not found:", screenId);
        }
    }

    function showModal(modalElement) { if (modalElement) modalElement.style.display = 'flex'; }
    function hideModal(modalElement) { if (modalElement) modalElement.style.display = 'none'; }

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
        } else if (finalMessage) {
            showInGameNotification(finalMessage, 'error', 7000); 
        }
    }

    async function apiRequest(url, method, body, errorElement, isInitialCheck = false) {
         try {
            const options = { method: method, headers: { 'Content-Type': 'application/json' } };
            if (body) options.body = JSON.stringify(body);
            const response = await fetch(url, options);
            if (errorElement && (!isInitialCheck || response.ok)) displayError(errorElement, ''); 
            if (response.status === 204) return { success: true, status: response.status };
            if (isInitialCheck && response.status === 404) {
                return await response.json().catch(() => ({ notFound: true, status: 404, error: "Resource not found." }));
            }
            const responseData = await response.json().catch(async () => {
                const text = await response.text().catch(() => "Could not read response text.");
                return { parseError: true, status: response.status, text: text }; 
            });
            if (responseData.parseError) {
                const errorMsg = `Server returned non-JSON response (Status ${responseData.status}). Check console.`;
                if (errorElement) displayError(errorElement, errorMsg);
                else if (!isInitialCheck) showInGameNotification(errorMsg, 'error');
                return responseData;
            }
            if (!response.ok) {
                const errorToDisplay = responseData?.error || `Request failed: ${response.status} ${response.statusText}`;
                if (errorElement && (!isInitialCheck || (isInitialCheck && response.status !== 404))) displayError(errorElement, errorToDisplay);
                else if (!isInitialCheck && !errorElement) showInGameNotification(errorToDisplay, 'error');
                return { ...responseData, error: errorToDisplay, status: response.status }; 
            }
            return responseData;
        } catch (error) {
            const networkErrorMsg = `Network error: ${error.message}. Server running?`;
            if (errorElement) displayError(errorElement, networkErrorMsg);
            else if (!isInitialCheck) showInGameNotification(networkErrorMsg, 'error');
            return { networkError: true, message: error.message, error: networkErrorMsg };
        }
    }

    function addMessageToDisplay(role, content, imageData = null) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add(role === 'user' ? 'user-message' : 'assistant-message');
        const textSpan = document.createElement('span');
        textSpan.textContent = content; messageDiv.appendChild(textSpan);
        if (imageData) {
            const img = document.createElement('img');
            img.src = imageData; img.alt = role === 'user' ? "User's image" : "Assistant's image";
            img.classList.add('message-image-thumbnail'); messageDiv.appendChild(img);
        }
        messageDisplay.appendChild(messageDiv);
        messageDisplay.scrollTop = messageDisplay.scrollHeight; 
    }

    async function changeSprite(spriteName) {
        if (!currentSpriteFolder || !spriteName) {
            if (currentSpriteFolder && !spriteName) spriteName = 'normal.png';
            else if (!currentSpriteFolder) { 
                if(characterSprite) characterSprite.style.opacity = 0; return; }
        }
        if(!characterSprite) return;
        characterSprite.style.opacity = 0;
        setTimeout(() => {
            const newSrc = `/assets/sprites/${currentSpriteFolder}/${spriteName}`;
            characterSprite.src = newSrc;
            characterSprite.onload = () => { characterSprite.style.opacity = 1; };
            characterSprite.onerror = () => {
                characterSprite.src = `/assets/sprites/${currentSpriteFolder}/normal.png`; 
                characterSprite.onload = () => characterSprite.style.opacity = 1; 
                characterSprite.onerror = () => { characterSprite.style.opacity = 0; };
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
        } else forms.userData.reset();
    }

    async function goToGameScreen(isNewCharacterSetup = false) {
        if (!currentSpriteFolder && currentCharacterSetupData?.sprite) currentSpriteFolder = currentCharacterSetupData.sprite;
        if (!currentSpriteFolder) {
            displayError(errorMessages.gameScreen, "Error: Sprite folder not set.");
            showScreen('characterSetup'); return;
        }
        const lastBg = localStorage.getItem(LAST_BACKGROUND_KEY);
        if (backgroundImage) backgroundImage.src = lastBg ? `/assets/backgrounds/${lastBg}` : '/assets/backgrounds/living_room.png';
        if (messageDisplay) messageDisplay.innerHTML = '';
        if (isNewCharacterSetup) await changeSprite('normal.png'); 
        else {
            const shortTermMemory = await apiRequest('/api/memory/short_term', 'GET', null, errorMessages.gameScreen);
            if (shortTermMemory && Array.isArray(shortTermMemory) && shortTermMemory.length > 0) {
                const lastAssistantMessage = [...shortTermMemory].reverse().find(msg => msg.role === 'assistant');
                await changeSprite(lastAssistantMessage?.sprite || 'normal.png'); 
                shortTermMemory.slice(-10).forEach(msg => addMessageToDisplay(msg.role, msg.content, msg.image_data));
            } else {
                await changeSprite('normal.png'); 
                if (shortTermMemory && !Array.isArray(shortTermMemory)) displayError(errorMessages.gameScreen, "Failed to load chat history.");
            }
        }
        showScreen('game');
        toggleAttachButtonVisibility();
    }

    async function determineInitialScreenAndPrepareData() {
        const apiKeyStatusResponse = await apiRequest('/api/status/api_key', 'GET', null, null, true);
        if (!apiKeyStatusResponse || apiKeyStatusResponse.networkError) {
            displayError(errorMessages.apiKey, apiKeyStatusResponse?.message || "Could not connect to server.");
            return 'apiKey';
        }
        visionSupportedByCurrentModel = apiKeyStatusResponse.supports_vision || false;
        if(supportsVisionCheckbox) supportsVisionCheckbox.checked = visionSupportedByCurrentModel;
        if(apiKeySupportsVisionCheckbox) apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel;
        if (!apiKeyStatusResponse.configured) return 'apiKey';

        const userDataResponse = await apiRequest('/api/user_data', 'GET', null, null, true); 
        if (userDataResponse && userDataResponse.name && !userDataResponse.notFound) {
            currentUserData = userDataResponse;
            const charProfileResponse = await apiRequest('/api/personality', 'GET', null, null, true);
            if (charProfileResponse && charProfileResponse.profile && charProfileResponse.general?.sprite && !charProfileResponse.notFound) {
                currentCharacterPersonalityText = charProfileResponse.profile;
                currentCharacterSetupData = charProfileResponse.general; 
                currentSpriteFolder = charProfileResponse.general.sprite;
                if (generatedPersonalityTextarea) generatedPersonalityTextarea.value = currentCharacterPersonalityText;
                if (forms.characterCreate?.name) { 
                    forms.characterCreate.name.value = currentCharacterSetupData.name || '';
                    forms.characterCreate.looks.value = currentCharacterSetupData.looks || '';
                    forms.characterCreate.personality.value = currentCharacterSetupData.rawPersonalityInput || ''; 
                    forms.characterCreate.language.value = currentCharacterSetupData.language || 'English';
                }
                const lastBg = localStorage.getItem(LAST_BACKGROUND_KEY);
                if (backgroundImage) backgroundImage.src = lastBg ? `/assets/backgrounds/${lastBg}` : '/assets/backgrounds/living_room.png';
                if (messageDisplay) messageDisplay.innerHTML = '';
                const shortTermMemory = await apiRequest('/api/memory/short_term', 'GET', null, errorMessages.gameScreen);
                if (shortTermMemory && Array.isArray(shortTermMemory) && shortTermMemory.length > 0) {
                    const lastAssistantMessage = [...shortTermMemory].reverse().find(msg => msg.role === 'assistant');
                    await changeSprite(lastAssistantMessage?.sprite || 'normal.png'); 
                    shortTermMemory.slice(-10).forEach(msg => addMessageToDisplay(msg.role, msg.content, msg.image_data));
                } else {
                    await changeSprite('normal.png'); 
                    if (shortTermMemory && !Array.isArray(shortTermMemory)) displayError(errorMessages.gameScreen, "Failed to load chat history.");
                }
                return 'game';
            } else { 
                prefillUserDataForm(); 
                if (charProfileResponse?.error && !charProfileResponse.notFound) displayError(errorMessages.characterCreate, `Error fetching character profile: ${charProfileResponse.error}`);
                return 'characterChoice';
            }
        } else { 
            prefillUserDataForm(); 
            if (userDataResponse?.error && !userDataResponse.notFound) displayError(errorMessages.userData, `Error fetching user data: ${userDataResponse.error}`);
            return 'userData';
        }
    }

    function playMusic(trackFilename, volume) {
        if (!trackFilename || !bgMusicPlayer) return;
        const newSrc = `/assets/bg_music/${trackFilename}`;
        if (!bgMusicPlayer.src.endsWith(newSrc) || bgMusicPlayer.paused) bgMusicPlayer.src = newSrc;
        bgMusicPlayer.volume = volume;
        if(!(bgMusicPlayer.readyState >= 2 && bgMusicPlayer.currentTime > 0 && bgMusicPlayer.src.endsWith(newSrc))) bgMusicPlayer.currentTime = 0; 
        const playPromise = bgMusicPlayer.play();
        if (playPromise !== undefined) playPromise.then(() => userHasInteracted = true).catch(error => console.warn("Music play failed:", error));
    }

    function playInitialMusic() {
        if ((initialMusicPlayAttempted && !bgMusicPlayer.paused) || (initialMusicPlayAttempted && bgMusicPlayer.paused && !userHasInteracted)) return;
        initialMusicPlayAttempted = true; 
        const lastTrack = localStorage.getItem(LAST_MUSIC_TRACK_KEY) || DEFAULT_MUSIC_TRACK;
        const lastVolume = parseFloat(localStorage.getItem(LAST_MUSIC_VOLUME_KEY)) || DEFAULT_MUSIC_VOLUME;
        if (musicVolumeSlider) musicVolumeSlider.value = lastVolume;
        if (!bgMusicPlayer) return;
        bgMusicPlayer.src = `/assets/bg_music/${lastTrack}`; bgMusicPlayer.volume = lastVolume;
        setTimeout(() => {
            const playPromise = bgMusicPlayer.play();
            if (playPromise !== undefined) playPromise.then(() => userHasInteracted = true).catch(error => console.warn("Initial music autoplay failed:", error.name));
        }, 100); 
    }
    
    function markUserInteraction() {
        if (!userHasInteracted) {
            userHasInteracted = true;
            if (bgMusicPlayer && bgMusicPlayer.paused && bgMusicPlayer.src && initialMusicPlayAttempted) {
                 const playPromise = bgMusicPlayer.play();
                 if (playPromise !== undefined) playPromise.catch(e => console.warn("Playback after interaction failed:", e));
            } else if (bgMusicPlayer && !bgMusicPlayer.src && !initialMusicPlayAttempted) playInitialMusic();
        }
    }

    async function handleInteractionResponse(result) {
        if (result?.content) {
            addMessageToDisplay('assistant', result.content);
            if (result.sprite) await changeSprite(result.sprite);
            if (errorMessages.gameScreen) displayError(errorMessages.gameScreen, ''); 
        } else {
            const errorMessage = result?.error || "LLM interaction failed.";
            addMessageToDisplay('assistant', `Sorry, I had trouble responding. (${errorMessage})`);
            if (errorMessages.gameScreen) displayError(errorMessages.gameScreen, errorMessage);
        }
    }

    async function refreshCurrentScreenState() {
        const nextScreen = await determineInitialScreenAndPrepareData();
        showScreen(nextScreen);
        toggleAttachButtonVisibility();
    }

    function attachEventListeners() {
        document.body.addEventListener('click', markUserInteraction, { capture: true, once: true });
        if (confirmYesButton && confirmNoButton && closeConfirmationModalInternalButton && confirmationModal) {
            confirmYesButton.onclick = () => { hideModal(confirmationModal); if (_resolveConfirmationPromise) _resolveConfirmationPromise(true); _resolveConfirmationPromise = null; };
            confirmNoButton.onclick = () => { hideModal(confirmationModal); if (_resolveConfirmationPromise) _resolveConfirmationPromise(false); _resolveConfirmationPromise = null; };
            closeConfirmationModalInternalButton.onclick = () => { hideModal(confirmationModal); if (_resolveConfirmationPromise) _resolveConfirmationPromise(false); _resolveConfirmationPromise = null; };
        }

        forms.apiKey.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(forms.apiKey); const data = Object.fromEntries(formData.entries());
            data.supports_vision = apiKeySupportsVisionCheckbox.checked;
            const result = await apiRequest('/api/api_key', 'POST', data, errorMessages.apiKey); 
            if (result?.model && !result.error) { 
                visionSupportedByCurrentModel = result.supports_vision || false;
                if (supportsVisionCheckbox) supportsVisionCheckbox.checked = visionSupportedByCurrentModel;
                await refreshCurrentScreenState();
            }
        });

        forms.userData.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(forms.userData); let data = Object.fromEntries(formData.entries());
            if (!data.name?.trim() || !data.gender?.trim() || !data.pronouns?.trim()) {
                displayError(errorMessages.userData, "Name, Gender, and Pronouns are required."); return;
            }
            const result = await apiRequest('/api/user_data', isUserDataEditing ? 'PATCH' : 'POST', data, errorMessages.userData);
            if (result && (result.name || result.status < 300) && !result.error) {
                currentUserData = result.name ? result : { ...currentUserData, ...data };
                if (isUserDataEditing) {
                    showInGameNotification('User data updated!', 'success'); hideModal(optionsModal);
                    isUserDataEditing = false; userDataSubmitButton.textContent = 'Save User Data';
                    await refreshCurrentScreenState(); 
                } else showScreen('characterChoice'); 
            } else if (!result) displayError(errorMessages.userData, "Failed to save user data.");
        });

        if (choiceCreateNewButton) choiceCreateNewButton.addEventListener('click', () => { showScreen('characterSetup'); resetCharacterSetupToCreationMode(); });
        if (choiceShowRestoreOptionsButton) choiceShowRestoreOptionsButton.addEventListener('click', async () => {
            if (restoreOptionsSection.style.display === 'none') {
                restoreOptionsSection.style.display = 'block';
                await populateBackupSelector(choiceBackupSelector, errorMessages.characterChoice, choiceApplyRestoreButton);
            } else restoreOptionsSection.style.display = 'none';
        });
        if (choiceApplyRestoreButton) choiceApplyRestoreButton.addEventListener('click', async () => {
            const selectedName = choiceBackupSelector.value;
            if (!selectedName || choiceBackupSelector.selectedOptions[0]?.disabled) {
                displayError(errorMessages.characterChoice, 'Please select a backup.'); return;
            }
            choiceApplyRestoreButton.disabled = true; displayError(errorMessages.characterChoice, ''); 
            const result = await apiRequest(`/api/backups/${selectedName}`, 'GET', null, errorMessages.characterChoice);
            choiceApplyRestoreButton.disabled = false;
            if (result?.message && !result.error) {
                showInGameNotification(result.message, 'success'); await refreshCurrentScreenState();
            } else if (!errorMessages.characterChoice.textContent) displayError(errorMessages.characterChoice, `Failed to restore: ${result?.error || 'Error.'}`);
        });

        forms.characterCreate.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(forms.characterCreate); const data = Object.fromEntries(formData.entries());
            if (!data.name?.trim() || !data.looks?.trim() || !data.personality?.trim() || !data.language?.trim() || !data.sprite?.trim()) {
                displayError(errorMessages.characterCreate, "All fields with * are required."); return;
            }
            characterCreateFormSubmitButton.disabled = true; 
            const result = await apiRequest('/api/personality', 'POST', data, errorMessages.characterCreate);
            characterCreateFormSubmitButton.disabled = false; 
            if (result?.characterProfile && !result.error) {
                currentCharacterPersonalityText = result.characterProfile;
                const generalInfo = await apiRequest('/api/personality', 'GET', null, errorMessages.characterCreate);
                if (generalInfo?.general) {
                    currentCharacterSetupData = generalInfo.general; currentSpriteFolder = generalInfo.general.sprite; 
                } else { 
                    currentCharacterSetupData = { ...data, rawPersonalityInput: data.personality };
                    currentSpriteFolder = data.sprite; 
                }
                generatedPersonalityTextarea.value = result.characterProfile;
                characterEditSection.style.display = 'block'; continueToGameButtonElement.style.display = 'inline-block';
                if (isCharacterProfileEditing) showInGameNotification('Character regenerated!', 'success');
            }
        });

        saveEditedPersonalityButton.addEventListener('click', async () => {
            const editedProfile = generatedPersonalityTextarea.value;
            const formData = new FormData(forms.characterCreate); const generalData = Object.fromEntries(formData.entries());
            if (!generalData.name?.trim() || !generalData.looks?.trim() || !generalData.language?.trim() || !generalData.sprite?.trim()) {
                displayError(errorMessages.characterEdit, "Core details (Name, Gender, Language, Sprite) are required."); return;
            }
             if (!editedProfile.trim() && !generalData.personality?.trim()) {
                displayError(errorMessages.characterEdit, 'Profile text or personality description must be filled.'); return;
            }
            const patchData = { edit: editedProfile.trim(), general: {
                name: generalData.name, looks: generalData.looks, sprite: generalData.sprite,
                language: generalData.language, rawPersonalityInput: generalData.personality }};
            saveEditedPersonalityButton.disabled = true;
            const result = await apiRequest('/api/personality', 'PATCH', patchData, errorMessages.characterEdit);
            saveEditedPersonalityButton.disabled = false;
            if (result && (result.characterProfile !== undefined || result.message) && !result.error) {
                if (result.characterProfile !== undefined) { 
                    currentCharacterPersonalityText = result.characterProfile; generatedPersonalityTextarea.value = result.characterProfile; 
                }
                if (result.general) { currentCharacterSetupData = result.general; currentSpriteFolder = result.general.sprite;
                } else {
                    const generalInfo = await apiRequest('/api/personality', 'GET', null, errorMessages.characterEdit);
                    if (generalInfo?.general) { currentCharacterSetupData = generalInfo.general; currentSpriteFolder = generalInfo.general.sprite; }
                }
                showInGameNotification('Character saved!', 'success');
                if (isCharacterProfileEditing) {
                    resetCharacterSetupToCreationMode(); isCharacterProfileEditing = false; 
                    await goToGameScreen(false); hideModal(optionsModal); 
                } else { characterEditSection.style.display = 'block'; continueToGameButtonElement.style.display = 'inline-block'; }
            }
        });
        
        continueToGameButtonElement.addEventListener('click', async () => {
            if (!currentCharacterSetupData.name || !currentCharacterSetupData.sprite) { 
                const formData = new FormData(forms.characterCreate);
                currentCharacterSetupData = { name: formData.get('name'), looks: formData.get('looks'), language: formData.get('language'),
                                          sprite: formData.get('sprite'), rawPersonalityInput: formData.get('personality') };
                currentSpriteFolder = formData.get('sprite');
            }
            if (!currentSpriteFolder) { displayError(errorMessages.characterEdit, "Sprite folder missing."); return; }
            await goToGameScreen(true); 
        });

        sendMessageButton.addEventListener('click', async () => {
            const messageText = userMessageInput.value.trim();
            if (!messageText && !selectedImageBase64) return;
            addMessageToDisplay('user', messageText || "[Image]", selectedImageBase64); 
            const payload = { message: messageText }; if (selectedImageBase64) payload.image_data = selectedImageBase64;
            userMessageInput.value = ''; removeImagePreview(); 
            sendMessageButton.disabled = true; attachImageButton.disabled = true;
            const result = await apiRequest('/api/message', 'POST', payload, errorMessages.gameScreen);
            sendMessageButton.disabled = false; if (visionSupportedByCurrentModel) attachImageButton.disabled = false;
            await handleInteractionResponse(result);
        });
        userMessageInput.addEventListener('keypress', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessageButton.click(); } });
        performActionButton.addEventListener('click', async () => {
            const selectedAction = actionSelector.value; if (!selectedAction) return;
            performActionButton.disabled = true;
            const result = await apiRequest(`/api/interact/${selectedAction}`, 'POST', {}, errorMessages.gameScreen);
            performActionButton.disabled = false; await handleInteractionResponse(result);
        });
        attachImageButton.addEventListener('click', () => imageUploadInput.click());
        imageUploadInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (!['image/png', 'image/jpeg', 'image/gif', 'image/webp'].includes(file.type)) {
                    showInGameNotification('Invalid file type.', 'error'); imageUploadInput.value = ''; return; }
                if (file.size > 7 * 1024 * 1024) { 
                    showInGameNotification('File too large (max 7MB).', 'error'); imageUploadInput.value = ''; return; }
                const reader = new FileReader();
                reader.onload = (e) => { selectedImageBase64 = e.target.result; imagePreview.src = selectedImageBase64; imagePreviewContainer.style.display = 'flex'; };
                reader.readAsDataURL(file);
            }
            imageUploadInput.value = '';
        });
        function removeImagePreview() { selectedImageBase64 = null; imagePreview.src = '#'; imagePreviewContainer.style.display = 'none'; imageUploadInput.value = ''; }
        removeImagePreviewButton.addEventListener('click', removeImagePreview);

        optionsButton.addEventListener('click', () => { if(supportsVisionCheckbox) supportsVisionCheckbox.checked = visionSupportedByCurrentModel; showModal(optionsModal); });
        closeOptionsModalButton.addEventListener('click', () => { if (isCharacterProfileEditing) { resetCharacterSetupToCreationMode(); isCharacterProfileEditing = false; } hideModal(optionsModal); });
        supportsVisionCheckbox.addEventListener('change', async (event) => {
            const newStatus = event.target.checked;
            const result = await apiRequest('/api/config/vision', 'PATCH', { supports_vision: newStatus }, errorMessages.gameScreen);
            if (result?.supports_vision !== undefined && !result.error) {
                visionSupportedByCurrentModel = result.supports_vision;
                if(apiKeySupportsVisionCheckbox) apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel; 
                toggleAttachButtonVisibility(); showInGameNotification(`Vision support ${visionSupportedByCurrentModel ? 'enabled' : 'disabled'}.`, 'info');
            } else { supportsVisionCheckbox.checked = visionSupportedByCurrentModel; showInGameNotification('Failed to update vision setting.', 'error'); }
        });
        window.addEventListener('click', (event) => {
            if (event.target === optionsModal) { if (isCharacterProfileEditing) { resetCharacterSetupToCreationMode(); isCharacterProfileEditing = false; } hideModal(optionsModal); }
            if (event.target === memoryViewerModal) hideModal(memoryViewerModal);
            if (event.target === backgroundSelectorModal) hideModal(backgroundSelectorModal);
            if (event.target === musicSettingsModal) hideModal(musicSettingsModal);
            if (event.target === restoreBackupModal) hideModal(restoreBackupModal);
            if (event.target === confirmationModal) { hideModal(confirmationModal); if (_resolveConfirmationPromise) _resolveConfirmationPromise(false); _resolveConfirmationPromise = null; }
        });
        optChangeApiKey.addEventListener('click', async () => {
            hideModal(optionsModal); showScreen('apiKey'); forms.apiKey.reset(); displayError(errorMessages.apiKey, ''); 
            const { model, key, endpoint } = forms.apiKey.elements;
            try {
                const currentConfig = await apiRequest('/api/api_key_data', 'GET', null, null, true);
                if (currentConfig && !currentConfig.error && !currentConfig.notFound) {
                    if (model) model.value = currentConfig.model || '';
                    if (key) key.value = currentConfig.key || ''; 
                    if (endpoint) endpoint.value = currentConfig.base_url || '';
                    if(apiKeySupportsVisionCheckbox) apiKeySupportsVisionCheckbox.checked = currentConfig.supports_vision ?? visionSupportedByCurrentModel;
                } else if (currentConfig?.error && !currentConfig.notFound) displayError(errorMessages.apiKey, `Could not load API key: ${currentConfig.error}`);
                if(apiKeySupportsVisionCheckbox) apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel;
            } catch (error) { 
                displayError(errorMessages.apiKey, "Could not load API key due to error.");
                if(apiKeySupportsVisionCheckbox) apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel;
            }
        });
        optChangeUserData.addEventListener('click', async () => { hideModal(optionsModal); isUserDataEditing = true; userDataSubmitButton.textContent = 'Update User Data'; prefillUserDataForm(); showScreen('userData'); });
        optChangeCharProfile.addEventListener('click', async () => {
            hideModal(optionsModal); isCharacterProfileEditing = true;
            const charProfileResponse = await apiRequest('/api/personality', 'GET', null, errorMessages.characterCreate, true);
            if (charProfileResponse?.profile !== undefined && charProfileResponse.general && !charProfileResponse.error) {
                currentCharacterPersonalityText = charProfileResponse.profile; currentCharacterSetupData = charProfileResponse.general;
                currentSpriteFolder = charProfileResponse.general.sprite;
                forms.characterCreate.name.value = currentCharacterSetupData.name || '';
                forms.characterCreate.looks.value = currentCharacterSetupData.looks || '';
                forms.characterCreate.personality.value = currentCharacterSetupData.rawPersonalityInput || '';
                forms.characterCreate.language.value = currentCharacterSetupData.language || 'English';
                await populateSpriteFolderSelector(currentCharacterSetupData.sprite || ''); 
                generatedPersonalityTextarea.value = currentCharacterPersonalityText;
                characterEditSection.style.display = 'block';
                characterCreateFormSubmitButton.textContent = 'Regenerate Profile'; 
                saveEditedPersonalityButton.textContent = 'Save All Data';
                continueToGameButtonElement.style.display = 'none'; 
            } else { showInGameNotification('Could not load profile for editing.', 'error'); isCharacterProfileEditing = false; return; }
            showScreen('characterSetup');
        });
        function resetCharacterSetupToCreationMode() {
            if (characterCreateFormSubmitButton) characterCreateFormSubmitButton.textContent = 'Generate Profile';
            saveEditedPersonalityButton.textContent = 'Save Edited Profile'; 
            continueToGameButtonElement.style.display = 'none';
            forms.characterCreate.reset(); generatedPersonalityTextarea.value = '';
            populateSpriteFolderSelector(); 
            forms.characterCreate.style.display = 'block'; characterEditSection.style.display = 'none'; 
        }
        optCreateNewCharacterButton.addEventListener('click', async () => {
            hideModal(optionsModal);
            if (!await showInGameConfirmation("This deletes current character data.\nBackup first if needed.\n\nContinue?", "Create New Confirmation")) return;
            const result = await apiRequest('/api/memory', 'DELETE', null, errorMessages.gameScreen);
            if (result && (result.success || result.status < 300) && !result.error) {
                showInGameNotification('Current character data deleted.', 'info', 4000);
                localStorage.removeItem(LAST_BACKGROUND_KEY); localStorage.removeItem(LAST_MUSIC_TRACK_KEY); localStorage.removeItem(LAST_MUSIC_VOLUME_KEY);
                if (bgMusicPlayer) { bgMusicPlayer.pause(); bgMusicPlayer.src = ""; }
                initialMusicPlayAttempted = false;
                currentCharacterPersonalityText = ''; currentCharacterSetupData = {}; currentSpriteFolder = '';
                if(messageDisplay) messageDisplay.innerHTML = '';
                resetCharacterSetupToCreationMode(); isCharacterProfileEditing = false;
                await refreshCurrentScreenState();
            } else showInGameNotification(`Failed to delete data: ${result?.error || 'Error'}`, 'error');
        });
        async function showMemory(type) {
            const endpoint = type === 'shortTerm' ? '/api/memory/short_term' : '/api/memory/long_term';
            const title = type === 'shortTerm' ? 'Chat History' : "Character's Diary";
            const data = await apiRequest(endpoint, 'GET', null, null); 
            memoryViewerTitle.textContent = title; memoryViewerContent.innerHTML = ''; 
            if (data && Array.isArray(data)) {
                if (data.length === 0) memoryViewerContent.textContent = 'No entries.';
                else {
                    const ul = document.createElement('ul'); ul.style.cssText = 'list-style-type:none;padding-left:0;';
                    const charName = currentCharacterSetupData?.name || 'Character'; const userName = currentUserData?.name || 'User';
                    data.forEach(entry => {
                        const li = document.createElement('li');
                        li.style.cssText = 'margin-bottom:0.625rem;padding:0.5rem;border:1px solid rgba(255,255,255,0.2);border-radius:0.25rem;';
                        let displayName, roleClass;
                        if (entry.role === 'assistant') { displayName = charName; roleClass = 'memory-char-header'; } 
                        else if (entry.role === 'user') { displayName = userName; roleClass = 'memory-user-header'; } 
                        else { displayName = entry.role || 'Entry'; roleClass = 'memory-generic-header'; }
                        let headerHTML = `<span class="${roleClass}"><strong>${displayName}</strong> (${new Date(entry.timestamp).toLocaleString()})</span><br>`;
                        if (entry.sprite && entry.role === 'assistant') headerHTML += `<span class="memory-sprite-info">(Sprite: ${entry.sprite})</span><br>`;
                        li.innerHTML = headerHTML;
                        li.appendChild(document.createTextNode(entry.content));
                        if (entry.image_data && type === 'shortTerm') { 
                            const img = document.createElement('img'); img.src = entry.image_data; img.alt = "Image";
                            img.classList.add('message-image-thumbnail'); img.style.marginTop = '0.3125rem'; li.appendChild(img); }
                        ul.appendChild(li); });
                    memoryViewerContent.appendChild(ul); }
            } else memoryViewerContent.textContent = `Failed to load. ${data?.error || 'Error.'}`;
            showModal(memoryViewerModal);
        }
        optViewShortTermMemory.addEventListener('click', () => { hideModal(optionsModal); showMemory('shortTerm'); });
        optViewLongTermMemory.addEventListener('click', async () => {
            hideModal(optionsModal); showMemory('longTerm'); 
            apiRequest('/api/interact/view_diary', 'POST', {}, errorMessages.gameScreen)
                .then(handleInteractionResponse).catch(e => handleInteractionResponse({ error: e.message || "Diary view reaction failed." }));
        });
        closeMemoryViewerModalButton.addEventListener('click', () => hideModal(memoryViewerModal));
        optCreateBackupButton.addEventListener('click', async () => {
            hideModal(optionsModal);
            const result = await apiRequest('/api/backups/create', 'POST', {}, errorMessages.gameScreen); 
            if (result?.message && !result.error) showInGameNotification(result.message, 'success');
            else if (!errorMessages.gameScreen.textContent) showInGameNotification(`Backup failed: ${result?.error || 'Error'}`, 'error');
        });
        optRestoreCharacterButton.addEventListener('click', async () => { 
            hideModal(optionsModal); 
            await populateBackupSelector(backupSelectorInput, errorMessages.restoreBackup, applyRestoreBackupButton);
            showModal(restoreBackupModal);
        });
        closeRestoreBackupModalButton.addEventListener('click', () => hideModal(restoreBackupModal) );
        applyRestoreBackupButton.addEventListener('click', async () => { 
            const selectedName = backupSelectorInput.value;
            if (!selectedName || backupSelectorInput.selectedOptions[0]?.disabled) {
                displayError(errorMessages.restoreBackup, 'Please select a backup.'); return; }
            applyRestoreBackupButton.disabled = true; displayError(errorMessages.restoreBackup, ''); 
            const result = await apiRequest(`/api/backups/${selectedName}`, 'GET', null, errorMessages.restoreBackup);
            applyRestoreBackupButton.disabled = false;
            if (result?.message && !result.error) {
                showInGameNotification(result.message, 'success'); hideModal(restoreBackupModal); await refreshCurrentScreenState(); 
            } else if (!errorMessages.restoreBackup.textContent) displayError(errorMessages.restoreBackup, `Restore failed: ${result?.error || 'Error.'}`);
        });
        changeBackgroundButton.addEventListener('click', async () => {
            try {
                displayError(errorMessages.gameScreen, ''); 
                const bgs = await apiRequest('/api/backgrounds', 'GET', null, errorMessages.gameScreen); 
                if (bgs && Array.isArray(bgs)) {
                    backgroundSelectorInputModal.innerHTML = ''; 
                    if (bgs.length === 0) {
                        const opt = document.createElement('option'); opt.textContent = 'No backgrounds found.'; opt.disabled = true;
                        backgroundSelectorInputModal.appendChild(opt); applyBackgroundButton.disabled = true;
                    } else {
                        const lastBg = localStorage.getItem(LAST_BACKGROUND_KEY);
                        bgs.forEach(bg => {
                            const opt = document.createElement('option'); opt.value = bg;
                            opt.textContent = bg.replace(/\.(png|jpe?g|gif|webp)$/i, '').replace(/_/g, ' ');
                            if (bg === lastBg) opt.selected = true; 
                            backgroundSelectorInputModal.appendChild(opt); });
                        applyBackgroundButton.disabled = false; }
                    showModal(backgroundSelectorModal);
                } else if (!errorMessages.gameScreen.textContent) displayError(errorMessages.gameScreen, bgs?.error || 'Failed to load backgrounds.');
            } catch (error) { displayError(errorMessages.gameScreen, 'Error fetching backgrounds: ' + error.message); }
        });
        applyBackgroundButton.addEventListener('click', async () => {
            const selectedBg = backgroundSelectorInputModal.value;
            if (!selectedBg || backgroundSelectorInputModal.selectedOptions[0]?.disabled) {
                showInGameNotification('Select a background.', 'warning'); return; }
            backgroundImage.src = `/assets/backgrounds/${selectedBg}`; localStorage.setItem(LAST_BACKGROUND_KEY, selectedBg); 
            hideModal(backgroundSelectorModal); applyBackgroundButton.disabled = true; 
            const result = await apiRequest(`/api/interact/background_change`, 'POST', { backgroundName: selectedBg }, errorMessages.gameScreen);
            applyBackgroundButton.disabled = false; await handleInteractionResponse(result); 
        });
        closeBackgroundSelectorModalButton.addEventListener('click', () => hideModal(backgroundSelectorModal) );
        musicSettingsButton.addEventListener('click', async () => {
            try {
                displayError(errorMessages.gameScreen, '');
                const tracks = await apiRequest('/api/music', 'GET', null, errorMessages.gameScreen);
                if (tracks && Array.isArray(tracks)) {
                    musicTrackSelector.innerHTML = '';
                    if (tracks.length === 0) {
                        const opt = document.createElement('option'); opt.textContent = 'No music found.'; opt.disabled = true;
                        musicTrackSelector.appendChild(opt);
                    } else {
                        const currentTrack = localStorage.getItem(LAST_MUSIC_TRACK_KEY) || DEFAULT_MUSIC_TRACK;
                        tracks.forEach(track => {
                            const opt = document.createElement('option'); opt.value = track;
                            opt.textContent = track.replace(/\.(mp3|wav|ogg)$/i, '').replace(/_/g, ' ');
                            if (track === currentTrack) opt.selected = true;
                            musicTrackSelector.appendChild(opt); }); }
                    if (bgMusicPlayer) musicVolumeSlider.value = bgMusicPlayer.volume; 
                    showModal(musicSettingsModal);
                } else if (!errorMessages.gameScreen.textContent) displayError(errorMessages.gameScreen, tracks?.error || 'Failed to load music.');
            } catch (error) { displayError(errorMessages.gameScreen, 'Error fetching music: ' + error.message); }
        });
        musicTrackSelector.addEventListener('change', () => {
            const track = musicTrackSelector.value;
            if (track && bgMusicPlayer) { playMusic(track, bgMusicPlayer.volume); localStorage.setItem(LAST_MUSIC_TRACK_KEY, track); }
        });
        musicVolumeSlider.addEventListener('input', () => { 
            if (bgMusicPlayer) {
                const vol = parseFloat(musicVolumeSlider.value);
                bgMusicPlayer.volume = vol; localStorage.setItem(LAST_MUSIC_VOLUME_KEY, vol.toString()); }
        });
        closeMusicSettingsModalButton.addEventListener('click', () => hideModal(musicSettingsModal) );
        if (optOpenModdingFolderButton) {
            optOpenModdingFolderButton.addEventListener('click', () => {
                if (window.electronAPI?.openModdingFolder) window.electronAPI.openModdingFolder();
                else showInGameNotification('Error: Could not open modding folder.', 'error');
                hideModal(optionsModal); 
            });
        }
    }

    async function initializeApp() {
        initialMusicPlayAttempted = false; userHasInteracted = false;
        if (bgMusicPlayer && musicVolumeSlider) {
            const vol = parseFloat(localStorage.getItem(LAST_MUSIC_VOLUME_KEY)) || DEFAULT_MUSIC_VOLUME;
            bgMusicPlayer.volume = vol; musicVolumeSlider.value = vol; }
        attachEventListeners(); 
        if (splashScreenElement && appContainerElement) {
            const FADE_IN_D = 500, HOLD_D = 2000, FADE_OUT_D = 1000; 
            document.body.className = 'body-splash-view'; // Initial body class for black bg
            appContainerElement.style.display = 'none'; 
            splashScreenElement.style.display = 'flex';
            setTimeout(() => { splashScreenElement.style.opacity = '1'; }, 50); 
            let screenId;
            try { screenId = await determineInitialScreenAndPrepareData(); 
            } catch (error) { screenId = 'apiKey'; displayError(errorMessages.apiKey, "Critical setup error."); }
            await new Promise(resolve => setTimeout(resolve, FADE_IN_D + HOLD_D));
            splashScreenElement.style.opacity = '0';
            setTimeout(() => {
                splashScreenElement.style.display = 'none'; appContainerElement.style.display = 'block'; 
                showScreen(screenId); toggleAttachButtonVisibility(); playInitialMusic(); 
            }, FADE_OUT_D); 
        } else { 
            document.body.className = 'body-splash-view'; 
            if(appContainerElement) appContainerElement.style.display = 'block';
            let screenId;
            try { screenId = await determineInitialScreenAndPrepareData();
            } catch (error) { screenId = 'apiKey'; displayError(errorMessages.apiKey, "Critical setup error.");}
            showScreen(screenId); toggleAttachButtonVisibility(); playInitialMusic(); 
        }
    }
    initializeApp();
});