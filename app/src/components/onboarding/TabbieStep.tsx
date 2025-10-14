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
          
          <div className="text-center space-y-3 pt-8">
            <h2 className="text-2xl font-bold">Meet Tabbie</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Your physical desk companion that watches, listens, and helps you stay productive
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-card border rounded-lg p-4 space-y-2 hover:bg-accent transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="font-semibold">Watches & Listens</div>
              <div className="text-sm text-muted-foreground">
                Monitors your work sessions
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 space-y-2 hover:bg-accent transition-colors">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Smile className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="font-semibold">Shows Expressions</div>
              <div className="text-sm text-muted-foreground">
                Displays emotions based on activity
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 space-y-2 hover:bg-accent transition-colors">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <PartyPopper className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="font-semibold">Celebrates Success</div>
              <div className="text-sm text-muted-foreground">
                Reacts to completed tasks
              </div>
            </div>
          </div>

          {/* Video Tutorial - Clean Style */}
          <div className="max-w-md mx-auto">
            <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <PlayCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">Quick Tutorial</div>
                  <p className="text-sm text-muted-foreground mb-2">
                    See how Tabbie works on your desk
                  </p>
                  <a
                    href="https://www.youtube.com/@LloydDecember1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                  >
                    <PlayCircle className="h-4 w-4" />
                    <span>Watch Tutorial</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Button 
              onClick={() => setShowConnection(true)}
              size="lg"
            >
              <Wifi className="h-4 w-4 mr-2" />
              I Have a Tabbie
            </Button>
            <Button 
              onClick={onSkip}
              variant="outline"
              size="lg"
            >
              Skip
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
        
        <div className="text-center space-y-3 pt-8">
          <h2 className="text-3xl font-black">Meet Tabbie</h2>
          <p className="text-gray-700 dark:text-gray-300 max-w-md mx-auto font-medium">
            Your physical desk companion that watches, listens, and helps you stay productive
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-[#fff3b0] dark:bg-[#ffd700] border-2 border-black rounded-[24px] p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_0_rgba(255,215,0,0.5)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0_0_rgba(255,215,0,0.7)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
            <div className="w-12 h-12 rounded-full border-2 border-black bg-white dark:bg-[#1a1a1a] flex items-center justify-center mb-3">
              <Eye className="h-6 w-6 text-gray-900 dark:text-white" />
            </div>
            <div className="font-bold text-gray-900 mb-1">Watches & Listens</div>
            <div className="text-sm text-gray-700 dark:text-gray-900 font-medium">
              Monitors your work sessions
            </div>
          </div>
          
          <div className="bg-[#ffd4f4] dark:bg-[#ff69b4] border-2 border-black rounded-[24px] p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_0_rgba(255,105,180,0.5)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0_0_rgba(255,105,180,0.7)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
            <div className="w-12 h-12 rounded-full border-2 border-black bg-white dark:bg-[#1a1a1a] flex items-center justify-center mb-3">
              <Smile className="h-6 w-6 text-gray-900 dark:text-white" />
            </div>
            <div className="font-bold text-gray-900 mb-1">Shows Expressions</div>
            <div className="text-sm text-gray-700 dark:text-gray-900 font-medium">
              Displays emotions based on activity
            </div>
          </div>
          
          <div className="bg-[#96f2d7] dark:bg-[#00e5a0] border-2 border-black rounded-[24px] p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_0_rgba(0,229,160,0.5)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0_0_rgba(0,229,160,0.7)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
            <div className="w-12 h-12 rounded-full border-2 border-black bg-white dark:bg-[#1a1a1a] flex items-center justify-center mb-3">
              <PartyPopper className="h-6 w-6 text-gray-900 dark:text-white" />
            </div>
            <div className="font-bold text-gray-900 mb-1">Celebrates Success</div>
            <div className="text-sm text-gray-700 dark:text-gray-900 font-medium">
              Reacts to completed tasks
            </div>
          </div>
        </div>

        {/* Video Tutorial - Retro Style */}
        <div className="max-w-md mx-auto">
          <div className="bg-[#d4f1ff] dark:bg-[#00d4ff] border-2 border-black rounded-[24px] p-5 shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:shadow-[6px_6px_0_0_rgba(0,212,255,0.5)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0_0_rgba(0,212,255,0.7)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-black bg-white dark:bg-[#1a1a1a] flex items-center justify-center">
                <PlayCircle className="h-6 w-6 text-gray-900 dark:text-white" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-lg mb-1 text-gray-900">Quick Tutorial</div>
                <p className="text-sm text-gray-700 dark:text-gray-900 font-medium mb-3">
                  See how Tabbie works on your desk
                </p>
                <a
                  href="https://www.youtube.com/@LloydDecember1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full text-sm font-bold border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  <PlayCircle className="h-4 w-4" />
                  <span>Watch Tutorial</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-4">
          <Button 
            onClick={() => setShowConnection(true)}
            size="lg"
            className="rounded-full border-2 border-black bg-[#ffe164] dark:bg-[#ffd700] text-gray-900 font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,215,0,0.5)] hover:bg-[#ffd633] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0_0_rgba(255,215,0,0.7)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            <Wifi className="h-4 w-4 mr-2" />
            I Have a Tabbie
          </Button>
          <Button 
            onClick={onSkip}
            variant="outline"
            size="lg"
            className="rounded-full border-2 border-black bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Skip
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

