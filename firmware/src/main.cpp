#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Preferences.h>
#include <ESPmDNS.h>
#include <DNSServer.h>

// OLED display configuration
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET     -1
#define SCREEN_ADDRESS 0x3C

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Web server on port 80
WebServer server(80);

// DNS server for captive portal
DNSServer dnsServer;

// WiFi credentials storage
Preferences preferences;

// Current state
String currentAnimation = "idle";
String currentTask = "";
unsigned long animationStartTime = 0;
bool isInSetupMode = false;
String wifiStatus = "disconnected";
String lastError = "";

// Setup mode configuration
const char* SETUP_SSID = "Tabbie-Setup";
const char* MDNS_NAME = "tabbie";

// Function declarations
void setupDisplay();
void setupWiFiMode();
bool connectToWiFi(String ssid, String password);
void startSetupMode();
void startNormalMode();
void setupWebServer();
void setupMDNS();
void handleRoot();
void handleSetupPage();
void handleWiFiConfig();
void handleStatus();
void handleAnimation();
void handleWiFiSettings();
void handleCORS();
void updateDisplay();
void drawSetupMode();
void drawConnecting();
void drawConnected();
void drawError();
void drawIdleAnimation();
void drawPomodoroAnimation();
void drawTaskCompleteAnimation();

void setup() {
  Serial.begin(115200);
  Serial.println("🤖 Tabbie Assistant Starting...");
  
  // Initialize components
  setupDisplay();
  
  // Initialize preferences
  preferences.begin("tabbie", false);
  
  // Determine WiFi mode
  setupWiFiMode();
  
  // Setup web server
  setupWebServer();
  
  Serial.println("✅ Tabbie ready!");
}

void setupDisplay() {
  Wire.begin(21, 22);
  
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("❌ SSD1306 allocation failed"));
    for(;;);
  }
  
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("Tabbie Starting..."));
  display.display();
  
  Serial.println("✅ OLED Display initialized");
}

void setupWiFiMode() {
  Serial.println("🔍 DEBUG: Starting setupWiFiMode()");
  
  // Check for forced setup mode
  #ifdef FORCE_SETUP_MODE
  Serial.print("🔍 DEBUG: FORCE_SETUP_MODE defined as: ");
  Serial.println(FORCE_SETUP_MODE);
  if (FORCE_SETUP_MODE == 1) {
    Serial.println("🔧 Forced setup mode enabled");
    startSetupMode();
    return;
  }
  #else
  Serial.println("🔍 DEBUG: FORCE_SETUP_MODE not defined");
  #endif
  
  // Try preset credentials from wifi.env first
  String wifiSSID = "";
  String wifiPassword = "";
  
  #ifdef PRESET_WIFI_SSID
  wifiSSID = String(PRESET_WIFI_SSID);
  Serial.print("🔍 DEBUG: PRESET_WIFI_SSID = ");
  Serial.println(wifiSSID);
  #else
  Serial.println("🔍 DEBUG: PRESET_WIFI_SSID not defined");
  #endif
  
  #ifdef PRESET_WIFI_PASSWORD
  wifiPassword = String(PRESET_WIFI_PASSWORD);
  Serial.print("🔍 DEBUG: PRESET_WIFI_PASSWORD = ");
  Serial.println("***hidden***");
  #else
  Serial.println("🔍 DEBUG: PRESET_WIFI_PASSWORD not defined");
  #endif
  
  // If no preset credentials, check saved preferences
  if (wifiSSID.length() == 0 || wifiPassword.length() == 0) {
    Serial.println("🔍 DEBUG: No preset credentials, checking preferences");
    wifiSSID = preferences.getString("wifi_ssid", "");
    wifiPassword = preferences.getString("wifi_password", "");
    Serial.print("🔍 DEBUG: Saved SSID from preferences: ");
    Serial.println(wifiSSID);
    Serial.println("📡 Using saved WiFi credentials from preferences");
  } else {
    Serial.println("📡 Using preset WiFi credentials from wifi.env");
    Serial.println("🔍 DEBUG: Saving preset credentials to preferences");
    // Save preset credentials to preferences for future use
    preferences.putString("wifi_ssid", wifiSSID);
    preferences.putString("wifi_password", wifiPassword);
    Serial.println("🔍 DEBUG: Credentials saved to preferences successfully");
  }
  
  Serial.print("🔍 DEBUG: Final SSID length: ");
  Serial.println(wifiSSID.length());
  Serial.print("🔍 DEBUG: Final password length: ");
  Serial.println(wifiPassword.length());
  
  if (wifiSSID.length() > 0 && wifiPassword.length() > 0) {
    Serial.print("📡 Attempting connection to: ");
    Serial.println(wifiSSID);
    wifiStatus = "connecting";
    updateDisplay();
    
    bool connectionResult = connectToWiFi(wifiSSID, wifiPassword);
    Serial.print("🔍 DEBUG: connectToWiFi returned: ");
    Serial.println(connectionResult ? "true" : "false");
    
    if (connectionResult) {
      Serial.println("🔍 DEBUG: Connection successful, starting normal mode");
      startNormalMode();
    } else {
      Serial.println("❌ Failed to connect to WiFi, starting setup mode");
      lastError = "wifi.env connection failed: " + wifiSSID;
      startSetupMode();
    }
  } else {
    Serial.println("🔧 No WiFi credentials found, starting setup mode");
    startSetupMode();
  }
  
  Serial.println("🔍 DEBUG: setupWiFiMode() completed");
}

bool connectToWiFi(String ssid, String password) {
  Serial.println("🔍 DEBUG: Starting connectToWiFi()");
  Serial.print("🔍 DEBUG: Current WiFi status before mode change: ");
  Serial.println(WiFi.status());
  
  WiFi.mode(WIFI_STA);
  Serial.println("🔍 DEBUG: WiFi mode set to STA");
  
  WiFi.begin(ssid.c_str(), password.c_str());
  Serial.print("🔍 DEBUG: WiFi.begin() called with SSID: ");
  Serial.println(ssid);
  
  Serial.print("🔗 Connecting to ");
  Serial.print(ssid);
  Serial.print("...");
  
  // Wait up to 20 seconds for connection
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
    
    // Show status every 5 attempts
    if (attempts % 5 == 0) {
      Serial.print(" [Status: ");
      Serial.print(WiFi.status());
      Serial.print("] ");
    }
    
    // Update display every few attempts
    if (attempts % 4 == 0) {
      updateDisplay();
    }
  }
  
  Serial.println();
  Serial.print("🔍 DEBUG: Final WiFi status: ");
  Serial.println(WiFi.status());
  Serial.print("🔍 DEBUG: Total connection attempts: ");
  Serial.println(attempts);
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("✅ Connected to WiFi! IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("🔍 DEBUG: RSSI: ");
    Serial.println(WiFi.RSSI());
    wifiStatus = "connected";
    lastError = "";
    return true;
  } else {
    Serial.print("❌ Failed to connect to WiFi: ");
    Serial.println(ssid);
    Serial.print("🔍 DEBUG: WiFi status codes: WL_CONNECTED=");
    Serial.print(WL_CONNECTED);
    Serial.print(", current=");
    Serial.println(WiFi.status());
    wifiStatus = "failed";
    lastError = "Could not connect to " + ssid;
    return false;
  }
}

void startSetupMode() {
  Serial.println("🔍 DEBUG: Starting startSetupMode()");
  isInSetupMode = true;
  wifiStatus = "setup";
  
  Serial.println("🔧 Starting setup mode...");
  
  // Start in AP mode for setup
  WiFi.mode(WIFI_AP);
  Serial.println("🔍 DEBUG: WiFi mode set to AP");
  
  bool apResult = WiFi.softAP(SETUP_SSID);
  Serial.print("🔍 DEBUG: WiFi.softAP() result: ");
  Serial.println(apResult ? "success" : "failed");
  
  // Start DNS server for captive portal
  dnsServer.start(53, "*", WiFi.softAPIP());
  Serial.println("🔍 DEBUG: DNS server started");
  
  Serial.print("📶 Setup WiFi started - SSID: ");
  Serial.println(SETUP_SSID);
  Serial.print("🌐 Setup IP: ");
  Serial.println(WiFi.softAPIP());
  
  updateDisplay();
  Serial.println("🔍 DEBUG: startSetupMode() completed");
}

void startNormalMode() {
  Serial.println("🔍 DEBUG: Starting startNormalMode()");
  isInSetupMode = false;
  wifiStatus = "connected";
  
  Serial.print("🔍 DEBUG: WiFi status in normal mode: ");
  Serial.println(WiFi.status());
  Serial.print("🔍 DEBUG: IP address: ");
  Serial.println(WiFi.localIP());
  
  // Setup mDNS
  setupMDNS();
  
  Serial.println("✅ Normal mode started");
  updateDisplay();
  Serial.println("🔍 DEBUG: startNormalMode() completed");
}

void setupMDNS() {
  if (MDNS.begin(MDNS_NAME)) {
    MDNS.addService("http", "tcp", 80);
    Serial.print("✅ mDNS started: ");
    Serial.print(MDNS_NAME);
    Serial.println(".local");
  } else {
    Serial.println("❌ mDNS setup failed");
  }
}

void setupWebServer() {
  // Handle captive portal redirect
  server.onNotFound([]() {
    if (isInSetupMode && server.method() == HTTP_GET) {
      handleSetupPage();
    } else if (server.method() == HTTP_OPTIONS) {
      handleCORS();
    } else {
      server.send(404, "text/plain", "Not found");
    }
  });
  
  // Setup mode endpoints
  server.on("/", HTTP_GET, []() {
    if (isInSetupMode) {
      handleSetupPage();
    } else {
      handleRoot();
    }
  });
  server.on("/setup", HTTP_GET, handleSetupPage);
  server.on("/configure", HTTP_POST, handleWiFiConfig);
  
  // Normal mode endpoints
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/status", HTTP_OPTIONS, handleCORS);
  server.on("/api/animation", HTTP_POST, handleAnimation);
  server.on("/api/animation", HTTP_OPTIONS, handleCORS);
  server.on("/wifi", HTTP_GET, handleWiFiSettings);
  server.on("/wifi", HTTP_POST, handleWiFiConfig);
  
  server.begin();
  Serial.println("✅ Web server started");
}

void loop() {
  // Handle DNS server in setup mode
  if (isInSetupMode) {
    dnsServer.processNextRequest();
  }
  
  // Handle web server requests
  server.handleClient();
  
  // Update display animation
  updateDisplay();
  
  // Check WiFi connection in normal mode
  if (!isInSetupMode && WiFi.status() != WL_CONNECTED) {
    static unsigned long lastReconnectAttempt = 0;
    static bool disconnectReported = false;
    
    if (!disconnectReported) {
      Serial.print("🔍 DEBUG: WiFi disconnected in normal mode! Status: ");
      Serial.println(WiFi.status());
      disconnectReported = true;
    }
    
    if (millis() - lastReconnectAttempt > 30000) { // Try reconnect every 30 seconds
      Serial.println("📡 WiFi disconnected, attempting reconnect...");
      wifiStatus = "reconnecting";
      String savedSSID = preferences.getString("wifi_ssid", "");
      String savedPassword = preferences.getString("wifi_password", "");
      Serial.print("🔍 DEBUG: Reconnecting with saved SSID: ");
      Serial.println(savedSSID);
      
      if (!connectToWiFi(savedSSID, savedPassword)) {
        Serial.println("❌ Reconnection failed, switching to setup mode");
        startSetupMode();
      } else {
        Serial.println("🔍 DEBUG: Reconnection successful, restarting normal mode");
        startNormalMode();
        disconnectReported = false;
      }
      lastReconnectAttempt = millis();
    }
  }
  
  delay(50);
}

void handleCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(200, "text/plain", "");
}

void handleRoot() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String html = "<!DOCTYPE html><html><head><title>Tabbie Assistant</title>";
  html += "<style>body{font-family:Arial,sans-serif;max-width:600px;margin:50px auto;padding:20px;}";
  html += ".status{background:#e8f5e8;padding:15px;border-radius:8px;margin:20px 0;}";
  html += ".button{background:#007bff;color:white;padding:10px 20px;border:none;border-radius:5px;margin:5px;cursor:pointer;}";
  html += ".button:hover{background:#0056b3;}</style></head><body>";
  html += "<h1>Tabbie Assistant</h1>";
  html += "<div class='status'><h3>Status: Connected!</h3>";
  html += "<p>Current Animation: <span id='current-animation'>Loading...</span></p>";
  html += "<p>WiFi: " + WiFi.SSID() + "</p>";
  html += "<p>IP: " + WiFi.localIP().toString() + "</p></div>";
  html += "<h3>Test Animations:</h3>";
  html += "<button class='button' onclick=\"sendAnimation('idle')\">Idle</button>";
  html += "<button class='button' onclick=\"sendAnimation('pomodoro','Focus Session')\">Pomodoro</button>";
  html += "<button class='button' onclick=\"sendAnimation('complete','Task Done!')\">Complete</button>";
  html += "<h3>Settings:</h3>";
  html += "<button class='button' onclick=\"window.location='/wifi'\">WiFi Settings</button>";
  html += "<script>";
  html += "async function sendAnimation(type,task=''){";
  html += "try{const response=await fetch('/api/animation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({animation:type,task:task})});";
  html += "if(response.ok){updateStatus();}}catch(e){console.error('Failed to send animation:',e);}}";
  html += "async function updateStatus(){try{const response=await fetch('/api/status');const data=await response.json();";
  html += "document.getElementById('current-animation').textContent=data.animation;}catch(e){console.error('Failed to get status:',e);}}";
  html += "setInterval(updateStatus,2000);updateStatus();";
  html += "</script></body></html>";
  
  server.send(200, "text/html", html);
}

void handleSetupPage() {
  String html = "<!DOCTYPE html><html><head><title>Tabbie Setup</title>";
  html += "<meta name='viewport' content='width=device-width,initial-scale=1'>";
  html += "<style>body{font-family:Arial,sans-serif;max-width:400px;margin:50px auto;padding:20px;background:#f5f5f5;}";
  html += ".container{background:white;padding:30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}";
  html += "h1{text-align:center;color:#333;margin-bottom:30px;}";
  html += "input,select{width:100%;padding:12px;margin:10px 0;border:1px solid #ddd;border-radius:5px;font-size:16px;}";
  html += "button{width:100%;background:#007bff;color:white;padding:15px;border:none;border-radius:5px;font-size:16px;cursor:pointer;}";
  html += "button:hover{background:#0056b3;}";
  html += ".error{color:#dc3545;margin:10px 0;padding:10px;background:#f8d7da;border-radius:5px;}";
  html += "</style></head><body><div class='container'>";
  html += "<h1>Tabbie Setup</h1>";
  
  if (lastError.length() > 0) {
    html += "<div class='error'>Error: " + lastError + "</div>";
  }
  
  html += "<form action='/configure' method='POST'>";
  html += "<label>WiFi Network:</label>";
  html += "<select name='ssid' required>";
  
  // Scan for networks
  int networks = WiFi.scanNetworks();
  for (int i = 0; i < networks; i++) {
    html += "<option value='" + WiFi.SSID(i) + "'>" + WiFi.SSID(i) + "</option>";
  }
  
  html += "</select>";
  html += "<label>Password:</label>";
  html += "<input type='password' name='password' placeholder='WiFi Password' required>";
  html += "<button type='submit'>Connect Tabbie</button>";
  html += "</form>";
  html += "<p style='text-align:center;margin-top:20px;font-size:12px;color:#666;'>";
  html += "Tabbie will connect to your WiFi and restart.</p>";
  html += "</div></body></html>";
  
  server.send(200, "text/html", html);
}

void handleWiFiConfig() {
  String ssid = server.arg("ssid");
  String password = server.arg("password");
  
  if (ssid.length() == 0) {
    lastError = "No WiFi network selected";
    handleSetupPage(); // Show setup page with error
    return;
  }
  
  // Save credentials
  preferences.putString("wifi_ssid", ssid);
  preferences.putString("wifi_password", password);
  Serial.print("💾 Saved WiFi credentials: ");
  Serial.println(ssid);
  
  // Test connection immediately
  Serial.println("🔍 Testing WiFi connection...");
  if (connectToWiFi(ssid, password)) {
    Serial.println("✅ WiFi configured successfully!");
    
    // Show success page (only success gets a redirect)
    String html = "<!DOCTYPE html><html><head><title>Connected!</title>";
    html += "<meta http-equiv='refresh' content='3;url=/'>";
    html += "<style>body{font-family:Arial,sans-serif;text-align:center;margin:50px auto;max-width:400px;}";
    html += ".success{background:#d4edda;color:#155724;padding:20px;border-radius:8px;margin:20px 0;}";
    html += "</style></head><body>";
    html += "<h1>Success!</h1>";
    html += "<div class='success'>";
    html += "<p>Tabbie connected to " + ssid + " successfully!</p>";
    html += "<p>You can now close this page and use your dashboard.</p>";
    html += "</div>";
    html += "<p>This page will redirect automatically...</p>";
    html += "</body></html>";
    
    server.send(200, "text/html", html);
    
    // Switch to normal mode
    isInSetupMode = false;
    startNormalMode();
  } else {
    Serial.println("❌ WiFi configuration failed");
    lastError = "Failed to connect to " + ssid + ". Please check the password and try again.";
    wifiStatus = "setup";
    
    // Show setup page with error (NO redirect)
    handleSetupPage();
  }
}

void handleWiFiSettings() {
  if (isInSetupMode) {
    handleSetupPage();
    return;
  }
  
  String html = "<!DOCTYPE html><html><head><title>Tabbie WiFi Settings</title>";
  html += "<style>body{font-family:Arial,sans-serif;max-width:600px;margin:50px auto;padding:20px;}";
  html += "button{background:#007bff;color:white;padding:10px 20px;border:none;border-radius:5px;margin:5px;cursor:pointer;}";
  html += "button.danger{background:#dc3545;}button:hover{opacity:0.9;}</style></head><body>";
  html += "<h1>Tabbie WiFi Settings</h1>";
  html += "<p><strong>Current Network:</strong> " + WiFi.SSID() + "</p>";
  html += "<p><strong>IP Address:</strong> " + WiFi.localIP().toString() + "</p>";
  html += "<p><strong>Signal Strength:</strong> " + String(WiFi.RSSI()) + " dBm</p>";
  html += "<h3>Actions:</h3>";
  html += "<button onclick=\"if(confirm('Reconfigure WiFi? Tabbie will restart in setup mode.'))window.location='/wifi?action=reset'\">Change WiFi Network</button>";
  html += "<button onclick=\"window.location='/'\">Back to Dashboard</button>";
  html += "</body></html>";
  
  if (server.arg("action") == "reset") {
    // Clear saved credentials and restart in setup mode
    preferences.remove("wifi_ssid");
    preferences.remove("wifi_password");
    
    html = "<!DOCTYPE html><html><head><title>WiFi Reset</title>";
    html += "<meta http-equiv='refresh' content='3;url=/'>";
    html += "</head><body style='font-family:Arial,sans-serif;text-align:center;margin:50px;'>";
    html += "<h1>WiFi Settings Reset</h1>";
    html += "<p>Tabbie is restarting in setup mode...</p>";
    html += "<p>Connect to \"Tabbie-Setup\" to reconfigure.</p></body></html>";
    
    server.send(200, "text/html", html);
    delay(1000);
    ESP.restart();
  }
  
  server.send(200, "text/html", html);
}

void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Content-Type", "application/json");
  
  JsonDocument doc;
  doc["status"] = wifiStatus;
  doc["animation"] = currentAnimation;
  doc["task"] = currentTask;
  doc["uptime"] = millis();
  doc["setupMode"] = isInSetupMode;
  
  if (!isInSetupMode && WiFi.status() == WL_CONNECTED) {
    doc["ip"] = WiFi.localIP().toString();
    doc["ssid"] = WiFi.SSID();
    doc["rssi"] = WiFi.RSSI();
  } else if (isInSetupMode) {
    doc["ip"] = WiFi.softAPIP().toString();
    doc["connectedDevices"] = WiFi.softAPgetStationNum();
  }
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void handleAnimation() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Content-Type", "application/json");
  
  if (server.hasArg("plain")) {
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, server.arg("plain"));
    
    if (error) {
      server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
      return;
    }
    
    String newAnimation = doc["animation"];
    String newTask = doc["task"];
    
    if (newAnimation.length() > 0) {
      currentAnimation = newAnimation;
      currentTask = newTask;
      animationStartTime = millis();
      
      Serial.print("🎬 Animation: ");
      Serial.print(currentAnimation);
      if (newTask.length() > 0) {
        Serial.print(" (");
        Serial.print(newTask);
        Serial.print(")");
      }
      Serial.println();
      
      JsonDocument response;
      response["success"] = true;
      response["animation"] = currentAnimation;
      response["task"] = currentTask;
      
      String responseStr;
      serializeJson(response, responseStr);
      server.send(200, "application/json", responseStr);
    } else {
      server.send(400, "application/json", "{\"error\":\"Animation type required\"}");
    }
  } else {
    server.send(400, "application/json", "{\"error\":\"No data received\"}");
  }
}

void updateDisplay() {
  static unsigned long lastUpdate = 0;
  
  if (millis() - lastUpdate < 200) {
    return;
  }
  lastUpdate = millis();
  
  if (isInSetupMode) {
    drawSetupMode();
  } else if (wifiStatus == "connecting" || wifiStatus == "reconnecting") {
    drawConnecting();
  } else if (wifiStatus == "connected") {
    if (currentAnimation == "idle") {
      drawIdleAnimation();
    } else if (currentAnimation == "pomodoro") {
      drawPomodoroAnimation();
    } else if (currentAnimation == "complete") {
      drawTaskCompleteAnimation();
    }
  } else {
    drawError();
  }
}

void drawSetupMode() {
  static int frame = 0;
  frame++;
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  
  if (lastError.length() > 0) {
    display.println(F("WiFi Error!"));
    display.println();
  } else {
    display.println(F("WiFi Setup"));
    display.println();
  }
  
  display.println(F("1. Connect to WiFi:"));
  display.println(F("   Tabbie-Setup"));
  display.println();
  display.println(F("2. Visit:"));
  display.println(F("   192.168.4.1"));
  
  // Blinking indicator
  if ((frame / 10) % 2 == 0) {
    display.drawPixel(125, 2, SSD1306_WHITE);
    display.drawPixel(126, 2, SSD1306_WHITE);
    display.drawPixel(127, 2, SSD1306_WHITE);
  }
  
  display.display();
}

void drawConnecting() {
  static int frame = 0;
  frame++;
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("Connecting..."));
  display.println();
  
  String savedSSID = preferences.getString("wifi_ssid", "");
  if (savedSSID.length() > 15) {
    savedSSID = savedSSID.substring(0, 12) + "...";
  }
  display.println(savedSSID);
  
  // Animated dots
  display.setCursor(0, 35);
  for (int i = 0; i < (frame / 5) % 4; i++) {
    display.print(".");
  }
  
  display.display();
}

void drawConnected() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("Connected!"));
  display.println();
  display.println(WiFi.SSID());
  display.println();
  display.println(WiFi.localIP());
  display.display();
}

void drawError() {
  static int frame = 0;
  frame++;
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("WiFi Error!"));
  display.println();
  
  if (lastError.length() > 0) {
    String error = lastError;
    if (error.length() > 42) {
      error = error.substring(0, 39) + "...";
    }
    display.println(error);
  } else {
    display.println(F("Check WiFi config"));
  }
  
  display.println();
  display.println(F("Restarting..."));
  
  // Blinking error indicator
  if ((frame / 8) % 2 == 0) {
    display.fillCircle(5, 5, 2, SSD1306_WHITE);
  }
  
  display.display();
}

void drawIdleAnimation() {
  static int frame = 0;
  frame++;
  
  display.clearDisplay();
  
  // Tabbie face
  display.setTextSize(2);
  display.setCursor(45, 10);
  display.println(F("(-.-)"));
  
  // Status
  display.setTextSize(1);
  display.setCursor(25, 35);
  display.println(F("Ready"));
  
  // Network info
  display.setCursor(0, 50);
  String ssid = WiFi.SSID();
  if (ssid.length() > 15) {
    ssid = ssid.substring(0, 12) + "...";
  }
  display.println(ssid);
  
  // Breathing animation
  if ((frame / 20) % 2 == 0) {
    display.drawPixel(64, 55, SSD1306_WHITE);
  }
  
  display.display();
}

void drawPomodoroAnimation() {
  static int frame = 0;
  frame++;
  
  display.clearDisplay();
  
  // Focused face
  display.setTextSize(2);
  display.setCursor(45, 5);
  display.println(F("(>.<)"));
  
  // Task name
  display.setTextSize(1);
  display.setCursor(0, 25);
  String taskDisplay = currentTask;
  if (taskDisplay.length() > 21) {
    taskDisplay = taskDisplay.substring(0, 18) + "...";
  }
  display.println(taskDisplay);
  
  // Focus indicator
  display.setCursor(30, 40);
  display.println(F("FOCUS!"));
  
  display.setCursor(85, 40);
  if ((frame / 10) % 2 == 0) {
    display.println(F("[*]"));
  } else {
    display.println(F("[!]"));
  }
  
  // Progress bar
  int progress = (frame * 2) % 128;
  display.drawRect(0, 55, 128, 8, SSD1306_WHITE);
  display.fillRect(1, 56, progress, 6, SSD1306_WHITE);
  
  display.display();
}

void drawTaskCompleteAnimation() {
  static int frame = 0;
  frame++;
  
  display.clearDisplay();
  
  // Happy face
  display.setTextSize(2);
  display.setCursor(45, 5);
  display.println(F("(^.^)"));
  
  // Celebration
  display.setTextSize(1);
  display.setCursor(20, 30);
  display.println(F("Great job!"));
  
  // Task completed
  display.setCursor(0, 45);
  String taskDisplay = currentTask;
  if (taskDisplay.length() > 21) {
    taskDisplay = taskDisplay.substring(0, 18) + "...";
  }
  display.println(taskDisplay);
  
  // Sparkle animation
  if (frame % 20 < 10) {
    display.drawPixel(20, 15, SSD1306_WHITE);
    display.drawPixel(100, 20, SSD1306_WHITE);
    display.drawPixel(15, 50, SSD1306_WHITE);
    display.drawPixel(110, 45, SSD1306_WHITE);
  }
  
  display.display();
  
  // Auto return to idle after 5 seconds
  if (millis() - animationStartTime > 5000) {
    currentAnimation = "idle";
    currentTask = "";
  }
}