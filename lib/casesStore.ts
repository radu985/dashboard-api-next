export type CaseItem = {
  id: number
  title: string
  status: string
  createdAt: string
  summary: string
  applicantName: string
  postalCode: string
  original_cv_url: string
  redacted_cv_url: string
  email_subject: string
  email_body: string
  confirm_url?: string
  contacts: { firma: string; email: string; plz: string }[]
}

// Simple in-memory store. Resets on server restart.
let memoryStore: CaseItem[] = []

// Optional Redis (Upstash)
const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
let useRedis = Boolean(redisUrl && redisToken)
let redis: any = null
if (useRedis) {
  try {
    // dynamic import to avoid bundling when unused
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Redis } = require("@upstash/redis")
    redis = new Redis({ url: redisUrl, token: redisToken })
  } catch {
    useRedis = false
  }
}

const KEY = "casesStore:v1"

export const casesStore = {
  async list(): Promise<CaseItem[]> {
    if (useRedis) {
      const data = await redis.get(KEY)
      return Array.isArray(data) ? (data as CaseItem[]) : []
    }
    return memoryStore
  },

  async setAll(cases: CaseItem[]): Promise<void> {
    if (useRedis) {
      await redis.set(KEY, cases)
      return
    }
    memoryStore = cases
  },

  async push(...items: CaseItem[]): Promise<void> {
    const current = await this.list()
    const next = current.concat(items)
    await this.setAll(next)
  },

  async update(id: number, patch: Partial<CaseItem>): Promise<CaseItem | null> {
    const current = await this.list()
    const idx = current.findIndex((c) => c.id === id)
    if (idx === -1) return null
    const updated = { ...current[idx], ...patch }
    const next = current.slice()
    next[idx] = updated
    await this.setAll(next)
    return updated
  },
}


