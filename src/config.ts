import { AtpAgentLoginOpts } from '@atproto/api'
import 'dotenv/config'

const { BOT_IDENTIFIER, BOT_PASSWORD } = process.env

if (!BOT_IDENTIFIER || !BOT_PASSWORD) {
	throw new Error('Missing env-vars')
}

export const loginOpts = {
	identifier: BOT_IDENTIFIER,
	password: BOT_PASSWORD,
} satisfies AtpAgentLoginOpts
