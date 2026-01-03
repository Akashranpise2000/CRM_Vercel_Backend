const twilio = require('twilio');

class SMSService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
  }

  initialize(accountSid, authToken, phoneNumber) {
    if (!accountSid || !authToken || !phoneNumber) {
      console.warn('SMS service not initialized: Missing Twilio credentials');
      return false;
    }

    try {
      this.client = twilio(accountSid, authToken);
      this.phoneNumber = phoneNumber;
      this.isInitialized = true;
      console.log('SMS service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize SMS service:', error.message);
      return false;
    }
  }

  async sendSMS(to, message) {
    if (!this.isInitialized || !this.client) {
      console.warn('SMS service not initialized');
      return { success: false, error: 'SMS service not initialized' };
    }

    try {
      const result = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: to
      });

      console.log('SMS sent successfully:', result.sid);
      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('Failed to send SMS:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendExpenseNotification(recipientPhoneNumber, expenseDetails) {
    const message = `New expense added successfully. Title: ${expenseDetails.title}, Amount: $${expenseDetails.amount}, Category: ${expenseDetails.category}`;

    return await this.sendSMS(recipientPhoneNumber, message);
  }

  isReady() {
    return this.isInitialized;
  }
}

module.exports = new SMSService();