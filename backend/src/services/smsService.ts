import { config } from '../config';

interface SmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class SmsService {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  private async getToken(): Promise<string | null> {
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    // Check if SMS credentials are configured
    if (!config.sms.eskizEmail || !config.sms.eskizPassword) {
      console.log('[SMS] Credentials not configured - SMS disabled');
      return null;
    }

    try {
      const response = await fetch(`${config.sms.eskizBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: config.sms.eskizEmail,
          password: config.sms.eskizPassword,
        }),
      });

      const data = await response.json() as { data?: { token: string } };
      
      if (data.data?.token) {
        this.token = data.data.token;
        this.tokenExpiry = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000);
        return this.token;
      }

      console.log('[SMS] Failed to get token - SMS disabled');
      return null;
    } catch (error) {
      console.error('[SMS] Auth error (SMS disabled):', error);
      return null;
    }
  }

  async sendOtp(phone: string, code: string): Promise<SmsResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.log(`[SMS] Skipped OTP to ${phone} - SMS disabled`);
        return { success: true, messageId: 'mock-disabled' };
      }
      const message = `GoGoMarket: Ваш код подтверждения: ${code}. Не сообщайте его никому.`;

      const response = await fetch(`${config.sms.eskizBaseUrl}/message/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mobile_phone: phone.replace('+', ''),
          message,
          from: '4546',
        }),
      });

      const data = await response.json() as { id?: string; status?: string };

      if (data.id) {
        return { success: true, messageId: data.id };
      }

      return { success: false, error: 'Failed to send SMS' };
    } catch (error) {
      console.error('SMS send error:', error);
      return { success: false, error: 'SMS service unavailable' };
    }
  }

  async sendDeliveryCode(phone: string, code: string, orderNumber: string): Promise<SmsResponse> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.log(`[SMS] Skipped delivery code to ${phone} for order ${orderNumber} - SMS disabled`);
        return { success: true, messageId: 'mock-disabled' };
      }
      const message = `GoGoMarket: Код для получения заказа ${orderNumber}: ${code}`;

      const response = await fetch(`${config.sms.eskizBaseUrl}/message/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          mobile_phone: phone.replace('+', ''),
          message,
          from: '4546',
        }),
      });

      const data = await response.json() as { id?: string };

      if (data.id) {
        return { success: true, messageId: data.id };
      }

      return { success: false, error: 'Failed to send SMS' };
    } catch (error) {
      console.error('SMS send error:', error);
      return { success: false, error: 'SMS service unavailable' };
    }
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  generateDeliveryCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}

export const smsService = new SmsService();
export default smsService;
