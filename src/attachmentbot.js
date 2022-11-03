const axios = require('axios');
const FormData = require('form-data');
const { runBrowser } = require('./common/browser');

/**
 * 保育園からのメールの添付ファイルをSlackに添付します。
 * @param {Object} event
 * @param {string} event.channelId
 * @param {string} event.threadTimestamp
 * @param {string} event.attachmentsUrl
 */
exports.handler = async ({ channelId, threadTimestamp, attachmentsUrl }) => {
  await runBrowser(attachmentsUrl, async ({ context, page }) => {
    const attachmentsAccordion = await page.$('.title_letter_attach_files_area');
    const agreePolicyCheckBox = await page.$('#user_policy');
    const downloadLinks = await page.$$('.file_download_col .download_link');
    const fileNames = (
      await Promise.all((await page.$$('td.file_name_col')).map((element) => element.textContent()))
    ).map((fileName) => fileName.trim());

    // ダウンロードリンクを表示させる
    await attachmentsAccordion.click();
    await agreePolicyCheckBox.check();
    await agreePolicyCheckBox.dispatchEvent('change');

    for (const [i, link] of downloadLinks.entries()) {
      await link.click({ force: true });
      // const download = await page.waitForEvent('download');
      const response = await context.waitForEvent('response');
      console.log(response.status, response.url);
      const response2 = await context.waitForEvent('response');
      console.log(response2.status, response2.url);

      console.log(`[#${i + 1}] ダウンロードファイル名:`, fileNames[i]);
      console.log(`[#${i + 1}] ダウンロードファイルパス:`, await download.path());

      const form = new FormData();
      form.append('file', await download.createReadStream());
      form.append('filename', fileNames[i]);
      // form.append('filetype', 'pdf');
      form.append('channels', channelId);
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
