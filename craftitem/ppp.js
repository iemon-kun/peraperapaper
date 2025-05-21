const speechBubble = $.subNode("TextBack");
const serif = $.subNode("Text");

const bubbleWidth  = 0.55; // 吹き出しの横幅
const bubbleHeight = 0.45; // 吹き出しの高さ
const maxFontSize = 1.5;   // 最大フォントサイズ
const minFontSize = 0.09;   // 最小フォントサイズ
const correctionValue = 50; // 1/InitAjusterのスケール倍

function checkInput(input, x){
    const elements = input.split(',');
    if(elements.length != x) return false;
    for(let element of elements){
        if(isNaN(element) || element.trim() === ' '){
            return false;
        }
    }
    return true;
}

// // 文字幅を計算する関数（半角=1.0, 全角=2.0）
function calcTextUnits(str) {
    let units = 0;
    for (const ch of str) {
        if (ch.match(/[\x00-\x7F]/)) {
            units += 1.0;  // 半角
        } else {
            units += 2.0;  // 全角
        }
    }
    return units;
}

// 改行
function autoWrapTextSmart(text) {
    const maxUnitsPerLine = 18;
    const totalUnits = calcTextUnits(text);
    let maxLines = 1;

    if (totalUnits <= maxUnitsPerLine) {
        maxLines = 1;
    } else if (totalUnits <= maxUnitsPerLine * 2) {
        maxLines = 2;
    } else {
        maxLines = 3;
    }

    const words = text.split(/(\s+)/); // 空白も保持して単語単位で処理
    const unitsList = words.map(word => ({
        text: word,
        units: calcTextUnits(word)
    }));

    const targetUnitsPerLine = totalUnits / maxLines;
    const lines = [];
    let currentLine = "";
    let currentUnits = 0;

    for (let i = 0; i < unitsList.length; i++) {
        const word = unitsList[i];

        if (currentUnits + word.units > targetUnitsPerLine && lines.length < maxLines - 1) {
            lines.push(currentLine.trim());
            currentLine = word.text;
            currentUnits = word.units;
        } else {
            currentLine += word.text;
            currentUnits += word.units;
        }
    }

    if (currentLine.length > 0) {
        lines.push(currentLine.trim());
    }

    while (lines.length > maxLines) {
        const last = lines.pop();
        lines[lines.length - 1] += " " + last;
    }

    return lines.join("\n");
}

// フォントサイズを調整しセットする関数
function adjustFontSize(text) {
    let fontSize = maxFontSize;
    serif.setTextSize(fontSize);

    // 改行を考慮して行ごとに文字幅を計算
    const lines = text.split("\n");  // 改行で分割
    let maxLineUnits = 0;

    for (const line of lines) {
        const lineUnits = calcTextUnits(line);
        if (lineUnits > maxLineUnits) {
            maxLineUnits = lineUnits;  // 最長の行を記録
        }
    }

    let lineCount = lines.length; // 実際の行数

    // フォントサイズ調整ループ
    while ((maxLineUnits * fontSize  > bubbleWidth * correctionValue  // 横幅チェック
            || lineCount * fontSize  > bubbleHeight * correctionValue) // 縦方向（行数）チェック
            && fontSize > minFontSize) {
        fontSize -= 0.05;  // 0.05ずつ縮小
        if (fontSize < minFontSize) {
            fontSize = minFontSize;
        }
        //$.log(fontSize);
        serif.setTextSize(fontSize);
        }
    serif.setText(text);
}

$.onStart(() => {
    $.state.initPos = $.getPosition();
    $.state.initRot = $.getRotation();
    $.state.owner = null;
    $.state.followOwner = false;
    $.state.pos = new Vector3(0, 0.35, 0.2);
});

$.onInteract((player) => {
    // playerに対してPlayerScriptをセットする
    if(!$.state.owner) {
        $.state.owner = player;
        $.setPlayerScript(player);
        $.log("インタラクトを検知:::オーナーを設定");
        $.state.followOwner = true;
    }else if($.state.owner.id === player.id){
        player.requestTextInput("command", "コマンドを入力してください。");
        // $.destroy(); $.state.owner = null;
    }
});

$.onUpdate(deltaTime => {
    if(!$.state.owner)return;
    let userIs = $.state.owner.exists();
    if(!userIs){
        $.state.owner = null;
        serif.setText("");
        let initPos = $.state.initPos;
        let initRot = $.state.initRot;
        $.setPosition(initPos);
        $.setRotation(initRot);   
    }else if($.state.followOwner){
        let userPos = $.state.owner.getHumanoidBonePosition(HumanoidBone.Head);
        let userRot = $.state.owner.getHumanoidBoneRotation(HumanoidBone.Head);
        $.setPosition(new Vector3(userPos.x + $.state.pos.x, userPos.y + $.state.pos.y, userPos.z + $.state.pos.z));
        $.setRotation(userRot);
    }
});

// PlayerScriptからのattackメッセージを受け取りログを出力する。
$.onReceive((messageType, arg, sender) => {
    //$.log("受信");
    if (messageType === "getText") {
        if(sender.id === $.state.owner.id){
            $.log(`getText: ${arg}`);
            let wrappedText = autoWrapTextSmart(arg);
            adjustFontSize(wrappedText);            

            //adjustFontSize(arg);
        }
    }
}, { player: true });

$.onTextInput((text, meta, status) => {
    if(status != TextInputStatus.Success) return;
    switch(meta) {
        case "command":
            switch(text){
                case "/serifColor":
                    $.state.owner.requestTextInput("reqSerifColor", "セリフの色をr,g,b,aで指定してください。\n(各数値0〜1 ,(カンマ)区切り)");
                    break;
                case "/serifPos":
                    $.state.owner.requestTextInput("reqSerifPos", "セリフ全体の位置をx,y,zで指定してください。\n(数値 ,(カンマ)区切り)");
                    break;
                case "/bgColor":
                    $.state.owner.requestTextInput("reqBgColor", "吹き出しの色をr,g,b,aで指定してください。\n(各数値0〜1 ,(カンマ)区切り)");
                    break;
                case "/objColor":
                    $.state.owner.requestTextInput("reqObjectColor", "オブジェクトの色をr,g,b,aで指定してください。\n(r,g,b:0以上　a:0〜1　 ,(カンマ)区切り)");
                    break;
                case "/release":
                    $.state.owner = null;
                    serif.setTextSize(1.5);
                    serif.setText("ペラペラペーパー");
                    let initPos = $.state.initPos;
                    let initRot = $.state.initRot;
                    $.setPosition(initPos);
                    $.setRotation(initRot);   
                    $.log("使用を終了しました。")
                    break;
                case "/reset":
                    serif.setTextColor(0.04, 0.0, 0.01, 1);
                    speechBubble.setPosition(new Vector3(0, 0, 0));
                    // bg.setBaseColor(0, 0, 0, 0.7843137);
                    // obj.setEmissionColor(3, 191, 63, 0.8901767);
                    $.log("変更をリセットしました。");
                    break;
                default:
                    $.log("不明なコマンドです。");
                    break;
            }
            break;
        case "reqSerifColor":
            if(checkInput(text, 4) === true){
                let rgba = text.split(',');
                serif.setTextColor(rgba[0], rgba[1], rgba[2], rgba[3]);
            }else{
                $.log("入力値が不正です。");
            }
            break;
        case "reqSerifPos":
            if(checkInput(text, 3) === true){
                let newPos = text.split(',');
                speechBubble.setPosition(new Vector3(newPos[0], newPos[1], newPos[2]));
            }else{
                $.log("入力値が不正です。");
            }
            break;
        case "reqBgColor":
            if(checkInput(text, 4) === true){
                //let rgba = text.split(',');
                //bg.setBaseColor(rgba[0], rgba[1], rgba[2], rgba[3]);
                $.log("未実装です。");
            }else{
                $.log("入力値が不正です。");
            }
            break;
        case "reqObjectColor":
            if(checkInput(text, 4) === true){
                //let rgba = text.split(',');
                //obj.setEmissionColor(rgba[0], rgba[1], rgba[2], rgba[3]);
                $.log("未実装です。");
            }else{
                $.log("入力値が不正です。");
            }
            break;
        default:
            $.log("不明なコマンドです");
            break;
    }
});