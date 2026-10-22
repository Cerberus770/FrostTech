# FrostTech - System Architecture & Specification Diagrams

This document contains the complete software architecture diagrams for **FrostTech**, including the Level-0 System Context Diagram, Use Case Diagram, User Activity Flowcharts (Customer, Technician, Admin, Clerk), and the comprehensive Entity Relationship Diagram (ERD).

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
        Cloudinary["☁️ Cloudinary Storage\n(Product Media & Downpayment Proof)"]
        GoogleAuth["🔐 Google OAuth\n(Direct Social Sign-In)"]
    end

    %% Customer Data Flows
    Customer -->|"Orders, Installment Applications, AC Registrations, Maintenance Requests"| System
    System -->|"Order Status, Invoices, Service Alerts, Catalog"| Customer

    %% Technician Data Flows
    Technician -->|"Job Status Updates, Part Requests, Completion Notes"| System
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
        UC1(["Browse Catalog & Condition Variants"])
        UC2(["Manage Cart & Saved Addresses"])
        UC3(["Checkout (Cash or Installment with Proof)"])
        UC4(["Register AC Units (Store & External)"])
        UC5(["Schedule AC Maintenance / Deep Clean"])
        UC6(["Track Order & Service Status"])
        UC7(["Submit Product Reviews"])

        UC8(["View Assigned Dispatch & Maintenance Jobs"])
        UC9(["View Personal Schedule & Calendar"])
        UC10(["Update Job Status (In-Progress / Done)"])
        UC11(["Submit Technician Part Requests (TechRequest)"])

        UC12(["Manage Inventory & Condition Pricing"])
        UC13(["Approve / Reject Installments (CI Process)"])
        UC14(["Assign Technicians to Dispatches & Maintenance"])
        UC15(["Manage User Roles & Permissions"])
        UC16(["Generate & Dispatch Invoices"])
        UC17(["Verify Downpayment Proofs & Orders"])
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
    AuthCheck -- Yes --> Browse[Browse Catalog & Filter by Brand/HP/Condition]

    Browse --> ProductSelect[Select Unit & Condition: Brand New, Second Hand, On-Hand]
    ProductSelect --> AddCart[Add to Cart with Map-Pinned Address]

    AddCart --> PaymentChoice{Payment Method}
    PaymentChoice -- Cash --> CashCheckout[Place Order with Cash on Delivery / Upfront]
    PaymentChoice -- Installment --> InstallmentForm[Fill Employment, Income & Upload Downpayment Proof]

    CashCheckout --> OrderSubmit[Order Created - Status: Processing]
    InstallmentForm --> AppSubmit[Installment Application Created - Status: Pending CI]

    OrderSubmit --> CustomerSpace[Access Customer Dashboard]
    AppSubmit --> CustomerSpace

    CustomerSpace --> ACManagement{Manage AC Services?}
    ACManagement -- Register AC --> RegUnit[Register Air Conditioner - Location, HP, Pin Address]
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

    Inspect --> NeedsParts{Parts / Extra Items Needed?}
    NeedsParts -- Yes --> SubmitRequest[Create TechRequest: Item, Quantity, Reason]
    SubmitRequest --> WaitAdmin[Admin Approves Request & Allocates Item]
    WaitAdmin --> CompleteWork[Execute Service: Installation / Repair / Cleaning]
    NeedsParts -- No --> CompleteWork

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
    Actions -- Inventory Control --> Inv[Add/Edit Products, Stock Quantities, Condition Variants]
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
        String image
        StringArray images
        String horsepower
        String badge
        StringArray specs
        String description
        DateTime createdAt
        DateTime updatedAt
    }

    product_variants {
        String id PK
        String productId FK
        String condition "Brand New | Second Hand | On-Hand"
        Float price
        Int stock
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

    tech_requests {
        String id PK
        String reqId UK
        String technicianId FK
        String itemNeeded
        Int quantity
        String reason
        String status "Pending | Approved | Declined"
        DateTime createdAt
        DateTime updatedAt
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
    users ||--o{ tech_requests : "submits as Technician"
    users ||--o{ _TechnicianDispatch : "assigned to"
    dispatch_items ||--o{ _TechnicianDispatch : "assigned crew"
    products ||--o{ product_variants : "has condition pricing"
```
