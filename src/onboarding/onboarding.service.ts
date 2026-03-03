import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingSession } from './entities/onboarding-session.entity';
import { UpdateStepDto } from './dto/update-step.dto';
import { NotificationEmailDto } from './dto/notification-email.dto';
import { AddContactDto } from './dto/add-contact.dto';
import { PatchContactDto } from './dto/patch-contact.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(OnboardingSession)
    private readonly sessionRepository: Repository<OnboardingSession>,
  ) {}

  async start(_userId: string) {
    // TODO: Create new onboarding session for user
    throw new Error('Not implemented');
  }

  async updateStep(_sessionId: string, _dto: UpdateStepDto) {
    // TODO: Update current step for session
    throw new Error('Not implemented');
  }

  async setNotificationEmail(_sessionId: string, _dto: NotificationEmailDto) {
    // TODO: Set notification email for session
    throw new Error('Not implemented');
  }

  async uploadContacts(_sessionId: string, _file: Express.Multer.File) {
    // TODO: Parse CSV and create contacts
    throw new Error('Not implemented');
  }

  async addContact(_sessionId: string, _dto: AddContactDto) {
    // TODO: Add individual contact to session
    throw new Error('Not implemented');
  }

  async removeContact(_sessionId: string, _contactId: string) {
    // TODO: Remove contact from session
    throw new Error('Not implemented');
  }

  async patchContact(
    _sessionId: string,
    _contactId: string,
    _dto: PatchContactDto,
  ) {
    // TODO: Update contact in session
    throw new Error('Not implemented');
  }

  async complete(_sessionId: string, _dto: CompleteOnboardingDto) {
    // TODO: Mark session as completed, transition user status
    throw new Error('Not implemented');
  }

  async getSession(_sessionId: string) {
    // TODO: Return session with contacts
    throw new Error('Not implemented');
  }
}
