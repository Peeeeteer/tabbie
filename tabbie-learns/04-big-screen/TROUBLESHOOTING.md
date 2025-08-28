# ST7735S Black Screen Troubleshooting Guide

## Quick Checklist

### 1. Physical Connections ✅
- [ ] **VDD** → **3V3** (NOT 5V!)
- [ ] **GND** → **GND** 
- [ ] **BLK** → **GND** (backlight control)
- [ ] **CS** → **D5**
- [ ] **DC** → **D2** 
- [ ] **RST** → **D4**
- [ ] **SDA** → **D23**
- [ ] **SCL** → **D18**

### 2. Soldering vs Breadboard
**Breadboard connections are often unreliable for SPI displays!**
- Try **soldering** the connections if using breadboard
- Or use **female-to-female jumper wires** with good contact
- Check for **loose connections** - wiggle wires gently

### 3. Power Issues
- **Use 3.3V ONLY** - 5V will damage the display
- **Check voltage** with multimeter if possible
- **Try external 3.3V power** if ESP32 power is insufficient

## Step-by-Step Debugging

### Step 1: Check Serial Monitor
Upload the test code and check Serial Monitor output:
```
pio device monitor --baud 115200
```

You should see:
- "✓ SPI initialized"
- "✓ Display init completed"
- "Test 1: Filling with WHITE..."

### Step 2: Try Different Driver Settings
If still black, try these different configurations:

#### Option A: ST7735_GREENTAB (current)
```ini
-DST7735_GREENTAB=1
```

#### Option B: ST7735_REDTAB
```ini
-DST7735_REDTAB=1
```

#### Option C: ST7735_BLACKTAB
```ini
-DST7735_BLACKTAB=1
```

### Step 3: Try Different Pins
Some ESP32 boards have different pin mappings:

#### Alternative Pin Set 1:
- **CS** → **D15**
- **DC** → **D2** 
- **RST** → **D4**
- **SDA** → **D23**
- **SCL** → **D18**

#### Alternative Pin Set 2:
- **CS** → **D5**
- **DC** → **D4** 
- **RST** → **D2**
- **SDA** → **D23**
- **SCL** → **D18**

### Step 4: Check Display Type
Your display might be:
- **ST7735S** (most common)
- **ST7735** (older version)
- **ST7789** (different driver)

## Common Solutions

### 1. Backlight Issue
- **BLK pin must be connected to GND** to turn on backlight
- Try connecting BLK to 3V3 instead of GND (some displays are inverted)

### 2. Reset Timing
- Add longer delays after reset
- Try pressing reset button manually

### 3. SPI Speed
- Lower SPI frequency if display is unstable
- Try: `-DSPI_FREQUENCY=10000000`

### 4. Display Orientation
- Try different rotation settings (0, 1, 2, 3)
- Some displays are mounted differently

## Hardware Tests

### 1. Multimeter Test
- Check voltage on VDD pin (should be 3.3V)
- Check continuity on all connections

### 2. Visual Inspection
- Look for **cold solder joints**
- Check for **shorts** between pins
- Verify **pin alignment** on display

### 3. Alternative Display
- If possible, test with another ST7735S display
- This will confirm if it's a hardware or software issue

## Software Solutions

### 1. Different Library
Try Adafruit's ST7735 library instead:
```ini
lib_deps = 
    adafruit/Adafruit ST7735 and ST7789 Library@^1.10.1
```

### 2. Manual SPI Configuration
Add this to your code:
```cpp
SPI.begin(18, -1, 23, 5); // SCLK, MISO, MOSI, CS
```

## Final Checklist

If still black screen:
1. ✅ All connections soldered properly
2. ✅ Using 3.3V power
3. ✅ BLK connected to GND
4. ✅ Tried different driver settings
5. ✅ Tried different pins
6. ✅ Checked Serial Monitor output
7. ✅ Display is not damaged

**Most common fix**: Proper soldering of connections instead of breadboard!
