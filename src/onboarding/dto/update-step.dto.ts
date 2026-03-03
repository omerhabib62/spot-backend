import { IsInt, Min } from 'class-validator';

export class UpdateStepDto {
  @IsInt()
  @Min(1)
  step: number;
}
