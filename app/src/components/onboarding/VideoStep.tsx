import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoStepProps {
  onFinish: () => void;
  selectedDesign: 'clean' | 'retro';
}

const VideoStep: React.FC<VideoStepProps> = ({ onFinish, selectedDesign }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      const progress = (video.currentTime / video.duration) * 100;
      setProgress(progress);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Clean Design
  if (selectedDesign === 'clean') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Step 2: How It Works
          </div>
          <h2 className="text-2xl font-bold">Quick Overview</h2>
          <p className="text-muted-foreground">
            Learn how to use Tabbie in just 20 seconds
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
        {/* Video Container */}
        <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
          <video
            ref={videoRef}
            className="w-full aspect-video"
            muted={isMuted}
            playsInline
          >
            {/* Placeholder for actual video - you'll need to add the video file */}
            <source src="/demo-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Placeholder overlay if no video exists */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <div className="text-center text-white space-y-4">
              <div className="text-6xl">🎬</div>
              <div className="text-lg font-semibold">Demo Video Coming Soon</div>
              <div className="text-sm opacity-90">
                Add your demo-video.mp4 to /public folder
              </div>
            </div>
          </div>

          {/* Video Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <Button
                onClick={togglePlay}
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <Button
                onClick={toggleMute}
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Key Features Quick List */}
        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">📝</span>
            <span>Task Management</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⏰</span>
            <span>Pomodoro Timer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <span>Activity Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📅</span>
            <span>Event Tracking</span>
          </div>
        </div>
      </div>

        <div className="flex justify-between pt-4">
          <Button 
            onClick={onFinish}
            variant="ghost"
          >
            Skip Video
          </Button>
          <Button 
            onClick={onFinish}
            size="lg"
            className="min-w-[150px]"
          >
            Get Started! 🚀
          </Button>
        </div>
      </div>
    );
  }

  // Retro Design
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-2 border-black bg-[#ffe164] dark:bg-[#ffd700] text-gray-900 text-xs font-black mb-2 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-900"></span>
          Step 2: How It Works
        </div>
        <h2 className="text-3xl font-black">Quick Overview</h2>
        <p className="text-gray-700 dark:text-gray-300 font-bold">
          Learn how to use Tabbie in just 20 seconds
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Video Container - Retro Style */}
        <div className="relative bg-black rounded-[24px] overflow-hidden border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
          <video
            ref={videoRef}
            className="w-full aspect-video"
            muted={isMuted}
            playsInline
          >
            <source src="/demo-video.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Placeholder overlay if no video exists */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <div className="text-center text-white space-y-4">
              <div className="text-6xl">🎬</div>
              <div className="text-lg font-bold">Demo Video Coming Soon</div>
              <div className="text-sm opacity-90 font-medium">
                Add your demo-video.mp4 to /public folder
              </div>
            </div>
          </div>

          {/* Video Controls Overlay - Retro Style */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
            <div className="mb-3">
              <div className="h-2 bg-white/30 rounded-full overflow-hidden border-2 border-white/50">
                <div 
                  className="h-full bg-[#ffe164] transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button
                onClick={togglePlay}
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20 font-bold"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <Button
                onClick={toggleMute}
                variant="ghost"
                size="sm"
                className="text-white hover:text-white hover:bg-white/20 font-bold"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Key Features - Retro Style */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-[#fff3b0] dark:bg-[#ffd700] border-2 border-black rounded-full px-3 py-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(255,215,0,0.5)]">
            <span className="text-base">📝</span>
            <span className="text-sm font-bold text-gray-900">Task Management</span>
          </div>
          <div className="flex items-center gap-2 bg-[#d4f1ff] dark:bg-[#00d4ff] border-2 border-black rounded-full px-3 py-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(0,212,255,0.5)]">
            <span className="text-base">⏰</span>
            <span className="text-sm font-bold text-gray-900">Pomodoro Timer</span>
          </div>
          <div className="flex items-center gap-2 bg-[#ffd4f4] dark:bg-[#ff69b4] border-2 border-black rounded-full px-3 py-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(255,105,180,0.5)]">
            <span className="text-base">📊</span>
            <span className="text-sm font-bold text-gray-900">Activity Dashboard</span>
          </div>
          <div className="flex items-center gap-2 bg-[#96f2d7] dark:bg-[#00e5a0] border-2 border-black rounded-full px-3 py-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)] dark:shadow-[3px_3px_0_0_rgba(0,229,160,0.5)]">
            <span className="text-base">📅</span>
            <span className="text-sm font-bold text-gray-900">Event Tracking</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button 
          onClick={onFinish}
          variant="ghost"
          className="font-bold"
        >
          Skip Video
        </Button>
        <Button 
          onClick={onFinish}
          size="lg"
          className="min-w-[150px] rounded-full border-2 border-black bg-[#96f2d7] dark:bg-[#00e5a0] text-gray-900 font-bold shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(0,229,160,0.5)] hover:bg-[#7de0bf] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[6px_6px_0_0_rgba(0,229,160,0.7)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
        >
          Get Started! 🚀
        </Button>
      </div>
    </div>
  );
};

export default VideoStep;

