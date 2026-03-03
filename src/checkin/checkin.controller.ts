import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { SubmitCheckInDto } from './dto/submit-checkin.dto';
import { SaveDraftDto } from './dto/save-draft.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Get('form/:token')
  getForm(@Param('token') token: string) {
    return this.checkinService.getForm(token);
  }

  @Post('submit')
  submit(@Body() dto: SubmitCheckInDto) {
    return this.checkinService.submit(dto);
  }

  @Post('save-draft')
  saveDraft(@Body() dto: SaveDraftDto) {
    return this.checkinService.saveDraft(dto);
  }

  @Get('app/today')
  @UseGuards(JwtAuthGuard)
  getTodayCheckIn(@CurrentUser() user: { id: string }) {
    return this.checkinService.getTodayCheckIn(user.id);
  }
}
