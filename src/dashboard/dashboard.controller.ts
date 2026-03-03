import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DashboardService } from './dashboard.service';
import { BulkCreateContactsDto } from './dto/bulk-create-contacts.dto';
import { BulkDeleteContactsDto } from './dto/bulk-delete-contacts.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORG_ADMIN, UserRole.MANAGER)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('contacts')
  getContacts(
    @CurrentUser() user: { id: string; organizationId: string },
    @Query() query: PaginationQueryDto,
  ) {
    return this.dashboardService.getContacts(user.organizationId, query);
  }

  @Post('contacts')
  bulkCreateContacts(
    @CurrentUser() user: { id: string; organizationId: string },
    @Body() dto: BulkCreateContactsDto,
  ) {
    return this.dashboardService.bulkCreateContacts(user.organizationId, dto);
  }

  @Post('contacts/csv')
  @UseInterceptors(FileInterceptor('file'))
  importCsv(
    @CurrentUser() user: { id: string; organizationId: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.dashboardService.importCsv(user.organizationId, file);
  }

  @Post('contacts/bulk-delete')
  bulkDeleteContacts(
    @CurrentUser() user: { id: string; organizationId: string },
    @Body() dto: BulkDeleteContactsDto,
  ) {
    return this.dashboardService.bulkDeleteContacts(user.organizationId, dto);
  }

  @Patch('contacts/:id')
  updateContact(
    @CurrentUser() user: { id: string; organizationId: string },
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.dashboardService.updateContact(user.organizationId, id, dto);
  }

  @Get('contacts/:id')
  getContact(
    @CurrentUser() user: { id: string; organizationId: string },
    @Param('id') id: string,
  ) {
    return this.dashboardService.getContact(user.organizationId, id);
  }

  @Delete('contacts/:id')
  deleteContact(
    @CurrentUser() user: { id: string; organizationId: string },
    @Param('id') id: string,
  ) {
    return this.dashboardService.deleteContact(user.organizationId, id);
  }

  @Get('settings')
  getSettings(@CurrentUser() user: { id: string; organizationId: string }) {
    return this.dashboardService.getSettings(user.organizationId);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: { id: string; organizationId: string },
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.dashboardService.updateSettings(user.organizationId, dto);
  }

  @Get('billing')
  getBilling(@CurrentUser() user: { id: string; organizationId: string }) {
    return this.dashboardService.getBilling(user.organizationId);
  }
}
