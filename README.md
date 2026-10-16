# SyncCanvas

**One canvas. Everyone's hands on it.**

SyncCanvas is a real-time collaborative whiteboard, think Excalidraw, but with built-in architecture components, smart connectors, private rooms and an AI assistant. Draw freely with friends, or lay out a full system design with your team, and watch every change appear live for everyone in the room.

**Live demo:** [sync-canvas-three.vercel.app](https://sync-canvas-three.vercel.app)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Using the App](#using-the-app)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Security](#security)
- [Deployment](#deployment)
- [API Testing (Postman)](#api-testing-postman)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Author](#author)

---

## Features

### Real-time collaboration
- Multiple users edit the same canvas at the same time, with no refresh and no conflicts.
- Powered by **Yjs (CRDTs)**, so concurrent edits merge cleanly even when users are on slow connections.
- Live multiplayer presence through Yjs awareness (who is in the room, where their cursor is).
- Optimistic UI: your own changes render instantly, then sync to everyone else.

### Canvas and drawing
- 2D canvas rendered with **react-konva (Konva.js)**.
- Shapes, lines, arrows and text, all with drag-and-drop, resize and rotate.
- Inline text editing directly on the canvas.
- **Properties panel** to control stroke colour, fill, stroke width and stroke style.

### Architecture components
A ready-made toolbar of system design nodes you can drop onto the canvas:

`Server` · `Database` · `Cloud` · `Client` · `Queue` · `Worker` · `Internet` · `Mobile` · `Auth`

Node icons are SVG-based and keep a constant line thickness when you scale them.

### Smart Magnetic Arrows
Arrows lock onto the nodes at both ends (`startId` / `endId`). Drag a node and every connected arrow follows it automatically.

### Local-first Undo / Redo
Undo and redo are handled with `Y.UndoManager`, so they only affect **your own** changes and never undo what a teammate just drew. Shortcuts are ignored while you are typing in a text field.

### Syncy, the AI assistant
Syncy is a general-purpose AI built into the canvas. Type a prompt and it draws the nodes for you, placing them on the board and connecting them. It is powered by the **Gemini API**. For example: *"Draw a URL shortener with a load balancer, two API servers, Redis cache and a database."*

### Dual-key room security
Rooms are protected by two keys:
1. a **cryptographic room token**, and
2. a **6-digit PIN**.

PIN attempts are **rate-limited** to stop brute-forcing.

### Landing page
A dark, modern landing page with a live mini-canvas demo, animated grid background, scrolling ribbon, and sections explaining the collaboration engine and how it works.

---

## Tech Stack

### Frontend
| Purpose | Tools |
|---|---|
| Framework / build | React, Vite |
| Styling | Tailwind CSS (dark theme, glassmorphism) |
| Canvas rendering | react-konva, Konva.js |
| Real-time state | Yjs, y-socket.io |
| Transport | Socket.IO Client |

### Backend
| Purpose | Tools |
|---|---|
| Runtime / server | Node.js, Express |
| Real-time | Socket.IO, y-socket.io |
| Config | dotenv |
| AI | Gemini API (powers Syncy) |

### Tooling and deployment
Vercel (frontend) · Render (backend) · Docker · Postman

---

## How It Works

```text
   User A            User B            User C
     |                 |                 |
  React + Konva     React + Konva     React + Konva
     |                 |                 |
  Yjs Y.Doc         Yjs Y.Doc         Yjs Y.Doc
     |                 |                 |
     +-------- y-socket.io / Socket.IO --+
                       |
              Node.js + Express server
                (room validation,
                 token + PIN check)
```

1. Every shape on the canvas lives in a shared Yjs map (`shapesMap`).
2. `CanvasBoard` renders that map as Konva elements and writes changes back into it.
3. `y-socket.io` sends only the small Yjs updates over Socket.IO to the server, which relays them to everyone in the same room.
4. Because Yjs is a CRDT, all clients converge to the same state regardless of the order updates arrive in.

---

## Project Structure

> Core files are listed below. Folders such as `components/landing` and `components/ReactBits` hold the landing page pieces.

```text
SyncCanvas/
├── Backend/
│   ├── public/                # Frontend production build served by Express
│   ├── .config.env            # Environment variables (not committed)
│   ├── package.json
│   └── server.js              # Express + Socket.IO + y-socket.io server
│
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Workspace.jsx          # Y.Doc, SocketIOProvider, awareness, UndoManager
│   │   │   ├── CanvasBoard.jsx        # Konva rendering engine, drag / transform
│   │   │   ├── ArchitectureNodes.jsx  # SVG icon registry for architecture nodes
│   │   │   ├── Toolbars.jsx           # Top tool bar + left node bar
│   │   │   ├── PropertiesPanel.jsx    # Stroke / fill / width / style controls
│   │   │   ├── landing/               # Landing page sections
│   │   │   └── ReactBits/             # Animated UI components
│   │   ├── LandingPage.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── postman/                   # Postman collection
├── .dockerignore
├── .gitignore
├── dockerfile
├── Docker_AWS_Deployment_Notes.pdf
├── package.json
├── vercel.json
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18 or newer
- npm
- Git

### 1. Clone the repository
```bash
git clone https://github.com/gouthamkulall615-art/SyncCanvas.git
cd SyncCanvas
```

### 2. Install dependencies
```bash
cd Backend
npm install

cd ../Frontend
npm install
```

### 3. Configure environment variables
Create `Backend/.config.env` (see [Environment Variables](#environment-variables)).

### 4. Run the app
Open two terminals.

**Backend**
```bash
cd Backend
npm run dev
```
Runs at `http://localhost:5000`.

**Frontend**
```bash
cd Frontend
npm run dev
```
Runs at `http://localhost:5173`.

### 5. Try the collaboration
1. Open `http://localhost:5173` and create a room.
2. Copy the room link and PIN.
3. Open the link in a second browser window or an incognito window and join with the PIN.
4. Draw in one window and watch it appear in the other.

---

## Environment Variables

**`Backend/.config.env`**
```env
PORT=5000
GEMINI_API_KEY=your-gemini-api-key
# Add any other secrets your setup uses, for example:
# ROOM_TOKEN_SECRET=your-long-random-string
```

Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey). Syncy will not work without it.

Never commit this file. Make sure `.config.env` and `node_modules/` are in `.gitignore`.

---

## Available Scripts

### Backend (`/Backend`)
| Command | What it does |
|---|---|
| `npm run dev` | Start the server with Nodemon (auto-reload) |
| `npm start` | Start the server with Node |

### Frontend (`/Frontend`)
| Command | What it does |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Using the App

- **Create a room** to get a shareable link and a 6-digit PIN.
- **Pick a tool** from the top toolbar (select, shapes, arrow, text, and so on).
- **Drop architecture nodes** from the left toolbar.
- **Connect nodes** with arrows. They stay attached when you move the nodes.
- **Style anything** from the properties panel on the right.
- **Ask Syncy** to draw nodes from a text prompt.
- **Double-click text** to edit it in place.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + Z` | Undo (your changes only) |
| `Ctrl + Y` | Redo |

---

## Security

- Rooms use a **dual-key system**: cryptographic token plus a 6-digit PIN.
- PIN verification is **rate-limited** to block brute-force attempts.
- Secrets, including the Gemini API key, live in environment variables and are never committed.
- Use HTTPS and secure WebSockets (`wss://`) in production.

---

## Deployment

SyncCanvas is deployed as two separate services.

| Part | Platform |
|---|---|
| Frontend | Vercel |
| Backend (Express + Socket.IO) | Render |

### Backend on Render
1. Create a new **Web Service** on [Render](https://render.com) and connect this repository.
2. Set the root directory to `Backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add your environment variables (`GEMINI_API_KEY` and the others from `.config.env`) in Render's **Environment** tab.
6. Deploy and copy the Render URL.

> Render's free tier spins services down when idle, so the first connection after a break can take a few seconds.

### Frontend on Vercel
1. Import the repository on [Vercel](https://vercel.com).
2. Set the root directory to `Frontend` (the repo includes a `vercel.json`).
3. Point the frontend's socket and API URL at your Render backend URL.
4. Deploy.

Live demo: [sync-canvas-three.vercel.app](https://sync-canvas-three.vercel.app)

### Docker (optional)
```bash
docker build -t syncanvas .
docker run -p 5000:5000 syncanvas
```
Notes for running the Docker image on AWS are in [`Docker_AWS_Deployment_Notes.pdf`](./Docker_AWS_Deployment_Notes.pdf).

### Serving the frontend from Express (optional)
```bash
cd Frontend
npm run build
# copy Frontend/dist into Backend/public, then start the backend
```

---

## API Testing (Postman)

A Postman collection is included in the `postman/` folder. Import it into Postman to test the backend endpoints.

---

## Roadmap

- [ ] Persistent boards (database storage and autosave)
- [ ] User accounts and OAuth login
- [ ] Version history
- [ ] Export to PNG / SVG / PDF
- [ ] Live cursors with names and colours
- [ ] Comments on the canvas
- [ ] More architecture node types and templates

---

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push the branch: `git push origin feature/your-feature`
5. Open a pull request.

---

## License

Currently intended for educational and portfolio purposes. A formal open-source license can be added later.

---

## Author

**Goutham M**
Second-year CSE student at UVCE, Bengaluru

- GitHub: [gouthamkulall615-art](https://github.com/gouthamkulall615-art)
- LinkedIn: [goutham-m-ba2224385](https://www.linkedin.com/in/goutham-m-ba2224385)
- Portfolio: [portfolio2-0-pearl-omega.vercel.app](https://portfolio2-0-pearl-omega.vercel.app)
