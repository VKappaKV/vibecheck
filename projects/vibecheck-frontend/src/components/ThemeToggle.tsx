import { Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'

export type ThemeMode = 'light' | 'dark'

interface ThemeToggleProps {
  theme: ThemeMode
  onToggle: () => void
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  return (
    <Button type="button" variant="outline" size="icon" className="w-full sm:w-10" aria-label="Toggle theme" onClick={onToggle}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}
