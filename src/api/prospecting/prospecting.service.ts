import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';

// Las 5 mejores prácticas de outreach B2B:
// 1. Dolor específico en palabras del cliente, no tuyas
// 2. Mensajes cortos (<80 palabras primer contacto)
// 3. Un CTA claro y de baja fricción ("¿15 min esta semana?")
// 4. Multi-toque: 5 puntos de contacto, ángulos distintos cada vez
// 5. Aprender: los mensajes exitosos informan los futuros

interface SequenceMessage {
  sequence: number;
  channel: string;
  angle: string;
  subject?: string;
  message: string;
}

@Injectable()
export class ProspectingService {
  private claude: Anthropic;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService
  ) {
    this.claude = new Anthropic({ apiKey: this.config.get('ANTHROPIC_API_KEY') });
  }

  // ─── CRUD de prospectos ────────────────────────────────────────────────────

  async listProspects(userId: string) {
    return this.prisma.prospect.findMany({
      where: { userId },
      include: { attempts: { orderBy: { sequence: 'asc' } } },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createProspect(userId: string, data: any) {
    return this.prisma.prospect.create({
      data: {
        userId,
        company: data.company,
        contactName: data.contactName,
        role: data.role,
        email: data.email,
        linkedin: data.linkedin,
        industry: data.industry,
        painPoints: data.painPoints,
        context: data.context
      }
    });
  }

  async deleteProspect(userId: string, id: string) {
    await this._ownProspect(userId, id);
    return this.prisma.prospect.delete({ where: { id } });
  }

  // ─── Marcar resultado de un intento (feedback loop) ───────────────────────

  async markOutcome(userId: string, attemptId: string, outcome: string, note?: string) {
    const attempt = await this.prisma.outreachAttempt.findUnique({
      where: { id: attemptId },
      include: { prospect: true }
    });
    if (!attempt || attempt.prospect.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.outreachAttempt.update({
      where: { id: attemptId },
      data: {
        outcome: outcome as any,
        outcomeNote: note,
        sentAt: attempt.sentAt ?? new Date()
      }
    });

    // Actualizar status del prospecto según el mejor resultado
    const statusMap: Record<string, string> = {
      POSITIVE: 'REPLIED',
      MEETING_BOOKED: 'MEETING_BOOKED',
      NEGATIVE: 'DEAD',
      NO_REPLY: 'IN_PROGRESS',
      NEUTRAL: 'REPLIED'
    };
    const newStatus = statusMap[outcome] ?? 'IN_PROGRESS';
    await this.prisma.prospect.update({
      where: { id: attempt.prospectId },
      data: { status: newStatus as any }
    });

    return updated;
  }

  async markSent(userId: string, attemptId: string) {
    const attempt = await this.prisma.outreachAttempt.findUnique({
      where: { id: attemptId },
      include: { prospect: true }
    });
    if (!attempt || attempt.prospect.userId !== userId) throw new ForbiddenException();

    await this.prisma.outreachAttempt.update({
      where: { id: attemptId },
      data: { sentAt: new Date() }
    });
    await this.prisma.prospect.update({
      where: { id: attempt.prospectId },
      data: { status: 'IN_PROGRESS' }
    });
    return { ok: true };
  }

  // ─── Generar secuencia completa (el corazón del agente) ───────────────────

  async generateSequence(userId: string, prospectId: string): Promise<any> {
    const prospect = await this._ownProspect(userId, prospectId);

    // Borrar intentos previos si se regenera
    await this.prisma.outreachAttempt.deleteMany({ where: { prospectId } });

    // Aprender de mensajes exitosos pasados del mismo usuario
    const successExamples = await this._getSuccessExamples(userId);

    const prompt = this._buildSequencePrompt(prospect, successExamples);

    const response = await this.claude.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = (response.content[0] as any).text;
    const sequence = this._parseSequence(raw);

    // Guardar todos los mensajes generados
    const saved = await Promise.all(
      sequence.map((msg) =>
        this.prisma.outreachAttempt.create({
          data: {
            prospectId,
            sequence: msg.sequence,
            channel: msg.channel,
            angle: msg.angle,
            subject: msg.subject,
            message: msg.message
          }
        })
      )
    );

    await this.prisma.prospect.update({
      where: { id: prospectId },
      data: { status: 'SEQUENCE_GENERATED' }
    });

    return { prospect, sequence: saved };
  }

  // ─── Stats del agente prospector ──────────────────────────────────────────

  async getStats(userId: string) {
    const [total, replied, converted, attempts] = await Promise.all([
      this.prisma.prospect.count({ where: { userId } }),
      this.prisma.prospect.count({ where: { userId, status: { in: ['REPLIED', 'MEETING_BOOKED'] } } }),
      this.prisma.prospect.count({ where: { userId, status: 'CONVERTED' } }),
      this.prisma.outreachAttempt.findMany({
        where: { prospect: { userId } },
        select: { outcome: true, angle: true, sequence: true }
      })
    ]);

    const sentCount = attempts.filter((a) => a.outcome !== null).length;
    const positiveCount = attempts.filter((a) => a.outcome === 'POSITIVE').length;
    const replyRate = sentCount > 0 ? Math.round((positiveCount / sentCount) * 100) : 0;

    // Cuáles ángulos tienen mejor tasa de respuesta
    const angleStats: Record<string, { sent: number; positive: number }> = {};
    for (const a of attempts) {
      if (!a.outcome) continue;
      if (!angleStats[a.angle]) angleStats[a.angle] = { sent: 0, positive: 0 };
      angleStats[a.angle].sent++;
      if (a.outcome === 'POSITIVE') angleStats[a.angle].positive++;
    }
    const bestAngles = Object.entries(angleStats)
      .map(([angle, s]) => ({ angle, rate: s.sent > 0 ? Math.round((s.positive / s.sent) * 100) : 0 }))
      .sort((a, b) => b.rate - a.rate);

    return { total, replied, converted, replyRate, bestAngles };
  }

  // ─── Helpers privados ─────────────────────────────────────────────────────

  private async _ownProspect(userId: string, id: string) {
    const p = await this.prisma.prospect.findUnique({
      where: { id },
      include: { attempts: { orderBy: { sequence: 'asc' } } }
    });
    if (!p || p.userId !== userId) throw new ForbiddenException();
    return p;
  }

  private async _getSuccessExamples(userId: string): Promise<string> {
    const successful = await this.prisma.outreachAttempt.findMany({
      where: {
        outcome: 'POSITIVE',
        prospect: { userId }
      },
      include: { prospect: { select: { industry: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (successful.length === 0) return '';

    const examples = successful
      .map(
        (a) =>
          `[Ángulo: ${a.angle} | Industria: ${a.prospect.industry ?? 'N/A'} | Secuencia: ${a.sequence}]\n${a.message}`
      )
      .join('\n\n---\n\n');

    return `\nMensajes que han obtenido respuesta positiva en el pasado (úsalos como referencia de tono y estructura):\n\n${examples}\n`;
  }

  private _buildSequencePrompt(prospect: any, successExamples: string): string {
    return `Eres un experto en outreach B2B de alto rendimiento. Tu trabajo es crear una secuencia de 5 mensajes para contactar a un prospecto potencial para una agencia que vende agentes de IA custom para empresas.

PROSPECTO:
- Empresa: ${prospect.company}
- Contacto: ${prospect.contactName}${prospect.role ? ` (${prospect.role})` : ''}
- Industria: ${prospect.industry ?? 'No especificada'}
- Canales disponibles: ${[prospect.email ? 'email' : null, prospect.linkedin ? 'linkedin' : null].filter(Boolean).join(', ') || 'email'}
- Dolor principal: ${prospect.painPoints}
- Contexto adicional: ${prospect.context ?? 'Ninguno'}
${successExamples}

REGLAS ESTRICTAS DE OUTREACH B2B DE ALTO RENDIMIENTO:
1. Mensaje 1 (pain): Personalizado al dolor específico. Máx 70 palabras. Sin mencionar tecnología. Un solo CTA.
2. Mensaje 2 (social_proof): 4–5 días después. Resultado concreto de un cliente similar. Máx 80 palabras.
3. Mensaje 3 (value_add): 7 días después. Ofrece algo útil gratis (insight, mini-diagnóstico). Máx 90 palabras.
4. Mensaje 4 (urgency): 12 días después. Ventana de tiempo o capacidad limitada. Máx 70 palabras.
5. Mensaje 5 (breakup): 20 días después. Cierra la secuencia con dignidad. Máx 50 palabras. Deja puerta abierta.

CANAL DE CADA MENSAJE:
- Si hay LinkedIn disponible: mensajes 1 y 3 van por LinkedIn, el resto por email
- Si solo hay email: todos por email
- LinkedIn: sin asunto, más corto y conversacional
- Email: incluye asunto atractivo y breve

FORMATO DE RESPUESTA (JSON puro, sin markdown, sin explicaciones):
[
  {
    "sequence": 1,
    "channel": "linkedin|email",
    "angle": "pain",
    "subject": "solo si es email, sino null",
    "message": "texto completo listo para copiar y pegar"
  },
  ...5 objetos total
]

Escribe los mensajes en el idioma que corresponda al mercado del prospecto. Si la empresa es latinoamericana o española, escribe en español. Si es anglófona, en inglés. Usa tuteo en español a menos que el contexto sea muy formal.`;
  }

  private _parseSequence(raw: string): SequenceMessage[] {
    try {
      // Extraer el JSON del texto
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('No JSON array found');
      return JSON.parse(match[0]);
    } catch {
      // Fallback: devolver un mensaje básico si el parsing falla
      return [
        {
          sequence: 1,
          channel: 'email',
          angle: 'pain',
          subject: 'Una pregunta rápida',
          message: raw.slice(0, 500)
        }
      ];
    }
  }
}
