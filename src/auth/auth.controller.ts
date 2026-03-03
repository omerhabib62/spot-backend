import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyMagicLinkDto } from './dto/verify-magic-link.dto';
import { ResendMagicLinkDto } from './dto/resend-magic-link.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('employee/login')
  employeeLogin(@Body() dto: LoginDto) {
    return this.authService.employeeLogin(dto);
  }

  @Post('verify')
  verify(@Body() dto: VerifyMagicLinkDto) {
    return this.authService.verify(dto);
  }

  @Post('resend')
  resend(@Body() dto: ResendMagicLinkDto) {
    return this.authService.resend(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser() user: { id: string }) {
    return this.authService.logout(user.id);
  }

  @Post('keep-alive')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  keepAlive(@CurrentUser() user: { id: string }) {
    return this.authService.keepAlive(user.id);
  }
}
