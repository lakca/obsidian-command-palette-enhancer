import { CommandPaletteEnhanceSettings, DEFAULT_SETTINGS, SettingTab } from './settings'

import { Base as BaseProvider } from './providers/base'
import { Plugin, Events, EventRef, App, PluginManifest } from 'obsidian'
import providers from './provider'

// Remember to rename these classes and interfaces!

export default interface CommandPaletteEnhance extends Events {
	on(name: 'change-setting', callback: (key: string, value: unknown) => void): EventRef
}

export default class CommandPaletteEnhance extends Plugin {
	settings: CommandPaletteEnhanceSettings

	providers: Record<string, BaseProvider> = {}

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest)
		Events.call(this)
	}

	async onload() {
		console.log('load enhance')

		await this.loadSettings()

		Object.entries(providers).forEach(([name, cls]) => {
			this.providers[name] = new cls(this)
			this.providers[name].load()
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SettingTab(this.app, this))
	}

	addClassTo(el: HTMLElement, classes: string|string[]) {
		classes = Array.isArray(classes) ? classes : [classes]
		el.classList.add(...classes.map(e => this.getClass(e)))
		return this
	}

	getClass(cls: string) {
		return `command-palette-enhance-${cls}`
	}

	onunload() {
		console.log('unload enhance')
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

Object.assign(CommandPaletteEnhance.prototype, Events.prototype)
