I purchased these things (These are affiliate links. I may earn a commission at no extra cost to you)

EU: 20 EUR
https://amzn.to/4jXdnxq
https://amzn.to/3GIhij3

US: $25
https://amzn.to/42Nb3lt
https://amzn.to/3RBpxQt

And the goal was to:
Show a screen and a mic and have it read and show that thing it read on a web page?


## Things I did.


## 1.1 Lights
I installed vs code ardunio extensions





1.2.
Watched this tutorial:
https://www.youtube.com/watch?v=I0ZIrzoI61g

1.3.
Ran into some problems running Arduino with VSCODE, watching this
https://www.youtube.com/watch?v=gQ2lsSuXvVU

Ended up installing platformio.ini which seems to be the main one anyone uses for boards like these?

If your on a Mac and you dont see the extension, you will need to pip install the platformio and then manually do the project init and such, without the extension gui (But if you on VS code it should be fine)

NOW Arudino does the ligth thing:

The code is inside ../src/main.cpp 
Dont forget to pio lib install "Servo" (Komment and unkomment code for each part)


https://github.com/user-attachments/assets/9d56f506-6bd0-425b-b68e-76e2e1bc5504




On to next thing.

## 2.1 Potentiometer

With a Potentiometer, you can now turn the ligth led up and down. Same code in the main.cpp file 



https://github.com/user-attachments/assets/5a38a1b8-3e5c-4d68-8e2c-4ae03be7157e



2.2 Potentiometer

Exact Same code but you can also use it to turn a Fan Motor... which is cool.


https://github.com/user-attachments/assets/15904203-2893-4038-a614-c387fcf38571


## 3.0 Servos/Step Motors 


Move servo with ptanetiomoter.


## 3.1 Same thing, but now with tabbie head (The head will definetly look better in the future)

