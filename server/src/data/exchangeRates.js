/**
 * Unified Exchange Rates (Base: 1 USD)
 * Single consistent exchange-rate source for AdmitQ
 */
export const EXCHANGE_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.88,
  SEK: 10.52,
  SGD: 1.34,
  JPY: 156.4,
  KRW: 1365.5,
  NZD: 1.67,
  INR: 83.5,
  CNY: 7.24,
  DKK: 6.87,
  NOK: 10.82,
  AED: 3.67,
  RUB: 91.50,
  MYR: 4.75,
  PLN: 3.98,
  AFN: 70.80,
  PKR: 278.50,
  BDT: 117.0,
  NGN: 1450.0,
  IDR: 16000,
  PHP: 58.50,
  VND: 25400,
  THB: 36.50,
  EGP: 47.50,
  TRY: 32.20,
  BRL: 5.15,
  MXN: 16.80,
  ZAR: 18.50,
  KES: 131.0,
  GHS: 14.50,
  SAR: 3.75,
};

/**
 * Convert an amount from fromCurrency to toCurrency using unified USD base rates
 */
export const convertCurrency = (amount, fromCurrency = 'USD', toCurrency = 'USD') => {
  if (amount === null || amount === undefined || isNaN(amount)) return null;
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES[toCurrency] || 1;
  
  // Convert from fromCurrency to USD, then from USD to toCurrency
  const amountInUsd = amount / fromRate;
  return amountInUsd * toRate;
};
