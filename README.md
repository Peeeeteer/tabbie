<div align="center">

# 🤖 Tabbie  
Ever wanted a **to-do app with a Cute Face**? One that lives on your desk?

**That's Tabbie.**

[🛠️ Make Tabbie](https://tabbie.me) · [📺 Follow the build](https://www.youtube.com/@LloydDecember1) · [👥 Join the community](https://www.reddit.com/r/deskbuddy/)

</div>

---

## 🧠 What is Tabbie?



**Tabbie is a DIY desk robot that helps you work, focus, and learn.**  
It's like a to-do app — but physical, local, and full of personality.

Tabbie lives on your desk, connects to your computer, and helps with small daily things like:
- ✅ Managing your to-do list
- ⏲️ Running Pomodoro timers
- 🔔 Setting reminders (like "drink water every 30 mins")
- 😋 Making faces, moving around, and being silly
- 🗣️ Talking to you (coming soon!)

**Think:** a mini Twitch streamer sitting on your desk, cheering you on — but also keeping you on track.


https://github.com/user-attachments/assets/8622418c-c75d-4014-b173-b217fcf1de87



## ✨ Made to Be Built

Tabbie is open-source and totally customizable.  
You can build it yourself with 3D-printed parts and off-the-shelf components — or just buy a Kit.

Powered by:
- 🧠 An ESP32 microcontroller
- 🖥️ A local React dashboard that talks to the robot
- 🎨 3D-printed body with custom designs and colors

---

## 🚀 Get Started (STIL WIP, should be finished by 1. Okt 2025)

Start with the step-by-step guide:
- 👉 See: [`docs/get_started.md`](docs/get_started.md)

That guide covers:
- Installing the Dashboard
- Flashing the ESP32 firmware
- Connecting the dashboard to your Tabbie
- First run checklist

**📚 Dont know anything about electronics?**  
Go here and get started → [`docs/learning/README.md`](docs/learning/README.md) — This is my mini-roadmap that I did... try learning the same _(not sure if its the best and Im kinda stupid but yea)_

---

## 🗂️ Project Structure

```txt
tabbie/
├── app/                      # React control panel
│
├── firmware/                 # Code that runs on devices
│
├── hardware/                 # Physical build assets
│   └── 3d-models/            # STL/CAD files
│
├── docs/                     # Docs (kept simple for now)
│   ├── get_started.md
│   └── learning/
│
├── CONTRIBUTING.md
└── README.md
```

---

## 🤝 Contributing

Contributions are welcome — from code to docs to 3D models.  
See [`CONTRIBUTING.md`](CONTRIBUTING.md) to get started.
