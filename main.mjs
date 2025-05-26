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
    console.log('Ensuring user data directories...');
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
                console.log(`Created directory: ${dir}`);
            } catch (error) {
                console.error(`Failed to create directory ${dir}:`, error);
            }
        }
    });
}

// Function to copy default assets if they don't exist in userData
function copyDefaultAssets(sourceAssetsPath, targetUserDataAssetsPath) {
    console.log('Copying default assets if necessary...');
    const defaultAssetTypes = ['sprites', 'backgrounds', 'bg_music'];

    defaultAssetTypes.forEach(assetType => {
        const sourceDir = path.join(sourceAssetsPath, assetType);
        const targetDir = path.join(targetUserDataAssetsPath, assetType);

        if (fs.existsSync(sourceDir)) {
            if (!fs.existsSync(targetDir)) {
                try {
                    fs.mkdirSync(targetDir, { recursive: true });
                    console.log(`Created target asset directory: ${targetDir}`);
                } catch (error) {
                     console.error(`Failed to create target asset directory ${targetDir}:`, error);
                     return; // Skip copying for this asset type if dir creation fails
                }
            }
            
            try {
                const items = fs.readdirSync(sourceDir);
                items.forEach(item => {
                    const sourceItemPath = path.join(sourceDir, item);
                    const targetItemPath = path.join(targetDir, item);

                    if (!fs.existsSync(targetItemPath)) {
                        try {
                            if (fs.statSync(sourceItemPath).isDirectory()) {
                                fs.cpSync(sourceItemPath, targetItemPath, { recursive: true });
                                console.log(`Copied default asset directory: ${item} to ${assetType}`);
                            } else {
                                fs.copyFileSync(sourceItemPath, targetItemPath);
                                console.log(`Copied default asset file: ${item} to ${assetType}`);
                            }
                        } catch (copyError) {
                             console.error(`Failed to copy ${sourceItemPath} to ${targetItemPath}:`, copyError);
                        }
                    }
                });
            } catch (readError) {
                console.error(`Failed to read source asset directory ${sourceDir}:`, readError);
            }
        } else {
            console.warn(`Default asset source directory not found: ${sourceDir}`);
        }
    });
}

function startExpressApp() {
    return new Promise((resolve, reject) => {
        const env = { ...process.env, USER_DATA_PATH: userDataPath, NODE_ENV: process.env.NODE_ENV };
        expressAppProcess = fork(path.join(__dirname, 'app.mjs'), [], {
            env: env,
            silent: false 
        });

        expressAppProcess.on('message', (msg) => {
            if (msg === 'server-started') {
                console.log('Express server reported as started.');
                clearTimeout(serverStartTimeout); 
                resolve();
            }
        });

        expressAppProcess.on('error', (err) => {
            console.error('Failed to start Express app:', err);
            clearTimeout(serverStartTimeout);
            reject(err);
        });

        expressAppProcess.on('exit', (code, signal) => {
            console.log(`Express app exited with code ${code} and signal ${signal}`);
        });
        
        const serverStartTimeout = setTimeout(() => {
            console.warn('Express server start timeout. Assuming it started (or failed silently).');
            resolve(); 
        }, 7000); 
    });
}

function createWindow () {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  console.log(`Detected screen work area: width=${width}, height=${height}`);

  mainWindow = new BrowserWindow({
    width: width, 
    height: height, 
    icon: path.join(__dirname, 'assets', 'icons', 'icon.png'), 
    backgroundColor: '#000000', // Set window background to black
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src', 'preload.mjs') 
    },
    autoHideMenuBar: true
  });

  const port = process.env.PORT || 3000;
  mainWindow.loadURL(`http://localhost:${port}`)
    .then(() => console.log(`Main window loaded http://localhost:${port}`))
    .catch(err => {
        console.error(`Failed to load URL http://localhost:${port}:`, err);
    });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  userDataPath = app.getPath('userData');
  console.log(`User data path: ${userDataPath}`);
  
  ensureUserDataDirectories(userDataPath);

  const projectAssetsPath = path.join(__dirname, 'assets'); 
  const userDataAssetsPath = path.join(userDataPath, 'assets');
  copyDefaultAssets(projectAssetsPath, userDataAssetsPath);

  try {
    await startExpressApp();
    createWindow();
  } catch (error) {
    console.error("Error during app startup:", error);
    app.quit(); 
    return;
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
        if (!expressAppProcess || expressAppProcess.killed) {
            console.log("Express process not running, restarting on activate...");
            startExpressApp().then(createWindow).catch(err => {
                console.error("Error restarting app on activate:", err);
                app.quit();
            });
        } else {
            createWindow();
        }
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  console.log('Electron app is quitting...');
  if (expressAppProcess && !expressAppProcess.killed) {
    console.log('Killing Express app process...');
    expressAppProcess.kill('SIGINT'); 
  }
});

ipcMain.on('open-modding-folder', () => {
    const moddingFolderPath = path.join(userDataPath, 'assets');
    console.log(`Opening modding folder: ${moddingFolderPath}`);
    shell.openPath(moddingFolderPath)
        .catch(err => console.error("Failed to open modding folder:", err));
});