import { App, Command, EventRef, Events, FuzzyMatch, PopoverSuggest, prepareFuzzySearch } from "obsidian"

export default interface CommandSuggest extends Events {
	on(name: 'select', callback: (command: Command) => void): EventRef;
}

export default class CommandSuggest extends PopoverSuggest<FuzzyMatch<Command>> {

	lastSelected: FuzzyMatch<Command> | null

  lastQuery: string | null = null

	constructor(private readonly app: App, private readonly inputEl: HTMLInputElement) {
		super(app)
		Events.call(this)
		this.inputEl.addEventListener('focus', e => {
			this.show(this.inputEl.value)
		})
		this.inputEl.addEventListener('blur', e => {
			setTimeout(() => {
				this.close()
			}, 100)
		})
		this.inputEl.addEventListener('keydown', e => {
			if (e.key === 'Escape') {
				this.close()
			}
		})
		this.inputEl.addEventListener('input', e => {
			this.updateSuggestions(this.inputEl.value)
		})
	}

	getItemText(item: Command): string {
		return `${item.name} ${item.id}`
	}
	getItems() {
		return this.app.commands.listCommands()
	}
	fuzzySearch(query?: string): FuzzyMatch<Command>[] {
		this.lastQuery = (query || '').trim()
		const items = this.getItems()
		const fuzzy = prepareFuzzySearch(this.lastQuery)
		const result: FuzzyMatch<Command>[] = []
		for (const item of items) {
			const match = fuzzy(this.getItemText(item))
			match && result.push({
				item,
				match,
			})
		}
		return result
	}
	updateSuggestions(query?: string) {
		this.suggestions.setSuggestions(this.fuzzySearch(query))
	}
	show(query?: string) {
		this.lastSelected = null
		const rect = this.inputEl.getBoundingClientRect()
		this.suggestEl.style.width = rect.width + 'px'
		this.reposition(rect)
		this.open()
		this.updateSuggestions(query)
	}
	selectSuggestion(value: FuzzyMatch<Command>, evt: MouseEvent | KeyboardEvent): void {
		this.lastSelected = value
		this.trigger('select', value.item)
		this.close()
	}
	renderSuggestion(value: FuzzyMatch<Command>, el: HTMLElement) {
		el.textContent = value.item.name
		el.setAttribute('title', value.item.id)
		return el
	}
}

Object.assign(CommandSuggest.prototype, Events.prototype)
