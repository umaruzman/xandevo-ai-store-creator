import { Transform } from 'class-transformer';
import { IsIn, IsObject, IsOptional, IsString, Length } from 'class-validator';

export class UpdateStoreDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 80)
  name?: string;

  @IsOptional()
  @IsIn(['draft', 'saved'])
  status?: 'draft' | 'saved';

  @IsOptional()
  @IsObject()
  definition?: Record<string, unknown>;
}
