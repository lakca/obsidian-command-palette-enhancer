import { CommandPaletteEnhanceSettings, DEFAULT_SETTINGS, SettingTab } from './settings';

import { Base as BaseProvider } from './providers/base';
import { Plugin } from 'obsidian';
import providers from './provider';

// Remember to rename these classes and interfaces!

export default class CommandPaletteEnhance extends Plugin {
	settings: CommandPaletteEnhanceSettings;

	providers: Record<string, BaseProvider> = {};

	async onload() {
		console.log('load enhance')

		await this.loadSettings();

		Object.entries(providers).forEach(([name, cls]) => {
			this.providers[name] = new cls(this);
			this.providers[name].load();
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this));
	}

	onunload() {
		console.log('unload enhance')
		Object.values(this.providers).forEach((name) => {
			name.unload();
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
