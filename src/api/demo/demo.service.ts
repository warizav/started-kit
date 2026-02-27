import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

const AGENT_PROMPTS = {
  support: `You are an expert customer support agent. You respond professionally, empathetically, and concisely to customer inquiries. Always provide actionable solutions. Keep responses under 200 words.`,
  analytics: `You are a senior business data analyst. Given business data or a question about metrics, provide clear insights, identify patterns, and give specific recommendations. Focus on actionable conclusions. Keep responses under 250 words.`,
  content: `You are a professional marketing copywriter. Generate compelling, conversion-focused content that matches the brand voice. Be creative, clear, and persuasive. Keep responses under 300 words.`
};

const AGENT_NAMES = {
  support: 'Customer Support Agent',
  analytics: 'Data Analytics Agent',
  content: 'Content Writer Agent'
};

export interface RunAgentDto {
  prompt: string;
  agentType: 'support' | 'analytics' | 'content';
  context?: string;
}

@Injectable()
export class DemoService {
  private client: Anthropic;

  constructor(private config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY')
    });
  }

  async runAgent(dto: RunAgentDto) {
    const start = Date.now();
    const systemPrompt = AGENT_PROMPTS[dto.agentType];
    const userMessage = dto.context
      ? `Context: ${dto.context}\n\nRequest: ${dto.prompt}`
      : dto.prompt;

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    });

    const result = message.content[0].type === 'text' ? message.content[0].text : '';
    const processingTime = Date.now() - start;

    return {
      result,
      agentName: AGENT_NAMES[dto.agentType],
      tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      processingTime,
      model: 'claude-sonnet-4-6'
    };
  }

  getAgentTypes() {
    return [
      {
        id: 'support',
        name: 'Customer Support Agent',
        description: 'Handles customer inquiries with professional, empathetic responses',
        useCase: 'Reduce support ticket resolution time by 70%'
      },
      {
        id: 'analytics',
        name: 'Data Analytics Agent',
        description: 'Analyzes business data and extracts actionable insights',
        useCase: '4-hour analyses completed in 30 seconds'
      },
      {
        id: 'content',
        name: 'Content Writer Agent',
        description: 'Generates on-brand marketing content at scale',
        useCase: '10x content production without hiring'
      }
    ];
  }
}
