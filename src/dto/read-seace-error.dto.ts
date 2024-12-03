import { Exclude, Expose } from "class-transformer";
import { Types } from "mongoose";

@Exclude()
export class ReadSeaceErrorDto {

  @Expose()
  readonly _id: Types.ObjectId;

  @Expose()
  readonly objetoContratacion: string;

  @Expose()
  readonly momenclatura: string;

  @Expose()
  readonly valorReferencial: string;

  @Expose()
  readonly departamento: string;

  @Expose()
  readonly observations: string;

  @Expose()
  readonly createdAt: string;

}