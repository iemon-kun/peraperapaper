const { app, BrowserWindow, ipcMain } = require("electron");
//const path = require("path");
const { spawn } = require("child_process");

let mainWindow;
let serverProcess = null;

// main.js 側で読み込む処理追加
const fs = require("fs");
const path = require("path");
const configPath = path.join(__dirname, "config.json");

let config = {
  oscPort: 9000,
  wsPort: 8081
};

if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, "utf-8");
    config = JSON.parse(raw);
    console.log("📄 config.json 読み込み成功:", config);
}

// ウィンドウ生成
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("load-config", config);
  });

  mainWindow.loadFile("index.html");
}

ipcMain.on("start-server", () => {
    if (!serverProcess) {
      const serverPath = path.join(__dirname, "server.js");
  
      serverProcess = spawn("node", [
        serverPath,
        `${config.oscPort}`,
        `${config.wsPort}`
      ], {
        stdio: "inherit",
        detached: true
      });
  
      console.log("📡 サーバー起動");
    }
});
  

ipcMain.on("stop-server", () => {
  if (serverProcess) {
    process.kill(-serverProcess.pid);

    // プロセス終了を検知してログ出す（確実な停止確認）
    serverProcess.on("exit", (code, signal) => {
        console.log(`🛑 サーバープロセス終了 (code=${code}, signal=${signal})`);
    });

    serverProcess = null;
    console.log("🛑 サーバー停止要求を実行しました");
    //console.log("🛑 サーバー停止");
  }
});

app.whenReady().then(createWindow);

// 追記分
app.on("window-all-closed", () => {
    // サーバープロセスが残っていれば止める
    if (serverProcess) {
      process.kill(-serverProcess.pid);
      serverProcess.on("exit", (code, signal) => {
        console.log(`🛑 サーバープロセス終了 (code=${code}, signal=${signal})`);
      });
      serverProcess = null;
      console.log("🛑 サーバーも停止しました（×ボタン）");
    }
  
    // macOS以外ではアプリも終了（macの場合はDockに残る）
    if (process.platform !== "darwin") {
      app.quit();
    }
});

app.on("before-quit", () => {
    if (serverProcess) {
        serverProcess.kill(-serverProcess.pid);
        console.log("🛑 サーバー停止（アプリ終了時）");
    }
});

//save-config 受信イベントを追加
ipcMain.on("save-config", (event, newConfig) => {
    try {
      fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
      console.log("💾 設定保存:", newConfig);
      config = newConfig;
    } catch (err) {
      console.error("❌ 設定保存失敗:", err);
    }
});
  