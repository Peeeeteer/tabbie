#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// OLED display width and height, in pixels
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

// Declaration for an SSD1306 display connected to I2C (SDA, SCL pins)
#define OLED_RESET     -1 // Reset pin # (or -1 if sharing Arduino reset pin)
#define SCREEN_ADDRESS 0x3C // See datasheet for Address; 0x3D for 128x64, 0x3C for 128x32

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

void setup() {
  Serial.begin(115200);
  
  // Initialize I2C communication
  // ESP32 default I2C pins: SDA = 21, SCL = 22
  Wire.begin(21, 22);
  
  // SSD1306_SWITCHCAPVCC = generate display voltage from 3.3V internally
  if(!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for(;;); // Don't proceed, loop forever
  }

  // Clear the buffer
  display.clearDisplay();
  
  // Display "Hello World" text
  display.setTextSize(1);      // Normal 1:1 pixel scale
  display.setTextColor(SSD1306_WHITE); // Draw white text
  display.setCursor(0,0);      // Start at top-left corner
  display.println(F("Hello, World!"));
  
  // Add some additional text with different formatting
  display.setTextSize(2);      // Draw 2X-scale text
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(10,20);
  display.println(F("Tabbie"));
  
  // Draw a simple rectangle
  display.drawRect(0, 40, 128, 24, SSD1306_WHITE);
  
  // Add smaller text inside the rectangle
  display.setTextSize(1);
  display.setCursor(5, 45);
  display.println(F("ESP32 + OLED Test"));
  
  // Display everything on the screen
  display.display();
  
  Serial.println("OLED Display initialized successfully!");
  Serial.println("Hello World displayed on screen");
}

void loop() {
  // Simple animation - blink a pixel
  static unsigned long lastBlink = 0;
  static bool pixelState = false;
  
  if (millis() - lastBlink > 500) { // Blink every 500ms
    display.drawPixel(120, 5, pixelState ? SSD1306_WHITE : SSD1306_BLACK);
    display.display();
    pixelState = !pixelState;
    lastBlink = millis();
  }
  
  delay(10); // Small delay to prevent excessive CPU usage
}
