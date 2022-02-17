import 'obsidian'

declare module 'obsidian' {
  export interface App {
    commands: {
      listCommands(): Command[]
      executeCommandById(id: string): void
      findCommand(id: string): Command | undefined
    }
  }
}
