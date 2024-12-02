import { Agent, AtpAgent, AtpAgentLoginOpts } from '@atproto/api'
import { cacheSessionRetrieve, cacheSessionSave } from './utils/cache-file.ts'
import { cacheWrapper } from './utils/cache-redis.ts'
import { MAX_PAGE_LIMIT } from './constants.ts'

/** Boilerplate around logging in */
export async function login(creds: AtpAgentLoginOpts) {
	const agent = new AtpAgent({
		service: 'https://bsky.social',
		persistSession: (evt, session) => {
			if (session) {
				cacheSessionSave(session)
			}
		},
	})

	const savedSession = await cacheSessionRetrieve()
	if (savedSession) {
		try {
			await agent.resumeSession(savedSession)
		} catch (e) {}
	} else {
		await agent.login(creds)
	}

	return agent
}

/** Collate data accross multipel requests that provide a cursor */
export async function dePaginate<T extends any>(
	cb: (
		cursor: string | undefined,
	) => Promise<{ cursor: string | undefined; data: T[] }>,
): Promise<T[]> {
	let cursor: string | undefined
	let data: any[] = []

	while (true) {
		const meta = await cb(cursor)
		cursor = meta.cursor
		data = [...data, ...meta.data]

		if (!cursor) {
			break
		}
	}

	return data
}

export function getAllFollows(agent: Agent, actorDid: string) {
	return dePaginate(async (_cursor) => {
		const {
			data: { cursor, follows },
		} = await cacheWrapper(
			`bsky:user-follows:${actorDid}:${_cursor}:${MAX_PAGE_LIMIT}`,
			() =>
				agent.getFollows({
					actor: actorDid,
					limit: MAX_PAGE_LIMIT,
					cursor: _cursor,
				}),
		)

		return { cursor, data: follows }
	})
}

export function getAllFollowers(agent: Agent, actorDid: string) {
	return dePaginate(async (_cursor) => {
		const {
			data: { cursor, followers },
		} = await cacheWrapper(
			`bsky:user-followers:${actorDid}:${_cursor}:${MAX_PAGE_LIMIT}`,
			() =>
				agent.getFollowers({
					actor: actorDid,
					limit: MAX_PAGE_LIMIT,
					cursor: _cursor,
				}),
		)

		return { cursor, data: followers }
	})
}
