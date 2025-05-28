import { AppSidebar } from "@/components/app-sidebar"
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
} from "@/components/ui/sidebar"
import React from "react"

export default function Page() {
  const [ledState, setLedState] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [logs, setLogs] = React.useState<string[]>([]);
  const [logsLoading, setLogsLoading] = React.useState(false);
  const [esp32Connected, setEsp32Connected] = React.useState(false);
  const [esp32URL, setEsp32URL] = React.useState<string>("");

  // Auto-discovery with IP scanning (no mDNS complexity)
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

    // Smart IP scanning - check most common ESP32 locations
    const commonIPs = [
      "192.168.2.79",   // Your current ESP32 IP
      "192.168.1.79", "192.168.0.79",    // Common ESP32 IPs
      "192.168.1.100", "192.168.2.100", "192.168.0.100",  // DHCP pool starts
      "192.168.1.50", "192.168.2.50", "192.168.0.50"      // Mid-range IPs
    ];

    console.log("🔍 Scanning for ESP32 on local network...");
    for (const ip of commonIPs) {
      try {
        console.log(`Trying IP: ${ip}`);
        const response = await fetch(`http://${ip}/led/status`, { 
          signal: AbortSignal.timeout(2000) 
        });
        if (response.ok) {
          console.log(`✅ Found ESP32 at: ${ip}`);
          const foundURL = `http://${ip}`;
          setEsp32URL(foundURL);
          return foundURL;
        }
      } catch (error) {
        console.log(`❌ ${ip} - ${error instanceof Error ? error.message : 'Connection failed'}`);
      }
    }

    console.log("❌ ESP32 not found. Please check connection.");
    return null;
  };

  const handleLEDToggle = async () => {
    setIsLoading(true);
    try {
      // Ensure we have a valid URL
      const url = await discoverESP32();
      if (!url) {
        alert('ESP32 not found. Please check if it\'s powered on and connected to WiFi.');
        return;
      }

      const newState = !ledState;
      const endpoint = newState ? 'on' : 'off';
      
      const response = await fetch(`${url}/led/${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLedState(newState);
        console.log(`LED ${newState ? 'ON' : 'OFF'} - Response:`, data);
        // Refresh logs after LED action
        fetchLogs();
      } else {
        console.error('Failed to control LED:', response.statusText);
        alert('Failed to control LED. Make sure ESP32 is connected.');
      }
    } catch (error) {
      console.error('Error controlling LED:', error);
      alert('Error connecting to ESP32. Check if it\'s powered on and connected to WiFi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check LED status on component mount
  const checkLEDStatus = async () => {
    try {
      const url = await discoverESP32();
      if (!url) return;
      
      const response = await fetch(`${url}/led/status`);
      if (response.ok) {
        const data = await response.json();
        setLedState(data.state);
        console.log('LED Status:', data);
      }
    } catch (error) {
      console.log('Could not fetch LED status:', error);
    }
  };

  // Function to fetch logs from ESP32
  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      const url = await discoverESP32();
      if (!url) {
        setEsp32Connected(false);
        return;
      }
      
      const response = await fetch(`${url}/logs`);
      if (response.ok) {
        const data = await response.json();
        // Reverse the logs array so newest logs appear at the top
        setLogs((data.logs || []).reverse());
        
        // Check if ESP32 is connected based on logs
        const hasWifiConnection = data.logs?.some((log: string) => 
          log.includes("Connected to WiFi!") || log.includes("Web server started!")
        );
        setEsp32Connected(hasWifiConnection);
      } else {
        setEsp32Connected(false);
      }
    } catch (error) {
      console.log('Could not fetch logs:', error);
      setEsp32Connected(false);
    } finally {
      setLogsLoading(false);
    }
  };

  // Check LED status and fetch logs when component mounts
  React.useEffect(() => {
    const initializeConnection = async () => {
      await discoverESP32();
      checkLEDStatus();
      fetchLogs();
    };
    
    initializeConnection();
    
    // Set up interval to refresh logs every 3 seconds
    const interval = setInterval(fetchLogs, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
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
                  <BreadcrumbPage>Control Panel</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* LED Control Section */}
          <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border">
            <h2 className="text-lg font-semibold">LED Control</h2>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleLEDToggle}
                disabled={isLoading}
                variant={ledState ? "default" : "outline"}
                className={ledState ? "bg-green-600 hover:bg-green-700" : ""}
              >
                {isLoading ? "..." : `LED ${ledState ? 'ON' : 'OFF'}`}
              </Button>
              <Button 
                onClick={async () => {
                  console.log("🔄 Manual reconnection triggered...");
                  setEsp32URL(""); // Clear current URL
                  await discoverESP32();
                  checkLEDStatus();
                  fetchLogs();
                }}
                variant="outline"
                size="sm"
              >
                🔄 Reconnect
              </Button>
              <div className={`w-4 h-4 rounded-full ${esp32Connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                Status: {esp32Connected ? 'Connected' : 'Disconnected'}
              </span>
              <span className="text-xs text-muted-foreground">
                ESP32: {esp32URL || "Discovering..."}
              </span>
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
                        log.includes("Connected to WiFi") || log.includes("Web server started") 
                          ? "text-green-400" 
                          : log.includes("LED ON") 
                          ? "text-blue-400"
                          : log.includes("LED OFF")
                          ? "text-orange-400"
                          : log.includes("Failed") || log.includes("Error")
                          ? "text-red-400"
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
              <span className="text-muted-foreground">Facial Expressions</span>
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
