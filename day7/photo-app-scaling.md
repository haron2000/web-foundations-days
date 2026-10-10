# SnapShare Scaling Plan

## 1. Assumptions

SnapShare is a photo-sharing application where users upload photos and view a feed containing photos from people they follow.

The following assumptions are provided:

* Registered users: 10,000,000
* Daily active users: 10% of registered users
* Each active user uploads 1 photo per day
* Each active user views 50 feed pages per day
* Average original photo size: 2 MB
* Average thumbnail size: 50 KB
* Each photo has one thumbnail
* A year is assumed to have 365 days
* Average traffic is calculated across 24 hours
* Peak traffic is assumed to be 5 times the average traffic

### Daily Active Users

10,000,000 × 10% = 1,000,000 daily active users.

Therefore, SnapShare has approximately **1 million daily active users**.

---

## 2. Traffic and Storage Estimates

### Photo Uploads Per Day

Each daily active user uploads one photo:

1,000,000 users × 1 photo = **1,000,000 uploads per day**

### Uploads Per Second

There are 86,400 seconds in a day:

1,000,000 ÷ 86,400 = approximately **11.6 uploads per second**

The average upload rate is therefore approximately **12 uploads per second**.

### Peak Upload Rate

Using the 5× peak assumption:

11.6 × 5 = approximately **57.9 uploads per second**

Therefore, the system should be designed to handle approximately **58 uploads per second at peak**.

---

### Feed Views Per Day

Each active user views 50 feed pages:

1,000,000 × 50 = **50,000,000 feed views per day**

### Average Feed Views Per Second

50,000,000 ÷ 86,400 = approximately **579 feed views per second**

### Peak Feed Views Per Second

579 × 5 = approximately **2,894 feed views per second**

Therefore, the system should be designed to handle approximately **2,900 feed views per second at peak**.

---

## 3. Photo Storage Per Year

Each uploaded photo requires storage for both the original photo and its thumbnail.

### Storage Per Photo

Original photo:

2 MB

Thumbnail:

50 KB = 0.05 MB

Total:

2 MB + 0.05 MB = **2.05 MB per photo**

### Photos Per Year

1,000,000 uploads per day × 365 days = **365,000,000 photos per year**

### Annual Storage

365,000,000 × 2.05 MB = **748,250,000 MB**

This is approximately:

* **748.25 TB** using decimal storage units
* Approximately **0.75 PB per year**

Therefore, SnapShare needs roughly **748 TB of new photo and thumbnail storage every year**, before accounting for backups, replication or other metadata.

---

## 4. Read-Heavy or Write-Heavy?

SnapShare is a **read-heavy system**.

There are approximately 12 average photo uploads per second but approximately 579 feed views per second. Feed views therefore generate far more requests than photo uploads.

This means the architecture should focus heavily on making reads fast and scalable. Caching, a CDN, database read replicas and multiple application servers can help handle the large number of feed requests without overwhelming the primary database.

---

## 5. Why Photos Should Not Be Stored in the Database

The actual photo files should not be stored directly inside the relational database because large binary files would consume significant database storage, increase backup sizes and make database operations more expensive.

Instead, the original photos and thumbnails should be stored in **object storage**, while the database stores metadata such as the photo ID, owner, caption, file location, upload time and relationships.

Object storage is designed to store large numbers of files efficiently and can work together with a CDN to deliver photos quickly to users.

---

## 6. Architecture Diagram

```text
                         ┌──────────────┐
                         │    Users     │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │     CDN      │
                         └──────┬───────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Load Balancer  │
                       └────────┬────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
          ┌──────────┐    ┌──────────┐    ┌──────────┐
          │ App      │    │ App      │    │ App      │
          │ Server 1 │    │ Server 2 │    │ Server 3 │
          └────┬─────┘    └────┬─────┘    └────┬─────┘
               │               │               │
               └───────────────┼───────────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
              ┌───────────┐        ┌──────────────┐
              │   Cache   │        │   Database   │
              └───────────┘        │    Primary   │
                                   └──────┬───────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │ Read Replica │
                                   └──────────────┘


             Photo Upload
                  │
                  ▼
          ┌───────────────┐
          │ Object Storage│
          │ Originals +   │
          │ Thumbnails    │
          └───────┬───────┘
                  │
                  │ thumbnail job
                  ▼
             ┌─────────┐
             │  Queue  │
             └────┬────┘
                  │
                  ▼
             ┌─────────┐
             │ Worker  │
             └────┬────┘
                  │
                  ▼
          ┌───────────────┐
          │ Object Storage│
          │   Thumbnail   │
          └───────────────┘
```

## 7. Component Responsibilities

* **CDN:** Caches and delivers frequently accessed photos close to users, reducing latency and traffic reaching the application servers.
* **Load Balancer:** Distributes incoming requests across multiple application servers so that no single server becomes a bottleneck.
* **App Servers:** Run the SnapShare application logic and handle authentication, uploads, feed generation and other API requests.
* **Cache:** Stores frequently requested data such as feed information so the application does not repeatedly query the database.
* **Database:** Stores structured information such as users, follows, photo metadata and relationships.
* **Read Replica:** Handles read queries separately from the primary database, reducing the read workload on the primary database.
* **Object Storage:** Stores the large original photo files and thumbnails without placing those files directly inside the database.
* **Queue:** Holds background thumbnail-generation jobs so uploading a photo does not have to wait for thumbnail processing.
* **Worker:** Processes queued jobs and creates thumbnails from uploaded original photos.

---

## 8. Photo Upload Flow

When a user uploads a photo, the process would work as follows:

1. The user selects a photo in the SnapShare application.
2. The request reaches the load balancer, which sends it to an available application server.
3. The application server authenticates the user and validates the uploaded file.
4. The original photo is uploaded to object storage.
5. The application creates a database record containing metadata such as the user ID, photo ID and object-storage location.
6. A thumbnail-generation job is placed onto the queue.
7. The application can respond to the user without waiting for the thumbnail to be generated.
8. A worker takes the thumbnail job from the queue.
9. The worker downloads or accesses the original photo from object storage.
10. The worker creates the 50 KB thumbnail.
11. The thumbnail is stored in object storage.
12. The thumbnail location is recorded or associated with the photo metadata.
13. The CDN can then cache and efficiently deliver the original photo or thumbnail to users.

---

## 9. Trade-offs

### Trade-off 1: Cache vs Fresh Data

Caching feed data improves performance and reduces database load, but cached information can become temporarily outdated. SnapShare would need to choose an appropriate cache expiration time and decide which data requires immediate consistency.

### Trade-off 2: Read Replica vs Data Consistency

A database read replica allows the system to handle more read traffic, but replication can introduce a small delay between the primary database and the replica. A user may therefore briefly see older data after making a change.

### Trade-off 3: Object Storage vs Simplicity

Object storage is much better suited to large photo files and allows the database to remain smaller, but it introduces another infrastructure component that must be managed and secured.

### Trade-off 4: Asynchronous Thumbnails vs Immediate Availability

Using a queue and worker makes uploads faster because thumbnail creation happens in the background. However, there may be a short period after uploading when the thumbnail is not yet available.

---

## 10. Conclusion

SnapShare should use a horizontally scalable application architecture because its workload is strongly read-heavy, with thousands of feed requests per second during peak periods. A CDN, cache and database read replica can reduce pressure on the application and primary database, while object storage provides scalable storage for hundreds of terabytes of photos and thumbnails. A queue and background worker allow thumbnail generation to happen asynchronously so that photo uploads remain responsive as the system grows.
