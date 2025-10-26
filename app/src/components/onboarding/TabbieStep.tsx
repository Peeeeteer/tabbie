import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wifi, WifiOff, AlertCircle, CheckCircle, RefreshCw, Eye, Smile, PartyPopper, PlayCircle } from 'lucide-react';

interface TabbieStepProps {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
  selectedDesign: 'clean' | 'retro';
}

const TabbieStep: React.FC<TabbieStepProps> = ({ onNext, onSkip, onBack, selectedDesign }) => {
  const [showConnection, setShowConnection] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [customIP, setCustomIP] = useState('tabbie.local');

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionError('');
    
    try {
      const response = await fetch(`http://${customIP}/api/status`, {
        method: 'GET',
      });
      
      if (response.ok) {
        setIsConnected(true);
        setConnectionError('');
        // Auto-advance after successful connection
        setTimeout(() => {
          onNext();
        }, 1500);
      } else {
        throw new Error('Failed to connect');
      }
    } catch (error) {
      setIsConnected(false);
      setConnectionError('Cannot reach Tabbie. Make sure it\'s powered on and connected to WiFi.');
    } finally {
      setIsConnecting(false);
    }
  };

  if (!showConnection) {
    // Clean Design Style
    if (selectedDesign === 'clean') {
      return (
        <div className="space-y-6 relative">
          <Button 
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="absolute -top-2 left-0 text-muted-foreground"
          >
            ← Back
          </Button>
          
          <div className="text-center space-y-2 pt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Step 1: Connect Your Tabbie
            </div>
            <h2 className="text-2xl font-bold">Meet Your Desk Companion</h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              Watch how Tabbie works, then connect it to get started
            </p>
          </div>

          {/* Video Tutorial - Embedded */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border rounded-lg overflow-hidden shadow-lg">
              {/* Video Player */}
              <div className="relative aspect-video bg-black">
                <video
                  className="w-full h-full"
                  controls
                  playsInline
                  poster="/video-thumbnail.jpg"
                >
                  <source src="/tabbie-demo.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                {/* Placeholder overlay if no video exists */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                  <div className="text-center text-white space-y-4 p-6">
                    <div className="text-6xl">🎬</div>
                    <div className="text-lg font-semibold">Tabbie Demo Video</div>
                    <div className="text-sm opacity-90">
                      Add your tabbie-demo.mp4 to /public folder
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-3 pt-4 max-w-md mx-auto">
            <Button 
              onClick={() => setShowConnection(true)}
              size="lg"
              className="w-full h-12"
            >
              <Wifi className="h-5 w-5 mr-2" />
              Connect Tabbie
            </Button>
            <Button 
              onClick={onSkip}
              variant="ghost"
              size="sm"
            >
              I don't have a Tabbie yet →
            </Button>
          </div>
        </div>
      );
    }

    // Retro Design Style
    return (
      <div className="space-y-6 relative">
        <Button 
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="absolute -top-2 left-0 text-muted-foreground font-bold"
        >
          ← Back
        </Button>
        
        <div className="text-center space-y-2 pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black bg-[#ffe164] dark:bg-[#ffd700] text-gray-900 text-xs font-black mb-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-900"></span>
            Step 1: Connect Your Tabbie
          </div>
          <h2 className="text-3xl font-black">Meet Your Desk Companion</h2>
          <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto font-bold text-sm">
            Watch how Tabbie works, then connect it to get started
          </p>
        </div>

        {/* Video Tutorial - Embedded Retro Style */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border-2 border-black rounded-[24px] overflow-hidden shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)]">
            {/* Video Player */}
            <div className="relative aspect-video bg-black">
              <video
                className="w-full h-full"
                controls
                playsInline
                poster="/video-thumbnail.jpg"
              >
                <source src="/tabbie-demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              {/* Placeholder overlay if no video exists */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                <div className="text-center text-white space-y-4 p-6">
                  <div className="text-6xl">🎬</div>
                  <div className="text-lg font-black">Tabbie Demo Video</div>
                  <div className="text-sm opacity-90 font-medium">
                    Add your tabbie-demo.mp4 to /public folder
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-3 pt-4 max-w-md mx-auto">
          <Button 
            onClick={() => setShowConnection(true)}
            size="lg"
            className="w-full h-12 rounded-full border-2 border-black bg-[#ffe164] dark:bg-[#ffd700] text-gray-900 font-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_0_rgba(255,215,0,0.5)] hover:bg-[#ffd633] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0_0_rgba(255,215,0,0.7)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            <Wifi className="h-5 w-5 mr-2" />
            Connect Tabbie
          </Button>
          <Button 
            onClick={onSkip}
            variant="ghost"
            size="sm"
            className="font-bold"
          >
            I don't have a Tabbie yet →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl mb-2">
          {isConnected ? <CheckCircle className="h-12 w-12 text-green-500 mx-auto" /> : <Wifi className="h-12 w-12 mx-auto" />}
        </div>
        <h2 className="text-2xl font-bold">
          {isConnected ? 'Connected!' : 'Connect Your Tabbie'}
        </h2>
        <p className="text-muted-foreground">
          {isConnected 
            ? 'Your Tabbie is ready to assist you' 
            : 'Make sure Tabbie is powered on and connected to WiFi'
          }
        </p>
      </div>

      {!isConnected && (
        <>
          <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm space-y-2">
                <div className="font-semibold">Quick Setup:</div>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>First time? Connect to "Tabbie-Setup" WiFi</li>
                  <li>Visit tabbie.local to configure your home WiFi</li>
                  <li>Wait for Tabbie to connect (check OLED display)</li>
                  <li>Both devices must be on the same network</li>
                </ol>
              </div>
            </div>
          </div>

          {connectionError && (
            <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg flex items-start gap-2 max-w-md mx-auto">
              <WifiOff className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700 dark:text-red-300">
                {connectionError}
              </div>
            </div>
          )}

          <div className="flex gap-2 max-w-md mx-auto">
            <Input
              placeholder="tabbie.local"
              value={customIP}
              onChange={(e) => setCustomIP(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="min-w-[100px]"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        </>
      )}

      <div className="flex justify-between pt-4">
        <Button 
          onClick={onSkip}
          variant="ghost"
        >
          Skip for Now
        </Button>
        {isConnected && (
          <Button 
            onClick={onNext}
            size="lg"
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
};

export default TabbieStep;

