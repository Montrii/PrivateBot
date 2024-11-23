import {Task} from "./Task";
import {EbayOffer} from "../managers/ebay/EbayOffer";
import {EbayManager} from "../managers/ebay/EbayManager";
import axios from "axios";
import puppeteer, {Page} from "puppeteer";
import cheerio from "cheerio";
import moment from "moment";

// A wrapper class for the Ebay offer search item.
class EbayOfferSearchItem {
    constructor(public title: string, public sortingListBy: EbaySortingListBy) {}
}

// Holds an enum of the sorting list by options for Ebay.
enum EbaySortingListBy {
    BEST = 12,
    LOWEST_PRICE = 15,
    HIGHEST_PRICE = 16,
    NEWEST_OFFER = 10,
    SOONEST_ENDING = 1,
    NEAREST_TO_ME = 7,
}

export class EbayOfferSearchingTask extends Task {
    offers: EbayOffer[] = [];
    manager: EbayManager;


    searchResults :EbayOfferSearchItem[] = [];

    constructor(manager: EbayManager) {
        super("EbayOfferSearchingTask");
        this.manager = manager;
        this.offers = [];

    }

    fillSearchResults()
    {
        //this.searchResults.push(new EbayOfferSearchItem("xbox", EbaySortingListBy.NEWEST_OFFER));
        //this.searchResults.push(new EbayOfferSearchItem("pokemon rot ovp", EbaySortingListBy.NEWEST_OFFER));
        //this.searchResults.push(new EbayOfferSearchItem("pokemon blau ovp", EbaySortingListBy.NEWEST_OFFER));
        //this.searchResults.push(new EbayOfferSearchItem("pokemon gelb ovp", EbaySortingListBy.NEWEST_OFFER));
        this.searchResults.push(new EbayOfferSearchItem("xbox classic ovp", EbaySortingListBy.NEWEST_OFFER));
        //this.searchResults.push(new EbayOfferSearchItem("pokemon blau ovp", EbaySortingListBy.NEWEST_OFFER));
    }

    async waitOnEbaySearchBar(page: Page) {
        // Wait for the input element using a more specific selector
        await page.waitForSelector('input.gh-tb.ui-autocomplete-input[aria-label="Bei eBay finden"]', {
            timeout: 20000 // Optional: specify a timeout in milliseconds (default is 30 seconds)
        });


        // Wait for either the input or the button with value="Finden"
        await page.waitForSelector('input[value="Finden"], button[value="Finden"]', {
            timeout: 20000  // Timeout after 20 seconds if neither is found
        });



    }

    async searchForItem(page: Page, item: EbayOfferSearchItem) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Random wait between 300 and 800 ms for variability
        await this.waitOnEbaySearchBar(page)


        // Store the current URL before clicking (for comparison)
        const currentUrl = page.url();
        // Wait for the input element using a more specific selector
        await page.click('input.gh-tb.ui-autocomplete-input[aria-label="Bei eBay finden"]');

        let inputValue = await page.$eval('input.gh-tb.ui-autocomplete-input[aria-label="Bei eBay finden"]', el => el.value);

        if(inputValue !== null && inputValue !== "") {
        // Click the input field to focus it
            await page.click('input.gh-tb.ui-autocomplete-input[aria-label="Bei eBay finden"]');

            // Clear the input field by setting its value to an empty string
            await page.$eval('input.gh-tb.ui-autocomplete-input[aria-label="Bei eBay finden"]', el => el.value = '');

            // Optionally log that the field was cleared
            console.log("[EBAY-OFFER-TASK]: '" + inputValue + "' has been cleared.");

        }

        // Type the item name character by character with a delay to mimic human typing
        for (let char of item.title) {
            await page.keyboard.type(char, {delay: Math.random() * (300 - 100) + 100}); // Random delay between 100 and 300 ms per character
        }

        // Click the "Finden" button
        await page.waitForSelector('input[value="Finden"], button[value="Finden"]', {
            timeout: 20000  // Timeout after 20 seconds if neither is found
        });

        await page.click('input[value="Finden"], button[value="Finden"]');


        // Wait for the page URL to change up to 20 seconds
        const timeout = 20000; // 20 seconds timeout
        const startTime = Date.now();
        let newUrl = currentUrl;

        while (Date.now() - startTime < timeout) {
            // Wait a bit before checking the URL again
            await new Promise(resolve => setTimeout(resolve, 500)); // Random wait between 300 and 800 ms for variability

            newUrl = page.url();

            if (currentUrl !== newUrl) {


                // Optionally, you can add random wait for variability
                await new Promise(resolve => setTimeout(resolve, Math.random() * (2000 - 1000) + 300)); // Random wait between 300 and 800 ms for variability


                console.log("[EBAY-OFFER-TASK]: '" + item.title + "' has been entered into the search bar.")
                console.log(`[EBAY-OFFER-TASK]: Page navigated successfully from ${currentUrl} to ${newUrl}`);


                let finishedUrl = `https://www.ebay.de/sch/i.html?_from=R40&_nkw=${encodeURIComponent(item.title)}&_sacat=0&_sop=${item.sortingListBy}`;
                await page.goto(finishedUrl)

                console.log("[EBAY-OFFER-TASK]: Navigated to the search results page sort by " + item.sortingListBy + " for '" + item.title + "'.");

                return; // Exit early if URL changes
            }
        }

        // If the URL didn't change within the timeout period
        console.log('Page did not navigate within 20 seconds.');

        // Recursively call the function again
        this.searchForItem(page, item);
    }


    // Helper function to parse the date
    private  parseDate(dateString: string) {
        // The format is like "16. Nov. 17:10" (day, month, time)
        const dateParts = dateString.split(' ');

        const day = parseInt(dateParts[0], 10); // Day part
        const monthStr = dateParts[1]; // Month part
        const timeStr = dateParts[2]; // Time part (e.g., "17:10")

        // Get the current year
        const currentYear = new Date().getFullYear();

        // Convert the month string to a month number (e.g., Nov -> 11)
        const monthMap = {
            'Jan.': 0, 'Feb.': 1, 'Mär.': 2, 'Apr.': 3, 'Mai.': 4, 'Jun.': 5,
            'Jul.': 6, 'Aug.': 7, 'Sep.': 8, 'Okt.': 9, 'Nov.': 10, 'Dez.': 11
        };
        // @ts-ignore
        const month = monthMap[monthStr];

        // Parse the time (e.g., "17:10") into hours and minutes
        const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));

        // Create a Date object with the current year, parsed month, day, and time
        const parsedDate = new Date(currentYear, month, day, hours, minutes);

        return parsedDate;
    }


    // Function to convert the extracted time into a future Date object
    private translateExpiringDate(timeString) {
        const now = moment.utc();  // Use UTC directly

        // Extract days, hours, and the target weekday and time
        const dayMatch = timeString.match(/(\d+)\s*T/);  // Match days (e.g., "2 T")
        const hourMatch = timeString.match(/(\d+)\s*Std/);  // Match hours (e.g., "17 Std")
        const weekdayMatch = timeString.match(/(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)/);  // Match weekday (e.g., "Donnerstag")
        const timeMatch = timeString.match(/(\d{2}):(\d{2})/);  // Match time (e.g., "17:10")

        // Calculate the future time
        let days = dayMatch ? parseInt(dayMatch[1], 10) : 0;
        let hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;

        // Add days and hours to the current time (in UTC)
        let targetDate = now.add(days, 'days').add(hours, 'hours');

        // If a specific weekday is provided, adjust the date to the correct weekday
        if (weekdayMatch) {
            const weekdayNames = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
            const targetWeekday = weekdayNames.indexOf(weekdayMatch[0]);

            // Adjust to the next occurrence of the given weekday
            const currentWeekday = targetDate.day();
            const diffDays = targetWeekday - currentWeekday;
            targetDate.add(diffDays, 'days');
        }

        // Set the specific time (e.g., "17:10")
        if (timeMatch) {
            targetDate.hour(parseInt(timeMatch[1], 10));
            targetDate.minute(parseInt(timeMatch[2], 10));
            targetDate.second(0);  // Set seconds to 0
        }

        // Return the future date in UTC format (ISO 8601)
        return targetDate.format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    }

    async searchResultsByFilter(page: Page, filter: EbayOfferSearchItem) {
        let offers: any[] = [];

        // get all current offers
        const ulHtml = await page.$eval('ul.srp-results.srp-list.clearfix', (ul) => ul.outerHTML);

        // Step 2: Load the HTML into Cheerio for easier manipulation
        let $ = cheerio.load(ulHtml);

        switch(filter.sortingListBy) {
            case EbaySortingListBy.NEWEST_OFFER:
                // only look at offers that are from the last 48 hours.

                let newerThan48HoursOffers = [];


                // get all lis under 48 hours ago
                $('li').each((index, liElement) => {
                    // Get the listing date from the span with the class 's-item__listingDate'
                    const listingDateText = $(liElement).find('.s-item__listingDate .BOLD').text().trim();

                    if (listingDateText) {
                        // Parse the date in the format "16. Nov. 17:10"
                        const listingDate = this.parseDate(listingDateText);
                        if (listingDate) {
                            // Calculate if the listing date is within the last 48 hours
                            const now = new Date();
                            const hoursDiff = Math.floor(Math.abs(now - listingDate) / 36e5); // Difference in hours

                            // If the date is within 48 hours, add it to the filteredLis array
                            if (hoursDiff <= 72) {
                                newerThan48HoursOffers.push(liElement);
                            }
                        }
                    }
                });

                for(let i = 0; i < newerThan48HoursOffers.length; i++) {
                    // @ts-ignore
                    let newHtml = $(newerThan48HoursOffers[i]).html();
                    // @ts-ignore
                    let $newHtml = cheerio.load(newHtml);

                    let newOffer = new EbayOffer();



                    newOffer.offerCreated = this.parseDate($newHtml('.s-item__listingDate .BOLD').text().trim());
                    // Check for img div
                    $newHtml('div.s-item__image-wrapper').each((index, element) => {
                        // Find the img inside the div
                        const img = $newHtml(element).find('img');

                        // Extract the src and alt attributes
                        const imgSrc = img.attr('src');
                        const imgAlt = img.attr('alt');

                        if (imgAlt != null) {
                            newOffer.title = imgAlt;
                        }
                        if (imgSrc != null) {
                            newOffer.image = imgSrc;
                        }
                    });


                    // Find the price inside the <span> with class 's-item__price'
                    const priceText = $newHtml('span.s-item__price').text().trim();

                    if (priceText) {
                        // Extract the currency and price using regex
                        const priceMatch = priceText.match(/([A-Za-z]+)\s?([\d,.]+)/);

                        if (priceMatch) {
                            const currency = priceMatch[1];  // Currency, e.g., "EUR"
                            const priceString = priceMatch[2];  // Price, e.g., "15,50"

                            // Remove the commas and convert to a float
                            const price = parseFloat(priceString.replace(',', '.'));

                            // Print the price and currency
                            if(price != null) {
                                newOffer.price = `${currency} ${price.toFixed(2)}`;
                            }
                        }
                    }


                    // Assuming you already have $newHtml loaded with the HTML content from the item.

                    const sellerInfoText = $newHtml('span.s-item__seller-info-text').text().trim();

                    if (sellerInfoText) {
                        // Updated regex to handle both comma and dot in rating percentage and floating-point sold count
                        const sellerMatch = sellerInfoText.match(/^([^\s]+) \((\d+(\.\d+)?)\) (\d+([.,]\d+)?)%$/);

                        if (sellerMatch) {
                            const sellerName = sellerMatch[1];  // Seller name, e.g., "niels111"
                            const soldCount = parseFloat(sellerMatch[2]);  // Number of items sold, e.g., 2.805
                            const sellerRating = parseFloat(sellerMatch[4].replace(',', '.'));  // Rating percentage, e.g., 100 or 99.7%

                            // Assign the seller info to the new offer object
                            newOffer.seller = sellerName;
                            newOffer.sellerSold = soldCount;
                            newOffer.sellerRating = sellerRating;
                        } else {
                            console.log('Seller info does not match the expected format.');
                        }
                    } else {
                        console.log('No seller info found.');
                    }





                    // Find the <a> tag with class 's-item__link' and get its href
                    const offerLink = $newHtml('a.s-item__link').attr('href');

                    if (offerLink) {
                        // Now you have the href value, which is the link to the offer
                        newOffer.link = offerLink;  // Assign it to your EbayOffer object (or similar)
                    }



                    // Find the number of bids inside the <span> with class 's-item__bids s-item__bidCount'
                    const bidText = $newHtml('span.s-item__bids.s-item__bidCount').text().trim();

                    if (bidText) {
                        // Extract the number of bids using regex (before "Gebote")
                        const bidMatch = bidText.match(/(\d+)\s?Gebote/);

                        if (bidMatch) {
                            const numberOfBids = parseInt(bidMatch[1], 10);  // Convert the number to an integer
                            // Print the number of bids
                            newOffer.biddingOffersAmount = numberOfBids;  // Storing the number of bids in the sellerSold field
                        }
                        else {
                            newOffer.biddingOffersAmount = 0;
                        }

                        newOffer.isBeddingOffer = true;

                    }
                    // check if buy now option
                    else {
                        newOffer.isBeddingOffer = false;  // You can update this flag to reflect the "Buy It Now" status
                        newOffer.biddingOffersAmount = 0;

                    }


                    const viewerInfoText = $newHtml('span.s-item__dynamic.s-item__watchCountTotal .BOLD').text().trim();

                    if (viewerInfoText) {
                        // Clean up the viewer text (remove unnecessary characters and spaces)
                        const cleanedText = viewerInfoText.replace(/\s+Beobachter$/, '').trim(); // Remove 'Beobachter' and extra spaces

                        // Replace commas with dots to handle cases like 1,000 or 1.5
                        const normalizedText = cleanedText.replace(',', '.');

                        // Extract the number, allowing for decimal points if they exist
                        const viewerMatch = normalizedText.match(/^(\d+(\.\d+)?)$/);

                        if (viewerMatch) {
                            // Convert the normalized viewer amount to a number
                            const viewerAmount = parseFloat(viewerMatch[1]);

                            // Assuming you have a newOffer object, assign the viewer amount here
                            newOffer.viewerAmount = viewerAmount;
                        } else {
                            console.log("Viewer info does not match the expected format");
                        }
                    }
                    else {
                        newOffer.viewerAmount = 0;
                    }

                    try {
                        // Wait for 5 seconds (can be removed or adjusted if needed)
                        await this.sleep(5000);

                        // Navigate to the new offer page and ensure that the page has fully loaded
                        await page.goto(newOffer.link, { waitUntil: 'networkidle2', timeout: 60000 }); // wait until network is idle

                        // Wait for the timer element to be available on the page (increase timeout if necessary)
                        let timeString = '';
                        try {
                            await page.waitForSelector('span.ux-timer__text', { timeout: 15000 });
                            // Extract the HTML content of the time string
                            timeString = await page.$eval('span.ux-timer__text', element => {
                                return element.textContent.replace('Endet in ', '').trim(); // Clean up the string
                            });
                        } catch (e) {
                            console.log('Timeout occurred while waiting for timer element, proceeding without it.');
                        }

                        if (timeString) {
                            // Translate the time string into a future date
                            newOffer.bidExpiring = this.translateExpiringDate(timeString);
                        } else {
                            newOffer.bidExpiring = new Date(new Date().getFullYear(), 11, 31).toISOString() as any; // Default fallback as 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'
                            // .format('YYYY-MM-DDTHH:mm:ss.SSS[Z]')
                        }

// Wait for the viewer count element to be available (increase timeout if necessary)
                        let viewerAmount = 0;
                        try {
                            await page.waitForSelector('div[data-testid="ux-section-icon-with-details"] span.ux-textspans', { timeout: 15000 });
                            const parentHtml = await page.$eval('div[data-testid="ux-section-icon-with-details"]', element => element.innerHTML);
                            const text = parentHtml.match(/(\d+)\sLeute beobachten/);

                            if (text && text[1]) {
                                viewerAmount = parseInt(text[1]);
                            }
                        } catch (e) {
                            console.log('Timeout occurred while waiting for viewer count element, proceeding without it.');
                        }

                        newOffer.viewerAmount = viewerAmount;



                        // Wait for the offers (Gebot) element to be available on the page (increase timeout if necessary)
                        let bidAmount = newOffer.biddingOffersAmount;
                        try {
                            await page.waitForSelector('a.ux-action span.ux-textspans--PSEUDOLINK', { timeout: 15000 });

                            // Extract the HTML content of the offer count
                            const offerText = await page.$eval('a.ux-action span.ux-textspans--PSEUDOLINK', element => element.textContent.trim());

                            // Use a regular expression to match the number of bids (e.g. "1 Gebot")
                            const match = offerText.match(/(\d+)\s*Gebot/);
                            if (match && match[1]) {
                                bidAmount = parseInt(match[1]);
                            }
                        } catch (e) {
                            console.log('Timeout occurred while waiting for offers element, proceeding without it.');
                        }

// Now, bidAmount will hold the number of offers (Gebote)
                        newOffer.biddingOffersAmount = bidAmount;



                    } catch (error) {
                        console.error(`Failed to load offer page for ${newOffer.title}! Error: ${error}`);

                        // Update bidExpiring to the end of the year if loading fails
                        newOffer.bidExpiring = new Date(new Date().getFullYear(), 11, 31).toISOString() as any;
                    }

                    offers.push(newOffer);

                }
                break;
            default:
                break;
        }

        return offers;
    }

    async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async runEbayOfferSearchingTask() {
        await super.runTask(async () => {
            // Run puppeteer command.

            // Enter Ebay.
            const browser = await puppeteer.launch({headless: true});
            const page = await browser.newPage();
            await page.goto("https://www.ebay.de");
            console.log("[TASK]: " + this.name + " is running!")


            await new Promise(resolve => setTimeout(resolve, 5000));


            let allOffers = [];

            for(let item of this.searchResults) {
                await this.searchForItem(page, item);

                let offers = await this.searchResultsByFilter(page, item);

// Merge the new offers into allOffers properly by spreading the array
                allOffers.push(...offers);  // Spread the array into allOffers

// Sort allOffers by offeringExpiring date closest to now
                allOffers.sort((a, b) => {
                    const now = new Date(); // Get the current date

                    // @ts-ignore - Handling TypeScript warning, assuming offeringExpiring is a Date
                    const diffA = Math.abs(new Date(a.offeringExpiring).getTime() - now.getTime());
                    // @ts-ignore - Same here for b
                    const diffB = Math.abs(new Date(b.offeringExpiring).getTime() - now.getTime());

                    return diffA - diffB; // Sort by absolute difference (closest date first)
                });
            }


            this.offers = allOffers;
            await page.close();
            await browser.close();
            this.manager.reportSuccessfulTask(this, this.offers);

        }).catch((error) => {
            console.error("[TASK]: " + this.name + " failed! Down below: " + error.message + " \n" + error.stack)
            this.manager.reportUnsuccessfulTask(this, this.offers);
        })
    }
}