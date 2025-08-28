# ST7735S Display Wiring Guide

## Required Libraries
- **TFT_eSPI** (version 2.5.43 or later) - Already added to platformio.ini

## Wiring Connections (Updated for your ESP32 board)

Connect your ST7735S display to the ESP32 as follows:

| Display Pin | ESP32 Pin | Description |
|-------------|-----------|-------------|
| **BLK**     | **GND**   | Backlight (connect to GND to turn on) |
| **CS**      | **D5**    | Chip Select |
| **DC**      | **D2**    | Data/Command |
| **RST**     | **D4**    | Reset |
| **SDA**     | **D23**   | MOSI (Master Out Slave In) |
| **SCL**     | **D18**   | SCLK (Serial Clock) |
| **VDD**     | **3V3**   | Power Supply |
| **GND**     | **GND**   | Ground |

## Your Actual Connections ✅
- **BLK** → **GND** (backlight control)
- **CS** → **D5** (chip select)
- **DC** → **D2** (data/command)
- **RST** → **D4** (reset)
- **SDA** → **D23** (MOSI)
- **SCL** → **D18** (SCLK)
- **VDD** → **3V3** (power)
- **GND** → **GND** (ground)

## Important Notes
1. **Power**: Using 3V3 from ESP32 ✅
2. **Backlight**: Connected to GND to turn on ✅
3. **SPI Pins**: Using hardware SPI on pins D23 (MOSI) and D18 (SCLK) ✅
4. **Display Type**: 1.8" 128x160 RGB TFT ST7735S

## Troubleshooting Black Screen

If you're seeing a black screen, the updated code will help diagnose:

1. **Test Pattern**: The code now shows a colored test pattern first
2. **Red Screen Test**: Shows red screen for 2 seconds to verify display works
3. **Serial Debug**: Check Serial Monitor for detailed progress messages
4. **Rotation**: Changed to portrait mode (rotation 0) instead of landscape

## What the Updated Code Does
1. Shows RED screen for 2 seconds
2. Shows BLACK screen for 1 second  
3. Shows colored test pattern for 3 seconds
4. Finally shows the yellow smiley face emoji

## Common Issues & Solutions
- **Still black screen**: Check all wire connections, especially power and ground
- **No backlight**: Ensure BLK is connected to GND
- **Wrong colors**: May need different driver settings
- **No display**: Verify SPI pins (D23, D18) are not conflicting with other components

## Serial Monitor Output
Open Serial Monitor at 115200 baud to see detailed progress messages that will help identify where the issue occurs.
