const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.get('/', (req, res) => {
  res.send('App is running');
});

app.get('/run', async (req, res) => {
  let browser;

  try {
    console.log('Puppeteer executable path:', puppeteer.executablePath());

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
    );

    await page.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true
    });

    // Put your OWN site or internal test URL here
    await page.goto('https://trustme4u.com/flyingad/adflying912.php', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('Page opened in mobile view');

    // Example QA check
    await page.waitForSelector('.btn', { timeout: 30000 });

    console.log('Button found');

    await browser.close();
    browser = null;

    return res.send('Success');
  } catch (error) {
    console.error('Error:', error.message);

    if (browser) {
      await browser.close();
    }

    return res.status(500).send('Error: ' + error.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});