// Stock Market API - Wrapper for Finnhub.io
// Provides real-time stock quotes, search, and company information

interface StockQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    timestamp: number;
}

interface StockSearchResult {
    symbol: string;
    description: string;
    displaySymbol: string;
    type: string;
}

interface CompanyProfile {
    name: string;
    ticker: string;
    exchange: string;
    industry: string;
    marketCapitalization: number;
    shareOutstanding: number;
    logo: string;
    weburl: string;
}

class StockMarketAPI {
    private apiKey: string;
    private baseUrl = 'https://finnhub.io/api/v1';
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private cacheDuration = 60000; // 1 minute cache

    constructor() {
        this.apiKey = process.env.FINNHUB_API_KEY || '';
        if (!this.apiKey) {
            console.warn('⚠️  FINNHUB_API_KEY not set. Stock market API will not work.');
        }
    }

    private getCacheKey(endpoint: string, params: Record<string, string>): string {
        return `${endpoint}_${JSON.stringify(params)}`;
    }

    private getFromCache(key: string): any | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.data;
        }
        return null;
    }

    private setCache(key: string, data: any): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }

    private async fetchAPI(endpoint: string, params: Record<string, string> = {}): Promise<any> {
        if (!this.apiKey) {
            throw new Error('Finnhub API key not configured');
        }

        const cacheKey = this.getCacheKey(endpoint, params);
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }

        const queryParams = new URLSearchParams({
            ...params,
            token: this.apiKey
        });

        const url = `${this.baseUrl}${endpoint}?${queryParams}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Finnhub API error: ${response.statusText}`);
            }
            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching from Finnhub:', error);
            throw error;
        }
    }

    // Search for stocks by symbol or company name
    async searchStocks(query: string): Promise<StockSearchResult[]> {
        try {
            const data = await this.fetchAPI('/search', { q: query });

            // Filter to only include common stocks and limit results
            const results = (data.result || [])
                .filter((item: any) => item.type === 'Common Stock')
                .slice(0, 20)
                .map((item: any) => ({
                    symbol: item.symbol,
                    description: item.description,
                    displaySymbol: item.displaySymbol,
                    type: item.type
                }));

            return results;
        } catch (error) {
            console.error('Error searching stocks:', error);
            return [];
        }
    }

    // Get real-time quote for a stock
    async getQuote(symbol: string): Promise<StockQuote | null> {
        try {
            const data = await this.fetchAPI('/quote', { symbol });

            if (!data || data.c === 0) {
                return null;
            }

            return {
                symbol,
                price: data.c, // Current price
                change: data.d, // Change
                changePercent: data.dp, // Percent change
                high: data.h, // High price of the day
                low: data.l, // Low price of the day
                open: data.o, // Open price of the day
                previousClose: data.pc, // Previous close price
                timestamp: data.t // Timestamp
            };
        } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error);
            return null;
        }
    }

    // Get company profile
    async getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
        try {
            const data = await this.fetchAPI('/stock/profile2', { symbol });

            if (!data || !data.name) {
                return null;
            }

            return {
                name: data.name,
                ticker: data.ticker,
                exchange: data.exchange,
                industry: data.finnhubIndustry || 'N/A',
                marketCapitalization: data.marketCapitalization || 0,
                shareOutstanding: data.shareOutstanding || 0,
                logo: data.logo || '',
                weburl: data.weburl || ''
            };
        } catch (error) {
            console.error(`Error fetching company profile for ${symbol}:`, error);
            return null;
        }
    }

    // Get multiple quotes at once
    async getMultipleQuotes(symbols: string[]): Promise<Map<string, StockQuote>> {
        const quotes = new Map<string, StockQuote>();

        // Fetch quotes in parallel but respect rate limits
        const promises = symbols.map(symbol => this.getQuote(symbol));
        const results = await Promise.all(promises);

        results.forEach((quote, index) => {
            if (quote) {
                quotes.set(symbols[index], quote);
            }
        });

        return quotes;
    }

    // Check if API is configured
    isConfigured(): boolean {
        return !!this.apiKey;
    }
}

// Singleton instance
export const stockMarketAPI = new StockMarketAPI();
