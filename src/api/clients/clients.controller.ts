import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClientsService } from './clients.service';

@Controller('api/clients')
@UseGuards(AuthGuard('jwt'))
export class ClientsController {
  constructor(private clients: ClientsService) {}

  @Get('stats')
  getStats(@Request() req) {
    return this.clients.getStats(req.user.userId);
  }

  @Get('configs')
  getConfigs(@Request() req) {
    return this.clients.getConfigs(req.user.userId);
  }

  @Post('configs')
  createConfig(@Request() req, @Body() body: any) {
    return this.clients.createConfig(req.user.userId, body);
  }

  @Put('configs/:id')
  updateConfig(@Request() req, @Param('id') id: string, @Body() body: any) {
    return this.clients.updateConfig(req.user.userId, id, body);
  }

  @Delete('configs/:id')
  deleteConfig(@Request() req, @Param('id') id: string) {
    return this.clients.deleteConfig(req.user.userId, id);
  }

  @Get('executions')
  getExecutions(@Request() req) {
    return this.clients.getExecutions(req.user.userId);
  }
}
