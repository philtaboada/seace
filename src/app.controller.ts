import { Controller, Get } from '@nestjs/common';
import * as cron from 'node-cron';
import { AppService } from './app.service';
import { startBrowser } from './browser';
import { SeaceScraperV6 } from './seaceScraperV6';

@Controller()
export class AppController {

    constructor(
        private readonly appService: AppService
    ) { }

    // 1 = Ano actual
    // 2 = Ano pasado
    private stateOne = {
        objetoIndex: 0,
        departamentoIndex: 0,
        yearIndex: 2
    }
    private stateTwo = {
        objetoIndex: 0,
        departamentoIndex: 0,
        yearIndex: 2
    }
    private browserInstanceOne: any = null
    private browserInstanceTwo: any = null
    private browserInstanceThree: any = null
    private browserInstanceFour: any = null
    private browserInstanceFive: any = null
    private browserInstanceSix: any = null
    private browserInstanceSeven: any = null

    delay(time) {
        return new Promise(function (resolve) {
            setTimeout(resolve, time)
        });
    }

    async onModuleInit() {
        this.stateOne = await this.appService.getStateSeace(2);
        this.stateTwo = await this.appService.getStateSeace(2);

        cron.schedule('0 0 */1 * * *', async () => {
            //this.appService.checkFiles();
            //this.appService.deleteFiles();
        });
        //this.appService.checkFiles();
        //this.appService.deleteFiles();

        if (process.env.NODE_ENV === 'production') {
            cron.schedule('*/5 * * * *', async () => {
                if (!this.browserInstanceOne) {
                    await this.processScrapSeaceOne();
                }
                if (!this.browserInstanceTwo) {
                    await this.processScrapSeaceTwo();
                }
                if (!this.browserInstanceThree) {
                    await this.processScrapSeaceThree();
                }
                if (!this.browserInstanceFour) {
                    await this.processScrapSeaceFour();
                }
                if (!this.browserInstanceFive) {
                    await this.processScrapSeaceFive();
                }
                if (!this.browserInstanceSix) {
                    await this.processScrapSeaceSix();
                }
                if (!this.browserInstanceSeven) {
                    await this.processScrapSeaceSeven();
                }
            });
            this.processScrapSeaceOne()
            this.processScrapSeaceFive()
        } else {
            this.startTestOne()
        }
    }

    async processScrapSeaceOne(): Promise<void> {
        const state = this.stateOne
        this.browserInstanceOne = await startBrowser();
        const seaceScraper = new SeaceScraperV6(this.appService, this.browserInstanceOne);
        seaceScraper.startScrap(state.objetoIndex, state.departamentoIndex, state.yearIndex).then(() => {
            this.browserInstanceOne.close();
            this.browserInstanceOne = null;
        }).catch(error => {
            console.log('===>>> Error en el navegador ONE <<<===');
            console.log(error);
            this.browserInstanceOne.close();
            this.browserInstanceOne = null;
        });
        state.objetoIndex++;
        if (state.objetoIndex === 4) {
            state.objetoIndex = 0;
            state.departamentoIndex++;
        }
        if (state.departamentoIndex === 27) {
            state.departamentoIndex = 0;
        }
        this.appService.updateStateSeace(state.objetoIndex, state.departamentoIndex, state.yearIndex);
    }

    async processScrapSeaceTwo(): Promise<void> {
        const state = this.stateOne
        this.browserInstanceTwo = await startBrowser();
        const seaceScraper = new SeaceScraperV6(this.appService, this.browserInstanceTwo);
        seaceScraper.startScrap(state.objetoIndex, state.departamentoIndex, state.yearIndex).then(() => {
            this.browserInstanceTwo.close();
            this.browserInstanceTwo = null;
        }).catch(error => {
            console.log('===>>> Error en el navegador TWO <<<===');
            console.log(error.message);
            this.browserInstanceTwo.close();
            this.browserInstanceTwo = null;
        });
        state.objetoIndex++;
        if (state.objetoIndex === 4) {
            state.objetoIndex = 0;
            state.departamentoIndex++;
        }
        if (state.departamentoIndex === 27) {
            state.departamentoIndex = 0;
        }
        this.appService.updateStateSeace(state.objetoIndex, state.departamentoIndex, state.yearIndex);
    }

    async processScrapSeaceThree(): Promise<void> {
        const state = this.stateOne
        this.browserInstanceThree = await startBrowser();
        const seaceScraper = new SeaceScraperV6(this.appService, this.browserInstanceThree);
        seaceScraper.startScrap(state.objetoIndex, state.departamentoIndex, state.yearIndex).then(() => {
            this.browserInstanceThree.close();
            this.browserInstanceThree = null;
        }).catch(error => {
            console.log('===>>> Error en el navegador THREE <<<===');
            console.log(error.message);
            this.browserInstanceThree.close();
            this.browserInstanceThree = null;
        });
        state.objetoIndex++;
        if (state.objetoIndex === 4) {
            state.objetoIndex = 0;
            state.departamentoIndex++;
        }
        if (state.departamentoIndex === 27) {
            state.departamentoIndex = 0;
        }
        this.appService.updateStateSeace(state.objetoIndex, state.departamentoIndex, state.yearIndex);
    }

    async processScrapSeaceFour(): Promise<void> {
        const state = this.stateOne
        this.browserInstanceFour = await startBrowser();
        const seaceScraper = new SeaceScraperV6(this.appService, this.browserInstanceFour);
        seaceScraper.startScrap(state.objetoIndex, state.departamentoIndex, state.yearIndex).then(() => {
            this.browserInstanceFour.close();
            this.browserInstanceFour = null;
        }).catch(error => {
            console.log('===>>> Error en el navegador FOUR <<<===');
            console.log(error.message);
            this.browserInstanceFour.close();
            this.browserInstanceFour = null;
        });
        state.objetoIndex++;
        if (state.objetoIndex === 4) {
            state.objetoIndex = 0;
            state.departamentoIndex++;
        }
        if (state.departamentoIndex === 27) {
            state.departamentoIndex = 0;
        }
        this.appService.updateStateSeace(state.objetoIndex, state.departamentoIndex, state.yearIndex);
    }

    async processScrapSeaceFive(): Promise<void> {
        const state = this.stateTwo
        this.browserInstanceFive = await startBrowser();
        const seaceScraper = new SeaceScraperV6(this.appService, this.browserInstanceFive);
        seaceScraper.startScrap(state.objetoIndex, state.departamentoIndex, state.yearIndex).then(() => {
            this.browserInstanceFive.close();
            this.browserInstanceFive = null;
        }).catch(error => {
            console.log('===>>> Error en el navegador FIVE <<<===');
            console.log(error.message);
            this.browserInstanceFive.close();
            this.browserInstanceFive = null;
        });
        state.objetoIndex++;
        if (state.objetoIndex === 4) {
            state.objetoIndex = 0;
            state.departamentoIndex++;
        }
        if (state.departamentoIndex === 27) {
            state.departamentoIndex = 0;
        }
        this.appService.updateStateSeace(state.objetoIndex, state.departamentoIndex, state.yearIndex);
    }

    async processScrapSeaceSix(): Promise<void> {
        const state = this.stateTwo
        this.browserInstanceSix = await startBrowser();
        const seaceScraper = new SeaceScraperV6(this.appService, this.browserInstanceSix);
        seaceScraper.startScrap(state.objetoIndex, state.departamentoIndex, state.yearIndex).then(() => {
            this.browserInstanceSix.close();
            this.browserInstanceSix = null;
        }).catch(error => {
            console.log('===>>> Error en el navegador SIX <<<===');
            console.log(error.message);
            this.browserInstanceSix.close();
            this.browserInstanceSix = null;
        });
        state.objetoIndex++;
        if (state.objetoIndex === 4) {
            state.objetoIndex = 0;
            state.departamentoIndex++;
        }
        if (state.departamentoIndex === 27) {
            state.departamentoIndex = 0;
        }
        this.appService.updateStateSeace(state.objetoIndex, state.departamentoIndex, state.yearIndex);
    }

    async processScrapSeaceSeven(): Promise<void> {
        const state = this.stateTwo
        this.browserInstanceSeven = await startBrowser();
        const seaceScraper = new SeaceScraperV6(this.appService, this.browserInstanceSeven);
        seaceScraper.startScrap(state.objetoIndex, state.departamentoIndex, state.yearIndex).then(() => {
            this.browserInstanceSeven.close();
            this.browserInstanceSeven = null;
        }).catch(error => {
            console.log('===>>> Error en el navegador SEVEN <<<===');
            console.log(error.message);
            this.browserInstanceSeven.close();
            this.browserInstanceSeven = null;
        });
        state.objetoIndex++;
        if (state.objetoIndex === 4) {
            state.objetoIndex = 0;
            state.departamentoIndex++;
        }
        if (state.departamentoIndex === 27) {
            state.departamentoIndex = 0;
        }
        this.appService.updateStateSeace(state.objetoIndex, state.departamentoIndex, state.yearIndex);
    }

    @Get()
    getHello() {
        return 'Hello seace';
    }

    async startTestOne() {
        const browserInstance = await startBrowser();
        const seaceScraper = new SeaceScraperV6(this.appService, browserInstance);
        try {
            await seaceScraper.startScrap(0, 4, 2);
            console.log('finalizando XXXXXXXXX');
            if (process.env.NODE_ENV === 'production') {
                browserInstance.close();
            }
        } catch (error) {
            console.log('finalizando con error XXXXXXXXX');
            if (process.env.NODE_ENV === 'production') {
                browserInstance.close();
            }
        }
    }

    async startTestTwo() {
        const browserInstance = await startBrowser();
        const seaceScraper = new SeaceScraperV6(this.appService, browserInstance);
        try {
            await seaceScraper.startScrap(0, 6, 1);
            console.log('finalizando XXXXXXXXX');
            if (process.env.NODE_ENV === 'production') {
                browserInstance.close();
            }
        } catch (error) {
            console.log('finalizando con error XXXXXXXXX');
            if (process.env.NODE_ENV === 'production') {
                browserInstance.close();
            }
        }
    }

}
