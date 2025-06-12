I purchased this small one (These are affiliate links. I may earn a commission at no extra cost to you)

EU: 22 EUR
https://amzn.to/4jXdnxq



## 1. ESP32 working test

For the setup I again did this:
https://gyazo.com/37ea603742f484d6cf2d05bb1ba84736


Simple check for if the onboard led is blinking aka that everything is working fine.


## 2. ESP32 + GME12864-11

We can get started with the ESP32 + GME12864-11 LED screen, basicly the one I got here https://amzn.to/4jXdnxq
Idea is to just show a face
Maybe then show a animation & then we could test the other screens I think?

The code is as it is under the ## 2. ESP32 + GME12864-11

And now you just need to connect to the esp32:

VCC → 3.3V 
GND → GND
SCL → GPIO 22 (default I2C clock pin)
SDA → GPIO 21 (default I2C data pin)


Now are display a simple static thing on the screen:
Image of the thing on my phone, will link later.

I quized myself as usual to understand the code but yea.


# 3. ESP32 + GME12864-11 + lopaka.app


Now using:
https://lopaka.app/gallery#trending

We will create a looping animation of the character blinking and the looking to the side.

Yea, 
just go to the url and make your 4 face screens & or just copy the ones I have and see the code.



### Just thinking

Seems like after more consideration, I will be switching to a Raspberry Pi Zero 2 W

the esp32 is not a good usecase in our situation, as esp32 is more of a outdoor low battery consumtion thing rather than mine on pc, gets to be charger all the time thing.

So basicly esp32 is just for the exact small electronic things, like quick weather sensor that sends data to your server and such


Simple "do one thing well" devices


Not sure, that might be version 2 and for now ill just make aversion 1 that does all the calculation etc.. on the pc/localy and just sends what to do the esp32.

Like,
User just started pomodoro (focus face or something?)


Exported chat to D:\tabbie 

# 4. ESP32 + GME12864-11 + lopaka.app + send faces

The goal now is to see whether for battery safety and not using rasberypie to use esp32 as just sort of middle maschine as I dont want to use rasberypie and some weird large batteries to Tabbie.


All the calculation and things will happen on the local pc/laptop, as in if we start a pomodoro, we send the animations for that to the esp32 and wipe the rest


So lets just actually try that, a simple "waiting animation" that is always on the esp32 and once we click on "Start pomodoro" in the dashboard, we show the "focus face"


Also,
We need resue the .env file and the load_env.py file from the previous esp32 basics.



So yes,
We are able to stream images / bits over wifi to show on the face but actually maybe not required.


So the goal now is to 




