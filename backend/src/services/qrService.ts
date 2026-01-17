import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export interface QrData {
  orderId: string;
  type: 'seller_pickup' | 'courier_delivery';
  code: string;
  timestamp: number;
}

export interface QrValidationResult {
  valid: boolean;
  data?: QrData;
  error?: string;
}

// QR code max age: 24 hours
const QR_MAX_AGE_MS = 24 * 60 * 60 * 1000;

class QrService {
  async generateSellerQr(orderId: string): Promise<{ qrCode: string; qrData: QrData; code: string }> {
    const code = uuidv4().substring(0, 8).toUpperCase();
    
    const qrData: QrData = {
      orderId,
      type: 'seller_pickup',
      code,
      timestamp: Date.now(),
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return { qrCode, qrData, code };
  }

  async generateCourierQr(orderId: string): Promise<{ qrCode: string; qrData: QrData; code: string }> {
    const code = uuidv4().substring(0, 8).toUpperCase();
    
    const qrData: QrData = {
      orderId,
      type: 'courier_delivery',
      code,
      timestamp: Date.now(),
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return { qrCode, qrData, code };
  }

  /**
   * Parse QR code data from various formats:
   * - JSON string
   * - Base64 encoded JSON
   * - Data URL (data:image/png;base64,...)
   * - Object (already parsed)
   */
  parseQrCode(input: string | object): QrData | null {
    try {
      // If already an object, validate and return
      if (typeof input === 'object' && input !== null) {
        return this.validateQrDataStructure(input as QrData);
      }

      let jsonString = input as string;

      // Handle data URL format (extract base64 content)
      if (jsonString.startsWith('data:')) {
        // This is an image data URL, not the actual QR data
        // The QR data should be extracted by scanning the image
        console.log('Received data URL instead of QR data');
        return null;
      }

      // Handle base64 encoded JSON
      if (this.isBase64(jsonString)) {
        try {
          jsonString = Buffer.from(jsonString, 'base64').toString('utf-8');
        } catch {
          // Not base64, try as plain JSON
        }
      }

      // Parse JSON
      const data = JSON.parse(jsonString) as QrData;
      return this.validateQrDataStructure(data);
    } catch (error) {
      console.error('QR parse error:', error);
      return null;
    }
  }

  /**
   * Validate QR data structure has required fields
   */
  private validateQrDataStructure(data: QrData): QrData | null {
    if (!data.orderId || typeof data.orderId !== 'string') {
      return null;
    }
    if (!data.type || !['seller_pickup', 'courier_delivery'].includes(data.type)) {
      return null;
    }
    if (!data.code || typeof data.code !== 'string') {
      return null;
    }
    if (!data.timestamp || typeof data.timestamp !== 'number') {
      return null;
    }
    return data;
  }

  /**
   * Check if string is base64 encoded
   */
  private isBase64(str: string): boolean {
    if (!str || str.length === 0) return false;
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    return base64Regex.test(str) && str.length % 4 === 0;
  }

  /**
   * Validate QR code with detailed error messages
   */
  validateQrCode(
    qrData: QrData,
    expectedOrderId: string,
    expectedType: 'seller_pickup' | 'courier_delivery'
  ): QrValidationResult {
    // Check order ID match
    if (qrData.orderId !== expectedOrderId) {
      return {
        valid: false,
        error: 'QR code does not match this order',
      };
    }

    // Check type match
    if (qrData.type !== expectedType) {
      return {
        valid: false,
        error: `Invalid QR type. Expected ${expectedType}, got ${qrData.type}`,
      };
    }

    // Check expiration (24 hours)
    const age = Date.now() - qrData.timestamp;
    if (age > QR_MAX_AGE_MS) {
      const hoursAgo = Math.floor(age / (60 * 60 * 1000));
      return {
        valid: false,
        error: `QR code has expired (created ${hoursAgo} hours ago, max 24 hours)`,
      };
    }

    return {
      valid: true,
      data: qrData,
    };
  }

  /**
   * Get QR data as JSON string for client to use
   */
  getQrDataString(qrData: QrData): string {
    return JSON.stringify(qrData);
  }
}

export const qrService = new QrService();
export default qrService;
