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

// #define LED_PIN 2     // GPIO2 pin connected to LED
// #define BUTTON_PIN 15 // GIOP21 pin connected to button

// // Variables will change:
// int lastState = LOW;  // the previous state from the input pin
// int currentState;     // the current reading from the input pin
// int ledState = false;

// void setup() {
//   // initialize serial communication at 9600 bits per second:
//   Serial.begin(115200);
//   // initialize the pushbutton pin as an pull-up input
//   // the pull-up input pin will be HIGH when the switch is open and LOW when the switch is closed.
//   pinMode(BUTTON_PIN, INPUT_PULLUP);

//   Serial.println("Connected to ESP32");
// }

// void loop() {


//   // read the state of the switch/button:
//   currentState = digitalRead(BUTTON_PIN);

//   if (lastState == HIGH && currentState == LOW) {
//     Serial.println("The button is pressed");
//     // Toggle LED state
//     ledState = !ledState;
//     digitalWrite(LED_PIN, ledState);

//     // If LED is on, print "LED is on"
//     if (ledState) {
//     Serial.println("LED is on");
//     } else {
//     Serial.println("LED is off");
//     }
//   }
//   else if (lastState == LOW && currentState == HIGH) {
//     Serial.println("The button is released");
//   }

//   // save the the last state
//   lastState = currentState;


// }



/*
 * This ESP32 code is created by esp32io.com
 *
 * This ESP32 code is released in the public domain
 *
 * For more detail (instruction and wiring diagram), visit https://esp32io.com/tutorials/esp32-button-led
 */

#define BUTTON_PIN  18 // ESP32 pin GPIO18, which connected to button
#define LED_PIN     21 // ESP32 pin GPIO21, which connected to led

// variables will change:
int button_state = 0;   // variable for reading the button status

void setup() {
  // initialize the LED pin as an output:
  pinMode(LED_PIN, OUTPUT);
  // initialize the button pin as an pull-up input:
  // the pull-up input pin will be HIGH when the button is open and LOW when the button is pressed.
  pinMode(BUTTON_PIN, INPUT_PULLUP);
}

void loop() {
  // read the state of the button value:
  button_state = digitalRead(BUTTON_PIN);

  // control LED according to the state of button
  if (button_state == LOW)       // if button is pressed
    digitalWrite(LED_PIN, HIGH); // turn on LED
  else                           // otherwise, button is not pressing
    digitalWrite(LED_PIN, LOW);  // turn off LED
    Serial.println("LED is off");
}




