import { IsEmail, IsString, IsOptional } from 'class-validator';

export class ConfigureRecipientDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  name?: string;
}
