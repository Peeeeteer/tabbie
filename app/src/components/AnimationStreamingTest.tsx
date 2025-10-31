import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square, Wifi, WifiOff } from 'lucide-react';

interface AnimationData {
  name: string;
  width: number;
  height: number;
  frameCount: number;
  fps: number;
  frameDelay: number;
  frameSize: number;
  frames: number[][];
  stats: {
    totalSize: number;
    totalSizeKB: number;
    duration: number;
    bandwidth: number;
  };
}

interface StreamingStats {
  framesSent: number;
  bytesSent: number;
  startTime: number;
  currentFps: number;
  latency: number;
}

export function AnimationStreamingTest() {
  const [idleAnimation, setIdleAnimation] = useState<AnimationData | null>(null);
  const [loveAnimation, setLoveAnimation] = useState<AnimationData | null>(null);
  const [currentAnimation, setCurrentAnimation] = useState<AnimationData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [stats, setStats] = useState<StreamingStats>({
    framesSent: 0,
    bytesSent: 0,
    startTime: 0,
    currentFps: 0,
    latency: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);

  // Load animation files
  useEffect(() => {
    const loadAnimations = async () => {
      try {
        setLoading(true);
        setError('');

        const [idleRes, loveRes] = await Promise.all([
          fetch('/animations/idle01.json'),
          fetch('/animations/love01.json'),
        ]);

        if (!idleRes.ok || !loveRes.ok) {
          throw new Error('Failed to load animation files');
        }

        const idleData = await idleRes.json();
        const loveData = await loveRes.json();

        setIdleAnimation(idleData);
        setLoveAnimation(loveData);
        setCurrentAnimation(idleData);

        console.log('✅ Loaded animations:', {
          idle: `${idleData.frameCount} frames, ${idleData.stats.totalSizeKB} KB`,
          love: `${loveData.frameCount} frames, ${loveData.stats.totalSizeKB} KB`,
        });
      } catch (err) {
        console.error('Failed to load animations:', err);
        setError('Failed to load animation files. Run the extraction script first.');
      } finally {
        setLoading(false);
      }
    };

    loadAnimations();
  }, []);

  // Draw frame to canvas
  const drawFrame = (frameData: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas || !currentAnimation) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Scale factor for better visibility
    const scale = 4;
    canvas.width = currentAnimation.width * scale;
    canvas.height = currentAnimation.height * scale;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw bitmap
    ctx.fillStyle = '#FFFFFF';
    for (let byte = 0; byte < frameData.length; byte++) {
      const x = (byte % 16) * 8;
      const y = Math.floor(byte / 16);

      for (let bit = 0; bit < 8; bit++) {
        if (frameData[byte] & (1 << (7 - bit))) {
          const pixelX = (x + bit) * scale;
          const pixelY = y * scale;
          ctx.fillRect(pixelX, pixelY, scale, scale);
        }
      }
    }
  };

  // Animation playback loop
  useEffect(() => {
    if (!isPlaying || !currentAnimation) return;

    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
      }

      const elapsed = timestamp - lastFrameTimeRef.current;

      if (elapsed >= currentAnimation.frameDelay) {
        // Draw current frame
        drawFrame(currentAnimation.frames[currentFrame]);

        // Simulate streaming if enabled
        if (isStreaming) {
          const frameSize = currentAnimation.frameSize;
          const networkLatency = Math.random() * 10 + 5; // Simulate 5-15ms latency

          setStats((prev) => ({
            ...prev,
            framesSent: prev.framesSent + 1,
            bytesSent: prev.bytesSent + frameSize,
            latency: networkLatency,
            currentFps: 1000 / (timestamp - lastFrameTimeRef.current),
          }));

          console.log(`📡 Frame ${currentFrame} streamed: ${frameSize} bytes, ${networkLatency.toFixed(1)}ms latency`);
        }

        // Advance to next frame
        setCurrentFrame((prev) => (prev + 1) % currentAnimation.frameCount);
        lastFrameTimeRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentAnimation, currentFrame, isStreaming]);

  const handlePlay = () => {
    setIsPlaying(true);
    setStats({
      framesSent: 0,
      bytesSent: 0,
      startTime: Date.now(),
      currentFps: 0,
      latency: 0,
    });
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setIsStreaming(false);
    setCurrentFrame(0);
    lastFrameTimeRef.current = 0;
  };

  const handleStartStreaming = () => {
    setIsStreaming(true);
    handlePlay();
  };

  const switchAnimation = (animation: AnimationData) => {
    handleStop();
    setCurrentAnimation(animation);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Animation Streaming Test</CardTitle>
          <CardDescription>Loading animations...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Animation Streaming Test</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Run this command to extract animations:
          </p>
          <code className="block bg-muted p-2 rounded text-xs">
            cd image-to-bitmap && ./test_animation_streaming.sh
          </code>
        </CardContent>
      </Card>
    );
  }

  const elapsedTime = stats.startTime ? (Date.now() - stats.startTime) / 1000 : 0;
  const avgBandwidth = elapsedTime > 0 ? (stats.bytesSent * 8) / elapsedTime / 1024 : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Animation Streaming Test
            {isStreaming && (
              <Badge variant="default" className="animate-pulse">
                <Wifi className="w-3 h-3 mr-1" />
                Streaming
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Test WiFi-based animation streaming without firmware changes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Animation Selection */}
          <div>
            <h3 className="text-sm font-medium mb-3">Select Animation</h3>
            <div className="flex gap-2">
              <Button
                variant={currentAnimation === idleAnimation ? 'default' : 'outline'}
                onClick={() => idleAnimation && switchAnimation(idleAnimation)}
                disabled={!idleAnimation}
              >
                Idle Animation
                {idleAnimation && (
                  <Badge variant="secondary" className="ml-2">
                    {idleAnimation.frameCount} frames
                  </Badge>
                )}
              </Button>
              <Button
                variant={currentAnimation === loveAnimation ? 'default' : 'outline'}
                onClick={() => loveAnimation && switchAnimation(loveAnimation)}
                disabled={!loveAnimation}
              >
                Love Animation
                {loveAnimation && (
                  <Badge variant="secondary" className="ml-2">
                    {loveAnimation.frameCount} frames
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Canvas Display */}
          <div className="border rounded-lg p-4 bg-black flex justify-center">
            <canvas
              ref={canvasRef}
              className="border border-gray-700 rounded"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!isPlaying ? (
              <Button onClick={handlePlay} className="gap-2">
                <Play className="w-4 h-4" />
                Play Local
              </Button>
            ) : (
              <Button onClick={handlePause} variant="secondary" className="gap-2">
                <Pause className="w-4 h-4" />
                Pause
              </Button>
            )}
            <Button onClick={handleStop} variant="outline" className="gap-2">
              <Square className="w-4 h-4" />
              Stop
            </Button>
            <div className="flex-1" />
            {!isStreaming ? (
              <Button onClick={handleStartStreaming} variant="default" className="gap-2">
                <Wifi className="w-4 h-4" />
                Simulate Streaming
              </Button>
            ) : (
              <Button onClick={() => setIsStreaming(false)} variant="destructive" className="gap-2">
                <WifiOff className="w-4 h-4" />
                Stop Streaming
              </Button>
            )}
          </div>

          {/* Stats */}
          {currentAnimation && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Current Frame</p>
                <p className="text-2xl font-bold">
                  {currentFrame + 1}/{currentAnimation.frameCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">FPS</p>
                <p className="text-2xl font-bold">
                  {isPlaying ? stats.currentFps.toFixed(1) : currentAnimation.fps}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Animation Size</p>
                <p className="text-2xl font-bold">{currentAnimation.stats.totalSizeKB} KB</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-2xl font-bold">{currentAnimation.stats.duration}s</p>
              </div>
            </div>
          )}

          {/* Streaming Stats */}
          {isStreaming && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Streaming Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Frames Sent</p>
                  <p className="text-xl font-bold">{stats.framesSent}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data Sent</p>
                  <p className="text-xl font-bold">{(stats.bytesSent / 1024).toFixed(2)} KB</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bandwidth</p>
                  <p className="text-xl font-bold">{avgBandwidth.toFixed(1)} kbps</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Latency</p>
                  <p className="text-xl font-bold">{stats.latency.toFixed(1)} ms</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Check browser console for frame-by-frame streaming logs
              </p>
            </div>
          )}

          {/* Info */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-2">About This Test</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Play Local</strong>: Simulates animations playing from ESP32 flash memory</li>
              <li>• <strong>Simulate Streaming</strong>: Shows what WiFi streaming would look like</li>
              <li>• Frame data is logged to console showing what would be sent over WiFi</li>
              <li>• Latency is simulated (5-15ms) to represent local WiFi network delays</li>
              <li>• This test proves the concept before implementing firmware changes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

