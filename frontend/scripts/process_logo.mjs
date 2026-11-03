import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const base64Data = fs.readFileSync('frontend/public/cubeai-logo.png').toString('base64');
  const dataUrl = `data:image/png;base64,${base64Data}`;

  const results = await page.evaluate(async (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;

        // 1. Transparent full logo (keyed against white background)
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;

        // Also prepare dark theme logo data
        const darkData = new Uint8ClampedArray(data);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // If near white / background
          if (r > 240 && g > 240 && b > 240) {
            data[i + 3] = 0; // Transparent
            darkData[i + 3] = 0;
          } else {
            // For dark theme version:
            // "CubeAI" text is dark navy (r < 50, g < 60, b < 90) and located roughly in x > 160
            const pixelIndex = i / 4;
            const x = pixelIndex % w;
            if (x > 165 && r < 60 && g < 70 && b < 100) {
              // Convert dark navy letters to bright clean white
              darkData[i] = 255;
              darkData[i + 1] = 255;
              darkData[i + 2] = 255;
            }
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentLogo = canvas.toDataURL('image/png');

        // Dark theme logo
        const darkCanvas = document.createElement('canvas');
        darkCanvas.width = w;
        darkCanvas.height = h;
        const darkCtx = darkCanvas.getContext('2d');
        const darkImgData = darkCtx.createImageData(w, h);
        darkImgData.data.set(darkData);
        darkCtx.putImageData(darkImgData, 0, 0);
        const darkLogo = darkCanvas.toDataURL('image/png');

        // 2. Crop just the cube icon (x: 0 to 180)
        const iconCanvas = document.createElement('canvas');
        const iconW = 180;
        iconCanvas.width = iconW;
        iconCanvas.height = h;
        const iconCtx = iconCanvas.getContext('2d');
        iconCtx.drawImage(canvas, 0, 0, iconW, h, 0, 0, iconW, h);
        const iconPng = iconCanvas.toDataURL('image/png');

        resolve({
          transparentLogo,
          darkLogo,
          iconPng,
          width: w,
          height: h
        });
      };
      img.src = src;
    });
  }, dataUrl);

  // Write files
  const transBuffer = Buffer.from(results.transparentLogo.split(',')[1], 'base64');
  fs.writeFileSync('frontend/public/cubeai-logo.png', transBuffer);
  console.log('✅ Updated frontend/public/cubeai-logo.png (clean transparent)');

  const darkBuffer = Buffer.from(results.darkLogo.split(',')[1], 'base64');
  fs.writeFileSync('frontend/public/cubeai-logo-dark.png', darkBuffer);
  console.log('✅ Generated frontend/public/cubeai-logo-dark.png (for dark navy sidebar & login)');

  const iconBuffer = Buffer.from(results.iconPng.split(',')[1], 'base64');
  fs.writeFileSync('frontend/public/cubeai-icon.png', iconBuffer);
  console.log('✅ Generated frontend/public/cubeai-icon.png');

  fs.writeFileSync('frontend/public/favicon.png', iconBuffer);
  console.log('✅ Generated frontend/public/favicon.png');

  await browser.close();
})();

