export const themeUtils = {  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      
      let themeToApply;
      if (theme === 'light' || theme === 'dark') {
        themeToApply = theme;
      } else {
        themeToApply = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      
      document.documentElement.setAttribute('data-theme', themeToApply);
      document.body.className = themeToApply === 'dark' ? 'dark' : 'light';
      
      console.log('Theme set to:', theme, 'Applied:', themeToApply);
    }
  },

  getTheme: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'system';
    }
    return 'system';
  },

  getCurrentAppliedTheme: () => {
    if (typeof window !== 'undefined') {
      return document.documentElement.getAttribute('data-theme') || 'light';
    }
    return 'light';
  },

  toggleTheme: () => {
    const currentTheme = themeUtils.getCurrentAppliedTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    themeUtils.setTheme(newTheme);
    return newTheme;
  }
};
