import sharp from 'sharp'
const SRC = '/home/z/my-project/upload/pasted_image_1792229480959.png'
// Swirl: sekitar x 624..1058, y 88..502 (sebelum baris teks "WARANUSA")
await sharp(SRC).extract({ left: 622, top: 56, width: 440, height: 440 }).resize(512, 512).png().toFile('/home/z/my-project/public/images/brand/emblem.png')
await sharp(SRC).extract({ left: 622, top: 56, width: 440, height: 440 }).resize(128, 128).png().toFile('/home/z/my-project/src/app/icon.png')
console.log('crop v3 ok')
