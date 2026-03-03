import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingSession } from '../entities/onboarding-session.entity';

@Injectable()
export class SessionOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(OnboardingSession)
    private readonly sessionRepository: Repository<OnboardingSession>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const sessionId = request.params.sessionId;

    if (!user || !sessionId) {
      throw new ForbiddenException('Access denied');
    }

    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId: user.id },
    });

    if (!session) {
      throw new ForbiddenException('You do not own this session');
    }

    request.session = session;
    return true;
  }
}
