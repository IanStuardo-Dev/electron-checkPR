# AGENT.md — Electron Clean Architecture + SOLID (NO IPC)

This file defines mandatory engineering rules for AI agents working on this Electron project.

> Goal: generate maintainable, secure, testable desktop software using Electron + Node.js + Clean Architecture + SOLID WITHOUT relying on IPC as an architectural crutch.

---

## 1. Core Principles

### 1.1 Architecture (MANDATORY)

The system MUST follow strict Clean Architecture:

- `domain`
- `application`
- `infrastructure`
- `presentation`

Electron runtime is ONLY a delivery mechanism, not an architectural layer.

### 1.2 Dependency Rule

- domain → no dependencies
- application → depends on domain
- infrastructure → depends on application + domain
- presentation → depends on application

Electron MUST NOT leak into domain or application.

---

## 2. Critical Decision: NO IPC ARCHITECTURE

### 🚫 IPC is NOT part of the core design

- Do NOT design the system around IPC
- Do NOT create "handlers" as business entry points
- Do NOT model features as IPC channels

### ✅ Instead, use direct composition

Electron main process should:

- instantiate use-cases
- wire dependencies
- pass them directly to presentation/adapters

Renderer should interact through **typed adapters/services**, not IPC-driven logic.

IPC (if used at all) is:
- a thin transport detail
- NOT part of domain/application design
- NOT a modeling tool

---

## 3. Process Model (Reframed Correctly)

### Main process

Responsibilities:

- bootstrap app
- create windows
- compose dependencies (DI root)
- provide adapters to renderer

Must NOT:

- contain business logic
- act as god orchestrator

### Preload

Acts ONLY as:

- safe bridge
- dependency injector

Must:

- expose use-case driven APIs
- not expose transport details

### Renderer

Acts as:

- UI layer

Must:

- call use-case abstractions (via bridge)
- NOT know infrastructure
- NOT know Electron internals

---

## 4. Folder Structure (UPDATED)

```text
src/
  shared/
    domain/
    application/
    infrastructure/

  modules/
    <module>/
      domain/
      application/
      infrastructure/
      presentation/

  electron/
    main/
      bootstrap/
      windows/
      providers/
    preload/
      bridge/
      providers/
    renderer/
      app/
      components/
      hooks/
```

---

## 5. How Features Must Be Built

### ❌ WRONG (IPC-driven mindset)

- "create handler"
- "register channel"
- "send message"

### ✅ CORRECT (Clean Architecture)

1. define use-case
2. define DTOs
3. define ports
4. implement infrastructure
5. expose through adapter

---

## 6. Use Cases are the ONLY entry point

Every feature must be expressed as a use-case:

Examples:

- `CreateProjectUseCase`
- `LoadSettingsUseCase`
- `ExportReportUseCase`

Renderer NEVER bypasses use-cases.

---

## 7. Adapters Instead of IPC

Instead of IPC handlers, create **adapters**:

```ts
export class SettingsAdapter {
  constructor(private readonly getSettings: GetSettingsUseCase) {}

  async get() {
    return this.getSettings.execute();
  }
}
```

Expose adapter in preload:

```ts
contextBridge.exposeInMainWorld('settings', {
  get: () => settingsAdapter.get(),
});
```

Key idea:
👉 Renderer talks to USE-CASES, not channels

---

## 8. DTOs, Mappers, Services

### DTOs

- application/input
- application/output
- presentation/view-model

### Mappers

MANDATORY between:

- domain ↔ persistence
- use-case ↔ presentation

### Services

Only:

- domain services (rules)
- application services (coordination)

NEVER generic "utils services" for business logic.

---

## 9. Persistence Rules

- only in infrastructure
- accessed via repositories
- no direct DB calls in application or presentation

---

## 10. Security Rules

- contextIsolation: true
- nodeIntegration: false
- no direct Node exposure to renderer
- preload exposes ONLY safe APIs

---

## 11. Renderer Rules

Renderer MUST:

- call adapters/use-cases
- contain UI logic only

Renderer MUST NOT:

- implement business logic
- access filesystem
- know Electron

---

## 12. Testing (MANDATORY)

### Unit

- use-cases
- entities
- value objects
- mappers

### Integration

- repositories
- adapters
- filesystem

### E2E

- user flows
- window interactions

---

## 13. What AI MUST NEVER DO

1. design system around IPC
2. create channel-based architecture
3. put business logic in preload/main
4. expose raw Electron APIs
5. couple renderer to infrastructure
6. skip use-cases
7. create god services
8. mix layers

---

## 14. Mandatory Instruction for AI

```md
Generate Electron code following Clean Architecture + SOLID.

Do NOT use IPC as architecture.
Use use-cases as entry points.
Expose functionality via adapters.
Keep Electron as delivery layer only.
```

---

## 15. Final Rule

If a solution requires IPC to "organize" logic:

→ the architecture is WRONG
→ redesign using use-cases + adapters

Electron is NOT your architecture.
Your architecture is Clean.