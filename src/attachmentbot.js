const fs = require('fs');
const path = require('path');
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
  await runBrowser(attachmentsUrl, async ({ page }) => {
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
      const [download] = await Promise.all([page.waitForEvent('download'), link.click({ force: true })]);
      console.log(`[#${i + 1}] ダウンロードファイル名:`, fileNames[i]);

      // 添付ファイルとして送信
      const form = new FormData();
      const file = fs.createReadStream(await download.path());
      const fileType = path.extname(download.suggestedFilename()).slice(1).toLowerCase();
      form.append('file', file);
      form.append('filename', fileNames[i]);
      form.append('filetype', fileType);
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
