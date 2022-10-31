const aws = require('aws-sdk');

const lambda = new aws.Lambda();

exports.handler = async (event) => {
  const body = parseBody(event);
  console.log('Slackからのリクエスト内容:', body);

  const {
    callback_id: callbackId,
    actions: [action],
  } = body;

  // 保育園メールの開封通知
  if (callbackId === 'nersary_mail_reactor') {
    return executeOpenMailAction(body, {
      needsReaction: action.name === 'ok',
      openActionUrl: action.value.replace(/&amp;/g, '&'),
    });
  }

  return { statusCode: 400 };
};

/**
 * Slackから渡されてくるリクエストボディを解析します。
 * @param {*} event API Gateway ペイロード形式 2.0
 */
const parseBody = ({ body, isBase64Encoded }) => {
  if (isBase64Encoded) {
    body = Buffer.from(body, 'base64').toString();
  }

  body = body.match(/payload=(.*)$/)[1];
  body = decodeURIComponent(body);
  body = JSON.parse(body);

  return body;
};

/**
 * 非同期でメール開封Botを実行し、Slack APIと連携します。
 * @param {*} body Slack API 形式
 * @param {Object} options
 * @param {boolean} options.needsReaction
 * @param {string} options.openActionUrl
 * @returns
 */
const executeOpenMailAction = async (body, { needsReaction, openActionUrl }) => {
  if (!needsReaction) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: body.text,
        attachments: [],
      }),
    };
  }

  await lambda
    .invoke({
      FunctionName: process.env.OPENBOT_FUNCTION,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        originalBody: body,
        openActionUrl,
      }),
    })
    .promise();

  return { statusCode: 200 };
};
