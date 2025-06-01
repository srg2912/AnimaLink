// index.mjs
import { t, setCurrentLanguage, getCurrentLanguage, getSupportedLanguages, getCurrentTranslations } from './translations.mjs';

document.addEventListener('DOMContentLoaded', () => {
    // --- Splash Screen Elements ---
    const splashScreenElement = document.getElementById('splash-screen');
    const appContainerElement = document.getElementById('app-container');

    // --- DOM Elements ---
    const screens = {
        languageSelect: document.getElementById('language-select-screen'), // NEW
        apiKey: document.getElementById('api-key-screen'),
        userData: document.getElementById('user-data-screen'),
        characterChoice: document.getElementById('character-choice-screen'),
        characterSetup: document.getElementById('character-setup-screen'),
        game: document.getElementById('game-screen'),
    };

    const forms = {
        languageSelect: document.getElementById('languageSelectForm'), // NEW
        apiKey: document.getElementById('apiKeyForm'),
        userData: document.getElementById('userDataForm'),
        characterCreate: document.getElementById('characterCreateForm'),
    };

    const languageSelector = document.getElementById('languageSelector'); // NEW for language select screen
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
    const optCreateBaseBackupButton = document.getElementById('optCreateBaseBackup');
    const optRestoreCharacterButton = document.getElementById('optRestoreCharacter');
    const optChangeLanguageButton = document.getElementById('optChangeLanguage'); // NEW
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
    const DEFAULT_MUSIC_TRACK = 'Simple Piano Melody.mp3'; // This could be a translatable key if needed for default display
    const DEFAULT_MUSIC_VOLUME = 0.5;
    let initialMusicPlayAttempted = false;
    let userHasInteracted = false;
    let _resolveConfirmationPromise = null;
    const PREF_LANGUAGE_KEY = 'preferredLanguageAnimaLink'; // For localStorage
    let previousScreenBeforeLanguageChange = null; // To return after changing language from options

    // --- Helper Functions ---

    function applyTranslationsToDynamicContent() {
        if (userDataSubmitButton) {
            userDataSubmitButton.textContent = isUserDataEditing ? t('updateUserDataButton') : t('saveUserDataButton');
        }
        if (characterCreateFormSubmitButton) {
            characterCreateFormSubmitButton.textContent = isCharacterProfileEditing ? t('regenerateProfileButton') : t('generateProfileButton');
        }
        if (saveEditedPersonalityButton) {
            saveEditedPersonalityButton.textContent = isCharacterProfileEditing ? t('saveAllCharDataButton') : t('saveEditedProfileButton');
        }

        if (actionSelector) {
            actionSelector.querySelector('option[value="hug"]').textContent = t('actionHug');
            actionSelector.querySelector('option[value="tickle"]').textContent = t('actionTickle');
            actionSelector.querySelector('option[value="kiss"]').textContent = t('actionKiss');
            actionSelector.querySelector('option[value="pet_head"]').textContent = t('actionPetHead');
            actionSelector.querySelector('option[value="hold_hand"]').textContent = t('actionHoldHand');
            actionSelector.querySelector('option[value="high_five"]').textContent = t('actionHighFive');
            actionSelector.querySelector('option[value="give_massage"]').textContent = t('actionGiveMassage');
        }
        
        if (charSpriteFolderSelector && screens.characterSetup.style.display === 'block') {
            const firstOption = charSpriteFolderSelector.options[0];
            if (firstOption && firstOption.disabled) {
                const textContentLower = firstOption.textContent.toLowerCase();
                if (textContentLower.includes('loading') || textContentLower.includes('cargando') || textContentLower.includes('caricamento')) {
                    firstOption.textContent = t('charSpriteFolderLoading');
                } else if (textContentLower.includes('no sprite folders') || textContentLower.includes('no se encontraron') || textContentLower.includes('nessuna cartella')) {
                     firstOption.textContent = t('charSpriteFolderNotFound');
                } else if (textContentLower.includes('error loading') || textContentLower.includes('error al cargar') || textContentLower.includes('errore caricamento')) {
                    firstOption.textContent = t('charSpriteFolderError');
                }
            }
        }
        // Update select elements with placeholder text if they are visible
        const updateSelectPlaceholder = (selectElement, noItemsKey, loadingKey, selectKey) => {
            if (selectElement && selectElement.options.length > 0 && selectElement.options[0].disabled && selectElement.options[0].value === "") {
                const textContentLower = selectElement.options[0].textContent.toLowerCase();
                if (textContentLower.includes('no ') || textContentLower.includes('ningún') || textContentLower.includes('nessun')) { // General check for "no items"
                   selectElement.options[0].textContent = t(noItemsKey);
                } else if (textContentLower.includes('loading') || textContentLower.includes('cargando')) {
                   selectElement.options[0].textContent = t(loadingKey);
                } else { // Assume it's the "Select an item" placeholder
                   selectElement.options[0].textContent = t(selectKey);
                }
            }
        };

        if (choiceBackupSelector && screens.characterChoice.style.display === 'block' && restoreOptionsSection.style.display === 'block') {
            updateSelectPlaceholder(choiceBackupSelector, 'charChoiceNoBackups', 'charChoiceLoadingBackups', 'charChoiceSelectBackup');
        }
        if (backupSelectorInput && restoreBackupModal.style.display === 'flex') { // 'flex' because it's a modal
            updateSelectPlaceholder(backupSelectorInput, 'charChoiceNoBackups', 'charChoiceLoadingBackups', 'charChoiceSelectBackup');
        }
        if (backgroundSelectorInputModal && backgroundSelectorModal.style.display === 'flex') {
            updateSelectPlaceholder(backgroundSelectorInputModal, 'bgSelectorNoBgs', 'charChoiceLoadingBackups', 'selectBgLabel'); // Using selectBgLabel as it means 'Select a background'
        }
        if (musicTrackSelector && musicSettingsModal.style.display === 'flex') {
            updateSelectPlaceholder(musicTrackSelector, 'musicSelectorNoMusic', 'charChoiceLoadingBackups', 'selectMusicTrackLabel');
        }
    }

    function applyTranslations() {
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            el.textContent = t(key);
        });
        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
            const key = el.getAttribute('data-translate-placeholder');
            el.placeholder = t(key);
        });
        document.querySelectorAll('[data-translate-title]').forEach(el => {
            const key = el.getAttribute('data-translate-title');
            el.title = t(key);
        });
        document.querySelectorAll('[data-translate-alt]').forEach(el => {
            const key = el.getAttribute('data-translate-alt');
            el.alt = t(key);
        });
        applyTranslationsToDynamicContent();
    }

    document.addEventListener('languageChanged', () => {
        console.log('Language change detected, re-applying translations.');
        applyTranslations();
    });

    function showInGameNotification(messageKey, type = 'info', duration = 5000, replacements = {}) {
        const message = t(messageKey, replacements);
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

    function showInGameConfirmation(messageKey, titleKey = 'confirmActionTitle', replacements = {}) {
        const message = t(messageKey, replacements);
        const title = t(titleKey);
        return new Promise((resolve) => {
            _resolveConfirmationPromise = resolve;
            if (!confirmationModal || !confirmationTitleElement || !confirmationMessageElement || !confirmYesButton || !confirmNoButton) {
                const result = window.confirm(message);
                resolve(result); return;
            }
            confirmationTitleElement.textContent = title;
            confirmationMessageElement.textContent = message;
            // Yes/No buttons have data-translate and are handled by applyTranslations
            showModal(confirmationModal);
        });
    }

    async function populateSpriteFolderSelector(selectedValue = null) {
        if (!charSpriteFolderSelector) return;
        charSpriteFolderSelector.disabled = true;
        charSpriteFolderSelector.innerHTML = `<option value="" disabled selected>${t('charSpriteFolderLoading')}</option>`;
        try {
            const spriteFolders = await apiRequest('/api/sprites/folders', 'GET', null, errorMessages.characterCreate);
            charSpriteFolderSelector.innerHTML = '';
            if (spriteFolders && Array.isArray(spriteFolders) && spriteFolders.length > 0) {
                const placeholderOption = document.createElement('option');
                placeholderOption.value = "";
                placeholderOption.textContent = t('charSpriteFolderSelect');
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
                option.value = ""; option.textContent = t('charSpriteFolderNotFound');
                option.disabled = true; option.selected = true;
                charSpriteFolderSelector.appendChild(option); charSpriteFolderSelector.disabled = true;
                if (spriteFolders && Array.isArray(spriteFolders) && spriteFolders.length === 0) {
                    displayError(errorMessages.characterCreate, "charSpriteFolderNotFound", { details: " No sprite folders found in your assets/sprites directory. Please add some character sprite folders there and refresh or restart." });
                }
            }
        } catch (error) {
            displayError(errorMessages.characterCreate, "charSpriteFolderError", { details: " Could not load sprite folders. Check console." });
            charSpriteFolderSelector.innerHTML = `<option value="" disabled selected>${t('charSpriteFolderError')}</option>`;
            charSpriteFolderSelector.disabled = true;
        }
    }

    async function populateBackupSelector(selectorElement, errorDisplayElement, applyButtonElement = null) {
        if (!selectorElement) return;
        selectorElement.disabled = true;
        selectorElement.innerHTML = `<option value="" disabled selected>${t('charChoiceLoadingBackups')}</option>`;
        if (applyButtonElement) applyButtonElement.disabled = true;
        if (errorDisplayElement) displayError(errorDisplayElement, '');
        try {
            const backupListResponse = await apiRequest('/api/backups/list', 'GET', null, errorDisplayElement);
            selectorElement.innerHTML = '';
            if (backupListResponse && Array.isArray(backupListResponse)) {
                if (backupListResponse.length === 0) {
                    const option = document.createElement('option');
                    option.textContent = t('charChoiceNoBackups');
                    option.disabled = true; option.selected = true;
                    selectorElement.appendChild(option); selectorElement.disabled = true;
                    if (applyButtonElement) applyButtonElement.disabled = true;
                } else {
                    const placeholder = document.createElement('option');
                    placeholder.value = ""; placeholder.textContent = t('charChoiceSelectBackup');
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
            } else { // Error in response structure or backend error handled by apiRequest
                const option = document.createElement('option');
                option.textContent = t('charChoiceErrorLoadingBackups');
                option.disabled = true; option.selected = true;
                selectorElement.appendChild(option); selectorElement.disabled = true;
                if (applyButtonElement) applyButtonElement.disabled = true;
                 // apiRequest will display error if errorDisplayElement is provided
            }
        } catch (error) { // Network error
            selectorElement.innerHTML = `<option value="" disabled selected>${t('errorGenericError')}</option>`;
            selectorElement.disabled = true;
            if (applyButtonElement) applyButtonElement.disabled = true;
            if (errorDisplayElement) displayError(errorDisplayElement, 'errorFetchBackupList', { message: error.message });
        }
    }

    function showScreen(screenId) {
        Object.values(screens).forEach(screen => screen.style.display = 'none');
        if (screens[screenId]) {
            screens[screenId].style.display = 'block';
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
            if (screenId === 'languageSelect') {
                populateLanguageSelector();
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

    function displayError(element, messageKey, replacements = {}) {
        const message = messageKey ? t(messageKey, replacements) : "";
        if (element) {
            element.textContent = message;
            element.style.display = message ? 'block' : 'none';
        } else if (message) {
            showInGameNotification(messageKey, 'error', 7000, replacements);
        }
    }

    async function apiRequest(url, method, body, errorElement, isInitialCheck = false) {
        try {
           const options = { method: method, headers: { 'Content-Type': 'application/json' } };
           if (body) options.body = JSON.stringify(body);
           const response = await fetch(url, options);

           // Clear specific error element if response is ok OR it's an initial check and the status isn't a typical server error (like 404).
           if (errorElement && (response.ok || (isInitialCheck && response.status !== 404 && response.status !== 500 && response.status !== 400))) {
               displayError(errorElement, '');
           }

           if (response.status === 204) return { success: true, status: response.status };
           
           const responseData = await response.json().catch(async () => {
               const text = await response.text().catch(() => "Could not read response text.");
               // For initial checks, if we can't parse JSON from a 404, it's still "not found"
               if (isInitialCheck && response.status === 404) return { notFound: true, status: 404, error: "Resource not found."};
               return { parseError: true, status: response.status, text: text }; 
           });

           // If it's an initial check and we got a 404, return that information
           if (isInitialCheck && response.status === 404) {
               return responseData; // This will contain { notFound: true, ... } if JSON parsing failed for 404 too
           }

           if (responseData.parseError) {
               const errorMsgKey = 'errorNonJsonResponse';
               if (errorElement) displayError(errorElement, errorMsgKey, { status: responseData.status });
               else if (!isInitialCheck) showInGameNotification(errorMsgKey, 'error', 7000, { status: responseData.status });
               return { ...responseData, error: t(errorMsgKey, { status: responseData.status }), status: responseData.status };
           }

           if (!response.ok) {
                let errorToDisplayKey = responseData?.error; 
                let replacements = {};

                if (!errorToDisplayKey || !getCurrentTranslations()[errorToDisplayKey]) { // Check if backend error is a key
                    // If backend error is not a known key, create a more generic error message
                    // For example, if backend sends "Internal Server Error" and we don't have a key for that.
                    const genericErrorKey = 'errorRequestFailed'; // Default generic error key
                    replacements = { 
                        status: response.status, 
                        statusText: responseData?.error || response.statusText || t('errorGenericError') // Use backend msg or generic
                    };
                    errorToDisplayKey = genericErrorKey;
                } else {
                    // If backend error IS a known key, we might not need replacements or only specific ones.
                    // This part depends on how backend error messages align with frontend keys.
                    // For now, assume if it's a key, no complex replacements are needed beyond what the key itself implies.
                }
                
                if (errorElement && (!isInitialCheck || (isInitialCheck && response.status !== 404))) {
                     displayError(errorElement, errorToDisplayKey, replacements);
                } else if (!isInitialCheck && !errorElement) { // Only show general notification if no specific error element
                    showInGameNotification(errorToDisplayKey, 'error', 7000, replacements);
                }
                return { ...responseData, error: t(errorToDisplayKey, replacements), status: response.status }; 
           }
           return responseData;
       } catch (error) { // Network errors
           const networkErrorMsgKey = 'errorNetworkError';
           if (errorElement) displayError(errorElement, networkErrorMsgKey, { message: error.message });
           else if (!isInitialCheck) showInGameNotification(networkErrorMsgKey, 'error', 7000, { message: error.message });
           return { networkError: true, message: error.message, error: t(networkErrorMsgKey, {message: error.message}) };
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
            displayError(errorMessages.gameScreen, 'errorSpriteFolderMissing');
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
                if (shortTermMemory && !Array.isArray(shortTermMemory) && shortTermMemory.error && errorMessages.gameScreen) { // Check if backend returned an error
                     displayError(errorMessages.gameScreen, shortTermMemory.error); // Display backend's error (already translated by apiRequest)
                } else if (shortTermMemory && !Array.isArray(shortTermMemory) && errorMessages.gameScreen){
                    displayError(errorMessages.gameScreen, "errorFailedToLoadChat");
                }
            }
        }
        showScreen('game');
        toggleAttachButtonVisibility();
    }

    async function determineInitialScreenAndPrepareData() {
        const preferredLang = localStorage.getItem(PREF_LANGUAGE_KEY);
        if (!preferredLang) {
            populateLanguageSelector();
            return 'languageSelect';
        }
        // Language already set by initializeApp, translations applied via event

        const apiKeyStatusResponse = await apiRequest('/api/status/api_key', 'GET', null, null, true);
        if (!apiKeyStatusResponse || apiKeyStatusResponse.networkError) {
            displayError(errorMessages.apiKey, 'errorNetworkError', { message: apiKeyStatusResponse?.message || "Could not connect to server." });
            return 'apiKey';
        }
        visionSupportedByCurrentModel = apiKeyStatusResponse.supports_vision || false;
        if(supportsVisionCheckbox) supportsVisionCheckbox.checked = visionSupportedByCurrentModel;
        if(apiKeySupportsVisionCheckbox) apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel;

        if (!apiKeyStatusResponse.configured) {
             // The apiRequest would have shown an error if errorMessages.apiKey was passed.
             // If a specific error message is needed here, pass errorMessages.apiKey.
             // Example: await apiRequest('/api/status/api_key', 'GET', null, errorMessages.apiKey, true);
            return 'apiKey';
        }

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
                    if (shortTermMemory && !Array.isArray(shortTermMemory) && shortTermMemory.error && errorMessages.gameScreen) {
                        displayError(errorMessages.gameScreen, shortTermMemory.error);
                    } else if (shortTermMemory && !Array.isArray(shortTermMemory) && errorMessages.gameScreen){
                        displayError(errorMessages.gameScreen, "errorFailedToLoadChat");
                    }
                }
                return 'game';
            } else {
                prefillUserDataForm();
                if (charProfileResponse?.error && !charProfileResponse.notFound && errorMessages.characterCreate) {
                    // displayError(errorMessages.characterCreate, charProfileResponse.error); // Display backend error
                }
                return 'characterChoice';
            }
        } else {
            prefillUserDataForm();
            if (userDataResponse?.error && !userDataResponse.notFound && errorMessages.userData && !userDataResponse.networkError) {
                 // displayError(errorMessages.userData, userDataResponse.error); // Display backend error
            }
            return 'userData';
        }
    }

    function populateLanguageSelector() {
        if (!languageSelector) return;
        languageSelector.innerHTML = '';
        const supported = getSupportedLanguages();
        supported.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.code;
            option.textContent = lang.name;
            if (lang.code === getCurrentLanguage()) {
                option.selected = true;
            }
            languageSelector.appendChild(option);
        });
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
            const backendErrorKey = result?.error;
            let errorMessageKey = 'llmInteractionFailedResponse'; // Default if no specific backend error or key
            let replacements = { errorMessage: t('llmInteractionFailed') }; // Default replacement

            if (backendErrorKey) { // If backend provided an error message/key
                if (getCurrentTranslations()[backendErrorKey]) { // Check if it's a direct key
                    replacements = { errorMessage: t(backendErrorKey) };
                } else { // Not a direct key, use it as the replacement content
                    replacements = { errorMessage: backendErrorKey };
                }
            }
            addMessageToDisplay('assistant', t(errorMessageKey, replacements));
            if (errorMessages.gameScreen) displayError(errorMessages.gameScreen, errorMessageKey, replacements);
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

        if (forms.languageSelect) {
            forms.languageSelect.addEventListener('submit', async (e) => {
                e.preventDefault();
                const selectedLang = languageSelector.value;
                setCurrentLanguage(selectedLang); // Triggers 'languageChanged' event
                localStorage.setItem(PREF_LANGUAGE_KEY, selectedLang);
                
                if (previousScreenBeforeLanguageChange) {
                    showScreen(previousScreenBeforeLanguageChange);
                    previousScreenBeforeLanguageChange = null;
                } else {
                    const nextScreen = await determineInitialScreenAndPrepareData();
                    showScreen(nextScreen);
                }
            });
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
                displayError(errorMessages.userData, "errorAllFieldsRequired"); return;
            }
            const result = await apiRequest('/api/user_data', isUserDataEditing ? 'PATCH' : 'POST', data, errorMessages.userData);
            if (result && (result.name || result.status < 300) && !result.error) {
                currentUserData = result.name ? result : { ...currentUserData, ...data };
                if (isUserDataEditing) {
                    showInGameNotification('notificationUserDataUpdated', 'success'); hideModal(optionsModal);
                    isUserDataEditing = false;
                    // userDataSubmitButton.textContent will be updated by applyTranslations
                    await refreshCurrentScreenState();
                } else showScreen('characterChoice');
            } // else apiRequest handles error display
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
                displayError(errorMessages.characterChoice, 'notificationSelectABackup'); return;
            }
            choiceApplyRestoreButton.disabled = true; displayError(errorMessages.characterChoice, '');
            const result = await apiRequest(`/api/backups/${selectedName}`, 'GET', null, errorMessages.characterChoice);
            choiceApplyRestoreButton.disabled = false;
            if (result?.message && !result.error) {
                 const match = result.message.match(/'(.*?)' \(from (.*?)\)/);
                showInGameNotification('notificationRestoreSuccess', 'success', 0, { characterName: match?.[1] || selectedName, backupFileName: match?.[2] || 'backup' });
                await refreshCurrentScreenState();
            } // else apiRequest handles error display
        });

        forms.characterCreate.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(forms.characterCreate); const data = Object.fromEntries(formData.entries());
            if (!data.name?.trim() || !data.looks?.trim() || !data.personality?.trim() || !data.language?.trim() || !data.sprite?.trim()) {
                displayError(errorMessages.characterCreate, "errorAllFieldsRequired"); return;
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
                if (isCharacterProfileEditing) showInGameNotification('notificationCharRegenerated', 'success');
                applyTranslationsToDynamicContent(); // Update button text if mode changed
            }
        });

        saveEditedPersonalityButton.addEventListener('click', async () => {
            const editedProfile = generatedPersonalityTextarea.value;
            const formData = new FormData(forms.characterCreate); const generalData = Object.fromEntries(formData.entries());
            if (!generalData.name?.trim() || !generalData.looks?.trim() || !generalData.language?.trim() || !generalData.sprite?.trim()) {
                displayError(errorMessages.characterEdit, "errorCoreDetailsRequired"); return;
            }
             if (!editedProfile.trim() && !generalData.personality?.trim()) {
                displayError(errorMessages.characterEdit, 'errorProfileOrDescRequired'); return;
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
                showInGameNotification('notificationCharSaved', 'success');
                if (isCharacterProfileEditing) {
                    resetCharacterSetupToCreationMode(); isCharacterProfileEditing = false;
                    await goToGameScreen(false); hideModal(optionsModal);
                } else { characterEditSection.style.display = 'block'; continueToGameButtonElement.style.display = 'inline-block'; }
                applyTranslationsToDynamicContent(); // Update button texts
            }
        });

        continueToGameButtonElement.addEventListener('click', async () => {
            if (!currentCharacterSetupData.name || !currentCharacterSetupData.sprite) {
                const formData = new FormData(forms.characterCreate);
                currentCharacterSetupData = { name: formData.get('name'), looks: formData.get('looks'), language: formData.get('language'),
                                          sprite: formData.get('sprite'), rawPersonalityInput: formData.get('personality') };
                currentSpriteFolder = formData.get('sprite');
            }
            if (!currentSpriteFolder) { displayError(errorMessages.characterEdit, "errorSpriteFolderMissing"); return; }
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
                    showInGameNotification('notificationInvalidFileType', 'error'); imageUploadInput.value = ''; return; }
                if (file.size > 7 * 1024 * 1024) {
                    showInGameNotification('notificationFileTooLarge', 'error'); imageUploadInput.value = ''; return; }
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
                toggleAttachButtonVisibility(); showInGameNotification(visionSupportedByCurrentModel ? 'notificationVisionEnabled' : 'notificationVisionDisabled', 'info');
            } else { supportsVisionCheckbox.checked = visionSupportedByCurrentModel; showInGameNotification('notificationFailedUpdateVision', 'error'); }
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
                } else if (currentConfig?.error && !currentConfig.notFound && currentConfig.error !== "Resource not found.") {
                    displayError(errorMessages.apiKey, currentConfig.error); // Show backend error
                }
                if(apiKeySupportsVisionCheckbox) apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel;
            } catch (error) {
                displayError(errorMessages.apiKey, "errorRequestFailed", { status: 'N/A', statusText: 'Could not load API key.'});
                if(apiKeySupportsVisionCheckbox) apiKeySupportsVisionCheckbox.checked = visionSupportedByCurrentModel;
            }
        });
        optChangeUserData.addEventListener('click', async () => { hideModal(optionsModal); isUserDataEditing = true; prefillUserDataForm(); showScreen('userData'); applyTranslationsToDynamicContent();});
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
                continueToGameButtonElement.style.display = 'none';
            } else { showInGameNotification('notificationCouldNotLoadProfileEdit', 'error'); isCharacterProfileEditing = false; return; }
            showScreen('characterSetup');
            applyTranslationsToDynamicContent(); // Update button texts after setting edit mode
        });
        function resetCharacterSetupToCreationMode() {
            forms.characterCreate.reset(); generatedPersonalityTextarea.value = '';
            populateSpriteFolderSelector();
            forms.characterCreate.style.display = 'block'; characterEditSection.style.display = 'none';
            applyTranslationsToDynamicContent(); // Ensure button texts are reset
        }
        optCreateNewCharacterButton.addEventListener('click', async () => {
            hideModal(optionsModal);
            if (!await showInGameConfirmation("charDeleteConfirmationMessage", "charDeleteConfirmationTitle")) return;
            const result = await apiRequest('/api/memory', 'DELETE', null, errorMessages.gameScreen);
            if (result && (result.success || result.status < 300) && !result.error) {
                showInGameNotification('notificationCurrentDataDeleted', 'info', 4000);
                localStorage.removeItem(LAST_BACKGROUND_KEY); localStorage.removeItem(LAST_MUSIC_TRACK_KEY); localStorage.removeItem(LAST_MUSIC_VOLUME_KEY);
                if (bgMusicPlayer) { bgMusicPlayer.pause(); bgMusicPlayer.src = ""; }
                initialMusicPlayAttempted = false;
                currentCharacterPersonalityText = ''; currentCharacterSetupData = {}; currentSpriteFolder = '';
                if(messageDisplay) messageDisplay.innerHTML = '';
                resetCharacterSetupToCreationMode(); isCharacterProfileEditing = false;
                await refreshCurrentScreenState();
            } else showInGameNotification('notificationFailedToDeleteData', 'error', 0, { error: result?.error || t('errorGenericError') });
        });
        async function showMemory(type) {
            const endpoint = type === 'shortTerm' ? '/api/memory/short_term' : '/api/memory/long_term';
            const titleKey = type === 'shortTerm' ? 'memoryViewerChatHistoryTitle' : "memoryViewerCharDiaryTitle";
            const data = await apiRequest(endpoint, 'GET', null, null);
            memoryViewerTitle.textContent = t(titleKey); memoryViewerContent.innerHTML = '';
            if (data && Array.isArray(data)) {
                if (data.length === 0) memoryViewerContent.textContent = t('memoryViewerNoEntries');
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
            } else memoryViewerContent.textContent = t('memoryViewerErrorLoading') + ` ${data?.error || t('errorGenericError')}`;
            showModal(memoryViewerModal);
        }
        optViewShortTermMemory.addEventListener('click', () => { hideModal(optionsModal); showMemory('shortTerm'); });
        optViewLongTermMemory.addEventListener('click', async () => {
            hideModal(optionsModal); showMemory('longTerm');
            apiRequest('/api/interact/view_diary', 'POST', {}, errorMessages.gameScreen)
                .then(handleInteractionResponse).catch(e => handleInteractionResponse({ error: e.message || t("llmInteractionFailed") }));
        });
        closeMemoryViewerModalButton.addEventListener('click', () => hideModal(memoryViewerModal));
        optCreateBackupButton.addEventListener('click', async () => {
            hideModal(optionsModal);
            const result = await apiRequest('/api/backups/create', 'POST', {}, errorMessages.gameScreen);
            const charNameMatch = result?.filePath?.match(/([^/\\]+)_backup\.json$/);
            const charNameForMsg = charNameMatch ? charNameMatch[1].replace(/_/g, ' ') : t('character'); // Assuming 'character' is a generic key
            if (result?.message && !result.error) showInGameNotification('notificationBackupCreated', 'success', 0, {characterName: charNameForMsg});
            else if (!errorMessages.gameScreen.textContent) showInGameNotification('notificationBackupFailed', 'error', 0, { error: result?.error || t('errorGenericError') });
        });
        if (optCreateBaseBackupButton) {
            optCreateBaseBackupButton.addEventListener('click', async () => {
                hideModal(optionsModal);
                const result = await apiRequest('/api/backups/create_base', 'POST', {}, errorMessages.gameScreen);
                const charNameMatch = result?.filePath?.match(/([^/\\]+)_base_backup\.json$/);
                const charNameForMsg = charNameMatch ? charNameMatch[1].replace(/_/g, ' ') : t('character');
                if (result?.message && !result.error) {
                    showInGameNotification('notificationBaseBackupCreated', 'success', 0, { characterName: charNameForMsg });
                } else if (!errorMessages.gameScreen.textContent) {
                    showInGameNotification('notificationBaseBackupFailed', 'error', 0, { error: result?.error || t('errorGenericError') });
                }
            });
        }
        optRestoreCharacterButton.addEventListener('click', async () => {
            hideModal(optionsModal);
            await populateBackupSelector(backupSelectorInput, errorMessages.restoreBackup, applyRestoreBackupButton);
            showModal(restoreBackupModal);
        });
        closeRestoreBackupModalButton.addEventListener('click', () => hideModal(restoreBackupModal) );
        applyRestoreBackupButton.addEventListener('click', async () => {
            const selectedName = backupSelectorInput.value;
            if (!selectedName || backupSelectorInput.selectedOptions[0]?.disabled) {
                displayError(errorMessages.restoreBackup, 'notificationSelectABackup'); return; }
            applyRestoreBackupButton.disabled = true; displayError(errorMessages.restoreBackup, '');
            const result = await apiRequest(`/api/backups/${selectedName}`, 'GET', null, errorMessages.restoreBackup);
            applyRestoreBackupButton.disabled = false;
            if (result?.message && !result.error) {
                const match = result.message.match(/'(.*?)' \(from (.*?)\)/);
                showInGameNotification('notificationRestoreSuccess', 'success', 0, { characterName: match?.[1] || selectedName, backupFileName: match?.[2] || 'backup' });
                hideModal(restoreBackupModal); await refreshCurrentScreenState();
            } else if (!errorMessages.restoreBackup.textContent) displayError(errorMessages.restoreBackup, 'notificationRestoreFailed', { error: result?.error || t('errorGenericError')});
        });
        changeBackgroundButton.addEventListener('click', async () => {
            try {
                displayError(errorMessages.gameScreen, '');
                const bgs = await apiRequest('/api/backgrounds', 'GET', null, errorMessages.gameScreen);
                if (bgs && Array.isArray(bgs)) {
                    backgroundSelectorInputModal.innerHTML = '';
                    if (bgs.length === 0) {
                        const opt = document.createElement('option'); opt.textContent = t('bgSelectorNoBgs'); opt.disabled = true;
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
                } else if (!errorMessages.gameScreen.textContent && bgs?.error) displayError(errorMessages.gameScreen, bgs.error);
                  else if (!errorMessages.gameScreen.textContent) displayError(errorMessages.gameScreen, "errorRequestFailed", { status: "N/A", statusText: t('bgSelectorNoBgs')});

            } catch (error) { displayError(errorMessages.gameScreen, 'errorRequestFailed', {status: "N/A", statusText: error.message }); }
        });
        applyBackgroundButton.addEventListener('click', async () => {
            const selectedBg = backgroundSelectorInputModal.value;
            if (!selectedBg || backgroundSelectorInputModal.selectedOptions[0]?.disabled) {
                showInGameNotification('notificationSelectBackground', 'warning'); return; }
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
                        const opt = document.createElement('option'); opt.textContent = t('musicSelectorNoMusic'); opt.disabled = true;
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
                } else if (!errorMessages.gameScreen.textContent && tracks?.error) displayError(errorMessages.gameScreen, tracks.error);
                  else if (!errorMessages.gameScreen.textContent) displayError(errorMessages.gameScreen, "errorRequestFailed", { status: "N/A", statusText: t('musicSelectorNoMusic')});
            } catch (error) { displayError(errorMessages.gameScreen, 'errorRequestFailed', { status: "N/A", statusText: error.message}); }
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
                else showInGameNotification('notificationErrorOpenModdingFolder', 'error');
                hideModal(optionsModal);
            });
        }
        if (optChangeLanguageButton) {
            optChangeLanguageButton.addEventListener('click', () => {
                hideModal(optionsModal);
                // Find current visible screen to return to, excluding modals
                previousScreenBeforeLanguageChange = Object.keys(screens).find(key => 
                    screens[key].style.display === 'block' && key !== 'languageSelect'
                );
                if (!previousScreenBeforeLanguageChange) previousScreenBeforeLanguageChange = 'game'; // Default if somehow none found (e.g. from init)

                populateLanguageSelector();
                showScreen('languageSelect');
            });
        }
    } // End of attachEventListeners

    async function initializeApp() {
        initialMusicPlayAttempted = false; userHasInteracted = false;
        if (bgMusicPlayer && musicVolumeSlider) {
            const vol = parseFloat(localStorage.getItem(LAST_MUSIC_VOLUME_KEY)) || DEFAULT_MUSIC_VOLUME;
            bgMusicPlayer.volume = vol; musicVolumeSlider.value = vol;
        }
        attachEventListeners();

        const preferredLang = localStorage.getItem(PREF_LANGUAGE_KEY);
        if (preferredLang) {
            setCurrentLanguage(preferredLang); // Triggers 'languageChanged' event for translations
        } else {
            setCurrentLanguage(getCurrentLanguage()); // Sets to default, also triggers event
        }
        // applyTranslations() is now called by the 'languageChanged' event listener.

        if (splashScreenElement && appContainerElement) {
            const FADE_IN_D = 500, HOLD_D = 2000, FADE_OUT_D = 1000;
            document.body.className = 'body-splash-view';
            appContainerElement.style.display = 'none';
            splashScreenElement.style.display = 'flex';
            setTimeout(() => { splashScreenElement.style.opacity = '1'; }, 50);

            let screenId;
            try {
                screenId = await determineInitialScreenAndPrepareData();
            } catch (error) {
                console.error("Critical setup error during init:", error);
                screenId = preferredLang ? 'apiKey' : 'languageSelect'; // Fallback
                displayError(null, "errorRequestFailed", {status: "Setup", statusText: "Critical error"});
            }

            await new Promise(resolve => setTimeout(resolve, FADE_IN_D + HOLD_D));
            splashScreenElement.style.opacity = '0';
            setTimeout(() => {
                splashScreenElement.style.display = 'none';
                appContainerElement.style.display = 'block';
                showScreen(screenId);
                toggleAttachButtonVisibility();
                playInitialMusic();
            }, FADE_OUT_D);
        } else {
            document.body.className = 'body-splash-view';
            if(appContainerElement) appContainerElement.style.display = 'block';
            let screenId;
            try {
                screenId = await determineInitialScreenAndPrepareData();
            } catch (error) {
                console.error("Critical setup error during init (no splash):", error);
                screenId = preferredLang ? 'apiKey' : 'languageSelect';
                displayError(null, "errorRequestFailed", {status: "Setup", statusText: "Critical error"});
            }
            showScreen(screenId);
            toggleAttachButtonVisibility();
            playInitialMusic();
        }
    }
    initializeApp();
});