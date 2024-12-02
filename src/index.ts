import { Agent } from '@atproto/api'

import { writeJSON } from './utils/json-file.ts'
import { redis } from './redis.ts'
import { cacheWrapper } from './utils/cache-redis.ts'
import { getAllFollowers, getAllFollows, login } from './atproto.ts'
import { loginOpts } from './config.ts'

main().catch((e) => console.error(e))

////////////////////////////////////////////////////////////////////////////////

async function main() {
	await redis.connect()
	const agent = await login(loginOpts)
	console.log('logged in')

	const targetActor = 'oiyouyeahyou.bsky.social'

	await savePosts(agent, targetActor)
	await saveRelations(agent, targetActor)

	await redis.disconnect()
}

async function savePosts(agent: Agent, targetActor: string) {
	// TODO: DePaginate
	const records = await agent.getAuthorFeed({
		actor: targetActor,
	})

	await writeJSON('.cache/feed.json', records.data.feed)
}

async function saveRelations(agent: Agent, targetActor: string) {
	const { data: targetProfile } = await agent.getProfile({
		actor: targetActor,
	})

	const [follows, followers] = await Promise.all([
		getAllFollows(agent, targetProfile.did),
		getAllFollowers(agent, targetProfile.did),
	])

	const out = new Set<string>()
	const mutual = new Set<string>()
	const _in = new Set<string>()

	for (const follow of follows) {
		const { did } = follow
		out.add(did)
	}

	for (const follower of followers) {
		const { did } = follower
		if (out.has(did)) {
			mutual.add(did)
			out.delete(did)
		} else {
			_in.add(did)
		}
	}

	const profiles: Record<string, any> = {}
	for (const set of [mutual, out, _in]) {
		const profileTimeKey = 'getting profiles'
		console.time(profileTimeKey)
		let i = 0
		for (const did of set) {
			if (++i % 25 === 0) {
				console.timeLog(profileTimeKey, `count: ${i}`)
			}

			const response = await cacheWrapper(
				`bsky:user-profile:${did}`,
				() =>
					agent.getProfile({ actor: did }).catch((e) => {
						if (/Account is deactivated/.test(e.message)) {
							return
						}

						throw e
					}),
			)

			if (!response) {
				continue
			}

			const { data } = response
			delete data.viewer

			profiles[did] = data
		}
		console.timeEnd(profileTimeKey)
	}

	await writeJSON(`.cache/data/${targetActor}.json`, {
		profiles,
		mutuals: Array.from(mutual),
		follows: Array.from(out),
		followers: Array.from(_in),
		counts: {
			mutuals: mutual.size,
			follows: out.size,
			followers: _in.size,
		},
	})
}
