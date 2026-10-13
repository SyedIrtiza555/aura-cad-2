# Aura Desk

<div align="center">

**High-Performance Jewelry CAD & Custom Order Management Platform**

[![CI](https://github.com/SyedIrtiza555/aura-cad-2/actions/workflows/ci.yml/badge.svg)](https://github.com/SyedIrtiza555/aura-cad-2/actions/workflows/ci.yml)
[![Release](https://img.shields.io/badge/Release-v1.0.0-gold.svg)](https://github.com/SyedIrtiza555/aura-cad-2/releases)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Tauri](https://img.shields.io/badge/Tauri-v2-24c8db.svg)](https://v2.tauri.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)

</div>

---

## 🌟 Overview

**Aura Desk** is an enterprise-grade bespoke jewelry CAD order lifecycle management system built with **React 19**, **TypeScript**, **Tailwind CSS v4**, **Zustand**, and **Tauri v2**. 

It streamlines communication and production handoffs between jewelry owners, sales agents, CAD designers, and clients with zero-leakage role-based security, automated order identifiers, seasonal date ergonomics, and real-time state synchronization.

---

## ✨ Key Features

### 1. 🏷️ Canonical 5-Tier Status Lifecycle
Orders transition through 5 deterministic, color-coded production stages:
- <span style="color:#eab308;font-weight:bold;">● Inbox (Yellow)</span> — New inquiries and quote formulations
- <span style="color:#f97316;font-weight:bold;">● In progress (Orange)</span> — Active 3D modeling and prototyping
- <span style="color:#3b82f6;font-weight:bold;">● In Review (Blue)</span> — Internal inspection and client review
- <span style="color:#22c55e;font-weight:bold;">● Delivered (Green)</span> — Completed and dispatched
- <span style="color:#6b7280;font-weight:bold;">● Backlog (Grey)</span> — Deferred or on-hold projects

### 2. 💎 Specimen & Project Taxonomy
Standardized categorization across all jewelry production flows:
- **Ring** • **Bracelet** • **Pendant** • **Earring** • **Grills** • **Necklace**

### 3. ⚡ Automated Order & WhatsApp Codes
- **Order Code**: Automatically computed as `<Designer 2-Letter Code>-<Prospect 2-Letter Code>-<Order Title>` (e.g. `FD-JS-GOLDEN-PENDANT`).
- **WhatsApp Delivery Code**: Computed as `<Designer>-<Prospect>-<Order>` for instant, error-free customer communication.

### 4. 📅 Seasonal Date Ergonomics
Human-centric timestamp presentation:
- Standard format: `13 Oct, Tue - 05:36am` (year smartly hidden for clean visual hierarchy).
- Transitional months (Nov, Dec, Jan, Feb): Automatically reveals year notation (e.g. `13 Nov, Wed, '26 - 05:14pm`) to prevent cross-year ambiguity.

### 5. 🖼️ Multi-Image Carousel
- Supports up to 5 high-resolution visual attachments per order, specimen, or profile.
- Built-in cycling carousel with thumbnail inspection.

### 6. 🛡️ Role-Based Access Control (RBAC) & Governance
- **Role Hierarchy**: `Owner` ➔ `Admin` ➔ `Designer` ➔ `Sales Agent` ➔ `Client`.
- **Quarantine Safeguard**: Newly registered accounts default strictly to `pending_approval` and `unassigned`.
- **Financial Redaction**: Designers are protected from seeing sensitive pricing and client contact fields (`agreed_price`, `client_phone`).
- **Administrative Control**: Owners and Admins can update roles, modify member details, terminate accounts, or remove orders.

### 7. ⚙️ Global Settings Modal
- Accessible directly from the sidebar user avatar.
- Includes tabs for **Account Settings**, **Appearance**, **App Settings**, and **Terminate Account**.

### 8. 🚀 Dual-Engine Deployment (Web + Native Tauri Desktop)
- Runs as a lightweight web single-page application (SPA).
- Packages natively as a cross-platform desktop application via **Tauri v2** with hardware-accelerated WebView.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 6.0, Vite 8 |
| **Styling & Icons** | Tailwind CSS v4, Lucide React |
| **UI Primitives** | Radix UI (Dialog, Dropdown, Tabs, Slider, Tooltip, Avatar) |
| **State Management** | Zustand 5 |
| **Backend & Persistence**| Firebase Auth, Cloud Firestore |
| **Desktop Runtime** | Tauri v2 (Rust 2021) |
| **Testing & Quality** | Vitest 5, Testing Library, Oxlint |
| **CI/CD & Releases** | GitHub Actions Dual-Target Release Engine |

---

## 🚀 Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [npm](https://www.npmjs.com/) (v10+)
- *(Optional for desktop builds)* [Rust & Cargo](https://rustup.rs/)

### 1. Clone & Install
```bash
git clone https://github.com/SyedIrtiza555/aura-cad-2.git
cd aura-cad-2
npm install
```

### 2. Configure Environment
Copy the example environment configuration:
```bash
cp .env.example .env
```
Fill in your Firebase credentials in `.env`.

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Run Desktop App (Tauri)
```bash
npm run tauri dev
```

---

## 🧪 Testing & Verification

Aura Desk enforces strict domain invariants via Vitest:
```bash
# Run all invariant tests
npm test

# Run linter
npm run lint

# Run type check and production build
npm run build
```

---

## 📦 Release Engine & Git Versioning

Aura Desk utilizes an automated GitHub Actions Release Engine:
- **`ci.yml`**: Validates tests, linting, and production builds on all pushes and PRs.
- **`release.yml`**: Compiles web bundles (`aura-desk-web-v*.zip`) and native Tauri binaries on every release tag.

### Cutting a New Release:
```bash
# Preview release without changes
npm run release -- --dry-run

# Cut a release tag locally
npm run release -- 1.0.0

# Cut and automatically trigger the GitHub CI/CD Release Engine
npm run release -- 1.0.0 --push
```

For full release workflows, branching conventions, and rollback protocols, see:
- 📖 [**VERSIONING.md**](VERSIONING.md) — Semantic Versioning, Branching, and Rollback protocols.
- 📋 [**CHANGELOG.md**](CHANGELOG.md) — Comprehensive version history and release notes.

---

## 🔒 Security & Data Privacy

- **Zero-Leakage Guarantee**: Credentials (`.env*`) and exported user collections (`users.json`) are permanently quarantined in `.gitignore` and never committed to version control.
- **Role Invariant Enforcement**: All user authorization rules are strictly evaluated on both client state and backend rules.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
