// server.js 側で引数を受け取る
const oscPort = process.argv[2] || 9000;
const wsPort = process.argv[3] || 8081;

// console.log(`🚀 OSCポート: ${oscPort}, WebSocketポート: ${wsPort}`);

const { WebSocketServer } = require("ws");
const { UDPPort } = require("osc");

const oscClient = new UDPPort({
  localAddress: "0.0.0.0",
  localPort: 57121,
  remoteAddress: "127.0.0.1",
  remotePort: oscPort
});

oscClient.open();

const wss = new WebSocketServer({ port: wsPort });

console.log(`🌐 WebSocketサーバー起動: ws://localhost:${wsPort}`);

wss.on("connection", (ws) => {
  console.log("✅ WebSocket クライアント接続");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log("📨 WebSocket 受信:", data);

      // OSC送信
      oscClient.send({
        address: data.address,
        args: data.args
      });
      console.log(`📡 OSC送信: ${data.address}`);
    } catch (err) {
      console.error("❌ メッセージ処理エラー:", err);
    }
  });
});
