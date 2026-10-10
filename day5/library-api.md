# Library Books REST API

This API manages books in a library system. The main resource is `books`.

## API Endpoints

### 1. List all books

* **Method:** GET
* **Path:** `/books`
* **Description:** Returns a list of all books in the library.
* **Success status:** `200 OK`

### 2. Get one book

* **Method:** GET
* **Path:** `/books/{id}`
* **Description:** Returns the details of one book using its ID.
* **Success status:** `200 OK`

### 3. Create a book

* **Method:** POST
* **Path:** `/books`
* **Description:** Creates a new book in the library.
* **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958
}
```

* **Success status:** `201 Created`

### 4. Update a book

* **Method:** PUT
* **Path:** `/books/{id}`
* **Description:** Updates an existing book using its ID.
* **Example request body:**

```json
{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "year": 1958
}
```

* **Success status:** `200 OK`

### 5. Delete a book

* **Method:** DELETE
* **Path:** `/books/{id}`
* **Description:** Deletes an existing book using its ID.
* **Success status:** `204 No Content`

### 6. List books by author

* **Method:** GET
* **Path:** `/books?author=Chinua%20Achebe`
* **Description:** Returns all books written by the specified author using the `author` query parameter.
* **Success status:** `200 OK`

## Error Codes

### 400 Bad Request

* **Description:** The request is invalid or contains missing or invalid data.
* **Example:** A client sends a POST request to `/books` without providing the required `title` or `author` fields.

### 404 Not Found

* **Description:** The requested resource does not exist.
* **Example:** A client requests `GET /books/9999` when no book with ID `9999` exists.
