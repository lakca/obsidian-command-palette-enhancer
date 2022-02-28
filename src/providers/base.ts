import CommandPaletteEnhancer from "main"

export abstract class Base {

  protected onload?(): void;

  protected onunload?(): void;

  private loaded = false

  private unloadList: Array<(...args: unknown[]) => void> = []

  constructor(protected plugin: CommandPaletteEnhancer) {
  }

  get HISTORY_MAX() {
    return this.plugin.settings.historyMax
  }

  get ENABLED_PIN_HISTORY() {
    return this.plugin.settings.enabledPinHistory
  }

  get HISTORY_IGNORE_LIST() {
    return this.plugin.settings.historyIgnoreList
  }

  get HISTORY_LIST() {
    return this.plugin.settings.historyList
  }

  get HISTORY_ICON() {
    return this.plugin.settings.historyIcon
  }

  get SHOW_HISTORY_ICON() {
    return this.plugin.settings.showHistoryIcon
  }

  get SHOW_COMMAND_INFO() {
    return this.plugin.settings.showCommandInfo
  }

  get ENABLED_SEARCH_COMMAND_ID() {
    return this.plugin.settings.enabledSearchCommandId
  }

  get COMMAND_INFO_HEIGHT() {
    return this.plugin.settings.commandInfoHeight
  }

  load() {
    if (!this.loaded) {
      this.loaded = true
      this.onload && this.onload()
    }
  }

  unload() {
    if (this.loaded) {
      this.onunload && this.onunload()
      do {
        this.unloadList.shift()?.call(null)
      } while (this.unloadList.length)
      this.loaded = false
    }
  }

  addUnload(callback: (...args: unknown[]) => void) {
    !this.unloadList.includes(callback) && this.unloadList.push(callback)
  }
}
