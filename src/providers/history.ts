import { App, Command, debounce } from "obsidian"
import { Base } from "./base"
import { getDeep } from "../utils"

export default class History extends Base {

  private stylesheetId = 'command-palette-history-stylesheet'

  get stylesheet()  {
    return `
    .command-palette-enhancer-suggestion-info {
      position: absolute;
      top: 100%;
      left: 45px;
      margin-top: calc((-${this.COMMAND_INFO_HEIGHT}) / 2 - 12px / 2);
      line-height: 1;
      font-size: 12px;
      color: #8d8d8d;
    }
    .prompt .suggestion-item .suggestion-content {
		padding-inline-start: 30px;
	}
    .prompt .suggestion-item:has(.command-palette-enhancer-suggestion-flair) .suggestion-content {
		padding-inline-start: 10px;
	}
    .prompt .suggestion-item {
	  position: relative;
      padding-bottom: ${this.COMMAND_INFO_HEIGHT};
    }
    `
  }

  private getCommands: App['internalPlugins']['plugins']['command-palette']['instance']['getCommands']

  private executeCommandById: App['commands']['executeCommandById']

  private renderSuggestion: App['internalPlugins']['plugins']['command-palette']['instance']['modal']['renderSuggestion']

  private onChooseSuggestion: App['internalPlugins']['plugins']['command-palette']['instance']['modal']['onChooseSuggestion']

  private getSuggestions: App['internalPlugins']['plugins']['command-palette']['instance']['modal']['getSuggestions']

  override onload(): void {
    setTimeout(() => this.init(), 100)
  }

  private init() {
    const self = this

    // exchange history commands to the head of commands list.
    if (getDeep(this.plugin.app, 'internalPlugins.plugins.command-palette.instance.getCommands')) {
      this.getCommands = this.plugin.app.internalPlugins.plugins['command-palette'].instance.getCommands
      this.plugin.app.internalPlugins.plugins['command-palette'].instance.getCommands = function() {
        const pinned = self.plugin.app.internalPlugins.plugins['command-palette'].instance.options.pinned || []
        const commands: Command[] = self.getCommands.apply(this, arguments)
        if (self.ENABLED_PIN_HISTORY && self.HISTORY_LIST.length) {
          const pinnedCommands = pinned.map(id => self.plugin.app.commands.findCommand(id))
          const historyCommands = self.HISTORY_LIST.map(id => self.plugin.app.commands.findCommand(id))
          return Array.from(new Set(pinnedCommands.concat(historyCommands, commands)))
        }
        return commands
      }
      this.addUnload(() => {
        this.plugin.app.internalPlugins.plugins['command-palette'].instance.getCommands = this.getCommands
      })
    }

    // add history via capturing execution of command by invoking `executeCommandById`.
    if (getDeep(this.plugin.app, 'commands.executeCommandById')) {
      this.executeCommandById = this.plugin.app.commands.executeCommandById
      this.plugin.app.commands.executeCommandById = function(commandId) {
        self.addHistory(commandId)
        self.executeCommandById.apply(this, arguments)
      }
      this.addUnload(() => {
        this.plugin.app.commands.executeCommandById = this.executeCommandById
      })
    }

    // enable command id to be searched by fuzzy search (it's a compromise for searching english name at the same time when current language is inputted by IME, such as Chinese).
    if (getDeep(this.plugin.app, 'internalPlugins.plugins.command-palette.instance.modal.getSuggestions')) {
      this.getSuggestions = this.plugin.app.internalPlugins.plugins['command-palette'].instance.modal.getSuggestions
      this.plugin.app.internalPlugins.plugins['command-palette'].instance.modal.getSuggestions = function(query: string) {
        if (!self.ENABLED_SEARCH_COMMAND_ID) {
          return self.getSuggestions.apply(this, arguments)
        }
        const getItemText = this.getItemText
        this.getItemText = function(item: Command) {
          return `${item.name} ${item.id}`
        }
        const suggestions = self.getSuggestions.apply(this, arguments)
        this.getItemText = getItemText
        return suggestions
      }
      this.addUnload(() => {
        this.plugin.app.internalPlugins.plugins['command-palette'].instance.modal.getSuggestions = this.getSuggestions
      })
    }

    // add history via capturing execution of command by choosing suggestion item in palette modal.
    if (getDeep(this.plugin.app, 'internalPlugins.plugins.command-palette.instance.modal.onChooseSuggestion')) {
      this.onChooseSuggestion = this.plugin.app.internalPlugins.plugins['command-palette'].instance.modal.onChooseSuggestion
      this.plugin.app.internalPlugins.plugins['command-palette'].instance.modal.onChooseSuggestion = function(item) {
        self.addHistory(item.item.id)
        self.onChooseSuggestion.apply(this, arguments)
      }
      this.addUnload(() => {
        this.plugin.app.internalPlugins.plugins['command-palette'].instance.modal.onChooseSuggestion = this.onChooseSuggestion
      })
    }

    // add style info to the history command suggestions.
    if (getDeep(this.plugin.app, 'internalPlugins.plugins.command-palette.instance.modal.renderSuggestion')) {
      this.renderSuggestion = this.plugin.app.internalPlugins.plugins['command-palette'].instance.modal.renderSuggestion
      this.plugin.app.internalPlugins.plugins['command-palette'].instance.modal.renderSuggestion = function(item, el) {
        if (self.HISTORY_LIST.includes(item.item.id)) {
          if (self.SHOW_HISTORY_ICON) el.appendChild(self.renderIcon())
          self.plugin.addClassTo(el, 'history-suggestion')
        }
        self.renderSuggestion.apply(this, arguments)
        if (self.SHOW_COMMAND_INFO) el.appendChild(self.renderCommandInfo(item.item))
        el.dataset.command = item.item.id
      }
      this.addUnload(() => {
        this.plugin.app.internalPlugins.plugins['command-palette'].instance.modal.renderSuggestion = this.renderSuggestion
      })
    }

    // add style block.
    const style = document.createElement('style')
    style.setAttribute('type', 'text/css')
    style.id = this.stylesheetId
    style.innerHTML = this.stylesheet
    document.head.appendChild(style)

    this.addUnload(() => {
      document.head.querySelector('#' + this.stylesheetId)?.remove()
    })

    this.plugin.registerEvent(this.plugin.on('change-setting', debounce((key, value) => {
      if (key === 'commandInfoHeight') {
        style.innerHTML = this.stylesheet
      } else if (key === 'historyIgnoreList') {
        this.updateHistory()
      }
    }, 1000)))
  }

  addHistory(commandId: string) {
    if (!this.HISTORY_IGNORE_LIST.includes(commandId)) {
      const { HISTORY_LIST, HISTORY_MAX } = this
      const index = HISTORY_LIST.indexOf(commandId)
      if (~index) HISTORY_LIST.splice(index, 1)
      HISTORY_LIST.unshift(commandId)
      if (HISTORY_LIST.length > HISTORY_MAX) HISTORY_LIST.length = HISTORY_MAX
    }
  }

  updateHistory() {
    const { HISTORY_LIST, HISTORY_IGNORE_LIST } = this
    for (const id of HISTORY_IGNORE_LIST) {
      const index = HISTORY_LIST.indexOf(id)
      if (~index) HISTORY_LIST.splice(index, 1)
    }
  }

  renderIcon() {
    const el = document.createElement('span')
    el.classList.add('suggestion-flair')
    this.plugin.addClassTo(el, 'suggestion-flair')
    const temp = document.createElement('template')
    temp.innerHTML = this.HISTORY_ICON.trim()
    const svg = temp.content.firstChild as SVGElement
    svg.setAttribute('width', '13px')
    svg.setAttribute('height', '13px')
    svg.setAttribute('fill', 'currentColor')
    svg.setAttribute('stroke', 'currentColor')
    el.appendChild(svg)
    return el
  }

  renderCommandInfo(command: Command) {
    const el = document.createElement('span')
    this.plugin.addClassTo(el, 'suggestion-info')
    el.textContent = `ID: ${command.id}`
    return el
  }
}
