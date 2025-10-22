# Getting Started with Tabbie

> STILL WORKING ON THIS - COME BACK ON NOVEMBER 1, 2025 (_but you can alrdy grab the parts on amazon now if you want save time)_

A mini Twitch streamer on your desk, cheering you on, but also keeping you focused. Lets make one


---

## What You'll Need

### The Parts (~$18 USD / ~€16 EUR total)
- **ESP32** (the robot's brain)
- **1.3" OLED Screen** (the face)
- **3D Printed Parts** (the body)
- **Jumper Wires** (connecting everything)

I recommend buying the parts on **Amazon or Aliexpress**  
**Amazon** is safe choice and fast shipping, but will be more expensive  
**Aliexpress** is cheaper, but things sometimes arrive broken and shipping takes long  

**Amazon EU:**
- [ESP32 - Pack of 2](https://amzn.to/4mDWJ6Z) (~14 EUR) 
- [OLED Screen - Pack of 3](https://amzn.to/4nxXHCO) (~18.99 EUR)
- [JumperWires -  Full pack](https://amzn.to/4mOGZ0I) (~6.40 EUR)
- [PLA Filament for 3D printing](https://amzn.to/46QfHkC) (~14 EUR)

**Amazon USA/Canada:**
- [ESP32](https://amzn.to/4mGymW4) (~13.99 USD)
- [OLED Screen](https://amzn.to/4nGTbSQ) (~17.99 USD)
- [JumperWires -  Full pack](https://amzn.to/4nFxh2a) (~6.80 USD)
- [PLA Filament for 3D printing](https://amzn.to/46yAlqL) (~13.99 USD)

**Aliexpress Worldwide:**
- [ESP32](https://amzn.to/4mGymW4) (~13.99 USD)
- [OLED Screen](https://amzn.to/4nGTbSQ) (~17.99 USD)
- [JumperWires -  Full pack](https://amzn.to/4nFxh2a) (~6.80 USD)
- [PLA Filament for 3D printing](https://amzn.to/46yAlqL) (~13.99 USD)



*These are affiliate links - I get 3% at no extra cost to you!*

## **Don't want to deal with parts & printing?** [Pre-order a complete kit here](https://www.tabbie.me/buy/kit)


<div align="center">
  <p style="font-size: 36px; font-weight: bold;">
    Let's start. How to Build Tabbie
  </p>
</div>


The video covers everything for both Windows and Mac users. 
**[Watch the step-by-step video here]** *(Thumbnail here)*


---

### STEP 1: Install & Download 


>Install:
1. **Node.js** (v18 or newer) - [Download](https://nodejs.org/) - Runs the dashboard web app
2. **Visual Studio Code** - [Download](https://code.visualstudio.com/) - Editor to view and modify code
3. **PlatformIO** (for programming the ESP32) - [Download](https://platformio.org/) - Uploads firmware to ESP32
4. **Git** - [Download Git](https://git-scm.com/)  To download via command line using `git clone`  


>Download:

**Option A: Using Git (recommended)**   

```bash
git clone https://github.com/Peeeeteer/tabbie.git
cd tabbie
```

Youll be able to update very easly in the future by just running 

```bash
cd tabbie
git pull
```

**Option B: Download as ZIP**

- Go to https://github.com/Peeeeteer/tabbie
- Click the green “Code” button
- Select “Download ZIP”
- Extract it somewhere easy to find

*[Image here showing how to download ZIP]*


### STEP 2: Print the Body/Enclosure   

1. Use the STL files from the `/hardware` folder & print
      - `tabbie-head.stl`
      - `tabbie-head.stl`
      - `tabbie-head.stl`
      - `tabbie-head.stl`
      - `tabbie-head.stl`
      - `tabbie-head.stl`

Tip: Turn on supports for `Neck.stl` and `Top_case.stl` 


### STEP 3: Install ESP32 Drivers

Your ESP32 (brains) needs special drivers to talk to your computer.

**Windows Users:**
1. Download drivers from [Silicon Labs](https://www.silabs.com/developer-tools/usb-to-uart-bridge-vcp-drivers?tab=downloads)
2. Install them
3. Plug in your ESP32 with a USB cable
4. Open Device Manager - you should see "Silicon Labs CP210x USB to UART Bridge"

**Mac/Linux Users:**
- Usually works automatically when you plug it in
- If it doesn't work, type this in Terminal: `brew install --cask silicon-labs-vcp-driver`

---

### STEP 4: Connect the Parts

**Wiring Guide:**
1. Connect the OLED screen to ESP32:
   - SCK wire → GPIO 21 (D21)
   - SDA wire → GPIO 22 (D22)
   - VDD → 3.3V 
   - GND → GND (Ground)

2. Put ESP32 into the 3D printed base
3. Thread wires through the neck piece
4. Snap the screen into the head piece


*[Short video here showing assembly]*

**Optional:** Use glue to make it extra secure (but it should stay together without it)

---

### STEP 5: Set Up the React Dashboard

Open your terminal/command and run:

```bash
# Go to the dashboard folder
cd app

# Install everything it needs
npm install

# Start it up
npm run dev
```

The dashboard will open at `http://localhost:8080` in your web browser.

---

### STEP 6: Program Your ESP32

1. **Navigate to the firmware folder:**

```bash
cd firmware
```

2. **Set up your WiFi credentials:**
   - Find the file `src/.env.example`
   - Make a copy of it in the same location
   - Rename the copy to `.env` (remove "example")
   - Open `.env` in Visual Studio Code or any text editor
   - Add your WiFi details: 

```
WIFI_SSID=your_wifi_name_here
WIFI_PASSWORD=your_wifi_password_here
```

**Tip:** Make sure its the same Wifi that your computer is connected to 

3. **Upload the code to your ESP32:**

```bash
pio run --target upload
```

**Tip:** If upload fails, hold down the BOOT button on your ESP32 while uploading
and make sure that your are in still in the `firmware`directory when uploading 


---

### STEP 7: Connect Everything Together

1. **Open the dashboard** at `http://localhost:8080` in your browser
2. **Go to the Tabbie Page**
3. **Click "Reconnect"** if it doesn't find Tabbie automatically
4. **Watch the magic!** Tabbie should start showing its idle animation

---

### Let's Use Tabbie!

**Create Tasks**
- Go to the Tasks tab
- Add things you need to do
- Check them off when you're done!
Tabbie will be happy you created a task

**Use Pomodoro Timer**
- Go to the Pomodoro tab
- Pick a task to work on
- Start the timer
Tabbie will show a focus animation to help you concentrate

**Important:**  
All your tasks/notes etc... are only saved on your computer, no one can access them.

---

## Troubleshooting

### ESP32 Won't Connect
- Double-check your WiFi name and password in the `.env` file
- Make sure your ESP32 and computer are on the same WiFi network

### Dashboard Won't Start
- Make sure you ran `npm install` in the `dashboard` folder
- Check that you have Node.js v18 or newer (type `node --version` to check)
- Try running `npm run dev` again from the `dashboard` folder

### Can't Upload Code to ESP32
- Install the CP2102 drivers (see Step 3)
- Hold the BOOT button on ESP32 while uploading
- Check your USB cable (some cables only charge, they don't transfer data)

**Need more help?** Join the community:
- [Discord](https://discord.gg/7er2Ysjc) - [Reddit](https://www.reddit.com/r/deskbuddy/) - [YouTube](https://www.youtube.com/@LloydDecember1) - [GitHub](https://github.com/Peeeeteer/tabbie)

---

## That's It!

If this helped you, consider giving the project a star on [GitHub](https://github.com/Peeeeteer/tabbie)!

Happy building!
