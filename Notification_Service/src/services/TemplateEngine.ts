import logger from "../config/logger";
import templateRepository from "../repositories/TemplateRepository";
import {
  Template,
  Channel,
  ITemplateEngine,
  TemplateNotFoundError,
} from "../types/notification";

export class TemplateEngine implements ITemplateEngine {
  async render(content: string, data: Record<string, any>): Promise<string> {
    let rendered = content;

    // Replace all placeholders {{key}} with actual values
    for (const [key, value] of Object.entries(data)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      rendered = rendered.replace(placeholder, String(value));
    }

    // Check for any remaining unreplaced placeholders
    const remainingPlaceholders = rendered.match(/{{[^}]+}}/g);
    if (remainingPlaceholders) {
      logger.warn("Template has unreplaced placeholders", {
        placeholders: remainingPlaceholders,
        providedData: Object.keys(data),
      });
    }

    return rendered;
  }

  async getTemplate(eventType: string, channel: Channel): Promise<Template> {
    const template = await templateRepository.findByEventAndChannel(
      eventType,
      channel
    );

    if (!template) {
      // Try to find default template
      const defaultTemplate = await templateRepository.findByEventAndChannel(
        "Default",
        channel
      );

      if (!defaultTemplate) {
        throw new TemplateNotFoundError(eventType, channel);
      }

      logger.info("Using default template", { eventType, channel });
      return defaultTemplate;
    }

    return template;
  }

  async renderTemplate(
    eventType: string,
    channel: Channel,
    data: Record<string, any>
  ): Promise<{ subject?: string; content: string }> {
    const template = await this.getTemplate(eventType, channel);

    const content = await this.render(template.content, data);
    const subject = template.subject
      ? await this.render(template.subject, data)
      : undefined;

    logger.info("Template rendered", {
      eventType,
      channel,
      templateId: template.id,
    });

    return { subject, content };
  }

  extractPlaceholders(content: string): string[] {
    const matches = content.match(/{{([^}]+)}}/g);
    if (!matches) {
      return [];
    }

    return matches.map((match) => match.replace(/{{|}}/g, "").trim());
  }

  validateData(
    template: Template,
    data: Record<string, any>
  ): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const placeholder of template.placeholders) {
      if (!(placeholder in data)) {
        missing.push(placeholder);
      }
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  }
}

export default new TemplateEngine();
