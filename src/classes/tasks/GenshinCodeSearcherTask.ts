
import {Task} from "./Task";

import axios from "axios";
import cheerio from "cheerio";
import {HTMLInfo} from "../backend/HTMLInfo";
import {ErrorManager} from "../backend/ErrorManager";
import {GenshinManager} from "../managers/genshin/GenshinManager";
import {GenshinCode} from "../managers/genshin/GenshinCode";

export class GenshinCodeSearcherTask extends Task {
    manager: GenshinManager;
    codes: GenshinCode[];

    constructor(manager: GenshinManager) {
        super("GenshinCodeSearcherTask");
        this.manager = manager;
        this.codes = [];
    }

    async runGenshinTask() {
        await super.runTask(async () => {
            await axios.get("https://genshin-impact.fandom.com/wiki/Promotional_Code").then(async (res) => {

                const html = res.data;
                const $ = cheerio.load(html);
                const codeTable = $("table")[0].children[1] as any;

                // check for codes that are active
                // @ts-ignore
                let activeCodes = codeTable.children.filter((code) => code.name === "tr" && code.children[7].attribs.style === "background-color:rgb(153,255,153,0.5)")
                // looping through all rows
                // @ts-ignore
                activeCodes.forEach((code) => {
                    let genshinCode = new GenshinCode(code.children[3].children[0].data.replace("\n", ""),
                        code.children[7].children[0].data.replace("Discovered: ", ""),
                        code.children[1].children[0].attribs.href);

                    // if special code
                    if (code.children[1].children[0].children[0].children === undefined) {
                        genshinCode.setCode(code.children[1].children[0].children[0].data);
                        genshinCode.setIsSpecialCode();
                    } else {
                        genshinCode.setCode(code.children[1].children[0].children[0].children[0].children[0].data);
                    }
                    // if website does not know when code is going to be invalid
                    if (code.children[7].children[2] === undefined) {
                        genshinCode.setValid(false);
                    } else {
                        genshinCode.setValid(code.children[7].children[2].data.replace("Valid: ", "").replace("Valid until: ", ""));
                    }

                    // TODO - data not found
                    // looping through items
                    // @ts-ignore
                    code.children[5].children.forEach((item) => {
                        if (item.name === "span") {

                            // check if amount is defined
                            if (item.children[3] === undefined || item.children[2] === undefined) {
                                genshinCode.addItem(item.children[1].children[1].attribs.title + item.children[1].children[2].data);
                            } else {
                                genshinCode.addItem(item.children[2].attribs.title + item.children[3].data);
                            }
                        }
                    })
                    this.codes.push(genshinCode);
                });
                console.log("[GENSHIN] Loaded " + this.codes.length + " codes");

                this.manager.reportSuccessfulTask(this, this.codes)
            }).catch((error) => {
                ErrorManager.showError("Error while running Genshin Code Task", error)
            })
        });
    }
}