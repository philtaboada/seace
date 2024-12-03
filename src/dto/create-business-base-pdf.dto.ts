import { IsNotEmpty } from "class-validator";

export class CreateBusinessBasePdfDto {

  @IsNotEmpty()
  readonly seaceDataId: string;

  @IsNotEmpty()
  readonly realfilename: string;

}