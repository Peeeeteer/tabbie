#!/usr/bin/env python3
"""
PlatformIO pre-build script to load WiFi credentials from .env file
This keeps credentials out of source code while allowing normal upload
"""

import os
from pathlib import Path

Import("env")

def load_env_file():
    """Load environment variables from .env file"""
    # Get the project root directory (where platformio.ini is located)
    project_dir = env.get("PROJECT_DIR")
    env_file = Path(project_dir) / ".env"
    
    print(f"🔍 Looking for .env file at: {env_file}")
    
    if not env_file.exists():
        print("⚠️  No .env file found - using default credentials")
        print("💡 Copy env.example to .env and add your WiFi credentials")
        print(f"📁 Expected location: {env_file}")
        return
    
    print("📡 Loading WiFi credentials from .env file...")
    
    wifi_ssid = None
    wifi_password = None
    
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                
                # Skip comments and empty lines
                if line.startswith('#') or not line:
                    continue
                
                print(f"📄 Processing line {line_num}: {line}")
                
                # Parse WIFI_SSID=value
                if line.startswith('WIFI_SSID='):
                    wifi_ssid = line.split('=', 1)[1].strip()
                    print(f"🔑 Found SSID: {wifi_ssid}")
                
                # Parse WIFI_PASSWORD=value
                elif line.startswith('WIFI_PASSWORD='):
                    wifi_password = line.split('=', 1)[1].strip()
                    print(f"🔐 Found password: {'*' * len(wifi_password)}")
        
        if wifi_ssid and wifi_password:
            # Add build flags with WiFi credentials
            env.Append(CPPDEFINES=[
                ('WIFI_SSID', f'\\"{wifi_ssid}\\"'),
                ('WIFI_PASSWORD', f'\\"{wifi_password}\\"')
            ])
            print(f"✅ WiFi credentials loaded successfully!")
            print(f"📶 SSID: {wifi_ssid}")
            print(f"🔒 Password: {'*' * len(wifi_password)}")
        else:
            print("❌ Invalid .env file - missing WIFI_SSID or WIFI_PASSWORD")
            print(f"🔍 SSID found: {wifi_ssid is not None}")
            print(f"🔍 Password found: {wifi_password is not None}")
            
    except Exception as e:
        print(f"❌ Error reading .env file: {e}")

# Load environment variables before build
load_env_file() 