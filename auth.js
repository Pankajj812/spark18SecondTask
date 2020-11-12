const readline = require("readline");
const { base64decode } = require("nodejs-base64");
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
const fs = require("fs");
const http = require('http');

const { google } = require("googleapis");
const gmail = google.gmail("v1");

const { OAuth2Client } = require("google-auth-library");
const { fstat } = require("fs");

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];

const getAcessToken = async () => {
  //authentication
  const clientSecret = "w1CoIJqJVHU8323rbAKhQozu";
  const clientId =
    "520246189983-s1p1a4onk05a6iek70jq3489cf43iset.apps.googleusercontent.com";
  const redirectUrl = "http://localhost:3000/code.html";
  const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUrl);

  //get new token
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("Authorize this app ", authUrl);

  rl.question("Enter code and Subject seperated by colon ", (input) => {
    let code = null;
    let subject = null;
    if (input.includes(":")) {
      code = input.split(":")[0];
      subject = input.split(":")[1];
    } else {
      console.log("Provide code and subject in this format <code>:<subject>");
      return;
    }

    rl.close();

    oauth2Client.getToken(code, async (err, token) => {
      if (err) {
        console.log("Error while trying to retrieving access token", err);
        return;
      }
      oauth2Client.credentials = token;
      console.log("Token is ", token);
      //Once we get Access Token we can call gmail Apis to retrieve mails
      const response = await gmail.users.messages.list({
        auth: oauth2Client,
        userId: "me",
        q: `subject:${subject}`,
      });
      // display the result
      console.log(response.data);
      if (
        "messages" in response.data &&
        response.data.messages &&
        response.data.messages.length > 0 &&
        "id" in response.data.messages[0] &&
        response.data.messages[0].id
      ) {
        let message = await gmail.users.messages.get({
          auth: oauth2Client,
          userId: "me",
          id: response.data.messages[0].id,
        });

        console.log("Message", message);
        if (
          message &&
          "data" in message &&
          message.data &&
          "payload" in message.data &&
          message.data.payload &&
          "body" in message.data.payload &&
          message.data.payload.body
        ) {
          let decoded = base64decode(message.data.payload.body.data);
          console.log("Body", decoded);
          //create index.html file and write decoded email text to html file
          // let writeStream = fs.createWriteStream(__dirname/"message.html");
          // writeStream.write(decoded);
          // //Render HTML file in browser
          // fs.readFile(__dirname/"message.html", function (err, html) {
          //   if (err) throw err;
          //   http
          //     .createServer(function (request, response) {
          //       response.writeHeader(200, { "Content-Type": "text/html" });
          //       response.write(html);
          //       response.end();
          //     })
          //     .listen(8080);
          // });
        } else {
          console.log("Error in getting message");
        }
      }
    });
  });
};

getAcessToken();
