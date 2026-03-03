import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationRecipient } from './entities/notification-recipient.entity';
import { NotificationLog } from './entities/notification-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationRecipient, NotificationLog])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
