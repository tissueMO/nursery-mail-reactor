const { Page, chromium } = require('playwright-core');
const awsChromium = require('chrome-aws-lambda');

/**
 * ヘッドレスブラウザーで任意の操作を行います。
 * @param {string} url
 * @param {function(Page): any} callback
 * @return {Promise<*>}
 */
exports.runBrowser = async (url, callback = null) => {
  console.log('Chromium: ヘッドレスブラウザーを初期化します...');
  const browser = await chromium.launch({
    args: awsChromium.args,
    executablePath: await awsChromium.executablePath,
  });
  const page = await browser.newPage({
    locale: 'ja',
    viewport: { width: 1920, height: 1080 },
    acceptDownloads: true,
  });

  console.log('Chromium: 最初のページへ遷移します...');
  await page.goto(url);

  console.log('Chromium: 任意の処理を実行します...');
  return await callback?.({ context, page });
};
