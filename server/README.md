# MeetX Backend

This folder contains a Node.js + Express + Socket.IO backend used for signaling and basic meeting persistence.

Features:
- JWT authentication (register/login)
- Meeting creation and retrieval
- Socket.IO signaling endpoints for WebRTC (join, signal, chat, leave)

Quick start

1. Copy the example env file: `cp .env.example .env` and fill values.
2. Install dependencies:

```bash
cd server
npm install
```

3. Run in development:

```bash
npm run dev
```

Notes
- This server provides signaling only. For full multi-device audio/video you will need to integrate WebRTC peer connections in the client using the signaling events (`user-joined`, `signal`, `participants`, `user-left`).
- Use a TURN server for NAT traversal in production.
