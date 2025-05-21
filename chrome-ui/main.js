let recognition;
let isListening = false;

const btn = document.getElementById("toggleInputBtn");
const log = document.getElementById("log");
const sourceSelect = document.getElementById("sourceLang");
const targetSelect = document.getElementById("targetLang");

// === 言語設定の初期化 ===
let sourceLang = localStorage.getItem("sourceLang") || "ja";
let targetLang = localStorage.getItem("targetLang") || "en";
let logHistory = JSON.parse(localStorage.getItem("logHistory") || "[]");

sourceSelect.value = sourceLang;
targetSelect.value = targetLang;

function logMsg(msg) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = `[${timestamp}] ${msg}`;
    logHistory.push(entry);
  
    // 30件超えたら古い方を削除
    if (logHistory.length > 30) {
      logHistory = logHistory.slice(-30);
    }
  
    // 表示更新
    log.textContent = logHistory.join("\n");
    log.scrollTop = log.scrollHeight;
  
    // 保存
    localStorage.setItem("logHistory", JSON.stringify(logHistory));
}

sourceSelect.addEventListener("change", () => {
  sourceLang = sourceSelect.value;
  localStorage.setItem("sourceLang", sourceLang);
  logMsg(`🈶 元の言語を変更: ${sourceLang}`);
});

targetSelect.addEventListener("change", () => {
  targetLang = targetSelect.value;
  localStorage.setItem("targetLang", targetLang);
  logMsg(`🌍 翻訳先の言語を変更: ${targetLang}`);
});

// === WebSocket 初期化 ===
const ws = new WebSocket("ws://localhost:8081");

ws.onopen = () => logMsg("🔌 WebSocket 接続成功");
ws.onerror = (err) => logMsg("❗ WebSocket エラー: " + err.message);
ws.onclose = () => logMsg("🔌 WebSocket 接続が切断されました");

// === ボタン操作 ===
btn.addEventListener("click", () => {
  if (!isListening) {
    startRecognition();
  } else {
    stopRecognition();
  }
});

// === 音声認識開始 ===
function startRecognition() {
  if (!("webkitSpeechRecognition" in window)) {
    btn.textContent = "■ 音声入力停止";
    btn.classList.add("stop");
    logMsg("🟢 音声認識開始");
    // logMsg("❌ このブラウザは音声認識に対応していません");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.lang = sourceLang + "-JP";
  recognition.interimResults = false;
  recognition.continuous = true;

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        transcript += event.results[i][0].transcript;
      }
    }
    logMsg(`🎙 音声認識結果: ${transcript}`);
    translateText(transcript);
  };

  recognition.onerror = (event) => {
    logMsg(`❗ 音声認識エラー: ${event.error}`);
  };

  recognition.onend = () => {
    if (isListening) recognition.start(); // 自動再開
  };

  recognition.start();
  isListening = true;
  btn.textContent = "■ 音声入力停止";
  logMsg("🟢 音声認識開始");
}

// === 音声認識停止 ===
function stopRecognition() {
  if (recognition) {
    recognition.stop();
    isListening = false;
    //btn.textContent = "🎙 音声入力開始";
    // logMsg("🔴 音声認識停止");
    btn.textContent = "🎙 音声入力開始";
    btn.classList.remove("stop");
    logMsg("🔴 音声認識停止");

    // === ログ消去処理 ===
    logHistory = [];
    localStorage.removeItem("logHistory");
    log.textContent = "";
  }
}

// === Gemini翻訳＋WebSocket送信 ===
async function translateText(text) {
    if (sourceLang === targetLang) {
      logMsg(`➡ 翻訳不要（そのまま送信）: ${text}`);
  
      // WebSocket送信だけ行う
      if (ws.readyState === WebSocket.OPEN) {
        const message = {
          address: "/chat",
          args: [text]
        };
        ws.send(JSON.stringify(message));
        logMsg(`📤 WebSocket送信: ${JSON.stringify(message)}`);
      } else {
        logMsg("❌ WebSocketが開いていません");
      }
      return;
    }
  
    // ↓↓↓ 以下は翻訳が必要なときだけ実行 ↓↓↓
  
    try {
      if ("ai" in self && "translator" in self.ai) {
        logMsg("⚙️ 翻訳エンジン初期化中...");
        const translator = await self.ai.translator.create({
          sourceLanguage: sourceLang,
          targetLanguage: targetLang
        });
  
        const result = await translator.translate(text);
        logMsg(`🌐 翻訳結果: ${result}`);
  
        if (ws.readyState === WebSocket.OPEN) {
          const message = {
            address: "/chat",
            args: [result]
          };
          ws.send(JSON.stringify(message));
          logMsg(`📤 WebSocket送信: ${JSON.stringify(message)}`);
        } else {
          logMsg("❌ WebSocketが開いていません");
        }
      } else {
        logMsg("❌ Gemini翻訳が使えない環境です（Chrome限定）");
      }
    } catch (err) {
      logMsg("❗ 翻訳エラー: " + err.message);
    }
}

log.textContent = logHistory.join("\n");
