import { App, Command } from "obsidian";
import { Base } from "./base";

export default class History extends Base {

  private listCommands: App['commands']['listCommands'];

  private executeCommandById: App['commands']['executeCommandById'];

  historyCommandIds: string[] = [];

  override onload(): void {
    const self = this
    this.listCommands = this.plugin.app.commands.listCommands
    this.executeCommandById = this.plugin.app.commands.executeCommandById

    this.plugin.app.commands.listCommands = function() {
      const commands: Command[] = self.listCommands.apply(this, arguments)
      if (self.RECENTLY_PINNED && self.historyCommandIds.length) {
        const historyCommands = commands.filter(command => self.historyCommandIds.includes(command.id))
        return Array.from(new Set(historyCommands.concat(commands)))
      } else {
        return commands
      }
    }

    this.plugin.app.commands.executeCommandById = function(commandId) {
      if (!this.HISTORY_IGNORE_LIST.includes(commandId)) {
        const index = self.historyCommandIds.indexOf(commandId)
        if (~index) {
          self.historyCommandIds.splice(index, 1)
          self.historyCommandIds.unshift(commandId)
        } else {
          self.historyCommandIds.unshift(commandId)
        }
        if (self.historyCommandIds.length > self.HISTORY_MAX) {
          self.historyCommandIds.length = self.HISTORY_MAX
        }
      }
      self.executeCommandById.apply(this, arguments)
    }
  }

  override onunload(): void {
    this.plugin.app.commands.listCommands = this.listCommands
    this.plugin.app.commands.executeCommandById = this.executeCommandById
  }
}
