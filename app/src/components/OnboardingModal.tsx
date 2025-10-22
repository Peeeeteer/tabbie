import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog';
import WelcomeStep from './onboarding/WelcomeStep';
import TabbieStep from './onboarding/TabbieStep';
import VideoStep from './onboarding/VideoStep';
import { loadUserData } from '@/utils/storage';

type ThemeMode = 'light' | 'dark' | 'auto';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (selectedDesign: 'clean' | 'retro', themeMode: ThemeMode) => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedDesign, setSelectedDesign] = useState<'clean' | 'retro'>(() => {
    const userData = loadUserData();
    return userData.settings.theme || 'clean';
  });
  const [selectedThemeMode, setSelectedThemeMode] = useState<ThemeMode>(() => {
    const userData = loadUserData();
    return userData.settings.themeMode || 'auto';
  });

  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSkipTabbie = () => {
    setCurrentStep(2); // Skip to video step
  };

  const handleFinish = () => {
    onComplete(selectedDesign, selectedThemeMode);
  };

  const totalSteps = 3;
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        hideClose={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Progress Indicator */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <DialogHeader className="pt-4">
          {/* Step Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {[...Array(totalSteps)].map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-primary w-6'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        {/* Step Content */}
        <div className="py-4">
          {currentStep === 0 && (
            <WelcomeStep
              selectedDesign={selectedDesign}
              onDesignSelect={setSelectedDesign}
              selectedThemeMode={selectedThemeMode}
              onThemeModeSelect={setSelectedThemeMode}
              onNext={handleNext}
            />
          )}
          
          {currentStep === 1 && (
            <TabbieStep
              onNext={handleNext}
              onSkip={handleSkipTabbie}
              onBack={handleBack}
              selectedDesign={selectedDesign}
            />
          )}
          
          {currentStep === 2 && (
            <VideoStep
              onFinish={handleFinish}
              selectedDesign={selectedDesign}
            />
          )}
        </div>

        {/* Step Counter */}
        <div className="text-center text-xs text-muted-foreground pb-2">
          Step {currentStep + 1} of {totalSteps}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;

