# Changelog

All notable changes to the **Aura Desk** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-14

### Added
- **5-Tier Canonical Status Lifecycle**:
  - `Inbox` (Yellow badge)
  - `In progress` (Orange badge)
  - `In Review` (Blue badge)
  - `Delivered` (Green badge)
  - `Backlog` (Grey badge)
  - Complete with real-time status transitions and synchronized order time-machine audit trails.
- **Specimen & Project Taxonomy**:
  - Standardized specimen categorization across all workflows: `Ring`, `Bracelet`, `Pendant`, `Earring`, `Grills`, `Necklace`.
- **Deterministic Order Code Generator**:
  - Automatically derives order identifier: `<Designer 2-letter Code>-<Prospect 2-letter Code>-<Order Title>` (e.g. `FD-JS-GOLDEN-PENDANT`).
  - WhatsApp delivery code formulated with matching format: `<Designer>-<Prospect>-<Order>`.
- **Seasonal Date Ergonomics**:
  - Formatted order timestamps: `DD MMM, ddd - hh:mma` (e.g., `13 Oct, Tue - 05:36am`).
  - Year display is smartly omitted during the majority of the year, and cleanly enabled during transitional winter months (Nov, Dec, Jan, Feb) as `13 Nov, Wed, '26 - 05:14pm`.
- **Multi-Image Carousel Support**:
  - Up to 5 visual attachments per order, specimen, and team member profile.
  - Interactive thumbnail carousels with smooth cycling.
- **Global Settings Modal**:
  - Accessible directly via the left sidebar user avatar.
  - Four dedicated configuration panels:
    1. Account Settings
    2. Appearance
    3. App Settings
    4. Terminate Your Account
- **Owner & Admin Governance Suite**:
  - Live role assignment and modification (Owner, Admin, Designer, Sales Agent, Client).
  - Ability for Owner/Admin to edit usernames, names, emails, or terminate team accounts.
  - Granular order deletion capabilities restricted to authorized roles.
  - Quarantine state for newly registered accounts (`pending_approval`, `unassigned`).
- **Automated CI/CD Release Engine**:
  - `.github/workflows/ci.yml` for automated lint, invariant testing, and build checks.
  - `.github/workflows/release.yml` dual-target release pipeline (Web bundle `.zip` and Tauri desktop binaries).
  - Standalone release CLI automation script: `scripts/release.sh`.
- **Comprehensive Invariant Test Suite**:
  - Vitest test suite (`tests/invariants.test.ts`) validating RBAC quarantine, price redaction, order code formulation, seasonal ergonomics, and status normalization.

### Fixed
- Fixed unscrollable layout and overflowing content in the Order Details view.
- Fixed desynchronization between Order Details current status and Time Machine activity events.
- Fixed race condition where app would bounce to login screen before resolving user authentication state.
- Consolidated duplicate Role and Team Governance sidebar navigation pages into a unified governance module.

### Security
- Untracked and quarantined `users.json`, `.env`, and local telemetry files from git history.
- Hardened `.gitignore` to enforce zero secret leakage into public repositories.

---

## [1.0.0-rc1] (Tag: v1-test) - 2026-10-13

### Added
- Working baseline checkpoint capturing role authorization, basic order management, and Tauri 2 integration.
- Checkpoint tagged as `v1-test` for safe rollback and comparison.
