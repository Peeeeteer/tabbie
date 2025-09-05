#!/bin/bash

echo "=== ESP32 Upload Troubleshooter ==="
echo ""

# Check if device is connected
echo "Checking for ESP32 device..."
if ls /dev/cu.usbserial* 2>/dev/null; then
    echo "✅ ESP32 detected at: $(ls /dev/cu.usbserial*)"
else
    echo "❌ No ESP32 device found!"
    echo "Please check your USB connection and cable."
    exit 1
fi

echo ""
echo "Available upload methods:"
echo "1. Standard upload (115200 baud)"
echo "2. Fast upload (460800 baud)"
echo "3. Manual esptool upload"
echo "4. Check device info"
echo ""

read -p "Choose method (1-4): " choice

case $choice in
    1)
        echo "Trying standard upload..."
        pio run --target upload
        ;;
    2)
        echo "Trying fast upload..."
        pio run -e esp32dev_alt --target upload
        ;;
    3)
        echo "Trying manual esptool..."
        echo "Make sure ESP32 is in boot mode (hold BOOT, press RESET, release BOOT)"
        read -p "Press Enter when ready..."
        esptool.py --chip esp32 --port /dev/cu.usbserial-310 --baud 115200 --before default_reset --after hard_reset write_flash 0x1000 .pio/build/esp32dev/firmware.bin
        ;;
    4)
        echo "Checking device info..."
        esptool.py --chip esp32 --port /dev/cu.usbserial-310 --baud 115200 chip_id
        ;;
    *)
        echo "Invalid choice"
        ;;
esac
