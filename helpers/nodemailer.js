const nodemailer = require("nodemailer");
const tempEmail = process.env.TEMP_EMAIL;
const tempPassword = process.env.TEMP_PASSWORD;
const kirimEmail = (dataEmail) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.email",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: tempEmail, // generated ethereal user
      pass: tempPassword, // generated ethereal password
    },
  });
};
