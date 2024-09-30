import { getClass } from "src/utils"
import { Base } from "./base"

export default class Command extends Base {
  CSS_WORD_WRAP = 'word-wrap'

  load() {
    this.plugin.addCommand({
      id: 'toggle-word-wrap',
      name: 'Toggle Word Wrap',
      callback: () => {
        document.documentElement.classList.toggle(getClass('nowrap'))
      },
    })
  }
}
