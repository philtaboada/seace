import { Exclude, Expose } from "class-transformer";
import { Types } from "mongoose";

@Exclude()
export class ReadBusinessOfferPdfDto {

  @Expose()
  readonly _id: Types.ObjectId;

  @Expose()
  readonly filename: string;

  @Expose()
  readonly realfilename: string;

  @Expose()
  readonly filesize: string;

}