import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import log from 'electron-log';
import pkgUpdater from 'electron-updater';
const { autoUpdater } = pkgUpdater;

// Configuração profissional de logs
log.initialize();
log.transports.file.level = 'info';
log.info('Iniciando Finnancial Desktop...');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Variáveis de ambiente configuradas pelo vite-plugin-electron
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win;
let serverProcess = null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

/**
 * Captura exceções não tratadas para evitar tela branca silenciosa.
 */
process.on('uncaughtException', (error) => {
  log.error('Exceção não tratada no processo principal:', error);
  dialog.showErrorBox(
    'Erro Crítico no Sistema',
    `Ocorreu um erro inesperado: ${error.message}\n\nO aplicativo pode precisar ser reiniciado.`
  );
});

function startBackendServer() {
  if (!app.isPackaged) {
    log.info('Ambiente de desenvolvimento: servidor backend externo esperado.');
    return;
  }

  const serverPath = path.join(process.resourcesPath, 'backend', 'servidor-interno.exe');
  log.info(`Iniciando servidor backend em: ${serverPath}`);

  serverProcess = execFile(serverPath, (error, stdout, stderr) => {
    if (error) {
      log.error('Erro fatal ao executar servidor interno:', error);
    }
  });

  serverProcess.stdout?.on('data', (data) => log.info(`[Backend]: ${data}`));
  serverProcess.stderr?.on('data', (data) => log.error(`[Backend Error]: ${data}`));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Finnancial',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.setMenuBarVisibility(false);

  // Monitora falhas de carregamento da página
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error(`Falha ao carregar página: ${errorCode} - ${errorDescription}`);
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(process.env.DIST, 'index.html');
    win.loadFile(indexPath).catch(err => {
      log.error('Erro ao carregar index.html:', err);
    });
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    log.info('Aplicativo encerrado pelo usuário.');
    app.quit();
    win = null;
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    log.info('Encerrando servidor backend...');
    serverProcess.kill();
  }
});

function setupAutoUpdater() {
  autoUpdater.logger = log;
  autoUpdater.autoDownload = false; // Não baixa sem avisar

  autoUpdater.on('update-available', (info) => {
    log.info('Atualização disponível:', info.version);
    win.webContents.send('update-available', info.version);
  });

  autoUpdater.on('update-downloaded', () => {
    win.webContents.send('update-downloaded');
  });

  ipcMain.on('start-download', () => {
    autoUpdater.downloadUpdate();
  });

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });

  // Verifica atualizações a cada 2 horas
  setInterval(() => {
    if (app.isPackaged) autoUpdater.checkForUpdates();
  }, 1000 * 60 * 60 * 2);

  // Verifica ao iniciar
  if (app.isPackaged) autoUpdater.checkForUpdates();
}

app.whenReady().then(() => {
  startBackendServer();
  createWindow();
  setupAutoUpdater();
});
