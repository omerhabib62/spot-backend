import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ConfigureRecipientDto } from './dto/configure-recipient.dto';
import { UpdateRecipientDto } from './dto/update-recipient.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ORG_ADMIN, UserRole.MANAGER)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('recipient')
  createRecipient(
    @CurrentUser() user: { id: string; organizationId: string },
    @Body() dto: ConfigureRecipientDto,
  ) {
    return this.notificationsService.createRecipient(user.organizationId, dto);
  }

  @Put('recipient/:id')
  updateRecipient(
    @CurrentUser() user: { id: string; organizationId: string },
    @Param('id') id: string,
    @Body() dto: UpdateRecipientDto,
  ) {
    return this.notificationsService.updateRecipient(
      user.organizationId,
      id,
      dto,
    );
  }

  @Get('recipient')
  getRecipient(@CurrentUser() user: { id: string; organizationId: string }) {
    return this.notificationsService.getRecipient(user.organizationId);
  }

  @Get('history')
  getHistory(
    @CurrentUser() user: { id: string; organizationId: string },
    @Query() query: PaginationQueryDto,
  ) {
    return this.notificationsService.getHistory(user.organizationId, query);
  }
}
