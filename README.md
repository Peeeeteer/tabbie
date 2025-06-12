<div align="center">

# 🤖 Tabbie  
Ever wanted a **to-do app with a Cute Face**? One that lives on your desk?

**That’s Tabbie.**

[📬 Join the waitlist](https://tabbie.me) · [📺 Follow the build](https://www.youtube.com/@peeeeteer)

</div>

---

## 🧠 What is Tabbie?

**Tabbie is a DIY desk robot that helps you work, focus, and learn.**  
It’s like a to-do app — but physical, local, and full of personality.

Tabbie lives on your desk, connects to your computer, and helps with small daily things like:
- ✅ Managing your to-do list
- ⏲️ Running Pomodoro timers
- 🔔 Setting reminders (like “drink water every 30 mins”)
- 😋 Making faces, moving around, and being silly
- 🗣️ Talking to you (coming soon!)

**Think:** a mini Twitch streamer sitting on your desk, cheering you on — but also keeping you on track.


## ✨ Made to Be Built

Tabbie is open-source and totally customizable.  
You can build it yourself with 3D-printed parts and off-the-shelf components — or just buy a Kit

By default, it’s powered by:
- 🧠 An ESP32 microcontroller
- 🖥️ A local React dashboard that talks to the robot
- 🔌 A screen, servos, speaker — all connected to your code

Whether you’re a beginner or just a curious dev who wants to tinker with hardware — Tabbie is a fun place to start.





<!---

## 🤖 Tabbie is still in development  
👉 [**Sign up for the waitlist → tabbie.me**](https://tabbie.me)  



## 🛠️ Not a Course. Just a Walkthrough.

This isn’t a class or bootcamp.  
If you want to build your own, there’s a step-by-step walkthrough to help you set everything up

Tabbie is a physical project you can make, mod, or just enjoy.

---


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

An open-source robot kit powered by an ESP32 and controlled via a local React dashboard — made to teach developers hardware from scratch, by building something real.
**The desk robot that teaches you electronics — one LED, servo, and silly face at a time.**  
