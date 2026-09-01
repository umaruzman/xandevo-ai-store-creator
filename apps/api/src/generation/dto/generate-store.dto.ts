import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class GenerateStoreDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(10, 1000, { message: 'prompt must be between 10 and 1000 characters' })
  prompt!: string;
}
