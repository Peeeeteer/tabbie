import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Play, Pause, Square, Wifi, WifiOff, Zap } from 'lucide-react';

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
  const [isRealStreaming, setIsRealStreaming] = useState(false);
  const [esp32IP, setEsp32IP] = useState('');
  const [esp32Connected, setEsp32Connected] = useState(false);
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
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Draw initial frame when animation changes
  useEffect(() => {
    if (currentAnimation && !isPlaying) {
      // Draw frame 0 when animation is loaded/switched
      drawFrame(currentAnimation.frames[0]);
    }
  }, [currentAnimation]);

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
    setIsRealStreaming(false);
    setCurrentFrame(0);
    lastFrameTimeRef.current = 0;
    
    // Stop real streaming
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    
    // Stop streaming on ESP32
    if (esp32Connected) {
      fetch(`http://${esp32IP}/api/stream-stop`, {
        method: 'POST',
      }).catch(err => console.error('Failed to stop ESP32 stream:', err));
    }
  };

  const handleStartStreaming = () => {
    console.log('🎬 Starting simulate streaming mode (browser only)');
    console.log('Animation:', currentAnimation?.name, `${currentAnimation?.frameCount} frames`);
    setIsStreaming(true);
    handlePlay();
  };

  const switchAnimation = (animation: AnimationData) => {
    handleStop();
    setCurrentAnimation(animation);
  };

  // Check ESP32 connection
  const checkESP32Connection = async () => {
    if (!esp32IP) {
      setError('Please enter ESP32 IP address');
      return;
    }

    try {
      const response = await fetch(`http://${esp32IP}/api/status`, {
        signal: AbortSignal.timeout(3000),
      });
      
      if (response.ok) {
        setEsp32Connected(true);
        setError('');
        console.log('✅ Connected to ESP32 streaming test firmware');
      } else {
        throw new Error('Failed to connect');
      }
    } catch (err) {
      setEsp32Connected(false);
      setError('Cannot connect to ESP32. Make sure streaming test firmware is uploaded.');
      console.error('❌ ESP32 connection failed:', err);
    }
  };

  // Send a single frame to ESP32
  const sendFrameToESP32 = async (frameData: number[]) => {
    if (!esp32Connected || !esp32IP) return;

    try {
      const startTime = performance.now();
      
      // Convert number array to Uint8Array
      const frameBytes = new Uint8Array(frameData);
      
      // Convert to base64 to avoid binary data issues with ESP32 WebServer
      const base64 = btoa(String.fromCharCode(...frameBytes));
      
      const response = await fetch(`http://${esp32IP}/api/stream-frame`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: base64,
        signal: AbortSignal.timeout(5000),
      });

      const endTime = performance.now();
      const latency = endTime - startTime;

      if (response.ok) {
        setStats(prev => {
          const newStats = {
            ...prev,
            framesSent: prev.framesSent + 1,
            bytesSent: prev.bytesSent + 1024,
            latency: latency,
            currentFps: 1000 / (endTime - (lastFrameTimeRef.current || endTime)),
          };
          
          if (newStats.framesSent % 10 === 0) {
            console.log(`📡 Frame ${newStats.framesSent} sent to ESP32: ${latency.toFixed(1)}ms latency`);
          }
          
          return newStats;
        });
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to send frame to ESP32:', response.statusText, errorText);
      }
    } catch (err) {
      console.error('❌ Error sending frame to ESP32:', err);
      setError('Lost connection to ESP32');
      setEsp32Connected(false);
      handleStop();
    }
  };

  // Start real streaming to ESP32
  const handleStartRealStreaming = async () => {
    if (!esp32Connected || !currentAnimation) {
      setError('Connect to ESP32 first');
      return;
    }

    try {
      // Tell ESP32 to start streaming mode
      const response = await fetch(`http://${esp32IP}/api/stream-start`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to start streaming on ESP32');
      }

      setIsRealStreaming(true);
      setIsPlaying(true);
      setStats({
        framesSent: 0,
        bytesSent: 0,
        startTime: Date.now(),
        currentFps: 0,
        latency: 0,
      });

      let frameIndex = 0;

      // Start sending frames at the animation's target FPS
      streamingIntervalRef.current = setInterval(() => {
        if (currentAnimation) {
          sendFrameToESP32(currentAnimation.frames[frameIndex]);
          
          // Also display locally
          drawFrame(currentAnimation.frames[frameIndex]);
          setCurrentFrame(frameIndex);

          frameIndex = (frameIndex + 1) % currentAnimation.frameCount;
        }
      }, currentAnimation.frameDelay);

      console.log('🎬 Started real streaming to ESP32');
    } catch (err) {
      console.error('❌ Failed to start real streaming:', err);
      setError('Failed to start streaming on ESP32');
    }
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
          {/* ESP32 Connection */}
          <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Real ESP32 Streaming
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="ESP32 IP (e.g., 192.168.1.100)"
                  value={esp32IP}
                  onChange={(e) => setEsp32IP(e.target.value)}
                  className="flex-1"
                  disabled={isRealStreaming}
                />
                <Button 
                  onClick={checkESP32Connection}
                  disabled={!esp32IP || isRealStreaming}
                  variant={esp32Connected ? "default" : "outline"}
                >
                  {esp32Connected ? '✓ Connected' : 'Connect'}
                </Button>
              </div>
              
              {esp32Connected && (
                <div className="flex gap-2">
                  {!isRealStreaming ? (
                    <Button 
                      onClick={handleStartRealStreaming}
                      disabled={!currentAnimation}
                      className="gap-2 w-full"
                      variant="default"
                    >
                      <Wifi className="w-4 h-4" />
                      Stream to Real ESP32
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleStop}
                      className="gap-2 w-full"
                      variant="destructive"
                    >
                      <WifiOff className="w-4 h-4" />
                      Stop ESP32 Stream
                    </Button>
                  )}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                {esp32Connected ? 
                  '✅ Ready to stream animations to your physical Tabbie display!' :
                  '📡 Upload streaming test firmware to ESP32 first, then connect'
                }
              </p>
            </div>
          </div>

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
              <Button onClick={handlePlay} className="gap-2" disabled={!currentAnimation}>
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
              <Button 
                onClick={handleStartStreaming} 
                variant="default" 
                className="gap-2"
                disabled={!currentAnimation}
              >
                <Wifi className="w-4 h-4" />
                Simulate Streaming
              </Button>
            ) : (
              <Button onClick={() => { setIsStreaming(false); handleStop(); }} variant="destructive" className="gap-2">
                <WifiOff className="w-4 h-4" />
                Stop Simulation
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
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>
                <strong className="text-foreground">Play Local</strong>: Preview animation in browser (shows first frame when stopped)
              </li>
              <li>
                <strong className="text-foreground">Simulate Streaming</strong>: Simulates WiFi streaming metrics in browser only (NOT sent to ESP32)
              </li>
              <li>
                <strong className="text-foreground">Stream to Real ESP32</strong>: 
                <ol className="ml-4 mt-1 space-y-1">
                  <li>1. Enter ESP32 IP (shown on OLED)</li>
                  <li>2. Click "Connect" button</li>
                  <li>3. Select animation (Idle or Love)</li>
                  <li>4. Click "Stream to Real ESP32"</li>
                  <li>5. Watch animation on physical display! 🚀</li>
                </ol>
              </li>
              <li className="text-xs italic">
                💡 Open browser console (F12) to see detailed streaming logs
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

