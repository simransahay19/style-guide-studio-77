import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FontFamily } from '@/types';

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
  availableFonts?: FontFamily[];
}

export function ImprovedFontSelector({ value, onChange, availableFonts = [] }: FontSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Ensure we have a valid array of fonts to work with
  const fonts = Array.isArray(availableFonts) ? availableFonts : [];

  // Filter fonts based on search term
  const filteredFonts = fonts.filter(font =>
    font.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group fonts by category
  const groupedFonts = filteredFonts.reduce((acc, font) => {
    const category = font.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(font);
    return acc;
  }, {} as Record<string, FontFamily[]>);

  const handleSelect = (fontName: string) => {
    onChange(`"${fontName}", ${getCategoryFallback(fontName)}`);
    setOpen(false);
  };

  const getCategoryFallback = (fontName: string) => {
    const font = fonts.find(f => f.name === fontName);
    switch (font?.category) {
      case 'serif':
        return 'serif';
      case 'monospace':
        return 'monospace';
      default:
        return 'sans-serif';
    }
  };

  const getDisplayValue = () => {
    if (!value) return 'Select font...';
    
    // Extract font name from the value (remove quotes and fallback)
    const match = value.match(/^"([^"]+)"/);
    if (match) {
      return match[1];
    }
    
    // Handle case where value might be just the font name without quotes
    const fallbackMatch = value.split(',')[0].trim().replace(/"/g, '');
    return fallbackMatch || value;
  };

  // Keep search input focused and active
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Reset search when opening
      setSearchTerm('');
      // Focus the search input after a short delay
      setTimeout(() => {
        const searchInput = document.querySelector('[cmdk-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  };

  // Keep search input active while typing
  useEffect(() => {
    if (open) {
      const searchInput = document.querySelector('[cmdk-input]') as HTMLInputElement;
      if (searchInput && document.activeElement !== searchInput) {
        searchInput.focus();
      }
    }
  }, [searchTerm, open]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">{getDisplayValue()}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search fonts..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="h-9"
            autoFocus
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>
              {fonts.length === 0 ? 'No fonts available.' : 'No fonts found.'}
            </CommandEmpty>
            {Object.entries(groupedFonts).map(([category, categoryFonts]) => (
              <CommandGroup key={category} heading={category.charAt(0).toUpperCase() + category.slice(1)}>
                {categoryFonts.map((font) => (
                  <CommandItem
                    key={font.name}
                    value={font.name}
                    onSelect={() => handleSelect(font.name)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        getDisplayValue() === font.name ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span style={{ fontFamily: `"${font.name}", ${getCategoryFallback(font.name)}` }}>
                      {font.name}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
