// Holds all the commands that are available to the bot

import {Command} from "./Command";
import {ChatInputCommandInteraction, ColorResolvable, EmbedAuthorOptions, EmbedBuilder} from "discord.js";
import {Manager} from "../Manager";
import {Task} from "../../tasks/Task";

function getCommands() {
    return [
        new Command("viewTasks", "commandViewTasksDescription")
            .setOnlyForUser()
            .setInteractionCallback((interaction, command) => {
                const managers = Manager.instances;
                let embeds = [];

                managers.forEach((manager) => {
                    manager.tasks.forEach((task) => {
                        embeds.push(new EmbedBuilder()
                            .setTitle(command.localisation.get("task") + ": " + task.name)
                            .setAuthor({ name: manager.name })
                            .setColor("#ff0000")
                            .setDescription(command.localisation.get(task.name))
                            .addFields(
                                { name: command.localisation.get("currentStatus"), value: task.state, inline: true },
                                { name: command.localisation.get("currentStartedRun"), value: task.currentRunStarted?.toLocaleString(command.localisation.getLanguage()) ?? "-", inline: true },
                                { name: command.localisation.get("lastSuccessfulEndedRun"), value: task.lastRunFinished?.toLocaleString(command.localisation.getLanguage()) ?? "-", inline: true },
                                {name: command.localisation.get("amountOfSuccessfulRuns"), value: task.amountOfRuns + "", inline: true},
                                {name: command.localisation.get("amountOfFailedRuns"), value: task.amountOfFailures + "", inline: true},
                                {name: command.localisation.get("repeatsAfter"), value: task.repeatsAfter + " " + command.localisation.get("seconds"), inline: true},
                                {name: command.localisation.get("lastErrorStack"), value: task.lastErrorStack?.stack ?? "-", inline: false}
                            )
                        );
                    });
                });

                interaction.reply({ content: command.localisation.get("contains_all_the_tasks"), embeds: embeds, ephemeral: command.isOnlyForUser() });
            })
    ];
}


export default getCommands;