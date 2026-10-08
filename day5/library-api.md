# 📖 Library REST API Specification: Books Resource

This document outlines the RESTful API design for managing the **Books** resource in a modern digital library system. It follows standard REST architectural principles, using plural resource nouns, appropriate HTTP verbs, and consistent status codes.

---

## 📌 Base URL
```http
https://api.library.example.com/api/v1
```

---

## 🚀 API Endpoints

### 1. List All Books
- **Method:** `GET`
- **Path:** `/books`
- **Description:** Retrieves a paginated list of all books cataloged in the library.
- **Success Status Code:** `200 OK`
- **Example Response Body:**
  ```json
  [
    {
      "id": 1,
      "title": "Clean Code",
      "author": "Robert C. Martin",
      "isbn": "978-0132350884",
      "publishedYear": 2008,
      "available": true
    },
    {
      "id": 2,
      "title": "The Pragmatic Programmer",
      "author": "Andy Hunt",
      "isbn": "978-0201616224",
      "publishedYear": 1999,
      "available": false
    }
  ]
  ```

---

### 2. List Books by Author
- **Method:** `GET`
- **Path:** `/books?author={authorName}`
- **Description:** Retrieves all books filtered by a specific author's name using a URL query parameter.
- **Success Status Code:** `200 OK`
- **Example Response Body (`GET /books?author=Andy%20Hunt`):**
  ```json
  [
    {
      "id": 2,
      "title": "The Pragmatic Programmer",
      "author": "Andy Hunt",
      "isbn": "978-0201616224",
      "publishedYear": 1999,
      "available": false
    }
  ]
  ```

---

### 3. Get One Book
- **Method:** `GET`
- **Path:** `/books/:id`
- **Description:** Retrieves detailed information for a single book identified by its unique numeric ID.
- **Success Status Code:** `200 OK`
- **Example Response Body (`GET /books/1`):**
  ```json
  {
    "id": 1,
    "title": "Clean Code",
    "author": "Robert C. Martin",
    "isbn": "978-0132350884",
    "publishedYear": 2008,
    "genre": "Software Engineering",
    "pages": 464,
    "available": true
  }
  ```

---

### 4. Create a New Book
- **Method:** `POST`
- **Path:** `/books`
- **Description:** Creates and inserts a new book into the library catalog.
- **Request Headers:**
  - `Content-Type: application/json`
- **Example Request Body:**
  ```json
  {
    "title": "Designing Data-Intensive Applications",
    "author": "Martin Kleppmann",
    "isbn": "978-1449373320",
    "publishedYear": 2017,
    "genre": "Distributed Systems",
    "pages": 616
  }
  ```
- **Success Status Code:** `201 Created`
- **Example Response Body:**
  ```json
  {
    "id": 3,
    "title": "Designing Data-Intensive Applications",
    "author": "Martin Kleppmann",
    "isbn": "978-1449373320",
    "publishedYear": 2017,
    "genre": "Distributed Systems",
    "pages": 616,
    "available": true,
    "createdAt": "2026-10-08T05:30:00Z"
  }
  ```

---

### 5. Update an Existing Book
- **Method:** `PUT`
- **Path:** `/books/:id`
- **Description:** Replaces all attributes of an existing book identified by its ID.
- **Request Headers:**
  - `Content-Type: application/json`
- **Example Request Body (`PUT /books/2`):**
  ```json
  {
    "title": "The Pragmatic Programmer: 20th Anniversary Edition",
    "author": "Andy Hunt & Dave Thomas",
    "isbn": "978-0135957059",
    "publishedYear": 2019,
    "genre": "Software Engineering",
    "pages": 352,
    "available": true
  }
  ```
- **Success Status Code:** `200 OK`
- **Example Response Body:**
  ```json
  {
    "id": 2,
    "title": "The Pragmatic Programmer: 20th Anniversary Edition",
    "author": "Andy Hunt & Dave Thomas",
    "isbn": "978-0135957059",
    "publishedYear": 2019,
    "genre": "Software Engineering",
    "pages": 352,
    "available": true,
    "updatedAt": "2026-10-08T05:30:00Z"
  }
  ```

---

### 6. Delete a Book
- **Method:** `DELETE`
- **Path:** `/books/:id`
- **Description:** Permanently deletes a specific book from the library catalog by its ID.
- **Success Status Code:** `200 OK` (or `204 No Content`)
- **Example Response Body (`DELETE /books/3`):**
  ```json
  {
    "message": "Book with ID 3 was successfully removed from the catalog."
  }
  ```

---

## ⚠️ Common HTTP Error Codes

- **400 Bad Request**
  - **Description:** The client sent a request with missing required fields, invalid data formats, or malformed JSON syntax.
  - **Example Scenario:** A client sends a `POST /books` request with a missing `"title"` field or an invalid data type (such as `"publishedYear": "not-a-year"`). The server rejects the payload before processing.
  - **Example Error Response:**
    ```json
    {
      "status": 400,
      "error": "Bad Request",
      "message": "Field 'title' is required and must not be empty."
    }
    ```

- **404 Not Found**
  - **Description:** The requested resource URI or specific ID does not exist in the database or server routing table.
  - **Example Scenario:** A client sends a `GET /books/999` or `DELETE /books/999`, but no book with ID `999` exists in the library catalog.
  - **Example Error Response:**
    ```json
    {
      "status": 404,
      "error": "Not Found",
      "message": "Book with ID 999 not found in catalog."
    }
    ```
