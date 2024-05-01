import {Task} from "./Task";
import {SteamManager} from "../managers/steam/SteamManager";

import axios from "axios";
import puppeteer from "puppeteer";
import cheerio from "cheerio";
import {HTMLInfo} from "../backend/HTMLInfo";
import {SteamGame} from "../managers/steam/SteamGame";
/*
*
* This task looks for any free games on Steam and then passed that data to other objects.
*
 */

export class SteamSearcherTask extends Task {

    manager: SteamManager;

    games: SteamGame[];
    constructor(manager) {
        super("SteamSearcherTask");
        this.manager = manager;
    }
    runSteamTask(repeat: number) {
        super.runTask(repeat, async () => {
            await axios.get("https://store.steampowered.com/search/?maxprice=free&specials=1").then(async (result) => {
                // If URL does not return proper status code, something went wrong.
                if(result.status !== 200) {
                    this.manager.reportUnsuccessfulTask(this);
                    console.log("[TASK]: " + this.name + " failed! Status code: " + result.status)
                    return;
                }
                this.games = [];
                const $ = cheerio.load(result.data);

                // If no games could be found or some error occurred while doing so.
                if($('div[id="search_resultsRows"]')[0] === undefined || $('div[id="search_resultsRows"]')[0] === null ||
                    $('div[id="search_resultsRows"]') === undefined || $('div[id="search_resultsRows"]') === null) {
                    this.manager.reportSuccessTask(this, this.games, false);
                    console.log("[TASK]: " + this.name + " failed! The website did not display any games!")
                    return;
                }

                const gameLength = $('div[id="search_resultsRows"]')[0].children.length;
                for (var i = 0; i < gameLength - 1; i++) {
                    if ($('div[id="search_resultsRows"]')[0].children[i].next.name === 'a') {
                        let obj = $('div[id="search_resultsRows"]')[0].children[i].next;
                        let DLCobject = await this.checkIfGameIsDLC(obj.attribs.href, obj.children[2].next.children[0].next.children[0].next.children[0].data);
                        this.games.push(new SteamGame(obj.children[2].next.children[0].next.children[0].next.children[0].data,
                            obj.children[2].next.children[3].children[0].data,
                            DLCobject.untilDate, $('div[id="search_resultsRows"]')[0].children[i].next.attribs.href,
                            DLCobject.isDLC, DLCobject.mainGameTitle, DLCobject.mainGameLink, obj.children[0].next.children[0].attribs.src));

                        this.manager.reportSuccessfulTask(this, this.games, true);

                    }
                }

            }).catch((error) => {
                console.error("[TASK]: " + this.name + " failed! Down below: " + error.message + " \n" + error.stack)
            })
        });
    }


    convertAMPMTimeToFullTime(time12h) {
        let modifier = time12h[time12h.length - 5] + time12h[time12h.length - 4];
        let newtime12h = time12h.replace(modifier, "");
        let [hours, minutes] = newtime12h.split(':');
        if (hours === '12') {
            hours = '00';
        }
        if (modifier === 'PM' || modifier === 'pm') {
            hours = parseInt(hours, 10) + 12;
        }


        // TODO - NOT ENTIRELY ACCURATE
        // add 9 hours time difference
        hours = parseInt(hours, 10) + 9;
        return [hours, Number(minutes)];
    }
    makeUntilDateIntoDate(untilDate)
    {
        let untilDateNew = untilDate.replace("Free to keep when you get it before", "");
        let current = new Date().getFullYear();
        untilDateNew = untilDateNew.replace("Some limitations apply.", "");
        untilDateNew = untilDateNew.replace(".", "")
        untilDateNew = untilDateNew.replace(".", "")
        untilDateNew = untilDateNew.replace("@", "")
        untilDateNew = untilDateNew.replace(" ", "")
        untilDateNew = untilDateNew.replace("%s", "")
        let dayOfMonth = Number(untilDateNew.split(" ")[0]);
        let month = untilDateNew.split(" ")[1];
        let time = untilDateNew.split(" ")[3];
        let [hours, minutes] = this.convertAMPMTimeToFullTime(time);
        untilDateNew = new Date(Date.parse(month + " "+ dayOfMonth + ", " + current));

        untilDateNew.setHours(hours);
        untilDateNew.setMinutes(minutes);

        return untilDateNew;
    }
    private async checkIfGameIsDLC(link, title)
    {
        return await axios.get(link, {headers: {'user-agent': HTMLInfo.steam.userAgent}}).then((linkResult) => {
            const linkHtml = linkResult.data;
            const link$ = cheerio.load(linkHtml);

            let isDLC = link$('div[class="game_area_bubble game_area_dlc_bubble "]');
            let untilDate = link$('p[class="game_purchase_discount_quantity "]');
            let baseGame = title;
            if ((isDLC != null && isDLC.length > 0) === true) {
                baseGame = isDLC[0].children[0].next.children[2].children[1].children[0].data;
            }

            if((untilDate != null && untilDate.length > 0) === true) {
                // get until date and convert it to readable format
                untilDate = untilDate[0].children[0].data;
                untilDate = this.makeUntilDateIntoDate(untilDate);
            }
            return new Promise((resolve, reject) => {
                // if game is not a DLC
                if ((isDLC != null && isDLC.length > 0) === false) {
                    console.log("[STEAM]: Game is not a DLC: " + title);
                    resolve({DLCtitle: title, mainGameTitle: title, isDLC: false, mainGameLink: '', untilDate: untilDate});
                } else {
                    console.log("[STEAM]: Game is a DLC for the game: " + baseGame);
                    resolve({DLCtitle: title, mainGameTitle: baseGame, isDLC: true, mainGameLink: isDLC[0].children[0].next.children[2].children[1].children[0].parent.attribs.href, untilDate: untilDate});
                }
            });
        }).catch(linkError => {
            console.log("[STEAM]: Error while fetching game steam link: " + linkError);
        });
    }
}