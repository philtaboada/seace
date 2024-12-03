import { IsNotEmpty } from "class-validator";

export class CreateBusinessOfferDto {

  @IsNotEmpty()
  readonly ruc: string;

  @IsNotEmpty()
  readonly name: string;

  @IsNotEmpty()
  presentationAt: string;

}