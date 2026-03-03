import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckIn } from './entities/check-in.entity';
import { CheckInToken } from './entities/check-in-token.entity';
import { SubmitCheckInDto } from './dto/submit-checkin.dto';
import { SaveDraftDto } from './dto/save-draft.dto';

@Injectable()
export class CheckinService {
  constructor(
    @InjectRepository(CheckIn)
    private readonly checkInRepository: Repository<CheckIn>,
    @InjectRepository(CheckInToken)
    private readonly tokenRepository: Repository<CheckInToken>,
  ) {}

  async getForm(_token: string) {
    // TODO: Validate token, return form data with draft if any
    throw new Error('Not implemented');
  }

  async submit(_dto: SubmitCheckInDto) {
    // TODO: Validate token, create check-in, severity always "stable"
    throw new Error('Not implemented');
  }

  async saveDraft(_dto: SaveDraftDto) {
    // TODO: Validate token, save/update draft
    throw new Error('Not implemented');
  }

  async getTodayCheckIn(_userId: string) {
    // TODO: Return today's check-in status for the authenticated user
    throw new Error('Not implemented');
  }
}
