let audio = new Audio();
let fileNameDisplay = document.getElementById("fileName");
let logDisplay = document.getElementById("log");

document.getElementById("fileInput").addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
        fileNameDisplay.textContent = file.name;
        const reader = new FileReader();
        reader.onload = function(ev) {
            audio.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        fileNameDisplay.textContent = "ファイル未選択";
    }
});

document.getElementById("playBtn").addEventListener("click", () => {
    audio.loop = document.getElementById("loopToggle").checked;
    audio.volume = document.getElementById("volume").value;
    audio.play();
});

document.getElementById("stopBtn").addEventListener("click", () => {
    audio.pause();
    audio.currentTime = 0;
});

document.getElementById("volume").addEventListener("input", (e) => {
    audio.volume = e.target.value;
});

// シリアル接続（Web Serial API）
async function connectSerial() {
    if ("serial" in navigator) {
        try {
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            const decoder = new TextDecoderStream();
            const inputDone = port.readable.pipeTo(decoder.writable);
            const inputStream = decoder.readable.getReader();
            logDisplay.textContent += "\nシリアル接続しました";

            while (true) {
                const { value, done } = await inputStream.read();
                if (done) break;
                if (value.trim() === "1") {
                    audio.play();
                } else if (value.trim() === "0") {
                    audio.pause();
                    audio.currentTime = 0;
                }
            }
        } catch (err) {
            logDisplay.textContent += "\nシリアル接続エラー: " + err;
        }
    } else {
        logDisplay.textContent += "\nこのブラウザはWeb Serial APIに対応していません";
    }
}
