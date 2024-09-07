import { CommandPaletteEnhancerSettings, DEFAULT_SETTINGS, SettingTab } from './settings'

import { Base as BaseProvider } from './providers/base'
import { Plugin, Events, EventRef, App, PluginManifest } from 'obsidian'
import providers from './provider'
import { addClassTo, getClass } from './utils'

// Remember to rename these classes and interfaces!

export default interface CommandPaletteEnhancer extends Events {
	on(name: 'change-setting', callback: (key: string, value: unknown) => void): EventRef
}

export default class CommandPaletteEnhancer extends Plugin {
	settings: CommandPaletteEnhancerSettings

	providers: Record<string, BaseProvider> = {}

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest)
		Events.call(this)
	}

	async onload() {
		await this.loadSettings()

		Object.entries(providers).forEach(([name, cls]) => {
			this.providers[name] = new cls(this)
			this.providers[name].load()
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this))
	}

	addClassTo = addClassTo

	getClass = getClass

	onunload() {
		Object.values(this.providers).forEach((name) => {
			name.unload()
		})
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}
}

Object.assign(CommandPaletteEnhancer.prototype, Events.prototype)
