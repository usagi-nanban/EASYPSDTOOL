/* Web + Serial Departure Bell (simple) */
let audio = new Audio();
audio.preload = 'auto';

const fileInput = document.getElementById('fileInput');
const fileStatus = document.getElementById('fileStatus');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const loopChk = document.getElementById('loopChk');
const volume = document.getElementById('volume');
const baudRate = document.getElementById('baudRate');
const serialBtn = document.getElementById('serialBtn');
const serialStatus = document.getElementById('serialStatus');
const logEl = document.getElementById('log');

function log(msg){ const t = document.createElement('div'); t.textContent = msg; logEl.appendChild(t); logEl.scrollTop = logEl.scrollHeight; }

fileInput.addEventListener('change', e=>{
  const f = e.target.files[0];
  if(!f) return;
  audio.src = URL.createObjectURL(f);
  fileStatus.textContent = `選択: ${f.name} (${Math.round(f.size/1024)}KB)`;
  log('音源読み込み: ' + f.name);
});

playBtn.addEventListener('click', async ()=>{
  if(!audio.src){ alert('先に音源を選んでください'); return; }
  audio.loop = loopChk.checked;
  try{
    await audio.play();
    log('再生開始');
  }catch(e){
    log('再生失敗: ' + e);
  }
});

pauseBtn.addEventListener('click', ()=>{ audio.pause(); log('一時停止'); });
stopBtn.addEventListener('click', ()=>{ audio.pause(); audio.currentTime = 0; log('停止'); });
volume.addEventListener('input', ()=>{ audio.volume = Number(volume.value); log('音量: ' + Math.round(audio.volume*100) + '%'); });

// Web Serial handling
let port = null;
let reader = null;

serialBtn.addEventListener('click', async ()=>{
  if(!('serial' in navigator)){
    alert('このブラウザはWeb Serial APIに対応していません。Chrome等で使用してください。');
    return;
  }
  if(!port){
    try{
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: Number(baudRate.value) });
      serialStatus.textContent = '接続中';
      log('シリアルポート接続');
      readLoop().catch(e=>log('読み取りエラー: '+e));
      serialBtn.textContent = '切断';
    }catch(e){
      log('接続エラー: '+e);
      port = null;
    }
  } else {
    await disconnect();
  }
});

async function disconnect(){
  try{
    if(reader){ await reader.cancel(); reader.releaseLock(); reader = null; }
    if(port && port.readable){ await port.close(); }
  }catch(e){ log('切断エラー: '+e); } finally { port = null; serialBtn.textContent='シリアル接続'; serialStatus.textContent='未接続'; log('切断完了'); }
}

async function readLoop(){
  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  const inputStream = textDecoder.readable;
  reader = inputStream.getReader();
  let buffer = '';
  try{
    while(true){
      const { value, done } = await reader.read();
      if(done) break;
      if(value){
        buffer += value;
        let lines = buffer.split(/\r?\n/);
        buffer = lines.pop();
        for(const line of lines){
          const t = line.trim();
          if(!t) continue;
          log('受信: ' + t);
          if(t === '1'){ audio.loop = loopChk.checked; audio.play(); log('シリアル→再生'); }
          else if(t === '0'){ audio.pause(); audio.currentTime = 0; log('シリアル→停止'); }
        }
      }
    }
  }catch(e){ log('読取例外: '+e); }
  finally{ if(reader){ reader.releaseLock(); reader = null; } }
}

document.getElementById("announceInput").addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = ev => {
            announceAudio.src = ev.target.result;
            announceAudio.load();
        };
        reader.readAsDataURL(file);
    }
});

bellAudio.addEventListener("ended", () => {
    if (announceAudio.src) {
        announceAudio.play();
    }
});
