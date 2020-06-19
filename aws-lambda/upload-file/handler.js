const multipart = require('aws-lambda-multipart-parser');

module.exports.upload = async event => {

  const file = multipart.parse(event, false);

  return {
    statusCode: 200,
    headers: {
      'Content-type': file.file.contentType,//you can change any content type
      'content-disposition': `attachment; filename=${file.file.filename}` // key of success
    },
    body: file.file.content
  };

};
