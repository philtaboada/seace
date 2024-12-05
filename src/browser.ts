import puppeteer from 'puppeteer-extra';
import { Browser } from 'puppeteer';
//import StealthPlugin from 'puppeteer-extra-plugin-stealth';
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
//import UserPreferencesPlugin from "puppeteer-extra-plugin-user-preferences";

export async function startBrowser(): Promise<Browser> {
	try {
    puppeteer.use(StealthPlugin());
 
    return await puppeteer.launch({
      headless: false,
      args: [ 
        '--no-sandbox', 
        '--disable-setuid-sandbox',
      ],
    });
	} catch (err) {
    console.log("Could not create a browser instance => : ", err);
	}
}