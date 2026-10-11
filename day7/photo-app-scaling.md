# 📸 SnapShare Scaling Plan

Scaling plan and system architecture for **SnapShare**, a photo-sharing application where users upload photos and scroll an algorithmic feed of posts from accounts they follow.

---

## 1. Baseline Assumptions & Daily Active Users (DAU)

- **Registered Users:** $10,000,000$ users
- **Daily Active Users (DAU):** $10\%$ of registered users active each day
  $$\text{DAU} = 10,000,000 \times 0.10 = \mathbf{1,000,000\text{ Daily Active Users}}$$
- **Time Standard:** $1\text{ day} = 86,400\text{ seconds} \approx \mathbf{100,000\text{ seconds}}$ (standard engineering approximation for back-of-the-envelope capacity planning)
- **User Activity per DAU:**
  - **Uploads:** $1\text{ photo upload per day}$
  - **Feed Views:** $50\text{ feed page views per day}$
- **Object Sizes:**
  - Original Photo: $2\text{ MB}$
  - Generated Thumbnail: $50\text{ KB}$ ($0.05\text{ MB}$)
  - Combined storage footprint per upload: $2\text{ MB} + 0.05\text{ MB} = \mathbf{2.05\text{ MB per upload}}$

---

## 2. Capacity Estimations (Throughput & Storage)

### A. Photo Uploads (Write Throughput)
- **Daily Upload Volume:**
  $$\text{Daily Uploads} = 1,000,000\text{ DAU} \times 1\text{ photo/day} = \mathbf{1,000,000\text{ uploads/day}}$$
- **Average Write QPS:**
  $$\text{Average Uploads/sec} = \frac{1,000,000\text{ uploads}}{100,000\text{ seconds}} = \mathbf{10\text{ uploads/second}}$$
- **Peak Write QPS ($5\times$ Average Spike):**
  $$\text{Peak Uploads/sec} = 10 \times 5 = \mathbf{50\text{ uploads/second}}$$

### B. Feed Page Views (Read Throughput)
- **Daily Feed View Volume:**
  $$\text{Daily Feed Views} = 1,000,000\text{ DAU} \times 50\text{ views/day} = \mathbf{50,000,000\text{ views/day}}$$
- **Average Read QPS:**
  $$\text{Average Feed Views/sec} = \frac{50,000,000\text{ views}}{100,000\text{ seconds}} = \mathbf{500\text{ views/second}}$$
- **Peak Read QPS ($5\times$ Average Spike):**
  $$\text{Peak Feed Views/sec} = 500 \times 5 = \mathbf{2,500\text{ views/second}}$$

### C. Photo Storage Accumulation
- **Daily Ingestion Rate:**
  $$\text{Daily Storage} = 1,000,000\text{ uploads/day} \times 2.05\text{ MB} = 2,050,000\text{ MB/day} = \mathbf{2.05\text{ TB/day}}$$
- **Annual Storage Accumulation:**
  $$\text{Annual Storage} = 2.05\text{ TB/day} \times 365\text{ days} = \mathbf{748.25\text{ TB/year}}$$
- **5-Year Projection:**
  $$\text{5-Year Storage} = 748.25\text{ TB/year} \times 5 \approx \mathbf{3.74\text{ PB}}$$

---

## 3. Read vs. Write Ratio & Architectural Impact

- **Verdict:** **Heavily Read-Heavy**
- **Ratio:**
  $$\frac{\text{Reads}}{\text{Writes}} = \frac{50,000,000\text{ views/day}}{1,000,000\text{ uploads/day}} = \mathbf{50:1}$$
  The system handles **50 feed reads for every 1 photo upload** ($98\%$ reads vs. $2\%$ writes).
- **Impact on System Design:**
  1. **In-Memory Caching (Redis):** Because feed queries are read-intensive and compute-heavy (joining followers and recent posts), precomputed feeds and metadata must be aggressively cached in Redis to sustain $2,500\text{ peak QPS}$ with sub-$10\text{ ms}$ latency.
  2. **Database Read/Write Splitting:** The primary database will only handle write operations ($10\text{--}50\text{ QPS}$), while multiple read replicas scale horizontally to absorb read traffic on cache misses.
  3. **Global CDN Edge Caching:** Media files (photos and thumbnails) must never touch backend application servers; they must be cached and served directly from edge nodes worldwide.

---

## 4. Photo Storage Strategy (Database vs. Object Storage)

- **Why Photos Should NOT Be Stored in the Database:**
  Relational databases are optimized for small, structured, indexed rows and transactional integrity. Storing massive $2\text{ MB}$ binary large objects (BLOBs) directly inside SQL tables rapidly fragments disk space, bloats database backups to unmanageable terabyte scales, pollutes database memory buffers, exhausts connection pools during slow uploads, and degrades indexing performance across the board.
- **Where Photos Should Go Instead:**
  Binary photo files and thumbnails must be stored in dedicated, highly durable, distributed **Object Storage** (e.g., Amazon S3, Google Cloud Storage). The relational database stores only lightweight structured metadata (such as `photo_id`, `user_id`, `created_at`, and the HTTPS URL strings pointing to the objects in S3).

---

## 5. Architecture Diagram

```text
                               ┌─────────────────┐
                               │   DNS Server    │ (snapshare.com)
                               └────────┬────────┘
                                        │
       ┌────────────────────────────────┴──────────────────────────────┐
       ▼                                                               ▼
┌──────────────┐                                                ┌───────────────┐
│ Client Apps  │────────────────(Static Assets & Photos)───────>│   CDN Edge    │
│ (Web/Mobile) │<───────────────────────────────────────────────│ (Cloudflare)  │
└──────┬───────┘                                                └──────┬────────┘
       │                                                               │
       │ (API Requests: JSON)                                          ▼
       ▼                                                        ┌───────────────┐
┌───────────────────────────────────────────────────┐           │OBJECT STORAGE │
│                   LOAD BALANCER                   │<──────────│  (Amazon S3)  │
└──────┬──────────────────────┬─────────────────────┘           │ (Originals &  │
       │                      │                                 │  Thumbnails)  │
       ▼                      ▼                                 └───────────────┘
┌──────────────┐       ┌──────────────┐                                ▲
│ App Server 1 │       │ App Server 2 │                                │
│ (Stateless)  │       │ (Stateless)  │                                │
└──────┬───────┘       └──────┬───────┘                                │
       │                      │                                        │
       ├──────────────────────┤                                        │
       │                      │                                        │
       ▼ (Cache-Aside Reads)  │                                        │
┌──────────────────────┐      │                                        │
│ REDIS CACHE CLUSTER  │      │                                        │
└──────────────────────┘      │                                        │
                              │                                        │
       ┌──────────────────────┴──────────────────────┐                 │
       ▼ (Writes)             ▼ (Reads)              ▼ (Async Jobs)    │
┌──────────────┐       ┌──────────────┐       ┌──────────────┐         │
│ PRIMARY DB   │──WAL─>│ READ REPLICA │       │MESSAGE QUEUE │         │
│ (PostgreSQL) │       │ (PostgreSQL) │       │  (RabbitMQ)  │         │
└──────────────┘       └──────────────┘       └──────┬───────┘         │
                                                     │                 │
                                                     ▼                 │
                                              ┌──────────────┐         │
                                              │ Worker Fleet │─────────┘
                                              │ (Thumbnails) │
                                              └──────────────┘
```

---

## 6. Component Explanations (Problem Solved)

Each component solves a specific architectural bottleneck in the system:

1. **CDN (Content Delivery Network):** Caches and serves heavy static assets and photo files from edge locations geographically closest to users to minimize latency and offload origin bandwidth.
2. **Load Balancer:** Distributes incoming HTTPS traffic evenly across all healthy backend application servers to eliminate single-server bottlenecks and ensure high availability.
3. **App Servers:** Stateless compute nodes that authenticate requests, execute core business logic, and orchestrate queries across storage, cache, and database tiers without storing user state locally.
4. **Redis Cache:** Ultra-fast in-memory storage that caches precomputed user feeds and popular metadata in RAM to deliver sub-millisecond read responses and protect the database from query exhaustion.
5. **Primary Database:** A transactional relational database that handles all authoritative write operations (new accounts, photo metadata, follower relationships) ensuring strict data integrity.
6. **Read Replica:** A synchronized, read-only copy of the primary database that scales out feed-read queries and offloads read pressure from the primary instance.
7. **Object Storage:** A highly durable, cost-effective storage layer purpose-built to store hundreds of terabytes of unstructured binary images and thumbnails safely.
8. **Message Queue:** An asynchronous buffer that accepts long-running tasks, decoupling resource-heavy background jobs from the client's synchronous HTTP request lifecycle.
9. **Worker Fleet:** Autonomous background compute processes that consume tasks from the message queue to generate thumbnails and process media asynchronously without blocking user requests.

---

## 7. Step-by-Step Photo Upload & Thumbnail Flow

```text
[Client] ──1. POST /photos──> [Load Balancer] ──2. Route──> [App Server]
                                                               │
     ┌──────────────────────5. 201 Created─────────────────────┤
     │                                                         │
     ▼                                                         ├─3. Stream Image──> [Object Storage]
[Client gets instant response]                                 │
                                                               ├─4. Insert Row────> [Primary DB]
                                                               │
                                                               └─5. Enqueue Job───> [Message Queue]
                                                                                         │
                                                                                         ▼
                                                                                   [Worker Node]
                                                                                         │
                                                                                         ├─Download Original
                                                                                         ├─Resize (50 KB)
                                                                                         ├─Upload Thumbnail
                                                                                         └─Update DB Record
```

1. **Client Request:** The user selects a photo on their mobile or web client and initiates an HTTP `POST /photos` request with the $2\text{ MB}$ image payload, which reaches the Load Balancer and is routed to a healthy, stateless App Server.
2. **Direct-to-Storage Ingestion:** The App Server streams the $2\text{ MB}$ binary photo directly into **Object Storage (Amazon S3)**, receiving a unique permanent object URL (or S3 key).
3. **Primary Database Write:** The App Server inserts a new metadata record into the **Primary PostgreSQL Database** containing the `user_id`, timestamps, caption, and the S3 URL of the original photo.
4. **Asynchronous Job Enqueue:** The App Server immediately pushes a background processing job payload (e.g., `{ event: "GENERATE_THUMBNAIL", photoId: 10482, originalUrl: "s3://..." }`) into the **Message Queue (RabbitMQ)**.
5. **Immediate Client Response:** Without waiting for thumbnail generation, the App Server returns **HTTP 201 Created** along with the photo metadata to the user in under $50\text{ ms}$, ensuring a fast, frictionless upload experience.
6. **Worker Processing:** A background Worker consumes the job from the queue, pulls the $2\text{ MB}$ original image from Object Storage into memory, resizes it into a high-quality $50\text{ KB}$ thumbnail, uploads the thumbnail to Object Storage, and updates the photo's database record with the new `thumbnail_url`.

---

## 8. System Trade-offs

Senior system design requires balancing conflicting technical constraints. SnapShare embodies two critical architectural trade-offs:

### Trade-off 1: Speed vs. Freshness (Feed Caching)
- **The Decision:** User feeds are precomputed and cached in Redis with a Time-To-Live (TTL).
- **Gains:** Feed reads return in $<10\text{ ms}$ even during the peak of $2,500\text{ views/sec}$, preserving database stability and delivering instant scrolling performance (Speed).
- **Costs:** If a creator uploads a new photo, their followers may not see it on their feed for a brief window until the cached feed TTL expires or an invalidation event completes (Freshness). For a social photo-sharing app, minor staleness is completely acceptable in exchange for high responsiveness.

### Trade-off 2: Availability vs. Consistency (Read Replication & Eventual Consistency)
- **The Decision:** All feed reads are served by Read Replicas rather than the Primary Database, embracing the **AP** model of the CAP Theorem.
- **Gains:** The system achieves high availability and survives node failures; if one read replica crashes, others absorb the $2,500\text{ QPS}$ feed load seamlessly without degrading the site (Availability).
- **Costs:** Because database replication between the Primary and Replicas is asynchronous (replication lag $\approx 10\text{--}100\text{ ms}$), an author who immediately reloads their profile after uploading might temporarily not see their own new photo (Eventual Consistency). We mitigate this by reading directly from the primary for the author's own immediate upload confirmation or displaying optimistic UI state on the client.
