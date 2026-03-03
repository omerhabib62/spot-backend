import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OnboardingSession } from './entities/onboarding-session.entity';
import { Contact } from '../dashboard/entities/contact.entity';
import { SessionOwnerGuard } from './guards/session-owner.guard';

@Module({
  imports: [TypeOrmModule.forFeature([OnboardingSession, Contact])],
  controllers: [OnboardingController],
  providers: [OnboardingService, SessionOwnerGuard],
  exports: [OnboardingService],
})
export class OnboardingModule {}
