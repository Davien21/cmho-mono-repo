import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className={cn(
        'relative h-[1.75rem] w-12 rounded-full border border-input bg-background',
        'transition-colors duration-300 ease-in-out',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
    >
      <div
        className={cn(
          'absolute top-0 left-0 h-full w-full flex items-center',
          'transition-transform duration-500 ease-spring',
          theme === 'dark' ? 'translate-x-[calc(100%-1.75rem)]' : 'translate-x-0.75'
        )}
      >
        <div className="h-7 w-7 rounded-full flex items-center justify-center">
          {theme === 'light' ? (
            <Sun className="h-5 w-5 text-yellow-500 transition-all duration-300 ease-in-out" />
          ) : (
            <Moon className="h-5 w-5 text-blue-400 transition-all duration-300 ease-in-out" />
          )}
        </div>
      </div>
    </Button>
  );
}
