import { Exclude, Expose, Transform, Type } from "class-transformer";
// import { ReadOfficeDto } from "src/offices/dto/read-office.dto";

@Exclude()
export class ReadWorkerDto {
  
  @Expose()
  readonly _id!: string;

  @Expose()
  readonly name!: string;

  @Expose()
  readonly birthDate!: string;

  @Expose()
  readonly document!: string;

  @Expose()
  readonly documentType!: string;

  @Expose()
  readonly mobileNumber!: string;

  @Expose()
  readonly address!: string;

  @Expose()
  readonly email!: string;

  @Expose()
  readonly officeId!: string;

  // @Expose()
  // @Type(() => ReadOfficeDto)
  // readonly office!: ReadOfficeDto;

}