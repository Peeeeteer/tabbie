<div align="center">

# 🤖 tabbie

**An open-source desk robot with a screen, a voice — and a personality.**

Currently... I still suck at this and not much works...but I'm building it piece by piece, and sharing everything I learn along the way 

[🤖 Make Your Own](https://github.com/peeeeteer/tabbie-robot) · [🗺️ Learning Roadmap](./learnings/index.md) · [📺 Follow the Build](https://www.youtube.com/@peeeeteeer)

</div>

---

## 🛠️ What Is Tabbie?

Tabbie is your little local desk assistant — a cute robot that watches, listens, speaks, and helps.
Basicly your own little twitch streamer in the corner doing faces


Tabbie connects to a your own self-hosted version — where you can:
- Talk to you using voice + face expressions 🎙️
- Help you with your day:
  - Syncs your to-do list (see, check off, or add items via voice or text)
  - Pomodoro timer with voice commands
        "Start pomodoro for: [Task Name]"
        "What are my todos for [Tag/Category]?"
  - Create Reminders.
         Drink water every 30 minutes
         Walk Dog (and yourself) once an hour
  - Website analytics to review how you spent your time


It’s like if your little small robot assistant 


## 📂 Project Structure Overview

This repository is organized to help you find your way around Tabbie's world:

```text
TABBIE/
├── make-tabbie/                 # Everything to physically build Tabbie.
│   ├── 3d-files/                # STL, CAD, and other 3D printable parts.
│   └── assembly_instructions.md # (Coming Soon) How to put it all together & extra parts you need
│
├── tabbie-learns/               # learning the basics of Arduino,ESP32, notes, and experiments to build Tabbie.
│   │                            # Great for beginners wanting to see how it's made!
│   ├── 01-arduino-uno-basic/    # Learned basics of Arduino with simple Challenges
│   └── 02-esp-32-basics/        # Learned basics of ESP32 with simple Challenges
│       └── index.md
│
├── tabbie/                      # The heart of Tabbie's software.
│   ├── esp32_firmware/          # Code running on the ESP32 (C++/Arduino).
│   │   ├── src/main.cpp
│   │   └── platformio.ini
│   ├── local_backend_server/    # Server for local development (Node.js/Python).
│   │   ├── data/                # Local JSON data files (todos, etc.).
│   │   └── server.js            # (or app.py)
│   └── react_frontend_dashboard/  # Web interface (React).
│       ├── src/App.js
│       └── package.json
│
├── CONTRIBUTING.md              # How to help make Tabbie better.
└── README.md                    # You are here!
```

## 🧠  Learning Progress so far / [Roadmap](./tabbie-learns/index.md) 
<!-- Note: You might want to update the link above if you rename the 'learnings' folder -->

I havent built it yet and I'm still learning on how to make Tabbie,  
Here’s the latest entry from my devlog 

> **🧪 02-ESP32 basics**  
> Learning to do same thing as Arduino but with ESP32  
> [📖 Read full log →](./learnings/02-esp-32-basics/README.md) <!-- Update this path too if 'learnings' is renamed -->

---
