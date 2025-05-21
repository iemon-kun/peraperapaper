//
_.log("PlayerScriptがアタッチされました");
const source = _.sourceItemId;
_.log(source.id);

// 受信したOSCメッセージをログに出力する
_.oscHandle.onReceive((messages) => {
  const lines = [];

  messages.forEach((message, i) => {
    const { address, timestamp, values } = message;

    lines.push(`== message [${i + 1}/${messages.length}]`);
    lines.push(`address: ${address}`);
    lines.push(`timestamp: ${new Date(timestamp).toLocaleString()}`);

    values.forEach((value, j) => {
          lines.push(`= value [${j + 1}/${values.length}]`);

          lines.push(`getInt(): ${value.getInt()}`);
          lines.push(`getFloat(): ${value.getFloat()}`);
          lines.push(`getAsciiString(): ${value.getAsciiString()}`);
          // serif = value.getAsciiString();
          lines.push(`getBlobAsUint8Array(): ${value.getBlobAsUint8Array()}`);
          lines.push(`getBlobAsUtf8String(): ${value.getBlobAsUtf8String()}`);
          lines.push(`getBool(): ${value.getBool()}`);
      });
  });

  
  let text = lines.join("\n");
  _.log(text);
  _.sendTo(_.sourceItemId, "getText", lines[6].substring(18));//ソースアイテムに内容を送信
  //_.log(`${_.sourceItemId}に「${lines[6].substring(18)}」を送信`);
  //_.sendTo(source, "getText", text);//ソースアイテムに内容を送信
});