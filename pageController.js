// const crawlPost = require('./crawlPost');
const crawlBJT = require('./crawlBJT');

async function scrapeAll(browserInstance){
	let browser;
	try{
		browser = await browserInstance;
        let scrapedData = await crawlBJT.scraper(browser);
		await browser.close();
		console.log(scrapedData);
	}
	catch(err){
		console.log("Could not resolve the browser instance => ", err);
	}
}

module.exports = (browserInstance) => scrapeAll(browserInstance)