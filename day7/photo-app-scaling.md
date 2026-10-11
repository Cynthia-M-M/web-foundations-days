# 📸 SnapShare Scaling Plan

Scaling plan and system architecture for **SnapShare**, a photo-sharing application where users upload photos and scroll an algorithmic feed of posts from accounts they follow.

---

## 1. Baseline Assumptions & Daily Active Users (DAU)

- **Registered Users:** $10,000,000$ users
- **Daily Active Users (DAU):** $10\%$ of registered users active each day
  $$\text{DAU} = 10,000,000 \times 0.10 = \mathbf{1,000,000\text{ Daily Active Users}}$$
- **Time Standard:**
  - **Exact Production Standard:** $1\text{ day} = 24\text{ hours} \times 60\text{ min} \times 60\text{ sec} = \mathbf{86,400\text{ seconds}}$.
  - *Heuristic Note:* While approximating $1\text{ day} \approx 100,000\text{ seconds}$ is common for mental arithmetic, in production capacity planning it underestimates traffic throughput by roughly $\mathbf{13.6\%\text{ to }15.7\%}$. All capacity planning and compute headroom calculations below use the exact standard of **$86,400\text{ seconds}$** to ensure infrastructure is never under-provisioned.
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
- **Average Write QPS (Exact Divisor: 86,400s):**
  $$\text{Average Uploads/sec} = \frac{1,000,000\text{ uploads}}{86,400\text{ seconds}} \approx \mathbf{11.57\text{ uploads/second}}$$
- **Peak Write QPS ($5\times$ Average Spike):**
  $$\text{Peak Uploads/sec} = 11.57 \times 5 = \mathbf{57.87 \approx 58\text{ uploads/second}}$$

### B. Feed Page Views (Read Throughput)

- **Daily Feed View Volume:**
  $$\text{Daily Feed Views} = 1,000,000\text{ DAU} \times 50\text{ views/day} = \mathbf{50,000,000\text{ views/day}}$$
- **Average Read QPS (Exact Divisor: 86,400s):**
  $$\text{Average Feed Views/sec} = \frac{50,000,000\text{ views}}{86,400\text{ seconds}} \approx \mathbf{578.70\text{ views/second}}$$
- **Peak Read QPS ($5\times$ Average Spike):**
  $$\text{Peak Feed Views/sec} = 578.70 \times 5 = \mathbf{2,893.52 \approx 2,894\text{ views/second}}$$

### C. Throughput Comparison: 86,400s vs. 100,000s Heuristic

| Metric | 100,000s Heuristic | Exact 86,400s Standard | Under-Estimation Gap |
| :--- | :--- | :--- | :--- |
| **Average Write QPS** | $10\text{ QPS}$ | $\mathbf{11.57\text{ QPS}}$ | $+15.7\%$ higher throughput |
| **Peak Write QPS** | $50\text{ QPS}$ | $\mathbf{57.87\text{ QPS } (58)}$ | $+15.7\%$ higher peak surge |
| **Average Read QPS** | $500\text{ QPS}$ | $\mathbf{578.70\text{ QPS}}$ | $+15.7\%$ higher throughput |
| **Peak Read QPS** | $2,500\text{ QPS}$ | $\mathbf{2,893.52\text{ QPS } (2,894)}$ | $+15.7\%$ higher peak surge |
| **Combined Peak QPS** | $2,550\text{ QPS}$ | $\mathbf{2,951.39\text{ QPS } (2,952)}$ | **$+402\text{ QPS}$ unaccounted load** |

*Takeaway:* Relying on the 100,000s divisor leaves a **$402\text{ QPS}$ blindspot** during peak traffic. In production, this causes application servers to operate beyond safe CPU utilization thresholds, triggering thread pool exhaustion, latency spikes, and 504 Gateway Timeouts.

### D. Stateless Application Tier Compute & Headroom Planning

- **Total Combined Peak Load:**
  $$\text{Peak Total QPS} = 58\text{ writes/s} + 2,894\text{ reads/s} = \mathbf{2,952\text{ requests/second}}$$
- **Compute Instance Sizing Baseline:**
  - Standard container instance (e.g., AWS ECS/EKS container running Node.js/Go with 4 vCPUs and 8 GB RAM).
  - Target throughput per instance: **$250\text{ QPS}$** under $P99 < 50\text{ ms}$ latency at a healthy **$65\%$ CPU utilization** target (leaving $35\%$ buffer to prevent queuing delays).
- **Baseline Peak Instances Required:**
  $$\text{Baseline Instances} = \frac{2,952\text{ QPS}}{250\text{ QPS/instance}} = 11.81 \approx \mathbf{12\text{ instances}}$$
- **Production Headroom & Fault Tolerance ($N + 2$ / 30% Safety Headroom):**
  - To survive an entire Availability Zone (AZ) outage, accommodate burst traffic spikes, and perform rolling zero-downtime deployments without degraded performance, we apply a **$30\%$ safety headroom multiplier**:
    $$\text{Production Compute Instances} = 12\text{ instances} \times 1.30 = 15.6 \approx \mathbf{16\text{ compute instances}}$$
  - *Under-Provisioning Consequence:* If sized using the 100,000s heuristic ($2,550\text{ QPS}$), an engineer would provision only $10$ baseline instances ($2,550 / 250$). When real peak traffic hits ($2,952\text{ QPS}$), those 10 instances would run at **$>85\text{--}90\%$ CPU saturation**, destroying latency and exhausting connection pools. Sizing with **86,400s** guarantees the cluster scales comfortably to **16 instances** with true production headroom.

### E. Photo Storage Accumulation

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
  1. **In-Memory Caching (Redis):** Because feed queries are read-intensive and compute-heavy (joining followers and recent posts), precomputed feeds and metadata must be aggressively cached in Redis to sustain $2,894\text{ peak read QPS}$ with sub-$10\text{ ms}$ latency.
  2. **Database Read/Write Splitting:** The primary database will only handle write operations ($11.57\text{--}58\text{ QPS}$), while multiple read replicas scale horizontally to absorb read traffic on cache misses.
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
9. **Worker Fleet:** Autonomous background compute processes that consume tasks from the message queue with manual acknowledgment (`autoAck = false`) to generate thumbnails and persist assets reliably without blocking user requests.

---

## 7. Step-by-Step Photo Upload & Thumbnail Pipeline

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
                                                                                   [Worker Fleet]
                                                                                         │
                                                                   ┌─6a. Pull Original & Resize (50 KB)
                                                                   ├─6b. Upload Thumbnail ──> [Object Storage]
                                                                   ├─6c. Commit Metadata  ──> [Primary DB]
                                                                   │     (UPDATE photos SET thumbnail_url = ...)
                                                                   │
                                                                   └─6d. Manual ACK ────────> [Message Queue]
                                                                         (ONLY after 6b and 6c succeed!)
```

### End-to-End Execution Flow:

1. **Client Request:** The user selects a photo on their mobile or web client and initiates an HTTP `POST /photos` request with the $2\text{ MB}$ image payload, which reaches the Load Balancer and is routed to a healthy, stateless App Server.
2. **Direct-to-Storage Ingestion:** The App Server streams the $2\text{ MB}$ binary photo directly into **Object Storage (Amazon S3)**, receiving a unique permanent object URL (or S3 key).
3. **Primary Database Write:** The App Server inserts a new metadata record into the **Primary PostgreSQL Database** containing `user_id`, timestamps, caption, original S3 URL, and an initial `status = 'processing'`.
4. **Asynchronous Job Enqueue:** The App Server immediately pushes a background processing job payload (`{ event: "GENERATE_THUMBNAIL", photoId: 10482, originalUrl: "s3://..." }`) into the **Message Queue (RabbitMQ)**.
5. **Immediate Client Response:** Without waiting for thumbnail generation, the App Server returns **HTTP 201 Created** along with the photo metadata to the user in under $50\text{ ms}$, ensuring an instantaneous, frictionless upload experience.

---

### Critical Pipeline Invariant: Worker Acknowledgment Ordering

To prevent **orphaned jobs** and **feed rendering failures**, the background worker fleet strictly adheres to a three-step transactional sequence before acknowledging tasks:

* **Step 6a: Fetch & Transform:** A worker consumes the message using manual acknowledgment mode (`autoAck = false`). It streams the $2\text{ MB}$ original image from S3 into worker memory and resizes it to a $50\text{ KB}$ web-optimized thumbnail.
* **Step 6b: Write to Object Storage:** The worker uploads the generated thumbnail directly back to **Object Storage (S3)** and verifies a successful HTTP `200 OK` / ETag confirmation.
* **Step 6c: Commit to Database:** The worker opens a transaction on the Primary Database, updates the photo record with the permanent thumbnail URL, and marks the status as ready:
  ```sql
  BEGIN;
  UPDATE photos 
  SET thumbnail_url = 'https://s3.amazonaws.com/snapshare-media/thumb_10482.jpg',
      status = 'ready',
      updated_at = NOW()
  WHERE id = 10482;
  COMMIT;
  ```
* **Step 6d: Acknowledge Queue Message (`basic_ack`):** The worker emits `channel.basic_ack(deliveryTag)` to RabbitMQ **ONLY AFTER BOTH** the S3 upload (6b) and the database commit (6c) have successfully concluded.

#### Why This Ordering Is Non-Negotiable:
1. **Preventing Orphaned Jobs:** If the worker acknowledged the message *before* completing the database update, and the worker process crashed or suffered a database network partition immediately after, the message would be permanently removed from RabbitMQ. The thumbnail URL would never be committed, leaving the post permanently stuck in `'processing'` and causing **broken image links and feed rendering failures** for all followers.
2. **At-Least-Once Delivery & Safe Retries:** With delayed manual acknowledgment, if the worker crashes at any point prior to step 6d, RabbitMQ detects the broken TCP connection, restores the message to the queue, and re-delivers it to another healthy worker node.
3. **Dead-Letter Queue (DLQ) Safeguard:** If a corrupt or unparseable image causes repeated worker crashes, the message is routed after 3 failed attempts (`max-retries = 3`) to a Dead-Letter Queue (DLQ) with an automated alert, ensuring malformed uploads never block the processing pipeline.

---

## 8. System Trade-offs

Senior system design requires balancing conflicting technical constraints. SnapShare embodies two critical architectural trade-offs:

### Trade-off 1: Speed vs. Freshness (Feed Caching)

- **The Decision:** User feeds are precomputed and cached in Redis with a Time-To-Live (TTL).
- **Gains:** Feed reads return in $<10\text{ ms}$ even during the peak of **$2,894\text{ views/sec}$**, preserving database stability and delivering instant scrolling performance (Speed).
- **Costs:** If a creator uploads a new photo, their followers may not see it on their feed for a brief window until the cached feed TTL expires or an invalidation event completes (Freshness). For a social photo-sharing app, minor staleness is completely acceptable in exchange for high responsiveness.

### Trade-off 2: Availability vs. Consistency (Read Replication & Eventual Consistency)

- **The Decision:** All feed reads are served by Read Replicas rather than the Primary Database, embracing the **AP** model of the CAP Theorem.
- **Gains:** The system achieves high availability and survives node failures; if one read replica crashes, others absorb the **$2,894\text{ QPS}$** feed load seamlessly without degrading the site (Availability).
- **Costs:** Because database replication between the Primary and Replicas is asynchronous (replication lag $\approx 10\text{--}100\text{ ms}$), an author who immediately reloads their profile after uploading might temporarily not see their own new photo (Eventual Consistency). We mitigate this by reading directly from the primary for the author's own immediate upload confirmation or displaying optimistic UI state on the client.
