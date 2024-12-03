import { Exclude, Expose, Type } from "class-transformer";

@Exclude()
export class ReadBusinessBasePdfDto {

  @Expose()
  @Type(() => String)
  readonly _id: string;

  @Expose()
  readonly realfilename: string;

  @Expose()
  readonly seaceDataId: string;

}