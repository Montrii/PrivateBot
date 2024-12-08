import {Task} from "./Task";
import {EbayOffer} from "../managers/ebay/EbayOffer";
import {EbayManager} from "../managers/ebay/EbayManager";
import axios from "axios";
import puppeteer, {Page} from "puppeteer";
import cheerio from "cheerio";
import * as path from "node:path";
import * as fs from "node:fs";

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


    private parseDate(dateString: string) {
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

        // Create a Date object using the current year, parsed month, day, and time
        const parsedDate = new Date(currentYear, month, day, hours, minutes);

        return parsedDate;
    }



    // Function to convert the extracted time into a future Date object
    private translateExpiringDate(timeString: string, offerCreated: Date) {
        // Get the current time in the local time zone
        const now = new Date(); // Local current date and time

        // Extract days, hours, weekday, and specific time from the timeString
        const dayMatch = timeString.match(/(\d+)\s*T/);  // Match days (e.g., "2 T")
        const hourMatch = timeString.match(/(\d+)\s*Std/);  // Match hours (e.g., "17 Std")
        const weekdayMatch = timeString.match(/(Montag|Dienstag|Mittwoch|Donnerstag|Freitag|Samstag|Sonntag)/);  // Match weekday (e.g., "Donnerstag")
        const timeMatch = timeString.match(/(\d{2}):(\d{2})/);  // Match time (e.g., "17:10")

        // Start with a targetDate equal to now
        let targetDate = new Date(now);

        // Calculate days and hours if present
        let days = dayMatch ? parseInt(dayMatch[1], 10) : 0;
        let hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;

        // Add days and hours to the targetDate
        targetDate.setDate(targetDate.getDate() + days);
        targetDate.setHours(targetDate.getHours() + hours);

        // If specific weekday is provided, adjust the date to the next occurrence of the given weekday
        if (weekdayMatch) {
            const weekdayNames = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
            const targetWeekday = weekdayNames.indexOf(weekdayMatch[0]);

            // Adjust to the next occurrence of the target weekday
            const currentWeekday = now.getDay();
            let diffDays = targetWeekday - currentWeekday;

            // If the target weekday is in the past or today, move to the next week
            if (diffDays <= 0) {
                diffDays += 7;
            }
            targetDate.setDate(targetDate.getDate() + diffDays);
        }

        // If a specific time is provided, set the hours and minutes
        if (timeMatch) {
            targetDate.setHours(parseInt(timeMatch[1], 10));
            targetDate.setMinutes(parseInt(timeMatch[2], 10));
        }

        // if targetDate.getMinutes() is smaller than offerCreated.getMinutes(), round to offerCreated.getMinutes()
        // if targetDate.getMinutes() is bigger than offerCreated.getMinutes(), round to the next hour (from 16:26:00 to 17:00:00)


        // Adjust minutes based on offerCreated
        let createdMinutes = offerCreated.getMinutes();
        let targetMinutes = targetDate.getMinutes();

        if (targetMinutes < createdMinutes) {
            // Set targetDate's minutes to match offerCreated's minutes
            targetDate.setMinutes(createdMinutes);
            targetDate.setSeconds(0, 0);
        } else if (targetMinutes > createdMinutes) {
            // Round targetDate to the next hour
            targetDate.setMinutes(createdMinutes);
            targetDate.setHours(targetDate.getHours() + 1);
            targetDate.setSeconds(0, 0);
        }

        // TODO: missing an hour -> make sure this is only added on prod

        targetDate.setHours(targetDate.getHours() + 1);
        // Return the future date in ISO format (local time)
        return targetDate; // Keeps it in local time
    }






    async searchResultsByFilter(cheerioPage: any, filter: EbayOfferSearchItem) {
        let offers: any[] = [];

        // get all current offers
// Extract the HTML of the `ul` element containing the offers
        const ulHtml = cheerioPage('ul.srp-results.srp-list.clearfix').html();


        if(ulHtml == null)
            return offers;

// If you need to manipulate or iterate over the `ul` content
        const $ = cheerio.load(ulHtml);

        switch(filter.sortingListBy) {
            case EbaySortingListBy.NEWEST_OFFER:
                // only look at offers that are from the last 48 hours.

                // @ts-ignore
                let newerThan48HoursOffers = [];


                // Select all <li> elements in the 'srp-river-results' container
                $('li').each((index, liElement) => {
                    // Check if this is the REWRITE_START li element
                    if ($(liElement).hasClass('srp-river-answer--REWRITE_START')) {
                        // Stop processing further <li> elements
                        return false; // This breaks out of the .each() loop
                    }

                    // Get the listing date from the span with the class 's-item__listingDate'
                    const listingDateText = $(liElement).find('.s-item__listingDate .BOLD').text().trim();

                    if (listingDateText) {
                        // Parse the date in the format "16. Nov. 17:10"
                        const listingDate = this.parseDate(listingDateText); // Replace with your parseDate function
                        if (listingDate) {
                            // Calculate if the listing date is within the last 48 hours
                            const now = new Date();
                            // @ts-ignore
                            const hoursDiff = Math.floor(Math.abs(now - listingDate) / 36e5); // Difference in hours

                            // If within the last 48 hours, add to the array
                            if (hoursDiff <= 148) {
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
                            newOffer.title = imgAlt.trim();
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
                        // Fetch the HTML of the offer page
                        const response = await axios.get(newOffer.link);
                        const htmlCode = response.data;

                        // Load the HTML into Cheerio
                        const page$ = cheerio.load(htmlCode);

                        // Check if the offer is already sold
                        const soldSelector = 'div.ux-layout-section__textual-display--statusMessage .ux-textspans--BOLD';
                        let soldText = page$(soldSelector).text().trim();
                        if (soldText && soldText.startsWith("Dieses Angebot wurde verkauft")) {
                            console.log(`[EBAY-OFFER-TASK]: Offer "${newOffer.title}" has been sold. Skipping.`);
                            return; // Skip this offer
                        }

                        // Get the viewer count
                        let viewerAmount = 0;
                        const viewerSelector = 'div[data-testid="ux-section-icon-with-details"] span.ux-textspans';
                        let viewerText = page$(viewerSelector).closest('div[data-testid="ux-section-icon-with-details"]').html();
                        if (viewerText) {
                            const viewerMatch = viewerText.match(/(\d+)\s(?:Leute\sbeobachten|Person\sbeobachtet)/);
                            if (viewerMatch && viewerMatch[1]) {
                                viewerAmount = parseInt(viewerMatch[1]);
                            }
                        }
                        newOffer.viewerAmount = viewerAmount;

                        // Get the number of bids (Gebote)
                        let bidAmount = newOffer.biddingOffersAmount || 0;
                        const bidSelector = 'a.ux-action span.ux-textspans--PSEUDOLINK';
                        let bidText = page$(bidSelector).text().trim();
                        if (bidText) {
                            const bidMatch = bidText.match(/(\d+)\s*Gebot/);
                            if (bidMatch && bidMatch[1]) {
                                bidAmount = parseInt(bidMatch[1]);
                            }
                        }
                        newOffer.biddingOffersAmount = bidAmount;

                        // Get the bid expiry time if it's a bidding offer
                        if (newOffer.isBeddingOffer) {

                            // Selector for the parent element containing the timer details
                            const timerSelector = 'span.ux-timer[data-testid="ux-timer"]';

// Ensure the element exists
                            if (page$(timerSelector).length > 0) {
                                // Extract "Endet in" details (e.g., "6 T 19 Std")
                                const endetInText = page$(`${timerSelector} span.ux-timer__text`).text().trim();

                                const endetInMatch = endetInText.match("Endet in");

                                if (endetInMatch) {
                                    newOffer.bidExpiring = this.translateExpiringDate(endetInText, newOffer.offerCreated); // Calculate the expiry date
                                }
                                else {
                                    let newDate = new Date(newOffer.offerCreated); // Create a Date object from `offerCreated`

                                    // Set the expiration date to December 31 of the current year
                                    newDate.setFullYear(new Date().getFullYear(), 11, 31); // 11 corresponds to December

                                    // Adjust for the local timezone offset
                                    const localOffset = newDate.getTimezoneOffset() * 60000; // Convert offset to milliseconds
                                    newOffer.bidExpiring = new Date(newDate.getTime() - localOffset); // Adjust to local time zone
                                }

                            }

                        } else {
                            let newDate = new Date(newOffer.offerCreated); // Create a Date object from `offerCreated`

                            // Set the expiration date to December 31 of the current year
                            newDate.setFullYear(new Date().getFullYear(), 11, 31); // 11 corresponds to December

                            // Adjust for the local timezone offset
                            const localOffset = newDate.getTimezoneOffset() * 60000; // Convert offset to milliseconds
                            newOffer.bidExpiring = new Date(newDate.getTime() - localOffset); // Adjust to local time zone
                        }
                    } catch (error) {
                        console.error(`Failed to load offer page for ${newOffer.title}! Error: ${error}`);
                        // Set bidExpiring to the end of the year if loading fails
                        newOffer.bidExpiring = new Date(new Date().getFullYear(), 11, 31);
                    }

                    offers.push(newOffer);
                    console.log(`[EBAY-OFFER-TASK]: Detected offer: '${newOffer.title}'.`);
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

            await this.sleep(5000);
            //const page = await browser.newPage();
            //await page.goto("https://www.ebay.de");
            console.log("[TASK]: " + this.name + " is running!")

            let allOffers = [];

            for(let item of this.searchResults) {
                //await this.searchForItem(page, item);
                let page = await axios.get(`https://www.ebay.de/sch/i.html?_from=R40&_nkw=${encodeURIComponent(item.title)}&_sacat=0&_sop=${item.sortingListBy}`)
                let $ = cheerio.load(page.data);

                console.log("[EBAY-OFFER-TASK]: Navigated to the search results page sort by " + item.sortingListBy + " for '" + item.title + "'.");
                let offers = await this.searchResultsByFilter($, item);

// Merge the new offers into allOffers properly by spreading the array
                // @ts-ignore
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
            //await page.close();
            //await browser.close();
            this.manager.reportSuccessfulTask(this, this.offers);

        }).catch((error) => {
            console.error("[TASK]: " + this.name + " failed! Down below: " + error.message + " \n" + error.stack)
            this.manager.reportUnsuccessfulTask(this, this.offers);
        })
    }
}