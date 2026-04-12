require('dotenv').config();
const { MailtrapClient } = require("mailtrap");

const TOKEN = process.env.MAILTRAP_API_TOKEN;

const client = new MailtrapClient({ token: TOKEN });

const sender = {
  email: "hello@demomailtrap.com",
  name: "Mailtrap Test",
};

const recipients = [
  {
    email: "test@example.com",
  }
];

client
  .send({
    from: sender,
    to: recipients,
    subject: "You are awesome!",
    text: "Congrats for sending test email with Mailtrap!",
    category: "Integration Test",
  })
  .then(console.log, console.error);
