const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "CG-sMPmegWS2wfid3SLeTJKjnhT"
const BASE_URL = "https://api.coingecko.com/api/v3"

export interface CryptoCurrency {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_1h_in_currency: number
  market_cap_rank: number
  points: number
}

export async function getTop200Cryptocurrencies(): Promise<CryptoCurrency[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false&price_change_percentage=1h&x_cg_demo_api_key=${COINGECKO_API_KEY}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      console.error("API response is not an array:", data)
      return []
    }

    return data.map((coin: any, index: number) => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      current_price: coin.current_price || null,
      price_change_percentage_1h_in_currency: coin.price_change_percentage_1h_in_currency || null,
      market_cap_rank: coin.market_cap_rank || index + 1,
      points: Math.max(25 - Math.floor(index / 8), 5),
    }))
  } catch (error) {
    console.error("Error fetching cryptocurrency data:", error)
    throw error
  }
}

export function searchCryptocurrencies(query: string, allCoins: CryptoCurrency[]): CryptoCurrency[] {
  if (!Array.isArray(allCoins)) {
    console.warn("allCoins is not an array:", allCoins)
    return []
  }

  if (!query.trim()) return allCoins

  const searchTerm = query.toLowerCase()
  try {
    return allCoins.filter(
      (coin) => coin.name.toLowerCase().includes(searchTerm) || coin.symbol.toLowerCase().includes(searchTerm),
    )
  } catch (error) {
    console.error("Error filtering cryptocurrencies:", error)
    return []
  }
}

export async function getCurrentPrices(coinIds: string[]): Promise<Record<string, number>> {
  try {
    const response = await fetch(
      `${BASE_URL}/simple/price?ids=${coinIds.join(",")}&vs_currencies=usd&x_cg_demo_api_key=${COINGECKO_API_KEY}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const prices: Record<string, number> = {}

    for (const coinId of coinIds) {
      if (data[coinId] && data[coinId].usd) {
        prices[coinId] = data[coinId].usd
      }
    }

    return prices
  } catch (error) {
    console.error("Error fetching current prices:", error)
    throw error
  }
}
