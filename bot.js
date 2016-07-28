'use strict';

const express = require('express'); //to set up server
const bodyParser = require('body-parser'); // to parse json request
const request = require('request'); //send request
var nlp = require('./nlp.js'); //to filter intent
// Webserver parameter
const PORT = process.env.PORT || 8445;

// Messenger API parameters
const FB_PAGE_ID = process.env.FB_PAGE_ID;
if (!FB_PAGE_ID) {
  throw new Error('missing FB_PAGE_ID');
}
const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
if (!FB_PAGE_TOKEN) {
  throw new Error('missing FB_PAGE_TOKEN');
}
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

// set up server
const app = express();
app.set('port', PORT);
app.listen(app.get('port'));
app.use(bodyParser.json());

//set up webhook
app.get('/fb', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
    console.log("Validating webhook");
  res.status(200).send(req.query['hub.challenge']);
} else {
  console.error("Failed validation. Make sure the validation tokens match.");
  res.sendStatus(403);          
}  
});

//Create Session
const sessions = {};
const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: fbid, context: {}, text: ''};
  }
  return sessionId;
};

//function to merge context, session
var merge = (sender, msg, sessionId) => {
  console.log("Merging ...");
  var intent = nlp.getIntent(msg);
  console.log("Intent is " + intent);
  if (intent != null)
    sessions[sessionId].intent = intent;

  sessions[sessionId].text = msg;
};

//function to execute actions
var execute = (sender, msg , sessionId ) => {

  console.log("Executing ...");
  console.log(sessions[sessionId]);

  // If there is a module 
  switch(sessions[sessionId].intent){
    case 'pizza':
    fbMessageWith2Buttons(sender, "Which flavour do you want?", "Hawaiian", "Meatlover", function(err, data) {
      if (err) {
        throw err;
      }
      else {
        console.log(data);
      }
    })
    break;


  }
}


// Messenger Send API

const fbReq = request.defaults({
  uri: 'https://graph.facebook.com/me/messages',
  method: 'POST',
  json: true,
  qs: { access_token: FB_PAGE_TOKEN },
  headers: {'Content-Type': 'application/json'},
});

//function to send message
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

//function to send message with 2 buttons
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

// Function to send message with yes/no reply
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

//receive message
app.post('/fb', function (req, res) {
  var data = req.body;
  var message_event = data.entry[0].messaging;
  const sessionId = findOrCreateSession(sender);

  for (var i=0; i<message_event.length; i++) {
    var event = message_event[i];
    console.log(event);
    var sender = event.sender.id;
    // console.log("sender is " + sender);
    // console.log("message is " + message);

    // For quick reply to yes/no question
    if (event.message && event.message.quick_reply){
      console.log('ere ' + sessions[sessionId].intent);
      switch(sessions[sessionId].intent) {
        case 'pizza':
        if (event.message.quick_reply.payload == 'no') {
          fbMessage(sender, "Ok sure", function(err, data) {
            delete sessions[sessionId];
          });
        }
        else {
          fbMessage(sender, "Very nice serving you!", function(err, data) {
            delete sessions[sessionId];
          });
        }
        break;
      }
    }
    // For reply to message with buttons
    else if (event.postback) {
      switch(sessions[sessionId].intent) {
        case 'pizza':
        if (event.postback.payload == 'Hawaiian') {
          console.log("Hawaiian chosen");
          sessions[sessionId].flavour = 'Hawaiian';
          fbMessageWith2Buttons(sender, "Which size?", "Medium", "Large");
        }
        else if (event.postback.payload == 'Meatlover') {
          console.log("Meatlover chosen");
          sessions[sessionId].flavour = 'Meatlover';
          fbMessageWith2Buttons(sender, "Which size?", "Medium", "Large");
        }
        else if (event.postback.payload == 'Medium'){
          sessions[sessionId].size = 'Medium';
          fbMessageQuickReply(sender, "Your final order is a " + sessions[sessionId].size + " " + sessions[sessionId].flavour + " pizza")
        }
        else if (event.postback.payload == 'Large') {
          sessions[sessionId].size = 'Large';
          fbMessageQuickReply(sender, "Your final order is a " + sessions[sessionId].size + " " + sessions[sessionId].flavour + " pizza")
        }
      }
    }
    // For reply to normal message
    else if (event.message && event.message.text && !event.message.is_echo && !event.message.quick_reply && !event.postback) {

      var message = event.message.text.toUpperCase();

      merge(sender, message, sessionId);
      execute(sender, message, sessionId);

    }
    res.sendStatus(200);

  }
});
