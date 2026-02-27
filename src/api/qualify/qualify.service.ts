import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface QualifyLead {
  id: string;
  companyName: string;
  contactName: string;
  industry: string;
  mainProblem: string;
  companySize: 'solo' | '2_10' | '11_50' | 'over_50';
  currentSolution: string;
  agentType: 'support' | 'analytics' | 'content';
  price: number;
  createdAt: string;
}

export type CreateLeadDto = Omit<QualifyLead, 'id' | 'createdAt'>;

@Injectable()
export class QualifyService {
  private leads = new Map<string, QualifyLead>();
  private stripe: Stripe;

  constructor(private config: ConfigService) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY', 'sk_test_placeholder'), {
      apiVersion: '2025-01-27.acacia' as any
    });
  }

  createLead(dto: CreateLeadDto): QualifyLead {
    const id = crypto.randomUUID();
    const lead: QualifyLead = { ...dto, id, createdAt: new Date().toISOString() };
    this.leads.set(id, lead);
    return lead;
  }

  getLead(id: string): QualifyLead | undefined {
    return this.leads.get(id);
  }

  getDemoUrl(id: string): string {
    const appUrl = this.config.get('APP_URL', 'http://localhost:5173');
    return `${appUrl}/demo/${id}`;
  }

  generateWhatsAppMessage(lead: QualifyLead, demoUrl: string): string {
    const sizeLabel =
      lead.companySize === 'solo'
        ? 'tu negocio'
        : lead.companySize === '2_10'
          ? 'tu equipo'
          : lead.companySize === '11_50'
            ? 'tu empresa'
            : 'su organización';

    return `Hola ${lead.contactName}, armé el agente para ${lead.companyName}.

Basándome en lo que me contaste sobre ${lead.mainProblem.toLowerCase()}, lo configuré específicamente para ${sizeLabel} en ${lead.industry}.

Míralo en acción aquí: ${demoUrl}

¿Tienes 10 min esta semana para ver cómo se integra con lo que usan hoy?`;
  }

  generateProposalText(lead: QualifyLead, demoUrl: string, paymentUrl?: string): string {
    const agentLabels: Record<string, string> = {
      support: 'Agente de Atención al Cliente',
      analytics: 'Agente de Análisis de Datos',
      content: 'Agente de Contenido y Marketing'
    };

    const lines = [
      `Demo personalizada para ${lead.companyName}:`,
      demoUrl,
      '',
      `Lo que incluye:`,
      `• ${agentLabels[lead.agentType]} configurado para ${lead.industry}`,
      `• Integración con sus herramientas actuales`,
      `• 30 días de soporte directo incluidos`,
      `• Entrega en 48 horas`,
      '',
      `Inversión: $${lead.price} USD (pago único)`
    ];

    if (paymentUrl) {
      lines.push('', `Link de pago: ${paymentUrl}`);
    }

    return lines.join('\n');
  }

  async createPaymentLink(lead: QualifyLead): Promise<string | null> {
    try {
      const appUrl = this.config.get('APP_URL', 'http://localhost:5173');

      const price = await this.stripe.prices.create({
        currency: 'usd',
        unit_amount: lead.price * 100,
        product_data: {
          name: `Agente IA para ${lead.companyName} — ${lead.industry}`
        }
      });

      const paymentLink = await this.stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        metadata: { leadId: lead.id, company: lead.companyName },
        after_completion: {
          type: 'redirect',
          redirect: { url: `${appUrl}/demo/${lead.id}?paid=1` }
        }
      });

      return paymentLink.url;
    } catch {
      return null;
    }
  }
}
