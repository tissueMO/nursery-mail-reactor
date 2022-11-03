const axios = require('axios');
const { runBrowser } = require('./common/browser');

/**
 * 保育園からのメールを開封済みにします。
 * @param {Object} event
 * @param {Object} event.originalBody
 * @param {string} event.openActionUrl
 * @returns
 */
exports.handler = async ({ originalBody, openActionUrl }) => {
  const { channel, message_ts: messageTimestamp } = originalBody;

  console.log('開封URL:', openActionUrl);

  // メールを開封済みにする
  await (async () => {
    const success = await runBrowser(
      openActionUrl,
      async ({ page }) =>
        await page
          .$('#page_title')
          .then((element) => element.textContent())
          .then((content) => content.trim())
          .then((content) => content === '受信メッセージ開封通知'),
    );
    console.log('メール送信元への開封通知結果:', success ? 'OK' : 'NG');
  })();

  // 開封済みを表すSlackリアクション
  await (async () => {
    const { status, data } = await axios.request({
      url: 'https://slack.com/api/reactions.add',
      method: 'POST',
      data: {
        channel: channel.id,
        timestamp: messageTimestamp,
        name: 'mailbox_with_no_mail',
      },
      headers: {
        Authorization: `Bearer ${process.env.SLACK_BOT_USER_OAUTH_TOKEN}`,
      },
    });
    console.log('Slackへのリアクション結果:', status, data);
  })();

  return { statusCode: 200 };
};
