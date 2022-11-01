const aws = require('aws-sdk');

const lambda = new aws.Lambda();

/**
 * 保育園からのメールの添付ファイルをSlackに添付します。
 * @param {*} event API Gateway ペイロード形式 2.0
 */
exports.handler = async ({ body, isBase64Encoded }) => {
  if (isBase64Encoded) {
    body = Buffer.from(body, 'base64').toString();
  }

  body = JSON.parse(body);
  const { threadTimestamp, attachmentsUrl } = body;
  console.log('Slackスレッドタイムスタンプ:', threadTimestamp);
  console.log('添付ファイル閲覧ページURL:', attachmentsUrl);

  await lambda
    .invoke({
      FunctionName: process.env.ATTACHMENTBOT_FUNCTION,
      InvocationType: 'Event',
      Payload: JSON.stringify({
        threadTimestamp,
        attachmentsUrl,
      }),
    })
    .promise();

  return { statusCode: 200 };
};
