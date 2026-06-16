# AutoBiz AI — Implementation Plan

## Overview

AutoBiz AI is a **multi-tenant SaaS platform** that lets businesses automate WhatsApp customer communication with AI. Each business gets an isolated dashboard, AI agent, and WhatsApp number.

**Stack:** Next.js 14 (App Router) + TypeScript · Tailwind CSS · Firebase (Firestore, Auth, Storage) · Node.js/Express backend · Gemini API · WhatsApp Cloud API

---

## User Review Required

> [!IMPORTANT]
> **Scope Decision**: This is a very large platform. I recommend building it in **phased milestones**. Phase 1 delivers a fully functional, demo-ready product. Later phases add integrations and advanced features. Please confirm you're happy with this approach before I start.

> [!IMPORTANT]
> **WhatsApp Cloud API**: To integrate with WhatsApp you will need a **Meta Business Account** and a **verified WhatsApp Business phone number**. The webhook integration requires a publicly accessible URL (e.g. via ngrok during dev, or deployed to GCP). Do you have this set up, or should I build the platform with a simulated/mock WhatsApp layer for now?

> [!WARNING]
> **Firebase Project**: You will need a Firebase project with Firestore, Auth, and Storage enabled. Do you have an existing Firebase project for this, or should I scaffold the config with placeholder credentials?

> [!WARNING]
> **Gemini API Key**: The AI agent requires a Gemini API key. Do you have one ready?

---

## Open Questions

1. **Starting scope** — Should I build the entire platform at once, or start with Phase 1 (scaffold + auth + dashboard shell + product/customer management)?
2. **WhatsApp integration** — Real Meta API integration now, or mock layer first?
3. **Payment integration** — Include PayHere billing for subscriptions in Phase 1, or later?
4. **Language** — Should I prioritize the Sinhala/Singlish AI responses in Phase 1 or add as Phase 2?

---

## Phased Milestones

### Phase 1 — Foundation (MVP) ✅ *Start Here*
Core platform that is fully usable and demo-ready.

### Phase 2 — WhatsApp + AI Core
Live WhatsApp messaging with Gemini-powered AI responses.

### Phase 3 — Payments + Integrations
PayHere subscriptions, Shopify/WooCommerce, HubSpot/Salesforce.

### Phase 4 — Analytics + Enterprise
Advanced analytics, white-label, mobile app.

---

## Phase 1 — Foundation

### 1. Project Scaffold

#### [NEW] `AutoBiz/` — Next.js 14 App with TypeScript + Tailwind
- Initialize with `create-next-app`
- Configure Tailwind CSS, ESLint, Prettier
- Set up path aliases, environment variables

---

### 2. Design System & Layout

#### [NEW] `src/app/globals.css`
- AutoBiz brand colors (deep indigo + emerald accent)
- Typography (Inter font)
- Dark mode support
- Component tokens

#### [NEW] `src/components/ui/` — Reusable UI components
- `Button`, `Card`, `Badge`, `Input`, `Modal`, `Table`, `Sidebar`, `Topbar`
- Custom WhatsApp-style chat bubble components

---

### 3. Firebase Configuration

#### [NEW] `src/lib/firebase.ts`
- Firebase app init (Auth, Firestore, Storage)
- Environment-driven config

#### [NEW] `src/lib/firestore/` — Data access layer
- `businesses.ts` — Business CRUD
- `customers.ts` — Customer CRUD
- `products.ts` — Product CRUD
- `orders.ts` — Order CRUD
- `messages.ts` — Message history

---

### 4. Authentication

#### [NEW] `src/app/(auth)/login/page.tsx`
- Email/password login with Firebase Auth
- Google OAuth login
- Role-based redirect (Super Admin → `/admin`, Business → `/dashboard`)

#### [NEW] `src/app/(auth)/register/page.tsx`
- Business registration flow
- Creates `businesses/{id}` Firestore document
- Sends verification email

#### [NEW] `src/middleware.ts`
- Protect all `/dashboard` and `/admin` routes
- JWT validation via Firebase ID tokens

---

### 5. Multi-Tenant Business Dashboard

#### [NEW] `src/app/(dashboard)/dashboard/page.tsx` — Overview
- KPI cards: Total Customers, Messages, Orders, Revenue, Automation Rate
- Recent activity feed
- Quick actions panel

#### [NEW] `src/app/(dashboard)/dashboard/inbox/page.tsx` — Inbox
- Conversation list (left panel)
- Chat view with WhatsApp-style UI (right panel)
- AI toggle (on/off per conversation)
- Message history

#### [NEW] `src/app/(dashboard)/dashboard/customers/page.tsx`
- Customer list with search/filter
- Customer profile view (tags, history, orders)
- Segmentation: VIP, New, Frequent, High Value

#### [NEW] `src/app/(dashboard)/dashboard/products/page.tsx`
- Product catalog with image upload (Firebase Storage)
- Add/edit/delete products
- Category management
- Stock tracking

#### [NEW] `src/app/(dashboard)/dashboard/orders/page.tsx`
- Order pipeline view (Kanban or table)
- Order status: Pending → Confirmed → Paid → Shipped → Delivered
- Order details modal

#### [NEW] `src/app/(dashboard)/dashboard/settings/page.tsx`
- Business profile (name, hours, WhatsApp number)
- AI agent settings (persona, language, tone)
- Auto-response templates (welcome, FAQ, OOO)
- Notification preferences

---

### 6. Super Admin Panel

#### [NEW] `src/app/(admin)/admin/page.tsx`
- All businesses overview
- Subscription plan management
- Platform analytics
- User management

---

### 7. Firestore Data Model

```
/businesses/{businessId}
  name, phone, plan, whatsappNumberId, createdAt, settings: { aiEnabled, language, timezone }

/businesses/{businessId}/customers/{customerId}
  name, phone, language, tags[], totalOrders, purchaseHistory[]

/businesses/{businessId}/products/{productId}
  name, description, price, stock, category, images[]

/businesses/{businessId}/orders/{orderId}
  customerId, items[], status, total, createdAt

/businesses/{businessId}/conversations/{conversationId}
  customerId, lastMessage, unread, aiActive

/businesses/{businessId}/conversations/{convId}/messages/{msgId}
  role (user|ai|agent), content, timestamp, type
```

---

## Phase 2 — WhatsApp + AI Core

### Backend (Node.js/Express)

#### [NEW] `backend/src/routes/webhook.ts`
- `GET /webhook` — Meta verification challenge
- `POST /webhook` — Incoming message handler
  - Text, image, voice, document processing
  - Route to AI pipeline

#### [NEW] `backend/src/services/whatsapp.ts`
- WhatsApp Cloud API client
- Send text, image, interactive (button/list) messages

#### [NEW] `backend/src/services/ai-agent.ts`
- Gemini API integration
- System prompt builder (uses business context + product catalog)
- Conversation history management
- Language detection (EN/SI/Singlish)
- Tool calls: search products, create order, lookup customer

---

## Phase 3 — Payments + Integrations

- PayHere subscription billing
- Shopify product sync webhook
- HubSpot CRM contact push

---

## Phase 4 — Analytics + Enterprise

- PostHog analytics events
- Sentry error monitoring
- White-label domain support
- Mobile app (React Native)

---

## Verification Plan

### Automated Tests
```bash
npm run lint        # ESLint
npm run type-check  # TypeScript
npm run build       # Next.js production build
```

### Manual Verification
- [ ] Register a new business account
- [ ] Login and see dashboard with sample data
- [ ] Add products and customers
- [ ] Create an order manually
- [ ] AI responds correctly in inbox (simulated)
- [ ] Super Admin sees all businesses
- [ ] Mobile responsive on 375px viewport

---

## Estimated Phase 1 Deliverables

| Area | Files | Status |
|------|-------|--------|
| Project scaffold | `package.json`, config files | Pending |
| Design system | `globals.css`, UI components | Pending |
| Firebase setup | `lib/firebase.ts`, data layer | Pending |
| Auth (login/register) | 2 pages + middleware | Pending |
| Dashboard (5 pages) | Overview, Inbox, Customers, Products, Orders, Settings | Pending |
| Super Admin panel | 1 page | Pending |
| Sample data seeder | `scripts/seed.ts` | Pending |
