# SnapShare Scaling Plan

## 1. Assumptions

SnapShare is a photo-sharing application where users upload photos and scroll through a feed containing photos from people they follow.

The provided assumptions are:

* Registered users: 10,000,000
* 10% of registered users are active each day
* Each active user uploads 1 photo per day
* Each active user views 50 feed pages per day
* Average original photo size: 2 MB
* Each photo has a 50 KB thumbnail
* A year has 365 days
* Average traffic is distributed across 24 hours
* Peak traffic is estimated at 5 times the average traffic

### Daily Active Users

10,000,000 × 10% = 1,000,000

Therefore, SnapShare has **1,000,000 daily active users**.

---

## 2. Traffic and Storage Estimates

### Uploads Per Day

Each active user uploads one photo:

1,000,000 × 1 = **1,000,000 uploads per day**

### Average Uploads Per Second

There are 86,400 seconds in a day:

1,000,000 ÷ 86,400 = **11.6 uploads per second**

The average upload rate is therefore approximately **12 uploads per second**.

### Peak Uploads Per Second

Using a 5× peak factor:

11.6 × 5 = **57.9 uploads per second**

The system should therefore handle approximately **58 uploads per second at peak**.

### Feed Views Per Day

Each active user views 50 feed pages:

1,000,000 × 50 = **50,000,000 feed views per day**

### Average Feed Views Per Second

50,000,000 ÷ 86,400 = **578.7 feed views per second**

The average is approximately **579 feed views per second**.

### Peak Feed Views Per Second

579 × 5 = **2,895 feed views per second**

Therefore, the system should be designed to handle approximately **2,900 feed views per second at peak**.

### Photo Storage Per Year

Each photo requires:

* Original: 2 MB
* Thumbnail: 50 KB = 0.05 MB
* Total: 2.05 MB

There are:

1,000,000 × 365 = **365,000,000 photos per year**

Annual storage:

365,000,000 × 2.05 MB = **748,250,000 MB**

This is approximately **748.25 TB**, or about **0.75 PB**, of new photo and thumbnail storage per year.

This estimate does not include additional storage required for backups, replication or other metadata.

---

## 3. Read-Heavy or Write-Heavy?

SnapShare is a **read-heavy system**.

Each active user creates approximately 1 upload but views 50 feed pages per day. This means the application has roughly 50 feed reads for every photo upload.

The architecture should therefore prioritize fast and scalable reads. A CDN can serve frequently accessed photos, a cache can reduce repeated database queries, and a read replica can handle additional database read traffic without placing all the load on the primary database.

---

## 4. Photo Storage

Photos should not be stored directly inside the relational database.

Storing large binary files in the database would significantly increase database storage requirements, make backups larger and potentially make database operations more expensive.

Instead, SnapShare should store original photos and thumbnails in **object storage**. The database should store metadata such as the photo ID, user ID, caption, upload time and object-storage location.

Object storage is better suited to storing hundreds of terabytes of media files and can work with a CDN to deliver photos efficiently to users.

---

## 5. Architecture Diagram

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
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
              ┌──────────┐     ┌──────────┐     ┌──────────┐
              │ App      │     │ App      │     │ App      │
              │ Server 1 │     │ Server 2 │     │ Server 3 │
              └────┬─────┘     └────┬─────┘     └────┬─────┘
                   │                │                │
                   └────────────────┼────────────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │                                │
                    ▼                                ▼
              ┌───────────┐                  ┌──────────────┐
              │   Cache   │                  │   Database   │
              └───────────┘                  │   Primary    │
                                             └──────┬───────┘
                                                    │
                                                    ▼
                                             ┌──────────────┐
                                             │ Read Replica │
                                             └──────────────┘


                         PHOTO UPLOAD FLOW
                                │
                                ▼
                         ┌──────────────┐
                         │ App Server   │
                         └──────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
             ┌───────────────┐       ┌──────────────┐
             │ Object Storage│       │     Queue    │
             │ Original Photo│       │ Thumbnail Job│
             └───────┬───────┘       └──────┬───────┘
                     │                       │
                     │                       ▼
                     │                ┌──────────────┐
                     │                │    Worker    │
                     │                └──────┬───────┘
                     │                       │
                     │                       ▼
                     │                ┌───────────────┐
                     └───────────────►│Object Storage │
                                      │   Thumbnail   │
                                      └───────────────┘
```

The upload flow is separated from thumbnail processing so the user does not have to wait for the background image-processing job to finish.

---

## 6. Component Responsibilities

* **CDN:** Caches and delivers frequently requested photos and thumbnails from locations closer to users, reducing latency and traffic reaching the application servers.

* **Load Balancer:** Distributes incoming requests across multiple application servers so that traffic can be handled horizontally without relying on one server.

* **App Servers:** Run the SnapShare application logic, including authentication, feed requests, photo uploads and database operations.

* **Cache:** Stores frequently requested information such as feed data to reduce repeated database queries and improve response times.

* **Primary Database:** Stores structured application data such as users, follows, photo metadata and relationships.

* **Read Replica:** Handles database read operations separately from the primary database, allowing the system to scale read traffic without putting all queries on the primary database.

* **Object Storage:** Stores the large original photo files and generated thumbnails without putting large binary objects inside the relational database.

* **Queue:** Stores background thumbnail-generation jobs so that image processing can happen asynchronously after the upload request is accepted.

* **Worker:** Retrieves thumbnail jobs from the queue, processes the original image and stores the resulting thumbnail in object storage.

---

## 7. Photo Upload Flow

The photo upload process works as follows:

1. The user selects a photo and starts an upload from the SnapShare application.

2. The request reaches the load balancer, which forwards it to an available application server.

3. The application server authenticates the user and validates the uploaded file, including checking its type and size.

4. The application server uploads the original 2 MB photo to object storage.

5. After the original photo has been stored successfully, the application creates a database record containing information such as the photo ID, user ID, upload time and object-storage location.

6. The application server places a thumbnail-generation job on the queue. The job contains enough information for the worker to locate the original photo.

7. The application can respond to the user that the upload was accepted without waiting for thumbnail generation to finish.

8. A worker continuously monitors the queue and retrieves the thumbnail-generation job.

9. The worker accesses the original photo from object storage.

10. The worker generates the 50 KB thumbnail.

11. The worker stores the generated thumbnail in object storage.

12. The thumbnail location is associated with the photo metadata so that it can be used when displaying feeds.

13. The CDN can cache the thumbnail and serve it quickly to users when they view the photo.

This design makes thumbnail generation asynchronous, preventing slow image processing from blocking the main upload request.

---

## 8. Trade-Offs

### Trade-Off 1: Caching vs Fresh Data

Caching feed data reduces database load and improves response times, but cached information may become temporarily outdated.

For example, a newly uploaded photo might not immediately appear in every cached feed. SnapShare would therefore need to choose suitable cache expiration times and decide which information requires immediate consistency.

### Trade-Off 2: Read Replicas vs Consistency

Read replicas allow SnapShare to distribute database read traffic and protect the primary database from excessive queries.

However, database replication can introduce a small delay. A user may therefore briefly read older data from a replica immediately after making a change on the primary database.

### Trade-Off 3: Asynchronous Processing vs Immediate Availability

Using a queue and worker makes photo uploads faster because thumbnail generation happens in the background.

The trade-off is that the thumbnail may not be immediately available after the upload. The system must also handle failed jobs and retry thumbnail processing when necessary.

### Trade-Off 4: Object Storage vs System Complexity

Object storage is much more suitable for large amounts of photo data and prevents the database from becoming overloaded with binary files.

However, it introduces another service that must be configured, secured, monitored and integrated with the application.

---

## 9. Conclusion

SnapShare is a read-heavy application that must support approximately 579 feed views per second on average and nearly 2,900 feed views per second during peak periods. It also needs to store approximately 748 TB of new photo and thumbnail data every year.

The proposed architecture uses a CDN, load balancer, multiple application servers, caching, a primary database with a read replica, object storage and asynchronous thumbnail processing through a queue and worker.

Separating photo storage from the database protects database performance, while caching, read replicas and the CDN help the system handle the much larger read workload. The queue and worker allow expensive thumbnail processing to happen asynchronously without making users wait for the entire upload pipeline to finish.
