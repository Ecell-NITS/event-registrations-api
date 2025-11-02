/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import nodemailer from 'nodemailer';

if (!process.env.EMAIL_ECELL || !process.env.EMAIL_PWD_ECELL) {
  throw new Error('Email credentials are missing in environment variables');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ECELL,
    pass: process.env.EMAIL_PWD_ECELL,
  },
});

const sendEmail = async (to: string, subject: string, text: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"E-Cell NIT Silchar" <${process.env.EMAIL_ECELL}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent:', info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export default sendEmail;
