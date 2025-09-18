#include <Wire.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// OLED display width and height, in pixels
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

// Declaration for an SSD1306 display connected to I2C (SDA, SCL pins)
#define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C // See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// WiFi AP Configuration
const char* ap_ssid = "Tabbie-Assistant";
const char* ap_password = "tabbie123";

// Web server on port 80
WebServer server(80);

// Current animation state
String currentAnimation = "idle";
String currentTask = "";
unsigned long animationStartTime = 0;

// Function declarations
void setupDisplay();
void setupWiFiAP();
void setupWebServer();
void handleRoot();
void handleStatus();
void handleAnimation();
void handleCORS();
void updateDisplay();
void drawIdleAnimation();
void drawPomodoroAnimation();
void drawTaskCompleteAnimation();

void setup() {
  Serial.begin(115200);
  Serial.println("🤖 Tabbie Assistant Starting...");
  
  // Initialize display
  setupDisplay();
  
  // Setup WiFi Access Point
  setupWiFiAP();
  
  // Setup web server with API endpoints
  setupWebServer();
  
  Serial.println("✅ Tabbie ready for connections!");
}

void setupDisplay() {
  // Initialize I2C communication
  Wire.begin(21, 22);
  
  // Initialize OLED display
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("❌ SSD1306 allocation failed"));
    for(;;);
  }
  
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  
  // Show startup message
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("Tabbie Starting..."));
  display.display();
  
  Serial.println("✅ OLED Display initialized");
}

void setupWiFiAP() {
  // Set WiFi to AP mode
  WiFi.mode(WIFI_AP);
  
  // Configure AP with fixed IP
  IPAddress local_IP(192, 168, 4, 1);
  IPAddress gateway(192, 168, 4, 1);
  IPAddress subnet(255, 255, 255, 0);
  
  WiFi.softAPConfig(local_IP, gateway, subnet);
  WiFi.softAP(ap_ssid, ap_password);
  
  Serial.println("✅ WiFi Access Point started");
  Serial.print("📶 SSID: ");
  Serial.println(ap_ssid);
  Serial.print("🔒 Password: ");
  Serial.println(ap_password);
  Serial.print("🌐 IP Address: ");
  Serial.println(WiFi.softAPIP());
  
  // Update display with connection info
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("Tabbie Ready!"));
  display.println();
  display.println(F("Connect to:"));
  display.setTextSize(1);
  display.println(ap_ssid);
  display.println();
  display.print(F("IP: "));
  display.println(WiFi.softAPIP());
  display.display();
}

void setupWebServer() {
  // Enable CORS for all requests
  server.onNotFound([]() {
    if (server.method() == HTTP_OPTIONS) {
      handleCORS();
    } else {
      server.send(404, "text/plain", "Not found");
    }
  });
  
  // API endpoints
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/status", HTTP_OPTIONS, handleCORS);
  server.on("/api/animation", HTTP_POST, handleAnimation);
  server.on("/api/animation", HTTP_OPTIONS, handleCORS);
  
  server.begin();
  Serial.println("✅ Web server started on port 80");
}

void loop() {
  // Handle web server requests
  server.handleClient();
  
  // Update display animation
  updateDisplay();
  
  // Small delay to prevent excessive CPU usage
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
  html += "<p>Connected Devices: <span id='device-count'>Loading...</span></p></div>";
  html += "<h3>Test Animations:</h3>";
  html += "<button class='button' onclick=\"sendAnimation('idle')\">Idle</button>";
  html += "<button class='button' onclick=\"sendAnimation('pomodoro','Focus Session')\">Pomodoro</button>";
  html += "<button class='button' onclick=\"sendAnimation('complete','Task Done!')\">Complete</button>";
  html += "<script>";
  html += "async function sendAnimation(type,task=''){";
  html += "try{const response=await fetch('/api/animation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({animation:type,task:task})});";
  html += "if(response.ok){updateStatus();}}catch(e){console.error('Failed to send animation:',e);}}";
  html += "async function updateStatus(){try{const response=await fetch('/api/status');const data=await response.json();";
  html += "document.getElementById('current-animation').textContent=data.animation;";
  html += "document.getElementById('device-count').textContent=data.connectedDevices;}catch(e){console.error('Failed to get status:',e);}}";
  html += "setInterval(updateStatus,2000);updateStatus();";
  html += "</script></body></html>";
  
  server.send(200, "text/html", html);
}

void handleStatus() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Content-Type", "application/json");
  
  JsonDocument doc;
  doc["status"] = "connected";
  doc["animation"] = currentAnimation;
  doc["task"] = currentTask;
  doc["uptime"] = millis();
  doc["connectedDevices"] = WiFi.softAPgetStationNum();
  doc["ip"] = WiFi.softAPIP().toString();
  
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
      
      Serial.print("🎬 Animation changed to: ");
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
  
  // Update display every 200ms for smooth animations
  if (millis() - lastUpdate < 200) {
    return;
  }
  lastUpdate = millis();
  
  if (currentAnimation == "idle") {
    drawIdleAnimation();
  } else if (currentAnimation == "pomodoro") {
    drawPomodoroAnimation();
  } else if (currentAnimation == "complete") {
    drawTaskCompleteAnimation();
  }
}

void drawIdleAnimation() {
  static int frame = 0;
  frame++;
  
  display.clearDisplay();
  
  // Tabbie face - idle expression
  display.setTextSize(2);
  display.setCursor(45, 10);
  display.println(F("(-.-)"));
  
  // Status
  display.setTextSize(1);
  display.setCursor(25, 35);
  display.println(F("Waiting..."));
  
  // Breathing animation - subtle pixel changes
  int brightness = (sin(frame * 0.1) + 1) * 127;
  if (brightness > 200) {
    display.drawPixel(64, 55, SSD1306_WHITE);
  }
  
  // Connection info
  display.setTextSize(1);
  display.setCursor(0, 55);
  display.print(WiFi.softAPgetStationNum());
  display.println(F(" connected"));
  
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
  
  // Task name (truncated if too long)
  display.setTextSize(1);
  display.setCursor(0, 25);
  String taskDisplay = currentTask;
  if (taskDisplay.length() > 21) {
    taskDisplay = taskDisplay.substring(0, 18) + "...";
  }
  display.println(taskDisplay);
  
  // Pomodoro timer animation
  display.setTextSize(1);
  display.setCursor(30, 40);
  display.println(F("FOCUS! "));
  
  // Animated focus indicator
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