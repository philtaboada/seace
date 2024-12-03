import { IsNotEmpty, IsOptional } from "class-validator";

export class UpdateSeaceDataDto {
  
  @IsNotEmpty()
  readonly workerId!: string;

  @IsOptional()
  readonly observations!: string;

}