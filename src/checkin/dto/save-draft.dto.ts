import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { QuickOption } from '../../common/enums/quick-option.enum';

export class SaveDraftDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsOptional()
  @IsEnum(QuickOption)
  quickOption?: QuickOption;

  @IsOptional()
  @IsString()
  responseText?: string;
}
