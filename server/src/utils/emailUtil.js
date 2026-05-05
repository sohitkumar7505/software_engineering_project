import { Resend } from 'resend';

export const sendEmail = async (options) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY is not defined in .env. Skipping email delivery.');
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Note: If you have a verified domain on Resend, replace the 'from' address below.
    // The onboarding@resend.dev address can only send emails to the address associated with your Resend account.
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Travel Without Tension <onboarding@resend.dev>',
      to: options.email,
      subject: options.subject,
      text: options.message,
    });

    if (error) {
      console.error('Resend API error:', error);
      return;
    }

    console.log('Email sent successfully via Resend:', data);
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};
