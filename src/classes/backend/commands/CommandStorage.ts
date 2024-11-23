// Holds all the commands that are available to the bot

import {Command} from "./Command";
import {ChatInputCommandInteraction, ColorResolvable, EmbedAuthorOptions, EmbedBuilder} from "discord.js";
import {Manager} from "../Manager";
import {Task} from "../../tasks/Task";
import axios from "axios";

function getCommands() {
    return [
        new Command("viewTasks", "commandViewTasksDescription")
            .setOnlyForUser()
            .setInteractionCallback((interaction: ChatInputCommandInteraction, command: Command) => {
                const managers = Manager.instances;
                let embeds: any[] = [];

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
                                // @ts-ignore
                                {name: command.localisation.get("lastErrorStack"), value: task.lastErrorStack?.stack ?? "-", inline: false}
                            )
                        );
                    });
                });

                interaction.reply({ content: command.localisation.get("contains_all_the_tasks"), embeds: embeds, ephemeral: command.isOnlyForUser() });
            }),

        new Command("add-ebay-search", "addEbaySearchDescription")
            .setOnlyForUser()
            .addParameter("search", "STRING", "none", true)
            .setInteractionCallback((interaction: ChatInputCommandInteraction, command: Command) => {
                const searchValue = interaction.options.getString("search");

                // Check if the parameter is provided
                if (searchValue) {
                    axios.post("https://api.montriscript.com/api/ebay/offer/addSearchResult", {name: searchValue}).then((result: any) => {
                        if(result.status === 200) {
                            interaction.reply("Search term '" + searchValue + "' was added successfully.")
                        }
                        else {
                            interaction.reply("Failed to add search term " + searchValue + ".")
                        }
                    }).catch((error: any) => {
                        console.error(error)
                    })
                } else {
                    // Handle case where the parameter was not provided (shouldn't happen since it's required)
                    interaction.reply("Please provide a search term.");
                }
            }),

        new Command("delete-ebay-search", "deleteEbaySearchDescription")
            .setOnlyForUser()
            .addParameter("search", "STRING", "none", true)
            .setInteractionCallback((interaction: ChatInputCommandInteraction, command: Command) => {
                const searchValue = interaction.options.getString("search");

                // Check if the parameter is provided
                if (searchValue) {
                    axios.post("https://api.montriscript.com/api/ebay/offer/deleteSearchResult", {name: searchValue}).then((result: any) => {
                        if(result.status === 200) {
                            interaction.reply("Search term '" + searchValue + "' was removed successfully.")
                        }
                        else {
                            interaction.reply("Failed to remove search term " + searchValue + ".")
                        }
                    }).catch((error: any) => {
                        interaction.reply("Error while attempting to delete '" + searchValue + "' - " + error.response.data.message)
                    })
                } else {
                    // Handle case where the parameter was not provided (shouldn't happen since it's required)
                    interaction.reply("Please provide a search term.");
                }
            }),

        new Command("view-ebay-search", "viewEbaySearchDescription")
            .setOnlyForUser()
            .setInteractionCallback((interaction: ChatInputCommandInteraction, command: Command) => {
                axios.get("https://api.montriscript.com/api/ebay/offer/searchResults").then((response: any) => {
                    if(response.status === 200) {
                        let results = [];
                        for(let i = 0; i < response.data.length; i++) {
                            results.push(response.data[i].name)
                        }
                        interaction.reply("Search results: " + results.join(", "));
                    }
                    else {
                        interaction.reply("Failed to retrieve search results.")
                    }
                }).catch((error: any) => {
                    console.error(error)
                    interaction.reply("Failed to retrieve search results.")
                })
            }),
    ];
}


export default getCommands;