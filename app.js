const fs = require('fs');
const path = require('path');
const dir = require('node-dir');
const { createCanvas, loadImage } = require('canvas');
const PSD = require('psd');

const INPUT_DIR = path.join(__dirname, 'input');
const OUTPUT_FILE = path.join(__dirname, 'output/output.psd');

// 再帰的にフォルダー構造を取得
async function getFolderStructure(dirPath) {
    return new Promise((resolve, reject) => {
        dir.subdirs(dirPath, (err, subdirs) => {
            if (err) reject(err);
            resolve(subdirs);
        });
    });
}

// 画像をキャンバスに描画
async function createCanvasFromImage(filePath) {
    const img = await loadImage(filePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return { canvas, width: img.width, height: img.height };
}

// レイヤーを作成
async function createLayers(folderPath, psd, parentGroup = null) {
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
        const fullPath = path.join(folderPath, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            // サブフォルダーをレイヤーグループとして追加
            const group = psd.tree().addGroup(file);
            await createLayers(fullPath, psd, group);
        } else if (stats.isFile() && /\.(png|jpg|jpeg)$/i.test(file)) {
            // 画像ファイルをレイヤーとして追加
            const { canvas } = await createCanvasFromImage(fullPath);
            const layer = parentGroup ? parentGroup.addLayer(file) : psd.tree().addLayer(file);
            layer.setCanvas(canvas);
        }
    }
}

// フォルダーをPSDに変換
async function convertFolderToPSD() {
    try {
        console.log('フォルダー構造を解析中...');
        const psd = new PSD();
        psd.tree().width = 1024; // キャンバス幅（必要に応じて変更）
        psd.tree().height = 1024; // キャンバス高さ（必要に応じて変更）

        // フォルダー構造を読み込み、レイヤーを生成
        await createLayers(INPUT_DIR, psd);

        // PSDファイルを保存
        const buffer = psd.toBuffer();
        fs.writeFileSync(OUTPUT_FILE, buffer);
        console.log(`PSDファイルを生成しました: ${OUTPUT_FILE}`);
    } catch (error) {
        console.error('エラーが発生しました:', error);
    }
}

// メイン処理
convertFolderToPSD();
