import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CheckinModule } from './checkin/checkin.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        url: config.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    CommonModule,
    AuthModule,
    OnboardingModule,
    DashboardModule,
    CheckinModule,
    NotificationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
