import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async getConfigs(userId: string) {
    return this.prisma.clientAgentConfig.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async createConfig(userId: string, data: any) {
    return this.prisma.clientAgentConfig.create({
      data: {
        userId,
        agentType: data.agentType,
        name: data.name || 'My Agent',
        systemPrompt: data.systemPrompt,
        contextDocs: data.contextDocs,
        integrations: data.integrations
      }
    });
  }

  async updateConfig(userId: string, id: string, data: any) {
    const config = await this.prisma.clientAgentConfig.findUnique({ where: { id } });
    if (!config || config.userId !== userId) throw new ForbiddenException();
    return this.prisma.clientAgentConfig.update({
      where: { id },
      data: {
        name: data.name,
        systemPrompt: data.systemPrompt,
        contextDocs: data.contextDocs,
        integrations: data.integrations,
        isActive: data.isActive
      }
    });
  }

  async deleteConfig(userId: string, id: string) {
    const config = await this.prisma.clientAgentConfig.findUnique({ where: { id } });
    if (!config || config.userId !== userId) throw new ForbiddenException();
    return this.prisma.clientAgentConfig.delete({ where: { id } });
  }

  async getExecutions(userId: string) {
    return this.prisma.execution.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async getStats(userId: string) {
    const [totalExecutions, successfulExecutions, configs] = await Promise.all([
      this.prisma.execution.count({ where: { userId } }),
      this.prisma.execution.count({ where: { userId, successful: true } }),
      this.prisma.clientAgentConfig.count({ where: { userId, isActive: true } })
    ]);

    const tokenAgg = await this.prisma.execution.aggregate({
      where: { userId },
      _sum: { tokensUsed: true }
    });

    return {
      totalExecutions,
      successfulExecutions,
      successRate: totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0,
      tokensUsed: tokenAgg._sum.tokensUsed ?? 0,
      activeAgents: configs
    };
  }
}
