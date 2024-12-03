import { SeaceDataModel } from "./seace-data.model";
import { AppService } from "./app.service";
import { CreateBusinessOfferDto } from "./dto/create-business-offer.dto";
import { ReadSeaceDataDto } from "./dto/read-seace-data.dto";

const Captcha = require("2captcha");
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

const CAPTCHA_API_KEY = process.env.CAPTCHA_API_KEY;

export class SeaceScraperV3 {

  constructor(
    private readonly appService: AppService,
  ) { }

	private url: string = 'http://procesos.seace.gob.pe/seacebus-uiwd-pub/buscadorPublico/buscadorPublico.xhtml';
  private ORIGINAL_IMAGE = '/tmp/seace.jpg';
  private OUTPUT_IMAGE = '/tmp/seaceCropped.jpg';

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
    return new Promise(function(resolve) { 
      setTimeout(resolve, time)
    });
  }

  cropImage(): Promise<void> {
    const sharp = require('sharp');
    return new Promise((resolve, reject) => {
      sharp(this.ORIGINAL_IMAGE).extract({ width: 200, height: 35, left: 250, top: 500 }).toFile(this.OUTPUT_IMAGE).then(function(new_file_info: any) {
        resolve();
      }).catch(error => {
        reject(error.message);
      });
    });
  }

  getNewDownloadName(downloadPage: any, lastFileName: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let index = 0;
      const interval = setInterval(async () => {
        index++;
        await downloadPage.bringToFront();
        const endFileName = await downloadPage.evaluate(() => {
          const dm = document.querySelector('downloads-manager').shadowRoot;
          const items = dm.querySelectorAll('downloads-item');
          if (items[0]) {
            return (items[0] as any).__data.data.fileName;
          } else {
            return '';
          }
        });
        if (lastFileName != endFileName) {
          const fileName = await downloadPage.evaluate(() => {
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

  checkDownloads(downloadPage: any) {
    return new Promise(async (resolve, reject) => {
      const isDownloading = await downloadPage.evaluate(() => {
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
          const isDownloading = await downloadPage.evaluate(() => {
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
    browser: any, 
    departamento: string, 
    objetoContratacion: string, 
    countPages: number,
    downloadPage: any,
  ) {

    for (let index = 0; index < countPages; index++) {
      const page = await browser.newPage();
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
          const fechaPublicacionString = tr.querySelectorAll("td")[2].innerHTML;
          const valorReferencial = tr.querySelectorAll("td")[9].innerHTML;
          let fechaPublicacion = null;
          if (fechaPublicacionString) {
            const fechaPublicacionParts = fechaPublicacionString.slice(0, 10).split("/");
            fechaPublicacion = `${fechaPublicacionParts[1]}/${fechaPublicacionParts[0]}/${fechaPublicacionParts[2]}`; 
          }
          const a = td.querySelectorAll("a")[1];
          a.click();
          return {
            momenclatura,
            fechaPublicacion,
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
        const data: SeaceDataModel = await page.evaluate(async () => {
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
          let convocatoriaDateString = (document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[0].querySelectorAll('td')[1] as any).getInnerHTML().slice(0,10);

          let buenaProSelector = document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[7];
          let buenaProDateString = '';

          if (buenaProSelector) {
            buenaProDateString = (document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[7].querySelectorAll('td')[1] as any).getInnerHTML().slice(0,10);
          } else {
            buenaProSelector = document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[3];
            if (buenaProSelector) {
              buenaProDateString = (document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[3].querySelectorAll('td')[1] as any).getInnerHTML().slice(0,10);
            } else {
              buenaProSelector = document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[2];
              if (buenaProSelector) {
                buenaProDateString = (document.querySelectorAll("[id='tbFicha:dtCronograma_data'] > tr")[2].querySelectorAll('td')[1] as any).getInnerHTML().slice(0,10);
              } else {
                throw new Error("No se encontro fecha de otorgamiento");
              }
            }
          }

          let convocatoriaId = null;
          let momenclatura = null;
          for (let index = 0; index < 1000; index++) {
            const tmpConvocatoriaId = document.querySelector(`[id='tbFicha:j_idt${index}'] tbody`);
            if (tmpConvocatoriaId && tmpConvocatoriaId.children.length === 6) {
              try {
                convocatoriaId = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[5].querySelectorAll('td')[1] as any).getInnerHTML();  
                momenclatura = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[0].querySelectorAll("td")[1] as any).getInnerHTML();
              } catch (error) {
                
              }
            }
            if (tmpConvocatoriaId && tmpConvocatoriaId.children.length === 7) {
              try {
                convocatoriaId = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[5].querySelectorAll('td')[1] as any).getInnerHTML();  
                momenclatura = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[0].querySelectorAll("td")[1] as any).getInnerHTML();
              } catch (error) {
                
              }
            }
          }

          let valorReferencial = null;
          for (let index = 0; index < 1000; index++) {
            const tmpValorReferencial = document.querySelector(`[id='tbFicha:j_idt${index}'] tbody`);
            if (tmpValorReferencial && tmpValorReferencial.children.length === 8) {
              try {
                valorReferencial = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[2].querySelectorAll("td")[1].querySelector("span") as any).getInnerHTML();
              } catch (error) {
                
              }
            }
            if (tmpValorReferencial && tmpValorReferencial.children.length === 9) {
              try {
                valorReferencial = (document.querySelectorAll(`[id='tbFicha:j_idt${index}'] tr`)[2].querySelectorAll("td")[1].querySelector("span") as any).getInnerHTML();
              } catch (error) {
                
              }
            }
          }

          const estado = (document.querySelector("[id='tbFicha:idGridLstItems_content']")?.querySelectorAll("tr")[0].querySelectorAll("tr")[3].querySelectorAll("td")[7] as any).getInnerHTML();
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
          };
        });

        Object.assign(data, { departamento, objetoContratacion, publicacionDate: new Date(seaceError.fechaPublicacion) });
        console.log(`${data.momenclatura}\t\t${data.valorReferencial}`);
        const createdSeaceData = await this.appService.create(data);
        
        if (data.isOfferAtag) {
          await this.scrapOffers(page, downloadPage, createdSeaceData);
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

  scrapOffers(page: any, downloadPage: any, seaceData: ReadSeaceDataDto) {
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
                  const files = fs.readdirSync('/home/vampi/Downloads');
                  for (let index = 0; index < businessOfferPdfs.length; index++) {
                    const businessOfferPdf = businessOfferPdfs[index];
                    const foundBusinessOfferPdf = await this.appService.getBusinessOfferPdf(businessOfferPdf, createdBusinessOffer._id.toString());
                    await downloadPage.bringToFront();
                    const lastFileName = await downloadPage.evaluate(() => {
                      const dm = document.querySelector('downloads-manager').shadowRoot;
                      const items = dm.querySelectorAll('downloads-item');
                      if (items[0]) {
                        return (items[0] as any).__data.data.fileName;
                      } else {
                        return '';
                      }
                    });
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
                      await this.getNewDownloadName(downloadPage, lastFileName).then(realfilename => {
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
                        await this.getNewDownloadName(downloadPage, lastFileName).then(realfilename => {
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
	
  async startScrap(
    browser: any, 
    objetoIndex: number,
    departamentoIndex: number,
    yearIndex: number
  ): Promise<void> {
    const downloadPage = await browser.newPage();
    await downloadPage.goto('chrome://downloads/');
    const objetoContratacion = objetos[objetoIndex];
    const departamento = departmentos[departamentoIndex];
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        await this.checkDownloads(downloadPage);
        return reject('Navegador congelado por mas de 1 hora');
      }, 1000 * 60 * 60);
      const code = this.generateCode();
      this.ORIGINAL_IMAGE = `/tmp/${code}.jpg`;
      this.OUTPUT_IMAGE = `/tmp/${code}_scrop.jpg`;
      const mainPage = await browser.newPage();

      try {
        await mainPage.goto(this.url);
        let startCaptcha = false;
        let pageIndex = 0;
        mainPage.on('response', async (response: any) => {
          const req = response.request();
          const orig = req.url();
          if (orig.includes('http://procesos.seace.gob.pe/seacebus-uiwd-pub/buscadorPublico/buscadorPublico.xhtml')) {
            if (startCaptcha) {
              startCaptcha = false;
              await this.delay(3000);
              const countPages = await mainPage.evaluate(() => {
                const trs = document.querySelectorAll("[id='tbBuscador:idFormBuscarProceso:dtProcesos_data'] tr");
                return trs.length;
              });
              await this.scrapPage(browser, departamento, objetoContratacion, countPages, downloadPage);
              if (countPages < 15) {
                await this.checkDownloads(downloadPage);
                return resolve();
              }
              pageIndex++;
              try {
                await mainPage.evaluate((pageIndex: number) => {
                  console.log(pageIndex);
                  if (pageIndex > 30) {
                    (document.querySelectorAll('.ui-paginator-pages span')[pageIndex - 24] as any).click();
                    console.log(document.querySelectorAll('.ui-paginator-pages span')[pageIndex - 24]);
                  } else {
                    if (pageIndex > 5) {
                      (document.querySelectorAll('.ui-paginator-pages span')[6] as any).click();
                      console.log(document.querySelectorAll('.ui-paginator-pages span')[6]);
                    } else {
                      (document.querySelectorAll('.ui-paginator-pages span')[pageIndex] as any).click();
                      console.log(document.querySelectorAll('.ui-paginator-pages span')[pageIndex]);
                    }
                  }
                }, pageIndex);
              } catch (error) {
                if (error instanceof Error) {
                  reject(error.message);
                } else {
                  reject('Error evaluando paginas');
                }
              }
            }
            startCaptcha = true;
          }
        });
  
        const found = (await mainPage.content()).match(new RegExp('No se encontraron Datos', 'i'));
  
        if (found) {
          await mainPage.screenshot({ path: this.ORIGINAL_IMAGE });
          await this.cropImage();
  
          const solver = new Captcha.Solver(CAPTCHA_API_KEY);
  
          solver.imageCaptcha(fs.readFileSync(this.OUTPUT_IMAGE, "base64")).then(async (res: any) => {
            await mainPage.evaluate((obj: any) => {
              let objectSelector = null;
              let objectSelectorIndex = 0;
              while (objectSelector === null ) {
                const objectSelectorTmp = document.querySelector(`[id='tbBuscador:idFormBuscarProceso:j_idt${objectSelectorIndex}_panel']`);
                if (objectSelectorTmp && objectSelectorTmp.querySelectorAll("li").length === 5) {
                  objectSelector = document.querySelector(`[id='tbBuscador:idFormBuscarProceso:j_idt${objectSelectorIndex}_panel']`);
                }
                objectSelectorIndex++;
              }
              (objectSelector.querySelectorAll("li")[obj.objetoIndex + 1] as any).click();
              // 1 = 2023
              // 2 = 2022
              const yearSelector: any = document.querySelectorAll("[id='tbBuscador:idFormBuscarProceso:anioConvocatoria_panel'] li")[obj.yearIndex];
              yearSelector.click();
              (document.querySelectorAll("[id='tbBuscador:idFormBuscarProceso:departamento_panel'] li")[obj.departamentoIndex + 1] as any).click();
              const inputCapcha: any = document.querySelector("[id^='tbBuscador:idFormBuscarProceso:codigoCaptcha']");
              const buttonSubmit: any = document.querySelector("[id^='tbBuscador:idFormBuscarProceso:btnBuscarSel']");
              inputCapcha.value = obj.res.data;
              buttonSubmit.click();
            }, { res, objetoIndex, departamentoIndex, yearIndex });
          }).catch((error: any) => {
            console.error(error.message);
            reject(error.message);
          });  
        }
      } catch (error) {
        if (error instanceof Error) {
          console.log(error.message);
          reject(error.message);
        }
      }
    });
	}
}
