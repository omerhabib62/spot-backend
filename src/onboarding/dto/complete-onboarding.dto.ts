import { IsOptional, IsObject } from 'class-validator';

export class CompleteOnboardingDto {
  @IsOptional()
  @IsObject()
  finalData?: Record<string, any>;
}
