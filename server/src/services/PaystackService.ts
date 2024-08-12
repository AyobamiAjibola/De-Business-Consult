import settings from "../config/settings";
import axiosClient from '../services/api/axiosClient';

class PaystackService {
    private apiKey: String

    constructor() {
      this.apiKey = settings.paystack.apiKey;
    }
  
    async verifyBankAccount(accountNumber: any, bankCode: any) {
      const bvnVerifyUrl = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`;
  
      const config = {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      };
  
      try {
        const response = await axiosClient.get(bvnVerifyUrl, config);
        return response.data;
      } catch (error: any) {
        throw new Error(error.response.data.message);
      }
    }

    async sendMoneyToAccount(accountNumber: any, bankCode: any, amountInKobo: any, narration: string) {
        const transferUrl = 'https://api.paystack.co/transfer';
      
        const transferData = {
          source: 'balance',
          amount: amountInKobo,
          recipient: accountNumber,
          bank_code: bankCode,
          reason: narration,
        };
      
        const config = {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        };
      
        try {
          const response = await axiosClient.post(transferUrl, transferData, config);
          return response.data;
        } catch (error: any) {
          throw new Error(error.response.data.message);
        }
      }
}

export default PaystackService;
