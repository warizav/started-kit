import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { AuthService } from '../auth/auth.service';

@Controller('api')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Get('h')
  getHello(): string {
    return this.appService.getHello();
  }

  // Protected endpoint — requires active subscription (pro or business)
  @UseGuards(JwtAuthGuard)
  @Get('data')
  getData(@Request() req: any) {
    const result = this.authService.consumeApiCall(req.user.email);

    if (!result.allowed) {
      return {
        error: 'API limit reached',
        message: 'Upgrade your plan to continue',
        upgradeUrl: '/pricing',
        plan: result.plan,
      };
    }

    return {
      data: this.appService.getHello(),
      meta: {
        plan: result.plan,
        callsRemaining: result.remaining,
      },
    };
  }
}
