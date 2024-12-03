import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateSeaceDataDto {
  
  @IsNotEmpty()
  readonly scheduledAt!: string;

  @IsOptional()
  readonly observations!: string;

  @IsNotEmpty()
  readonly customerId!: string;

  @IsNotEmpty()
  readonly referredId!: string;

  @IsNotEmpty()
  readonly workerId!: string;
  
  @IsNotEmpty()
  readonly specialtyId!: string;

}