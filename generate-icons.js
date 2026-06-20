import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const LOGO_URL = 'https://aqifyxsimhqayfjwzzwj.supabase.co/storage/v1/object/public/img/ChatGPT%20Image%20Jun%2019,%202026,%2010_06_51%20AM.png';
const PUBLIC_DIR = path.resolve('public');

async function downloadLogo() {
  console.log(`Downloading logo from: ${LOGO_URL}`);
  const response = await fetch(LOGO_URL);
  if (!response.ok) {
    throw new Error(`Failed to download logo: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function generateAllIcons() {
  try {
    const rawLogoBuffer = await downloadLogo();

    const sizes = [32, 48, 72, 96, 128, 144, 152, 180, 192, 384, 512];

    console.log('Generating black background PWA icons...');

    for (const size of sizes) {
      // Keep padding so the logo doesn't touch the borders. Let's make the logo take up ~72% of the icon size.
      const innerSize = Math.max(Math.floor(size * 0.72), 16);

      // Resize original white logo with transparent background to inner size
      const resizedLogo = await sharp(rawLogoBuffer)
        .resize(innerSize, innerSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toBuffer();

      // Create a solid black canvas of exact "size"x"size" and overlay the resized logo
      const finalIcon = await sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 1 }
        }
      })
        .composite([{ input: resizedLogo, gravity: 'center' }])
        .png()
        .toBuffer();

      // Save as standard naming
      const standardPath = path.join(PUBLIC_DIR, `favicon-${size}x{size}.png`.replace('{size}', size.toString()).replace('{size}', size.toString()));
      fs.writeFileSync(standardPath, finalIcon);
      console.log(`Saved: ${standardPath}`);

      // Handle custom files requested
      if (size === 192) {
        fs.writeFileSync(path.join(PUBLIC_DIR, 'android-chrome-192x192.png'), finalIcon);
        console.log(`Saved: android-chrome-192x192.png`);
      }
      if (size === 512) {
        fs.writeFileSync(path.join(PUBLIC_DIR, 'android-chrome-512x512.png'), finalIcon);
        console.log(`Saved: android-chrome-512x512.png`);
      }
      if (size === 180) {
        fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), finalIcon);
        console.log(`Saved: apple-touch-icon.png`);
      }
      if (size === 32) {
        // Generate favicon.ico (as a PNG/ICO compatible file)
        fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), finalIcon);
        console.log(`Saved: favicon.ico`);
      }
    }

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error of generation:', error);
    process.exit(1);
  }
}

generateAllIcons();
