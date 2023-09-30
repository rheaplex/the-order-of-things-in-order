/* global process URL */

import * as url from 'url';
import puppeteer from 'puppeteer';

import { ordersInOrder } from './js/order.js';

const WIDTH = 1280;
const HEIGHT = 720;
const COUNT = 5;

const DIR = url.fileURLToPath(new URL('.', import.meta.url)).toString();
const FILE = `file://${DIR}index.html`;

(async () => {
  if (! process.argv[2]) {
    console.error("Must pass base-10 integer seed as only argument.");
    process.exit(-1);
  }
  let seed = parseInt(process.argv[2]);
  if (Number.isNaN(seed)) {
    console.error("Could not parse seed as base-10 integer, got NaN.");
    process.exit(-1);
  }
  console.log(`Seed used: ${seed}`);
  console.log(`Number of iterations of each order: ${COUNT}`);
  
  const browser = await puppeteer.launch({
    // Make GPU acceleration possible
    //headless: false,
    headless: 'new',
    // Run our very time consuming code without timing out.
    protocolTimeout: 1000 * 60 * 20,
    args: [
      // Avoid Chrome being sad at loading a script from the filesystem
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials',
      // Speed up rendering
      //'--enable-gpu',
    ]
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log(msg.text()));  
  await page.setViewport({width: WIDTH, height: HEIGHT});
  await page.goto(FILE);
  
  console.log(await page.evaluate((s, c) => { return ordersInOrder(s, c); },
                                  seed,
                                  COUNT));
  
  await browser.close();
})();
