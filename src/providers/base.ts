import CommandPaletteEnhance from "main";

export abstract class Base {

  protected onload?(): void;

  protected onunload?(): void;

  private loaded = false

  constructor(protected plugin: CommandPaletteEnhance) {
  }

  get HISTORY_MAX() {
    return this.plugin.settings.historyMax;
  }

  get RECENTLY_PINNED() {
    return this.plugin.settings.recentlyPinned;
  }

  get HISTORY_IGNORE_LIST() {
    return this.plugin.settings.historyIgnoreList;
  }

  load() {
    console.log('load', this.constructor.name);
    if (!this.loaded) {
      this.onload && (this.loaded = true, this.onload());
    }
  }

  unload() {
    console.log('unload', this.constructor.name);
    if (this.loaded) {
      this.unload && (this.unload(), this.loaded = false);
    }
  }
}
