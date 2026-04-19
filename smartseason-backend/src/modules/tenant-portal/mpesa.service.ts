import { Injectable, Logger } from '@nestjs/common';
import * as https from 'https';

@Injectable()
export class MpesaService {
  private readonly logger = new Logger(MpesaService.name);

  private get consumerKey() { return process.env.MPESA_CONSUMER_KEY || ''; }
  private get consumerSecret() { return process.env.MPESA_CONSUMER_SECRET || ''; }
  private get passkey() { return process.env.MPESA_PASSKEY || ''; }
  private get shortcode() { return process.env.MPESA_SHORTCODE || '174379'; }
  private get callbackUrl() { return process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/tenant-portal/mpesa/callback'; }
  private get isSandbox() { return process.env.MPESA_ENVIRONMENT !== 'production'; }

  private get baseUrl() {
    return this.isSandbox
      ? 'sandbox.safaricom.co.ke'
      : 'api.safaricom.co.ke';
  }

  /** Format phone to 254XXXXXXXXX */
  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) return '254' + cleaned.slice(1);
    if (cleaned.startsWith('254')) return cleaned;
    if (cleaned.startsWith('7') || cleaned.startsWith('1')) return '254' + cleaned;
    return cleaned;
  }

  private httpsRequest(options: https.RequestOptions, body?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(body);
      req.end();
    });
  }

  async getAccessToken(): Promise<string> {
    const credentials = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString('base64');
    const result = await this.httpsRequest({
      hostname: this.baseUrl,
      path: '/oauth/v1/generate?grant_type=client_credentials',
      method: 'GET',
      headers: { Authorization: `Basic ${credentials}` },
    });
    if (!result.access_token) {
      this.logger.error('M-Pesa token error', result);
      throw new Error('Failed to get M-Pesa access token');
    }
    return result.access_token;
  }

  async stkPush(phone: string, amount: number, accountRef: string, description: string) {
    const accessToken = await this.getAccessToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, 14);
    const password = Buffer.from(`${this.shortcode}${this.passkey}${timestamp}`).toString('base64');
    const formattedPhone = this.formatPhone(phone);

    const body = JSON.stringify({
      BusinessShortCode: this.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: formattedPhone,
      PartyB: this.shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: this.callbackUrl,
      AccountReference: accountRef.slice(0, 20),
      TransactionDesc: description.slice(0, 13),
    });

    const result = await this.httpsRequest(
      {
        hostname: this.baseUrl,
        path: '/mpesa/stkpush/v1/processrequest',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      body,
    );

    this.logger.log(`STK Push result: ${JSON.stringify(result)}`);
    return result;
  }
}
