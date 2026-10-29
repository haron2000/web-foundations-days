# TicketHub Design Document

## 1. Context

TicketHub is a website that allows users to discover events such as concerts, view available seats, reserve seats, pay for tickets, and view their purchased tickets.

The main engineering challenge is handling a very popular concert where a large number of users attempt to purchase a limited number of seats at almost the same time. The system must remain available and responsive while guaranteeing that the same seat cannot be sold to two different users.

---

## 2. Goals and Non-Goals

### Goals

The design should:

- Allow users to browse available events.
- Allow users to view seats for an event.
- Allow users to temporarily hold seats.
- Allow users to pay for held seats.
- Allow users to view their purchased tickets.
- Prevent two users from purchasing the same seat.
- Handle sudden traffic spikes during popular ticket sales.
- Keep ticket purchasing reliable and secure.

### Non-Goals

This design does not attempt to:

- Build a real payment provider.
- Design a complete recommendation system.
- Support ticket resale between users.
- Store large media files such as concert videos.
- Provide a complete implementation of the TicketHub backend.

---

# 3. Requirements

## 3.1 Functional Requirements

TicketHub must allow users to:

1. Register and authenticate.
2. Browse upcoming events.
3. View information about an event.
4. View the seats available for an event.
5. Temporarily hold one or more available seats.
6. Complete payment for held seats.
7. Receive tickets after successful payment.
8. View their purchased tickets.
9. Prevent a seat from being sold to more than one user.
10. Automatically release seats when a temporary hold expires.

## 3.2 Non-Functional Requirements

### Performance

Normal event browsing should respond quickly, and seat availability requests should normally complete within a few hundred milliseconds. The system should continue providing acceptable response times during a major ticket sale.

### Correctness

The system must never confirm two successful purchases for the same seat at the same event.

### Fairness

The system should prevent a small number of users or automated clients from overwhelming the ticket sale. Rate limiting and a waiting-room or queue mechanism can be used during extremely popular sales.

### Availability

TicketHub should remain available even if an individual application server fails.

### Scalability

The application must be able to scale horizontally when traffic increases, particularly during a major concert sale.

### Security

Users must only be able to access their own orders and tickets. Authentication, authorization, HTTPS, input validation, and secure payment processing are required.

### Reliability

Successful orders must be stored durably, and failed or interrupted payment attempts must not leave seats permanently unavailable.

---

# 4. Scale Estimates

The assignment provides these assumptions:

- 2 million registered users
- 50,000 visitors on a normal day
- Each visitor views 10 pages
- 5,000 tickets sold on a normal day
- A popular concert has 200,000 people trying to buy 20,000 seats within 10 minutes

## 4.1 Normal Traffic

Daily page views:

```text
50,000 visitors × 10 pages
= 500,000 page views/day
```

Using approximately 100,000 seconds of active traffic per day:

```text
500,000 ÷ 100,000
= 5 requests/second
```

Therefore, normal browsing traffic is approximately **5 requests per second** using the assignment's approximation.

Normal ticket sales:

```text
5,000 tickets/day ÷ 100,000 seconds
= 0.05 ticket writes/second
```

Normal traffic is therefore relatively small.

## 4.2 Popular Concert Traffic

During the major sale:

```text
200,000 people
20,000 seats
10 minutes
```

Ten minutes is:

```text
10 × 60
= 600 seconds
```

Average purchase attempts:

```text
200,000 ÷ 600
≈ 333 attempts/second
```

The system should therefore be designed with capacity above approximately **333 purchase attempts per second**, because traffic will not arrive perfectly evenly.

The event has:

```text
20,000 seats
```

but:

```text
200,000 people
```

are competing for them.

This means approximately **10 people are competing for every available seat**.

## 4.3 Comparison

| Metric | Normal Day | Popular Concert |
|---|---:|---:|
| Users/visitors | 50,000/day | 200,000 attempting to buy |
| Page views | 500,000/day | Large burst |
| Purchase activity | 5,000 tickets/day | 200,000 purchase attempts/10 min |
| Approx. request rate | 5 requests/sec | 333 purchase attempts/sec |
| Traffic pattern | Relatively steady | Extreme burst |
| Main concern | General performance | Seat contention and availability |

The major challenge is therefore not normal traffic but the sudden burst of users competing for a limited inventory of seats.

---

# 5. API Design

The TicketHub API provides endpoints for browsing events, viewing seats, holding seats, making payments, and viewing tickets.

## 5.1 List Events

```http
GET /events
```

Returns upcoming events.

Success:

```text
200 OK
```

Example response:

```json
{
  "events": [
    {
      "id": 101,
      "name": "Summer Music Festival",
      "venue": "Nairobi Arena",
      "startsAt": "2026-12-20T18:00:00Z"
    }
  ]
}
```

## 5.2 View Event Seats

```http
GET /events/{eventId}/seats
```

Returns the seats and their current availability for an event.

Success:

```text
200 OK
```

Example response:

```json
{
  "eventId": 101,
  "seats": [
    {
      "id": 501,
      "label": "A1",
      "status": "available"
    },
    {
      "id": 502,
      "label": "A2",
      "status": "held"
    },
    {
      "id": 503,
      "label": "A3",
      "status": "sold"
    }
  ]
}
```

## 5.3 Hold Seats

```http
POST /events/{eventId}/holds
```

Temporarily holds selected available seats for the authenticated user.

Success:

```text
201 Created
```

Example request:

```json
{
  "seatIds": [501, 502]
}
```

Example response:

```json
{
  "holdId": "H789",
  "eventId": 101,
  "seatIds": [501, 502],
  "expiresAt": "2026-12-20T17:10:00Z"
}
```

If the requested seats are no longer available:

```text
409 Conflict
```

## 5.4 Pay for an Order

```http
POST /orders/{orderId}/payment
```

Processes payment for an order containing held seats.

Success:

```text
200 OK
```

Example request:

```json
{
  "paymentToken": "payment-token-from-provider"
}
```

Example response:

```json
{
  "orderId": 9001,
  "status": "paid",
  "ticketIds": [7001, 7002]
}
```

A failed payment should not mark the seats as sold.

## 5.5 View User Tickets

```http
GET /tickets
```

Returns tickets belonging to the authenticated user.

Success:

```text
200 OK
```

Example response:

```json
{
  "tickets": [
    {
      "id": 7001,
      "eventId": 101,
      "seatLabel": "A1",
      "status": "valid"
    }
  ]
}
```

## 5.6 View One Ticket

```http
GET /tickets/{ticketId}
```

Returns information about one ticket owned by the authenticated user.

Success:

```text
200 OK
```

If the ticket does not exist:

```text
404 Not Found
```

---

# 6. Data Model

The system uses a relational database because ticket purchases require strong consistency, transactions, constraints, and relationships between users, events, seats, and orders.

## 6.1 Users

Stores registered TicketHub users.

```text
users
-----
id              PRIMARY KEY
name
email           UNIQUE
password_hash
created_at
```

## 6.2 Events

Stores concerts and other events.

```text
events
------
id              PRIMARY KEY
name
venue
starts_at
created_at
```

## 6.3 Seats

Stores physical seat definitions.

```text
seats
-----
id              PRIMARY KEY
label
row_name
section
```

## 6.4 Event Seats

An event needs its own inventory because the same physical seat can be used for different events.

```text
event_seats
-----------
id              PRIMARY KEY
event_id        FOREIGN KEY
seat_id         FOREIGN KEY
status
hold_id
hold_expires_at
```

Possible statuses are:

```text
available
held
sold
```

A unique constraint on:

text
(event_id, seat_id)


ensures that a particular seat is represented only once for a particular event.

## 6.5 Orders

Stores ticket purchases.

text
orders
------
id              PRIMARY KEY
user_id         FOREIGN KEY
event_id        FOREIGN KEY
status
total_amount
created_at


Possible order statuses include:

text
pending
paid
cancelled
expired


## 6.6 Order Items

An order can contain multiple seats, so order items connect an order to specific event seats.

text
order_items
-----------
id              PRIMARY KEY
order_id        FOREIGN KEY
event_seat_id   FOREIGN KEY
price


## 6.7 Relationships

The main relationships are:

text
users
  |
  | 1-to-many
  v
orders
  |
  | 1-to-many
  v
order_items
  |
  v
event_seats
  |
  +----------> events
  |
  +----------> seats


A user can have many orders.

An order can contain multiple order items.

An event has many event seats.

A physical seat can be associated with many events through `event_seats`.

---

# 7. Preventing Double Booking

Preventing double booking is the most important correctness requirement in TicketHub.

Consider two users trying to purchase the same seat at the same time:

text
User A -> Seat A1
User B -> Seat A1


A simple application-level check is unsafe:

text
Check seat
    ↓
If available
    ↓
Buy seat


Both requests could check the seat before either request updates