const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'mysecret123';
const TARGET_URL = process.env.TARGET_URL || 'https://your-own-test-page.com';
const DEBUG_DIR = path.join(__dirname, 'debug');

if (!fs.existsSync(DEBUG_DIR)) {
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
}

function now() {
  return new Date().toISOString();
}

function safeFileName(str) {
  return str.replace(/[^a-zA-Z0-9-_]/g, '_');
}

app.get('/', (req, res) => {
  res.send('App is running');
});

app.get('/run', async (req, res) => {
  const startedAt = Date.now();
  const runId = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const steps = [];
  let browser = null;

  const logStep = (label, extra = {}) => {
    const entry = {
      time: now(),
      label,
      ...extra
    };
    steps.push(entry);
    console.log(`[${runId}] ${label}`, extra);
  };

  try {
    if (req.query.key !== SECRET_KEY) {
      return res.status(403).json({
        ok: false,
        message: 'Unauthorized'
      });
    }

    logStep('Run started', {
      runId,
      target: TARGET_URL,
      userAgent: 'Android mobile emulation'
    });

    logStep('Puppeteer executable path', {
      executablePath: puppeteer.executablePath()
    });

    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process'
      ]
    });

    logStep('Browser launched');

    const page = await browser.newPage();

    page.on('console', msg => {
      console.log(`[${runId}] PAGE CONSOLE [${msg.type()}]: ${msg.text()}`);
    });

    page.on('pageerror', err => {
      console.log(`[${runId}] PAGE ERROR: ${err.message}`);
    });

    page.on('requestfailed', req => {
      console.log(
        `[${runId}] REQUEST FAILED: ${req.method()} ${req.url()} | ${req.failure()?.errorText || 'Unknown'}`
      );
    });

    page.on('response', async response => {
      const status = response.status();
      const url = response.url();
      if (status >= 400) {
        console.log(`[${runId}] BAD RESPONSE: ${status} ${url}`);
      }
    });

    await page.setUserAgent(
      'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'
    );

    await page.setViewport({
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true
    });

    logStep('Mobile emulation configured', {
      width: 390,
      height: 844
    });

    await page.goto(TARGET_URL, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    logStep('Page opened', {
      finalUrl: page.url(),
      title: await page.title()
    });

    const beforeShot = path.join(DEBUG_DIR, `before_${safeFileName(runId)}.png`);
    await page.screenshot({
      path: beforeShot,
      fullPage: true
    });

    logStep('Before screenshot saved', {
      file: beforeShot
    });

    await page.waitForSelector('.btn', {
      timeout: 30000,
      visible: true
    });

    logStep('Selector found', {
      selector: '.btn'
    });

    const btnInfo = await page.$eval('.btn', el => ({
      text: (el.innerText || '').trim(),
      tag: el.tagName,
      classes: el.className,
      href: el.getAttribute('href'),
      disabled: !!el.disabled
    }));

    logStep('Element details captured', btnInfo);

    // Internal QA only:
    // await page.click('.btn');
    // logStep('Element clicked');

    const afterShot = path.join(DEBUG_DIR, `after_${safeFileName(runId)}.png`);
    await page.screenshot({
      path: afterShot,
      fullPage: true
    });

    logStep('After screenshot saved', {
      file: afterShot
    });

    const durationMs = Date.now() - startedAt;

    return res.json({
      ok: true,
      message: 'Run completed',
      runId,
      durationMs,
      target: TARGET_URL,
      steps
    });
  } catch (error) {
    const durationMs = Date.now() - startedAt;

    console.error(`[${runId}] ERROR:`, error);

    return res.status(500).json({
      ok: false,
      runId,
      durationMs,
      error: error.message,
      steps
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log(`[${runId}] Browser closed`);
      } catch (closeErr) {
        console.log(`[${runId}] Browser close error: ${closeErr.message}`);
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});