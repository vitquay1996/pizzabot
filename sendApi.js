const request = require('request');

const fbReq = request.defaults({
  uri: 'https://graph.facebook.com/me/messages',
  method: 'POST',
  json: true,
  qs: { access_token: FB_PAGE_TOKEN },
  headers: {'Content-Type': 'application/json'},
});

module.exports = {
const fbMessage = (recipientId, msg, cb) => {
  const opts = {
    form: {
      recipient: {
        id: recipientId,
      },
      message: {
        text: msg,
      },
    },
  };
  fbReq(opts, (err, resp, data) => {
    if (cb) {
      cb(err || data.error && data.error.message, data);
    }
  });
};

const fbMessageWith2Buttons = (recipientId, msg, val1, val2, cb) => {
  const opts = {
    form: {
      recipient: {
        id: recipientId,
      },
      message: {
        'attachment': {
          'type': 'template',
          'payload': {
            'template_type': 'button',
            'text': msg,
            'buttons': [
            {
              'type': 'postback',
              'title': val1,
              'payload': val1
            },
            {
              'type': 'postback',
              'title': val2,
              'payload': val2
            }

            ]
          }
        },
      },
    },
  };
  fbReq(opts, (err, resp, data) => {
    if (cb) {
      cb(err || data.error && data.error.message, data);
    }
  });
};

const fbMessageQuickReply = (recipientId, msg, cb) => {
  const opts = {
    form: {
      recipient: {
        id: recipientId,
      },
      "message":{
        "text": msg,
        "quick_replies":[
        {
          "content_type":"text",
          "title":"Yes",
          "payload":"yes"
        },
        {
          "content_type":"text",
          "title":"No",
          "payload":"no"
        }
        ]
      },
    },
  };
  fbReq(opts, (err, resp, data) => {
    if (cb) {
      cb(err || data.error && data.error.message, data);
    }
  });
};
}