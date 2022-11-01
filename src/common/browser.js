const playwright = require('playwright-aws-lambda');
const { Page } = require('playwright-core');

/**
 * ヘッドレスブラウザーで任意の操作を行います。
 * @param {string} url
 * @param {function(Page): any} callback
 * @return {Promise<*>}
 */
exports.runBrowser = async (url, callback = null) => {
  console.log('Chromium: ヘッドレスブラウザーを初期化します...');
  const browser = await playwright.launchChromium();
  const context = await browser.newContext({
    locale: 'ja',
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  console.log('Chromium: 最初のページへ遷移します...');
  await page.goto(url);

  console.log('Chromium: 任意の処理を実行します...');
  return await callback?.(page);
};
