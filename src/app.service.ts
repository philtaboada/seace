import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { Model } from 'mongoose';
import { Business, BusinessDocument } from './business.schema';
import { ReadSeaceDataDto } from './dto/read-seace-data.dto';
import { ReadSeaceErrorDto } from './dto/read-seace-error.dto';
import { UpdateSeaceDataDto } from './dto/update-seace-data.dto';
import { SeaceDataModel } from './seace-data.model';
import { SeaceData, SeaceDataDocument } from './seace-data.schema';
import { SeaceErrorModel } from './seace-error.model';
import { SeaceError, SeaceErrorDocument } from './seace-error.schema';
import { Worker, WorkerDocument } from './worker.schema';
import { StateSeace, StateSeaceDocument } from './stateSeace.schema';
import { ReadBusinessOfferDto } from './dto/read-business-offer.dto';
import { BusinessOffer, BusinessOfferDocument } from './business-offer.schema';
import { BusinessOfferPdf, BusinessOfferPdfDocument } from './business-offer-pdf.schema';
import { CreateBusinessOfferDto } from './dto/create-business-offer.dto';
import { CreateBusinessOfferPdfDto } from './dto/create-business-offer-pdf.dto';
import { ReadBusinessOfferPdfDto } from './dto/read-business-offer-pdf.dto';
import { Response } from 'express';
import { BusinessBasePdf, BusinessBasePdfDocument } from './business-base-pdf.schema';
import { ReadBusinessBasePdfDto } from './dto/read-business-base-pdf.dto';
import { CreateBusinessBasePdfDto } from './dto/create-business-base-pdf.dto';
import { SeaceUpdate, SeaceUpdateDocument } from './seace-update.schema';
const fs = require("fs");

@Injectable()
export class AppService {

    constructor(
        @InjectModel(SeaceData.name)
        private readonly seaceDataModel: Model<SeaceDataDocument>,
        @InjectModel(SeaceUpdate.name)
        private readonly seaceUpdateModel: Model<SeaceUpdateDocument>,
        @InjectModel(BusinessOffer.name)
        private readonly businessOfferModel: Model<BusinessOfferDocument>,
        @InjectModel(BusinessOfferPdf.name)
        private readonly businessOfferPdfModel: Model<BusinessOfferPdfDocument>,
        @InjectModel(BusinessBasePdf.name)
        private readonly businessBasePdfModel: Model<BusinessBasePdfDocument>,
        @InjectModel(StateSeace.name)
        private readonly stateSeaceModel: Model<StateSeaceDocument>,
        @InjectModel(SeaceError.name)
        private readonly seaceErrorModel: Model<SeaceErrorDocument>,
        @InjectModel(Business.name)
        private readonly businessModel: Model<BusinessDocument>,
        @InjectModel(Worker.name)
        private readonly workerModel: Model<WorkerDocument>,
    ) { }

    getHello(): string {
        return 'Hello World!';
    }

    async checkFiles() {
        const files = fs.readdirSync('/home/sistemas/Downloads');
        const purgeFiles = files.map(e => e.substring(0, e.length - 24));
        const foundBusinessOfferPdfs = await this.businessOfferPdfModel.find();
        foundBusinessOfferPdfs.forEach(e => e.filename.replace(/ /g, '_'));
        const filterBusinessOfferPdfs = [];
        foundBusinessOfferPdfs.forEach(e => {
            const filename = e.filename.substring(0, e.filename.length - 4).replace(/ /g, '_');
            if (purgeFiles.includes(filename)) {
                filterBusinessOfferPdfs.push(e);
            }
        });
        await this.businessOfferPdfModel.updateMany({ _id: { $in: filterBusinessOfferPdfs.map(e => e._id) } }, { isFileExist: true });
        return filterBusinessOfferPdfs.length;
    }

    createdDate(file) {
        const { birthtime } = fs.statSync(file);
        return birthtime;
    }

    async deleteFiles() {
        const files = fs.readdirSync('/home/sistemas/Downloads');
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - 20);
        for (const file of files) {
            const createdAt = this.createdDate('/home/sistemas/Downloads/' + file);
            if (createdAt.getTime() < date.getTime()) {
                fs.unlink('/home/sistemas/Downloads/' + file, (error: any) => {
                    if (error) {
                        console.log(error);
                    }
                });
            }
        }
    }

    async getStateSeace(yearIndex: number): Promise<any> {
        return await this.stateSeaceModel.findOne({ yearIndex }) || { objetoIndex: 0, departamentoIndex: 0, yearIndex };
    }

    async updateStateSeace(objetoIndex: number, departamentoIndex: number, yearIndex: number): Promise<void> {
        await this.stateSeaceModel.updateOne({ yearIndex }, { objetoIndex, departamentoIndex , yearIndex }, { upsert: true });
    }

    async getFile(businessOfferPdfId: string, res: Response) {
        const businessOfferPdf = await this.businessOfferPdfModel.findOne({ _id: businessOfferPdfId });
        const files = fs.readdirSync('/tmp');
        console.log(businessOfferPdf);
        const filename = businessOfferPdf.filename.substring(0, businessOfferPdf.filename.length - 4).replace(/ /g, '_');
        const realfilename = files.find(e => e.includes(filename));
        if (realfilename) {
            res.download('/home/sistemas/Downloads/' + realfilename);
        } else {
            res.status(404).end();
        }
    }

    async getCountSeaceDatas(
        startDate: string,
        endDate: string,
        estado: string,
        objetoContratacion: string,
        departamento: string,
        isCustomer: boolean,
        workerId: string
    ): Promise<number> {
        const query: any = {};

        if (startDate && endDate) {
            const sd = new Date(startDate);
            const ed = new Date(endDate);
            sd.setHours(0, 0, 0, 0);
            ed.setHours(0, 0, 0, 0);
            ed.setDate(ed.getDate() + 1);
            query.buenaProDate = { $gte: sd, $lt: ed };
        }

        if (estado) {
            query.estado = estado;
        }

        if (objetoContratacion) {
            query.objetoContratacion = objetoContratacion;
        }

        if (departamento) {
            query.departamento = departamento;
        }

        if (isCustomer) {
            const foundBusinesses = await this.businessModel.find({}, { document: 1 });
            const rucs = foundBusinesses.map(e => new RegExp(e.document, 'i')).flat();
            query.businesses = { $in: rucs };
        }

        if (workerId) {
            query.workerId = workerId;
        }

        return this.seaceDataModel.countDocuments(query);
    }

    async getCountSeaceErrors() {
        return await this.seaceErrorModel.countDocuments();
    }

    async getSeaceErrorsByPage(
        pageIndex: number,
        pageSize: number,
    ): Promise<ReadSeaceErrorDto[]> {
        const foundSeaceDatas = await this.seaceErrorModel.find()
            .skip((pageSize * pageIndex) - pageSize)
            .limit(pageSize)
            .sort('-createdAt');

        return plainToInstance(ReadSeaceErrorDto, foundSeaceDatas.map(e => e.toObject()));
    }

    async getSeaceDatasByPage(
        pageIndex: number,
        pageSize: number,
        startDate: string | null,
        endDate: string | null,
        estado: string | null,
        objetoContratacion: string | null,
        departamento: string | null,
        isCustomer: boolean,
        workerId: string
    ): Promise<ReadSeaceDataDto[]> {
        const query: any = {};

        if (startDate && endDate) {
            const sd = new Date(startDate);
            const ed = new Date(endDate);
            sd.setHours(0, 0, 0, 0);
            ed.setHours(0, 0, 0, 0);
            ed.setDate(ed.getDate() + 1);
            query.buenaProDate = { $gte: sd, $lt: ed };
        }

        if (estado) {
            query.estado = estado;
        }

        if (objetoContratacion) {
            query.objetoContratacion = objetoContratacion;
        }

        if (departamento) {
            query.departamento = departamento;
        }

        if (isCustomer) {
            const foundBusinesses = await this.businessModel.find({}, { document: 1 });
            const rucs = foundBusinesses.map(e => new RegExp(e.document, 'i')).flat();
            query.businesses = { $in: rucs };
        }

        if (workerId) {
            query.workerId = workerId;
        }

        const foundSeaceDatas = await this.seaceDataModel.find(query).populate({
            path: 'worker', model: this.workerModel
        }).skip((pageSize * pageIndex) - pageSize)
            .limit(pageSize)
            .sort('-buenaProDate');

        return plainToInstance(ReadSeaceDataDto, foundSeaceDatas.map(e => e.toObject()));
    }

    async getSeaceDatasByKey(
        key: string
    ): Promise<any[]> {
        const regExp = new RegExp(key, 'i');
        return this.seaceDataModel.find({ momenclatura: regExp });
    }

    async update(seaceData: UpdateSeaceDataDto, seaceDataId: string): Promise<void> {
        await this.seaceDataModel.updateOne({ _id: seaceDataId }, seaceData);
    }

    async create(seaceData: SeaceDataModel): Promise<ReadSeaceDataDto> {
        const foundSeaceData = await this.seaceDataModel.findOne({
            convocatoriaId: seaceData.convocatoriaId,
            momenclatura: seaceData.momenclatura
          });
          
        if (foundSeaceData) {
            console.log('existe y se actualizará');  
            foundSeaceData.set(seaceData)
            await foundSeaceData.save()
            const createdSeaceUpdate = new this.seaceUpdateModel({ 
                estado: seaceData.estado,
                seaceDataId: foundSeaceData._id, 
            })
            await createdSeaceUpdate.save()
            return plainToInstance(ReadSeaceDataDto, foundSeaceData.toObject());
        } else {
            console.log('creando en la base de datos porque no existe');
            const createdSeaceData = new this.seaceDataModel(seaceData)
            const savedSeaceData = await createdSeaceData.save()
            const createdSeaceUpdate = new this.seaceUpdateModel({ 
                estado: seaceData.estado,
                seaceDataId: savedSeaceData._id, 
            })
            await createdSeaceUpdate.save()
            return plainToInstance(ReadSeaceDataDto, savedSeaceData.toObject())
        }
    }

    async createBusinessOffer(businessOffer: CreateBusinessOfferDto, seaceDataId: string): Promise<ReadBusinessOfferDto> {
        const foundBusinessesOffer = await this.businessOfferModel.findOne({ ruc: businessOffer.ruc, seaceDataId })
        if (foundBusinessesOffer) {
            return plainToInstance(ReadBusinessOfferDto, foundBusinessesOffer.toObject());
        } else {
            const createdBusinessOffer = new this.businessOfferModel({
                seaceDataId,
                ...businessOffer
            });
            const savedBusinessOffer = await createdBusinessOffer.save();
            return plainToInstance(ReadBusinessOfferDto, savedBusinessOffer.toObject());
        }
    }

    async createBusinessOfferPdf(
        businessOfferPdf: CreateBusinessOfferPdfDto,
        seaceDataId: string,
        businessOfferId: string,
    ): Promise<ReadBusinessOfferPdfDto> {
        const createdBusinessOfferPdf = new this.businessOfferPdfModel({
            seaceDataId,
            businessOfferId,
            ...businessOfferPdf
        });
        const savedBusinessOfferPdf = await createdBusinessOfferPdf.save();
        return plainToInstance(ReadBusinessOfferPdfDto, savedBusinessOfferPdf.toObject());
    }

    async updateBusinessOfferPdf(
        businessOfferPdf: CreateBusinessOfferPdfDto,
        businessOfferPdfId: string,
    ): Promise<void> {
        await this.businessOfferPdfModel.updateOne({ _id: businessOfferPdfId }, businessOfferPdf);
    }
we
    async getBusinessOfferPdf(
        businessOfferPdf: CreateBusinessOfferPdfDto,
        businessOfferId: string,
    ): Promise<ReadBusinessOfferPdfDto | null> {
        const foundBusinessesOfferPdf = await this.businessOfferPdfModel.findOne({ filename: businessOfferPdf.filename, businessOfferId });
        if (foundBusinessesOfferPdf) {
            return plainToInstance(ReadBusinessOfferPdfDto, foundBusinessesOfferPdf.toObject());
        } else {
            return null;
        }
    }

    async getBusinessBasePdf(
        seaceDataId: string,
    ): Promise<ReadBusinessBasePdfDto | null> {
        const foundBusinessesBasePdf = await this.businessBasePdfModel.findOne({ seaceDataId });
        if (foundBusinessesBasePdf) {
            return plainToInstance(ReadBusinessBasePdfDto, foundBusinessesBasePdf.toObject());
        } else {
            return null;
        }
    }

    async createBusinessBasePdf(
        businessBasePdf: CreateBusinessBasePdfDto,
    ): Promise<ReadBusinessBasePdfDto> {
        const foundBusinessBasePdf = await this.businessBasePdfModel.findOne({ seaceDataId: businessBasePdf.seaceDataId });
        if (foundBusinessBasePdf) {
            foundBusinessBasePdf.set(businessBasePdf);
            await foundBusinessBasePdf.save();
            return plainToInstance(ReadBusinessBasePdfDto, foundBusinessBasePdf.toObject());
        } else {
            const createdBusinessBasePdf = new this.businessBasePdfModel(businessBasePdf);
            const savedBusinessBasePdf = await createdBusinessBasePdf.save();
            return plainToInstance(ReadBusinessBasePdfDto, savedBusinessBasePdf.toObject());
        }
    }

    async createError(seaceError: SeaceErrorModel) {
        const createdSeaceError = new this.seaceErrorModel(seaceError);
        await createdSeaceError.save();
    }
}
