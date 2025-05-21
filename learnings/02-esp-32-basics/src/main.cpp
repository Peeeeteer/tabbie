#include <Arduino.h>


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

#include <Arduino.h> // Includes the basic Arduino library functions

// Define the pins we are using
#define LED_PIN 12     // The LED is connected to GPIO 12
#define BUTTON_PIN 15  // The button is connected to GPIO 15

// Global variables to store states
int ledState = LOW;             // Current state of the LED (LOW = off, HIGH = on). Initialized to off.
int lastButtonState = HIGH;     // Previous raw reading of the button. Initialized to HIGH (unpressed with INPUT_PULLUP).
int currentButtonState = HIGH;  // Current debounced (stable) state of the button.

// Variables for debouncing the button
unsigned long lastDebounceTime = 0; // Stores when the button last changed its raw state
unsigned long debounceDelay = 50;   // Debounce time in milliseconds. Adjust if needed.

void setup() {
  // This function runs once when the ESP32 starts or resets.

  // Configure the LED pin as an OUTPUT
  pinMode(LED_PIN, OUTPUT);
  // Configure the Button pin as an INPUT with an internal PULL-UP resistor
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // Set the initial state of the LED (it's off because ledState is LOW)
  digitalWrite(LED_PIN, ledState);

  // Initialize Serial communication at 115200 bits per second for debugging
  Serial.begin(115200);
  Serial.println("Button controlled LED (Pin 12 LED, Pin 15 Button). Press to toggle.");
}

void loop() {
  // This function runs over and over again.

  // 1. Read the current raw state of the button
  int reading = digitalRead(BUTTON_PIN);

  // 2. Debounce Logic:
  // If the raw button reading has changed (due to noise or an actual press/release)
  if (reading != lastButtonState) {
    // Reset the debouncing timer because the state has changed
    lastDebounceTime = millis();
  }

  // Check if enough time has passed since the last raw state change
  // This ensures the button signal is stable and not just a quick bounce.
  if ((millis() - lastDebounceTime) > debounceDelay) {
    // If the stable reading is different from the last known stable state...
    if (reading != currentButtonState) {
      currentButtonState = reading; // Update the stable current button state

      // If the button is now pressed (stable state is LOW)
      if (currentButtonState == LOW) {
        ledState = !ledState; // Toggle the LED's state (if it was LOW, it becomes HIGH, and vice-versa)
        digitalWrite(LED_PIN, ledState); // Apply the new state to the LED

        // Print the LED status to the Serial Monitor
        if (ledState == HIGH) {
          Serial.println("LED ON");
        } else {
          Serial.println("LED OFF");
        }
      }
    }
  }

  // 3. Save the current raw reading for the next loop iteration
  lastButtonState = reading;
}



