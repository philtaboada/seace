import { IsNotEmpty } from "class-validator";

export class CreateBusinessOfferPdfDto {

  @IsNotEmpty()
  readonly seaceDataId: string;

  @IsNotEmpty()
  readonly businessOfferId: string;

  @IsNotEmpty()
  readonly filename: string;

  @IsNotEmpty()
  readonly filesize: string;

  @IsNotEmpty()
  readonly contentType: string;

}