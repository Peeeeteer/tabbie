import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sun, Moon, Clock, Sparkles, Square } from 'lucide-react';
import { useDarkMode } from '@/contexts/DarkModeContext';

type ThemeMode = 'light' | 'dark' | 'auto';

interface WelcomeStepProps {
  selectedDesign: 'clean' | 'retro';
  onDesignSelect: (design: 'clean' | 'retro') => void;
  selectedThemeMode: ThemeMode;
  onThemeModeSelect: (mode: ThemeMode) => void;
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ 
  selectedDesign, 
  onDesignSelect,
  selectedThemeMode,
  onThemeModeSelect,
  onNext 
}) => {
  const { setThemeMode } = useDarkMode();

  const handleThemeModeSelect = (mode: ThemeMode) => {
    // Update the parent state
    onThemeModeSelect(mode);
    // Immediately apply the theme mode for preview
    setThemeMode(mode);
  };
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold">🎉 Welcome to Tabbie!</h1>
        <p className="text-sm text-muted-foreground">
          Your personal productivity assistant
        </p>
      </div>

      {/* Design Style - Main Choice */}
      <div className="space-y-3 p-4 bg-primary/5 rounded-xl border-2 border-primary/20">
        <div className="text-center">
          <h2 className="text-xl font-bold text-primary">Choose Your Design Style</h2>
          <p className="text-xs text-muted-foreground mt-1">
            This completely changes how Tabbie looks and feels
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Clean Design Option */}
          <Card 
            className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
              selectedDesign === 'clean' 
                ? 'ring-4 ring-blue-500 shadow-lg bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20' 
                : 'hover:border-blue-300 hover:shadow-md'
            }`}
            onClick={() => onDesignSelect('clean')}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg transition-all ${selectedDesign === 'clean' ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-md' : 'bg-muted'}`}>
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Clean</h3>
                    <p className="text-[10px] text-muted-foreground">Modern & Minimal</p>
                  </div>
                </div>
                {selectedDesign === 'clean' && (
                  <div className="text-blue-600 dark:text-blue-400 text-xl font-bold">✓</div>
                )}
              </div>
              
              {/* Preview of Clean Design - Compact */}
              <div className="bg-background rounded-lg p-2 space-y-1.5">
                {/* Task 1 */}
                <div className="flex items-center gap-1.5 py-1 px-1.5 rounded border border-border bg-card">
                  <div className="w-3 h-3 rounded border-2 border-gray-300 flex-shrink-0"></div>
                  <span className="text-[10px]">💼</span>
                  <span className="text-[10px] font-medium text-foreground">Build things</span>
                </div>
                
                {/* Task 2 */}
                <div className="flex items-center gap-1.5 py-1 px-1.5 rounded border border-border bg-card">
                  <div className="w-3 h-3 rounded border-2 border-blue-500 bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-[10px]">🎨</span>
                  <span className="text-[10px] font-medium text-muted-foreground line-through">Take break</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Retro Design Option */}
          <Card 
            className={`p-4 cursor-pointer transition-all ${
              selectedDesign === 'retro' 
                ? 'border-4 border-black dark:border-white shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_0_rgba(255,255,255,0.3)] bg-yellow-100 dark:bg-yellow-900/30 translate-x-[-2px] translate-y-[-2px]' 
                : 'border-2 hover:border-black dark:hover:border-white hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] dark:hover:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]'
            }`}
            onClick={() => onDesignSelect('retro')}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-md transition-all ${selectedDesign === 'retro' ? 'bg-black dark:bg-white text-white dark:text-black border-2 border-black dark:border-white' : 'bg-muted border-2 border-muted'}`}>
                    <Square className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black">Retro</h3>
                    <p className="text-[10px] text-muted-foreground font-bold">Bold & Playful</p>
                  </div>
                </div>
                {selectedDesign === 'retro' && (
                  <div className="text-black dark:text-white text-2xl font-black">✓</div>
                )}
              </div>
              
              {/* Preview using Neobrutalism style - Compact */}
              <div className="bg-[#faf7f1] dark:bg-[#2a2a2a] rounded-lg p-2 space-y-1.5">
                <div className="bg-[#ffe164] dark:bg-[#ffd700] border-2 border-black rounded-xl p-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full border-2 border-black bg-white dark:bg-[#1a1a1a] flex-shrink-0"></div>
                    <span className="text-[10px]">💼</span>
                    <span className="text-[10px] font-bold text-gray-900">Build things</span>
                  </div>
                </div>
                <div className="bg-[#d4f1ff] dark:bg-[#00d4ff] border-2 border-black rounded-xl p-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full border-2 border-black bg-black flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                    <span className="text-[10px]">🎨</span>
                    <span className="text-[10px] font-bold text-gray-900 line-through">Take break</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Color Preferences</span>
        </div>
      </div>

      {/* Theme Mode Selection */}
      <div className="space-y-2">
        <div className="text-center">
          <h2 className="text-base font-semibold">Color Mode</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Light, dark, or auto ✨ Click to preview
          </p>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {/* Light Mode */}
          <button
            className={`p-3 rounded-lg border-2 transition-all hover:shadow-sm ${
              selectedThemeMode === 'light' 
                ? 'border-primary bg-primary/10 shadow-sm' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleThemeModeSelect('light')}
          >
            <div className="space-y-2 text-center">
              <div className="flex justify-center">
                <Sun className={`h-5 w-5 ${selectedThemeMode === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-sm font-medium">Light</div>
              {selectedThemeMode === 'light' && (
                <div className="text-primary text-sm">✓</div>
              )}
            </div>
          </button>

          {/* Dark Mode */}
          <button
            className={`p-3 rounded-lg border-2 transition-all hover:shadow-sm ${
              selectedThemeMode === 'dark' 
                ? 'border-primary bg-primary/10 shadow-sm' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleThemeModeSelect('dark')}
          >
            <div className="space-y-2 text-center">
              <div className="flex justify-center">
                <Moon className={`h-5 w-5 ${selectedThemeMode === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-sm font-medium">Dark</div>
              {selectedThemeMode === 'dark' && (
                <div className="text-primary text-sm">✓</div>
              )}
            </div>
          </button>

          {/* Auto Mode - Recommended */}
          <button
            className={`p-3 rounded-lg border-2 transition-all hover:shadow-sm relative ${
              selectedThemeMode === 'auto' 
                ? 'border-primary bg-primary/10 shadow-sm' 
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleThemeModeSelect('auto')}
          >
            {/* Recommended Badge */}
            <div className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              ★
            </div>
            <div className="space-y-2 text-center">
              <div className="flex justify-center">
                <Clock className={`h-5 w-5 ${selectedThemeMode === 'auto' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="text-sm font-medium">Auto</div>
              {selectedThemeMode === 'auto' && (
                <div className="text-primary text-sm">✓</div>
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button 
          onClick={onNext}
          size="lg"
          className="min-w-[120px]"
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default WelcomeStep;

