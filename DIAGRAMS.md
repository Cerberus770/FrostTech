# FrostTech - System Architecture & Specification Diagrams

This document contains the complete and verified software architecture diagrams for **FrostTech**, including the Level-0 System Context Diagram, Use Case Diagram, User Activity Flowcharts (Customer, Technician, Admin, Clerk), the Entity Relationship Diagram (ERD), and the Input-Process-Output (IPO) Model.

> **Operational Note:**
> 1. All commercial air conditioning units sold by FrostTech are **100% Brand New** (Factory-sealed units with official manufacturer warranty; no second-hand or refurbished units).
> 2. On-site technician material requisitions (`TechRequest`) have been removed from system scope; technician workflows center strictly on installation, cleaning, diagnostic repair, and job completion reporting.

---

## 1. System Context Diagram (Level 0)

```mermaid
flowchart TB
    subgraph ExternalActors["System Users"]
        Customer["👤 Customer\n(Mobile / Web User)"]
        Technician["🔧 Technician\n(Field Service Crew)"]
        Admin["👑 Admin\n(Operations Manager)"]
        Clerk["📋 Clerk\n(Staff / Billing)"]
    end

    subgraph FrostTechCore["FrostTech System Boundary"]
        System["❄️ FrostTech Web Platform\n(Next.js App Router, Turbopack,\nPrisma ORM, PostgreSQL Engine)"]
    end

    subgraph ThirdPartyAPIs["External Cloud Services"]
        GoogleMaps["🗺️ Google Maps API\n(Places Autocomplete & Geocoding)"]
        SMSGateway["📱 PhilSMS / Semaphore API\n(OTP & Dispatch SMS Alerts)"]
        EmailSMTP["📧 Gmail SMTP Service\n(Invoice Delivery & Notifications)"]
        Cloudinary["☁️ Cloudinary Storage\n(Unit Media & Downpayment Proof)"]
        GoogleAuth["🔐 Google OAuth\n(Direct Social Sign-In)"]
    end

    %% Customer Data Flows
    Customer -->|"Orders, Installment Applications, AC Registrations, Maintenance Requests"| System
    System -->|"Order Status, Invoices, Service Alerts, Brand New Catalog"| Customer

    %% Technician Data Flows
    Technician -->|"Job Status Updates, Diagnostic Findings, Completion Notes"| System
    System -->|"Assigned Jobs, Calendar Schedule, Route Details"| Technician

    %% Admin Data Flows
    Admin -->|"Inventory Control, Tech Assignment, Role Permissions, CI Approvals"| System
    System -->|"Operational Metrics, Audit Logs, Invoices, User List"| Admin

    %% Clerk Data Flows
    Clerk -->|"Order Validations, Payment Verification, Customer Processing"| System
    System -->|"Order Queue, Verification Data, Invoice Receipts"| Clerk

    %% External Services Data Flows
    System <-->|"Lat/Lng Coordinates, Address Verification"| GoogleMaps
    System -->|"SMS Dispatch Notifications & Alerts"| SMSGateway
    System -->|"Automated Invoice PDF/Email Transmissions"| EmailSMTP
    System <-->|"Image Uploads (Proofs, Products, Profile Avatars)"| Cloudinary
    System <-->|"OAuth Token Verification & Profile Data"| GoogleAuth
```

---

## 2. Use Case Diagram

```mermaid
flowchart LR
    subgraph Actors
        C["👤 Customer"]
        T["🔧 Technician"]
        A["👑 Administrator"]
        K["📋 Clerk"]
    end

    subgraph FrostTechUseCases["FrostTech System Use Cases"]
        UC1(["Browse Brand New AC Catalog (Split / Window / Inverter)"])
        UC2(["Manage Cart & Saved Addresses"])
        UC3(["Checkout (Cash on Delivery or Installment with Proof)"])
        UC4(["Register AC Units (Store-Purchased & Existing Units)"])
        UC5(["Schedule AC Maintenance / Deep Clean / Diagnostic Repair"])
        UC6(["Track Order & Service Status"])
        UC7(["Submit Product Reviews"])

        UC8(["View Assigned Dispatch & Maintenance Jobs"])
        UC9(["View Personal Schedule & Calendar"])
        UC10(["Update Job Status (Queued ➔ In Progress ➔ Completed)"])
        UC11(["Log On-Site Technical Diagnostics & Completion Notes"])

        UC12(["Manage Brand New Inventory Stock & Pricing"])
        UC13(["Approve / Reject Installments (Credit Investigation CI Process)"])
        UC14(["Assign Technicians to Dispatches & Maintenance Schedules"])
        UC15(["Manage User Roles, Staff Ranks & Custom Permissions"])
        UC16(["Generate & Dispatch Digital Invoices via Email"])
        UC17(["Verify Downpayment Proofs & Validate Orders"])
    end

    %% Customer mappings
    C --> UC1
    C --> UC2
    C --> UC3
    C --> UC4
    C --> UC5
    C --> UC6
    C --> UC7

    %% Technician mappings
    T --> UC8
    T --> UC9
    T --> UC10
    T --> UC11

    %% Clerk mappings
    K --> UC6
    K --> UC16
    K --> UC17

    %% Admin mappings
    A --> UC12
    A --> UC13
    A --> UC14
    A --> UC15
    A --> UC16
    A --> UC17
```

---

## 3. User Flowcharts

### 3.1. Customer Process Flowchart

```mermaid
flowchart TD
    Start([Customer Visits Website]) --> AuthCheck{Logged In?}
    AuthCheck -- No --> AuthChoice{Action?}
    AuthChoice -- Sign Up --> Register[Register with Name, Email, Password]
    AuthChoice -- Login / Google --> Login[Authenticate via Credentials or Google OAuth]
    Register --> Login
    Login --> AuthCheck
    AuthCheck -- Yes --> Browse[Browse 100% Brand New AC Catalog by Brand, HP & Type]

    Browse --> ProductSelect[Select Brand New Unit: Split Type / Window Type / Inverter]
    ProductSelect --> AddCart[Add to Cart with Map-Pinned Address]

    AddCart --> PaymentChoice{Payment Method}
    PaymentChoice -- Cash --> CashCheckout[Place Order with Cash on Delivery / Upfront]
    PaymentChoice -- Installment --> InstallmentForm[Fill Employment, Income & Upload Downpayment Proof]

    CashCheckout --> OrderSubmit[Order Created - Status: Processing]
    InstallmentForm --> AppSubmit[Installment Application Created - Status: Pending CI]

    OrderSubmit --> CustomerSpace[Access Customer Dashboard]
    AppSubmit --> CustomerSpace

    CustomerSpace --> ACManagement{Manage AC Services?}
    ACManagement -- Register AC --> RegUnit[Register Air Conditioner - Room Location, HP, Pin Address]
    ACManagement -- Maintenance --> RequestMnt[Book Maintenance: Cleaning, Repair, Diagnostics]
    ACManagement -- View Invoices --> ViewInv[Review & Download Invoices]
    ACManagement -- Done --> End([Session Complete])
```

---

### 3.2. Technician Process Flowchart

```mermaid
flowchart TD
    Start([Technician Accesses Platform]) --> TechLogin[Enter Credentials on /login]
    TechLogin --> ApprovalCheck{Rank Status?}
    ApprovalCheck -- 'Pending' --> Blocked[Access Denied: Pending Admin Approval]
    Blocked --> End([Logout])

    ApprovalCheck -- Approved --> Dashboard[Load Technician Dashboard & Calendar]
    Dashboard --> ViewJobs[Review Assigned Dispatch Items & Maintenance Tasks]

    ViewJobs --> JobSelect{Select Active Task}
    JobSelect --> StartJob[Change Status to 'In Progress']
    StartJob --> Inspect[Inspect Unit at Pinned Map Location]

    Inspect --> CompleteWork[Execute Service: Installation / Repair / Deep Cleaning]

    CompleteWork --> UpdateJob[Upload Service Notes & Mark Job 'Completed']
    UpdateJob --> SyncStatus[Order / Maintenance Schedule Updates to 'Completed']
    SyncStatus --> NextJob{More Jobs?}
    NextJob -- Yes --> ViewJobs
    NextJob -- No --> End
```

---

### 3.3. Administrator Process Flowchart

```mermaid
flowchart TD
    Start([Admin Logs In]) --> AdminGate{Role == ADMIN?}
    AdminGate -- No --> Deny[Redirect to Home]
    AdminGate -- Yes --> AdminPanel[Open Admin Command Center]

    AdminPanel --> Actions{Select Administrative Action}

    %% Branch 1: Inventory
    Actions -- Inventory Control --> Inv[Add/Edit Brand New Products, Stock Quantities & Specs]
    Inv --> InvDone[Update Database & Storefront]

    %% Branch 2: Installments & Orders
    Actions -- Orders & CI Review --> Orders[View Orders & Installment Applications]
    Orders --> ReviewProof{Verify Downpayment Proof}
    ReviewProof -- Valid --> ApproveApp[Approve Installment & Mark CI Accepted]
    ReviewProof -- Deficient --> RejectApp[Reject / Request Re-submission]
    ApproveApp --> QueueDispatch[Create Dispatch Queue Item]

    %% Branch 3: Dispatch & Technicians
    Actions -- Dispatch Operations --> DispatchQueue[View Queued Deliveries & Installations]
    DispatchQueue --> AssignTech[Assign Field Technicians via Multi-Select & Schedule Date]
    AssignTech --> NotifyTech[Notify Assigned Technicians via App/SMS]

    %% Branch 4: User & Staff Permissions
    Actions -- Staff & Users --> UserMgmt[Manage Users, Roles, Tech Ranks & Custom Permissions]
    UserMgmt --> ApproveTech[Approve Pending Technician Registrations]

    %% Branch 5: Invoicing
    Actions -- Billing & Invoices --> GenInvoice[Generate Invoice -> Send via Gmail SMTP]

    InvDone --> AdminPanel
    QueueDispatch --> AdminPanel
    NotifyTech --> AdminPanel
    ApproveTech --> AdminPanel
    GenInvoice --> AdminPanel
```

---

### 3.4. Clerk Process Flowchart

```mermaid
flowchart TD
    Start([Clerk Logs In]) --> ClerkGate{Role == CLERK?}
    ClerkGate -- No --> Deny[Access Denied]
    ClerkGate -- Yes --> ClerkDash[Open Clerk Operations Dashboard]

    ClerkDash --> Tasks{Select Daily Task}

    Tasks -- Order Verification --> VerifyOrders[Review Processing Orders & Verify Downpayment Proofs]
    VerifyOrders --> MarkVerified[Update Order Status & Tag Proof Verified]

    Tasks -- Customer Inquiries --> CustService[Look Up Registered ACs & Maintenance History]
    CustService --> LogFeedback[Record Customer Notes / Requests]

    Tasks -- Billing Receipts --> IssueReceipt[Generate Invoices & Verify Payment Status: Paid/Sent]
    IssueReceipt --> SendCustomer[Dispatch Invoice to Customer Email]

    MarkVerified --> Tasks
    LogFeedback --> Tasks
    SendCustomer --> Tasks
```

---

## 4. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users {
        String id PK
        String email UK
        String password
        String firstName
        String lastName
        String phone
        Role role "CUSTOMER | ADMIN | TECHNICIAN | CLERK"
        String techRank
        String permissions "JSON array of granted privileges"
        DateTime createdAt
        DateTime updatedAt
    }

    registered_acs {
        String id PK
        String userId FK
        String location
        String brandModel
        String acType
        String horsepower
        String paymentType
        Float totalPrice
        Int months
        Float pricePerMonth
        Float lat
        Float lng
        String fullAddress
        Boolean purchasedFromStore
        Boolean isPaused
        Boolean isEnrolledMaintenance
        DateTime enrolledAt
        DateTime createdAt
        DateTime updatedAt
    }

    products {
        String id PK
        String slug UK
        String name
        String brand
        String category
        Float price
        Float originalPrice
        Float rating
        Int sold
        Int stock "Brand New Stock Counter"
        String image
        StringArray images
        String horsepower
        String badge
        StringArray specs
        String description
        DateTime createdAt
        DateTime updatedAt
    }

    reviews {
        String id PK
        String productId
        String userId FK
        String userName
        Int rating
        String comment
        DateTime createdAt
        DateTime updatedAt
    }

    inventory_items {
        String id PK
        String sku UK
        String brand
        String model
        String category
        String horsepower
        String description
        Int stock
        Float price
        String image
        StringArray images
        String status
        DateTime createdAt
        DateTime updatedAt
    }

    orders {
        String id PK
        String orderNo UK
        String userId FK
        String name
        String location
        String item
        String payment
        String status
        String date
        String downpaymentProof
        Boolean hasDownpayment
        Boolean notice3Days
        DateTime notice3DaysAt
        String hp
        String itemType
        Float price
        String assignedTech
        String scheduledDate
        DateTime createdAt
        DateTime updatedAt
    }

    installments {
        String id PK
        String appId UK
        String userId FK
        String name
        String item
        String date
        InstallmentStatus status "PENDING | CI_ACCEPTED | REPENDING | COMPLETED | REJECTED"
        String issue
        Int term
        String employer
        String income
        String idType
        String location
        String assignedTech
        String scheduledDate
        DateTime createdAt
        DateTime updatedAt
    }

    dispatch_items {
        String id PK
        String dispatchNo UK
        String type
        String customerId
        String name
        String location
        String item
        String notes
        String status
        String scheduledDate
        String assignedTechName
        String horsepower
        DateTime createdAt
        DateTime updatedAt
    }

    maintenance_schedules {
        String id PK
        String scheduleNo UK
        String customerId FK
        String name
        String phone
        String address
        String item
        String serviceType
        String scheduledDate
        String technicianId FK
        String technicianName
        MaintenanceStatus status "SCHEDULED | OVERDUE | COMPLETED"
        String notes
        DateTime createdAt
        DateTime updatedAt
    }

    calendar_events {
        String id PK
        String title
        String date
        String technician
        String type
        DateTime createdAt
    }

    addresses {
        String id PK
        String userId FK
        String label
        String fullAddress
        String phone
        Float lat
        Float lng
        Boolean isDefault
        DateTime createdAt
        DateTime updatedAt
    }

    cart_items {
        String id PK
        String userId FK
        String productId
        String name
        Float price
        String image
        Int quantity
        Boolean notice3Days
        DateTime notice3DaysAt
        DateTime createdAt
        DateTime updatedAt
    }

    invoices {
        String id PK
        String invoiceNo UK
        String type "ADMIN | CUSTOMER"
        String dispatchId
        String dispatchNo
        String customerName
        String serviceType
        String acUnit
        String location
        String technicianName
        String status "Sent | Viewed | Paid"
        Float amount
        String notes
        DateTime createdAt
        DateTime updatedAt
    }

    _TechnicianDispatch {
        String A FK "dispatch_items.id"
        String B FK "users.id"
    }

    %% Relationships
    users ||--o{ registered_acs : "owns"
    users ||--o{ orders : "places"
    users ||--o{ installments : "applies for"
    users ||--o{ addresses : "saves"
    users ||--o{ cart_items : "adds to"
    users ||--o{ maintenance_schedules : "requests as Customer"
    users ||--o{ maintenance_schedules : "assigned as Technician"
    users ||--o{ _TechnicianDispatch : "assigned to"
    dispatch_items ||--o{ _TechnicianDispatch : "assigned crew"
```

---

## 5. Input-Process-Output (IPO) Model

### 5.1. System-Level Visual IPO Diagram

```mermaid
flowchart LR
    subgraph INPUT["📥 INPUT"]
        direction TB
        I1["• User Credentials & Signups\n• Google OAuth Tokens\n• Brand New Product Search & Filters\n• Map Pin / Pinned Coordinates\n• Cart Selections (Brand New Units)\n• Downpayment Proof (Image/File)\n• Installment Forms (Income/Employer/ID)\n• AC Unit Registration Details\n• Maintenance Date & Service Type\n• Technician Status Updates & Notes\n• Admin Stock, SKUs, Prices & Roles"]
    end

    subgraph PROCESS["⚙️ PROCESS"]
        direction TB
        P1["• Password Hashing (Bcrypt) & Auth Validation\n• Role & Permissions Authorization Gate\n• Turbopack Server-Side & Client Rendering\n• Google Maps Geocoding & Coordinate Lookup\n• Cloudinary Image Optimization & Storage\n• Credit Investigation (CI) Verification Logic\n• Inventory Stock Decrement / Restoration\n• Dispatch Assignment & Crew Association\n• Maintenance Interval & 3-Day Notice Triggers\n• Automated Invoice Calculation & PDF Generation\n• SMS API (PhilSMS/Semaphore) Delivery Dispatch\n• SMTP Email Transmissions via Gmail"]
    end

    subgraph OUTPUT["📤 OUTPUT"]
        direction TB
        O1["• Authenticated User Sessions & Profiles\n• Dynamic Catalog of 100% Brand New ACs\n• Pinned Delivery Address & Route Map\n• Order Records (Status: Processing/Shipped)\n• Installment CI Approvals / Rejections\n• Dispatch Queue Items & Field Assignments\n• Technician Calendar Events & Work Orders\n• Registered AC Units & Maintenance Timelines\n• Customer Invoices (Sent, Viewed, Paid)\n• SMS Dispatch Notifications to Customers\n• Email Receipts & Service Summaries\n• Real-Time Administrative Analytics"]
    end

    INPUT -->|"Transmitted via HTTP / REST API"| PROCESS
    PROCESS -->|"Persisted to PostgreSQL / Rendered in UI / Dispatched to APIs"| OUTPUT
```

---

### 5.2. Detailed Subsystem IPO Matrices

#### Module 1: User Authentication & Role Authorization
| **INPUT** | **PROCESS** | **OUTPUT** |
|---|---|---|
| • Email, password, first/last name, phone<br>• Selected initial role (Customer, Technician)<br>• Google OAuth token & profile payload<br>• Password change requests (current & new password) | • Validate required payload fields & sanitize strings<br>• Hash passwords using `bcryptjs` (salt rounds: 10)<br>• Verify credentials against `users` table via Prisma<br>• Check technician approval state (`techRank == 'Pending'`)<br>• Evaluate user permissions JSON array for route access<br>• Execute database schema self-healing DDL on startup | • Authenticated user session object (`id`, `role`, `name`)<br>• JSON response: HTTP 200 (Success) or 401/403 (Error)<br>• Redirect to role-specific portal (`/`, `/admin`, `/technician`)<br>• Updated encrypted password record in database |

#### Module 2: E-Commerce Storefront, Inventory & Cart
| **INPUT** | **PROCESS** | **OUTPUT** |
|---|---|---|
| • Brand, horsepower, and category filter criteria (Brand New units)<br>• Add-to-cart clicks with product ID & quantity<br>• Delivery address and Google Maps pinpoint coordinates | • Query active brand-new products from catalog<br>• Enforce mandatory login/registration check prior to cart addition<br>• Upsert cart items into `cart_items` table<br>• Compute subtotal, taxes, and shipping rates based on location<br>• Validate inventory stock levels from `inventory_items` | • Interactive catalog cards for Brand New AC models<br>• Updated user cart drawer with real-time total calculation<br>• Pinned map marker displaying exact delivery drop point<br>• Low stock badges and out-of-stock disable flags |

#### Module 3: Checkout, Orders & Payment Processing
| **INPUT** | **PROCESS** | **OUTPUT** |
|---|---|---|
| • Selected payment mode (`Cash on Delivery` or `Installment`)<br>• Uploaded downpayment proof of payment (Base64 / Cloudinary URL)<br>• Delivery contact details & delivery notes<br>• Order cancellation / confirmation requests | • Generate unique order tracking number (`ORD-XXXX`)<br>• Validate downpayment image format and store proof URL<br>• Persist record to `orders` table with initial status `Processing`<br>• Decrement product stock in `inventory_items`<br>• Clear corresponding items from `cart_items` | • Order confirmation modal with unique Order No.<br>• Customer order history record in Customer Space<br>• Live entry populated in Admin Order Queue for verification<br>• Real-time notification dispatched to Clerk/Admin dashboard |

#### Module 4: Installment Application & Credit Investigation (CI)
| **INPUT** | **PROCESS** | **OUTPUT** |
|---|---|---|
| • Applicant employment details, employer name, monthly income<br>• Government ID type and number<br>• Selected financing term (3, 6, 9, 12 months)<br>• Admin CI evaluation action (`CI_ACCEPTED`, `REJECTED`, `REPENDING`) | • Create unique application record (`APP-XXXX`) in `installments`<br>• Calculate monthly amortization: `(Price - Downpayment) / Term`<br>• Admin credit assessment verification workflow<br>• Transition installment state machine from `PENDING` to `CI_ACCEPTED` | • Application status badge displayed in Customer Space<br>• Automated creation of delivery item in `dispatch_items`<br>• Formal financing schedule breakdown for customer<br>• SMS notification alert sent to customer phone via PhilSMS |

#### Module 5: Dispatch Operations & Technician Scheduling
| **INPUT** | **PROCESS** | **OUTPUT** |
|---|---|---|
| • Approved order / installment dispatch trigger<br>• Service classification (`New Installation`, `Deep Cleaning`, `Repair`)<br>• Admin technician multi-assignment selection<br>• Target scheduled installation/service date | • Generate dispatch queue record (`DIS-XXXX`) in `dispatch_items`<br>• Associate technicians via `_TechnicianDispatch` relation table<br>• Create linked calendar schedule entry in `calendar_events`<br>• Calculate technician daily workload and schedule conflicts | • Queued dispatch card visible in Dispatch Management board<br>• Job alert populated in assigned Technician's mobile view<br>• Calendar event entry on Technician schedule page<br>• Route map pin with full delivery address and contact info |

#### Module 6: AC Unit Registration & Lifecycle Maintenance
| **INPUT** | **PROCESS** | **OUTPUT** |
|---|---|---|
| • AC brand/model, horsepower, unit room location (e.g. Master Bedroom)<br>• Purchase origin (`purchasedFromStore` true/false)<br>• Maintenance enrollment opt-in and preferred schedule date<br>• Pause / resume maintenance toggle | • Insert record into `registered_acs` table linked to user ID<br>• Automatically calculate recommended recurring maintenance due date<br>• Evaluate 3-day notice window (`notice3Days` & `notice3DaysAt`)<br>• Auto-create entry in `maintenance_schedules` (`MNT-XXXX`) | • Digital AC passport card displayed in Customer Space<br>• Maintenance countdown meter and cleaning reminder badge<br>• Proactive SMS/Email reminders 3 days before scheduled service<br>• Service log tracking cleaning and diagnostic history |

#### Module 7: Technician Field Work & Execution
| **INPUT** | **PROCESS** | **OUTPUT** |
|---|---|---|
| • Technician task status update (`Queued` → `In Progress` → `Completed`)<br>• On-site diagnostic inspection notes and service findings | • Validate technician assignment authorization<br>• Update `dispatch_items` and `maintenance_schedules` status<br>• Update corresponding customer order to `Completed` | • Real-time status update displayed on Customer tracking screen<br>• Updated technician completed job count and performance stats<br>• Historical service record logged for customer unit |

#### Module 8: Invoicing, Receipts & Cloud Communications
| **INPUT** | **PROCESS** | **OUTPUT** |
|---|---|---|
| • Completed dispatch ID or maintenance schedule ID<br>• Service amount, technician name, customer name, unit details<br>• Payment status updates (`Sent`, `Viewed`, `Paid`)<br>• Invoice transmission trigger | • Generate unique invoice number (`INV-XXXX`) in `invoices` table<br>• Compose structured HTML email receipt with line items<br>• Authenticate with Gmail SMTP and deliver email to customer<br>• Format SMS payload and invoke PhilSMS / Semaphore REST endpoint | • Formal invoice record with tracking status (`Sent` / `Paid`)<br>• Customer invoice PDF / email delivered to customer inbox<br>• Instant SMS text notification delivered to recipient phone<br>• Revenue and accounting records updated in Admin dashboard |
