# Server Check Checklist

## Quick Diagnostics

### 1. Check if Node.js process is running

```bash
ps aux | grep node
```

### 2. Check if port 3000 is listening

```bash
netstat -tulpn | grep :3000
# or
ss -tulpn | grep :3000
```

### 3. Check API health locally

```bash
curl http://localhost:3000/api/v1/health
```

### 4. Check API health externally

```bash
curl http://64.226.94.133/api/v1/health
```

### 5. Check application logs

```bash
# If using PM2
pm2 logs

# If running directly
tail -f ~/gogomarket/backend/logs/*.log
```

### 6. Check firewall status

```bash
sudo ufw status
```

## Common Issues & Fixes

### Issue: Server not starting

```bash
cd ~/gogomarket/backend
npm install
npm run dev
```

### Issue: Port already in use

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Issue: Database connection failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart if needed
sudo systemctl restart postgresql
```

### Issue: Environment variables missing

```bash
# Check .env file exists
cat ~/gogomarket/backend/.env

# Copy from example if missing
cp .env.example .env
```

## Start Server Commands

### Development mode

```bash
cd ~/gogomarket/backend
npm run dev
```

### Production mode with PM2

```bash
cd ~/gogomarket/backend
npm run build
pm2 start dist/app.js --name gogomarket-api
pm2 save
```

### Auto-start on reboot

```bash
pm2 startup
pm2 save
```

## Health Check Endpoints

| Endpoint | Expected Response |
|----------|-------------------|
| `/api/v1/health` | `{"success":true,"message":"GoGoMarket API is running"}` |
| `/` | `{"success":true,"message":"Welcome to GoGoMarket API"}` |

## Current Status

- **Web:** http://64.226.94.133/ - Working
- **API:** http://64.226.94.133/api/v1/health - Working
- **Last Check:** 2026-01-16
