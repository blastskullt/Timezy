import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializar com o valor do localStorage imediatamente
  const [isDark, setIsDark] = useState(() => {
    try {
      const savedTheme = window.localStorage.getItem('timezy_theme');
      console.log('🎨 Verificando tema salvo na inicialização:', savedTheme);
      
      if (savedTheme) {
        const isDarkSaved = savedTheme === 'dark';
        console.log('✅ Usando tema salvo:', isDarkSaved ? 'dark' : 'light');
        return isDarkSaved;
      }
      
      // Se não há preferência salva, usar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log('🔍 Usando preferência do sistema:', prefersDark ? 'dark' : 'light');
      return prefersDark;
    } catch (error) {
      console.error('❌ Erro ao carregar tema:', error);
      return false;
    }
  });

  // Aplicar o tema no DOM sempre que isDark mudar
  useEffect(() => {
    console.log('🎨 Aplicando tema no DOM:', isDark ? 'dark' : 'light');
    
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        window.localStorage.setItem('timezy_theme', 'dark');
        console.log('🌙 Modo escuro ativado e salvo');
      } else {
        document.documentElement.classList.remove('dark');
        window.localStorage.setItem('timezy_theme', 'light');
        console.log('☀️ Modo claro ativado e salvo');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar tema:', error);
    }
  }, [isDark]);

  // Aplicar tema inicial no DOM imediatamente
  useEffect(() => {
    console.log('🚀 Aplicando tema inicial no carregamento');
    
    try {
      if (isDark) {
        document.documentElement.classList.add('dark');
        console.log('🌙 Classe dark adicionada no carregamento');
      } else {
        document.documentElement.classList.remove('dark');
        console.log('☀️ Classe dark removida no carregamento');
      }
    } catch (error) {
      console.error('❌ Erro ao aplicar tema inicial:', error);
    }
  }, []); // Executa apenas uma vez no mount

  const toggleTheme = () => {
    const newTheme = !isDark;
    console.log('🔄 Alternando tema:', isDark ? 'dark → light' : 'light → dark');
    setIsDark(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};