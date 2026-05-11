'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors outline-none hover:bg-slate-100 dark:hover:bg-slate-800">
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        <span className="sr-only">Toggle theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => setTheme('light')} className="gap-2">
          <Sun className="h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="gap-2">
          <Moon className="h-4 w-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="gap-2">
          <Monitor className="h-4 w-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
