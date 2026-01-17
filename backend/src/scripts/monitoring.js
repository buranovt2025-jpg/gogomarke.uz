#!/usr/bin/env node
/**
 * GoGoMarket Monitoring Script
 * Health check and basic metrics (no external dependencies)
 */

const http = require('http');
const https = require('https');
const os = require('os');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL || '30000'); // 30 seconds

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function getSystemMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(2);
  
  const cpus = os.cpus();
  const cpuLoad = os.loadavg()[0]; // 1 minute load average
  
  return {
    memory: {
      total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      used: (usedMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      free: (freeMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
      usagePercent: memUsagePercent + '%',
    },
    cpu: {
      cores: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      loadAvg: cpuLoad.toFixed(2),
    },
    uptime: (os.uptime() / 3600).toFixed(2) + ' hours',
    platform: os.platform(),
    hostname: os.hostname(),
  };
}

function checkEndpoint(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      const duration = Date.now() - startTime;
      resolve({
        status: res.statusCode,
        duration,
        healthy: res.statusCode >= 200 && res.statusCode < 400,
      });
    });
    
    req.on('error', (error) => {
      resolve({
        status: 0,
        duration: Date.now() - startTime,
        healthy: false,
        error: error.message,
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        status: 0,
        duration: 5000,
        healthy: false,
        error: 'Timeout',
      });
    });
  });
}

async function runHealthCheck() {
  log('========================================', 'cyan');
  log('GoGoMarket Health Check', 'cyan');
  log('========================================', 'cyan');
  
  // System metrics
  const metrics = getSystemMetrics();
  log('System Metrics:', 'blue');
  console.log('  Memory:', metrics.memory.used, '/', metrics.memory.total, `(${metrics.memory.usagePercent})`);
  console.log('  CPU Load:', metrics.cpu.loadAvg, `(${metrics.cpu.cores} cores)`);
  console.log('  Uptime:', metrics.uptime);
  console.log('  Platform:', metrics.platform);
  
  // API Health Check
  log('API Health Check:', 'blue');
  const endpoints = [
    { name: 'Health', url: `${API_URL}/api/v1/health` },
    { name: 'Products', url: `${API_URL}/api/v1/products?limit=1` },
    { name: 'Stories', url: `${API_URL}/api/v1/stories` },
  ];
  
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint.url);
    const statusColor = result.healthy ? 'green' : 'red';
    const statusText = result.healthy ? '✓ OK' : '✗ FAIL';
    log(`  ${endpoint.name}: ${statusText} (${result.status}) - ${result.duration}ms`, statusColor);
    if (result.error) {
      log(`    Error: ${result.error}`, 'red');
    }
  }
  
  // Memory warning
  if (parseFloat(metrics.memory.usagePercent) > 80) {
    log('⚠ Warning: Memory usage is high!', 'yellow');
  }
  
  // CPU warning
  if (parseFloat(metrics.cpu.loadAvg) > metrics.cpu.cores) {
    log('⚠ Warning: CPU load is high!', 'yellow');
  }
  
  log('========================================', 'cyan');
}

// Run once or continuously
if (process.argv.includes('--watch') || process.argv.includes('-w')) {
  log('Starting continuous monitoring (Ctrl+C to stop)...', 'cyan');
  runHealthCheck();
  setInterval(runHealthCheck, CHECK_INTERVAL);
} else {
  runHealthCheck().then(() => process.exit(0));
}
