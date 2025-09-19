# 🚀 Getting Started with Tabbie

### Hardware Kit
Buy the complete kit on Amazon:
- **EU**: [Amazon EU Link](https://amzn.to/4jXdnxq) (~22 EUR)
- **NA**: [Amazon NA Link](https://amzn.to/3GIhij3) (~25 USD)


### 3D Printed Parts
Print the body parts from the STL files:
- **Location**: `hardware/3d-models/`
- **Files needed**: `tabbie-head.stl`, `tabbie-neck.stl`


**Don't have a 3D printer?** 
- Use a local 3D printing service
- Or buy pre-printed parts (coming soon)

### Software Requirements
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **PlatformIO** (for ESP32 programming) - [Download here](https://platformio.org/)
- **Git** - [Download here](https://git-scm.com/)

---

## 🔧 Step 1: Hardware Assembly

### 1.1 Install ESP32 Drivers
Your ESP32 uses a CP2102 USB-to-UART chip. Install the drivers:

**Windows:**
1. Download CP2102 drivers from [Silicon Labs](https://www.silabs.com/developer-tools/usb-to-uart-bridge-vcp-drivers?tab=downloads)
2. Install and restart your computer
3. Connect ESP32 via USB
4. Check Device Manager - you should see "Silicon Labs CP210x USB to UART Bridge"

**macOS/Linux:**
- Drivers usually install automatically
- If not working, install via: `brew install --cask silicon-labs-vcp-driver`

### 1.2 Physical Assembly
1. **Print the 3D parts** from `hardware/3d-models/`
2. **Wire the components** according to the pinout:
   - OLED Display: SDA → GPIO 21, SCL → GPIO 22
   - Servo 1: Signal → GPIO 18
   - Servo 2: Signal → GPIO 19
   - Speaker: Signal → GPIO 25
3. **Assemble the body** - insert ESP32 and components into the 3D printed case
4. **Secure everything** with screws or hot glue

---

## 💻 Step 2: Software Setup

### 2.1 Clone the Repository
```bash
git clone https://github.com/Peeeeteer/tabbie.git
cd tabbie
```

### 2.2 Set Up the Dashboard (React App)
```bash
# Navigate to the dashboard
cd app/dashboard

# Install dependencies
npm install

# Start the development server
npm run dev
```

The dashboard will open at `http://localhost:3000`

### 2.3 Flash the ESP32 Firmware

#### Option A: Using PlatformIO (Recommended)
```bash
# Navigate to firmware directory
cd firmware

# Create environment file
cp src/env.example .env

# Edit .env with your WiFi credentials
# WIFI_SSID=your_wifi_name
# WIFI_PASSWORD=your_wifi_password

# Build and upload
pio run --target upload
```

#### Option B: Using Arduino IDE
1. Install ESP32 board support in Arduino IDE
2. Open `firmware/src/main.cpp`
3. Install required libraries:
   - Adafruit SSD1306
   - Adafruit GFX Library
4. Upload to your ESP32

### 2.4 Configure WiFi
1. **Create `.env` file** in `firmware/`:
   ```env
   WIFI_SSID=your_wifi_name
   WIFI_PASSWORD=your_wifi_password
   ```
2. **Flash the firmware** with your credentials
3. **Check the OLED display** - it will show the ESP32's IP address

---

## 🔗 Step 3: Connect Everything

### 3.1 Find Your ESP32
1. **Check the OLED display** - it shows the IP address (e.g., `192.168.1.100`)
2. **Or scan your network** - the dashboard will auto-discover the ESP32

### 3.2 Test the Connection
1. **Open the dashboard** at `http://localhost:5173`
2. **Click "Reconnect"** if the ESP32 isn't found automatically
3. **Try changing faces** - you should see the ESP32's display change

### 3.3 First Run Checklist
- [ ] ESP32 powers on and shows IP address on OLED
- [ ] Dashboard connects to ESP32 (green status indicator)
- [ ] Face changes work (default ↔ focus)
- [ ] Pomodoro timer starts and shows on ESP32
- [ ] Serial monitor shows logs in dashboard

---

## 🎯 Step 4: First Tasks

### Try These Features:
1. **Change Tabbie's face** - Click the face buttons in the dashboard
2. **Start a Pomodoro** - Go to Pomodoro tab, set a task, and start
3. **Add a task** - Go to Tasks tab and create your first todo
4. **Check the logs** - Watch the serial monitor for ESP32 activity

### Troubleshooting
**ESP32 won't connect?**
- Check WiFi credentials in `.env`
- Ensure ESP32 and computer are on same network
- Try manual IP entry in dashboard

**Dashboard won't start?**
- Run `npm install` in `app/dashboard/`
- Check Node.js version (needs v18+)
- Try `npm run dev` again

**Firmware won't upload?**
- Install CP2102 drivers
- Hold BOOT button while uploading
- Check USB cable (data, not just power)

---

## 📚 Next Steps

**Want to learn more?** Check out the step-by-step learning modules:
- [`docs/learning/README.md`](learning/README.md) - Learn the fundamentals
- Start with LED blinking, then move to servos, displays, and WiFi

**Need help?**
- Check the [Issues](https://github.com/Peeeeteer/tabbie/issues) on GitHub
- Join the community discussions
- Watch the [build videos](https://www.youtube.com/@looyd1)

---

## 🎉 You're Ready!

Your Tabbie should now be working! The robot will:
- ✅ Display faces and animations on the OLED
- ✅ Respond to dashboard commands
- ✅ Run Pomodoro timers
- ✅ Manage your tasks
- ✅ Show connection status and logs

**Happy building!** 🤖✨