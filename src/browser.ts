import { Browser } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
const UserPreferencesPlugin = require("puppeteer-extra-plugin-user-preferences");

export async function startBrowser(): Promise<Browser> {
	try {
    puppeteer.use(
      UserPreferencesPlugin({
        userPrefs: {
          download: {
            prompt_for_download: false,
            // open_pdf_in_system_reader: true,
            default_directory: '/home/vampi/Downloads',
            automatic_downloads: 1,
          },
          // disable allow-multiple-downloads popup
          profile: {
            default_content_setting_values: {
              automatic_downloads: 1,
            },
          },
        },
      })
    );
    return await puppeteer.launch({
      headless: true,
      args: [ 
        '--no-sandbox', 
        '--disable-setuid-sandbox',
      ],
    });
	} catch (err) {
    console.log("Could not create a browser instance => : ", err);
	}
}