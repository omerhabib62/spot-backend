import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class BulkDeleteContactsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  ids: string[];
}
