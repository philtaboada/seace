import { Exclude, Expose } from "class-transformer";
import { Types } from "mongoose";

@Exclude()
export class ReadBusinessOfferDto {

  @Expose()
  readonly _id: Types.ObjectId;

  @Expose()
  readonly ruc: string;

  @Expose()
  readonly name: string;

  @Expose()
  readonly presentationAt: string;

}