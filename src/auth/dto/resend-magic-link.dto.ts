import { IsEmail } from 'class-validator';

export class ResendMagicLinkDto {
  @IsEmail()
  email: string;
}
