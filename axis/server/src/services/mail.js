import nodemailer from 'nodemailer';
import { config } from '../config.js';

let transporter;

function getTransporter() {
  if (!config.smtp.host || !config.smtp.user || !config.smtp.pass || !config.smtp.to) return null;
  transporter ||= nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
  return transporter;
}

const label = type => type[0].toUpperCase() + type.slice(1);

export async function notifyFormSubmission(type, data) {
  const mailer = getTransporter();
  if (!mailer) return false;

  const details = Object.entries(data)
    .filter(([key, value]) => key !== 'website' && value !== undefined && value !== '')
    .map(([key, value]) => `${label(key)}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('\n');

  await mailer.sendMail({
    from: config.smtp.from,
    to: config.smtp.to,
    replyTo: data.email || undefined,
    subject: `AXIS ${label(type)} submission`,
    text: `A new ${type} submission was received from the AXIS website.\n\n${details}`,
  });

  if (data.email) {
    await mailer.sendMail({
      from: config.smtp.from,
      to: data.email,
      subject: `We received your message - AXIS`,
      text: `Thank you for contacting AXIS. We received your ${type} request and will reply within one working day.`,
    });
  }

  return true;
}
