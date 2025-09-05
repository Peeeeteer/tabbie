#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// Configuration
const ESP32_PROJECT_PATH = '../../tabbie-learns/03-esp-32-led-screens';
const ENV_FILE_PATH = path.join(ESP32_PROJECT_PATH, '.env');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  return fs.existsSync(ENV_FILE_PATH);
}

function promptForWiFiCredentials() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    log('\n🔧 First-time ESP32 Setup', 'bold');
    log('We need your WiFi credentials to connect your ESP32 to the network.\n', 'blue');

    rl.question('📶 WiFi Network Name (SSID): ', (ssid) => {
      rl.question('🔐 WiFi Password: ', (password) => {
        rl.close();
        resolve({ ssid, password });
      });
    });
  });
}

function createEnvFile(ssid, password) {
  const envContent = `WIFI_SSID=${ssid}\nWIFI_PASSWORD=${password}\n`;
  fs.writeFileSync(ENV_FILE_PATH, envContent);
  log(`✅ Created .env file with WiFi credentials`, 'green');
}

function uploadToESP32() {
  log('\n📤 Uploading code to ESP32...', 'blue');
  try {
    const result = execSync('pio run --target upload', { 
      cwd: ESP32_PROJECT_PATH,
      stdio: 'pipe'
    });
    log('✅ Successfully uploaded to ESP32!', 'green');
    return true;
  } catch (error) {
    log('❌ Failed to upload to ESP32:', 'red');
    log(error.message, 'red');
    log('\nPlease check:', 'yellow');
    log('• ESP32 is connected via USB', 'yellow');
    log('• PlatformIO is installed (pip install platformio)', 'yellow');
    return false;
  }
}

async function discoverESP32IP() {
  log('\n🔍 Discovering ESP32 IP address...', 'blue');
  
  // Get local network subnet
  const getLocalSubnet = () => {
    try {
      const result = execSync('route -n get default | grep interface', { stdio: 'pipe' });
      const networkInterface = result.toString().trim().split(':')[1].trim();
      
      const ipResult = execSync(`ifconfig ${networkInterface} | grep 'inet ' | awk '{print $2}'`, { stdio: 'pipe' });
      const localIP = ipResult.toString().trim();
      
      // Extract subnet (e.g., 192.168.2.x)
      const parts = localIP.split('.');
      return `${parts[0]}.${parts[1]}.${parts[2]}.`;
    } catch (error) {
      // Fallback to common subnets
      return ['192.168.1.', '192.168.2.', '192.168.0.'];
    }
  };

  const testESP32Connection = async (ip) => {
    return new Promise((resolve) => {
      const { spawn } = require('child_process');
      const curl = spawn('curl', ['-s', '--connect-timeout', '2', `http://${ip}/face/status`]);
      
      let data = '';
      curl.stdout.on('data', (chunk) => {
        data += chunk;
      });
      
      curl.on('close', (code) => {
        if (code === 0 && data.includes('currentFace')) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
      
      curl.on('error', () => resolve(false));
    });
  };

  // Generate IPs to scan
  const subnets = Array.isArray(getLocalSubnet()) ? getLocalSubnet() : [getLocalSubnet()];
  const ipsToScan = [];
  
  for (const subnet of subnets) {
    // Scan common ESP32 IP ranges
    for (let i = 50; i <= 200; i += 2) {
      ipsToScan.push(`${subnet}${i}`);
    }
  }

  // Scan IPs in batches for speed
  const batchSize = 10;
  for (let i = 0; i < ipsToScan.length; i += batchSize) {
    const batch = ipsToScan.slice(i, i + batchSize);
    const promises = batch.map(testESP32Connection);
    const results = await Promise.all(promises);
    
    for (let j = 0; j < results.length; j++) {
      if (results[j]) {
        const foundIP = batch[j];
        log(`✅ Found ESP32 at: ${foundIP}`, 'green');
        return foundIP;
      }
    }
    
    // Show progress
    process.stdout.write('.');
  }
  
  log('\n❌ Could not find ESP32 on network', 'red');
  log('Please check:', 'yellow');
  log('• ESP32 is powered on', 'yellow');
  log('• ESP32 connected to WiFi successfully', 'yellow');
  log('• ESP32 and computer are on same network', 'yellow');
  return null;
}

function startFrontend(esp32IP) {
  log(`\n🚀 Starting frontend with ESP32 at ${esp32IP}...`, 'blue');
  
  // Create .env.local with ESP32 IP
  const envLocalContent = `VITE_ESP32_URL=http://${esp32IP}\n`;
  fs.writeFileSync('.env.local', envLocalContent);
  
  // Start the frontend
  const frontend = spawn('npm', ['run', 'dev'], { 
    stdio: 'inherit',
    env: { ...process.env, VITE_ESP32_URL: `http://${esp32IP}` }
  });
  
  frontend.on('close', (code) => {
    log(`\nFrontend exited with code ${code}`, code === 0 ? 'green' : 'red');
  });
}

async function main() {
  log('🤖 Tabbie ESP32 Setup & Launch', 'bold');
  log('========================================\n', 'blue');

  // Step 1: Check if WiFi setup is needed
  if (!checkEnvFile()) {
    log('🔧 First-time setup detected', 'yellow');
    const { ssid, password } = await promptForWiFiCredentials();
    createEnvFile(ssid, password);
  } else {
    log('✅ WiFi credentials already configured', 'green');
  }

  // Step 2: Upload to ESP32
  if (!uploadToESP32()) {
    process.exit(1);
  }

  // Step 3: Wait for ESP32 to boot and connect
  log('\n⏳ Waiting for ESP32 to connect to WiFi...', 'blue');
  await new Promise(resolve => setTimeout(resolve, 8000)); // Wait 8 seconds

  // Step 4: Discover ESP32 IP
  const esp32IP = await discoverESP32IP();
  if (!esp32IP) {
    log('\n❌ Setup failed - could not connect to ESP32', 'red');
    process.exit(1);
  }

  // Step 5: Start frontend
  startFrontend(esp32IP);
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\n👋 Setup cancelled by user', 'yellow');
  process.exit(0);
});

main().catch((error) => {
  log(`\n❌ Setup failed: ${error.message}`, 'red');
  process.exit(1);
}); 