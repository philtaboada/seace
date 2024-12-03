import { Exclude, Expose, Type } from "class-transformer";
import { ReadWorkerDto } from "./read-worker.dto";

@Exclude()
export class ReadSeaceDataDto {

  @Expose()
  @Type(() => String)
  readonly _id: string;

  @Expose()
  readonly bidder: string|null;

  @Expose()
  readonly convocatoriaId: string;
  
  @Expose()
  readonly buenaProDate: string;

  @Expose()
  readonly convocatoriaDate: string;

  @Expose()
  readonly objetoContratacion: string;

  @Expose()
  readonly momenclatura: string;

  @Expose()
  readonly estado: string;

  @Expose()
  readonly valorReferencial: string;

  @Expose()
  readonly departamento: string;

  @Expose()
  readonly businesses: string[];

  @Expose()
  readonly observations: string;

  @Expose()
  readonly workerId: string;

  @Expose()
  readonly isOfferAtag: boolean;

  @Expose()
  readonly isBaseAtag: boolean;

  @Expose()
  @Type(() => ReadWorkerDto)
  readonly worker: ReadWorkerDto;

}