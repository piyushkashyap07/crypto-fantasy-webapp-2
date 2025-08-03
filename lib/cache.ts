// Simple in-memory cache for performance optimization
class Cache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttl: number = 30000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    const isExpired = Date.now() - item.timestamp > item.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }

  delete(key: string) {
    this.cache.delete(key)
  }
}

export const cache = new Cache()

// Cache keys
export const CACHE_KEYS = {
  PRIZE_POOLS: 'prize_pools',
  USER_TEAMS: 'user_teams',
  LEADERBOARD: 'leaderboard',
  USER_AUTH: 'user_auth'
} as const 