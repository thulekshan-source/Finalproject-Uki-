const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/register');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/uki-dsa-08/Desktop/finalproject/Finalprojectpolished/register_page.png' });
  await browser.close();
  console.log('Screenshot saved to /home/uki-dsa-08/Desktop/finalproject/Finalprojectpolished/register_page.png');
})();
