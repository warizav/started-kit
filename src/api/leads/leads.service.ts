import { Injectable } from '@nestjs/common';

export interface LeadDto {
  name: string;
  email: string;
  company: string;
  role: string;
  problem: string;
  agentType: 'support' | 'analytics' | 'content' | 'bundle';
  teamSize: string;
  budget: string;
  urgency: 'this_week' | 'this_month' | 'exploring';
}

interface ScoredLead extends LeadDto {
  score: number;
  tier: 'hot' | 'warm' | 'cold';
  estimatedMRR: number;
  receivedAt: string;
}

@Injectable()
export class LeadsService {
  private leads: ScoredLead[] = [];

  capture(dto: LeadDto): ScoredLead {
    const score = this.calculateScore(dto);
    const tier = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';
    const estimatedMRR = this.estimateMRR(dto);

    const lead: ScoredLead = {
      ...dto,
      score,
      tier,
      estimatedMRR,
      receivedAt: new Date().toISOString()
    };

    this.leads.push(lead);
    return lead;
  }

  private calculateScore(dto: LeadDto): number {
    let score = 0;

    // Urgency (40 pts)
    if (dto.urgency === 'this_week') score += 40;
    else if (dto.urgency === 'this_month') score += 20;

    // Budget fit (35 pts)
    if (dto.budget === 'over_1000') score += 35;
    else if (dto.budget === '500_1000') score += 25;
    else if (dto.budget === '200_500') score += 10;

    // Team size (25 pts)
    if (dto.teamSize === 'over_50') score += 25;
    else if (dto.teamSize === '11_50') score += 20;
    else if (dto.teamSize === '2_10') score += 10;

    return Math.min(score, 100);
  }

  private estimateMRR(dto: LeadDto): number {
    const prices = { support: 499, analytics: 999, content: 299, bundle: 1499 };
    return prices[dto.agentType] || 499;
  }
}
