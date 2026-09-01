import { Transform } from 'class-transformer';
import { IsObject, IsString, Length } from 'class-validator';

export class CreateStoreDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 80)
  name!: string;

  @IsString()
  @Length(10, 1000)
  prompt!: string;

  @IsString()
  @Length(1, 64)
  promptVersion!: string;

  /** Validated by the Store Definition pipeline in the service, not here. */
  @IsObject()
  definition!: Record<string, unknown>;
}
