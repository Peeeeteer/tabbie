// 1. Light up the LED (Comment out til 2. )

// #include <Arduino.h>

// // Define the LED pin. Use a PWM-capable pin (like 3, 5, 6, 9, 10, 11 on Uno)
// const int ledPin = 9;
// int n = 0;
// int direction = 1;
// void setup() {

//   pinMode(ledPin, OUTPUT);
//   // Initialize serial communication at 9600 bits per second:  Serial.begin(9600);
// }

// void loop() {

  
//   Serial.println(n);

//   analogWrite(ledPin, n);
//   delay(0);              


//   if (n == 255) {
//     direction = -1;
//   } else if (n == 0) {
//     direction = 1;
//   }

//   n += direction;

// }


// 2. Add Potentiometer

#include <Arduino.h>

// Define the pins
const int potPin = A0; // Potentiometer connected to Analog pin A0
const int ledPin = 9;  // LED connected to PWM pin 9

void setup() {
  // Set the LED pin as an output
  pinMode(ledPin, OUTPUT);
  // Initialize serial communication (optional, for debugging)
  Serial.begin(9600); 
}

void loop() {
  // Read the potentiometer value (0-1023)
  int potValue = analogRead(potPin);

  // Map the potentiometer value to the LED brightness range (0-255)
  int brightness = map(potValue, 0, 1023, 0, 255);

  // Set the LED brightness
  analogWrite(ledPin, brightness);

  // Print the values to the Serial Monitor (optional)
  Serial.print("Potentiometer: ");
  Serial.print(potValue);
  Serial.print(" -> Brightness: ");
  Serial.println(brightness);

  // Small delay to stabilize readings (optional)
  delay(10); 
}


