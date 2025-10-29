import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService, type MailDataRequired } from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private sg: MailService;

  constructor(private readonly config: ConfigService) {
    this.sg = new MailService();
    const key = this.config.get<string>('SENDGRID_API_KEY');
    if (key) this.sg.setApiKey(key);
    else console.warn('[EmailService] SENDGRID_API_KEY is missing – emails will fail.');
  }

  private fromEmail() {
    return this.config.get<string>('SENDGRID_FROM_EMAIL')!;
  }
  private replyTo() {
    return this.config.get<string>('SENDGRID_REPLY_TO') || this.fromEmail();
  }
  private appUrl() {
    return this.config.get<string>('APP_URL', 'http://localhost:3000');
  }

  async sendVerificationEmail(to: string, token: string) {
    const url = `${this.appUrl()}/api/auth/verify?token=${token}`;

    const msg: MailDataRequired = {
      to,
      from: this.fromEmail(),
      replyTo: this.replyTo(),
      subject: 'Verify your Carbon Credit Marketplace account',
     
      text:
`Please verify your email.

Verification link:
${url}

If you did not request this, please ignore this email.`,

     
      html:
        `<p>Please verify your email by clicking <a href="${url}">this link</a>.</p>
         <p>If the button/link doesn’t show, copy and paste this URL:</p>
         <p><code>${url}</code></p>
         <p>If you did not request this, please ignore this email.</p>`,

      
      trackingSettings: {
        clickTracking: { enable: false, enableText: false },
      },
    };

    await this.sg.send(msg);
  }

  async sendResetEmail(to: string, token: string) {
    const url = `${this.appUrl()}/api/auth/reset-password?token=${token}`;

    const msg: MailDataRequired = {
      to,
      from: this.fromEmail(),
      replyTo: this.replyTo(),
      subject: 'Reset your password - Carbon Credit Marketplace',
      text:
`You requested a password reset.

Reset link:
${url}

If you did not request this, please ignore this email.`,

      html:
        `<p>You requested a password reset. Click <a href="${url}">here</a> to reset your password.</p>
         <p>If the link doesn’t appear, copy and paste this URL:</p>
         <p><code>${url}</code></p>
         <p>If you did not request this, please ignore this email.</p>`,

      trackingSettings: {
        clickTracking: { enable: false, enableText: false },
      },
    };

    await this.sg.send(msg);
  }
}
