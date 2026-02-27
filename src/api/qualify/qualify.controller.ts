import { Controller, Post, Get, Body, Param, NotFoundException, HttpCode } from '@nestjs/common';
import { QualifyService, CreateLeadDto } from './qualify.service';

@Controller('api/qualify')
export class QualifyController {
  constructor(private readonly qualifyService: QualifyService) {}

  @Post('lead')
  @HttpCode(201)
  async createLead(@Body() dto: CreateLeadDto) {
    const lead = this.qualifyService.createLead(dto);
    const demoUrl = this.qualifyService.getDemoUrl(lead.id);
    const whatsappMessage = this.qualifyService.generateWhatsAppMessage(lead, demoUrl);
    const proposalText = this.qualifyService.generateProposalText(lead, demoUrl);

    return { lead, demoUrl, whatsappMessage, proposalText };
  }

  @Get('lead/:id')
  getLead(@Param('id') id: string) {
    const lead = this.qualifyService.getLead(id);
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  @Post('payment-link')
  async createPaymentLink(@Body() body: { leadId: string }) {
    const lead = this.qualifyService.getLead(body.leadId);
    if (!lead) throw new NotFoundException('Lead not found');

    const paymentUrl = await this.qualifyService.createPaymentLink(lead);
    const demoUrl = this.qualifyService.getDemoUrl(lead.id);
    const proposalText = this.qualifyService.generateProposalText(lead, demoUrl, paymentUrl);

    return { paymentUrl, proposalText };
  }
}
