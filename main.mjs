import { app, BrowserWindow, ipcMain, shell, screen } from 'electron'; // Added screen module
import path from 'path';
import fs from 'fs'; // For synchronous file operations
import { fileURLToPath } from 'url';
import { fork } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let expressAppProcess;
let mainWindow;
let userDataPath; // Will store app.getPath('userData')

// Function to create necessary directories in userData
function ensureUserDataDirectories(basePath) {
    console.log('[Electron Main] Ensuring user data directories...');
    const dirsToCreate = [
        path.join(basePath, 'config'),
        path.join(basePath, 'memory'),
        path.join(basePath, 'assets'),
        path.join(basePath, 'assets', 'sprites'),
        path.join(basePath, 'assets', 'backgrounds'),
        path.join(basePath, 'assets', 'bg_music'),
        path.join(basePath, 'backups')
    ];

    dirsToCreate.forEach(dir => {
        if (!fs.existsSync(dir)) {
            try {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`[Electron Main] Created directory: ${dir}`);
            } catch (error) {
                console.error(`[Electron Main] Failed to create directory ${dir}:`, error);
            }
        } else {
            console.log(`[Electron Main] Directory already exists: ${dir}`);
        }
    });
}

// Custom recursive copy function for ASAR compatibility
function copyAssetRecursiveSync(src, dest) {
    const exists = fs.existsSync(src);
    if (!exists) {
        console.error(`[Electron Main] Source path does not exist in copyAssetRecursiveSync: ${src}`);
        return;
    }

    const stats = fs.statSync(src);
    const isDirectory = stats.isDirectory();

    if (isDirectory) {
        if (!fs.existsSync(dest)) {
            try {
                fs.mkdirSync(dest, { recursive: true });
                console.log(`[Electron Main] Created directory (recursive copy): ${dest}`);
            } catch (mkdirError) {
                console.error(`[Electron Main] Failed to create directory ${dest} (recursive copy):`, mkdirError);
                return; // Stop if directory creation fails
            }
        }
        try {
            const children = fs.readdirSync(src);
            console.log(`[Electron Main] Children in ${src}: ${children.join(', ')}`);
            children.forEach((childItemName) => {
                copyAssetRecursiveSync(
                    path.join(src, childItemName),
                    path.join(dest, childItemName)
                );
            });
        } catch (readDirError) {
            console.error(`[Electron Main] Failed to read directory ${src} (recursive copy):`, readDirError);
        }
    } else { // It's a file
        try {
            fs.copyFileSync(src, dest);
            console.log(`[Electron Main] Copied file (recursive copy): ${src} to ${dest}`);
        } catch (copyFileError) {
            console.error(`[Electron Main] Error copying file ${src} to ${dest} (recursive copy):`, copyFileError);
        }
    }
}


// Function to copy default assets if they don't exist in userData
function copyDefaultAssets(sourceAssetsPath, targetUserDataAssetsPath) {
    console.log(`[Electron Main] Copying default assets if necessary. Source: ${sourceAssetsPath}, Target Base: ${targetUserDataAssetsPath}`);
    const defaultAssetTypes = ['sprites', 'backgrounds', 'bg_music'];

    console.log(`[Electron Main] Checking existence of source asset directories within: ${sourceAssetsPath}`);
    defaultAssetTypes.forEach(assetType => {
        const checkSourceDir = path.join(sourceAssetsPath, assetType);
        if (fs.existsSync(checkSourceDir)) {
            console.log(`[Electron Main] Source directory for ${assetType} (${checkSourceDir}) EXISTS.`);
        } else {
            console.error(`[Electron Main] CRITICAL: Source directory for ${assetType} (${checkSourceDir}) DOES NOT EXIST in app package. Check 'files' in package.json and builder output.`);
        }
    });


    defaultAssetTypes.forEach(assetType => {
        const sourceDir = path.join(sourceAssetsPath, assetType); // e.g. app.asar/assets/sprites
        const targetDir = path.join(targetUserDataAssetsPath, assetType); // e.g. userData/assets/sprites
        console.log(`[Electron Main] Processing asset type: ${assetType}. Source dir: ${sourceDir}, Target dir: ${targetDir}`);

        if (fs.existsSync(sourceDir)) {
            // Ensure the base target directory for the asset type exists (e.g., userData/assets/sprites)
            if (!fs.existsSync(targetDir)) {
                try {
                    fs.mkdirSync(targetDir, { recursive: true });
                    console.log(`[Electron Main] Created target base asset directory: ${targetDir}`);
                } catch (error) {
                     console.error(`[Electron Main] Failed to create target base asset directory ${targetDir}:`, error);
                     return; // Skip copying for this asset type if dir creation fails
                }
            }
            
            try {
                const items = fs.readdirSync(sourceDir); // These are items like 'default_female', 'bedroom.png'
                console.log(`[Electron Main] Items found in sourceDir (${sourceDir}): ${items.join(', ')}`);
                items.forEach(item => {
                    const sourceItemPath = path.join(sourceDir, item); // e.g., app.asar/assets/sprites/default_female
                    const targetItemPath = path.join(targetDir, item); // e.g., userData/assets/sprites/default_female
                    console.log(`[Electron Main]   Processing item: ${item}. Source: ${sourceItemPath}, Target: ${targetItemPath}`);

                    if (!fs.existsSync(targetItemPath)) {
                        console.log(`[Electron Main]   Target item ${targetItemPath} does not exist. Attempting copy using copyAssetRecursiveSync.`);
                        copyAssetRecursiveSync(sourceItemPath, targetItemPath);
                    } else {
                        console.log(`[Electron Main]   Target item ${targetItemPath} already exists. Skipping copy.`);
                    }
                });
            } catch (readError) {
                console.error(`[Electron Main] Failed to read source asset directory ${sourceDir}:`, readError);
            }
        } else {
            console.warn(`[Electron Main] Default asset source directory not found: ${sourceDir}. This asset type will be skipped.`);
        }
    });
    console.log('[Electron Main] Finished attempting to copy default assets.');
}

function startExpressApp() {
    return new Promise((resolve, reject) => {
        const env = { ...process.env, USER_DATA_PATH: userDataPath, NODE_ENV: process.env.NODE_ENV };
        const appMjsPath = path.join(__dirname, 'app.mjs');
        console.log(`[Electron Main] Forking Express app from: ${appMjsPath}`);
        expressAppProcess = fork(appMjsPath, [], {
            env: env,
            silent: false 
        });

        expressAppProcess.on('message', (msg) => {
            if (msg === 'server-started') {
                console.log('[Electron Main] Express server reported as started.');
                clearTimeout(serverStartTimeout); 
                resolve();
            }
        });

        expressAppProcess.on('error', (err) => {
            console.error('[Electron Main] Failed to start Express app process:', err);
            clearTimeout(serverStartTimeout);
            reject(err);
        });

        expressAppProcess.on('exit', (code, signal) => {
            console.log(`[Electron Main] Express app process exited with code ${code} and signal ${signal}`);
        });
        
        const serverStartTimeout = setTimeout(() => {
            console.warn('[Electron Main] Express server start timeout. Assuming it started (or failed silently if no error event). Check Express logs.');
            resolve(); 
        }, 7000); 
    });
}

function createWindow () {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  console.log(`[Electron Main] Detected screen work area: width=${width}, height=${height}`);

  mainWindow = new BrowserWindow({
    width: width, 
    height: height, 
    icon: path.join(__dirname, 'assets', 'icons', 'icon.png'), 
    backgroundColor: '#000000', 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src', 'preload.mjs') 
    },
    autoHideMenuBar: true
  });

  const port = process.env.PORT || 3000;
  const appUrl = `http://localhost:${port}`;
  console.log(`[Electron Main] Loading URL in main window: ${appUrl}`);
  mainWindow.loadURL(appUrl)
    .then(() => console.log(`[Electron Main] Main window loaded ${appUrl}`))
    .catch(err => {
        console.error(`[Electron Main] Failed to load URL ${appUrl}:`, err);
    });

  if (process.env.NODE_ENV === 'development' || (app.isPackaged && process.env.ELECTRON_FORCE_DEVTOOLS === 'true')) {
    console.log("[Electron Main] Opening DevTools.");
    mainWindow.webContents.openDevTools();
  }


  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  console.log(`[Electron Main] App ready. Electron version: ${process.versions.electron}, Node version: ${process.versions.node}`);
  console.log(`[Electron Main] Is app packaged? ${app.isPackaged}`);
  
  userDataPath = app.getPath('userData');
  console.log(`[Electron Main] User data path: ${userDataPath}`);
  
  ensureUserDataDirectories(userDataPath);

  const projectAssetsPath = path.join(__dirname, 'assets'); 
  const userDataAssetsPath = path.join(userDataPath, 'assets');
  console.log(`[Electron Main] Project (source) assets path: ${projectAssetsPath}`);
  console.log(`[Electron Main] UserData (target) assets path: ${userDataAssetsPath}`);
  
  copyDefaultAssets(projectAssetsPath, userDataAssetsPath);

  console.log('[Electron Main] Verifying copied assets in userDataPath after copyDefaultAssets call:');
  const verifySpritesPath = path.join(userDataAssetsPath, 'sprites');
  if (fs.existsSync(verifySpritesPath)) {
      console.log(`[Electron Main] Contents of ${verifySpritesPath}:`, fs.readdirSync(verifySpritesPath));
      const verifyDefaultFemalePath = path.join(verifySpritesPath, 'default_female');
      if (fs.existsSync(verifyDefaultFemalePath)) {
          console.log(`[Electron Main] Contents of ${verifyDefaultFemalePath}:`, fs.readdirSync(verifyDefaultFemalePath));
      } else {
          console.log(`[Electron Main] VERIFICATION FAILED: ${verifyDefaultFemalePath} does NOT exist.`);
      }
      const verifyDefaultMalePath = path.join(verifySpritesPath, 'default_male');
      if (fs.existsSync(verifyDefaultMalePath)) {
          console.log(`[Electron Main] Contents of ${verifyDefaultMalePath}:`, fs.readdirSync(verifyDefaultMalePath));
      } else {
          console.log(`[Electron Main] VERIFICATION FAILED: ${verifyDefaultMalePath} does NOT exist.`);
      }
  } else {
      console.log(`[Electron Main] VERIFICATION FAILED: ${verifySpritesPath} does NOT exist.`);
  }

  try {
    await startExpressApp();
    createWindow();
  } catch (error) {
    console.error("[Electron Main] Error during app startup sequence (Express or Window creation):", error);
    app.quit(); 
    return;
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
        console.log("[Electron Main] App activated and no windows open.");
        if (!expressAppProcess || expressAppProcess.killed) {
            console.log("[Electron Main] Express process not running, restarting on activate...");
            startExpressApp().then(createWindow).catch(err => {
                console.error("[Electron Main] Error restarting app on activate:", err);
                app.quit();
            });
        } else {
            createWindow();
        }
    }
  });
});

app.on('window-all-closed', function () {
  console.log("[Electron Main] All windows closed.");
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  console.log('[Electron Main] Electron app is quitting...');
  if (expressAppProcess && !expressAppProcess.killed) {
    console.log('[Electron Main] Killing Express app process...');
    const killed = expressAppProcess.kill('SIGINT'); 
    console.log(`[Electron Main] Express process kill signal sent. Success: ${killed}`);
    setTimeout(() => {
        if (expressAppProcess && !expressAppProcess.killed) {
            console.warn('[Electron Main] Express process did not exit gracefully after SIGINT, forcing SIGKILL.');
            expressAppProcess.kill('SIGKILL');
        }
    }, 2000); 
  }
});

ipcMain.on('open-modding-folder', () => {
    const moddingFolderPath = path.join(userDataPath, 'assets');
    console.log(`[Electron Main] IPC: Received 'open-modding-folder'. Path: ${moddingFolderPath}`);
    shell.openPath(moddingFolderPath)
        .then(result => {
            if (result) console.error(`[Electron Main] Error opening modding folder: ${result}`);
            else console.log(`[Electron Main] Successfully opened modding folder: ${moddingFolderPath}`);
        })
        .catch(err => console.error("[Electron Main] Failed to open modding folder via shell.openPath:", err));
});