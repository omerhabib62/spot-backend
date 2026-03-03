import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
