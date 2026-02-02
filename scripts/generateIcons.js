const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../public/icons/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    const outputPath = path.join(__dirname, `../public/icons/icon-${size}.png`);
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`Generated: icon-${size}.png`);
  }
  
  // Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(__dirname, '../public/icons/apple-touch-icon.png'));
  
  console.log('Generated: apple-touch-icon.png');
  console.log('Done!');
}

generateIcons().catch(console.error);
