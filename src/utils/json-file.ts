import { readFile, writeFile } from 'fs/promises'

/** Write JSON files to the filesystem */
export async function writeJSON(filename: string, data: any) {
	return writeFile(filename, JSON.stringify(data, null, '\t'))
}

/** Read JSON files from the filesystem */
export async function readJSON<T extends any>(filename: string): Promise<T> {
	const json = await readFile(filename, 'utf8')
	return JSON.parse(json)
}
