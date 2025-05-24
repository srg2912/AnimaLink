// main.js
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let expressAppProcess;
let mainWindow;

// Function to start your Express server (app.mjs)
function startExpressApp() {
    return new Promise((resolve, reject) => {
        expressAppProcess = fork(path.join(__dirname, 'app.mjs'), [], {
            // Pass environment variables if your app.mjs needs them
            // env: { ...process.env, PORT: 3000 } // Example if you want to force port
        });

        expressAppProcess.on('message', (msg) => {
            if (msg === 'server-started') { // You might need to add this message in app.mjs
                console.log('Express server reported as started.');
                resolve();
            }
            console.log('Message from Express app:', msg);
        });

        expressAppProcess.on('error', (err) => {
            console.error('Failed to start Express app:', err);
            reject(err);
            app.quit();
        });

        expressAppProcess.on('exit', (code) => {
            console.log(`Express app exited with code ${code}`);
            // Optionally handle unexpected exits
            if (code !== 0 && code !== null) {
                // Consider notifying the user or attempting a restart
            }
        });

        // Fallback if server doesn't send a "ready" message
        // Adjust timeout or implement a more robust check (e.g., pinging the server)
        const serverStartTimeout = setTimeout(() => {
            console.warn('Express server start timeout. Assuming it started.');
            resolve();
        }, 5000); // 5 seconds timeout

        // If using the 'message' event, clear the timeout
        expressAppProcess.on('message', (msg) => {
            if (msg === 'server-started') {
                clearTimeout(serverStartTimeout);
            }
        });
    });
}


function createWindow () {
  mainWindow = new BrowserWindow({
    width: 1280, // A bit larger for a desktop feel
    height: 800,
    icon: path.join(__dirname, 'assets', 'icons', 'icon.png'), // Add an icon file here
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'), // Optional for future IPC or secure Node.js access
      nodeIntegration: false, // Recommended: Keep false as you load from localhost.
      contextIsolation: true, // Recommended: For security.
      // webSecurity: process.env.NODE_ENV === 'development' ? false : true, // Disable for dev if needed for certain localhost setups
    },
    autoHideMenuBar: true //hide menu bar
  });

  const port = process.env.PORT || 3000; // Match port from your app.mjs
  mainWindow.loadURL(`http://localhost:${port}`)
    .then(() => console.log(`Main window loaded http://localhost:${port}`))
    .catch(err => {
        console.error(`Failed to load URL http://localhost:${port}:`, err);
        // You could show an error message to the user here
    });

  // Open the DevTools (optional, for debugging)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
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
        // Check if Express app is still running, restart if necessary
        if (!expressAppProcess || expressAppProcess.killed) {
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
  // On macOS it's common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Kill the Express server when Electron quits
app.on('quit', () => {
  console.log('Electron app is quitting...');
  if (expressAppProcess) {
    console.log('Killing Express app process...');
    expressAppProcess.kill('SIGINT'); // Send SIGINT for graceful shutdown if app.mjs handles it
  }
});

// Optional: Add a way for app.mjs to signal it's ready
// In your app.mjs, after app.listen:
/*
if (process.send) { // Check if run as a child process
    process.send('server-started');
}
*/