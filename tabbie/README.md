# Local Development Setup for Tabbie Software

This guide will walk you through setting up Tabbie's software components (frontend dashboard and ESP32 firmware) to run on your local machine. This is for developers who want to modify the code, contribute, or just see how it works under the hood.

## 1. Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Git:** For cloning the repository.
*   **Node.js:** JavaScript runtime (which includes **npm**). We recommend version 18.x or later (as specified in `tabbie/package.json`). You can download it from [nodejs.org](https://nodejs.org/).
*   **Python:** Required by PlatformIO, which is used for ESP32 firmware development. Download from [python.org](https://www.python.org/downloads/). Ensure Python is added to your system's PATH during installation.
*   **(Optional but Recommended) PlatformIO Core CLI:** While the project tries to use a local version via npm scripts, having the [PlatformIO Core CLI](https://platformio.org/install/cli) installed globally can sometimes be smoother, especially for managing ESP32 toolchains and drivers.
*   **ESP32 Hardware:** An ESP32 development board if you intend to run and test the firmware.

## 2. Cloning the Repository

If you haven't already, clone the Tabbie main repository:

```bash
git clone https://github.com/peeeeteer/tabbie-robot.git
cd tabbie-robot
```

## 3. Software Setup (The Easy Way!)

All Tabbie's software components (frontend, firmware dependencies) can be set up and started with a single command from the `tabbie` sub-directory.

1.  **Navigate to the Tabbie software directory:**
    ```bash
    cd tabbie
    ```

2.  **Install all dependencies and start development servers:**
    ```bash
    npm run setup-and-run-dev
    ```

**What this command does:**

*   Installs necessary Node.js packages for the main orchestration script (like `concurrently`) using `npm ci`.
*   Installs all dependencies for the `react_frontend_dashboard` using `npm ci`.
*   Installs ESP32 firmware libraries using PlatformIO (defined in `esp32_firmware/platformio.ini`).
*   After installations, it will attempt to:
    *   Start the React frontend development server.
    *   Build, upload the firmware to your connected ESP32, and start the serial monitor.

## 4. What to Expect

*   The **React Frontend Dashboard** should become accessible in your web browser (typically at a `http://localhost:xxxx` address – the exact port will be shown in your terminal).
*   The **ESP32 Firmware** will be compiled and uploaded. The PlatformIO serial monitor will open in your terminal, showing any `Serial.print()` messages from the ESP32.
    *   **Note for first-time PlatformIO use:** The very first time PlatformIO builds for a new environment (like ESP32), it will download the necessary compilers and toolchains. This can take a few minutes.
    *   Ensure your ESP32 is connected via USB and the correct port is usually auto-detected by PlatformIO. If you have issues, you might need to specify the upload port in `tabbie/esp32_firmware/platformio.ini` or use PlatformIO's device management commands.

## 5. Manual Steps & Alternative Commands

The `npm run setup-and-run-dev` command is a convenient wrapper. You can also run steps individually from the `tabbie/` directory:

*   **Install all dependencies only (run each command separately):**
    ```bash
    npm run install:root-deps
    npm run install:frontend-deps
    npm run install:firmware-deps 
    ```
    *Note: `npm run install:root-deps` is equivalent to `npm ci` in the `tabbie/` directory. `npm run install:frontend-deps` runs `npm ci` in the `react_frontend_dashboard/` directory.*

*   **Run just the frontend development server:**
    ```bash
    npm run dev:frontend
    ```

*   **Build, upload, and monitor firmware (after dependencies are installed):**
    ```bash
    cd esp32_firmware
    pio run -t upload && pio device monitor --baud 115200
    cd .. 
    ```
    (Or use `npm run dev:firmware-upload-monitor` from the `tabbie/` directory).

*   **Monitor firmware (if already uploaded):**
    ```bash
    npm run dev:firmware-monitor
    ```

## 6. Troubleshooting

*   **Python/PlatformIO issues:** Ensure Python is correctly installed and in your PATH. If `platformio` commands fail, try installing the PlatformIO Core CLI globally (`pip install -U platformio`) and ensure it's in your PATH.
*   **Frontend port conflicts:** If the default port for the React app is in use, the dev server might pick another one or error. Check the terminal output.
*   **ESP32 upload issues:** Check USB connection, board selection in `platformio.ini`, and ensure no other serial monitors are connected to that port.
*   **`npm ci` failures:** If `npm ci` fails, it's likely because there's no `package-lock.json` file or it's out of sync with `package.json`. Try running `npm install` first in the respective directory (`tabbie/` or `tabbie/react_frontend_dashboard/`) to generate/update the lock file, then commit the `package-lock.json` file. After that, `npm ci` should work for subsequent clean installs.

Happy tinkering with Tabbie! 