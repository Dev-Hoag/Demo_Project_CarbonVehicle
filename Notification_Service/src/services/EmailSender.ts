import nodemailer, { Transporter } from "nodemailer";
import logger from "../config/logger";
import { EmailMessage, EmailConfig, IEmailSender } from "../types/notification";

export class EmailSender implements IEmailSender {
  private transporter: Transporter;
  private config: EmailConfig;

  constructor() {
    this.config = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER || "",
        pass: process.env.SMTP_PASSWORD || "",
      },
      from: process.env.EMAIL_FROM || "noreply@carboncredit.com",
    };

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: this.config.auth,
    });

    logger.info("Email sender initialized", {
      host: this.config.host,
      port: this.config.port,
      from: this.config.from,
    });
  }

  async send(email: EmailMessage): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.config.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text || this.stripHtml(email.html),
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info("Email sent successfully", {
        to: email.to,
        subject: email.subject,
        messageId: info.messageId,
      });

      return true;
    } catch (error) {
      logger.error("Error sending email", {
        error,
        to: email.to,
        subject: email.subject,
      });
      return false;
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info("SMTP connection verified successfully");
      return true;
    } catch (error) {
      logger.error("SMTP connection verification failed", { error });
      return false;
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  getConfig(): EmailConfig {
    return { ...this.config };
  }
}

export default new EmailSender();
