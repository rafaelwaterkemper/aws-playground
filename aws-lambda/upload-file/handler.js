const multipart = require('aws-lambda-multipart-parser');

module.exports.upload = async event => {

  const file = multipart.parse(event, false);

  return {
    statusCode: 200,
      headers: {
        'Content-type': file.file.contentType,//you can change any content type
        'content-disposition': `attachment; filename=${file.file.filename}` // key of success
      },
      body: file.file.content.data.toString('base64'),
      isBase64Encoded: true
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
