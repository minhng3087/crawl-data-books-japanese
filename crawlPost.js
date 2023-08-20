const fs = require('fs');
const moment = require('moment');

const helper = {
  getRandomInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  },
  slugify(string){
    const a = 'àáäâãåăæąçćčđďèéěėëêęğǵḧìíïîįłḿǹńňñòóöôœøṕŕřßşśšșťțùúüûǘůűūųẃẍÿýźžż·/_,:;'
    const b = 'aaaaaaaaacccddeeeeeeegghiiiiilmnnnnooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')
    return string.toString().toLowerCase()
        .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
        .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
        .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
        .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
        .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
        .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
        .replace(/đ/gi, 'd')
        .replace(/\s+/g, '-') 
        .replace(p, c => b.charAt(a.indexOf(c)))
        .replace(/&/g, '-and-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
    }
};
const scraperObject = {
  url: "https://kohi.vn/blog",
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
        ".columns.is-multiline.articles > .column.is-4",
        (links) => {
          // Extract the links from the data
          links = links.map(
            (el) =>
              el.querySelector(".image-card-header.image.is-19by9 > img").src
          );
          return links;
        }
      );

      let urls = await page.$$eval(
        ".columns.is-multiline.articles > .column.is-4",
        (links) => {
          // Extract the links from the data
          links = links.map(
            (el) =>
              el.querySelector(
                ".read-now.has-text-weight-bold.has-text-right > a"
              ).href
          );
          return links;
        }
      );
      // Loop through each of those links, open a new page instance and get the relevant data from them
      let pagePromise = (link) =>
        new Promise(async (resolve, reject) => {
          let dataObj = {};
          let newPage = await browser.newPage();
          await newPage.goto(link, { timeout: 0 });
          if ((await newPage.$('.article-title > h1')) !== null) {
            // do things with its content
            dataObj["title"] = await newPage.$eval(
                ".article-title > h1",
                (text) => text.textContent.replace(/^\s+|\s+$/g, "")
            );
            dataObj["slug"] = helper.slugify(dataObj["title"]);
            dataObj["user_id"] = helper.getRandomInt(1, 10);
            dataObj["category_id"] = helper.getRandomInt(1, 9);
            dataObj["status"] = helper.getRandomInt(0, 1);
            dataObj["published_at"] = dataObj["status"] == 1 ? moment(new Date()).format('YYYY-MM-DD HH:mm:ss') : null;
          } else {
            dataObj["title"] = ""
          }
          if ((await newPage.$('.article-thumbnail > img')) !== null) {
            dataObj["image"] = await newPage.$eval(".article-thumbnail > img",(img) => img.src);
          }
          if ((await newPage.$('.article-content')) !== null) {
            dataObj["content"] = await newPage.$eval(".article-content",(div) => div.innerHTML);
          }
          resolve(dataObj);
          await newPage.close();
        });
      for (var i = 0; i < urls.length; i++) {
        let currentPageData = await pagePromise(urls[i]);
        currentPageData["thumb"] = thumbs[i];
        scrapedData.push(currentPageData);
        count++;
        console.log(count);
        fs.writeFile("data.json", JSON.stringify(currentPageData) + ',', {flag:'a'}, function(err) {
		    if(err) {
		        return console.log(err);
		    }
		    console.log("The data has been scraped and saved successfully! View it at './data.json'");
		});
      }
      
      // When all the data on this page is done, click the next button and start the scraping of the next page
      // You are going to check if this button exist first, so you know if there really is a next page.
      let nextButtonExist = false;
      try{
      	const nextButton = await page.$eval('.pagination.is-centered > a.pagination-next', a => a.textContent);
        console.log(nextButton)
      	nextButtonExist = true;
      }
      catch(err){
      	nextButtonExist = false;
      }
      if(nextButtonExist){
      	// await page.click('.pagination.is-centered > a.pagination-next');
        await page.evaluate(() => {
            document.querySelector('.pagination.is-centered > a.pagination-next').click();
        });
      	return scrapeCurrentPage(); // Call this function recursively
      }
      await page.close();
      return scrapedData;
    }
    let data = await scrapeCurrentPage();
    return data;
  },
};

module.exports = scraperObject;
