import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  organizationName?: string;

  @IsOptional()
  @IsEmail()
  notificationEmail?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}
