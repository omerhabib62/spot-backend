import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckinController } from './checkin.controller';
import { CheckinService } from './checkin.service';
import { CheckIn } from './entities/check-in.entity';
import { CheckInToken } from './entities/check-in-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckIn, CheckInToken])],
  controllers: [CheckinController],
  providers: [CheckinService],
  exports: [CheckinService],
})
export class CheckinModule {}
