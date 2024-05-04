// Holds all the commands that are available to the bot

import {Command} from "./Command";
import {ChatInputCommandInteraction} from "discord.js";

const commands: Command[] = [
    new Command("viewTasks", "commandViewTasksDescription")
        .setInteractionCallback((interaction: ChatInputCommandInteraction) => {
            console.log(interaction)
        }),

]


export default commands;