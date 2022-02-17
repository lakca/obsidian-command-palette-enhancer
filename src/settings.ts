import { App, Notice, PluginSettingTab, Setting } from "obsidian";

import CommandPaletteEnhance from "../main";
import { t } from "./utils";

export const COMMAND_LIST_ORDERS = ['default-asc', 'default-desc', 'alphabetical-asc', 'alphabetical-desc'] as const

export type CommandListOrder = typeof COMMAND_LIST_ORDERS[number]

export interface CommandPaletteEnhanceSettings {
	recentlyPinned: boolean;
	historyMax: number;
	historyIgnoreList: string[];
	fuzzySearch: boolean;
	commandListOrder: CommandListOrder;
}

export const DEFAULT_SETTINGS: CommandPaletteEnhanceSettings = {
	recentlyPinned: true,
	historyMax: 10,
	historyIgnoreList: ['command-palette:open'],
	fuzzySearch: true,
	commandListOrder: 'default-asc',
}

export class SettingTab extends PluginSettingTab {
	plugin: CommandPaletteEnhance;

	constructor(app: App, plugin: CommandPaletteEnhance) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		for (const item of ['recentlyPinned', 'fuzzySearch'] as const) {
			new Setting(containerEl)
			.setName(t(`settings.${item}`))
			.setDesc(t(`settings.${item}.desc`))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings[item]);
				toggle.onChange(value => {
					this.plugin.settings[item] = value
					this.plugin.saveSettings().then(() => {
						new Notice(t(`settings.${item}.${value}`))
					})
				});
			})
		}

		for (const item of ['commandListOrder'] as const) {
			new Setting(containerEl)
			.setName(t(`settings.${item}`))
			.setDesc(t(`settings.${item}.desc`))
			.addDropdown(dropdown => {
				dropdown.setValue(this.plugin.settings[item]);
				COMMAND_LIST_ORDERS.forEach(value => {
					dropdown.addOption(value, t(`settings.commandListOrder.${value}`));
				})
				dropdown.onChange((value: CommandListOrder) => {
					this.plugin.settings[item] = value
					this.plugin.saveSettings().then(() => {
						new Notice(t(`settings.${item}.${value}`))
					})
				})
			})
		}
	}
}
