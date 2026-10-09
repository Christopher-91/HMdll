import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const exchangeRates = {
  USD: { rate: 1, symbol: '$', locale: 'en-US' },
  INR: { rate: 83.5, symbol: '₹', locale: 'en-IN' },
  EUR: { rate: 0.92, symbol: '€', locale: 'de-DE' },
  GBP: { rate: 0.79, symbol: '£', locale: 'en-GB' },
  CAD: { rate: 1.36, symbol: 'CA$', locale: 'en-CA' },
  AUD: { rate: 1.53, symbol: 'A$', locale: 'en-AU' },
};

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem('hmdll-currency') || 'USD';
  });

  useEffect(() => {
    localStorage.setItem('hmdll-currency', currency);
  }, [currency]);

  const formatCurrency = (amountInUSD) => {
    if (!amountInUSD && amountInUSD !== 0) return '—';
    const amount = Number(amountInUSD);
    const selected = exchangeRates[currency] || exchangeRates.USD;
    const converted = amount * selected.rate;
    
    return new Intl.NumberFormat(selected.locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(converted);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatCurrency, exchangeRates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
