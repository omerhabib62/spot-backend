import { IsEmail } from 'class-validator';

export class NotificationEmailDto {
  @IsEmail()
  email: string;
}
