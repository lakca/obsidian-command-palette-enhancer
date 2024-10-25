import 'obsidian'

/** Unsafe: Reveal from source code */

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

  interface OutlineViewItem {
    collapsed: boolean,
    setCollapsed(collapsed: boolean, self: OutlineViewItem): Promise<void>
    heading: HeadingCache
    vChildren: {
      children: OutlineViewItem[]
    }
    parent?: OutlineViewItem
    el: Element
  }

  interface OutlineView extends View {
    findActiveHeading(e: MarkdownView): OutlineViewItem
    tree: {
      infinityScroll: {
        rootEl: {
          vChildren: {
            children: OutlineViewItem[]
          }
        }
      }
    }
  }
  export interface Workspace {
    on(name: 'markdown-scroll', callback: (e: MarkdownView) => any, ctx?: any): EventRef;
  }
}
