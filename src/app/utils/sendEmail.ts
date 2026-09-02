import path from 'path';
import ejs from 'ejs';
import nodemailer from 'nodemailer';

interface ISendWelcomeOtpEmail {
  to: string;
  name: string;
  role: string;
  otpCode: string;
}

export const sendWelcomeOtpEmail = async ({
  to,
  name,
  role,
  otpCode,
}: ISendWelcomeOtpEmail) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    },
  });

  const templatePath = path.join(__dirname, '../views/userWelcomeTemplate.ejs');

  const html = await ejs.renderFile(templatePath, {
    name,
    role,
    otpCode,
  });

  const mailOptions = {
    from: `Smart Parking <${process.env.SENDER_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject: 'Welcome to Smart Parking - Your Verification Code',
    html,
  };

  const response = await transporter.sendMail(mailOptions);
  console.log(`📧 Verification email sent successfully to ${to} (MessageID: ${response.messageId})`);

  return response;
};
