import { randomUUID } from 'crypto';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { MagicLink } from './entities/magic-link.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto';
import { ResendMagicLinkDto } from './dto/resend-magic-link.dto';
import { MagicLinkType } from '../common/enums/magic-link-type.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { UserStatus } from '../common/enums/user-status.enum';
import { MagicLinkSentResponse, VerifyResponse } from './auth.types';

const MAGIC_LINK_TTL_MINUTES = 15;

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MagicLink)
    private readonly magicLinkRepository: Repository<MagicLink>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<MagicLinkSentResponse> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      const token = await this.createMagicLink(existing, MagicLinkType.LOGIN);
      return {
        message: 'Registration successful. Use the token below to verify.',
        email: dto.email,
        _dev_token: token,
      };
    }

    const user = this.userRepository.create({
      email: dto.email,
      name: dto.name,
      role: UserRole.LEAD,
      status: UserStatus.LEAD_UNCONFIRMED,
    });
    await this.userRepository.save(user);

    const token = await this.createMagicLink(user, MagicLinkType.REGISTRATION);

    return {
      message: 'Registration successful. Use the token below to verify.',
      email: dto.email,
      _dev_token: token,
    };
  }

  async login(dto: LoginDto): Promise<MagicLinkSentResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException('No account found with this email');
    }

    const token = await this.createMagicLink(user, MagicLinkType.LOGIN);

    return {
      message: 'Magic link created. Use the token below to verify.',
      email: dto.email,
      _dev_token: token,
    };
  }

  async employeeLogin(dto: LoginDto): Promise<MagicLinkSentResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email, role: UserRole.EMPLOYEE },
    });
    if (!user) {
      throw new NotFoundException('No employee account found with this email');
    }

    const token = await this.createMagicLink(user, MagicLinkType.LOGIN);

    return {
      message: 'Magic link created. Use the token below to verify.',
      email: dto.email,
      _dev_token: token,
    };
  }

  async verify(dto: VerifyMagicLinkDto): Promise<VerifyResponse> {
    const magicLink = await this.magicLinkRepository.findOne({
      where: { token: dto.token },
      relations: ['user'],
    });

    if (!magicLink) {
      throw new UnauthorizedException('Invalid token');
    }

    if (magicLink.invalidatedAt) {
      throw new UnauthorizedException('Token has been invalidated');
    }

    if (magicLink.usedAt) {
      throw new UnauthorizedException('Token has already been used');
    }

    if (magicLink.expiresAt < new Date()) {
      throw new UnauthorizedException('Token has expired');
    }

    magicLink.usedAt = new Date();
    await this.magicLinkRepository.save(magicLink);

    if (
      magicLink.type === MagicLinkType.REGISTRATION &&
      magicLink.user.status === UserStatus.LEAD_UNCONFIRMED
    ) {
      magicLink.user.status = UserStatus.LEAD_CONFIRMED;
    }

    magicLink.user.lastActivityAt = new Date();
    await this.userRepository.save(magicLink.user);

    const user = await this.userRepository.findOneOrFail({
      where: { id: magicLink.user.id },
    });

    const accessToken = this.signToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        onboardingCurrentStep: user.onboardingCurrentStep,
      },
    };
  }

  async resend(dto: ResendMagicLinkDto): Promise<MagicLinkSentResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (!user) {
      throw new NotFoundException('No account found with this email');
    }

    const type =
      user.status === UserStatus.LEAD_UNCONFIRMED
        ? MagicLinkType.REGISTRATION
        : MagicLinkType.LOGIN;

    const token = await this.createMagicLink(user, type);

    return {
      message: 'A new magic link has been generated.',
      email: dto.email,
      _dev_token: token,
    };
  }

  async logout(userId: string) {
    await this.userRepository.update(userId, { lastActivityAt: null });
    return;
  }

  async keepAlive(userId: string) {
    await this.userRepository.update(userId, { lastActivityAt: new Date() });
    return;
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  signToken(user: User): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload, { expiresIn: '15m' });
  }

  private async createMagicLink(
    user: User,
    type: MagicLinkType,
  ): Promise<string> {
    // Invalidate all prior active links for this user
    await this.magicLinkRepository.update(
      { userId: user.id, usedAt: IsNull(), invalidatedAt: IsNull() },
      { invalidatedAt: new Date() },
    );

    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + MAGIC_LINK_TTL_MINUTES);

    const magicLink = this.magicLinkRepository.create({
      token,
      type,
      userId: user.id,
      expiresAt,
    });
    await this.magicLinkRepository.save(magicLink);

    return token;
  }
}
