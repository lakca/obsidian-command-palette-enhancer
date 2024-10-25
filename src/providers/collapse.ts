import { OutlineView, TFile, MarkdownView, OutlineViewItem, Notice  } from "obsidian"
import { Base } from "./base"
import { t } from "src/utils"

export default class Collapse extends Base {

  get autoCollapseOutline() {
    return this.plugin.settings.autoCollapseOutline
  }

  set autoCollapseOutline(value: boolean) {
    this.plugin.settings.autoCollapseOutline = value
  }

  getOutlineViews() {
    return this.plugin.app.workspace.getLeavesOfType('outline').map(leaf => leaf.view as OutlineView)
  }

  getFileHeadings(file: TFile) {
    return this.plugin.app.metadataCache.getFileCache(file)?.headings
  }

  getMarkdownView() {
    return this.plugin.app.workspace.getActiveViewOfType(MarkdownView)
  }

  onload() {
    this.plugin.addCommand({
      id: 'toggle-auto-collapse-outline',
      name: 'Toggle Auto Collapse Outline',
      callback: () => {
        this.autoCollapseOutline = !this.autoCollapseOutline
        new Notice(this.autoCollapseOutline ? t('notice.enableAutoCollapseOutline') : t('notice.disableAutoCollapseOutline'), 3000)
      },
    })

    let lastActiveItem: OutlineViewItem = null

    this.plugin.registerEvent(this.plugin.app.workspace.on('markdown-scroll', (editor) => {
      if (this.autoCollapseOutline) {
        const outlines = this.getOutlineViews()
        for (const outline of outlines) {
          const activeItem = outline.findActiveHeading(editor)
          console.log('scroll', activeItem)

          if (!activeItem || lastActiveItem === activeItem) return

          lastActiveItem = activeItem

          let activeFirstLevelItem = activeItem

          while (activeFirstLevelItem.parent?.heading) {
            activeFirstLevelItem = activeFirstLevelItem.parent
          }

          for (const item of outline.tree.infinityScroll.rootEl.vChildren.children) {
            if (item !== activeFirstLevelItem) {
              item.setCollapsed(true, item)
            }
          }
          activeItem.setCollapsed(false, activeItem)

          this.eachOutlineItemAncestor(activeItem, e => e.setCollapsed(false, e))

          activeItem.el.scrollIntoView()
        }
      } else {
        lastActiveItem = null
      }
    }))
  }

  eachOutlineItemAncestor(item: OutlineViewItem, callback: (parent: OutlineViewItem) => void) {
    while (item.parent?.heading) {
      item = item.parent
      callback(item)
    }
  }
}
