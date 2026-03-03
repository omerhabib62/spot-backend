import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateRecipientDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
