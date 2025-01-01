const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

fileInput.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const images = files.filter(file => /\.(png|jpe?g)$/i.test(file.name));
    if (images.length === 0) {
        alert('画像ファイルが見つかりませんでした');
        return;
    }

    canvas.width = 800; // 固定幅（必要に応じて変更可能）
    canvas.height = images.length * 200; // 高さを画像数に応じて調整
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let yOffset = 0;
    for (const imageFile of images) {
        const img = new Image();
        img.src = URL.createObjectURL(imageFile);
        await new Promise(resolve => {
            img.onload = () => {
                ctx.drawImage(img, 0, yOffset, canvas.width, 200);
                yOffset += 200;
                resolve();
            };
        });
    }

    alert('画像をキャンバスに描画しました');
});
