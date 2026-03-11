import React, { createContext, useContext, useEffect } from 'react';

type Theme = 'bright-vibrant';

interface ThemeContextType {
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme: Theme = 'bright-vibrant';

  useEffect(() => {
    // Remove any existing theme classes and keep only the bright-vibrant theme
    document.body.classList.remove('theme-sleek-dark', 'theme-light-airy');
    // bright-vibrant is the default, so no additional class needed
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};