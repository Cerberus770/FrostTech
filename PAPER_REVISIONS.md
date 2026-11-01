# FrostTech - Thesis & Capstone Paper Revisions (Chapters 1, 2, and 3)

This document contains the verified, updated, and defense-ready text for **Chapters 1, 2, and 3** of your manuscript:
**"FROST TECH COOLING SOLUTION: A WEB-BASED AIR CONDITIONING SALES AND SERVICES MANAGEMENT SYSTEM"**

> **Key Operational Principles Verified:**
> 1. **100% Brand New Inventory:** All commercial air conditioning units sold through FrostTech are strictly **Brand New** (Factory-sealed with official manufacturer warranty; second-hand/refurbished unit sales are not part of the commercial catalog).
> 2. **Removal of Tech Request:** On-site material requisitions (`TechRequest`) have been removed from the technician workflow. Technicians focus directly on task execution: installation, deep cleaning, repair, and logging service diagnostics.

---

# CHAPTER I: THE PROBLEM

### 1.1 Introduction
*(Replace the typo in Heading 1.1: change `1.1 Intoduction` to `1.1 Introduction`)*

*(Paragraph 2 update:)*
> FrostTech Cooling Solutions Co., located in Zone 2 Upper Solana, Jasaan, Misamis Oriental, is a service-oriented business specializing in refrigeration and air conditioning solutions for residential, commercial, and industrial clients. The company offers a wide range of services, including installation, reinstallation, repair, and both standard and deep cleaning of air conditioning units, alongside the sale of 100% brand-new, factory-sealed air conditioning equipment. At present, FrostTech primarily uses its Facebook page to post available products, showcase completed projects, and respond to customer inquiries through chat. However, this informal setup lacks a structured, real-time view of inventory, does not support automated credit investigation for installment purchases, and cannot systematically coordinate multi-technician dispatch schedules or track unit maintenance lifecycles.

---

### 1.4 Conceptual Framework

This study adopts the **Input-Process-Output (IPO)** model as its conceptual framework to illustrate how the FrostTech platform transforms operational challenges into an automated, transparent, and data-driven management system. 

```
+-----------------------------------------------------------------------------------+
|                                      INPUT                                        |
+-----------------------------------------------------------------------------------+
| • User Credentials & Roles (Customer, Technician, Admin, Clerk)                   |
| • Google OAuth Authentication Tokens & Profile Payload                            |
| • Brand New Aircon Unit Data (Split-type, Window-type, Inverter, Horsepower)      |
| • Geospatial Coordinates & Address Pins via Google Maps API                       |
| • Cart Hardware Selections (100% Brand New Units & Capacities)                    |
| • Installment Application Forms (Monthly Income, Employer, Valid Gov't IDs)       |
| • Digital Downpayment Proof-of-Payment Receipts (Image Files)                     |
| • Customer AC Unit Registration Details (Brand, HP, Room Location, Purchase Type) |
| • Service Booking Dates, Preferred Time Slots & Service Classifications           |
| • Technician Field Status Updates, Diagnostic Notes & Service Findings            |
| • Admin Stock Encodings, Pricing, and Staff Permissions JSON Matrix               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                                     PROCESS                                       |
+-----------------------------------------------------------------------------------+
| • Secure Password Hashing (Bcrypt) & Role-Based Authorization Enforcement         |
| • Agile Iterative Software Development Life Cycle (SDLC) Methodology              |
| • Interactive Google Maps Geocoding & Address Autocomplete Processing             |
| • Cloudinary Media Processing & Storage for Downpayment Slips and Unit Photos     |
| • Brand New Inventory Stock Tracking & Automatic Quantity Decrements              |
| • Credit Investigation (CI) Assessment & Installment Amortization Calculation     |
| • Multi-Technician Crew Dispatch Assignment (_TechnicianDispatch Relation)        |
| • Proactive Maintenance Scheduling Engine & 3-Day Notice Alert Evaluation         |
| • Dynamic Technician Scheduling & Double-Booking Conflict Prevention Algorithms   |
| • Automated Digital Invoicing Calculation with Gmail SMTP Email Transmission      |
| • Multi-Channel SMS Gateway Integration (PhilSMS / Semaphore) for Dispatch Alerts |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                                      OUTPUT                                       |
+-----------------------------------------------------------------------------------+
| • Centralized Web Platform: FrostTech Sales & Services Management System          |
| • Authenticated Portals for Customers, Technicians, Clerks, and Administrators    |
| • Dynamic E-Commerce Storefront Catalog for 100% Brand New AC Units               |
| • Verified Customer Orders with Unique Reference Numbers (ORD-XXXX)               |
| • Approved Installment Amortization Schedules & CI Verification Records           |
| • Pinned Delivery Drops & Geospatial Route Information                            |
| • Digital AC Passports with Real-Time Maintenance Inspection Countdowns           |
| • Multi-Technician Work Orders & Interactive Dispatch Management Boards           |
| • Dynamic Field Service Calendar & Technician Availability Logs                   |
| • Real-Time SMS Text Notifications Delivered to Customer Mobile Devices           |
| • Digital Invoices Delivered via Email (INV-XXXX) with Line-Item Service Fees     |
| • Comprehensive Administrative Analytics & Inventory Movement Reports             |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
                       [ Continuous Feedback Loop ]
```

**Figure 1.1 IPO Diagram of FrostTech**

---

### 1.6 Scope and Limitation

The study focuses on developing a web-based air conditioning sales, inventory monitoring, and service management system for FrostTech Cooling Solutions Co. located in Zone 2 Upper Solana, Jasaan, Misamis Oriental.

#### Scope of the System:
1. **Brand New Inventory & E-Commerce Storefront:** Centralizes the cataloging of brand-new, factory-sealed air conditioning equipment across split-type, window-type, inverter, and non-inverter models with real-time stock counters and technical specifications.
2. **Financing & Credit Investigation (CI) Pipeline:** Accommodates cash purchases and installment financing across 3, 6, 9, or 12-month amortization terms. Incorporates an administrative Credit Investigation module where applicants submit employment details, monthly income, valid identification, and upload downpayment slips via Cloudinary for digital validation.
3. **Interactive Geospatial Pinpointing:** Integrates the Google Maps API (Places Autocomplete and Geocoding) allowing customers to drop exact latitude and longitude pins for delivery and service locations, ensuring field crews pinpoint customer premises without navigational ambiguity.
4. **Digital AC Passport & Proactive Maintenance:** Features a dedicated unit registry (`registered_acs`) where customers record both store-purchased and third-party existing AC units. The system tracks installation dates, computes 6-month cleaning cycles, and generates proactive 3-day maintenance reminders.
5. **Direct Service Booking & Dispatch Management:** Provides on-demand booking for installation, reinstallation, diagnostic repair, and standard or deep cleaning without an e-commerce service cart. Dispatches support multi-technician crew assignments (`_TechnicianDispatch`) linked to an interactive scheduling calendar to prevent overlapping appointments.
6. **Field Task Execution & Logging:** Technicians can update job statuses in real time (`Queued` ➔ `In Progress` ➔ `Completed`) and record on-site diagnostic inspection findings and completion notes directly into the unit's permanent service history.
7. **Automated Multi-Channel Communications:** Features automated SMS dispatch alerts sent to customers via PhilSMS / Semaphore and digital invoice generation (`invoices`) transmitted directly to customer emails via Gmail SMTP.

#### Limitations of the System:
1. **Platform Architecture:** The system is engineered as a responsive web application optimized for desktop and mobile browsers; it does not provide native compiled mobile applications (iOS/Android APK) or offline synchronization. Active internet connectivity is required.
2. **Payment Processing:** While the system validates uploaded downpayment receipts and manages installment amortization, it does not directly process automated credit card merchant clearing (e.g., direct Visa/Mastercard payment gateway APIs) or physical point-of-sale (POS) hardware cash drawers.
3. **Enterprise Resource Boundaries:** The application focuses strictly on sales, inventory, service dispatches, and invoicing; it excludes full corporate accounting, human resource payroll, biometric employee time-keeping, and predictive artificial intelligence demand forecasting.
4. **Geographical Deployment:** The system is configured for the single-branch operations of FrostTech Cooling Solutions Co. in Misamis Oriental and adjacent municipalities, without multi-branch currency conversions or franchise synchronization.

---

# CHAPTER II: REVIEW OF RELATED LITERATURE AND STUDIES

### Table 2.2 Feature Comparison of Related Studies and the Proposed FrostTech System

| Related Study / System | Installation / Re-install | Repair Service | Cleaning / Deep Clean | Installment Financing | Date Calendar | Service Booking | Inventory Monitoring | SMS / Notif Support | Product Cart | Maint. Reminder | *Geospatial Map Pinpoint* | *Digital AC Passport* | *Brand New Warranty Catalog* | *Multi-Tech Crew Dispatch* | *Digital Invoicing (SMTP)* |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Aguisanda et al. (2020)** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✔ | ✗ | ✔ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Dela Rosa & Santos (2023)** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✔ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Reyes & Lim (2023)** | ✗ | ✔ | ✔ | ✗ | ✔ | ✔ | ✗ | ✔ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Rahman & Singh (2023)** | ✔ | ✔ | ✗ | ✗ | ✔ | ✔ | ✗ | ✔ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Ortega (2024)** | ✗ | ✔ | ✗ | ✗ | ✔ | ✔ | ✔ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Patel & Kumar (2021)** | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✔ | ✗ | ✔ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Navarro et al. (2022)** | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✗ | ✔ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Hussain & Malik (2022)** | ✗ | ✔ | ✗ | ✗ | ✔ | ✔ | ✔ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Santos & Villanueva (2021)**| ✗ | ✔ | ✗ | ✗ | ✗ | ✔ | ✔ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Adams & Lee (2022)** | ✔ | ✔ | ✔ | ✗ | ✔ | ✔ | ✗ | ✔ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **FrostTech (Proposed System)** | **✔** | **✔** | **✔** | **✔** | **✔** | **✔** | **✔** | **✔** | **✔** | **✔** | **✔** | **✔** | **✔** | **✔** | **✔** |

---

### Synthesis of Related Literature and Systems (Section 2.5)

> As demonstrated in Table 2.2, existing commercial applications and academic systems typically bifurcate e-commerce functions from field service operations. Systems developed by Aguisanda et al. (2020) and Patel & Kumar (2021) center strictly on retail sales and inventory logging, lacking modules for field service deployment, technician allocation, or preventative maintenance. Conversely, HVAC service tools investigated by Adams & Lee (2022) and Rahman & Singh (2023) facilitate service scheduling but omit flexible installment financing, customer unit lifecycle registration, and digital proof-of-payment validation.
>
> The proposed **FrostTech** platform resolves these limitations by synthesizing retail e-commerce, installment financing, and field service logistics into a unified framework. Rather than separating sales from service or relying on an unnatural "service cart," FrostTech implements **Direct Service Booking** combined with a **Digital AC Passport** for tracking preventative maintenance intervals. Furthermore, FrostTech introduces novel technical contributions unaddressed by earlier literature, notably **interactive Google Maps geospatial pinpointing**, **dedicated cataloging of 100% brand-new warrantied units**, **automated Credit Investigation (CI) with digital proof-of-payment validation**, **multi-technician dispatch crew scheduling**, and **automated SMTP digital invoicing**.

---

# CHAPTER III: RESEARCH METHODOLOGY

### 3.1.1 Software Development Life Cycle (Agile Model)

* **Requirements Phase:** Gather detailed business requirements from the owner, staff, and field crew of FrostTech. Prioritize modules including brand-new unit inventory monitoring, technician scheduling calendar, direct service booking, digital AC passport tracking, integrated SMS alerts, installment credit investigation, and automated invoicing.
* **Development Phase:** System modules are programmed in iterative sprints using Next.js, React, Tailwind CSS, and Prisma ORM connected to a PostgreSQL database hosted on Neon. Features such as Google Maps geospatial geocoding, Cloudinary upload pipelines, multi-technician assignment relations, and automated email invoicing are incrementally integrated and verified.

---

### 3.1.2 to 3.1.5 System User Flowcharts

#### 3.1.2 Administrator Flowchart Narrative
The administrator workflow begins with credential authentication. Upon verifying that the user holds the `ADMIN` role, the system opens the Admin Command Center. The administrator can manage brand-new inventory stocks, review pending customer orders, assess uploaded proof-of-payment receipts for installment Credit Investigation (CI), assign field crews to dispatches with schedule conflict detection, approve newly registered technician accounts (`techRank == 'Pending'`), adjust user access permissions, and generate official digital invoices delivered via Gmail SMTP.

#### 3.1.3 Operations Clerk Flowchart Narrative
The clerk workflow begins with secure login where access is validated against the `CLERK` role. Clerks operate within a specialized administrative portal to review incoming customer orders, verify uploaded downpayment payment slips, check customer service records, and issue billing receipts, facilitating fast desk operations without accessing master security settings.

#### 3.1.4 Technician Flowchart Narrative
The technician workflow starts at `/login`. Before granting dashboard access, the system performs an approval verification check: if the technician's account is tagged with `techRank == 'Pending'`, access is restricted until approved by an administrator. Once authorized, the technician accesses the Technician Dashboard and interactive Calendar Schedule. Technicians review assigned dispatches, view pinpointed Google Maps customer locations, update job progress (`Queued` ➔ `In Progress` ➔ `Completed`), and log on-site diagnostic findings and service completion notes.

#### 3.1.5 Customer Flowchart Narrative
The customer journey begins on the storefront where clients browse 100% brand-new air conditioning units filtered by brand, horsepower, and unit form factor (Split Type, Window Type, Inverter). Upon adding items to the cart, the system enforces session authentication (supporting email/password or one-tap Google OAuth). During checkout, customers select between Cash on Delivery or Installment Financing (submitting employer, income, and proof-of-payment slips). In the Customer Space (`/profile`), clients can pinpoint delivery addresses on an interactive Google Map, register their AC units into the Digital AC Passport, track 6-month cleaning countdowns, and schedule direct maintenance services.

---

### 3.1.6 System Context Diagram Narrative
Figure 3.6 delineates the system boundary of FrostTech and its external entities. The platform interfaces with **four user groups** (Customer, Technician, Administrator, and Clerk) and **five external cloud service providers**:
1. **Google Maps API:** Delivers Places Autocomplete and reverse geocoding to resolve exact latitude and longitude delivery markers.
2. **PhilSMS / Semaphore API:** Dispatches automated SMS notifications for order confirmations and technician dispatch alerts.
3. **Gmail SMTP Server:** Transmits digital invoices and service confirmation receipts to customer email addresses.
4. **Cloudinary Cloud Storage:** Provides encrypted cloud hosting and compression for downpayment slips, product images, and unit service photos.
5. **Google OAuth Gateway:** Enables secure single sign-on authentication for customers.

---

### 3.1.7 Use Case Diagram Narrative
Figure 3.7 presents the primary use cases supported by FrostTech, organized across its four operational actors:
* **Customer Actor:** Browse Brand New Catalog, Add to Cart, Select Payment Mode (Cash/Installment), Upload Downpayment Proof, Register AC Unit, Request Direct Maintenance, Pinpoint Map Location, and Submit Product Reviews.
* **Technician Actor:** View Assigned Dispatches, Inspect Calendar Schedule, Update Job Status, and Submit Diagnostic Findings & Completion Notes.
* **Clerk Actor:** Verify Customer Orders, Inspect Uploaded Downpayment Receipts, Access Registered AC History, and Issue Invoices.
* **Administrator Actor:** Manage Brand New Inventory Stock & Pricing, Evaluate Installment Applications (CI Process), Assign Technicians to Dispatches, Authorize Technician Registrations, Configure User Roles and Permissions JSON, and Generate Financial Reports.

---

### 3.1.8 Entity-Relationship Diagram (ERD) & Complete Data Dictionary

The database schema of FrostTech is structured using PostgreSQL to enforce relational data integrity, referential cascades, and indexing across sales, financing, and field service operations.

#### Table 3.1: `users` Table
Stores user account profiles, authentication hashes, system roles, and granular security privileges.
| Field Name | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(30) | PRIMARY KEY | Unique CUID identifier for each user |
| `email` | VARCHAR(100) | UNIQUE | User login email address |
| `password` | VARCHAR(255) | NOT NULL | Bcrypt-hashed password string |
| `firstName` | VARCHAR(50) | NOT NULL | User's first name |
| `lastName` | VARCHAR(50) | NOT NULL | User's last name |
| `phone` | VARCHAR(20) | NULLABLE | Contact telephone / mobile number |
| `role` | ENUM | DEFAULT 'CUSTOMER' | User role: `CUSTOMER`, `ADMIN`, `TECHNICIAN`, `CLERK` |
| `techRank` | VARCHAR(30) | NULLABLE | Technician status: 'Pending', 'Tech', 'Senior Tech' |
| `permissions` | TEXT | DEFAULT '[]' | JSON array of granted granular permission keys |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updatedAt` | TIMESTAMP | ON UPDATE | Record last modification timestamp |

#### Table 3.2: `registered_acs` Table (Digital AC Passport)
Stores air conditioning units registered by customers for maintenance monitoring and service tracking.
| Field Name | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(30) | PRIMARY KEY | Unique CUID identifier for registered AC unit |
| `userId` | VARCHAR(30) | FOREIGN KEY (users.id) | Owning customer user identifier |
| `location` | VARCHAR(100) | NOT NULL | Unit room location (e.g., 'Master Bedroom') |
| `brandModel` | VARCHAR(100) | NOT NULL | Brand and model name |
| `acType` | VARCHAR(50) | NOT NULL | Type: 'Window Type', 'Split Type', 'Floor Standing' |
| `horsepower` | VARCHAR(20) | NOT NULL | Rated capacity (e.g., '1.0 HP', '1.5 HP', '2.0 HP') |
| `paymentType` | VARCHAR(30) | NOT NULL | Acquisition type: 'Cash' or 'Installment' |
| `totalPrice` | DOUBLE | NULLABLE | Purchase price of the unit |
| `months` | INTEGER | NULLABLE | Financing term in months (if installment) |
| `pricePerMonth`| DOUBLE | NULLABLE | Monthly amortization amount |
| `lat` | DOUBLE | NULLABLE | Pinpointed latitude coordinate |
| `lng` | DOUBLE | NULLABLE | Pinpointed longitude coordinate |
| `fullAddress` | TEXT | NULLABLE | Full physical installation address |
| `purchasedFromStore`| BOOLEAN | DEFAULT FALSE | TRUE if bought from FrostTech, FALSE if external |
| `isPaused` | BOOLEAN | DEFAULT FALSE | TRUE if periodic maintenance is temporarily paused |
| `isEnrolledMaintenance`| BOOLEAN | DEFAULT FALSE | TRUE if enrolled in 6-month automated monitoring |
| `enrolledAt` | TIMESTAMP | NULLABLE | Timestamp when enrolled in maintenance |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updatedAt` | TIMESTAMP | ON UPDATE | Record last modification timestamp |

#### Table 3.3: `products` Table
Stores 100% brand-new air conditioning equipment cataloged for commercial sale.
| Field Name | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(30) | PRIMARY KEY | Unique product identifier |
| `slug` | VARCHAR(100) | UNIQUE | URL-friendly unique identifier slug |
| `name` | VARCHAR(150) | NOT NULL | Commercial product name |
| `brand` | VARCHAR(50) | NOT NULL | Brand manufacturer name (Carrier, Daikin, etc.) |
| `category` | VARCHAR(50) | NOT NULL | Equipment category (Inverter, Split, Window) |
| `price` | DOUBLE | NOT NULL | Brand-new unit selling price |
| `originalPrice`| DOUBLE | NULLABLE | MSRP strike-through promotional price |
| `rating` | DOUBLE | DEFAULT 0 | Aggregated star rating (1.0 to 5.0) |
| `sold` | INTEGER | DEFAULT 0 | Count of brand-new units sold |
| `stock` | INTEGER | DEFAULT 0 | Physical stock counter for brand-new units |
| `image` | VARCHAR(255) | NOT NULL | Primary display image URL |
| `images` | TEXT[] | DEFAULT ARRAY[] | Array of supplementary product image URLs |
| `horsepower` | VARCHAR(20) | NULLABLE | Rated horsepower capacity |
| `badge` | VARCHAR(50) | NULLABLE | Promotional tag (e.g., 'Best Seller', 'Brand New') |
| `specs` | TEXT[] | DEFAULT ARRAY[] | Array of technical specification bullet points |
| `description` | TEXT | NULLABLE | Detailed product overview and warranty terms |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updatedAt` | TIMESTAMP | ON UPDATE | Record last modification timestamp |

#### Table 3.4: `orders` Table
Stores sales orders placed through the e-commerce storefront.
| Field Name | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(30) | PRIMARY KEY | Unique order record identifier |
| `orderNo` | VARCHAR(30) | UNIQUE | Human-readable tracking number (e.g., 'ORD-8821') |
| `userId` | VARCHAR(30) | FOREIGN KEY (users.id) | Ordering customer identifier |
| `name` | VARCHAR(100) | NOT NULL | Recipient customer name |
| `location` | TEXT | NOT NULL | Delivery address / pinned location text |
| `item` | VARCHAR(150) | NOT NULL | Purchased product name and specs |
| `payment` | VARCHAR(30) | NOT NULL | Payment method: 'Cash' or 'Installment' |
| `status` | VARCHAR(30) | DEFAULT 'Processing' | Status: 'Processing', 'Approved', 'Shipped', 'Completed' |
| `date` | VARCHAR(30) | NOT NULL | Order transaction date string |
| `downpaymentProof`| TEXT | NULLABLE | Cloudinary URL of uploaded downpayment slip |
| `hasDownpayment`| BOOLEAN | DEFAULT FALSE | TRUE if downpayment has been validated |
| `notice3Days` | BOOLEAN | DEFAULT FALSE | Flag indicating 3-day delivery notice sent |
| `notice3DaysAt`| TIMESTAMP | NULLABLE | Timestamp when 3-day notice was triggered |
| `hp` | VARCHAR(20) | NULLABLE | Unit horsepower |
| `itemType` | VARCHAR(50) | NULLABLE | Unit type |
| `price` | DOUBLE | NULLABLE | Order item price |
| `assignedTech`| VARCHAR(100) | NULLABLE | Primary assigned technician name |
| `scheduledDate`| VARCHAR(30) | NULLABLE | Scheduled installation date string |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updatedAt` | TIMESTAMP | ON UPDATE | Record last modification timestamp |

#### Table 3.5: `installments` Table
Manages customer credit financing applications and Credit Investigation (CI) states.
| Field Name | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(30) | PRIMARY KEY | Unique installment application record identifier |
| `appId` | VARCHAR(30) | UNIQUE | Application reference code (e.g., 'APP-0992') |
| `userId` | VARCHAR(30) | FOREIGN KEY (users.id) | Applicant customer user identifier |
| `name` | VARCHAR(100) | NOT NULL | Applicant full name |
| `item` | VARCHAR(150) | NOT NULL | Financed air conditioning equipment |
| `date` | VARCHAR(30) | NOT NULL | Application filing date |
| `status` | ENUM | DEFAULT 'PENDING' | Status: `PENDING`, `CI_ACCEPTED`, `REPENDING`, `COMPLETED`, `REJECTED` |
| `issue` | TEXT | DEFAULT '' | Assessment remarks / deficiency notes from CI clerk |
| `term` | INTEGER | NOT NULL | Financing duration in months (3, 6, 9, 12) |
| `employer` | VARCHAR(150) | NOT NULL | Employer / Business name of applicant |
| `income` | VARCHAR(50) | NOT NULL | Declared monthly income bracket |
| `idType` | VARCHAR(50) | NOT NULL | Government ID presented (UMID, Driver's License, etc.) |
| `location` | TEXT | NULLABLE | Applicant residential address |
| `assignedTech`| VARCHAR(100) | NULLABLE | Assigned technician for installation upon CI approval |
| `scheduledDate`| VARCHAR(30) | NULLABLE | Target delivery date |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updatedAt` | TIMESTAMP | ON UPDATE | Record last modification timestamp |

#### Table 3.6: `dispatch_items` Table
Stores logistics dispatch tasks for unit deliveries, installations, and cleaning services.
| Field Name | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(30) | PRIMARY KEY | Unique dispatch item identifier |
| `dispatchNo` | VARCHAR(30) | UNIQUE | Tracking number (e.g., 'DIS-001') |
| `type` | VARCHAR(50) | NOT NULL | Task type: 'New Installation', 'Deep Cleaning', 'Repair' |
| `customerId` | VARCHAR(30) | NOT NULL | Recipient customer user identifier |
| `name` | VARCHAR(100) | NOT NULL | Customer name |
| `location` | TEXT | NOT NULL | Destination address / coordinates |
| `item` | VARCHAR(150) | NOT NULL | Air conditioning unit involved |
| `notes` | TEXT | DEFAULT '' | Special instructions / technician findings |
| `status` | VARCHAR(30) | DEFAULT 'Queued' | Status: 'Queued', 'In Progress', 'Completed' |
| `scheduledDate`| VARCHAR(30) | NULLABLE | Scheduled execution date string |
| `assignedTechName`| VARCHAR(100)| NULLABLE | Formatted label of assigned technician(s) |
| `horsepower` | VARCHAR(20) | NULLABLE | Unit horsepower |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updatedAt` | TIMESTAMP | ON UPDATE | Record last modification timestamp |

#### Table 3.7: `_TechnicianDispatch` Table
Many-to-many junction table linking multiple technicians to a single dispatch task.
| Field Name | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `A` | VARCHAR(30) | FOREIGN KEY (dispatch_items.id) | Linked dispatch task identifier |
| `B` | VARCHAR(30) | FOREIGN KEY (users.id) | Linked technician user identifier |

#### Table 3.8: `maintenance_schedules` Table
Stores scheduled preventative maintenance inspections and routine checkups.
| Field Name | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(30) | PRIMARY KEY | Unique maintenance schedule identifier |
| `scheduleNo` | VARCHAR(30) | UNIQUE | Service tracking code (e.g., 'MNT-001') |
| `customerId` | VARCHAR(30) | FOREIGN KEY (users.id) | Customer identifier requesting maintenance |
| `name` | VARCHAR(100) | NOT NULL | Customer contact name |
| `phone` | VARCHAR(20) | NOT NULL | Contact telephone number |
| `address` | TEXT | NOT NULL | Service location address |
| `item` | VARCHAR(150) | NOT NULL | Aircon unit brand, model, and capacity |
| `serviceType` | VARCHAR(50) | NOT NULL | Classification: 'Routine Cleaning', 'Deep Clean', 'Checkup' |
| `scheduledDate`| VARCHAR(30) | NOT NULL | Target maintenance appointment date |
| `technicianId`| VARCHAR(30) | FOREIGN KEY (users.id) | Primary assigned technician identifier |
| `technicianName`| VARCHAR(100)| DEFAULT '' | Formatted name of assigned technician |
| `status` | ENUM | DEFAULT 'SCHEDULED' | Status: `SCHEDULED`, `OVERDUE`, `COMPLETED` |
| `notes` | TEXT | DEFAULT '' | Technician diagnosis or service notes |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updatedAt` | TIMESTAMP | ON UPDATE | Record last modification timestamp |

#### Table 3.9: `invoices` Table
Maintains digital billing receipts generated for customers and administrative accounting.
| Field Name | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(30) | PRIMARY KEY | Unique invoice record identifier |
| `invoiceNo` | VARCHAR(30) | UNIQUE | Formal invoice number (e.g., 'INV-001') |
| `type` | VARCHAR(20) | NOT NULL | Scope: 'ADMIN' or 'CUSTOMER' |
| `dispatchId` | VARCHAR(30) | NOT NULL | Linked dispatch item identifier |
| `dispatchNo` | VARCHAR(30) | NOT NULL | Linked dispatch tracking reference |
| `customerName`| VARCHAR(100) | NOT NULL | Billed customer full name |
| `serviceType` | VARCHAR(50) | NOT NULL | Completed service description |
| `acUnit` | VARCHAR(150) | NOT NULL | Serviced aircon unit details |
| `location` | TEXT | NOT NULL | Service location |
| `technicianName`| VARCHAR(100)| NOT NULL | Performing technician name |
| `status` | VARCHAR(30) | DEFAULT 'Sent' | Billing status: 'Sent', 'Viewed', 'Paid' |
| `amount` | DOUBLE | DEFAULT 0 | Total service / purchase amount billed |
| `notes` | TEXT | DEFAULT '' | Billing remarks / payment breakdown notes |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updatedAt` | TIMESTAMP | ON UPDATE | Record last modification timestamp |

#### Table 3.10: `addresses` Table
Stores customer address books and Google Maps pinpointed coordinates.
| Field Name | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(30) | PRIMARY KEY | Unique address identifier |
| `userId` | VARCHAR(30) | FOREIGN KEY (users.id) | Owning customer identifier |
| `label` | VARCHAR(50) | NOT NULL | Location label (e.g., 'Home', 'Office') |
| `fullAddress` | TEXT | NOT NULL | Geocoded textual address |
| `phone` | VARCHAR(20) | NOT NULL | Site contact number |
| `lat` | DOUBLE | NULLABLE | Google Maps latitude coordinate |
| `lng` | DOUBLE | NULLABLE | Google Maps longitude coordinate |
| `isDefault` | BOOLEAN | DEFAULT FALSE | Default selection indicator |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updatedAt` | TIMESTAMP | ON UPDATE | Record last modification timestamp |

#### Table 3.11: `cart_items` Table
Stores customer brand-new hardware e-commerce cart selections.
| Field Name | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(30) | PRIMARY KEY | Unique cart item identifier |
| `userId` | VARCHAR(30) | FOREIGN KEY (users.id) | Owning customer identifier |
| `productId` | VARCHAR(30) | NOT NULL | Selected product identifier |
| `name` | VARCHAR(150) | NOT NULL | Product name |
| `price` | DOUBLE | NOT NULL | Unit purchase price |
| `image` | VARCHAR(255) | NOT NULL | Thumbnail image URL |
| `quantity` | INTEGER | DEFAULT 1 | Selected purchase quantity |
| `notice3Days` | BOOLEAN | DEFAULT FALSE | 3-day notification flag |
| `notice3DaysAt`| TIMESTAMP | NULLABLE | Notification timestamp |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updatedAt` | TIMESTAMP | ON UPDATE | Record last modification timestamp |

#### Table 3.12: `calendar_events` Table
Stores events visualized on the technician and dispatch scheduling calendar.
| Field Name | Data Type | Key / Constraint | Description |
|---|---|---|---|
| `id` | VARCHAR(30) | PRIMARY KEY | Unique calendar event identifier |
| `title` | VARCHAR(150) | NOT NULL | Event title / job summary |
| `date` | VARCHAR(30) | NOT NULL | Scheduled calendar date string |
| `technician` | VARCHAR(100) | NOT NULL | Assigned technician name |
| `type` | VARCHAR(50) | NOT NULL | Event category ('Installation', 'Cleaning', 'Repair') |
| `createdAt` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

---

### Database Entity Relationships

1. **`User` to `RegisteredAC` (One-to-Many):** One customer can register and track multiple air conditioning units (`User.id` ➔ `RegisteredAC.userId`), while each registered unit belongs to exactly one customer.
2. **`User` to `Order` (One-to-Many):** One customer can place multiple sales orders over time (`User.id` ➔ `Order.userId`).
3. **`User` to `Installment` (One-to-Many):** One customer can submit multiple installment applications (`User.id` ➔ `Installment.userId`).
4. **`User` to `MaintenanceSchedule` (Dual Foreign Key Relationship):**
   * **`customerId` ➔ `users.id`:** Connects the customer who requested the maintenance service.
   * **`technicianId` ➔ `users.id`:** Connects the field technician assigned to perform the service.
5. **`DispatchItem` to `User` via `_TechnicianDispatch` (Many-to-Many):** A dispatch job can be assigned to multiple technicians (crew deployment), and a technician can be assigned to multiple dispatch tasks throughout the workday.
6. **`User` to `Address` (One-to-Many):** A customer can maintain multiple delivery and service addresses with pinned map coordinates (`User.id` ➔ `Address.userId`).

---

### 3.2 Software Requirements Specification (SRS) — Functional Requirements

The following subsections describe the functional requirements of the FrostTech Cooling Solutions web-based system. Each requirement is presented in narrative form to articulate the expected behavior, interactions, and constraints of each module.

#### 3.2.1 User Authentication and Role-Based Access Control

The system shall provide a secure login interface at the `/login` route where users authenticate using an email address and a password that has been hashed using the Bcrypt algorithm. In addition to credential-based authentication, the system shall support Google OAuth 2.0 single sign-on, enabling customers to register and log in through their existing Google accounts with a single click. Upon successful authentication, the system shall evaluate the user's assigned role — Customer, Technician, Clerk, or Administrator — and redirect the session to the corresponding role-specific portal. Technician accounts that carry a `techRank` value of `Pending` shall be denied dashboard access until an administrator explicitly approves the registration. Session tokens shall be managed using secure HTTP-only cookies with configurable expiration intervals, and all unauthorized access attempts to restricted routes shall be intercepted and redirected to the login page.

#### 3.2.2 Brand-New Inventory and E-Commerce Storefront

The system shall present an interactive product catalog exclusively featuring 100% brand-new, factory-sealed air conditioning units organized by brand name, unit type (Split Type, Window Type, Floor Standing), and horsepower rating. Each product listing shall display the unit's commercial name, selling price, original manufacturer's suggested retail price for promotional strike-through display, a primary image, supplementary gallery images, technical specification details, stock availability counter, aggregated customer star rating, and a descriptive overview including warranty terms. Customers shall be able to add products to a persistent shopping cart, adjust item quantities, and view a running subtotal before proceeding to checkout. When a product's stock counter reaches zero, the system shall automatically disable the "Add to Cart" action and display a visible "Out of Stock" badge on the catalog card. Upon successful order placement, the stock counter for each purchased product shall be decremented by the ordered quantity in real time.

#### 3.2.3 Order Processing and Checkout

The system shall allow authenticated customers to proceed from the shopping cart to checkout by selecting a payment method. Two payment methods shall be supported: Cash on Delivery and Installment Financing. For Cash on Delivery orders, the system shall generate a unique order reference number following the format `ORD-XXXX`, record the customer's name, delivery address, selected items, and transaction date, and set the initial order status to `Processing`. For Installment Financing orders, the system shall redirect the customer to the installment application workflow described in Section 3.2.4. The customer shall be required to select or confirm a delivery address from their saved address book, which includes latitude and longitude coordinates pinpointed through the Google Maps integration. Administrators and clerks shall be able to update order statuses through the progression of `Processing`, `Approved`, `Shipped`, and `Completed`.

#### 3.2.4 Installment Financing and Credit Investigation Pipeline

The system shall provide an installment application module where customers submit financing requests for air conditioning purchases across selectable amortization terms of 3, 6, 9, or 12 months. The application form shall require the customer to provide their full name, employer or business name, declared monthly income bracket, a valid government-issued identification type (such as UMID, Driver's License, PhilID, Passport, or SSS ID), and a digital upload of the downpayment proof-of-payment receipt. Uploaded receipt images shall be transmitted to Cloudinary for secure cloud storage, compression, and retrieval. Each submitted application shall be assigned a unique reference code following the format `APP-XXXX` and shall enter the Credit Investigation queue with an initial status of `PENDING`. Administrators shall review each application by inspecting the uploaded downpayment slip, verifying the declared employment and income information, and either approving the application by advancing the status to `CI_ACCEPTED`, returning the application with deficiency remarks by setting the status to `REPENDING`, or declining the application by setting the status to `REJECTED`. Upon approval, the system shall calculate the monthly amortization amount by dividing the remaining balance by the selected term duration and shall link the application to a scheduled delivery dispatch.

#### 3.2.5 Interactive Geospatial Pinpointing

The system shall integrate the Google Maps JavaScript API with Places Autocomplete and Geocoding services to allow customers to pinpoint exact delivery and service locations on an interactive map. When saving a new address, the customer shall type a partial address string into the autocomplete search field, select a suggested result, and then fine-tune the map marker by dragging it to the precise location. The system shall capture and persist the resolved latitude coordinate, longitude coordinate, and full formatted address string. Saved geospatial pins shall be used by the dispatch management module to provide field technicians with accurate navigation targets, eliminating address ambiguity and reducing transit delays.

#### 3.2.6 Digital AC Passport and Unit Registration

The system shall provide a Digital AC Passport interface within the customer profile portal at `/profile` where customers can register air conditioning units they own. The registration form shall capture the unit's installation room location, brand and model name, unit type, horsepower rating, and acquisition method (Cash or Installment). Customers may register units that were purchased directly from the FrostTech storefront as well as units purchased from external third-party retailers. For store-purchased units, the system shall automatically mark the `purchasedFromStore` flag as true and populate applicable pricing information. Each registered unit shall be assigned a unique identifier and shall serve as the permanent record anchor for all future maintenance schedules, cleaning cycle countdowns, and service history entries associated with that unit. Customers shall be able to view the complete service timeline for each registered unit directly from the AC Passport interface.

#### 3.2.7 Proactive Maintenance Scheduling Engine

The system shall implement a proactive maintenance scheduling engine that monitors the cleaning cycle intervals of all registered AC units enrolled in the automated maintenance program. When a customer enrolls a unit in the maintenance program, the system shall record the enrollment timestamp and compute a 6-month cleaning cycle deadline from the enrollment date. As the deadline approaches, the system shall generate a 3-day advance maintenance reminder notification. Customers shall be able to request direct maintenance services — including routine cleaning, deep cleaning, diagnostic checkup, and repair — through a service booking form that captures the customer's contact phone number, service location address, the target registered AC unit, preferred service date, and service type classification. Each submitted maintenance request shall be assigned a unique tracking code following the format `MNT-XXX` and shall be routed to the administrative dispatch queue for technician assignment. Customers shall also have the option to temporarily pause the automated maintenance monitoring for individual units without deleting the enrollment record.

#### 3.2.8 Direct Service Booking and Dispatch Management

The system shall support direct service booking for installation, reinstallation, diagnostic repair, and standard or deep cleaning services without requiring customers to add service items to an e-commerce shopping cart. Service requests submitted by customers and orders approved by administrators shall be consolidated into the dispatch management board, where each task is assigned a unique dispatch tracking number following the format `DIS-XXX`. Administrators shall assign one or more field technicians to each dispatch task using the multi-technician crew assignment interface, which records the relationship through the `_TechnicianDispatch` many-to-many junction table. The system shall enforce schedule conflict detection by cross-referencing each technician's existing calendar events against the proposed dispatch date and time, preventing double-booking of technicians on overlapping appointments. Each dispatch task shall carry a status progression of `Queued`, `In Progress`, and `Completed`, along with fields for special instructions, technician findings, unit horsepower, and the customer's pinpointed service location.

#### 3.2.9 Technician Field Operations and Task Execution

The system shall provide an authenticated Technician Dashboard accessible only to users with the `TECHNICIAN` role whose accounts have been approved by an administrator. The dashboard shall display a summary of the technician's assigned dispatch tasks, an interactive calendar showing scheduled appointments, and statistical counters for queued, in-progress, and completed jobs. Technicians shall be able to update the status of each assigned task through the progression of `Queued` to `In Progress` to `Completed` directly from their dashboard interface. Upon marking a task as in progress or completed, the technician shall be prompted to enter diagnostic inspection findings, service completion notes, and any relevant observations about the unit's condition. These notes shall be permanently recorded in the dispatch item's service history and shall be visible to administrators, clerks, and the owning customer. The technician shall also be able to view the customer's pinpointed Google Maps location for navigation purposes.

#### 3.2.10 Automated Multi-Channel Communications

The system shall implement automated multi-channel communication capabilities through SMS text messaging and email transmission. For SMS notifications, the system shall integrate with the PhilSMS or Semaphore API gateway to deliver real-time text messages to customer mobile phone numbers upon key events including order confirmation, dispatch scheduling, technician assignment, and service completion. For email communications, the system shall connect to the Gmail SMTP server to transmit digitally formatted invoices and service confirmation receipts directly to customer email addresses. Each outbound communication shall include contextually relevant details such as the order reference number, dispatch tracking code, assigned technician name, scheduled service date, and total billing amount.

#### 3.2.11 Digital Invoicing and Billing

The system shall generate digital invoices for completed service tasks and product deliveries. Each invoice shall be assigned a unique invoice number following the format `INV-XXX` and shall be linked to its corresponding dispatch record by dispatch identifier and dispatch tracking number. The invoice shall capture the billed customer's full name, the type of service performed, the serviced air conditioning unit's details, the service location, the performing technician's name, the total amount billed, and any additional billing remarks or payment breakdown notes. Invoices shall carry a status progression of `Sent`, `Viewed`, and `Paid` to track the billing lifecycle. Administrators shall be able to generate both internal administrative invoices and customer-facing invoices, and all generated invoices shall be transmittable to the customer's email address via the Gmail SMTP integration.

#### 3.2.12 Administrative Management and Analytics

The system shall provide an Admin Command Center accessible exclusively to users assigned the `ADMIN` role. From this centralized portal, administrators shall be able to manage the brand-new inventory catalog by adding new products, updating pricing and stock quantities, uploading product images, and editing technical specifications. The administrator shall have full visibility into all customer orders, installment applications, dispatch tasks, maintenance schedules, and generated invoices. The user management module shall allow administrators to view all registered accounts, modify user roles and permission sets stored as a JSON array, approve pending technician registrations by updating the `techRank` field, and deactivate accounts when necessary. The system shall present real-time analytical dashboards displaying key performance indicators such as total revenue, order volume, active dispatch counts, technician utilization rates, and inventory movement summaries to support informed business decision-making.
