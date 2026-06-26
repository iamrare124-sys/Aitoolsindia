import config from '../config/site.config.js';

export async function getLiveData() {
  const provider = config.liveData?.provider || 'static';

  if (provider === 'static') {
    return config.liveData.symbols || [];
  }

  if (provider === 'alphavantage') {
    const key = process.env.ALPHA_VANTAGE_KEY;
    if (!key) return config.liveData.symbols || [];
    try {
      const symbols = config.liveData.symbols || [];
      const results = await Promise.allSettled(
        symbols.map(async (sym) => {
          const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${sym.symbol}&apikey=${key}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
          const data = await res.json();
          const quote = data['Global Quote'];
          if (!quote) return sym;
          const change = parseFloat(quote['10. change percent'] || '0');
          return {
            label: sym.label,
            value: parseFloat(quote['05. price']).toFixed(2),
            change: `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`,
            up: change >= 0,
          };
        })
      );
      return results.map((r, i) => (r.status === 'fulfilled' ? r.value : config.liveData.symbols[i]));
    } catch {
      return config.liveData.symbols || [];
    }
  }

  return config.liveData.symbols || [];
}
