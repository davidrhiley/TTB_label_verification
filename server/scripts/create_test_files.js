const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'test-files');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// 1x1 transparent PNG base64
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
const pngPath = path.join(dir, 'test.png');
fs.writeFileSync(pngPath, Buffer.from(pngBase64, 'base64'));

const txtPath = path.join(dir, 'test.txt');
fs.writeFileSync(txtPath, 'This is a test text file for upload.\n');

console.log('Created test files:', pngPath, txtPath);
