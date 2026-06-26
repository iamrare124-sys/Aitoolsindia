import niches from './niches/aitoolsindia.config.js';

const NICHE = process.env.NICHE || 'aitoolsindia';

export function getSiteConfig() {
  return niches;
}

export default getSiteConfig();
