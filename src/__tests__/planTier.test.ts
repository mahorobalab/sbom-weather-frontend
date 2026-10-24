import { describe, it, expect } from 'vitest';
import { PLAN_CONFIGS, type PlanTier } from '../types';

describe('Freemium Plan and Tier Limits', () => {
  it('correctly configures limits and prices for all tiers', () => {
    expect(PLAN_CONFIGS.free.maxSites).toBe(1);
    expect(PLAN_CONFIGS.free.priceMonthly).toBe(0);

    expect(PLAN_CONFIGS.basic.maxSites).toBe(3);
    expect(PLAN_CONFIGS.basic.priceMonthly).toBe(3000);

    expect(PLAN_CONFIGS.pro.maxSites).toBe(6);
    expect(PLAN_CONFIGS.pro.priceMonthly).toBe(5500);
    expect(PLAN_CONFIGS.pro.isPopular).toBe(true);
  });

  it('determines whether site addition should be blocked for freemium users', () => {
    const isSiteLimitReached = (siteCount: number, plan: PlanTier): boolean => {
      return siteCount >= PLAN_CONFIGS[plan].maxSites;
    };

    // Free plan: 1 site allowed, 1 site reaches limit, cannot add 2nd site
    expect(isSiteLimitReached(0, 'free')).toBe(false);
    expect(isSiteLimitReached(1, 'free')).toBe(true);
    expect(isSiteLimitReached(2, 'free')).toBe(true);

    // Basic plan: 3 sites allowed
    expect(isSiteLimitReached(1, 'basic')).toBe(false);
    expect(isSiteLimitReached(2, 'basic')).toBe(false);
    expect(isSiteLimitReached(3, 'basic')).toBe(true);

    // Pro plan: 6 sites allowed
    expect(isSiteLimitReached(3, 'pro')).toBe(false);
    expect(isSiteLimitReached(5, 'pro')).toBe(false);
    expect(isSiteLimitReached(6, 'pro')).toBe(true);
  });
});
