import { App, PluginSettingTab, Setting } from "obsidian"
import CommandSuggest from "./command-suggest"

import CommandPaletteEnhance from "../main"
import { t } from "./utils"
export interface CommandPaletteEnhanceSettings {
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

export const DEFAULT_SETTINGS: CommandPaletteEnhanceSettings = {
	enabledPinHistory: true,
	showHistoryIcon: true,
	showCommandInfo: true,
	enabledSearchCommandId: true,
	historyMax: 10,
	historyIgnoreList: ['command-palette:open', 'editor:save-file'],
	historyList: [],
	historyIcon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. --><path d="M256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C201.7 512 151.2 495 109.7 466.1C95.2 455.1 91.64 436 101.8 421.5C111.9 407 131.8 403.5 146.3 413.6C177.4 435.3 215.2 448 256 448C362 448 448 362 448 256C448 149.1 362 64 256 64C202.1 64 155 85.46 120.2 120.2L151 151C166.1 166.1 155.4 192 134.1 192H24C10.75 192 0 181.3 0 168V57.94C0 36.56 25.85 25.85 40.97 40.97L74.98 74.98C121.3 28.69 185.3 0 255.1 0L256 0zM256 128C269.3 128 280 138.7 280 152V246.1L344.1 311C354.3 320.4 354.3 335.6 344.1 344.1C335.6 354.3 320.4 354.3 311 344.1L239 272.1C234.5 268.5 232 262.4 232 256V152C232 138.7 242.7 128 256 128V128z"/></svg>',
	commandInfoHeight: '14px',
}

class CommandSuggestIgnoring extends CommandSuggest {
	constructor(private readonly plugin: CommandPaletteEnhance, inputEl: HTMLInputElement) {
		super(plugin.app, inputEl)
	}
	getItems() {
		return this.plugin.app.commands.listCommands().filter(item => !this.plugin.settings.historyIgnoreList.includes(item.id))
	}
}

export class SettingTab extends PluginSettingTab {
	plugin: CommandPaletteEnhance

	private ignoreListContainer: HTMLElement = null

	constructor(app: App, plugin: CommandPaletteEnhance) {
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
