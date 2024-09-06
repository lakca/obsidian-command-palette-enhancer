import { App, PluginSettingTab, Setting } from "obsidian"
import CommandSuggest from "./command-suggest"

import CommandPaletteEnhancer from "../main"
import { t } from "./utils"
export interface CommandPaletteEnhancerSettings {
	enabledPinHistory: boolean;
	showHistoryIcon: boolean;
	showCommandInfo: boolean;
	enabledSearchCommandId: boolean;
	historyMax: number;
	historyList: string[];
	historyIgnoreList: string[];
	historyIcon: string;
	commandInfoHeight: string;
}

export const DEFAULT_SETTINGS: CommandPaletteEnhancerSettings = {
	enabledPinHistory: true,
	showHistoryIcon: true,
	showCommandInfo: true,
	enabledSearchCommandId: true,
	historyMax: 10,
	historyIgnoreList: ['command-palette:open', 'editor:save-file'],
	historyList: [],
	historyIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>',
	commandInfoHeight: '14px',
}

class CommandSuggestIgnoring extends CommandSuggest {
	constructor(private readonly plugin: CommandPaletteEnhancer, inputEl: HTMLInputElement) {
		super(plugin.app, inputEl)
	}
	getItems() {
		return this.plugin.app.commands.listCommands().filter(item => !this.plugin.settings.historyIgnoreList.includes(item.id))
	}
}

export class SettingTab extends PluginSettingTab {
	plugin: CommandPaletteEnhancer

	private ignoreListContainer: HTMLElement = null

	constructor(app: App, plugin: CommandPaletteEnhancer) {
		super(app, plugin)
	}

	updateIgnoreListEl() {
		this.ignoreListContainer.empty()
		for (const commandId of this.plugin.settings.historyIgnoreList) {
			this.ignoreListContainer.createDiv('', (div) => {
				div.setAttribute('title', commandId)
				this.plugin.addClassTo(div, 'history-ignore-item')
				const command = this.app.commands.findCommand(commandId)
				if (command) {
					div.dataset.commandId = commandId
					div.createSpan('', el => {
						this.plugin.addClassTo(el, 'history-ignore-item-remove')
					})
					div.createSpan({ text: command.name })
				}
			})
		}
	}

	display(): void {
		const {containerEl} = this

		containerEl.empty()

		containerEl.createEl('h2', {text: t('setting.title')})
		.style.textAlign = 'center'

		for (const item of ['enabledPinHistory', 'showHistoryIcon', 'showCommandInfo', 'enabledSearchCommandId'] as const) {
			new Setting(containerEl)
			.setName(t(`settings.${item}`))
			.setDesc(t(`settings.${item}.desc`))
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings[item])
				toggle.onChange(value => {
					this.plugin.settings[item] = value
					this.plugin.saveSettings()
					this.plugin.trigger('change-setting', item, value)
				})
			})
		}

		let dynText: HTMLElement = null
		for (const item of ['historyMax'] as const) {
			new Setting(containerEl)
			.setName(t(`settings.${item}`))
			.setDesc(t(`settings.${item}.desc`))
			.addSlider(slider => {
				slider.setValue(this.plugin.settings[item])
					.setLimits(1, 100, 1)
					.setDynamicTooltip()
					.onChange(value => {
					this.plugin.settings[item] = Number(value)
					this.plugin.saveSettings()
					this.plugin.trigger('change-setting', item, value)
					dynText.textContent = `${this.plugin.settings[item]}`
				})
			})
      .settingEl.createDiv('', (el) => {
				dynText = el
        el.style.minWidth = '2.3em'
        el.style.textAlign = 'right'
        el.textContent = ` ${this.plugin.settings.historyMax}`
      })
		}

		for (const item of ['commandInfoHeight'] as const) {
			new Setting(containerEl)
			.setName(t(`settings.${item}`))
			.setDesc(t(`settings.${item}.desc`))
			.addText(text => {
				// @ts-ignore
				text.setValue(this.plugin.settings[item])
					.onChange(value => {
					// @ts-ignore
					this.plugin.settings[item] = value
					this.plugin.saveSettings()
					this.plugin.trigger('change-setting', item, this.plugin.settings[item])
				})
			})
		}

		new Setting(containerEl)
		.setName(t('settings.historyIgnoreList'))
		.setDesc(t('settings.historyIgnoreList.desc'))
		.addText(text => {
			text.setPlaceholder(t('settings.historyIgnoreList.placeholder'))
			const commandSuggest = new CommandSuggestIgnoring(this.plugin, text.inputEl)
			this.plugin.registerEvent(commandSuggest.on('select', command => {
				if (!this.plugin.settings.historyIgnoreList.includes(command.id)) {
					this.plugin.settings.historyIgnoreList.push(command.id)
					this.plugin.saveSettings()
					this.plugin.trigger('change-setting', 'historyIgnoreList', this.plugin.settings.historyIgnoreList)
					this.updateIgnoreListEl()
				}
			}))
		})

		containerEl.createDiv('', container => {
			this.ignoreListContainer = container
			this.plugin.addClassTo(container, 'history-ignore-list')
			this.ignoreListContainer.on('click', '.' + this.plugin.getClass('history-ignore-item-remove'), e => {
				const idx = this.plugin.settings.historyIgnoreList.indexOf((e.target as HTMLElement).parentElement.dataset.commandId)
				if (~idx) {
					this.plugin.settings.historyIgnoreList.splice(idx, 1)
					this.updateIgnoreListEl()
					this.plugin.trigger('change-setting', 'historyIgnoreList', this.plugin.settings.historyIgnoreList)
				}
			})
			this.updateIgnoreListEl()
		})

		for (const item of ['historyIcon'] as const) {
			const isArr = false
			new Setting(containerEl)
			.setName(t(`settings.${item}`))
			.setDesc(t(`settings.${item}.desc`))
			.addTextArea(textarea => {
				// @ts-ignore
				textarea.setValue(isArr ? this.plugin.settings[item].join('\n') : this.plugin.settings[item])
					.onChange(value => {
					// @ts-ignore
					this.plugin.settings[item] = isArr ? value.trim().split('\n').map(e => e.trim()) : value
					this.plugin.saveSettings()
					this.plugin.trigger('change-setting', item, this.plugin.settings[item])
				})
			})
		}
	}
}
