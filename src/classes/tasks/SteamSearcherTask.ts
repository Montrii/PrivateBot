import {Task} from "./Task";
import {SteamManager} from "../managers/steam/SteamManager";
import axios from "axios";
import cheerio from "cheerio";
import {SteamGame} from "../managers/steam/SteamGame";
import {ErrorManager} from "../backend/ErrorManager";


/*
*
* This task looks for any free games on Steam and then passed that data to other objects.
*
 */


export class SteamSearcherTask extends Task {

    manager: SteamManager;

    games: SteamGame[];
    constructor(manager: SteamManager) {
        super("SteamSearcherTask");
        this.manager = manager;
        this.games = [];
    }
    async runSteamTask() {
        await super.runTask(async () => {
            await axios.get("https://store.steampowered.com/search/?maxprice=free&specials=1").then(async (result) => {


                // If URL does not return proper status code, something went wrong.
                if(result.status !== 200) {
                    this.manager.reportUnsuccessfulTask(this);
                    console.log("[TASK]: " + this.name + " failed! Status code: " + result.status)
                    return;
                }
                this.games = [];
                const $ = cheerio.load(result.data);

                console.log("[TASK]: " + this.name + " is running!")

                // If no games could be found or some error occurred while doing so.
                if($('div[id="search_resultsRows"]')[0] === undefined || $('div[id="search_resultsRows"]')[0] === null ||
                    $('div[id="search_resultsRows"]') === undefined || $('div[id="search_resultsRows"]') === null) {
                    this.manager.reportSuccessfulTask(this, this.games, false);
                    console.log("[TASK]: " + this.name + " failed! The website did not display any games!")
                    return;
                }

                // filter only games out of this list
                const games = $('div[id="search_resultsRows"]')[0].children.filter((element) => {
                    return (element?.next as any)?.name === 'a' && (element?.next as any)?.attribs.href.includes("store.steampowered.com")
                }).map((element) => element.next);

                // if no games could be found in this list -> none are free
                if(games.length <= 0) {
                    this.manager.reportSuccessfulTask(this, this.games, false);
                    console.log("[TASK]: " + this.name + " failed! The website did not have any games!")
                    return;
                }


                // Loop through each available game

                for(let i = 0; i < games.length; i++) {
                    let game = games[i];
                    let title = ($(game!).find("span.title").get(0)!.children[0] as any).data
                    let link = (game as any).attribs.href
                    let releaseDate = new Date(($(game!).find("div.search_released").get(0)!.children[0] as any).data)
                    let originalPrice = ($(game!).find("div.discount_original_price").get(0)?.children[0] as any)?.data
                    let image = ($(game!).find("div.search_capsule").get(0)!.children[0] as any).attribs.src
                    let appId = (game as any).attribs["data-ds-appid"]
                    let DLCInformation = await this.validateIfGameIsDLC(appId)

                    // Ignoring this line because we use multiple constructors
                    // @ts-ignore
                    let steamGame = new SteamGame(appId, title, releaseDate, DLCInformation.ratingIcon, image, link, DLCInformation.untilDate, originalPrice, DLCInformation.isDLC, DLCInformation.mainGame)
                    this.games.push(steamGame)
                }

                // Report to manager that task was successful
                this.manager.reportSuccessfulTask(this, this.games, true);

            }).catch((error) => {
                ErrorManager.showError("[TASK]: " + this.name + " failed! Down below: ", error);
            })
        });
    }


    private async getMainGameByLink(link: string) : Promise<any> {
        return await axios.get(link).then((result) => {

            // If website does not return proper status code, something went wrong.
            if(result.status !== 200) {
                console.log("[STEAM]: Receiving main game for DLC failed! Status code: " + result.status);
                return new Promise((resolve, reject) => {
                    resolve(new SteamGame())
                })
            }

            const $ = cheerio.load(result.data);
            const title = ($('div[id="appHubAppName"]').get(0)!.children[0] as any).data;
            const releaseDate = new Date(($('div[class="date"]').get(0)!.children[0] as any).data);
            const ratingIcon = ($('div[class="game_rating_icon"]').get(0)!.children[0]?.next! as any).attribs?.src
            const image = $('img[class="game_header_image_full"]').get(0)!.attribs.src;
            const appId = link.split('/app/')[1]?.split('/')[0];

            return new Promise((resolve, reject) => {
                resolve(new SteamGame(appId, title, releaseDate, ratingIcon, image, link))
            })
        }).catch((error) => {
            ErrorManager.showError("[STEAM]: Error while fetching main game for DLC: ", error);
        })
    }

    private async validateIfGameIsDLC(appId: string): Promise<any> {
        return await axios.get("https://store.steampowered.com/app/" + appId).then(async (result) => {

            // Variables to return
            let untilDate = null;
            let mainGame : SteamGame;

            // If website does not return proper status code, something went wrong.
            if(result.status !== 200) {
                console.log("[STEAM]: DLC check failed for appId" + appId +  " | Status code: " + result.status);
                return new Promise((resolve, reject) => {
                    resolve({isDLC: false})
                })
            }

            const $ = cheerio.load(result.data);

            let untilDateContainer = $('p[class="game_purchase_discount_quantity "]');
            if(untilDateContainer !== null && untilDateContainer.children.length > 0) {
                untilDate = SteamSearcherTaskUtilties.makeUntilDateIntoDate((untilDateContainer[0].children[0] as any).data);
            }

            const ratingIcon = ($('div[class="game_rating_icon"]').get(0)!.children[0]?.next! as any).attribs?.src

            const dlcContainer = $('div[class="game_area_bubble game_area_dlc_bubble "]');

            // check if dlcContainer is empty on the page -> no DLC
            if(dlcContainer === null || dlcContainer.length <= 0 || dlcContainer.children.length <= 0) {
                console.log("[STEAM]: Game is not a DLC: " + appId);
                return new Promise((resolve, reject) => {
                    resolve({isDLC: false, untilDate: untilDate, ratingIcon: ratingIcon})
                })
            }

            // Here we know that the game is a DLC
            mainGame = await this.getMainGameByLink($(dlcContainer).find("a").get(0)!.attribs!.href) as SteamGame;

            console.log("[STEAM]: Game is a DLC: " + appId + " | Main game: " + mainGame.title)

            return new Promise((resolve, reject) => {
                resolve({isDLC: true, untilDate: untilDate, ratingIcon: ratingIcon, mainGame: mainGame})
            })

        }).catch((error) => {
            ErrorManager.showError("[STEAM]: Error while fetching game steam link in attempting to check if DLC: ", error);
        });
    }
}


const SteamSearcherTaskUtilties = {
    convertAMPMTimeToFullTime(time12h: any) {
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
    },
    makeUntilDateIntoDate(untilDate: any)
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
}