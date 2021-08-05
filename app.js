require("dotenv").config();
const express = require("express");
const app = express();
const nodemailer = require("nodemailer");
const { StatusCodes } = require("http-status-codes");

app.use(express.json());

app.post("/send-mail", async (req, res) => {
  const { email, title, body } = req.body;

  try {
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
      subject: `${email}: ${title}`,
      html: `<div>${body}</div>`,
    };

    let info = await transporter.sendMail(mailData);

    console.log("Message sent: %s", info.messageId);

    const { messageTime, messageSize } = info;

    return res
      .status(StatusCodes.OK)
      .send({ success: true, info: { messageTime, messageSize } });
  } catch (error) {
    return res.status(StatusCodes.BAD_REQUEST).send({
      success: false,
      error,
    });
  }
});

const start = async () => {
  app.listen(5000, () => {
    console.log("server listening on 5000");
  });
};

start();
