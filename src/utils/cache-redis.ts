import ms from 'ms'
import { redis } from '../redis.ts'

/**
 * How long until stale
 *
 * Intentionally long as we're not depending on breaking news
 */
const defaultCacheTime = ms('3 days')
interface CachedData {
	cachedTime: string
	data: string
}

/** Wraps async data to reduce outbound calls and speed up round trip time */
export async function cacheWrapper<R extends any>(
	key: string,
	fn: () => Promise<R>,
	{ cacheTime = defaultCacheTime } = {}
): Promise<R> {
	const cached = (await redis.hGetAll(key)) as unknown as
		| CachedData
		| undefined

	if (cached) {
		const { cachedTime, data } = cached

		if (Date.now() < parseInt(cachedTime) + cacheTime) {
			console.log('cache hit')
			return JSON.parse(data)
		}
	}

	const data = await fn()
	// There are some API exceptions that we just ignore and return nothing,
	// so we just skip here. We probably should cache them but time-vs-properness
	if (!data) {
		return data
	}

	await redis.hSet(key, {
		data: JSON.stringify(data),
		cachedTime: Date.now().toString(),
	} satisfies CachedData)

	return data
}
