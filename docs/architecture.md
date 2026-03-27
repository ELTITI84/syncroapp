# Architecture — Uplora (Codex)

Nombre del SaaS: Uplora

Este documento define la arquitectura, convenciones y patrones del proyecto Uplora (plataforma de subida de videos a redes sociales para creadores de contenido y sus editores). El objetivo es mantener consistencia, escalabilidad y separación de responsabilidades.

---

## CRITICAL:
Nunca escribas lineas de codigo backend en archivos del frontend, ya sean client o server components.

## 1) Stack obligatorio

### Core
- Next.js 16 (App Router)
- TypeScript (strict)
- TailwindCSS
- shadcn/ui
- react-hook-form
- zod (schema-first)
- Supabase (Postgres, Storage, RLS)
- Deploy: Vercel

### Integraciones (post-MVP o según necesidad)
- Resend (emails de invitación, notificaciones)
- Stripe (billing / suscripciones)
- YouTube Data API v3 (upload de videos)
- TikTok Content Posting API (upload de videos)
- Instagram Graph API / Meta (upload de reels)

---

## 2) Principios

- **Separación estricta por capas**: route-handlers (controllers) → services → repositories → database.
- **Multi-tenant desde el diseño**: toda entidad de negocio debe estar asociada a `workspace_id`.
- **Autenticación por sesión** en la app: cookie httpOnly, validada en server.
- **Validación con zod**: cualquier input externo se valida siempre.
- **shadcn/ui first**: no reinventar UI components.
- **Seguridad por defecto**:
  - no tokens sensibles en el cliente
  - tokens OAuth de redes sociales encriptados y accesibles solo server-side
  - RLS en Supabase como enforcement final
- **Listados paginados** y queries con índices.

## NOTAS IMPORTATES:
Jamas escribir codigo backend como querys y demas suelto. Toda logica que se realice debe pertenecer a un servicio, luego si se quiere consumir esa logica en el frontend se pasa por un controller que expone esa logica al frontend. Si se quiere usar en un server-component o en un componente del backend se llama directamente a ese servicio especifico. Ademas es muy importante siempre que los controllers esten dentro del wrapper de handlers de errores para archivos del server. Asi se centraliza el manejo de errores en el backend/server. 

---

## 3) Capas y responsabilidades

### 3.1 Controllers (Route Handlers)
**Responsabilidad**
- Exponer endpoints en `src/app/api/**/route.ts`.
- Parsear request, delegar en Service, y responder con status + JSON.

**Reglas**
- No escribir lógica de negocio ni acceso a DB acá.
- Validaciones "livianas" (tipo presence) pueden existir, pero la validación final vive en Service/Repository (zod).
- Manejo de errores consistente con `routeHandler(...)`.

---

### 3.2 Services (Domain / Use Cases)
**Responsabilidad**
- Reglas de negocio y flujos de la plataforma:
  - autenticación / crear sesión
  - permisos (owner vs editor)
  - CRUD con reglas (ej: un upload requiere al menos un publish target, etc.)
  - orquestación de publicación a plataformas externas (YouTube, TikTok, Instagram)
  - gestión de tokens OAuth (refresh, decrypt)
- Normalizar/validar inputs (zod), coordinar repositorios y proveedores externos.
- Lanzar exceptions tipadas (por módulo), con `userMessage` cuando aplique.

**Reglas**
- Nunca `return error objects`; siempre `throw`.
- Services testeables en aislamiento (inyección simple cuando haga falta).
- No depender de componentes UI.

---

### 3.3 Repositories (Data Access + External Integrations)
**Responsabilidad**
- Acceso a datos (Supabase/Postgres) y persistencia.
- Integraciones externas encapsuladas (YouTube API, TikTok API, Instagram API).
- Seguridad:
  - siempre filtrar por `workspace_id` (además de RLS)

**Reglas**
- Validar payloads con zod antes de insertar/actualizar.
- No armar respuestas de UI.
- En errores: lanzar exceptions del dominio (por módulo) derivadas de `BaseException`.

---

### 3.4 Types / DTO / Schemas
- Todo payload (requests, params, body) tiene schema zod en `types/<módulo>/dto`.
- Tipos "Body/Result/Model" viven en `types/<módulo>/types`.

---

### 3.5 Exceptions (por módulo)
- Cada módulo (`auth`, `workspaces`, `uploads`, `platforms`, etc.) tiene su archivo:
  - `exceptions/<módulo>/<módulo>-exceptions.ts`
- Todas heredan de `BaseException` y se agregan al mapper.

---

## 4) Estructura de carpetas

Estructura base. Mantener enfoque por capas y por módulo.

```txt
src/
├─ app/
│  ├─ (auth)/
│  │  ├─ login/
│  │  ├─ register/
│  │  └─ invite/[token]/
│  ├─ dashboard/
│  │  ├─ home/
│  │  ├─ workspaces/
│  │  ├─ uploads/
│  │  ├─ approvals/
│  │  ├─ connected-accounts/
│  │  ├─ team/
│  │  ├─ billing/
│  │  └─ settings/
│  └─ api/
│     ├─ auth/
│     │  ├─ register/route.ts
│     │  ├─ session/route.ts
│     │  └─ logout/route.ts
│     ├─ workspaces/
│     │  ├─ route.ts              # GET(list) / POST(create)
│     │  └─ [workspace-id]/
│     │     ├─ route.ts           # GET / PATCH / DELETE
│     │     └─ invite/route.ts    # POST(invite editor)
│     ├─ uploads/
│     │  ├─ route.ts              # GET(list) / POST(create)
│     │  └─ [upload-id]/
│     │     ├─ route.ts           # GET / PATCH / DELETE
│     │     ├─ approve/route.ts   # POST(approve)
│     │     ├─ reject/route.ts    # POST(reject)
│     │     └─ publish/route.ts   # POST(publish to platforms)
│     ├─ connected-accounts/
│     │  ├─ route.ts              # GET(list)
│     │  └─ [account-id]/route.ts # DELETE(disconnect)
│     ├─ platforms/
│     │  ├─ youtube/
│     │  │  └─ callback/route.ts  # OAuth callback
│     │  ├─ tiktok/
│     │  │  └─ callback/route.ts
│     │  └─ instagram/
│     │     └─ callback/route.ts
│     ├─ members/
│     │  ├─ route.ts
│     │  └─ [member-id]/route.ts  # DELETE(remove from workspace)
│     ├─ invitations/
│     │  ├─ route.ts
│     │  └─ [token]/accept/route.ts
│     └─ billing/
│        ├─ route.ts
│        └─ invoices/route.ts
│
├─ services/
│  ├─ auth/
│  │  ├─ auth.service.ts
│  │  └─ session.service.ts
│  ├─ workspaces/
│  │  └─ workspaces.service.ts
│  ├─ uploads/
│  │  └─ uploads.service.ts
│  ├─ connected-accounts/
│  │  └─ connected-accounts.service.ts
│  ├─ platforms/
│  │  ├─ platforms.service.ts
│  │  ├─ youtube.service.ts
│  │  ├─ tiktok.service.ts
│  │  └─ instagram.service.ts
│  ├─ members/
│  │  └─ members.service.ts
│  ├─ invitations/
│  │  └─ invitations.service.ts
│  └─ billing/
│     └─ billing.service.ts
│
├─ repositories/
│  ├─ auth/
│  │  └─ auth.repository.ts
│  ├─ workspaces/
│  │  └─ workspaces.repository.ts
│  ├─ uploads/
│  │  └─ uploads.repository.ts
│  ├─ connected-accounts/
│  │  └─ connected-accounts.repository.ts
│  ├─ platforms/
│  │  ├─ youtube.repository.ts
│  │  ├─ tiktok.repository.ts
│  │  └─ instagram.repository.ts
│  ├─ members/
│  │  └─ members.repository.ts
│  ├─ invitations/
│  │  └─ invitations.repository.ts
│  └─ billing/
│     └─ billing.repository.ts
│
├─ exceptions/
│  ├─ base/
│  │  └─ base-exceptions.ts
│  ├─ auth/
│  │  └─ auth-exceptions.ts
│  ├─ workspaces/
│  │  └─ workspaces-exceptions.ts
│  ├─ uploads/
│  │  └─ uploads-exceptions.ts
│  ├─ platforms/
│  │  └─ platforms-exceptions.ts
│  └─ ... (un set por módulo)
│
├─ types/
│  ├─ auth/
│  │  ├─ dto/
│  │  └─ types/
│  ├─ workspaces/
│  │  ├─ dto/
│  │  └─ types/
│  ├─ uploads/
│  │  ├─ dto/
│  │  └─ types/
│  ├─ platforms/
│  │  ├─ dto/
│  │  └─ types/
│  └─ ... (un set por módulo)
│
├─ lib/
│  ├─ handlers/
│  │  ├─ route-handler.ts
│  │  └─ http-error-mapper.ts
│  ├─ supabase/
│  │  ├─ admin.ts
│  │  ├─ server.ts
│  │  └─ client.ts
│  ├─ auth/
│  │  ├─ jwt.ts
│  │  └─ cookies.ts
│  ├─ platforms/
│  │  └─ token-manager.ts
│  └─ utils/
│     ├─ pagination.ts
│     └─ dates.ts
│
└─ components/
   ├─ dashboard/
   └─ ui/

## 5) Naming conventions

- Carpetas, rutas y segmentos: **kebab-case**  
  Ej: `connected-accounts`, `publish-targets`, `workspace-members`

- Archivos: **feature.tipo.ts** (separación con punto)  
  Ej:
  - `uploads.repository.ts`
  - `workspaces.service.ts`
  - `route-handler.ts`

- Tipos / Interfaces: **PascalCase**  
  Ej: `UploadModel`, `CreateUploadBody`, `ConnectedAccountModel`

- Constantes: **UPPER_SNAKE_CASE** cuando aplique.

---

## 6) Flow principal del sistema

### 6.1 Login a la app (MVP)

1. El usuario se registra o inicia sesión (email/password o Google OAuth via Supabase Auth).
2. La app ejecuta:
   - `POST /api/auth/register` o Supabase Auth directamente
3. El backend:
   - valida credenciales via Supabase Auth
   - extrae `user_id` y `role`
   - crea sesión (cookie httpOnly)
4. Redirección a `/home` (dashboard).
5. El frontend consulta:
   - `GET /api/auth/session`
6. Se renderiza el dashboard con los workspaces del usuario.

**Reglas**
- El token **no se guarda** en localStorage.
- La sesión se basa en cookie httpOnly.
- Todas las rutas del dashboard requieren sesión válida.

### 6.2 Flujo de publicación

1. El editor sube un video a Supabase Storage (presigned URL).
2. Crea el upload con metadata y publish targets:
   - `POST /api/uploads`
3. Si `require_approval` está activo en el workspace:
   - El upload queda en estado `pending_approval`.
   - El owner aprueba o rechaza desde `/approvals`.
4. Al aprobar (o si no requiere aprobación):
   - `POST /api/uploads/[upload-id]/publish`
5. El backend:
   - desencripta tokens OAuth del workspace (server-side only)
   - sube el video a cada plataforma seleccionada (YouTube, TikTok, Instagram)
   - actualiza el estado de cada `publish_target`
6. El editor y el owner reciben notificación del resultado.

---

## 7) Chain of Responsibility (backend)

Para cualquier endpoint de la app:

1. **Route Handler (Controller)**
   - envuelto en `routeHandler(...)`
   - parsea request (params, body, query)

2. **Service**
   - valida inputs con zod
   - aplica reglas de negocio
   - coordina repositorios

3. **Repository**
   - ejecuta queries en Supabase/Postgres
   - filtra siempre por `workspace_id`
   - valida payloads antes de persistir

4. **Response**
   - JSON consistente `{ data }`
   - errores normalizados por status code

---

## 8) Multi-tenancy (mínimo requerido)

- Toda entidad del negocio incluye `workspace_id`.
- Toda query filtra por `workspace_id`.
- RLS activo en Supabase:
  - SELECT / INSERT / UPDATE / DELETE restringidos por `workspace_id`.
- Nunca confiar solo en el frontend para el aislamiento.
- Nunca exponer tokens o secretos al cliente.
- Tokens OAuth de redes sociales **solo accesibles server-side** con service role.

---

## 9) Validación (zod)

- Todo input externo se valida con zod:
  - body
  - params
  - query
- Usar `safeParse` en Services / Repositories.
- Errores de validación → `ValidationException`.

---

## 10) UI (shadcn/ui)

- Reutilizar shadcn/ui siempre que exista.
- Cada módulo debe tener:
  - listado paginado
  - búsqueda simple
  - create / edit (modal o página)
  - delete con confirmación
- Feedback obligatorio:
  - toast de éxito
  - toast de error con `userMessage`
- Accesibilidad mínima:
  - labels
  - focus visible
  - navegación por teclado

---

## 11) Manejo de errores (global, obligatorio)

La app utiliza manejo de errores consistente entre API y UI.

### 11.1 Reglas por capa

- **Route Handlers**
  - SIEMPRE usar `routeHandler(...)`.

- **Frontend**
  - Consumir APIs con un `apiClient` centralizado.
  - Convertir errores HTTP en exceptions UI.

- **Services / Repositories**
  - NO retornar objetos de error.
  - SIEMPRE lanzar exceptions tipadas.

---

### 11.2 `routeHandler` (Controllers)

```ts
import { NextResponse } from "next/server"
import { getHttpStatusCode } from "@/lib/handlers/http-error-mapper"
import { BaseException } from "@/exceptions/base/base-exceptions"

export async function routeHandler<T>(fn: () => Promise<T>) {
  try {
    const data = await fn()
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    const statusCode = getHttpStatusCode(error)
    const message = error instanceof Error ? error.message : "Unknown error"
    const userMessage =
      error instanceof BaseException ? error.userMessage : undefined

    console.error("Error in routeHandler:", error)

    return NextResponse.json(
      { error: { statusCode, message, userMessage } },
      { status: statusCode }
    )
  }
}
```

```ts
import {
  ForbiddenException,
  InvalidInputException,
  NotFoundException,
  UnauthorizedException,
  DatabaseException,
  ValidationException,
  ConflictException,
  BadRequestException,
} from "@/exceptions/base/base-exceptions"

import {
  AuthTokenInvalidException,
  AuthTokenExpiredException,
  AuthSessionException,
} from "@/exceptions/auth/auth-exceptions"

import {
  PlatformUploadException,
  PlatformTokenExpiredException,
  PlatformRateLimitException,
} from "@/exceptions/platforms/platforms-exceptions"

export function getHttpStatusCode(error: unknown): number {
  if (error instanceof NotFoundException) return 404

  if (
    error instanceof InvalidInputException ||
    error instanceof ValidationException ||
    error instanceof BadRequestException
  ) return 400

  if (
    error instanceof UnauthorizedException ||
    error instanceof AuthTokenInvalidException ||
    error instanceof AuthTokenExpiredException ||
    error instanceof AuthSessionException
  ) return 401

  if (error instanceof ForbiddenException) return 403
  if (error instanceof ConflictException) return 409

  if (
    error instanceof PlatformUploadException ||
    error instanceof PlatformTokenExpiredException ||
    error instanceof PlatformRateLimitException
  ) return 502

  if (error instanceof DatabaseException) return 500

  return 500
}
```

## 12 Observabilidad mínima

**Objetivo:** poder auditar accesos, detectar errores y entender el uso de la plataforma por workspace.

### Logs obligatorios (server-side)

Registrar logs estructurados para:

- **Auth**
  - registro / login (`user_id`, resultado, ip)
  - creación / expiración de sesión

- **Uploads**
  - creación de upload (`workspace_id`, `user_id`, plataformas destino)
  - aprobación / rechazo (`workspace_id`, `upload_id`, `approved_by`)
  - publicación a plataformas (`workspace_id`, `upload_id`, plataforma, resultado)

- **Plataformas**
  - conexión / desconexión de cuentas (`workspace_id`, plataforma)
  - refresh de tokens (`workspace_id`, `account_id`, resultado)
  - errores de API externa (rate limits, token expirado, fallos de upload)

- **Team**
  - invitación enviada / aceptada / expirada
  - miembro removido

### Reglas
- Incluir siempre un `request_id` (UUID) por request.
- Propagar `request_id` a services y repositories.
- **Nunca** loguear:
  - tokens OAuth
  - cookies
  - secretos
  - payloads sensibles completos

---

## 13 Módulos del MVP (mapa técnico)

### Core (obligatorios)

- `auth`
  - register
  - login
  - session
  - logout

- `workspaces`
  - CRUD de workspaces
  - configuración (require_approval, nombre)
  - slug único

- `members`
  - listado de miembros del workspace
  - remover miembro

- `invitations`
  - invitar editor por email
  - aceptar invitación por token
  - listar invitaciones pendientes

- `connected-accounts`
  - conectar cuenta de red social (OAuth)
  - desconectar cuenta
  - listar cuentas activas (vista segura sin tokens)

- `uploads`
  - subir video a Storage
  - crear upload con metadata (título, descripción, tags, thumbnail)
  - seleccionar publish targets (cuenta + plataforma)
  - listar uploads con filtros por estado
  - detalle de upload

- `approvals`
  - cola de aprobación para el owner
  - aprobar / rechazar con razón
  - publicar tras aprobación

- `platforms`
  - publicar a YouTube (resumable upload)
  - publicar a TikTok (Content Posting API)
  - publicar a Instagram (Graph API - Reels)
  - manejo de tokens (decrypt, refresh)
  - tracking de estado por publish target

### Comerciales (MVP extendido)

- `billing`
  - lectura de plan actual
  - historial básico de pagos

- `settings`
  - configuración general del workspace
  - preferencias del usuario

---

## 14 Definición de "Feature completa"

Una feature se considera **completa** únicamente si incluye:

- Schema **zod** (`types/<domain>/dto`)
- Tipos (`types/<domain>/types`)
- Repository (`repositories/<domain>/<domain>.repository.ts`)
- Service (`services/<domain>/<domain>.service.ts`)
- Route Handlers REST:
  - `GET`
  - `POST`
  - `PATCH`
  - `DELETE` (si aplica)
- UI mínima con shadcn:
  - listado
  - create / edit
- Manejo de errores tipados
- Control de permisos por sesión + `workspace_id`
- Queries paginadas y filtradas

---

## 15 Límites explícitos del MVP

Quedan **fuera del alcance** en esta etapa:

- Programación de publicaciones (calendar view)
- Analytics por video / plataforma
- Soporte para Twitter/X, Facebook, Kick u otras plataformas
- App móvil
- Roles avanzados (admin, reviewer)
- Templates de metadata reutilizables
- Comentarios internos en videos (colaboración)
- Integración con herramientas de edición (Premiere, DaVinci)
- Internacionalización (i18n)

Estos casos deben resolverse **extendiendo el modelo**, no forzándolo.

---

## 16 Principio rector del proyecto

> **Una sola plataforma.  
> Múltiples creadores.  
> Cero contraseñas compartidas.**

La app debe:
- permitir a editores publicar sin acceso directo a las cuentas
- sin perder control del creador
- sin romper aislamiento entre workspaces
- sin aumentar fricción

La prioridad es:
**claridad, seguridad y velocidad de implementación**.


## 17 Manejo del server y cliente
La idea es que todas las rutas que manejen informacion dinamica se estucturen de la siguiente manera (ejemplo):
/uploads
  - page.tsx (server) -> Toma la informacion del servidor y renderiza el client-page.tsx dentro de un Suspense pasandole la informacion via props.
  - client-page.tsx (cliente) -> Carga recien cuando toda la informacion fue obtenida y funciona como cliente. 

Ademas todos los Suspense deben tener un fallback que sea un skeleton loader de la seccion armado con shadcn/ui y que sea responsive.

