import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { MagicLink } from './entities/magic-link.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto';
import { ResendMagicLinkDto } from './dto/resend-magic-link.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MagicLink)
    private readonly magicLinkRepository: Repository<MagicLink>,
    private readonly jwtService: JwtService,
  ) {}

  async register(_dto: RegisterDto) {
    // TODO: Create user, generate magic link, return _dev_token in non-prod
    throw new Error('Not implemented');
  }

  async login(_dto: LoginDto) {
    // TODO: Find user by email, generate magic link, return _dev_token in non-prod
    throw new Error('Not implemented');
  }

  async employeeLogin(_dto: LoginDto) {
    // TODO: Find employee by email, generate magic link, return _dev_token in non-prod
    throw new Error('Not implemented');
  }

  async verify(_dto: VerifyMagicLinkDto) {
    // TODO: Validate token, mark used, return JWT
    throw new Error('Not implemented');
  }

  async resend(_dto: ResendMagicLinkDto) {
    // TODO: Find user, generate new magic link
    throw new Error('Not implemented');
  }

  async logout(_userId: string) {
    // TODO: Invalidate session (no-op for stateless JWT in V1)
    return;
  }

  async keepAlive(_userId: string) {
    // TODO: Extend session / no-op for V1
    return;
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  signToken(user: User): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
