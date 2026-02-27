import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Headers,
  Req,
  RawBodyRequest
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@Controller('api/payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Post('create-checkout')
  @UseGuards(AuthGuard('jwt'))
  createCheckout(@Request() req, @Body() body: { priceId: string }) {
    return this.payments.createCheckoutSession(req.user.userId, req.user.email, body.priceId);
  }

  @Post('create-portal')
  @UseGuards(AuthGuard('jwt'))
  createPortal(@Request() req) {
    return this.payments.createPortalSession(req.user.userId);
  }

  @Get('subscription')
  @UseGuards(AuthGuard('jwt'))
  getSubscription(@Request() req) {
    return this.payments.getSubscription(req.user.userId);
  }

  @Post('webhook')
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string
  ) {
    return this.payments.handleWebhook((req as any).rawBody, sig);
  }
}
