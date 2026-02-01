import { readFile, watch } from 'node:fs/promises'
import { resolve } from 'node:path'
import { URL } from 'node:url'
import config from '../config/database.js'

const cookieCache = new Map()
const COOKIE_TTL = 1000 * 60 * 5

let watcher = null

async function startWatcher () {
  try {
    watcher = watch(resolve(process.cwd(), 'setting'))
    for await (const event of watcher) {
      if (event.filename) {
        const match = event.filename.match(/^(.+)\.cookie$/)
        if (match) {
          cookieCache.delete(match[1])
        }
      }
    }
  } catch (error) {
  }
}

if (!watcher) {
  startWatcher().catch(() => {})
}

export async function readCookieFile (server) {
  const now = Date.now()
  const cached = cookieCache.get(server)

  if (cached && now - cached.timestamp < COOKIE_TTL) {
    return cached.value
  }

  const envKey = `METING_COOKIE_${server.toUpperCase()}`
  const envCookie = process.env[envKey]
  if (envCookie) {
    const value = envCookie.trim()
    cookieCache.set(server, {
      value,
      timestamp: now
    })
    return value
  }

  try {
    const cookiePath = resolve(process.cwd(), 'setting', `${server}.cookie`)
    const cookie = await readFile(cookiePath, 'utf-8')
    const value = cookie.trim()

    cookieCache.set(server, {
      value,
      timestamp: now
    })

    return value
  } catch (error) {
    cookieCache.set(server, {
      value: '',
      timestamp: now
    })
    return ''
  }
}

export function isAllowedHost (referrer) {
  const allowHosts = config.meting.cookie.allowHosts;
  if (allowHosts.length === 0) return true;
  if (!referrer) return false;

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    return allowHosts.includes(hostname);
  } catch (error) {
    return false;
  }
}
