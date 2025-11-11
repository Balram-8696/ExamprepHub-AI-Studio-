import React, { createContext, useState, useMemo } from 'react';

export const ThemeContext = createContext({
  theme: 'light',
  setTheme: (theme: string) => {},
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  const value = useMemo(() => ({
    theme,
    setTheme,
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
