import { App, FileView, FuzzyMatch, FuzzySuggestModal, HeadingCache, MarkdownView } from "obsidian"
import { getDeep, t } from "src/utils"
import { Base } from "./base"
const HEADING_MODE = 'heading'
abstract class MarkdownViewHandler {
  constructor(protected readonly view: MarkdownView) {}
  abstract getHeadings(): string[]
}

class PreviewMode extends MarkdownViewHandler {
  getRawHeading(html: string) {
    const tpl = document.createElement('template')
    tpl.innerHTML = html
    return (tpl.content.firstElementChild as HTMLElement).dataset.heading
  }
  get sections() {
    return this.view.previewMode.renderer.sections
  }
  private getHeadingSections() {
    return this.sections.filter(e => e.level < 7)
  }
  getRawHeadings() {
    return this.getHeadingSections().map(e => this.getRawHeading(e.html))
  }
  getHeadings() {
    return this.getHeadingSections().map(h => h.el.textContent)
  }
}
class EditMode extends MarkdownViewHandler {
  get doc() {
    return this.view.editor.cm.state.doc
  }
  get lines() {
    return this.doc.toJSON()
  }
  getHeadings() {
    return this.lines.filter(line => /^\s*#+\s/.test(line))
  }
}

const gotoHeading: FuzzySuggestModal<HeadingCache> = {
  getItemText(item: HeadingCache): string {
    return item.heading
  },
  getItems() {
    if (this.app.workspace.activeLeaf.view instanceof FileView) {
      return this.app.metadataCache.getFileCache(this.app.workspace.activeLeaf.view.file).headings
    }
  },
  onChooseItem(item: HeadingCache, evt: MouseEvent | KeyboardEvent): void {
    (this.app.workspace.activeLeaf.view as MarkdownView).currentMode.applyScroll(item.position.start.line)
    this.close()
  },
  renderSuggestion(item: FuzzyMatch<HeadingCache>, el: HTMLElement): void {
    console.log(item)
    el.createSpan('', el => {
      el.style.display = 'inline-block'
      el.style.width = (item.item.level - 1) + 'em'
    })
    el.createSpan(item.item.heading)
  },
  getSuggestions(query: string): FuzzyMatch<HeadingCache>[] {
    query = query.trim().slice(1)
    this.$super.getSuggestions
  },
} as FuzzySuggestModal<HeadingCache>


type OnlyMethodNames<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never
}[keyof T]

function replaceMethods<T, K extends OnlyMethodNames<T>, >(obj: T, withObj: Pick<T, K>) {
  const keys = Object.keys(withObj) as K[]
  const origin = {} as typeof withObj
  for (const key in withObj) {
    origin[key] = obj[key]
    obj[key] = function() {
      const ctx = Object.create(this)
      ctx.$super = Object.assign(Object.create(this), origin)
      withObj[key].call(ctx, ...arguments)
    }
  }
  return function revert() {
    for (const key of keys) {
      obj[key] = origin[key]
    }
  }
}

export default class Search extends Base {

  protected searchingMode: typeof HEADING_MODE

  private origin: Record<string, (...args: unknown[]) => unknown> = {}

  override onload() {
    this.plugin.addCommand({
      id: 'goto-heading',
      name: t('commands.gotoHeading'),
      callback: () => {
      },
    })

    const self = this

    const modal = this.plugin.app?.internalPlugins?.plugins?.['command-palette']?.instance?.modal
    if (modal) {
      modal.inputEl.addEventListener('input', evt => {
        if (modal.inputEl.value.startsWith('#')) {
          self.searchingMode = HEADING_MODE
        } else {
          self.searchingMode = null
        }
      }, { capture: true })

      for (const key of ['getItemText', 'getItems', 'onChooseItem', 'renderSuggestion'] as const) {
        if (modal[key]) {
          this.origin[key] = modal[key]
          modal[key] = function() {
            console.log('modal', key, arguments)
            if (self.searchingMode === HEADING_MODE) {
              // @ts-ignore
              return gotoHeading[key](...arguments)
            } else {
              return self.origin[key].call(this, ...arguments)
            }
          }
          this.addUnload(() => {
            (modal[key] as unknown) = self.origin[key]
          })
        }
      }
    }

  }
  get view() {
    return this.plugin.app.workspace.activeLeaf.view
  }
  get viewType() {
    return this.view.getViewType()
  }
  getHeadings() {
    if (this.plugin.app.workspace.activeLeaf.view instanceof FileView) {
      return this.plugin.app.metadataCache.getFileCache(this.plugin.app.workspace.activeLeaf.view.file).headings
    }
  }
}
