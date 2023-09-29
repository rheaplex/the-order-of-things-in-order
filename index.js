/* global process URL */

import * as url from 'url';
import puppeteer from 'puppeteer';

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
  console.log(`SEED USED: ${seed}`);
  
  const browser = await puppeteer.launch({headless: "new"});
  const page = await browser.newPage();
  await page.setViewport({width: WIDTH, height: HEIGHT});
  await page.goto(FILE);
  
  await page.evaluate(`async () => {
    await order(${seed}, ${COUNT});
  }`);

  await browser.close();
})();
