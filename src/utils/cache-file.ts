import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'

import { AtpSessionData } from '@atproto/api'
import { readJSON, writeJSON } from './json-file.ts'

const cacheFolder = '.cache'
const sessionCacheFilename = join(cacheFolder, 'session.json')

/** Save session data to file */
export async function cacheSessionSave(session: AtpSessionData) {
	if (!existsSync(cacheFolder)) {
		await mkdir(cacheFolder, { recursive: true })
	}

	await writeJSON(sessionCacheFilename, session)
}

/** Retrieve session data from file, if it exists */
export async function cacheSessionRetrieve(): Promise<AtpSessionData | void> {
	if (existsSync(sessionCacheFilename)) {
		return readJSON(sessionCacheFilename)
	}
}
