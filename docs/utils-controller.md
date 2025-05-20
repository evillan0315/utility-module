# UtilsController API Documentation

Base route: `/api/utils`

The `UtilsController` provides various utility endpoints for file conversions, SQL parsing, and content transformations. It leverages multipart form-data and JSON payloads for input and supports diverse output formats including SVG, JSON, Markdown, and HTML.

---

## Endpoints

### 1. Convert Image to SVG

* **POST** `/convert-to-svg`
* **Description:** Convert an uploaded image file to SVG format with optional color and size adjustments.
* **Consumes:** `multipart/form-data`
* **Request Body:**

  * `file` (binary, required): Image file to convert.
  * `color` (string, optional, default `#000000`): Fill color for SVG output.
  * `width` (string, optional): Desired SVG width.
  * `height` (string, optional): Desired SVG height.
* **Response:**

  * `message` (string): Confirmation message.
  * `color` (string): Used fill color.
  * `width` (string | undefined): SVG width.
  * `height` (string | undefined): SVG height.
  * `svg` (string): Generated SVG content.
  * `savedPath` (string): File path where SVG is saved.
* **Errors:**

  * Appropriate HTTP errors for invalid input or conversion failure.

---

### 2. Convert JSON to .env

* **POST** `/json-to-env`
* **Description:** Converts a JSON input (uploaded file or JSON body) into `.env` formatted text, optionally triggering file download.
* **Consumes:** `multipart/form-data` or `application/json`
* **Request Body:**

  * `file` (binary, optional): JSON file to convert.
  * `json` (object, optional): JSON key-value pairs.
  * `download` (boolean, optional, default `false`): Whether to return response as a downloadable `.env` file.
* **Response:** Returns `.env` text either inline or as a downloadable file.
* **Errors:**

  * 400 Bad Request if JSON parsing fails or no JSON input is provided.

---

### 3. Convert .env to JSON

* **POST** `/env-to-json`
* **Description:** Parses a `.env` file (uploaded or specified by filepath) and returns its contents as JSON.
* **Consumes:** `multipart/form-data`
* **Request Body:**

  * `file` (binary, optional): `.env` file to parse.
  * `filepath` (string, optional): Path to `.env` file on server.
* **Response:**

  * JSON object with keys and values parsed from the `.env` file.
* **Errors:**

  * 400 Bad Request for invalid file or filepath.

---

### 4. Extract Title from Markdown

* **POST** `/extract-title`
* **Description:** Extracts the first-level or second-level heading title from Markdown content.
* **Request Body:**

  * `content` (string, required): Markdown text.
* **Response:**

  * `title` (string | null): Extracted title or `null` if none found.
* **Errors:**

  * 400 Bad Request if input is invalid.

---

### 5. Parse SELECT SQL to JSON

* **POST** `/parse-select`
* **Description:** Parses a simple SQL SELECT statement and returns a JSON representation.
* **Request Body:**

  * `sql` (string, required): SQL SELECT query string.
* **Response:**

  * JSON object representing the SELECT query structure.
* **Errors:**

  * 400 Bad Request if SQL parsing fails.

---

### 6. Parse INSERT SQL to JSON

* **POST** `/parse-insert`
* **Description:** Parses a simple SQL INSERT statement and returns a JSON representation.
* **Request Body:**

  * `sql` (string, required): SQL INSERT query string.
* **Response:**

  * JSON object representing the INSERT query structure.
* **Errors:**

  * 400 Bad Request if SQL parsing fails.

---

### 7. Convert JSON to INSERT SQL

* **POST** `/json-to-insert`
* **Description:** Generates an SQL INSERT statement string from provided JSON data.
* **Request Body:**

  * `table` (string, required): Target table name.
  * `data` (object, required): Key-value pairs representing column names and values.
* **Response:**

  * `{ sql: string }` containing the generated SQL statement.
* **Errors:**

  * 400 Bad Request if generation fails.

---

### 8. Convert Markdown to JSON AST

* **POST** `/to-json`
* **Description:** Converts Markdown text into a Markdown Abstract Syntax Tree (AST) JSON format.
* **Request Body:**

  * `markdown` (string, required): Markdown content.
* **Response:**

  * MDAST JSON representation of the Markdown.
* **Status:** 201 Created

---

### 9. Convert JSON AST to Markdown

* **POST** `/to-markdown`
* **Description:** Converts Markdown AST JSON back to Markdown text.
* **Request Body:**

  * `ast` (object, required): Markdown AST JSON.
* **Response:**

  * Markdown string.
* **Status:** 201 Created

---

### 10. Convert Markdown to HTML

* **POST** `/to-html`
* **Description:** Converts Markdown content into HTML.
* **Request Body:**

  * `markdown` (string, required): Markdown content.
* **Response:**

  * HTML string.
* **Status:** 201 Created

---

# Notes

* All file uploads use the `multipart/form-data` content type and are handled via `FileInterceptor`.
* File uploads are stored temporarily in `./uploads` and cleaned up after processing.
* For SQL parsing and generation, errors during processing will result in a 400 HTTP status with the error message.
* Markdown conversions leverage `mdast` structure and produce standardized formats for interoperability.


