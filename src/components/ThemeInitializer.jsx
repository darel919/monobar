'use client';

import { useEffect } from 'react';

export default function ThemeInitializer() {
  useEffect(() => {    const initializeTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      let themeToApply;
      
      if (savedTheme === 'light' || savedTheme === 'dark') {
        themeToApply = savedTheme;
      } else {
        themeToApply = systemPrefersDark ? 'dark' : 'light';
      }
      
      document.documentElement.setAttribute('data-theme', themeToApply);
      document.body.className = themeToApply === 'dark' ? 'dark' : 'light';
      
      console.log('Theme initialized:', themeToApply, 'from saved:', savedTheme);
    };

    initializeTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme || savedTheme === 'system') {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        document.body.className = newTheme === 'dark' ? 'dark' : 'light';
        console.log('System theme changed to:', newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  return null;
}
