require('dotenv').config();
import { Browser } from 'puppeteer';
import puppeteer from 'puppeteer-extra';




export async function startBrowser(): Promise<Browser> {
  try {
    const API_KEY = process.env.API_KEY;
    const targetUrl = encodeURIComponent('https://prod2.seace.gob.pe/seacebus-uiwd-pub/buscadorPublico/buscadorPublico.xhtml');
    const scraperUrl = `http://api.scraperapi.com?api_key=${API_KEY}&url=${targetUrl}&render=true`;

    const browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ]
    });

    const page = await browser.newPage();
    await page.goto(scraperUrl);

    return browser;
  } catch (err) {
    console.log("Could not create a browser instance => : ", err);
    throw err;
  }
}