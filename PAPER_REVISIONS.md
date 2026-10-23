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
