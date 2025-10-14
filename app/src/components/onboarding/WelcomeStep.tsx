import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WelcomeStepProps {
  selectedDesign: 'clean' | 'retro';
  onDesignSelect: (design: 'clean' | 'retro') => void;
  onNext: () => void;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ 
  selectedDesign, 
  onDesignSelect, 
  onNext 
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🎉 Welcome to Tabbie!</h1>
        <p className="text-muted-foreground">
          Your personal productivity assistant
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-center">Choose Your Design</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Clean Design Option */}
          <Card 
            className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
              selectedDesign === 'clean' 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => onDesignSelect('clean')}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  🎯 Clean
                </h3>
                {selectedDesign === 'clean' && (
                  <div className="text-primary text-xl">✓</div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Modern, minimalist design with smooth animations
              </p>
              
              {/* Preview of Clean Design - Actual TasksPage style */}
              <div className="bg-background rounded-lg p-3 space-y-2">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Your Tasks
                </div>
                
                {/* Task 1 */}
                <div className="flex items-center gap-2 py-2 px-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
                  <div className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0"></div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">💼</span>
                    <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                  </div>
                  <span className="text-xs font-medium text-foreground">Build awesome things</span>
                </div>
                
                {/* Task 2 */}
                <div className="flex items-center gap-2 py-2 px-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
                  <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs">🎨</span>
                    <div className="w-1 h-1 rounded-full bg-orange-500"></div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground line-through">Take a break</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Retro Design Option */}
          <Card 
            className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
              selectedDesign === 'retro' 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => onDesignSelect('retro')}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  📟 Retro
                </h3>
                {selectedDesign === 'retro' && (
                  <div className="text-primary text-xl">✓</div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Bold, playful design with chunky borders and bright colors
              </p>
              
              {/* Preview using Neobrutalism style - adapts to light/dark mode */}
              <div className="bg-[#faf7f1] dark:bg-[#2a2a2a] rounded-lg p-3 space-y-2">
                <div className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  📝 Your Tasks
                </div>
                <div className="bg-[#ffe164] dark:bg-[#ffd700] border-2 border-black rounded-2xl p-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,215,0,0.5)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0_0_rgba(255,215,0,0.7)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-black bg-white dark:bg-[#1a1a1a] flex-shrink-0"></div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">💼</span>
                      <div className="w-1 h-1 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                    </div>
                    <span className="text-xs font-bold text-gray-900">Build awesome things</span>
                  </div>
                </div>
                <div className="bg-[#d4f1ff] dark:bg-[#00d4ff] border-2 border-black rounded-2xl p-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,212,255,0.5)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0_0_rgba(0,212,255,0.7)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-black bg-black flex items-center justify-center flex-shrink-0">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">🎨</span>
                      <div className="w-1 h-1 rounded-full bg-orange-500 dark:bg-orange-400"></div>
                    </div>
                    <span className="text-xs font-bold text-gray-900 line-through">Take a break ☕</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-4">
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

