import path from 'path';
import ejs from 'ejs';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY as string);

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
  const templatePath = path.join(__dirname, '../views/userWelcomeTemplate.ejs');

  const html = await ejs.renderFile(templatePath, {
    name,
    role,
    otpCode,
  });

  const response = await resend.emails.send({
    from: `Smart Parking <${process.env.SENDER_EMAIL || 'onboarding@resend.dev'}>`,
    to: [to],
    subject: 'Welcome to Smart Parking - Your Verification Code',
    html,
  });

  return response;
};
