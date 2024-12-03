require('dotenv').config();
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Business, BusinessSchema } from './business.schema';
import { SeaceData, SeaceDataSchema } from './seace-data.schema';
import { SeaceError, SeaceErrorSchema } from './seace-error.schema';
import { Worker, WorkerSchema } from './worker.schema';
import { StateSeace, StateSeaceSchema } from './stateSeace.schema';
import { BusinessOffer, BusinessOfferSchema } from './business-offer.schema';
import { BusinessOfferPdf, BusinessOfferPdfSchema } from './business-offer-pdf.schema';
import { BusinessBasePdf, BusinessBasePdfSchema } from './business-base-pdf.schema';
import { SeaceUpdate, SeaceUpdateSchema } from './seace-update.schema';

let seaceString: string;
let horviString: string;

if (process.env.NODE_ENV === 'production') {
    horviString = process.env.DB_HOST || '';
    seaceString = process.env.DB_SEACE || '';
} else {
    horviString = process.env.DB_HOST_DEV || '';
    seaceString = process.env.DB_SEACE_DEV || '';
}

console.log(horviString);
console.log(seaceString);
console.log(process.env.NODE_ENV);

@Module({
    imports: [
        MongooseModule.forRoot(seaceString),
        MongooseModule.forRoot(horviString, {
            connectionName: 'horvi',
        }),
        MongooseModule.forFeature([
            { name: SeaceData.name, schema: SeaceDataSchema },
            { name: SeaceUpdate.name, schema: SeaceUpdateSchema },
            { name: BusinessOffer.name, schema: BusinessOfferSchema },
            { name: BusinessOfferPdf.name, schema: BusinessOfferPdfSchema },
            { name: BusinessBasePdf.name, schema: BusinessBasePdfSchema },
            { name: SeaceError.name, schema: SeaceErrorSchema },
            { name: StateSeace.name, schema: StateSeaceSchema },
        ]),
        MongooseModule.forFeature([
            { name: Business.name, schema: BusinessSchema },
            { name: Worker.name, schema: WorkerSchema },
        ], 'horvi'),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
