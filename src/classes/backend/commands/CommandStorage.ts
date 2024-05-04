// Holds all the commands that are available to the bot

import {Command} from "./Command";
import {ChatInputCommandInteraction} from "discord.js";

const commands: Command[] = [
    new Command("tasks", "Displays all the running tasks", true, "")
        .setInteractionCallback((interaction: ChatInputCommandInteraction) => {
            console.log(interaction)
        }),

]


export default commands;