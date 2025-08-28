#include <Arduino.h>
#include <TFT_eSPI.h>
#include <SPI.h>

// Initialize TFT display
TFT_eSPI tft = TFT_eSPI();

// Define pins for manual testing
#define TFT_CS_PIN 5
#define TFT_DC_PIN 2
#define TFT_RST_PIN 4

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
  delay(2000); // Give more time for serial to start
  Serial.println("\n\n=== ESP32 ST7735S Display Test ===");
  
  // Manual pin setup for debugging
  pinMode(TFT_CS_PIN, OUTPUT);
  pinMode(TFT_DC_PIN, OUTPUT);
  pinMode(TFT_RST_PIN, OUTPUT);
  
  // Manual reset sequence
  Serial.println("Performing manual reset...");
  digitalWrite(TFT_RST_PIN, LOW);
  delay(100);
  digitalWrite(TFT_RST_PIN, HIGH);
  delay(100);
  Serial.println("✓ Manual reset completed");
  
  // Initialize SPI
  SPI.begin();
  Serial.println("✓ SPI initialized");
  
  // Try different initialization approaches
  Serial.println("Attempting display initialization...");
  
  // Method 1: Standard init
  tft.init();
  Serial.println("✓ Display init completed");
  
  // Try different rotation settings
  Serial.println("Testing rotation 0 (portrait)...");
  tft.setRotation(0);
  
  // Test with maximum brightness/contrast
  Serial.println("Setting maximum brightness...");
  tft.writecommand(0x26); // Gamma Set
  tft.writedata(0x04);     // Gamma curve 3
  
  // Test 1: Fill with bright colors
  Serial.println("Test 1: Filling with WHITE...");
  tft.fillScreen(TFT_WHITE);
  delay(3000);
  
  Serial.println("Test 2: Filling with RED...");
  tft.fillScreen(TFT_RED);
  delay(3000);
  
  Serial.println("Test 3: Filling with GREEN...");
  tft.fillScreen(TFT_GREEN);
  delay(3000);
  
  Serial.println("Test 4: Filling with BLUE...");
  tft.fillScreen(TFT_BLUE);
  delay(3000);
  
  Serial.println("Test 5: Filling with YELLOW...");
  tft.fillScreen(TFT_YELLOW);
  delay(3000);
  
  // Test 6: Maximum brightness test
  Serial.println("Test 6: Maximum brightness white...");
  tft.fillScreen(0xFFFF); // Maximum white
  delay(3000);
  
  // Test 7: Draw some basic shapes
  Serial.println("Test 7: Drawing shapes...");
  tft.fillScreen(TFT_BLACK);
  
  // Draw a white rectangle
  tft.fillRect(10, 10, 50, 30, TFT_WHITE);
  delay(1000);
  
  // Draw a red circle
  tft.fillCircle(100, 50, 20, TFT_RED);
  delay(1000);
  
  // Draw a green line
  tft.drawLine(0, 100, 127, 100, TFT_GREEN);
  delay(1000);
  
  Serial.println("=== All tests completed ===");
  Serial.println("If you see ANY colors, the display is working!");
  Serial.println("If still black:");
  Serial.println("1. Try connecting BLK to 3.3V instead of GND");
  Serial.println("2. Check all wire connections");
  Serial.println("3. Try different driver settings");
}

void loop() {
  // Blink the onboard LED to show the program is running
  digitalWrite(2, HIGH);
  delay(500);
  digitalWrite(2, LOW);
  delay(500);
}