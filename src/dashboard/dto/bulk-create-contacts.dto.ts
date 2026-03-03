import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { CreateContactDto } from './create-contact.dto';

export class BulkCreateContactsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @Type(() => CreateContactDto)
  contacts: CreateContactDto[];
}
