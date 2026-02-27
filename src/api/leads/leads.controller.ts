import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { LeadsService, LeadDto } from './leads.service';

@Controller('api/leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('capture')
  @HttpCode(201)
  capture(@Body() dto: LeadDto) {
    const lead = this.leadsService.capture(dto);
    return {
      success: true,
      message: 'Thank you! We will contact you within 24 hours.',
      tier: lead.tier,
      nextStep:
        lead.tier === 'hot'
          ? 'Our team will reach out within 2 hours to schedule your demo.'
          : 'We will send you a personalized demo link within 24 hours.'
    };
  }
}
