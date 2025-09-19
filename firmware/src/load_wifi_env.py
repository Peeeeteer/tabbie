#!/usr/bin/env python3
"""
Load WiFi credentials from wifi.env file and inject as build flags
"""
import os
from pathlib import Path

Import("env")

def escape_string(s):
    """Properly escape a string for C++ macro definition"""
    # Escape backslashes and quotes
    s = s.replace('\\', '\\\\')
    s = s.replace('"', '\\"')
    return s

# Get the project directory
project_dir = Path(env.subst("$PROJECT_DIR"))
wifi_env_path = project_dir / "wifi.env"

# Default values
wifi_ssid = ""
wifi_password = ""
force_setup = "0"

if wifi_env_path.exists():
    print(f"📡 Loading WiFi config from {wifi_env_path}")
    
    with open(wifi_env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    if key == "WIFI_SSID":
                        wifi_ssid = value
                    elif key == "WIFI_PASSWORD":
                        wifi_password = value
                    elif key == "FORCE_SETUP_MODE":
                        force_setup = value
    
    if wifi_ssid and wifi_password:
        # Properly escape the strings for C++ macros
        escaped_ssid = escape_string(wifi_ssid)
        escaped_password = escape_string(wifi_password)
        
        print(f"✅ WiFi configured: {wifi_ssid}")
        env.Append(CPPDEFINES=[
            f'PRESET_WIFI_SSID=\\"{escaped_ssid}\\"',
            f'PRESET_WIFI_PASSWORD=\\"{escaped_password}\\"',
            f'FORCE_SETUP_MODE={force_setup}'
        ])
    else:
        print("⚠️  WiFi SSID or password missing in wifi.env")
        env.Append(CPPDEFINES=[
            'PRESET_WIFI_SSID=\\"\\"',
            'PRESET_WIFI_PASSWORD=\\"\\"',
            'FORCE_SETUP_MODE=1'
        ])
else:
    print("📝 No wifi.env found - using setup mode only")
    env.Append(CPPDEFINES=[
        'PRESET_WIFI_SSID=\\"\\"',
        'PRESET_WIFI_PASSWORD=\\"\\"', 
        'FORCE_SETUP_MODE=1'
    ])
