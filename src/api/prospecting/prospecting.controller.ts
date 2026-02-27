import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProspectingService } from './prospecting.service';

@Controller('api/prospecting')
@UseGuards(AuthGuard('jwt'))
export class ProspectingController {
  constructor(private svc: ProspectingService) {}

  @Get('stats')
  stats(@Request() req) {
    return this.svc.getStats(req.user.userId);
  }

  @Get('prospects')
  list(@Request() req) {
    return this.svc.listProspects(req.user.userId);
  }

  @Post('prospects')
  create(@Request() req, @Body() body: any) {
    return this.svc.createProspect(req.user.userId, body);
  }

  @Delete('prospects/:id')
  remove(@Request() req, @Param('id') id: string) {
    return this.svc.deleteProspect(req.user.userId, id);
  }

  // Genera (o regenera) la secuencia completa de 5 mensajes
  @Post('prospects/:id/generate')
  generate(@Request() req, @Param('id') id: string) {
    return this.svc.generateSequence(req.user.userId, id);
  }

  // Marcar un intento como enviado
  @Post('attempts/:id/sent')
  markSent(@Request() req, @Param('id') id: string) {
    return this.svc.markSent(req.user.userId, id);
  }

  // Marcar resultado → feedback loop que mejora futuras generaciones
  @Post('attempts/:id/outcome')
  markOutcome(@Request() req, @Param('id') id: string, @Body() body: { outcome: string; note?: string }) {
    return this.svc.markOutcome(req.user.userId, id, body.outcome, body.note);
  }
}
