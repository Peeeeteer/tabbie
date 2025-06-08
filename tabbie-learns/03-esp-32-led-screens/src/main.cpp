#include <Arduino.h>

// Define the onboard LED pin for ESP32
#define LED_PIN 2

void setup() {
  // Initialize serial communication for debugging
  Serial.begin(115200);
  
  // Initialize the built-in LED pin as an output
  pinMode(LED_PIN, OUTPUT);
  
  Serial.println("ESP32 LED Blink Started");
}

void loop() {
  // Turn the LED on
  digitalWrite(LED_PIN, HIGH);
  Serial.println("LED ON");
  delay(50); // Wait for 1 second
  
  // Turn the LED off
  digitalWrite(LED_PIN, LOW);
  Serial.println("LED OFF");
  delay(50); // Wait for 1 second
}