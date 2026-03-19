const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
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

  await page.goto('https://trustme4u.com/flyingad/adflying912.php', {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  console.log('Page opened in mobile view');

  await page.waitForSelector('.btn', { timeout: 30000 });
  await page.click('.btn');

  console.log('Button clicked');

  
  await new Promise(resolve => setTimeout(resolve, 5000));

  await browser.close();
})();