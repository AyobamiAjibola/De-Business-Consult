import twilio from "twilio";

interface IProps {
  to: string;
  body: string;
}

class TwilioService {
  private client: twilio.Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    this.client = twilio(accountSid, authToken);
  }
  // const whatsApp = value.whatsAppNumber.replace(/^\+/, "");
  async sendWhatsAppMessage(data: IProps): Promise<void> {
    const { to, body } = data
    try {
      await this.client.messages.create({
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        body,
        to: `whatsapp:+${to}`,
      });
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      throw error;
    }
  }

  async sendSMS(data: IProps): Promise<void> {
    const { to, body } = data;
    const phone = to.replace(/^\+/, "")
    try {
      await this.client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        body,
        to: `+${phone}`,
      });
    } catch (error) {
      console.error(`Error sending sms message:`, error);
      throw error;
    }
  }
}

export default TwilioService;
