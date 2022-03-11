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

  interface Editor {
    /** Code Mirror */
    cm: {
      state: {
        doc: {
          /** Lines count of doc */
          lines: number
          /**
           * Get line info (characters and their range etc.) by line number.
           * @param line - Started from `1`, the same as number in gutter.
           */
          line(line: number): EditorLine
          /** Get raw text lines of whole doc. */
          toJSON(): string[]
          /** Return an iterator on all lines. */
          iterLines(from?: number, to?: number): Generator<string>
        }
      }
    }
  }

  interface MarkdownPreviewView {
    renderer: {
      sections: PreviewSection[]
    }
  }
}

export interface PreviewSection {
  el: HTMLElement
  html: string
  /** Range from 1 to 7, and 7 is non-heading. */
  level: number
  /** Start from 0 */
  lineStart: number
  /** Start from 0 */
  lineEnd: number
  /** Including next empty line. */
  lines: number
}

export interface EditorLine {
  /** First character index, counting from `0` */
  from: number
  /** Last character index, counting from `0` */
  to: number
  /** Raw text of line */
  text: string
  /** Line number, counting from `1` */
  number: number
}

// /** (Code Mirror) Editor segment: a lines block of whole doc. */
// export interface EditorSegment {
//   /** Raw text lines of segment */
//   text: string[]
// }
