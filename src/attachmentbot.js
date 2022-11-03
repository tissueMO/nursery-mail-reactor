const axios = require('axios');
const FormData = require('form-data');
const { runBrowser } = require('./common/browser');

/**
 * 保育園からのメールの添付ファイルをSlackに添付します。
 * @param {Object} event
 * @param {string} event.threadTimestamp
 * @param {string} event.attachmentsUrl
 */
exports.handler = async ({ threadTimestamp, attachmentsUrl }) => {
  await runBrowser(attachmentsUrl, async ({ context, page }) => {
    const downloadLinks = await page.$$('.file_download_col .download_link');
    const fileNames = (
      await Promise.all((await page.$$('td.file_name_col')).map((element) => element.textContent()))
    ).map((fileName) => fileName.trim());

    for (const [i, link] of downloadLinks.entries()) {
      page.on('console', async (message) => {
        const values = [];
        for (const arg of message.args) {
          values.push(await arg.jsonValue());
        }
        console.log(...values);
      });

      await link.click();
      const formTest = new FormData();
      formTest.append('file', await page.screenshot({ fullPage: true }));
      formTest.append('filename', fileNames[i]);
      formTest.append('thread_ts', threadTimestamp);
      const { statusTest, dataTest } = await axios.request({
        url: 'https://slack.com/api/files.upload',
        method: 'POST',
        data: formTest,
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_USER_OAUTH_TOKEN}`,
          ...form.getHeaders(),
        },
      });
      console.log(`[#${i + 1}] Slackへのアップロード結果:`, statusTest, dataTest);

      const response = await Promise.all([context.waitForEvent('response'), link.click()]);
      console.log(response);
      const download = null;
      // const [newPage] = await Promise.all([context.waitForEvent('page'), link.click()]);
      // const download = await newPage.waitForEvent('download');

      console.log(`[#${i + 1}] ダウンロードファイル名:`, fileNames[i]);
      console.log(`[#${i + 1}] ダウンロードファイルパス:`, await download.path());

      const form = new FormData();
      form.append('file', await download.createReadStream());
      form.append('filename', fileNames[i]);
      form.append('thread_ts', threadTimestamp);

      const { status, data } = await axios.request({
        url: 'https://slack.com/api/files.upload',
        method: 'POST',
        data: form,
        headers: {
          Authorization: `Bearer ${process.env.SLACK_BOT_USER_OAUTH_TOKEN}`,
          ...form.getHeaders(),
        },
      });
      console.log(`[#${i + 1}] Slackへのアップロード結果:`, status, data);
    }
  });

  return { statusCode: 200 };
};
