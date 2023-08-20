const fs = require('fs');

const helper = {
    getRandomInt(min, max) {
      return min + Math.floor(Math.random() * (max - min + 1));
    },
};

const scraperObject = {
  url: "https://www.sachtiengnhat100.com/collections/combo-n3-dich-100",
  async scraper(browser) {
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    // Navigate to the selected page
    await page.goto(this.url, { timeout: 0 });
    await page.waitForTimeout(2000);
    let scrapedData = [];
    var count = 0;
    // Wait for the required DOM to be rendered
    async function scrapeCurrentPage() {
      // Get the link to all the required books
      let thumbs = await page.$$eval(
        ".box > .product.col-md-5ths.col-sm-6.col-xs-6",
        (links) => {
          // Extract the links from the data
          links = links.map((el) => el.querySelector('.thumbnail a[href*="products"] img').src);
          return links;
        }
      );

      let urls = await page.$$eval(
        ".box > .product.col-md-5ths.col-sm-6.col-xs-6",
        (links) => {
          // Extract the links from the data
          links = links.map((el) => el.querySelector(".thumbnail a:last-of-type").href);
          return links;
        }
      );
    //   // Loop through each of those links, open a new page instance and get the relevant data from them
      let pagePromise = (link) =>
        new Promise(async (resolve, reject) => {
          let dataObj = {};
          let newPage = await browser.newPage();
          await newPage.goto(link, { timeout: 0 });
          if ((await newPage.$('.bentrai > h1.title')) !== null) {
            // do things with its content
            dataObj["name"] = await newPage.$eval(
                ".bentrai > h1.title",
                (text) => text.textContent.replace(/^\s+|\s+$/g, "")
            );
            dataObj["user_id"] = helper.getRandomInt(1, 10);
            dataObj["category_id"] = 10;
            dataObj["level_id"] = 3;
            dataObj["quantity"] = helper.getRandomInt(0, 10);
          } else {
            dataObj["title"] = ""
          }
        //   dataObj["image"] = await newPage.$eval(".data.lslide.active > a",(img) => img.href);
          dataObj["images_url"] = await newPage.$$eval(
            ".lSPager.lSGallery > li",
            (links) => {
              // Extract the links from the data
              links = links.map((el) => el.querySelector("a > img").src);
              return links;
            }
          );
          dataObj["price"] = await newPage.$eval(".fontstyle.pad_right_20",(text) => text.textContent.match(/\d/g).join(""));
          resolve(dataObj);
          await newPage.close();
        });
      for (var i = 0; i < urls.length; i++) {
        let currentPageData = await pagePromise(urls[i]);
        currentPageData["thumb"] = thumbs[i];
        scrapedData.push(currentPageData);
        count++;
        console.log(count);
        fs.writeFile("book.json", JSON.stringify(currentPageData) + ',', {flag:'a'}, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		    console.log("The data has been scraped and saved successfully! View it at './data.json'");
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
