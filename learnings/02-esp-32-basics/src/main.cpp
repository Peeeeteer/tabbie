#include <Arduino.h>

// Define the GPIO pin for the built-in LED
// Most ESP32 boards use GPIO2 for the built-in LED
// If your board uses a different pin, change this value.
const int LED_BUILTIN_PIN = 2;

void setup() {
  // Initialize the LED pin as an output
  pinMode(LED_BUILTIN_PIN, OUTPUT);
  Serial.begin(115200); // Initialize serial communication for debugging (optional)
  Serial.println("ESP32 Blink sketch started!");
}

void loop() {
  digitalWrite(LED_BUILTIN_PIN, HIGH); // Turn the LED on (HIGH is the voltage level)
  Serial.println("LED ON");
  delay(100);                       // Wait for a second

  digitalWrite(LED_BUILTIN_PIN, LOW);  // Turn the LED off by making the voltage LOW
  Serial.println("LED OFF");
  delay(100);                       // Wait for another second
}