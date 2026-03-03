import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OnboardingService } from './onboarding.service';
import { UpdateStepDto } from './dto/update-step.dto';
import { NotificationEmailDto } from './dto/notification-email.dto';
import { AddContactDto } from './dto/add-contact.dto';
import { PatchContactDto } from './dto/patch-contact.dto';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SessionOwnerGuard } from './guards/session-owner.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('start')
  start(@CurrentUser() user: { id: string }) {
    return this.onboardingService.start(user.id);
  }

  @Patch('session/:sessionId/step')
  @UseGuards(SessionOwnerGuard)
  updateStep(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateStepDto,
  ) {
    return this.onboardingService.updateStep(sessionId, dto);
  }

  @Post('session/:sessionId/notification-email')
  @UseGuards(SessionOwnerGuard)
  setNotificationEmail(
    @Param('sessionId') sessionId: string,
    @Body() dto: NotificationEmailDto,
  ) {
    return this.onboardingService.setNotificationEmail(sessionId, dto);
  }

  @Post('session/:sessionId/contacts/upload')
  @UseGuards(SessionOwnerGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadContacts(
    @Param('sessionId') sessionId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.onboardingService.uploadContacts(sessionId, file);
  }

  @Post('session/:sessionId/contacts/individual')
  @UseGuards(SessionOwnerGuard)
  addContact(
    @Param('sessionId') sessionId: string,
    @Body() dto: AddContactDto,
  ) {
    return this.onboardingService.addContact(sessionId, dto);
  }

  @Delete('session/:sessionId/contacts/:contactId')
  @UseGuards(SessionOwnerGuard)
  removeContact(
    @Param('sessionId') sessionId: string,
    @Param('contactId') contactId: string,
  ) {
    return this.onboardingService.removeContact(sessionId, contactId);
  }

  @Patch('session/:sessionId/contacts/:contactId')
  @UseGuards(SessionOwnerGuard)
  patchContact(
    @Param('sessionId') sessionId: string,
    @Param('contactId') contactId: string,
    @Body() dto: PatchContactDto,
  ) {
    return this.onboardingService.patchContact(sessionId, contactId, dto);
  }

  @Post('session/:sessionId/complete')
  @UseGuards(SessionOwnerGuard)
  complete(
    @Param('sessionId') sessionId: string,
    @Body() dto: CompleteOnboardingDto,
  ) {
    return this.onboardingService.complete(sessionId, dto);
  }

  @Get('session/:sessionId')
  @UseGuards(SessionOwnerGuard)
  getSession(@Param('sessionId') sessionId: string) {
    return this.onboardingService.getSession(sessionId);
  }
}
