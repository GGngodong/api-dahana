import admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendVerificationEmail(email) {
    const actionCodeSettings = {
        url: `${process.env.APP_URL}/api/users/verify-email`,
        handleCodeInApp: false,
    };

    // 1) Generate the OOB link via Admin SDK
    const link = await admin
        .auth()
        .generateEmailVerificationLink(email, actionCodeSettings);

    // 2) Send with SendGrid
    const msg = {
        to: email,
        from: process.env.EMAIL_FROM,
        subject: 'Please verify your email',
        html: `
      <p>Hi there,</p>
      <p>Please <a href="${link}">click here</a> to verify your email address. This link will expire in a few hours.</p>
      <p>If you didn’t sign up, just ignore this email.</p>
    `,
    };

    await sgMail.send(msg);
}
