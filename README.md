# Soft Body Physics Engine

A soft body physics simluation written in JavaScript, based on my previous cloth simulation using Verlet integration and constraints, and the game Jelly Car. Rendered with [PixiJS](https://pixijs.com/).

![Cloth Simulation Screenshot](https://github.com/Ryan-Axtell-abc/soft-body-sim/blob/main/assets/screenshot.png)

## Demo

[Live Demo Link](https://softbody.ryanaxtell.dev/)

# Controls

| Command          | Action         |
|------------------|----------------|
| **Left click**   | Drag shapes    |
| **Middle Click** | High grav mode |
| **Right click**  | Delete shapes  |

## Installation

### Prerequisites

- **Node.js** (v12 or higher recommended)
- **npm** (comes with Node.js)

### Clone the Repository

```bash
git clone https://github.com/Ryan-Axtell-abc/soft-body-sim.git
cd soft-body-sim
```

### Install Dependencies

```bash
npm install
```

## Usage

### Running the Simulation

```bash
npx vite
```

Open your web browser and navigate to `http://localhost:5173` to view the simulation.

### Building for Production

```bash
npx vite build
```

The production-ready files will be in the `dist/` directory.