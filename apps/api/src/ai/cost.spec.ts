import { estimateCostUsd } from './cost';

describe('estimateCostUsd', () => {
  it('prices uncached input + output at the model rate', () => {
    // sonnet: $3/M in, $15/M out
    expect(estimateCostUsd('claude-sonnet-5', { inputTokens: 1_000_000, outputTokens: 0 })).toBe(3);
    expect(estimateCostUsd('claude-sonnet-5', { inputTokens: 0, outputTokens: 1_000_000 })).toBe(
      15,
    );
  });

  it('discounts cache reads to 0.1x and charges cache writes at 1.25x the input rate', () => {
    expect(
      estimateCostUsd('claude-sonnet-5', {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 1_000_000,
      }),
    ).toBeCloseTo(0.3, 6);
    expect(
      estimateCostUsd('claude-sonnet-5', {
        inputTokens: 0,
        outputTokens: 0,
        cacheWriteTokens: 1_000_000,
      }),
    ).toBeCloseTo(3.75, 6);
  });

  it('falls back to a default rate for an unknown model and is zero for the fake provider', () => {
    expect(estimateCostUsd('fake', { inputTokens: 999, outputTokens: 999 })).toBe(0);
    expect(estimateCostUsd('mystery', { inputTokens: 1_000_000, outputTokens: 0 })).toBe(3);
  });
});
