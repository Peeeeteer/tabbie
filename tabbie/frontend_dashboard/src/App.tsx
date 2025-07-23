import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
} from "@/components/ui/sidebar"
import React from "react"
import { SetupWizard } from "@/components/SetupWizard"
import { TodoProvider } from "@/contexts/TodoContext"
import CategorySidebar from "@/components/CategorySidebar"
import TasksPage from "@/components/TasksPage"
import EventsPage from "@/components/EventsPage"
import NotificationsPage from "@/components/NotificationsPage"
import DashboardPage from "@/components/DashboardPage"
import ActivityPage from "@/components/ActivityPage"
import YourTabbiePage from "@/components/YourTabbiePage"
import PomodoroPage from "@/components/PomodoroPage"

export default function Page() {
  const [currentPage, setCurrentPage] = React.useState<'dashboard' | 'yourtabbie' | 'tasks' | 'reminders' | 'events' | 'notifications' | 'pomodoro' | 'calendar' | 'activity' | 'timetracking' | 'settings'>('dashboard');
  const [currentView, setCurrentView] = React.useState<'today' | 'tomorrow' | 'next7days' | 'completed' | string>('next7days');
  const [currentFace, setCurrentFace] = React.useState("default");
  const [isLoading, setIsLoading] = React.useState(false);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [logsLoading, setLogsLoading] = React.useState(false);
  const [esp32Connected, setEsp32Connected] = React.useState(false);
  const [esp32URL, setEsp32URL] = React.useState<string>("");
  const [isScanning, setIsScanning] = React.useState(false);
  const [showSetupWizard, setShowSetupWizard] = React.useState(false);
  const [isHealthChecking, setIsHealthChecking] = React.useState(false);
  const [isReconnecting, setIsReconnecting] = React.useState(false);

  // Activity stats state that updates when user data changes
  const [activityStats, setActivityStats] = React.useState({ totalXP: 0, totalPomodoros: 0 });

  // Update activity stats when user data changes
  React.useEffect(() => {
    const updateActivityStats = () => {
      const userDataStr = localStorage.getItem('tabbie-user-data');
      if (!userDataStr) {
        setActivityStats({ totalXP: 0, totalPomodoros: 0 });
        return;
      }
      
      try {
        const userData = JSON.parse(userDataStr);
        
        // Calculate actual XP from user data
        const totalXP = userData.totalXP || 0;
        
        // Calculate actual completed pomodoros
        const totalPomodoros = userData.pomodoroSessions?.filter((session: any) => 
          session.completed && session.type === 'work'
        ).length || 0;
        
        setActivityStats({ totalXP, totalPomodoros });
      } catch (error) {
        console.error('Error parsing user data for activity stats:', error);
        setActivityStats({ totalXP: 0, totalPomodoros: 0 });
      }
    };

    // Update immediately
    updateActivityStats();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tabbie-user-data') {
        updateActivityStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also update periodically to catch local changes
    const interval = setInterval(updateActivityStats, 1000); // Update more frequently

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Smart ESP32 Auto-Discovery
  const discoverESP32 = async () => {
    // Don't rediscover if we already have a working URL
    if (esp32URL) {
      console.log(`Using existing URL: ${esp32URL}`);
      return esp32URL;
    }

    // Try environment variable first (for manual overrides)
    const envURL = import.meta.env.VITE_ESP32_URL;
    if (envURL) {
      console.log("Using environment variable:", envURL);
      setEsp32URL(envURL);
      return envURL;
    }

    setIsScanning(true);
    console.log("🔍 Scanning for ESP32 on local network...");
    
    // Get current device's IP to determine subnet
    const getLocalSubnet = () => {
      // Common subnet patterns
      return [
        "192.168.1.", "192.168.2.", "192.168.0.", 
        "192.168.4.", "192.168.10.", "192.168.11.",
        "10.0.0.", "10.0.1.", "172.16.0."
      ];
    };

    // Generate IP ranges to scan - optimized for speed
    const generateIPsToScan = (): string[] => {
      const ips: string[] = [];
      const subnets = getLocalSubnet();
      
      // Priority IPs first (including your known ESP32 IP)
      const priorityIPs = [93, 100, 101, 102, 79, 50, 51, 52];
      
      for (const subnet of subnets) {
        // Add priority IPs first
        priorityIPs.forEach(num => {
          ips.push(`${subnet}${num}`);
        });
        
        // Then scan a smaller range more efficiently
        for (let i = 20; i <= 120; i += 5) { // Every 5 IPs, smaller range
          const ip = `${subnet}${i}`;
          if (!ips.includes(ip)) {
            ips.push(ip);
          }
        }
      }
      return ips;
    };

    const ipsToScan = generateIPsToScan();
    console.log(`📡 Scanning ${ipsToScan.length} potential ESP32 addresses...`);

    // Scan IPs in parallel batches for speed
    const batchSize = 10;
    for (let i = 0; i < ipsToScan.length; i += batchSize) {
      const batch = ipsToScan.slice(i, i + batchSize);
      console.log(`🔍 Scanning batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(ipsToScan.length/batchSize)}...`);
      
      const promises = batch.map(async (ip) => {
        try {
          const response = await fetch(`http://${ip}/face/status`, { 
            signal: AbortSignal.timeout(1500) 
          });
          if (response.ok) {
            const data = await response.json();
            // Verify it's actually our ESP32 by checking response structure
            if (data && typeof data.currentFace !== 'undefined') {
              return ip;
            }
          }
        } catch {
          // Ignore timeout/connection errors
        }
        return null;
      });
      
      const results = await Promise.all(promises);
      const foundIP = results.find(ip => ip !== null);
      
             if (foundIP) {
         console.log(`✅ Found ESP32 at: ${foundIP}`);
         const foundURL = `http://${foundIP}`;
         setEsp32URL(foundURL);
         setIsScanning(false);
         return foundURL;
       }
     }

     console.log("❌ ESP32 not found on network. Check WiFi connection and power.");
     setIsScanning(false);
     return null;
   };

  const handleSetupComplete = (esp32URL: string) => {
    setEsp32URL(esp32URL);
    setShowSetupWizard(false);
    setEsp32Connected(true);
    // Refresh the interface
    checkFaceStatus();
    fetchLogs();
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    setEsp32Connected(false);
    setEsp32URL(""); // Clear old URL
    
    try {
      const url = await discoverESP32();
      if (url) {
        setEsp32URL(url);
        setEsp32Connected(true);
        checkFaceStatus();
        fetchLogs();
      }
            } catch (err) {
          console.log('Reconnect failed:', err);
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleFaceChange = async (faceType: string) => {
    setIsLoading(true);
    try {
      // Use existing URL if we have one, don't rediscover every time
      let url = esp32URL;
      if (!url) {
        url = await discoverESP32();
        if (!url) {
          alert('ESP32 not found. Please check if it\'s powered on and connected to WiFi.');
          return;
        }
      }
      
      const response = await fetch(`${url}/face/${faceType}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentFace(faceType);
        setEsp32Connected(true); // Mark as connected when face change succeeds
        console.log(`Face changed to ${faceType} - Response:`, data);
        // Only refresh logs occasionally, not every face change
        if (Math.random() < 0.3) { // 30% chance to refresh logs
          fetchLogs();
        }
      } else {
        console.error('Failed to change face:', response.statusText);
        // If request failed, clear URL and mark as disconnected
        setEsp32URL("");
        setEsp32Connected(false);
        alert('Failed to change face. Make sure ESP32 is connected.');
      }
    } catch (error) {
      console.error('Error changing face:', error);
      // If request failed, clear URL and mark as disconnected
      setEsp32URL("");
      setEsp32Connected(false);
      alert('Error connecting to ESP32. Check if it\'s powered on and connected to WiFi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check face status on component mount
  const checkFaceStatus = async () => {
    try {
      // Use existing URL if available
      let url = esp32URL;
      if (!url) {
        url = await discoverESP32();
        if (!url) return;
      }
      
      const response = await fetch(`${url}/face/status`);
      if (response.ok) {
        const data = await response.json();
        setCurrentFace(data.currentFace || "default");
        console.log('Face Status:', data);
        setEsp32Connected(true);
      } else {
        setEsp32URL(""); // Clear URL if status check failed
        setEsp32Connected(false);
      }
    } catch (error) {
      console.log('Could not fetch face status:', error);
      setEsp32URL(""); // Clear URL on error
      setEsp32Connected(false);
    }
  };

  // Function to fetch logs from ESP32
  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      // Use existing URL if available, don't rediscover
      let url = esp32URL;
      if (!url) {
        url = await discoverESP32();
        if (!url) {
          setEsp32Connected(false);
          return;
        }
      }
      
      const response = await fetch(`${url}/logs`);
      if (response.ok) {
        const data = await response.json();
        // Reverse the logs array so newest logs appear at the top
        setLogs((data.logs || []).reverse());
        
        // If we can fetch logs successfully, ESP32 is connected
        setEsp32Connected(true);
      } else {
        setEsp32Connected(false);
        setEsp32URL(""); // Clear URL if logs fetch failed
      }
    } catch (error) {
      console.log('Could not fetch logs:', error);
      setEsp32Connected(false);
      setEsp32URL(""); // Clear URL on error
    } finally {
      setLogsLoading(false);
    }
  };

  // Periodic connection health check with auto-recovery
  const checkConnectionHealth = async () => {
    if (!esp32URL) return;
    
    setIsHealthChecking(true);
    try {
      const response = await fetch(`${esp32URL}/face/status`, {
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });
      
      if (response.ok) {
        setEsp32Connected(true);
      } else {
        console.log('Health check failed - bad response, will attempt auto-reconnect');
        setEsp32Connected(false);
        setEsp32URL(""); // Clear URL if health check fails
        // Auto-attempt reconnection after a short delay
        setTimeout(() => {
          if (!esp32Connected && !isReconnecting) {
            handleReconnect();
          }
        }, 2000);
      }
    } catch (error) {
      console.log('Health check failed - network error, will attempt auto-reconnect:', error);
      setEsp32Connected(false);
      setEsp32URL(""); // Clear URL on health check failure
      // Auto-attempt reconnection after a short delay
      setTimeout(() => {
        if (!esp32Connected && !isReconnecting) {
          handleReconnect();
        }
      }, 2000);
    } finally {
      setIsHealthChecking(false);
    }
  };

  // Check face status and fetch logs when component mounts
  React.useEffect(() => {
    const initializeConnection = async () => {
      // Only try to discover if we don't have a URL already
      if (!esp32URL) {
        const url = await discoverESP32();
        if (url) {
          checkFaceStatus();
          fetchLogs();
        }
      } else {
        // If we already have a URL, just check status
        checkFaceStatus();
        fetchLogs();
      }
    };
    
    initializeConnection();
    
    // Set up two intervals:
    // 1. Fetch logs every 15 seconds when connected
    const logsInterval = setInterval(() => {
      if (esp32Connected && esp32URL) {
        fetchLogs();
      }
    }, 15000);
    
    // 2. Adaptive health check - less frequent when stable
    let healthCheckCount = 0;
    const healthInterval = setInterval(() => {
      if (esp32URL) {
        healthCheckCount++;
        // Check every 8s for first 5 times, then every 30s when stable
        const shouldCheck = healthCheckCount <= 5 || healthCheckCount % 4 === 0;
        if (shouldCheck) {
          checkConnectionHealth();
        }
      }
    }, 8000);
    
    return () => {
      clearInterval(logsInterval);
      clearInterval(healthInterval);
    };
  }, [esp32URL]); // Add esp32URL as dependency

  return (
    <TodoProvider>
      <SidebarProvider>
        <Sidebar>
          <CategorySidebar 
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            currentView={currentView}
            onViewChange={setCurrentView}
            activityStats={activityStats}
          />
        </Sidebar>
        <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">
                    Tabbie Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {currentPage === 'dashboard' ? 'Dashboard' :
                     currentPage === 'yourtabbie' ? 'Your Tabbie' :
                     currentPage === 'tasks' ? 'Tasks' :
                     currentPage === 'reminders' ? 'Reminders' :
                     currentPage === 'events' ? 'Events' :
                     currentPage === 'notifications' ? 'Notifications' :
                     currentPage === 'pomodoro' ? 'Pomodoro Timer' :
                     currentPage === 'calendar' ? 'Calendar' :
                     currentPage === 'activity' ? 'Activity' :
                     currentPage === 'timetracking' ? 'Time Tracking' :
                     currentPage === 'settings' ? 'Settings' : 'Dashboard'}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {currentPage === 'dashboard' ? (
            <DashboardPage 
              currentFace={currentFace}
              isLoading={isLoading}
              esp32Connected={esp32Connected}
              esp32URL={esp32URL}
              isScanning={isScanning}
              isReconnecting={isReconnecting}
              isHealthChecking={isHealthChecking}
              logs={logs}
              logsLoading={logsLoading}
              handleFaceChange={handleFaceChange}
              handleReconnect={handleReconnect}
              fetchLogs={fetchLogs}
              onNavigateToActivity={() => setCurrentPage('activity')}
              onNavigateToTabbie={() => setCurrentPage('yourtabbie')}
            />
          ) : currentPage === 'yourtabbie' ? (
            <YourTabbiePage 
              currentFace={currentFace}
              isLoading={isLoading}
              esp32Connected={esp32Connected}
              esp32URL={esp32URL}
              isScanning={isScanning}
              isReconnecting={isReconnecting}
              isHealthChecking={isHealthChecking}
              logs={logs}
              logsLoading={logsLoading}
              handleFaceChange={handleFaceChange}
              handleReconnect={handleReconnect}
              fetchLogs={fetchLogs}
            />
          ) : currentPage === 'tasks' ? (
            <TasksPage currentView={currentView} onViewChange={setCurrentView} onPageChange={setCurrentPage} />
          ) : currentPage === 'reminders' ? (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">🔔 Reminders</h2>
              <p className="text-muted-foreground">Set smart reminders and get notified by Tabbie!</p>
            </div>
          ) : currentPage === 'events' ? (
            <EventsPage />
          ) : currentPage === 'notifications' ? (
            <NotificationsPage />
          ) : currentPage === 'pomodoro' ? (
            <PomodoroPage />
          ) : currentPage === 'calendar' ? (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">📅 Calendar</h2>
              <p className="text-muted-foreground">View your schedule and plan your day with Tabbie</p>
            </div>
          ) : currentPage === 'activity' ? (
            <ActivityPage />
          ) : currentPage === 'timetracking' ? (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">📊 Time Tracking</h2>
              <p className="text-muted-foreground mb-4">Ask Tabbie to manage your day or how you spent it!</p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">"Hey Tabbie, how did I spend my time today?"</p>
                <p className="text-sm text-blue-800">"Tabbie, help me plan my day better"</p>
              </div>
            </div>
          ) : currentPage === 'settings' ? (
            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">⚙️ Settings</h2>
              <p className="text-muted-foreground">Settings and configuration coming soon!</p>
            </div>
          ) : (
            <>
              {/* Face Control Section */}
              <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border">
            <h2 className="text-lg font-semibold">🤖 Tabbie Face Control</h2>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Current Face:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                {currentFace === "default" ? "📝 Default Text" : 
                 currentFace === "focus" ? "🎯 Focus Mode" : currentFace}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => handleFaceChange("default")}
                disabled={isLoading}
                variant={currentFace === "default" ? "default" : "outline"}
                className="flex flex-col items-center gap-1 h-16"
              >
                <span className="text-lg">📝</span>
                <span className="text-xs">Default</span>
              </Button>
              <Button 
                onClick={() => handleFaceChange("focus")}
                disabled={isLoading}
                variant={currentFace === "focus" ? "default" : "outline"}
                className="flex flex-col items-center gap-1 h-16 bg-purple-100 hover:bg-purple-200 text-purple-800"
              >
                <span className="text-lg">🎯</span>
                <span className="text-xs">Focus</span>
              </Button>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${
                  esp32Connected 
                    ? (isHealthChecking ? 'bg-blue-500 animate-pulse' : 'bg-green-500')
                    : (isScanning || isReconnecting)
                      ? 'bg-yellow-500 animate-pulse' 
                      : 'bg-red-500'
                }`} />
                <span className="text-sm text-muted-foreground">
                  Status: {
                    esp32Connected 
                      ? (isHealthChecking ? 'Checking...' : 'Connected')
                      : isReconnecting
                        ? 'Reconnecting...'
                        : isScanning 
                          ? 'Scanning...' 
                          : 'Disconnected'
                  }
                </span>
              </div>
              {!esp32Connected && !isScanning && !isReconnecting && (
                <Button 
                  onClick={handleReconnect}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  🔄 Reconnect
                </Button>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              ESP32: {esp32URL || 
                (isReconnecting ? "Attempting to reconnect..." : 
                 isScanning ? "Scanning network..." : 
                 "Not found - click Reconnect to retry")}
            </div>
          </div>
          
          {/* Main Dashboard Grid */}
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <div className="aspect-video rounded-xl bg-card border flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Tabbie Serial Monitor</span>
                </div>
                <Button 
                  onClick={fetchLogs} 
                  disabled={logsLoading}
                  variant="ghost" 
                  size="sm"
                  className="h-7 px-2 text-xs"
                >
                  {logsLoading ? "..." : "↻"}
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-3 rounded-b-xl">
                {logs.length > 0 ? (
                  logs.map((log, index) => (
                    <div key={index} className="text-xs font-mono mb-1 leading-relaxed">
                      <span className="text-slate-400 mr-2">›</span>
                      <span className={
                        log.includes("WiFi Connected Successfully") || log.includes("Web server started") 
                          ? "text-green-400" 
                          : log.includes("Happy face") || log.includes("Default animation")
                          ? "text-blue-400"
                          : log.includes("Sad face")
                          ? "text-orange-400"
                          : log.includes("Focus face")
                          ? "text-purple-400"
                          : log.includes("Failed") || log.includes("Error") || log.includes("❌")
                          ? "text-red-400"
                          : log.includes("✅")
                          ? "text-green-400"
                          : "text-slate-300"
                      }>
                        {log}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-xs font-mono flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="mb-2">📡</div>
                      <div>Waiting for ESP32 logs...</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
              <span className="text-muted-foreground">Voice Commands</span>
            </div>
            <div className="aspect-video rounded-xl bg-muted/50 flex items-center justify-center">
              <span className="text-muted-foreground">Future Content</span>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min p-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">🛠️ Welcome to Tabbie Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                  Your little local desk assistant — a cute robot that watches, listens, speaks, and helps.
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-card rounded-lg border">
                  <h3 className="font-semibold mb-2">🗣️ Voice & Expressions</h3>
                  <p className="text-sm text-muted-foreground">
                    Talk to Tabbie with voice commands and watch facial expressions
                  </p>
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <h3 className="font-semibold mb-2">✅ Task Management</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your to-do list, add tasks, and check them off
                  </p>
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <h3 className="font-semibold mb-2">⏲️ Pomodoro Timer</h3>
                  <p className="text-sm text-muted-foreground">
                    Start focused work sessions: "Start pomodoro for [Task]"
                  </p>
                </div>
                
                <div className="p-4 bg-card rounded-lg border">
                  <h3 className="font-semibold mb-2">🔔 Smart Reminders</h3>
                  <p className="text-sm text-muted-foreground">
                    Set custom reminders: "Drink water every 30 mins"
                  </p>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </SidebarInset>

      {/* Setup Wizard Modal */}
      {showSetupWizard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {esp32Connected ? 'ESP32 Status' : 'ESP32 Setup Wizard'}
              </h2>
              <Button 
                onClick={() => setShowSetupWizard(false)}
                variant="ghost"
                size="sm"
              >
                ✕
              </Button>
            </div>
            <SetupWizard 
              onComplete={handleSetupComplete}
              currentESP32URL={esp32URL}
              isConnected={esp32Connected}
            />
          </div>
        </div>
      )}
      </SidebarProvider>
    </TodoProvider>
  )
}
