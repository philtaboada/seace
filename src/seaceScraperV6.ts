import { Browser, Page } from "puppeteer";
import { AppService } from "./app.service";
import { CreateBusinessBasePdfDto } from "./dto/create-business-base-pdf.dto";
import { CreateBusinessOfferDto } from "./dto/create-business-offer.dto";
import { ReadSeaceDataDto } from "./dto/read-seace-data.dto";

const fs = require("fs");

const departmentos: string[] = [
    'AMAZONAS',
    'ANCASH',
    'APURIMAC',
    'AREQUIPA',
    'AYACUCHO',
    'CAJAMARCA',
    'CALLAO',
    'CUSCO',
    'EXTERIOR',
    'HUANCAVELICA',
    'HUANUCO',
    'ICA',
    'JUNIN',
    'LA LIBERTAD',
    'LAMBAYEQUE',
    'LIMA', // 15
    'LORETO',
    'MADRE DE DIOS',
    'MOQUEGUA',
    'MULTIDEPARTAMENTAL',
    'PASCO',
    'PIURA',
    'PUNO',
    'SAN MARTIN',
    'TACNA',
    'TUMBES',
    'UCAYALI'
];

const objetos: string[] = [
    'BIEN', // 0
    'CONSULTORIA DE OBRA', // 1
    'OBRA', // 2
    'SERVICIO' // 3
];

export class SeaceScraperV6 {

    constructor(
        private readonly appService: AppService,
        private readonly browser: Browser,
    ) { }

    private url: string = 'https://prod2.seace.gob.pe/seacebus-uiwd-pub/buscadorPublico/buscadorPublico.xhtml';
    private ORIGINAL_IMAGE = '/tmp/seace.jpg';
    private OUTPUT_IMAGE = '/tmp/seaceCropped.jpg';
    private downloadPage: Page;

    generateCode() {
        let result = '';
        const characters = '0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }

    delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time)
        });
    }

    cropImage(): Promise<void> {
        const sharp = require('sharp');
        return new Promise((resolve, reject) => {
            sharp(this.ORIGINAL_IMAGE).extract({ width: 200, height: 45, left: 250, top: 520 }).toFile(this.OUTPUT_IMAGE).then(function (new_file_info: any) {
                resolve();
            }).catch(error => {
                reject(error.message);
            });
        });
    }

    getNewDownloadName(lastFileName: string): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let index = 0;
            const interval = setInterval(async () => {
                index++;
                await this.downloadPage.bringToFront();
                const endFileName = await this.downloadPage.evaluate(() => {
                    const dm = document.querySelector('downloads-manager').shadowRoot;
                    const items = dm.querySelectorAll('downloads-item');
                    if (items[0]) {
                        return (items[0] as any).__data.data.fileName;
                    } else {
                        return '';
                    }
                });
                if (lastFileName != endFileName) {
                    const fileName = await this.downloadPage.evaluate(() => {
                        const dm = document.querySelector('downloads-manager').shadowRoot;
                        const items = dm.querySelectorAll('downloads-item');
                        return (items[0] as any).__data.data.fileName;
                    });
                    clearInterval(interval);
                    resolve(fileName);
                }
                if (index > 30) {
                    clearInterval(interval);
                    reject('Error esperando archivo');
                }
            }, 1000);
        });
    }

    async getLastFileName(): Promise<string> {
        return await this.downloadPage.evaluate(() => {
            const dm = document.querySelector('downloads-manager').shadowRoot;
            const items = dm.querySelectorAll('downloads-item');
            if (items[0]) {
                return (items[0] as any).__data.data.fileName;
            } else {
                return '';
            }
        });
    }

    checkDownloads() {
        return new Promise(async (resolve, reject) => {
            const isDownloading = await this.downloadPage.evaluate(() => {
                const dm = document.querySelector('downloads-manager').shadowRoot;
                const items = dm.querySelectorAll('downloads-item');
                if (items) {
                    let isDownloading = false;
                    for (let index = 0; index < items.length; index++) {
                        const item: any = items[index];
                        if (item.__data.showProgress_) {
                            isDownloading = true;
                            break;
                        }
                    }
                    return isDownloading;
                } else {
                    return false;
                }
            });
            if (isDownloading === false) {
                resolve(true);
            } else {
                const intervalId = setInterval(async () => {
                    const isDownloading = await this.downloadPage.evaluate(() => {
                        const dm = document.querySelector('downloads-manager').shadowRoot;
                        const items = dm.querySelectorAll('downloads-item');
                        if (items) {
                            let isDownloading = false;
                            for (let index = 0; index < items.length; index++) {
                                const item: any = items[index];
                                if (item.__data.showProgress_) {
                                    isDownloading = true;
                                    break;
                                }
                            }
                            return isDownloading;
                        } else {
                            return false;
                        }
                    });
                    if (isDownloading === false) {
                        clearInterval(intervalId);
                        resolve(true);
                    }
                }, 5000);
            }
        });
    }

    async scrapPage(
        departamento: string,
        objetoContratacion: string,
        countPages: number,
    ) {
        for (let index = 0; index < countPages; index++) {
            const page = await this.browser.newPage();
            let seaceError: any = {};

            try {
                await page.goto(this.url);
            } catch (error) {
                console.log('Error al cargar la pagina');
                page.close();
                continue;
            }

            try {
                seaceError = await page.evaluate((index: number) => {
                    const tr = document.querySelectorAll("[id='tbBuscador:idFormBuscarProceso:dtProcesos_data'] tr")[index];
                    const td = tr.querySelectorAll("td")[12];
                    const momenclatura = tr.querySelectorAll("td")[3].innerHTML;
                    const publicacionDateString = tr.querySelectorAll("td")[2].innerHTML;
                    const valorReferencial = tr.querySelectorAll("td")[9].innerHTML;
                    let publicacionDate = null;
                    if (publicacionDateString) {
                        const publicacionDateParts = publicacionDateString.slice(0, 10).split("/");
                        publicacionDate = `${publicacionDateParts[1]}/${publicacionDateParts[0]}/${publicacionDateParts[2]}`;
                    }
                    const a = td.querySelectorAll("a")[1];
                    a.click();
                    return {
                        momenclatura,
                        publicacionDate,
                        valorReferencial
                    }
                }, index);
            } catch (error) {
                console.log('Error al acceder a la pagina');
                page.close();
                continue;
            }

            try {
                await page.waitForSelector("[id='tbFicha:dtCronograma_data']", { timeout: 20000 });
                await this.delay(1000);
            } catch (error) {
                console.log('Error al esperar Cronograma');
                page.close();
                continue;
            }

            try {
                const data: any = await page.evaluate(async () => {
                    if (document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr").length <= 1) {
                        throw new Error("No se encontraron datos");
                    }
                    let bidder = null;
                    let bidderRuc = null;
                    let bidderTrs = document.querySelectorAll("[id='tbFicha:idGridLstItems:0:dtParticipantes_data'] tr");
                    if (bidderTrs.length) {
                        let bidderTds = document.querySelectorAll("[id='tbFicha:idGridLstItems:0:dtParticipantes_data'] tr")[0].querySelectorAll('td');
                        if (bidderTds.length > 1) {
                            let bidderString = bidderTds[0].querySelector('span').innerHTML;
                            bidderRuc = bidderString.substring(0, 9);
                            if (bidderRuc === 'CONSORCIO') {
                                bidder = bidderString.substring(12, bidderString.length);
                            } else {
                                bidder = bidderString.substring(14, bidderString.length);
                            }
                        }
                    }
                    let convocatoriaDateString = (document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[0].querySelectorAll('td')[1] as any).getInnerHTML().slice(0, 10);

                    let buenaProSelector = document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[7];
                    let buenaProDateString = '';

                    if (buenaProSelector) {
                        buenaProDateString = (document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[7].querySelectorAll('td')[1] as any).getInnerHTML().slice(0, 10);
                    } else {
                        buenaProSelector = document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[3];
                        if (buenaProSelector) {
                            buenaProDateString = (document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[3].querySelectorAll('td')[1] as any).getInnerHTML().slice(0, 10);
                        } else {
                            buenaProSelector = document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[2];
                            if (buenaProSelector) {
                                buenaProDateString = (document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[2].querySelectorAll('td')[1] as any).getInnerHTML().slice(0, 10);
                            } else {
                                throw new Error("No se encontro fecha de otorgamiento");
                            }
                        }
                    }

                    //let convocatoriaId = null;
                    let momenclatura = null;
                    for (let index = 0; index < 9999; index++) {
                        const tmpConvocatoriaId = document.querySelector(`[id='tbFicha:j_idt${index}'] tbody`);
                        if (tmpConvocatoriaId && tmpConvocatoriaId.children.length === 5) {
                            try {
                                //convocatoriaId = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[1].querySelectorAll('td')[1] as any).getInnerHTML();
                                momenclatura = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[0].querySelectorAll("td")[1] as any).getInnerHTML();
                            } catch (error) {

                            }
                        }
                        if (tmpConvocatoriaId && tmpConvocatoriaId.children.length === 6) {
                            try {
                                //convocatoriaId = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[1].querySelectorAll('td')[1] as any).getInnerHTML();
                                momenclatura = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[0].querySelectorAll("td")[1] as any).getInnerHTML();
                            } catch (error) {

                            }
                        }
                        // if (convocatoriaId && momenclatura) {
                        //     break
                        // }
                        if (momenclatura) {
                            break
                        }
                    }

                    let valorReferencial = null;
                    let convocatoriaId = null;
                    for (let index = 0; index < 9999; index++) {
                        const tmpValorReferencial = document.querySelector(`[id='tbFicha:j_idt${index}'] tbody`);
                        if (tmpValorReferencial && tmpValorReferencial.children.length === 8) {
                            try {
                                const position = document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`).length;

                                valorReferencial = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[2].querySelectorAll("td")[1].querySelector("span") as any).getInnerHTML();

                                convocatoriaId = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[position - 2].querySelectorAll("td")[1] as any).getInnerHTML();

                            } catch (error) {

                            }
                        }
                        if (tmpValorReferencial && tmpValorReferencial.children.length === 9) {
                            try {
                                const position = document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`).length;
                                valorReferencial = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[2].querySelectorAll("td")[1].querySelector("span") as any).getInnerHTML();
                                convocatoriaId = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[position - 3].querySelectorAll("td")[1] as any).getInnerHTML();
                            } catch (error) {

                            }
                        }
                        if (valorReferencial && convocatoriaId) {
                            break
                        }
                    }

                    const estado = (document.querySelector("[id='tbFicha:idGridLstItems_content']")?.querySelectorAll("tr")[0].querySelectorAll("tr")[3].querySelectorAll("td")[7] as any).getInnerHTML();
                    //const convocatoriaId = (document.querySelector("[id='tbFicha:idGridLstItems_content']")?.querySelectorAll("tr")[0].querySelectorAll("tr")[2].querySelectorAll("td")[1] as any).getInnerHTML();
                    //const convocatoriaId = (document.querySelector("[id='tbFicha:idGridLstItems_content']")?.querySelectorAll("tr")[0].querySelectorAll("tr")[3].querySelectorAll("td")[1] as any).getInnerHTML();

                    const ok = (document.querySelectorAll("[id='tbFicha:idGridLstItems:0:dtParticipantes_data'] tr")[0].querySelectorAll("td")[0] as any).getInnerHTML() !== 'No se encontraron Datos';

                    const businesses: string[] = [];

                    if (ok) {
                        const trs = document.querySelectorAll("[id='tbFicha:idGridLstItems:0:dtParticipantes_data'] tr");
                        for (const tr of trs) {
                            const businessName = (tr.querySelectorAll("td")[0].querySelector("span") as any).getInnerHTML();
                            businesses.push(businessName);
                        }
                    }

                    const buenaProDateParts = buenaProDateString.split("/");
                    const buenaProDate = `${buenaProDateParts[1]}/${buenaProDateParts[0]}/${buenaProDateParts[2]}`;

                    const convocatoriaDateParts = convocatoriaDateString.split("/");
                    const convocatoriaDate = `${convocatoriaDateParts[1]}/${convocatoriaDateParts[0]}/${convocatoriaDateParts[2]}`;
                    const aTags = document.querySelectorAll('a');

                    let isOfferAtag = false;

                    for (const aTag of aTags) {
                        if (aTag.innerHTML === 'Ver Ofertas Presentadas') {
                            isOfferAtag = true;
                        }
                    }

                    let isBaseAtag = false;

                    const documentTrs = document.querySelectorAll("[id='tbFicha:dtDocumentos_data'] tr");
                    for (let index = 0; index < documentTrs.length; index++) {
                        const tds = documentTrs[index].querySelectorAll('td');
                        if (tds[2].innerHTML === 'Bases Integradas') {
                            isBaseAtag = true;
                        }
                    }

                    // ConvocatoriaId ya no existe ahora se usara el codigo CUBSO dentro de convocatoriaId, no se usará el codigo CUBSO
                    // se usará la fecha y hora juntada como un string

                    return {
                        bidder,
                        bidderRuc,
                        buenaProDate,
                        convocatoriaDate,
                        convocatoriaId,
                        momenclatura,
                        valorReferencial,
                        estado,
                        businesses,
                        isOfferAtag,
                        isBaseAtag,
                    };
                });

                Object.assign(data, { departamento, objetoContratacion, publicacionDate: new Date(seaceError.publicacionDate) });
                console.log(`${data.momenclatura}\t\t${data.valorReferencial}`);
                console.log(data.estado);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const oldDate = new Date();
                oldDate.setHours(0, 0, 0, 0);
                oldDate.setDate(oldDate.getDate() - 10);
                const buenaProdDate = new Date(data.buenaProDate);
                buenaProdDate.setHours(0, 0, 0, 0);

                if (data.estado === 'Adjudicado' || data.estado === 'Consentido' || data.estado === 'Contratado') {
                    try {
                        page.evaluate(() => {
                            (document.querySelector("[id='tbFicha:idGridLstItems:0:btnAcciones']") as any).click();
                        });
                        await page.waitForNavigation();
                        await page.waitForSelector("[id='frmListaAccionItem:dsAccionesItems_data'] tr");
                        const adjudicadoDateString = await page.evaluate(() => {
                            const trs = document.querySelectorAll("[id='frmListaAccionItem:dsAccionesItems_data'] tr");
                            for (let index = 0; index < trs.length; index++) {
                                const tr = trs[index];
                                const tds = tr.querySelectorAll('td');
                                const state = tds[1].querySelector('span').innerHTML
                                if (state === 'Adjudicado' || state === 'Adjudicar' || state === 'Empate' || state === 'Resultado' || state === 'Reducir') {
                                    return tds[2].querySelector('span').innerHTML;
                                }
                            }
                        });

                        if (adjudicadoDateString) {
                            const adjudicadoDateParts = adjudicadoDateString.split("/");
                            //data.adjudicadoDate = adjudicadoDateParts
                            data.adjudicadoDate = `${adjudicadoDateParts[1]}/${adjudicadoDateParts[0]}/${adjudicadoDateParts[2]}`;
                        }

                        await page.goBack();
                    } catch (error) {
                        console.log('Error evaluando fecha de adjudicacion');
                        console.log(error);
                    }
                }

                //const createdSeaceData = await this.appService.create(data);

                if (data.estado === 'Adjudicado' || data.estado === 'Consentido' || data.estado === 'Contratado') {
                    if (data.convocatoriaId !== '' && data.convocatoriaId !== null) {
                        console.log('creando porque tiene convocatoriaId');

                        if (data.valorReferencial) {
                            if (data.valorReferencial === '---') {
                                console.log('creando porque tiene valorReferencial === \'---\'');
                                await this.appService.create(data);
                                return;
                            } else {
                                data.valorReferencial = Number(data.valorReferencial.replace(/,/g, '.').replace(/\./g, '').replace(/(\d)(?=(\d{2})$)/, '$1.').replace(/\.00$/, ''))
                                console.log(data.adjudicadoDate);

                                if (data.valorReferencial >= 200000) {
                                    // Volver a string el valorReferencial
                                    data.valorReferencial = data.valorReferencial.toLocaleString('en-US');
                                    console.log('creando porque tiene valorReferencial >= 200000', data.valorReferencial);
                                    if (typeof(data.valorReferencial) === 'string') {
                                        console.log('Se agrega a la base de datos como string, el texto tiene que se rlarog para saber si se sube a la base de datos o no', data.valorReferencial);
                                        await this.appService.create(data);
                                    }
                                } else {
                                    console.log('No se crea porque no tiene valorReferencial >= 200000');
                                }
                            }
                        }

                    }

                    // if (data.isBaseAtag && buenaProdDate.getTime() > oldDate.getTime()) {
                    //     console.log('Scrap Base');

                    //     // await this.scrapBase(page, createdSeaceData);
                    //     await this.appService.create(data);
                    // }

                    // if (data.isOfferAtag && buenaProdDate.getTime() > oldDate.getTime()) {
                    //     console.log('Scrap Offers');
                    //     // await this.scrapOffers(page, createdSeaceData);
                    //     await this.appService.create(data);
                    // }
                }

            } catch (error) {
                console.log('Error evaluando pagina');
                console.log(error.message);
                Object.assign(seaceError, {
                    message: error.message,
                    departamento,
                    objetoContratacion
                });
                this.appService.createError(seaceError);
            }
            page.close();
        }
    }

    scrapBase(page: Page, seaceData: ReadSeaceDataDto) {
        return new Promise(async (resolve, reject) => {
            const files = fs.readdirSync('/home/sistemas/Downloads');
            await this.downloadPage.bringToFront();
            const foundBusinessBasePdf = await this.appService.getBusinessBasePdf(seaceData._id);
            const lastFileName = await this.getLastFileName();
            if (foundBusinessBasePdf) {
                if (files.includes(foundBusinessBasePdf.realfilename) === false) {
                    page.evaluate(() => {
                        const documentTrs = document.querySelectorAll("[id='tbFicha:dtDocumentos_data'] tr");
                        for (let index = 0; index < documentTrs.length; index++) {
                            const tds = documentTrs[index].querySelectorAll('td');
                            if (tds[2].innerHTML === 'Bases Integradas') {
                                const aTags = tds[3].querySelectorAll('a');
                                for (let indexAtag = 0; indexAtag < aTags.length; indexAtag++) {
                                    console.log(aTags[indexAtag]);
                                    if (aTags[indexAtag].childElementCount) {
                                        aTags[indexAtag].click();
                                    }
                                }
                            }
                        }
                    });
                    await this.getNewDownloadName(lastFileName).then(realfilename => {
                        console.log('REAL: ' + realfilename);
                        const createdBusinessBasePdf: CreateBusinessBasePdfDto = {
                            seaceDataId: seaceData._id,
                            realfilename
                        };
                        this.appService.createBusinessBasePdf(createdBusinessBasePdf);
                    }).catch(console.log);
                }
                resolve(true);
            } else {
                page.evaluate(() => {
                    const documentTrs = document.querySelectorAll("[id='tbFicha:dtDocumentos_data'] tr");
                    for (let index = 0; index < documentTrs.length; index++) {
                        const tds = documentTrs[index].querySelectorAll('td');
                        if (tds[2].innerHTML === 'Bases Integradas') {
                            const aTags = tds[3].querySelectorAll('a');
                            for (let indexAtag = 0; indexAtag < aTags.length; indexAtag++) {
                                console.log(aTags[indexAtag]);
                                if (aTags[indexAtag].childElementCount) {
                                    aTags[indexAtag].click();
                                }
                            }
                        }
                    }
                });
                await this.getNewDownloadName(lastFileName).then(realfilename => {
                    console.log('REAL: ' + realfilename);
                    const createdBusinessBasePdf: CreateBusinessBasePdfDto = {
                        seaceDataId: seaceData._id,
                        realfilename
                    };
                    this.appService.createBusinessBasePdf(createdBusinessBasePdf);
                }).catch(console.log);
                resolve(true);
            }
        });
    }

    scrapOffers(page: any, seaceData: ReadSeaceDataDto) {
        return new Promise(async (resolve, reject) => {
            page.waitForNavigation().then(async () => {
                try {
                    await page.waitForSelector("[id^='frmListaPresentacionExpIntOfertas'] a");
                    const businessOffers: CreateBusinessOfferDto[] = await page.evaluate(() => {
                        const trs = document.querySelectorAll('table')[2].querySelectorAll('tr');
                        const businessOffers = [];
                        for (let index = 1; index < trs.length; index++) {
                            const tds = trs[index].querySelectorAll('td');
                            const seaceBusinessOffer = {
                                ruc: tds[1].querySelector('span').innerHTML,
                                name: tds[2].querySelector('span').innerHTML,
                                presentationAt: tds[3].querySelector('span').innerHTML,
                            }
                            businessOffers.push(seaceBusinessOffer);
                        }
                        return businessOffers;
                    });
                    for (let index = 0; index < businessOffers.length; index++) {
                        await new Promise(async (resolve, reject) => {
                            const businessOffer = businessOffers[index];
                            const businessOfferDateParts = businessOffer.presentationAt.split("/");
                            businessOffer.presentationAt = `${businessOfferDateParts[1]}/${businessOfferDateParts[0]}/${businessOfferDateParts[2]}`;
                            const createdBusinessOffer = await this.appService.createBusinessOffer(businessOffer, seaceData._id.toString());
                            const ok = await page.evaluate(async index => {
                                let aTag = document.querySelectorAll('table')[2].querySelectorAll('a')[index];
                                if (aTag) {
                                    aTag.click();
                                    return true;
                                } else {
                                    return false;
                                }
                            }, index);

                            if (ok) {
                                try {
                                    await page.waitForSelector("[id='frmDetalleListaPresentacionExpIntOfertas:dtListaArchivosOfertas_data'] a");
                                    const businessOfferPdfs = await page.evaluate(async () => {
                                        const trTags = document.querySelectorAll("[id='frmDetalleListaPresentacionExpIntOfertas:dtListaArchivosOfertas_data'] tr");
                                        const businessOfferPdfs = [];
                                        for (let index = 0; index < trTags.length; index++) {
                                            const tds = trTags[index].querySelectorAll('td');
                                            const createdBusinessOfferPdf = {
                                                filename: tds[1].querySelector('span').innerHTML,
                                                filesize: tds[3].innerHTML
                                            }
                                            businessOfferPdfs.push(createdBusinessOfferPdf);
                                        }
                                        return businessOfferPdfs;
                                    });
                                    const files = fs.readdirSync('/home/sistemas/Downloads');
                                    for (let index = 0; index < businessOfferPdfs.length; index++) {
                                        const businessOfferPdf = businessOfferPdfs[index];
                                        const foundBusinessOfferPdf = await this.appService.getBusinessOfferPdf(businessOfferPdf, createdBusinessOffer._id.toString());
                                        await this.downloadPage.bringToFront();
                                        const lastFileName = await this.getLastFileName();
                                        console.log(businessOfferPdf.filename);
                                        if (foundBusinessOfferPdf === null) {
                                            page.evaluate(index => {
                                                const trTags = document.querySelectorAll("[id='frmDetalleListaPresentacionExpIntOfertas:dtListaArchivosOfertas_data'] tr");
                                                const aTags = trTags[index].querySelectorAll('a');

                                                for (let index = 0; index < aTags.length; index++) {
                                                    const aTag = aTags[index];
                                                    if (aTag.childNodes.length) {
                                                        aTag.click();
                                                    }
                                                }
                                            }, index);
                                            await this.getNewDownloadName(lastFileName).then(realfilename => {
                                                console.log('REAL: ' + realfilename);
                                                businessOfferPdf.realfilename = realfilename;
                                                this.appService.createBusinessOfferPdf(businessOfferPdf, seaceData._id.toString(), createdBusinessOffer._id.toString());
                                            }).catch(console.log);
                                        } else {
                                            console.log('REALEXIST: ' + foundBusinessOfferPdf.realfilename);
                                            const ok = files.find(e => e.includes(foundBusinessOfferPdf.realfilename));
                                            if (!ok) {
                                                page.evaluate(index => {
                                                    const trTags = document.querySelectorAll("[id='frmDetalleListaPresentacionExpIntOfertas:dtListaArchivosOfertas_data'] tr");
                                                    const aTags = trTags[index].querySelectorAll('a');

                                                    for (let index = 0; index < aTags.length; index++) {
                                                        const aTag = aTags[index];
                                                        if (aTag.childNodes.length) {
                                                            aTag.click();
                                                        }
                                                    }
                                                }, index);
                                                await this.getNewDownloadName(lastFileName).then(realfilename => {
                                                    businessOfferPdf.realfilename = realfilename;
                                                    this.appService.updateBusinessOfferPdf(businessOfferPdf, foundBusinessOfferPdf._id.toString());
                                                }).catch(console.log);
                                            }
                                        }
                                    }
                                } catch (error) {
                                    console.log(error.message);
                                    console.log('Error esperando los Pdfs');
                                }
                                try {
                                    await page.goBack();
                                } catch (error) {
                                    console.log('Error regresando a las ofertas');
                                    resolve(true);
                                }
                            }
                            resolve(true);
                        });
                    }
                    resolve(true);
                } catch (error) {
                    console.log('Error evaluando tabla de proveedores');
                    resolve(true);
                }
            }).catch(() => resolve(true));

            await page.evaluate(() => {
                const aTags = document.querySelectorAll('a');
                let constructionAtag = null;

                for (const aTag of aTags) {
                    if (aTag.innerHTML === 'Ver Ofertas Presentadas') {
                        constructionAtag = aTag;
                    }
                }

                if (constructionAtag) {
                    constructionAtag.click();
                }
            });
        });
    }

    getRandomArbitrary(min: number, max: number) {
        const random = Math.random() * (max - min) + min
        return Math.trunc(random)
    }

    async startScrap(
        objetoIndex: number,
        departamentoIndex: number,
        yearIndex: number
    ): Promise<void> {
        this.downloadPage = await this.browser.newPage()
        this.downloadPage.goto('chrome://downloads/')
        const objetoContratacion = objetos[objetoIndex]
        const departamento = departmentos[departamentoIndex]
        return new Promise(async (resolve, reject) => {
            setTimeout(async () => {
                await this.checkDownloads()
                return reject('Navegador congelado por mas de 30 min')
            }, 1000 * 60 * 30)
            const code = this.generateCode()
            this.ORIGINAL_IMAGE = `/tmp/${code}.jpg`
            this.OUTPUT_IMAGE = `/tmp/${code}_scrop.jpg`
            const mainPage = await this.browser.newPage()
      
            try {
                await mainPage.goto(this.url, {timeout: 1000 * 60 * 5})
                let startCaptcha = false
                let pageIndex = 0
                mainPage.on('response', async (response: any) => {
                    const req = response.request()
                    const orig = req.url()
                    if (orig.includes('https://prod2.seace.gob.pe/seacebus-uiwd-pub/buscadorPublico/buscadorPublico.xhtml')) {
                        if (startCaptcha) {
                            let text = ''
                            try {
                                text = await response.text()
                            } catch (error) {

                            }
                            if (text.includes('Por favor actualice el navegador')) {
                                console.log('Detectados por el capcha');
                                const random = this.getRandomArbitrary(1, 20)
                                await this.delay(1000 * random)
                                const refreshPage = await this.browser.newPage()
                                await refreshPage.goto(this.url)
                                await mainPage.evaluate(() => {
                                    const buttonSubmit: any = document.querySelector("[id^='tbBuscador:idFormBuscarProceso:btnBuscarSel']")
                                    buttonSubmit.click()
                                })
                            } else {
                                startCaptcha = false
                                await this.delay(3000)
                                const countPages = await mainPage.evaluate(() => {
                                    const trs = document.querySelectorAll("[id='tbBuscador:idFormBuscarProceso:dtProcesos_data'] tr")
                                    return trs.length
                                })
                                await this.scrapPage(departamento, objetoContratacion, countPages)
                                if (countPages < 15) {
                                    await this.checkDownloads()
                                    return resolve()
                                }
                                pageIndex++
                                mainPage.evaluate(() => {
                                    const button: HTMLButtonElement = document.querySelector('.ui-paginator-next')
                                    button.click()
                                })
                            }
                        }
                        startCaptcha = true
                    }
                })

                const found = (await mainPage.content()).match(new RegExp('No se encontraron Datos', 'i'))
                await mainPage.waitForSelector("[id='tbBuscador:idFormBuscarProceso:anioConvocatoria_panel']")

                if (found) {
                    await mainPage.evaluate((obj: any) => {
                        let objectSelector = null
                        let objectSelectorIndex = 0
                        while (objectSelector === null) {
                            const objectSelectorTmp = document.querySelector(`[id='tbBuscador:idFormBuscarProceso:j_idt${objectSelectorIndex}_panel']`)
                            if (objectSelectorTmp && objectSelectorTmp.querySelectorAll("li").length === 5) {
                                objectSelector = document.querySelector(`[id='tbBuscador:idFormBuscarProceso:j_idt${objectSelectorIndex}_panel']`)
                            }
                            objectSelectorIndex++
                        }
                        (objectSelector.querySelectorAll("li")[obj.objetoIndex + 1] as any).click()
                        try {
                            const yearSelector: any = document.querySelectorAll("[id='tbBuscador:idFormBuscarProceso:anioConvocatoria_panel'] li")[obj.yearIndex]
                            this.delay(2000)
                            yearSelector.click()
                        } catch (error) {
                            console.log('Error al escoger el año 2024')
                            console.log(error)
                        }
                        (document.querySelectorAll("[id='tbBuscador:idFormBuscarProceso:departamento_panel'] li")[obj.departamentoIndex + 1] as any).click()
                        const buttonSubmit: any = document.querySelector("[id^='tbBuscador:idFormBuscarProceso:btnBuscarSel']")
                        buttonSubmit.click()
                    }, { objetoIndex, departamentoIndex, yearIndex })
                }
            } catch (error) {
                if (error instanceof Error) {
                    console.log(error.message)
                    reject(error.message)
                }
            }
        })
    }
}
