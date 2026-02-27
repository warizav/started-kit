import { Injectable, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { AuthService } from '../auth/auth.service';

const PLANS = {
  pro: {
    name: 'Pro',
    price: 2900, // $29/month in cents
    priceId: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
    limit: 10000,
  },
  business: {
    name: 'Business',
    price: 9900, // $99/month in cents
    priceId: process.env.STRIPE_PRICE_BUSINESS || 'price_business_placeholder',
    limit: 'Unlimited',
  },
};

export { PLANS };

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(private readonly authService: AuthService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
      apiVersion: '2026-02-25.clover',
    });
  }

  async createCheckoutSession(
    email: string,
    plan: 'pro' | 'business',
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string }> {
    const planConfig = PLANS[plan];
    if (!planConfig) throw new BadRequestException('Invalid plan');

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { email, plan },
    });

    return { url: session.url! };
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.metadata?.email;
      const plan = session.metadata?.plan as 'pro' | 'business';
      const customerId = session.customer as string;

      if (email && plan && customerId) {
        this.authService.upgradePlan(email, plan, customerId);
      }
    }
  }

  getPlans() {
    return {
      free: { name: 'Free', price: 0, limit: 100, features: ['100 API calls/month', 'Community support'] },
      pro: { name: 'Pro', price: 29, limit: 10000, features: ['10,000 API calls/month', 'Email support', 'Analytics dashboard'] },
      business: { name: 'Business', price: 99, limit: 'Unlimited', features: ['Unlimited API calls', 'Priority support', 'SLA guarantee', 'Custom integrations'] },
    };
  }
}
