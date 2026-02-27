import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto } from './dto/auth.dto';

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  plan: 'free' | 'pro' | 'business';
  apiCallsThisMonth: number;
  stripeCustomerId?: string;
  createdAt: Date;
}

// In-memory store — swap for Prisma/TypeORM when ready
const users = new Map<string, User>();

const PLAN_LIMITS = {
  free: 100,
  pro: 10000,
  business: Infinity,
};

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto): Promise<{ token: string; user: Partial<User> }> {
    if (users.has(dto.email)) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user: User = {
      id: crypto.randomUUID(),
      email: dto.email,
      name: dto.name,
      passwordHash,
      plan: 'free',
      apiCallsThisMonth: 0,
      createdAt: new Date(),
    };

    users.set(dto.email, user);

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { token, user: this.sanitize(user) };
  }

  async login(dto: LoginDto): Promise<{ token: string; user: Partial<User> }> {
    const user = users.get(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { token, user: this.sanitize(user) };
  }

  getProfile(email: string): Partial<User> | null {
    const user = users.get(email);
    return user ? this.sanitize(user) : null;
  }

  consumeApiCall(email: string): { allowed: boolean; remaining: number; plan: string } {
    const user = users.get(email);
    if (!user) return { allowed: false, remaining: 0, plan: 'none' };

    const limit = PLAN_LIMITS[user.plan];
    if (user.apiCallsThisMonth >= limit) {
      return { allowed: false, remaining: 0, plan: user.plan };
    }

    user.apiCallsThisMonth += 1;
    users.set(email, user);

    return {
      allowed: true,
      remaining: limit === Infinity ? 999999 : limit - user.apiCallsThisMonth,
      plan: user.plan,
    };
  }

  upgradePlan(email: string, plan: 'pro' | 'business', stripeCustomerId: string): void {
    const user = users.get(email);
    if (!user) return;
    user.plan = plan;
    user.stripeCustomerId = stripeCustomerId;
    users.set(email, user);
  }

  getUserByEmail(email: string): User | undefined {
    return users.get(email);
  }

  private sanitize(user: User): Partial<User> {
    const { passwordHash: _, ...safe } = user;
    return safe;
  }
}
