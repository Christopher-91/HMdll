import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EXCHANGE_RATES, convertCurrency } from '../../data/exchangeRates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load country costs data
const countryCostsPath = path.resolve(__dirname, '../../data/countryCosts.json');
export const COUNTRY_COSTS = JSON.parse(fs.readFileSync(countryCostsPath, 'utf-8'));

export const getCountryCosts = (slug) => {
  return COUNTRY_COSTS[slug] || COUNTRY_COSTS['united-states'];
};

export const getAllCountryCosts = () => {
  return COUNTRY_COSTS;
};

/**
 * Calculate study abroad costs
 *
 * Sourced calculation logic:
 * - Tuition = entered annual tuition * (months / 12)
 * - Monthly living = rent + food + transport + utilities + insurance + misc
 * - Living total = monthly living * months
 * - One-time costs added once
 * - Total = tuition + living + one-time
 */
export const calculateCosts = (data) => {
  const {
    countrySlug = 'united-states',
    tuitionUsd,
    annualTuition,
    tuitionCurrency: customTuitionCurrency,
    durationMonths = 12,
    currency = 'USD',
    cityType = 'major',
    estimationMode = 'average',
    accommodationType = 'shared',
    // Custom user overrides
    customRent,
    customFood,
    customTransport,
    customUtilities,
    customInsurance,
    customMisc,
  } = data;

  const countryData = getCountryCosts(countrySlug);
  const countryBaseCurrency = countryData.currency || 'USD';
  const displayCurrency = currency || countryBaseCurrency;

  // 1. TUITION CALCULATION
  // Tuition is entered in either tuitionCurrency or the destination country's currency
  const rawTuitionInput = annualTuition !== undefined && annualTuition !== null
    ? parseFloat(annualTuition)
    : (tuitionUsd !== undefined && tuitionUsd !== null ? parseFloat(tuitionUsd) : 0);
  const rawAnnualTuition = isNaN(rawTuitionInput) ? 0 : rawTuitionInput;

  // The currency in which the tuition was entered (defaults to destination country currency)
  const tuitionCurrency = customTuitionCurrency || countryBaseCurrency;

  // Convert annual tuition from tuitionCurrency to displayCurrency
  const annualTuitionConverted = convertCurrency(rawAnnualTuition, tuitionCurrency, displayCurrency);

  const totalMonths = Math.max(1, parseInt(durationMonths, 10) || 12);
  const firstYearMonths = Math.min(12, totalMonths);

  // Exact unrounded tuition calculations
  const programTuitionExact = annualTuitionConverted * (totalMonths / 12);
  const firstYearTuitionExact = annualTuitionConverted * (firstYearMonths / 12);
  const monthlyTuitionExact = annualTuitionConverted / 12;

  // 2. CITY TIER & MONTHLY LIVING COSTS
  const selectedCityTier = countryData.cityTiers[cityType] || countryData.cityTiers.major;
  const isWorstCase = estimationMode === 'worst-case';

  // Base rent selection based on estimation mode & accommodation
  const rentOption = selectedCityTier.rent[accommodationType] || selectedCityTier.rent.shared;
  const baseRent = isWorstCase ? rentOption.high : rentOption.typical;
  const rentLow = rentOption.low;
  const rentTypical = rentOption.typical;
  const rentHigh = rentOption.high;

  // Local monthly items (in countryBaseCurrency)
  const localRent = (customRent !== undefined && customRent !== null && !isNaN(parseFloat(customRent)))
    ? parseFloat(customRent)
    : baseRent;

  const localFood = (customFood !== undefined && customFood !== null && !isNaN(parseFloat(customFood)))
    ? parseFloat(customFood)
    : selectedCityTier.food;

  const localTransport = (customTransport !== undefined && customTransport !== null && !isNaN(parseFloat(customTransport)))
    ? parseFloat(customTransport)
    : selectedCityTier.transport;

  const localUtilities = (customUtilities !== undefined && customUtilities !== null && !isNaN(parseFloat(customUtilities)))
    ? parseFloat(customUtilities)
    : selectedCityTier.utilities;

  const localMisc = (customMisc !== undefined && customMisc !== null && !isNaN(parseFloat(customMisc)))
    ? parseFloat(customMisc)
    : selectedCityTier.misc;

  // Health insurance (handles monthly vs annual period)
  const insuranceData = countryData.healthInsurance;
  const baseMonthlyInsurance = insuranceData.period === 'annual'
    ? (insuranceData.amount / 12)
    : insuranceData.amount;

  const localInsurance = (customInsurance !== undefined && customInsurance !== null && !isNaN(parseFloat(customInsurance)))
    ? parseFloat(customInsurance)
    : baseMonthlyInsurance;

  // Convert monthly living items to displayCurrency
  const monthlyRent = convertCurrency(localRent, countryBaseCurrency, displayCurrency);
  const monthlyFood = convertCurrency(localFood, countryBaseCurrency, displayCurrency);
  const monthlyTransport = convertCurrency(localTransport, countryBaseCurrency, displayCurrency);
  const monthlyUtilities = convertCurrency(localUtilities, countryBaseCurrency, displayCurrency);
  const monthlyInsurance = convertCurrency(localInsurance, countryBaseCurrency, displayCurrency);
  const monthlyMisc = convertCurrency(localMisc, countryBaseCurrency, displayCurrency);

  // Exact unrounded monthly living cost (EXCLUDES tuition)
  const monthlyLivingExact = monthlyRent + monthlyFood + monthlyTransport + monthlyUtilities + monthlyInsurance + monthlyMisc;

  // Monthly living range (Low vs Typical vs High)
  const monthlyLivingLowExact = convertCurrency(
    rentLow + selectedCityTier.food * 0.85 + selectedCityTier.transport + selectedCityTier.utilities + baseMonthlyInsurance + selectedCityTier.misc * 0.8,
    countryBaseCurrency,
    displayCurrency
  );
  const monthlyLivingHighExact = convertCurrency(
    rentHigh + selectedCityTier.food * 1.25 + selectedCityTier.transport * 1.1 + selectedCityTier.utilities * 1.2 + baseMonthlyInsurance + selectedCityTier.misc * 1.3,
    countryBaseCurrency,
    displayCurrency
  );

  // 3. ONE-TIME COSTS
  const baseOneTime = countryData.oneTimeCosts;
  const oneTimeItems = {};

  // Standard one-time fields
  if (baseOneTime.visaFee !== undefined) {
    oneTimeItems.visaFee = data.visaFee !== undefined ? parseFloat(data.visaFee) : baseOneTime.visaFee;
  }
  if (baseOneTime.residencePermit !== undefined && baseOneTime.residencePermit > 0) {
    oneTimeItems.residencePermit = data.residencePermit !== undefined ? parseFloat(data.residencePermit) : baseOneTime.residencePermit;
  }
  if (baseOneTime.healthSurcharge !== undefined && baseOneTime.healthSurcharge > 0) {
    oneTimeItems.healthSurcharge = data.healthSurcharge !== undefined ? parseFloat(data.healthSurcharge) : baseOneTime.healthSurcharge;
  }
  if (baseOneTime.deposit !== undefined) {
    oneTimeItems.deposit = data.deposit !== undefined ? parseFloat(data.deposit) : baseOneTime.deposit;
  }
  if (baseOneTime.booksMaterials !== undefined) {
    oneTimeItems.booksMaterials = data.booksMaterials !== undefined ? parseFloat(data.booksMaterials) : baseOneTime.booksMaterials;
  }
  if (baseOneTime.sevisFee !== undefined && baseOneTime.sevisFee > 0) {
    oneTimeItems.sevisFee = baseOneTime.sevisFee;
  }
  if (baseOneTime.biometrics !== undefined && baseOneTime.biometrics > 0) {
    oneTimeItems.biometrics = baseOneTime.biometrics;
  }
  if (baseOneTime.cvecFee !== undefined && baseOneTime.cvecFee > 0) {
    oneTimeItems.cvecFee = baseOneTime.cvecFee;
  }
  if (baseOneTime.medicalExam !== undefined && baseOneTime.medicalExam > 0) {
    oneTimeItems.medicalExam = baseOneTime.medicalExam;
  }
  if (baseOneTime.returnTicket !== undefined && baseOneTime.returnTicket > 0) {
    oneTimeItems.returnTicket = baseOneTime.returnTicket;
  }
  if (data.travel !== undefined && !isNaN(parseFloat(data.travel))) {
    oneTimeItems.travel = parseFloat(data.travel);
  }

  // Convert each itemized one-time cost to displayCurrency
  const itemizedOneTimeConverted = {};
  let oneTimeTotalExact = 0;
  for (const [key, val] of Object.entries(oneTimeItems)) {
    const convertedVal = convertCurrency(val, countryBaseCurrency, displayCurrency);
    itemizedOneTimeConverted[key] = convertedVal;
    oneTimeTotalExact += convertedVal;
  }

  // 4. PROGRAM & FIRST YEAR TOTALS (Exact unrounded)
  const firstYearLivingExact = monthlyLivingExact * firstYearMonths;
  const firstYearTotalExact = firstYearTuitionExact + firstYearLivingExact + oneTimeTotalExact;

  const programLivingExact = monthlyLivingExact * totalMonths;
  const programTotalExact = programTuitionExact + programLivingExact + oneTimeTotalExact;

  // 5. DISPLAY ROUNDING RULE:
  // "Round only at display time, never inside intermediate calculations.
  // Total = tuition + living + one-time. The sum of the displayed lines must always equal the displayed total."
  const dispRent = Math.round(monthlyRent);
  const dispFood = Math.round(monthlyFood);
  const dispTransport = Math.round(monthlyTransport);
  const dispUtilities = Math.round(monthlyUtilities);
  const dispInsurance = Math.round(monthlyInsurance);
  const dispMisc = Math.round(monthlyMisc);
  const dispMonthlyLivingTotal = dispRent + dispFood + dispTransport + dispUtilities + dispInsurance + dispMisc;
  const dispMonthlyTuition = Math.round(monthlyTuitionExact);

  const dispOneTimeItems = {};
  let dispOneTimeTotal = 0;
  for (const [key, val] of Object.entries(itemizedOneTimeConverted)) {
    const rounded = Math.round(val);
    dispOneTimeItems[key] = rounded;
    dispOneTimeTotal += rounded;
  }

  // First Year Displayed lines
  const dispFirstYearTuition = Math.round(firstYearTuitionExact);
  const dispFirstYearLiving = Math.round(firstYearLivingExact);
  const dispFirstYearOneTime = dispOneTimeTotal;
  const dispFirstYearTotal = dispFirstYearTuition + dispFirstYearLiving + dispFirstYearOneTime;

  // Total Program Displayed lines
  const dispProgramTuition = Math.round(programTuitionExact);
  const dispProgramLiving = Math.round(programLivingExact);
  const dispProgramOneTime = dispOneTimeTotal;
  const dispProgramTotal = dispProgramTuition + dispProgramLiving + dispProgramOneTime;

  // Government proof of funds converted to displayCurrency
  const govFunds = countryData.governmentProofOfFunds;
  const govFundsConverted = {
    monthly: govFunds.monthly ? Math.round(convertCurrency(govFunds.monthly, countryBaseCurrency, displayCurrency)) : null,
    annual: govFunds.annual ? Math.round(convertCurrency(govFunds.annual, countryBaseCurrency, displayCurrency)) : null,
    currency: displayCurrency,
    originalCurrency: countryBaseCurrency,
    originalMonthly: govFunds.monthly,
    originalAnnual: govFunds.annual,
    description: govFunds.description,
    source_url: govFunds.source_url,
    year: govFunds.year,
    retrieved_at: govFunds.retrieved_at,
  };

  return {
    currency: displayCurrency,
    exchangeRate: EXCHANGE_RATES[displayCurrency] || 1,
    countrySlug,
    countryName: countryData.countryName,
    cityType,
    cityTypeName: selectedCityTier.name,
    durationMonths: totalMonths,
    estimationMode,
    accommodationType,
    monthly: {
      tuition: dispMonthlyTuition,
      rent: dispRent,
      food: dispFood,
      transport: dispTransport,
      utilities: dispUtilities,
      insurance: dispInsurance,
      miscellaneous: dispMisc,
      livingTotal: dispMonthlyLivingTotal, // Monthly living cost strictly without tuition
      total: dispMonthlyLivingTotal + dispMonthlyTuition, // For backwards compatibility if referenced
    },
    firstYear: {
      tuition: dispFirstYearTuition,
      living: dispFirstYearLiving,
      oneTimeCosts: dispFirstYearOneTime,
      total: dispFirstYearTotal,
    },
    totalProgram: {
      tuition: dispProgramTuition,
      living: dispProgramLiving,
      oneTimeCosts: dispProgramOneTime,
      total: dispProgramTotal,
    },
    range: {
      monthlyLiving: {
        low: Math.round(monthlyLivingLowExact),
        typical: dispMonthlyLivingTotal,
        high: Math.round(monthlyLivingHighExact),
      },
      rent: {
        low: Math.round(convertCurrency(rentLow, countryBaseCurrency, displayCurrency)),
        typical: Math.round(convertCurrency(rentTypical, countryBaseCurrency, displayCurrency)),
        high: Math.round(convertCurrency(rentHigh, countryBaseCurrency, displayCurrency)),
      },
    },
    breakdown: {
      monthlyLiving: [
        { category: 'rent', label: 'Rent / Accommodation', amount: dispRent },
        { category: 'food', label: 'Food & Groceries', amount: dispFood },
        { category: 'transport', label: 'Public Transport', amount: dispTransport },
        { category: 'utilities', label: 'Utilities & Phone/Internet', amount: dispUtilities },
        { category: 'insurance', label: 'Health Insurance', amount: dispInsurance },
        { category: 'miscellaneous', label: 'Personal & Miscellaneous', amount: dispMisc },
      ],
      oneTime: Object.entries(dispOneTimeItems).map(([key, value]) => ({
        category: key,
        amount: value,
      })),
    },
    governmentProofOfFunds: govFundsConverted,
    metadata: {
      dataYear: selectedCityTier.year || countryData.governmentProofOfFunds.year || 2025,
      retrievedAt: selectedCityTier.retrieved_at || countryData.governmentProofOfFunds.retrieved_at || '2026-10-13',
      sources: countryData.sources || [],
    },
    disclaimer: isWorstCase
      ? 'Worst-case estimation: uses high-end accommodation and elevated regional expenditure.'
      : 'Estimates based on verified official immigration proof-of-funds and university cost-of-attendance data.',
  };
};
