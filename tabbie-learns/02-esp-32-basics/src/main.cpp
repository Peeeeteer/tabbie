#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>

// // 1. Blink LED
// // Define the GPIO pin for the built-in LED
// // Most ESP32 boards use GPIO2 for the built-in LED
// // If your board uses a different pin, change this value.
// const int LED_BUILTIN_PIN = 2;

// void setup() {
//   // Initialize the LED pin as an output
//   pinMode(LED_BUILTIN_PIN, OUTPUT);
//   Serial.begin(115200); // Initialize serial communication for debugging (optional)
//   Serial.println("ESP32 Blink sketch started!");
// }

// void loop() {
//   digitalWrite(LED_BUILTIN_PIN, HIGH); // Turn the LED on (HIGH is the voltage level)
//   Serial.println("LED ON");
//   delay(100);                       // Wait for a second

//   digitalWrite(LED_BUILTIN_PIN, LOW);  // Turn the LED off by making the voltage LOW
//   Serial.println("LED OFF");
//   delay(100);                       // Wait for another second
// }


//// 2. Button is pressed and released

// #define BUTTON_PIN 15 // GIOP21 pin connected to button

// // Variables will change:
// int lastState = LOW;  // the previous state from the input pin
// int currentState;     // the current reading from the input pin

// void setup() {
//   // initialize serial communication at 9600 bits per second:
//   Serial.begin(115200);
//   // initialize the pushbutton pin as an pull-up input
//   // the pull-up input pin will be HIGH when the switch is open and LOW when the switch is closed.
//   pinMode(BUTTON_PIN, INPUT_PULLUP);
// }

// void loop() {
//   // read the state of the switch/button:
//   currentState = digitalRead(BUTTON_PIN);

//   if (lastState == HIGH && currentState == LOW)
//     Serial.println("The button is pressed");
//   else if (lastState == LOW && currentState == HIGH)
//     Serial.println("The button is released");

//   // save the the last state
//   lastState = currentState;
// }


// 3. Button to turn on and off LED

// #include <Arduino.h> // Includes the basic Arduino library functions

// // Define the pins we are using
// #define LED_PIN 12     // The LED is connected to GPIO 12
// #define BUTTON_PIN 15  // The button is connected to GPIO 15

// // Global variables to store states
// int ledState = LOW;             // Current state of the LED (LOW = off, HIGH = on). Initialized to off.
// int lastButtonState = HIGH;     // Previous raw reading of the button. Initialized to HIGH (unpressed with INPUT_PULLUP).
// int currentButtonState = HIGH;  // Current debounced (stable) state of the button.

// // Variables for debouncing the button
// unsigned long lastDebounceTime = 0; // Stores when the button last changed its raw state
// unsigned long debounceDelay = 50;   // Debounce time in milliseconds. Adjust if needed.

// void setup() {
//   // This function runs once when the ESP32 starts or resets.

//   // Configure the LED pin as an OUTPUT
//   pinMode(LED_PIN, OUTPUT);
//   // Configure the Button pin as an INPUT with an internal PULL-UP resistor
//   pinMode(BUTTON_PIN, INPUT_PULLUP);

//   // Set the initial state of the LED (it's off because ledState is LOW)
//   digitalWrite(LED_PIN, ledState);

//   // Initialize Serial communication at 115200 bits per second for debugging
//   Serial.begin(115200);
//   Serial.println("Button controlled LED (Pin 12 LED, Pin 15 Button). Press to toggle.");
// }

// void loop() {
//   // This function runs over and over again.

//   // 1. Read the current raw state of the button
//   int reading = digitalRead(BUTTON_PIN);

//   // 2. Debounce Logic:
//   // If the raw button reading has changed (due to noise or an actual press/release)
//   if (reading != lastButtonState) {
//     // Reset the debouncing timer because the state has changed
//     lastDebounceTime = millis();
//   }

//   // Check if enough time has passed since the last raw state change
//   // This ensures the button signal is stable and not just a quick bounce.
//   if ((millis() - lastDebounceTime) > debounceDelay) {
//     // If the stable reading is different from the last known stable state...
//     if (reading != currentButtonState) {
//       currentButtonState = reading; // Update the stable current button state

//       // If the button is now pressed (stable state is LOW)
//       if (currentButtonState == LOW) {
//         ledState = !ledState; // Toggle the LED's state (if it was LOW, it becomes HIGH, and vice-versa)
//         digitalWrite(LED_PIN, ledState); // Apply the new state to the LED

//         // Print the LED status to the Serial Monitor
//         if (ledState == HIGH) {
//           Serial.println("LED ON");
//         } else {
//           Serial.println("LED OFF");
//         }
//       }
//     }
//   }

//   // 3. Save the current raw reading for the next loop iteration
//   lastButtonState = reading;
// }



// 4. On/Off LED via Wifi (Add here)

// WiFi credentials - These will be set by build script from .env file
// DO NOT put actual credentials here - they come from .env file
#ifndef WIFI_SSID
#define WIFI_SSID "YOUR_WIFI_SSID"
#endif
#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#endif

const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;

// Define the pins we are using
#define LED_BUILTIN_PIN 2      // The built-in LED is connected to GPIO 2 on most ESP32 boards

// Create web server on port 80
WebServer server(80);

// Global variable to store LED state
bool ledState = false;

// Log buffer for storing recent messages
#define LOG_BUFFER_SIZE 20
String logBuffer[LOG_BUFFER_SIZE];
int logIndex = 0;
int logCount = 0;

// Function to add log message to buffer
void addLog(String message) {
  logBuffer[logIndex] = message;
  logIndex = (logIndex + 1) % LOG_BUFFER_SIZE;
  if (logCount < LOG_BUFFER_SIZE) {
    logCount++;
  }
  Serial.println(message); // Also print to serial
}

void connectToWiFi() {
  // Start WiFi connection
  addLog("Connecting to WiFi network: " + String(ssid));
  
  WiFi.begin(ssid, password);
  
  // Wait for connection
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    addLog("Connected to WiFi!");
    addLog("IP address: " + WiFi.localIP().toString());
    addLog("Signal strength (RSSI): " + String(WiFi.RSSI()) + " dBm");
  } else {
    Serial.println();
    addLog("Failed to connect to WiFi");
    addLog("Please check your credentials and try again");
  }
}

// Handle LED ON request
void handleLEDOn() {
  ledState = true;
  digitalWrite(LED_BUILTIN_PIN, HIGH);
  addLog("LED ON - via web request");
  
  // Enable CORS and send response
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(200, "application/json", "{\"status\":\"LED ON\",\"state\":true}");
}

// Handle LED OFF request
void handleLEDOff() {
  ledState = false;
  digitalWrite(LED_BUILTIN_PIN, LOW);
  addLog("LED OFF - via web request");
  
  // Enable CORS and send response
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(200, "application/json", "{\"status\":\"LED OFF\",\"state\":false}");
}

// Handle LED status request
void handleLEDStatus() {
  // Enable CORS and send response
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  
  String response = "{\"state\":" + String(ledState ? "true" : "false") + ",\"status\":\"" + String(ledState ? "LED ON" : "LED OFF") + "\"}";
  server.send(200, "application/json", response);
}

// Handle logs request
void handleLogs() {
  // Enable CORS and send response
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  
  String response = "{\"logs\":[";
  
  // Add logs in chronological order
  for (int i = 0; i < logCount; i++) {
    int index = (logIndex - logCount + i + LOG_BUFFER_SIZE) % LOG_BUFFER_SIZE;
    if (i > 0) response += ",";
    response += "\"" + logBuffer[index] + "\"";
  }
  
  response += "],\"count\":" + String(logCount) + "}";
  server.send(200, "application/json", response);
}

// Handle CORS preflight requests
void handleCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(200, "text/plain", "");
}

void setup() {
  // Initialize Serial communication at 115200 bits per second for debugging
  Serial.begin(115200);
  addLog("Tabbie ESP32 starting up...");

  addLog("WiFi-enabled LED control ready");
  
  // Connect to WiFi
  connectToWiFi();

  // Add your LED control logic here
  pinMode(LED_BUILTIN_PIN, OUTPUT);
  digitalWrite(LED_BUILTIN_PIN, LOW); // Start with LED off

  // Setup web server routes
  server.on("/led/on", HTTP_GET, handleLEDOn);
  server.on("/led/off", HTTP_GET, handleLEDOff);
  server.on("/led/status", HTTP_GET, handleLEDStatus);
  server.on("/logs", HTTP_GET, handleLogs);
  server.on("/led/on", HTTP_OPTIONS, handleCORS);
  server.on("/led/off", HTTP_OPTIONS, handleCORS);
  server.on("/led/status", HTTP_OPTIONS, handleCORS);
  server.on("/logs", HTTP_OPTIONS, handleCORS);

  // Start the server
  server.begin();
  addLog("Web server started!");
  addLog("LED Control URLs:");
  addLog("LED ON:  http://" + WiFi.localIP().toString() + "/led/on");
  addLog("LED OFF: http://" + WiFi.localIP().toString() + "/led/off");
  addLog("Status:  http://" + WiFi.localIP().toString() + "/led/status");
  addLog("Logs:    http://" + WiFi.localIP().toString() + "/logs");
}
  
void loop() {
  // Check WiFi connection status
  if (WiFi.status() != WL_CONNECTED) {
    addLog("WiFi connection lost. Attempting to reconnect...");
    connectToWiFi();
  }
  
  // Handle web server requests
  server.handleClient();
  
  // Small delay to prevent excessive processing
  delay(10);
}
