#include <Arduino.h>

// Define the LED pin. Use a PWM-capable pin (like 3, 5, 6, 9, 10, 11 on Uno)
const int ledPin = 9;
int n = 0;
int direction = 1;
void setup() {
  // Initialize the digital pin ledPin as an output.
  // pinMode is still correct even when using analogWrite for PWM.
  pinMode(ledPin, OUTPUT);
  // Initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
}

void loop() {

  
  Serial.println(n);

  analogWrite(ledPin, n);
  delay(0);              // Wait a short time (e.g., 20ms) for a smoother effect


  if (n == 255) {
    direction = -1;
  } else if (n == 0) {
    direction = 1;
  }

  n += direction;

}
