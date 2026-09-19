# Volt Grid — System Diagrams

## 1. Current Architecture (Next.js Full-stack Monolith)

ระบบปัจจุบันเป็น Next.js แอปเดียว ทั้งหน้าเว็บและ REST API (Route Handlers) อยู่ในโปรเจคเดียวกัน ใช้ Prisma ต่อ PostgreSQL ตัวเดียว

```mermaid
flowchart LR
    DRV["Driver<br/>Browser"] --> APP
    ADM["Operator / Admin<br/>Browser"] --> APP
    OSM["OpenStreetMap Tiles"] -.-> DRV

    subgraph APP["Next.js 16 App : Vercel / Render"]
        UI["React 19 Pages<br/>App Router"]
        MW["Auth Guard<br/>JWT httpOnly cookie + roles"]
        subgraph API["REST API Route Handlers"]
            AUTH["Auth"]
            STA["Stations + Chargers<br/>search / filter / favourites"]
            RES["Reservations<br/>clash detection"]
            SES["Charging Sessions<br/>start / live / stop"]
            PAY["Payments"]
            NOTI["Notifications"]
            ADMIN["Admin Console<br/>KPIs + CRUD"]
            HEALTH["/api/health"]
        end
        ORM["Prisma 7 ORM"]
        UI --> MW --> API
        API --> ORM
    end

    ORM --> DB[("PostgreSQL 16")]
```

## 2. Target Microservices Architecture

แผนแยกแต่ละ domain ออกเป็น service อิสระ แต่ละตัวมี database ของตัวเอง สื่อสารผ่าน API Gateway และ event ผ่าน Message Broker

```mermaid
flowchart LR
    WEB["Next.js Frontend<br/>Driver + Admin UI"] --> GW["API Gateway<br/>routing / JWT verify / rate limit"]

    GW --> AUTH["Auth Service"]
    GW --> STA["Station Service"]
    GW --> RES["Reservation Service"]
    GW --> SES["Charging Session Service"]
    GW --> PAY["Payment Service"]
    GW --> ADM["Admin / Analytics Service"]

    AUTH --> DB1[("auth_db")]
    STA --> DB2[("station_db")]
    RES --> DB3[("reservation_db")]
    SES --> DB4[("session_db")]
    PAY --> DB5[("payment_db")]
    ADM --> DB6[("analytics_db")]

    RES -.->|"check charger"| STA
    SES <-->|"OCPP"| CP[["Charger Hardware"]]

    RES -->|"reservation.created"| MQ{{"Message Broker"}}
    SES -->|"session.completed"| MQ
    PAY -->|"payment.succeeded"| MQ
    MQ -->|"create invoice"| PAY
    MQ --> NOTI["Notification Service"]
    MQ --> ADM
```

## 3. Technology Stack

```mermaid
flowchart TB
    subgraph FE["Presentation"]
        F1["React 19"] --- F2["Next.js 16 App Router"] --- F3["Tailwind CSS v4"]
        F4["Leaflet + OpenStreetMap"] --- F5["Poppins / Inter"]
    end

    subgraph BE["Application / API"]
        B1["TypeScript"] --- B2["Next.js Route Handlers<br/>REST API"] --- B3["Node.js 20+"]
    end

    subgraph SEC["Security"]
        S1["JWT in httpOnly cookie"] --- S2["Role-based access<br/>Driver / Operator / Admin"]
    end

    subgraph DATA["Data"]
        D1["Prisma 7 ORM + Migrations"] --- D2[("PostgreSQL 16")]
    end

    subgraph QA["Quality"]
        Q1["ESLint"] --- Q2["tsc typecheck"] --- Q3["API test suite<br/>92 cases"] --- Q4["Playwright UI<br/>57 cases"]
    end

    subgraph OPS["DevOps / Deploy"]
        O1["Docker Compose<br/>local DB"] --- O2["Git / GitHub"] --- O3["Vercel"] --- O4["Render"]
    end

    FE -->|"fetch / JSON"| BE
    BE --> SEC
    BE --> DATA
    QA -.-> BE
    OPS -.-> BE
    OPS -.-> DATA
```
