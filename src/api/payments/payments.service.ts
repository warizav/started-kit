import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY', 'sk_test_placeholder'), {
      apiVersion: '2025-01-27.acacia' as any
    });
  }

  async createCheckoutSession(userId: string, email: string, priceId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    let customerId = user?.stripeCustomerId;

    if (!customerId) {
      const customer = await this.stripe.customers.create({ email, metadata: { userId } });
      customerId = customer.id;
      await this.prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }

    const appUrl = this.config.get('APP_URL', 'http://localhost:5173');
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/dashboard?success=1`,
      cancel_url: `${appUrl}/pricing`,
      metadata: { userId }
    });

    return { url: session.url };
  }

  async createPortalSession(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) return { url: '/pricing' };

    const appUrl = this.config.get('APP_URL', 'http://localhost:5173');
    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${appUrl}/dashboard`
    });

    return { url: session.url };
  }

  async getSubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    return sub ?? { plan: 'FREE', status: 'ACTIVE' };
  }

  async handleWebhook(rawBody: Buffer, sig: string) {
    const secret = this.config.get('STRIPE_WEBHOOK_SECRET', '');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch (err) {
      this.logger.error('Webhook signature verification failed', err);
      return { received: false };
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutCompleted(session);
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.handleSubscriptionChange(sub);
        break;
      }
    }

    return { received: true };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    if (!userId) return;

    const stripeSubId = session.subscription as string;
    const stripeSub = await this.stripe.subscriptions.retrieve(stripeSubId);
    const priceId = stripeSub.items.data[0]?.price.id;
    const plan = this.getPlanFromPriceId(priceId);

    await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        stripeSubscriptionId: stripeSubId,
        stripePriceId: priceId,
        plan,
        status: 'ACTIVE',
        currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000)
      },
      create: {
        userId,
        stripeSubscriptionId: stripeSubId,
        stripePriceId: priceId,
        plan,
        status: 'ACTIVE',
        currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000)
      }
    });
  }

  private async handleSubscriptionChange(stripeSub: Stripe.Subscription) {
    const sub = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: stripeSub.id }
    });
    if (!sub) return;

    const status = this.mapStripeStatus(stripeSub.status);
    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status,
        currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end
      }
    });
  }

  private getPlanFromPriceId(priceId: string): any {
    const map: Record<string, string> = {
      [this.config.get('STRIPE_PRICE_PRO', '')]: 'PRO',
      [this.config.get('STRIPE_PRICE_BUSINESS', '')]: 'BUSINESS'
    };
    return map[priceId] ?? 'PRO';
  }

  private mapStripeStatus(status: string): any {
    const map: Record<string, string> = {
      active: 'ACTIVE',
      past_due: 'PAST_DUE',
      canceled: 'CANCELED',
      trialing: 'TRIALING'
    };
    return map[status] ?? 'ACTIVE';
  }
}
