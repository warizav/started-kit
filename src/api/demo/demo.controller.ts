import { Controller, Post, Get, Body } from '@nestjs/common';
import { DemoService, RunAgentDto } from './demo.service';

@Controller('api/demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Post('run')
  runAgent(@Body() dto: RunAgentDto) {
    return this.demoService.runAgent(dto);
  }

  @Get('agents')
  getAgentTypes() {
    return this.demoService.getAgentTypes();
  }

  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
