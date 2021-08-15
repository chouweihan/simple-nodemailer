require("dotenv").config();
var cors = require("cors");
const express = require("express");
const app = express();
const nodemailer = require("nodemailer");
const validator = require("email-validator");
const { StatusCodes } = require("http-status-codes");

app.use(express.json());
app.use(
  cors({
    origin: process.env.ORIGIN_URL,
    methods: ["GET", "POST"],
  })
);

app.post("/send-mail", async (req, res) => {
  let errCode;
  try {
    const { email, subject, body } = req.body;

    const { valid, message } = validate(email, subject, body);
    if (!valid) {
      errCode = StatusCodes.BAD_REQUEST;
      throw new Error(message);
    }

    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        type: "OAuth2",
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
        clientId: process.env.OAUTH_CLIENTID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN,
        expires: 3599,
        accessToken: process.env.OAUTH_ACCESS_TOKEN,
      },
    });

    const mailData = {
      from: email,
      to: process.env.DEST_EMAIL,
      subject: `${email}: ${subject}`,
      html: `<div>${body}</div>`,
    };

    let info = await transporter.sendMail(mailData);
    console.log("Message sent: %s", info.messageId);
    const { messageTime, messageSize } = info;

    return res
      .status(StatusCodes.OK)
      .send({ success: true, info: { messageTime, messageSize } });
  } catch (error) {
    const { message } = error;
    return res.status(errCode ? errCode : StatusCodes.UNAUTHORIZED).send({
      success: false,
      err: message,
    });
  }
});

const start = async () => {
  app.listen(process.env.PORT || 5000, () => {
    console.log("app started");
  });
};

const validate = function (email, subject, body) {
  let valid = true;
  let message = "";
  if (!email || !subject || !body) {
    valid = false;
    message = "Email, Subject and Message are required";
  }

  if (!validator.validate(email)) {
    valid = false;
    message = "Please check if your Email is correct";
  }

  if (subject.length > 70) {
    valid = false;
    message = "Subject can't be more than 70 characters";
  }

  return { valid, message };
};

start();
