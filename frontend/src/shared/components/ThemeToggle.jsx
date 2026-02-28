import React from 'react';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle = ({
  theme = 'light',
  onToggle,
  lang = 'en',
  className = '',
  showLabel = true,
  iconSize = 18,
  darkLabel,
  lightLabel,
}) => {
  const actionLabel = theme === 'dark'
    ? (lightLabel || (lang === 'ar' ? 'وضع فاتح' : 'Light Mode'))
    : (darkLabel || (lang === 'ar' ? 'وضع داكن' : 'Dark Mode'));

  const classes = ['inline-flex items-center gap-2', className].filter(Boolean).join(' ');

  return (
    <button
      type="button"
      onClick={onToggle}
      className={classes}
      title={actionLabel}
      aria-label={actionLabel}
    >
      {theme === 'dark' ? <Sun size={iconSize} /> : <Moon size={iconSize} />}
      {showLabel ? <span>{actionLabel}</span> : null}
    </button>
  );
};

export default ThemeToggle;

