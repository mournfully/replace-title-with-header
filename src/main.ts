import { Plugin } from 'obsidian';
import { settings, loadSettings, SettingsTab } from './settings';
import { cacheManager } from './cache'
import { isFileIndexable } from './utils'

import { setTabTitles, setExplorerItemTitles } from './replace'
import { fileResolver, cacheResolver, allCacheResolver } from './testing'

export default class HeadingsOverhaulPlugin extends Plugin {

	async onload(): Promise<void> {
		await loadSettings(this)
		this.addSettingTab(new SettingsTab(this))

		this.addCommand({
			id: 'resolve-file',
			name: 'resolve-file',
			callback: () => {
				fileResolver()
			}
		})

		this.addCommand({
			id: 'resolve-file-from-cache',
			name: 'resolve-file-from-cache',
			callback: () => {
				cacheResolver()
			}
		})

		this.addCommand({
			id: 'resolve-all-files-from-cache',
			name: 'resolve-all-files-from-cache',
			callback: () => {
				allCacheResolver()
			}
		})

		app.workspace.onLayoutReady(async () => {
			this.registerEvent(
				this.app.vault.on('delete', file => {
					if (isFileIndexable(file.path)) {
						cacheManager.removeFromLiveCache(file.path)
					} 
				})
			)

			this.registerEvent(
				this.app.vault.on('modify', async file => {
					if (isFileIndexable(file.path)) {
						if (settings.replaceTabs) {
							await cacheManager.addToLiveCache(file.path)
							await setTabTitles(true, true, file.path)
						}
					}
				})
			)

			// https://gist.github.com/shabegom/d10af3183d046930ab9d6e8343088f48
			this.registerEvent(
				this.app.metadataCache.on('changed', async file => {
					if (isFileIndexable(file.path)) {
						if (settings.replaceTabs) {
							await cacheManager.addToLiveCache(file.path)
							await setTabTitles(true, true, file.path)
						}
					}
				})
			)

			this.registerEvent(
				this.app.vault.on('rename', async (file, oldFilePath) => {
					if (isFileIndexable(file.path)) {
						cacheManager.removeFromLiveCache(oldFilePath)
						cacheManager.addToLiveCache(file.path)
					}
				})
			)
			
			this.registerEvent(
				this.app.workspace.on('layout-change', () => {

				})
			)

			this.registerEvent(
				this.app.workspace.on('active-leaf-change', () => {
					
				})
			)

			await this.populateIndex()
			if (settings.replaceTabs) await setTabTitles(true, false, null)
		})
		
	}

	async onunload(): Promise<void> {
		setTabTitles(false, false, null)
		setExplorerItemTitles(false)
	}

	private async populateIndex(): Promise<void> {
    	const files = app.vault.getMarkdownFiles()
		for (let i = 0; i < files.length; i++) {
		    await cacheManager.addToLiveCache(files[i].path)
		}
	}
}
