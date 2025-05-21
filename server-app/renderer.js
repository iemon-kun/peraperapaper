const { ipcRenderer } = require("electron");

const btn = document.getElementById("powerBtn");
const status = document.getElementById("status");

let running = false;

btn.addEventListener("click", () => {
  running = !running;
  if (running) {
    ipcRenderer.send("start-server");
    btn.textContent = "停止";
    btn.style.backgroundColor = "#f44336";
    status.textContent = "起動中";
  } else {
    ipcRenderer.send("stop-server");
    btn.textContent = "起動";
    btn.style.backgroundColor = "#4caf50";
    status.textContent = "停止中";
  }
});

document.getElementById("saveBtn").addEventListener("click", () => {
    const oscPort = parseInt(document.getElementById("oscPort").value);
    const wsPort = parseInt(document.getElementById("wsPort").value);
  
    if (!isNaN(oscPort) && !isNaN(wsPort)) {
      ipcRenderer.send("save-config", { oscPort, wsPort });
      alert("設定を保存しました。再起動してください。");
    } else {
      alert("数値を正しく入力してください！");
    }
});

// 設定初期値を反映（mainから受け取る）
ipcRenderer.on("load-config", (event, config) => {
    document.getElementById("oscPort").value = config.oscPort;
    document.getElementById("wsPort").value = config.webSocketPort;
});