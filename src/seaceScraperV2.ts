import { SeaceDataModel } from "./seace-data.model";
import { AppService } from "./app.service";

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

const years: string[] = [
    'null',
    '2023',// 1 = 2023
    '2022'// 2 = 2022
];

const CAPTCHA_API_KEY = process.env.CAPTCHA_API_KEY;

export class SeaceScraperV2 {

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
        console.log("Image cropped and saved");
        resolve();
      }).catch(function(error: any) {
        console.log("An error occured");
        reject();
      });
    });
  }

  async scrapPage(browser: any, departamento: string, objetoContratacion: string, countPages: number) {
    
    for (let index = 0; index < countPages; index++) {
      const page = await browser.newPage();
      let seaceError: any = {};

      try {
        await page.goto(this.url);
      } catch (error) {
        console.log('Error al cargar la pagina');
        await page.close();
        continue;
      }

      try {
        seaceError = await page.evaluate((index: number) => {
          const tr = document.querySelectorAll("[id='tbBuscador:idFormBuscarProceso:dtProcesos_data'] tr")[index];
          const td = tr.querySelectorAll("td")[12];
          const momenclatura = tr.querySelectorAll("td")[3].innerHTML;
          const fechaPublicacionString = tr.querySelectorAll("td")[2].innerHTML;
          const valorReferencial = tr.querySelectorAll("td")[9].innerHTML;

          const fechaPublicacionParts = fechaPublicacionString.slice(0, 10).split("/");
          const fechaPublicacion = `${fechaPublicacionParts[1]}/${fechaPublicacionParts[0]}/${fechaPublicacionParts[2]}`; 
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
        await page.close();
        continue;
      }

      try {
        await page.waitForSelector("[id='tbFicha:dtCronograma_data']", { timeout: 20000 });
        await this.delay(1000);
      } catch (error) {
        console.log('Error al esperar Cronograma');
        await page.close();
        continue;
      }
      
      try {
        const data: SeaceDataModel = await page.evaluate(async () => {
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
            if (tmpValorReferencial) {
              console.log(tmpValorReferencial.children.length);
            }
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
          let constructionAtag = null;

          for (const aTag of aTags) {
            if (aTag.innerHTML === 'Ver Ofertas Presentadas') {
              constructionAtag = aTag;
            }
          }

          if (constructionAtag) {
            console.log('======> XXX Ofertas presentadas XXX <======');
          }

          return {
            buenaProDate,
            convocatoriaDate,
            convocatoriaId,
            momenclatura,
            valorReferencial,
            estado,
            businesses,
            isOffer: constructionAtag ? true : false,
          };
        });
        Object.assign(data, { departamento, objetoContratacion, publicacionDate: new Date(seaceError.fechaPublicacion) });
        console.log(`${data.momenclatura}  <====>  ${data.valorReferencial}`);
        this.appService.create(data);
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
      await page.close();
    }
  }
	
  async startScrap(
    browser: any, 
    objetoIndex: number,
    departamentoIndex: number,
    yearIndex: number
  ): Promise<void> {
    const objetoContratacion = objetos[objetoIndex];
    const departamento = departmentos[departamentoIndex];
    const year = years[yearIndex];
    return new Promise(async (resolve, reject) => {
      const code = this.generateCode();
      this.ORIGINAL_IMAGE = `/tmp/${code}.jpg`;
      this.OUTPUT_IMAGE = `/tmp/${code}_scrop.jpg`;
      const mainPage = await browser.newPage();

      try {
        console.log(`Navigating to ${this.url}...`);
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
              console.log(`\n=== >>> Pagina ${pageIndex} - ${departamento} - ${objetoContratacion} - ${year} <<< ===`);
              const countPages = await mainPage.evaluate(() => {
                const trs = document.querySelectorAll("[id='tbBuscador:idFormBuscarProceso:dtProcesos_data'] tr");
                return trs.length;
              });
              await this.scrapPage(browser, departamento, objetoContratacion, countPages);
              if (countPages < 15) {
                console.log('==> FINALIZADO <==');
                return resolve();
              }
              pageIndex++;
              try {
                await mainPage.evaluate((pageIndex: number) => {
                  console.log(pageIndex);
                  if (pageIndex > 30) {
                    (document.querySelectorAll('.ui-paginator-pages span')[pageIndex - 24] as any).click();
                  } else {
                    if (pageIndex > 5) {
                      (document.querySelectorAll('.ui-paginator-pages span')[6] as any).click();
                    } else {
                      (document.querySelectorAll('.ui-paginator-pages span')[pageIndex] as any).click();
                    }
                  }
                }, pageIndex);
              } catch (error) {
                if (error instanceof Error) {
                  reject(error.message);
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
