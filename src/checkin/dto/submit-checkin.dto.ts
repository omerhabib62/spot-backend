import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { QuickOption } from '../../common/enums/quick-option.enum';

export class SubmitCheckInDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsEnum(QuickOption)
  quickOption: QuickOption;

  @IsOptional()
  @IsString()
  responseText?: string;
}
