import 'obsidian'

declare module 'obsidian' {
  export interface App {
    commands: {
      listCommands(): Command[]
      executeCommandById(id: Command['id']): void
      findCommand(id: Command['id']): Command | undefined
    }
    internalPlugins: {
      plugins: {
        'command-palette': {
          instance: {
            getCommands(): Command[]
            options: {
              pinned: Command['id'][]
            },
            modal: FuzzySuggestModal<Command>
          }
        }
      }
    }
  }

  interface PopoverSuggest<T> {
    suggestEl: HTMLElement
    suggestions: {
      setSuggestions(items: T[]): void
    }
    reposition(rect: DOMRect): void
  }
}
