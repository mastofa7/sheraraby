/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Interface defining the contract for any Payment Gateway Provider (e.g., Paymob, Stripe, etc.)
 * This provides a scalable, decoupled architecture for managing user plans and subscriptions.
 */
export interface PaymentProvider {
  name: string;
  
  /**
   * Create a checkout transaction or session for subscription upgrade.
   * Returns a URL for redirecting the customer.
   */
  createCheckoutSession(params: {
    userId: string;
    email: string;
    planId: string;
    amountInCents: number;
    planName: string;
    appUrl: string;
  }): Promise<{ url: string; sessionId: string }>;

  /**
   * Retrieve and verify a transaction status to securely complete subscriptions.
   */
  verifySession(sessionId: string, userId: string): Promise<{
    success: boolean;
    planId: string;
    message: string;
    transactionId?: string;
  }>;

  /**
   * Handle incoming webhooks from the payment gateway.
   */
  handleWebhook(
    payload: any,
    headers: any,
    rawBody?: Buffer
  ): Promise<{
    processed: boolean;
    userId?: string;
    planId?: string;
    status?: string;
    eventType?: string;
  }>;
}

/**
 * PaymobService - Concrete implementation of PaymentProvider for Paymob Gateway
 * Ready for future production integration with Paymob's 3-step authentication, order creation,
 * and payment key generation flow.
 */
export class PaymobService implements PaymentProvider {
  name = 'paymob';

  /**
   * Future Integration steps for Paymob:
   * 1. Auth Token Request: POST to https://accept.paymob.com/api/auth/tokens (using API key)
   * 2. Order Registration: POST to https://accept.paymob.com/api/ecommerce/orders (with auth token)
   * 3. Payment Key Generation: POST to https://accept.paymob.com/api/acceptance/payment_keys (using order id and integration id)
   * 4. Redirect to: https://accept.paymob.com/api/acceptance/iframes/{{iframe_id}}?payment_token={{payment_key}}
   */
  async createCheckoutSession(params: {
    userId: string;
    email: string;
    planId: string;
    amountInCents: number;
    planName: string;
    appUrl: string;
  }): Promise<{ url: string; sessionId: string }> {
    console.log(`[PaymobService] Preparing checkout for User: ${params.userId}, Plan: ${params.planId}`);
    
    // Create a unique temporary transaction ID
    const sessionId = `paymob_temp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    // Generate a placeholder URL that directs to our custom future checkout page or displays "Coming Soon"
    const redirectUrl = `${params.appUrl}/?payment_provider=paymob&payment_status=pending&session_id=${sessionId}&plan_id=${params.planId}`;
    
    return {
      url: redirectUrl,
      sessionId
    };
  }

  async verifySession(sessionId: string, userId: string): Promise<{
    success: boolean;
    planId: string;
    message: string;
    transactionId?: string;
  }> {
    console.log(`[PaymobService] Verifying payment for Session: ${sessionId}, User: ${userId}`);
    
    // In our placeholder service, we can simulate successful response if requested or keep it pending
    // As per the requirement, we show: "سيتم تفعيل الدفع قريباً عبر Paymob."
    return {
      success: false,
      planId: 'free',
      message: 'سيتم تفعيل الدفع قريباً عبر Paymob.',
      transactionId: sessionId
    };
  }

  async handleWebhook(
    payload: any,
    headers: any,
    rawBody?: Buffer
  ): Promise<{
    processed: boolean;
    userId?: string;
    planId?: string;
    status?: string;
    eventType?: string;
  }> {
    console.log('[PaymobService] Webhook received', payload);
    
    // Placeholder webhook parsing for Paymob structure
    // Paymob sends transaction status updates via POST to the webhook URL configured in accept dashboard.
    const isSuccess = payload?.obj?.success === true;
    const userId = payload?.obj?.order?.shipping_data?.extra_description; // payload example storage
    const planId = payload?.obj?.order?.items?.[0]?.name;
    
    return {
      processed: true,
      userId,
      planId,
      status: isSuccess ? 'active' : 'failed',
      eventType: payload?.type || 'TRANSACTION_STATUS'
    };
  }
}

/**
 * PaymentManager - Factory class to handle active payment provider configuration
 */
export class PaymentManager {
  private static activeProvider: PaymentProvider = new PaymobService();

  static getProvider(): PaymentProvider {
    return this.activeProvider;
  }

  static setProvider(provider: PaymentProvider) {
    this.activeProvider = provider;
    console.log(`[PaymentManager] Switched active provider to: ${provider.name}`);
  }
}
