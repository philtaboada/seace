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

export class SeaceScraperV7 {

  constructor(
    private readonly appService: AppService,
    private readonly browser: Browser,
  ) { }

  private url = 'https://prod2.seace.gob.pe/seacebus-uiwd-pub/buscadorPublico/buscadorPublico.xhtml';
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
                  if (typeof (data.valorReferencial) === 'string') {
                    console.log('Se agrega a la base de datos como string, el texto tiene que se rlarog para saber si se sube a la base de datos o no', data.valorReferencial);
                    await this.appService.create(data);
                  }
                } else {
                  console.log('No se crea porque no tiene valorReferencial >= 200000');
                }
              }
            }

          }
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

  getRandomArbitrary(min: number, max: number) {
    const random = Math.random() * (max - min) + min
    return Math.trunc(random)
  }

  private async pattern1(page: Page): Promise<boolean> {
    // Patrón 1: Recargar y esperar
    await this.delay(this.getRandomDelay(1000, 3000));
    await page.reload({ waitUntil: 'networkidle0' });
    await this.delay(this.getRandomDelay(2000, 4000));
    return true;
  }

  private async pattern2(page: Page): Promise<boolean> {
    try {
      // Verificar si la página sigue abierta
      if (!page.isClosed()) {
        // Guardar la URL original
        const originalUrl = page.url();

        await page.goto('https://prod2.seace.gob.pe/seacebus-uiwd-pub/index.html');
        await this.delay(this.getRandomDelay(3000, 6000));

        // Verificar nuevamente si la página sigue abierta
        if (!page.isClosed()) {
          // En lugar de usar goBack, navegar directamente a la URL original
          await page.goto(originalUrl);
          await this.delay(this.getRandomDelay(2000, 4000));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.log('Error en pattern2:', error);
      return false;
    }
  }

  private async pattern3(page: Page): Promise<boolean> {
    // Patrón 3: Simular interacción humana
    await this.simulateHumanBehavior(page);
    await this.delay(this.getRandomDelay(2000, 5000));
    return true;
  }

  private async simulateHumanBehavior(page: Page): Promise<void> {
    // Simular movimientos de mouse y scrolling aleatorio
    await page.mouse.move(
      200 + Math.random() * 100,
      300 + Math.random() * 100,
      { steps: 10 }
    );

    await page.evaluate(() => {
      window.scrollTo({
        top: Math.random() * 100,
        behavior: 'smooth'
      });
    });

    await this.delay(this.getRandomDelay(1000, 2000));
  }

  private getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  async startScrap(
    objetoIndex: number,
    departamentoIndex: number,
    yearIndex: number
  ): Promise<void> {
    //this.downloadPage = await this.browser.newPage()
    //this.downloadPage.goto('chrome://downloads/')
    const objetoContratacion = objetos[objetoIndex]
    const departamento = departmentos[departamentoIndex]
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        return reject('Navegador congelado por mas de 30 min')
      }, 1000 * 60 * 30)
      const mainPage = await this.browser.newPage()

      const isStealthActive = await mainPage.evaluate(() => navigator.webdriver);
      console.log('Stealth mode active:', !isStealthActive);
      console.log('Estamos corriendo la version 7');


      const stealthStatus = await mainPage.evaluate(() => ({
        webdriver: navigator.webdriver,
        userAgent: navigator.userAgent,
        languages: navigator.languages,
      }));
      console.log('Browser Details:', stealthStatus);

      try {
        await mainPage.goto(this.url)
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
          console.log('yearIndex', yearIndex);
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
              // Primero hacer click en el dropdown para abrirlo
              (document.querySelector("[id='tbBuscador:idFormBuscarProceso:anioConvocatoria_label']") as HTMLElement).click();

              // Luego seleccionar el año
              const yearItems = document.querySelectorAll("[id='tbBuscador:idFormBuscarProceso:anioConvocatoria_panel'] li");
              (yearItems[obj.yearIndex] as HTMLElement).click();
            } catch (error) {
              console.log('Error al escoger el año:', error);
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
