
const http = require('http');

module.exports = function(options) {
  return new Promise((res, rej) => {
    http.get(options, (response) => {
      const { statusCode } = response;
      if(statusCode >= 400) {
        console.error(response);
        response.resume();
        return rej(`Bad response! Please check your url. Status Code: ${statusCode}`);
      }

      let body = '';
      response
        .on('data', (data) => body += data)
        .on('error', rej)
        .on('end', () => {
          res(body);
        });
    }).on('error', rej);
  });
};
