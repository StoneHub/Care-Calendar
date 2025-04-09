# Local Network Access for Care Calendar

This document provides information about the local network access feature implemented in Care Calendar, which allows you to view the calendar on smart fridges and other household devices.

## Overview

The Care Calendar application now supports access from any device on your local network, making it easy to view and update care schedules from:

- Smart fridges (Samsung Tizen OS)
- Tablets (Android, iOS, Windows)
- Laptops and desktops (Windows, macOS, Linux)
- Mobile phones (Android, iOS)

## Accessing Care Calendar on Your Network

There are two ways to access Care Calendar on your local network:

### 1. Using Hostname (Recommended)

The application is now automatically advertised on your local network using mDNS (Bonjour/Avahi). This means you can access it using a friendly name:

```
http://care-calendar.local:5173
```

For the backend API (if needed):
```
http://care-calendar-api.local:3001
```

### 2. Using IP Address

If the hostname method doesn't work (some devices don't support mDNS), you can access the application using the server's IP address:

1. Find the IP address of the computer running Care Calendar
   ```
   Windows: Open Command Prompt and type "ipconfig"
   Mac/Linux: Open Terminal and type "ifconfig" or "ip addr"
   ```

2. Access the application using:
   ```
   http://[IP_ADDRESS]:5173
   ```

## Smart Display Optimization

The application is now optimized for display on smart devices:

- Full-screen mode support for smart fridges and tablets
- Touch-friendly controls
- Responsive design that works on various screen sizes

## Common Issues

### Can't Connect Using Hostname

If you can't connect using the `care-calendar.local` address:

1. Check if your device supports mDNS/Bonjour:
   - Windows: Install Bonjour Print Services
   - Android: Most modern Android devices support mDNS
   - iOS/macOS: Natively supported
   - Samsung Tizen: Support varies by model, try IP address method

2. Try using the IP address method instead

### Application Not Showing on Network

If you can't access the application at all:

1. Ensure both the frontend and backend servers are running:
   ```
   npm run dev:all
   ```

2. Check your firewall settings to allow connections on ports 5173 (frontend) and 3001 (backend)

3. Verify that all devices are on the same network

## Technical Implementation

The local network access feature was implemented with these components:

1. **Frontend Server Configuration**: Modified Vite server to listen on all network interfaces
2. **Backend Server Configuration**: Express server now listening on all network interfaces
3. **mDNS Service**: Added Bonjour service for network discovery
4. **Smart Display Optimization**: Added appropriate meta tags for full-screen mode on mobile devices

## Planned Improvements

Future improvements for the local network access feature:

1. Add support for HTTPS (for more secure access)
2. Implement basic authentication for the calendar
3. Add device-specific optimizations for Samsung Tizen OS
4. Create an installable PWA (Progressive Web App) for easier access