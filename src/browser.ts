require('dotenv').config();
import { Browser } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
//a651b2eNN2bf7a42BBd672ea2fVVa530eVV2c5e2

export async function startBrowser(): Promise<Browser> {
	try {
    const API_KEY = process.env.SCRAPER_API_KEY;
    const SCRAPER_API_URL = `http://api.scraperapi.com?api_key=${API_KEY}&url=http://httpbin.org/ip`; 
    return await puppeteer.launch({
      headless: false,
      args: [ 
        `--proxy-server=${SCRAPER_API_URL}`,
        '--no-sandbox', 
        '--disable-setuid-sandbox',
      ],
    });
	} catch (err) {
    console.log("Could not create a browser instance => : ", err);
	}
}