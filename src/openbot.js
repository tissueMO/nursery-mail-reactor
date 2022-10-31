const axios = require('axios');
const playwright = require('playwright-aws-lambda');
const { Page } = require('playwright-core');

exports.handler = async ({ originalBody, openActionUrl }) => {
  const {
    channel,
    message_ts: messageTimestamp,
    original_message: originalMessage,
    response_url: responseUrl,
  } = originalBody;

  await Promise.all([
    // 開封済みを送信
    (async () => {
      const success = await runBrowser(
        openActionUrl,
        async (page) =>
          await page
            .$('#page_title')
            .then((element) => element.textContent())
            .then((content) => content.trim())
            .then((content) => content === '受信メッセージ開封通知'),
      );
      console.log('メール送信元への開封通知結果:', success);
    })(),

    // 開封済みのSlackリアクション
    (async () => {
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
    })(),

    // 元のメッセージをアクション実行済みの状態へ更新
    axios.post(
      responseUrl,
      {
        response_type: 'in_channel',
        text: originalMessage.text,
        attachments: [],
      },
      {
        'Content-Type': 'application/json',
      },
    ),
  ]);
};

/**
 * ヘッドレスブラウザーで任意の操作を行います。
 * @param {string} url
 * @param {function(Page): any} callback
 */
const runBrowser = async (url, callback = null) => {
  console.log('Chromium: ヘッドレスブラウザーを初期化します...');
  const browser = await playwright.launchChromium();
  const context = await browser.newContext({
    locale: 'ja',
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  console.log('Chromium: 最初のページへ遷移します...');
  await page.goto(url);
  await page.waitForNavigation({ timeout: 5000 });

  console.log('Chromium: 任意の処理を実行します...');
  return await callback?.(page);
};
