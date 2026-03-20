const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('App is running');
});

app.get('/run', async (req, res) => {
  let browser;

  try {
    console.log('🚀 Run started at:', new Date().toISOString());
    console.log('Puppeteer path:', puppeteer.executablePath());

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ]
    });

    console.log('✅ Browser launched');

    const page = await browser.newPage();

    // Page console logs
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });

    // Errors
    page.on('pageerror', err => {
      console.log('PAGE ERROR:', err.message);
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/122 Mobile Safari/537.36'
    );

    await page.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true
    });

    console.log('📱 Mobile view set');

    await page.goto('https://airbet-aviator.com/jointoday/test.php', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('🌐 Page loaded:', await page.title());

    // Screenshot before
    await page.screenshot({ path: 'before.png', fullPage: true });
    console.log('📸 Screenshot saved (before)');

    await page.waitForSelector('.btn', { timeout: 30000 });

    console.log('🔍 Button found');

    // Get button text
    const text = await page.$eval('.btn', el => el.innerText.trim());
    console.log('📝 Button text:', text);

    // (optional click — keep commented for now)
    // await page.click('.btn');
    // console.log('🖱 Button clicked');

    // Screenshot after
    await page.screenshot({ path: 'after.png', fullPage: true });
    console.log('📸 Screenshot saved (after)');

    await browser.close();
    console.log('🧹 Browser closed');

    res.send('✅ Success - check logs');
  } catch (error) {
    console.error('❌ Error:', error.message);

    if (browser) {
      await browser.close();
    }

    res.status(500).send('Error: ' + error.message);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});