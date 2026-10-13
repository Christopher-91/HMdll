import { calculateCosts, getCountryCosts, getAllCountryCosts } from './costs.service.js';

describe('Cost Calculator Logic & Ireland Test Case', () => {
  test('PART 1: Ireland Test Case - Tuition must NOT be overridden and equals entered value', () => {
    const input = {
      countrySlug: 'ireland',
      tuitionUsd: 25000,
      annualTuition: 25000,
      tuitionCurrency: 'EUR',
      durationMonths: 12,
      currency: 'EUR',
      cityType: 'major',
      estimationMode: 'average',
      accommodationType: 'shared',
    };

    const result = calculateCosts(input);

    // 1. First year tuition must equal 25,000 EUR (NOT 23,000 EUR)
    expect(result.firstYear.tuition).toBe(25000);
    expect(result.totalProgram.tuition).toBe(25000);
    expect(result.monthly.tuition).toBe(Math.round(25000 / 12));

    // 2. Monthly living cost does NOT bundle tuition
    expect(result.monthly.livingTotal).toBe(
      result.monthly.rent +
      result.monthly.food +
      result.monthly.transport +
      result.monthly.utilities +
      result.monthly.insurance +
      result.monthly.miscellaneous
    );

    // 3. First year total must equal tuition + (monthly living * 12) + one-time costs
    const expectedFirstYearLiving = result.firstYear.living;
    const expectedOneTime = result.firstYear.oneTimeCosts;
    expect(result.firstYear.total).toBe(25000 + expectedFirstYearLiving + expectedOneTime);

    // 4. Sum of displayed lines must equal the displayed total
    expect(result.firstYear.total).toBe(
      result.firstYear.tuition + result.firstYear.living + result.firstYear.oneTimeCosts
    );
    expect(result.totalProgram.total).toBe(
      result.totalProgram.tuition + result.totalProgram.living + result.totalProgram.oneTimeCosts
    );
  });

  test('PART 3: Multi-year program duration calculation (24 months)', () => {
    const input = {
      countrySlug: 'united-states',
      annualTuition: 30000,
      tuitionCurrency: 'USD',
      durationMonths: 24,
      currency: 'USD',
      cityType: 'major',
      estimationMode: 'average',
    };

    const result = calculateCosts(input);

    // Tuition over 24 months = 30000 * (24 / 12) = 60000
    expect(result.totalProgram.tuition).toBe(60000);
    expect(result.firstYear.tuition).toBe(30000);

    // One-time costs added ONCE for the whole program
    expect(result.totalProgram.oneTimeCosts).toBe(result.firstYear.oneTimeCosts);

    // Living over 24 months = monthlyLiving * 24
    expect(result.totalProgram.living).toBe(result.firstYear.living * 2);

    // Total = tuition + living + one-time
    expect(result.totalProgram.total).toBe(
      result.totalProgram.tuition + result.totalProgram.living + result.totalProgram.oneTimeCosts
    );
  });

  test('Monthly living cost strictly excludes tuition', () => {
    const input = {
      countrySlug: 'germany',
      annualTuition: 0, // Public university free tuition
      durationMonths: 12,
      currency: 'EUR',
      cityType: 'major',
      estimationMode: 'average',
    };

    const result = calculateCosts(input);
    expect(result.monthly.tuition).toBe(0);
    expect(result.monthly.livingTotal).toBeGreaterThan(0);
    expect(result.firstYear.tuition).toBe(0);
    expect(result.firstYear.total).toBe(result.firstYear.living + result.firstYear.oneTimeCosts);
  });

  test('Sum of displayed lines always equals displayed total across city tiers and modes', () => {
    const countries = ['united-kingdom', 'canada', 'australia', 'japan', 'france', 'germany'];

    for (const slug of countries) {
      for (const mode of ['average', 'worst-case']) {
        for (const city of ['major', 'other']) {
          const res = calculateCosts({
            countrySlug: slug,
            annualTuition: 15000,
            durationMonths: 18,
            cityType: city,
            estimationMode: mode,
          });

          // Line sums check
          const sumFirstYear = res.firstYear.tuition + res.firstYear.living + res.firstYear.oneTimeCosts;
          expect(res.firstYear.total).toBe(sumFirstYear);

          const sumProgram = res.totalProgram.tuition + res.totalProgram.living + res.totalProgram.oneTimeCosts;
          expect(res.totalProgram.total).toBe(sumProgram);

          const sumMonthly = res.monthly.rent + res.monthly.food + res.monthly.transport +
            res.monthly.utilities + res.monthly.insurance + res.monthly.miscellaneous;
          expect(res.monthly.livingTotal).toBe(sumMonthly);
        }
      }
    }
  });

  test('All 28 countries are registered and load valid cost models', () => {
    const all = getAllCountryCosts();
    const slugs = Object.keys(all);
    expect(slugs.length).toBe(28);

    for (const slug of slugs) {
      const country = getCountryCosts(slug);
      expect(country.countryName).toBeDefined();
      expect(country.currency).toBeDefined();
      expect(country.governmentProofOfFunds).toBeDefined();
      expect(country.cityTiers.major).toBeDefined();
      expect(country.cityTiers.other).toBeDefined();
      expect(country.healthInsurance).toBeDefined();
      expect(country.oneTimeCosts).toBeDefined();
      expect(Array.isArray(country.sources)).toBe(true);
      expect(country.sources.length).toBeGreaterThan(0);
    }
  });

  test('Database validation suite passes for all 28 countries', async () => {
    const { validateDatabase } = await import('./validate-costs.js');
    const report = validateDatabase();
    expect(report.length).toBe(28);

    for (const row of report) {
      expect(row.flags.length).toBe(0);
      expect(row.fieldsFilled).toBeGreaterThan(40);
    }
  });
});


