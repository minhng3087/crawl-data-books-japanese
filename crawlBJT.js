const fs = require('fs');

const helper = {
    getRandomInt(min, max) {
      return min + Math.floor(Math.random() * (max - min + 1));
    },
};

const scraperObject = {
  url: "https://giaotrinhtiengnhat.com/sach-tieng-nhat-chuyen-nganh",
  async scraper(browser) {
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    // Navigate to the selected page
    await page.goto(this.url, { timeout: 0, waitUntil: 'load'});
    let scrapedData = [];
    var count = 0;
    // Wait for the required DOM to be rendered
    async function scrapeCurrentPage() {
      // Get the link to all the required books
      let thumbs = await page.$$eval(
        "#productsgrid > li",
        (links) => {
          // Extract the links from the data
          links = links.map((el) => el.querySelector('.product-image a img').src);
          return links;
        }
      );

      let urls = await page.$$eval(
        "#productsgrid > li",
        (links) => {
          // Extract the links from the data
          links = links.map((el) => el.querySelector(".product-image a").href);
          return links;
        }
      );
      let pagePromise = (link) =>
        new Promise(async (resolve, reject) => {
          let dataObj = {};
          let newPage = await browser.newPage();
          await newPage.goto(link, { timeout: 0, waitUntil: 'load'});
          if ((await newPage.$('.product-name h1')) !== null) {
            // do things with its content
            dataObj["name"] = await newPage.$eval(
                ".product-name h1",
                (text) => text.textContent.replace(/^\s+|\s+$/g, "")
            );
            dataObj["user_id"] = helper.getRandomInt(1, 10);
            dataObj["category_id"] = 2;
            dataObj["level_id"] = helper.getRandomInt(1, 10);
            dataObj["quantity"] = helper.getRandomInt(0, 10);
          } else {
            dataObj["title"] = ""
          }
          if ((await newPage.$('.special-price .price')) !== null) {
            dataObj["price"] = await newPage.$eval(".special-price .price",(text) => text.textContent.match(/\d/g).join(""));
          } else {
            dataObj["price"] = "";
          }
          resolve(dataObj);
          await newPage.close();
        });
      for (var i = 0; i < urls.length; i++) {
        let currentPageData = await pagePromise(urls[i]);
        currentPageData["thumb"] = thumbs[i];
        currentPageData["image"] = thumbs[i];
        scrapedData.push(currentPageData);
        count++;
        console.log(count);
        console.log(currentPageData);
        fs.writeFile("book.json", JSON.stringify(currentPageData) + ',', {flag:'a'}, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		    console.log("The data has been scraped and saved successfully! View it at './book.json'");
		});
      }
      
    //   // When all the data on this page is done, click the next button and start the scraping of the next page
    //   // You are going to check if this button exist first, so you know if there really is a next page.
    //   let nextButtonExist = false;
    //   try{
    //   	const nextButton = await page.$eval('.pagination.is-centered > a.pagination-next', a => a.textContent);
    //     console.log(nextButton)
    //   	nextButtonExist = true;
    //   }
    //   catch(err){
    //   	nextButtonExist = false;
    //   }
    //   if(nextButtonExist){
    //   	// await page.click('.pagination.is-centered > a.pagination-next');
    //     await page.evaluate(() => {
    //         document.querySelector('.pagination.is-centered > a.pagination-next').click();
    //     });
    //   	return scrapeCurrentPage(); // Call this function recursively
    //   }
      await page.close();
      return scrapedData;
    }
    let data = await scrapeCurrentPage();
    return data;
  },
};

module.exports = scraperObject;
