import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencySymbolContext = createContext();

export const CurrencySymbolProvider = ({ children }) => {
    const [currencySymbol, setCurrencySymbol] = useState(() => localStorage.getItem('currencySymbol') || '₹');

    useEffect(() => {
        localStorage.setItem('currencySymbol', currencySymbol);
    }, [currencySymbol]);

    const toggleCurrencySymbol = () => {
        setCurrencySymbol(prev => prev === '₹' ? '$' : '₹');
    };

    return (
        <CurrencySymbolContext.Provider value={{ currencySymbol, setCurrencySymbol, toggleCurrencySymbol }}>
            {children}
        </CurrencySymbolContext.Provider>
    );
};

export const useCurrencySymbol = () => {
    const context = useContext(CurrencySymbolContext);
    if (!context) {
        throw new Error('useCurrencySymbol must be used within CurrencySymbolProvider');
    }
    return context;
};