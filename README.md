<div align="center">

# 🤖 Tabbie

**The desk robot that teaches you electronics — one LED, servo, and silly face at a time.**  
Are you a **web developer** curious about **electronics**, but don't know where to start?

**Build Tabbie.**  
An open-source robot kit powered by an ESP32 and controlled via a local React dashboard — made to teach developers hardware from scratch, by building something real.

[📬 Sign up for the waitlist](https://tabbie.me) · [📺 Follow the Build](https://www.youtube.com/@peeeeteeer)

</div>

---

## 🧠 What is Tabbie?

**Tabbie is a learning kit disguised as a cute robot.**  
It’s a full hands-on project where **software meets hardware** — made for coders who’ve never touched a breadboard.

By the end, you’ll have:
- 🖥️ A React dashboard talking to real-world hardware  
- 🔌 An ESP32-based robot with a screen, sound, and servos  
- 🧠 A beginner-to-intermediate grasp of microcontrollers and electronics



## 🤖 What Can Tabbie Do?

Once built, your Tabbie will be able to:

- ✅ Display and manage your to-do list  
- ⏲️ Run Pomodoro timers like “Start pomodoro for [task]”  
- 🔔 Set reminders (e.g., “Drink water every 30 mins”)  
- 📊 Track your online activity
- 🗣️ Talk to you with sound + facial expressions _(in the future)_

It’s like your own tiny Twitch streamer, productivity coach, and digital desk buddy.

## 🧑‍💻 What Will You Learn?

Tabbie is modular — each feature you build teaches you something useful:

| Feature                      | What You'll Learn                        |
|-----------------------------|------------------------------------------|
| 🔴 Light up a LED           | GPIO basics, React <-> ESP32 comm        |
| 🧠 Animate facial expressions | SPI screen control, frame buffers        |
| 🦾 Control servo arms        | PWM, motor control, external power       |
| 📻 Play voice/sound         | DFPlayer Mini, MP3 control over serial   |
| 🎤 React to your voice      | I2S mic, sound input, basic signal logic |
| ⏱️ Build Pomodoro timers    | Syncing frontend with microcontroller    |
| ✅ To-do list manager       | SD card I/O, simple JSON file handling   |
| 📡 WiFi & APIs              | ESP32 webserver, RESTful communication   |

## 🚀 Get Started

So you’re ready to build your own Tabbie? Heck yeah.  
Whether you want to buy the official kit or DIY it from scratch — you’re covered.

👉 [**Starter Guide → tabbie.me**](https://tabbie.me) *(Coming Soon — sign up for the waitlist!)*

## ❓ Why Build Tabbie?

You could follow another “LED blink” tutorial...  
**Or you could build a robot with a screen, voice, arms — and a personality.**

- 🎓 Actually learn electronics by building something cool  
- 💬 Understand how software connects to the real world  
- 🤖 Give your desk a quirky assistant with real hardware  
- 🧪 Experiment, break stuff, and learn by doing  
- ✨ Walk away with something you *actually* made  

## 🔌 Tools & Tech Stack

| Part               | What We're Using                       |
|-------------------|----------------------------------------|
| **Microcontroller** | ESP32 DevKit C (or similar)            |
| **Display**         | ILI9341 2.8” TFT (SPI)                 |
| **Audio**           | DFPlayer Mini + speaker                |
| **Microphone**      | I2S digital mic (e.g., INMP441)        |
| **Servos**          | SG90 or similar (x2)                   |
| **Power**           | External 5V source (USB or battery)    |
| **Frontend**        | React                                  |
| **Backend**         | Node.js or Python                      |
| **Firmware**        | C++ (Arduino / PlatformIO)             |



**Sounds fun?**  
👉 [**Join the waitlist at tabbie.me**](https://tabbie.me)


---

## 🛠️ Project Structure

```txt
TABBIE/
├── make-tabbie/                 # 3D-printed parts & assembly info
│   ├── 3d-files/                # STL & CAD files
│   └── assembly_instructions.md # How to put it all together
│
├── tabbie-learns/               # Step-by-step learning + experiments
│   ├── 01-arduino-uno-basic/    
│   └── 02-esp-32-basics/       
│       └── index.md
│
├── tabbie/                      # The actual working software
│   ├── esp32_firmware/          # C++ code running on the ESP32
│   ├── local_backend_server/    # Node.js or Python server for backend logic
│   └── react_frontend_dashboard/# Your control panel for the robot
│
└── README.md                    # You are here.
