I purchased this small one (These are affiliate links. I may earn a commission at no extra cost to you)

EU: 22 EUR
https://amzn.to/4jXdnxq
https://amzn.to/3GIhij3


## 1. Simple light up light on the board

When I ran the code, I got this error msg:
```text
A fatal error occurred: Failed to connect to ESP32: Invalid head of packet (0x00): Possible serial noise or corruption.
For troubleshooting steps visit: https://docs.espressif.com/projects/esptool/en/latest/troubleshooting.html
*** [upload] Error 2
============================================================================================================ [FAILED] Took XX.XX seconds ============================================================================================================

 *  The terminal process "C:\Users\user\.platformio\penv\Scripts\platformio.exe 'run', '--target', 'upload'" terminated with exit code: 1. 
 *  Terminal will be reused by tasks, press any key to close it. 
```

When running the code
And to run esp32 make sure you have the drivers to run it, as I saw that I dont.

Show image from /media/esp32-1.png

It needs driver, on the chip it says CP2102


Image esp32-2.jpg here.


So we can find them here:
https://www.silabs.com/developer-tools/usb-to-uart-bridge-vcp-drivers?tab=downloads

I have windows so I downloaded that. And now we see it (Above before, below After)
Show image from /media/esp32-3.png


And now it blinks
-> Video how it blinks.


## 2. Button was pressed Print

When button is pressed in Terminal I get a

"
The button is released
The button is pressed
"


Was looking at this:
https://esp32io.com/tutorials/esp32-button

And read some stuff with chatgpt/gemini/claude/grok etc... anything works

To clearly learn the code, I did this with chatgpt:
Quiz me on it with 7 different quesitons,once I answer judge me honestly and provide feedback to my answer and give me a score from 0-10


So that I dont only read the code, but fully understand whats going on. Really recommend it.
Like this:
https://gyazo.com/3653ac1843193fca82ac2226e312e881


And this quiz really helped me as when pressing button it was returning this weird gibbersihs, as I had it at 9600 as from arduino but for esp32 they talk faster so you need it at 115200 which is basicly a lot faster communication.


## 3. Turn on a led with button press.

Same thing, these guys are awesome:
https://esp32io.com/tutorials/esp32-button-led

+ chatgpt with 7 quiz questions.