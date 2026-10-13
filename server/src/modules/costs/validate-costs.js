import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const countryCostsPath = path.resolve(__dirname, '../../data/countryCosts.json');
const countryData = JSON.parse(fs.readFileSync(countryCostsPath, 'utf-8'));

/**
 * Validate country costs database
 */
export function validateDatabase() {
  const results = [];
  const flags = [];

  const expectedFields = [
    'countryName',
    'currency',
    'governmentProofOfFunds.monthly',
    'governmentProofOfFunds.annual',
    'governmentProofOfFunds.source_url',
    'governmentProofOfFunds.year',
    'governmentProofOfFunds.retrieved_at',
    'healthInsurance.amount',
    'healthInsurance.period',
    'healthInsurance.mandatory',
    'healthInsurance.source_url',
    'healthInsurance.year',
    'healthInsurance.retrieved_at',
    'oneTimeCosts.visaFee',
    'oneTimeCosts.deposit',
    'oneTimeCosts.booksMaterials',
    'oneTimeCosts.source_url',
    'oneTimeCosts.year',
    'oneTimeCosts.retrieved_at',
    'cityTiers.major.name',
    'cityTiers.major.rent.shared.low',
    'cityTiers.major.rent.shared.typical',
    'cityTiers.major.rent.shared.high',
    'cityTiers.major.rent.studio.low',
    'cityTiers.major.rent.studio.typical',
    'cityTiers.major.rent.studio.high',
    'cityTiers.major.food',
    'cityTiers.major.transport',
    'cityTiers.major.utilities',
    'cityTiers.major.misc',
    'cityTiers.major.source_url',
    'cityTiers.major.year',
    'cityTiers.major.retrieved_at',
    'cityTiers.other.name',
    'cityTiers.other.rent.shared.low',
    'cityTiers.other.rent.shared.typical',
    'cityTiers.other.rent.shared.high',
    'cityTiers.other.rent.studio.low',
    'cityTiers.other.rent.studio.typical',
    'cityTiers.other.rent.studio.high',
    'cityTiers.other.food',
    'cityTiers.other.transport',
    'cityTiers.other.utilities',
    'cityTiers.other.misc',
    'cityTiers.other.source_url',
    'cityTiers.other.year',
    'cityTiers.other.retrieved_at',
    'sources',
  ];

  function getNested(obj, pathStr) {
    const parts = pathStr.split('.');
    let curr = obj;
    for (const part of parts) {
      if (curr === undefined || curr === null) return undefined;
      curr = curr[part];
    }
    return curr;
  }

  for (const [slug, country] of Object.entries(countryData)) {
    let filledCount = 0;
    let nullCount = 0;
    const countryFlags = [];

    // 1. Check all expected fields
    for (const fieldPath of expectedFields) {
      const val = getNested(country, fieldPath);
      if (val === null) {
        nullCount++;
      } else if (val === undefined) {
        nullCount++;
        countryFlags.push(`Missing field: ${fieldPath}`);
      } else {
        filledCount++;

        // 2. No negative values check
        if (typeof val === 'number') {
          if (val < 0) {
            countryFlags.push(`Negative value in ${fieldPath}: ${val}`);
          }
        }

        // 3. URLs check
        if (fieldPath.endsWith('source_url') && typeof val === 'string') {
          if (!val.startsWith('http')) {
            countryFlags.push(`Invalid source URL in ${fieldPath}: ${val}`);
          }
        }
      }
    }

    // 4. Living cost vs Proof of Funds benchmark check
    const govMonthly = country.governmentProofOfFunds?.monthly;
    const majorTier = country.cityTiers?.major;
    const ins = country.healthInsurance;
    const monthlyIns = ins ? (ins.period === 'annual' ? ins.amount / 12 : ins.amount) : 0;

    if (majorTier && typeof govMonthly === 'number' && govMonthly > 0) {
      const majorTypicalLiving = (majorTier.rent?.shared?.typical || 0) +
        (majorTier.food || 0) +
        (majorTier.transport || 0) +
        (majorTier.utilities || 0) +
        (majorTier.misc || 0) +
        monthlyIns;

      // Flag if estimated living cost is far below official government requirement (> 20% below)
      if (majorTypicalLiving < govMonthly * 0.75) {
        countryFlags.push(
          `Estimated living (${Math.round(majorTypicalLiving)} ${country.currency}) is significantly below official proof of funds (${govMonthly} ${country.currency})`
        );
      }
    }

    results.push({
      slug,
      name: country.countryName || slug,
      currency: country.currency,
      fieldsFilled: filledCount,
      fieldsNull: nullCount,
      flags: countryFlags,
    });
  }

  return results;
}

// If run directly via node
if (process.argv[1] && process.argv[1].endsWith('validate-costs.js')) {
  const report = validateDatabase();
  console.log('| Country | Currency | Fields Filled | Fields Null | Flagged for Review |');
  console.log('| :--- | :--- | :--- | :--- | :--- |');
  for (const row of report) {
    const flagText = row.flags.length > 0 ? `⚠️ ${row.flags.join('; ')}` : '✅ Verified';
    console.log(`| ${row.name} | ${row.currency} | ${row.fieldsFilled} | ${row.fieldsNull} | ${flagText} |`);
  }
}
