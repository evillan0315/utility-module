# Utility Module

The `UtilsService` provides a suite of utility functions to support image processing, SQL/JSON transformations, markdown parsing, time operations, and general text manipulation in a NestJS environment. This module is designed to centralize reusable logic and simplify common development workflows.

## 📦 Features

* **Image Processing**: Convert raster images to SVG using `sharp` and `potrace`.
* **SQL Utilities**: Parse basic `SELECT` and `INSERT` SQL statements to/from JSON.
* **Text Utilities**: Capitalization, kebab case conversion, text truncation, and more.
* **File/Language Detection**: Identify file types using extensions or MIME types.
* **Time Utilities**: Human-readable time formatting, timestamp conversion, and duration parsing.
* **Markdown Utilities**: Convert Markdown to HTML, MDAST (JSON AST), and vice versa.
* **Environment File Parsing**: Parse `.env` files from upload or disk into JSON format.
* **Swagger Integration**: Fully documented API endpoints using `@nestjs/swagger` for easy exploration and testing.

---

## 📁 Location

```ts
src/utils/utils.service.ts
```

---
## 🚀 Installation

```bash
npm install sharp potrace multer @nestjs/swagger swagger-ui-express sharp potrace mime-types dotenv unified remark-parse remark-stringify remark-rehype rehype-stringify
```

Ensure the following packages are also added to your NestJS project if not already installed:

```bash
npm install --save-dev @types/express @types/multer
```

---

## 🧰 Usage

### Injecting the Service

```ts
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class SomeService {
  constructor(private readonly utilsService: UtilsService) {}

  async example() {
    const result = await this.utilsService.convertToSvg('path/to/image.png');
    console.log(result.svg);
  }
}
```
### Register the Utility Module

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { UtilsModule } from './utils/utils.module';

@Module({
  imports: [UtilsModule],
})
export class AppModule {}
```

### Accessing Utility Endpoints

Once the app is running, Swagger documentation will be available at:

```
http://localhost:3000/api/docs
```

You can interact with endpoints like:

* `POST /api/utils/convert-to-svg`
* `POST /api/utils/json-to-env`
* `POST /api/utils/parse-select`
* `POST /api/utils/to-html`

### Example: Convert Image to SVG

Using `curl`:

```bash
curl -X POST http://localhost:3000/api/utils/convert-to-svg \
  -F "file=@./test-image.png" \
  -F "color=#FF0000" \
  -F "width=512" \
  -F "height=512"
```

### Example: Convert SQL to JSON

```bash
curl -X POST http://localhost:3000/api/utils/parse-select \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT id, name FROM users WHERE active = 1"}'
```

### Example: Markdown to HTML

```bash
curl -X POST http://localhost:3000/api/utils/to-html \
  -H "Content-Type: application/json" \
  -d '{"markdown": "# Hello World\n\nThis is a paragraph."}'
```

---

## 📚 API Overview

### 🖼️ Image Processing

```ts
convertToSvg(filePath: string, color?: string, width?: string, height?: string): Promise<{ svg: string; filePath: string }>
```

Converts a raster image (e.g., PNG) to SVG format.

---

### 🗃️ SQL & JSON Conversion

```ts
parseSqlToJson(sql: string): { type: 'select'; table: string; columns: string[]; where: string | null }
parseInsertSqlToJson(sql: string): { type: 'insert'; table: string; data: Record<string, string> }
jsonToInsertSql(input: { table: string; data: Record<string, string | number> }): string
```

Transforms basic SQL queries into JSON structures and vice versa.

---

### 📝 Text Utilities

```ts
capitalize(text: string): string
toKebabCase(text: string): string
reverseString(text: string): string
truncateText(text: string, maxLength: number): string
```

General-purpose string transformations.

---

### 📁 File Utilities

```ts
language(filename: string, mimeType?: string): string | undefined
```

Detects the programming language based on file extension or MIME type.

---

### ⏳ Time Utilities

```ts
timeAgo(ms: number): string
toUnixSeconds(date: Date | string): number
parseDurationToMs(duration: string): number
formatUnixTimestamp(timestamp: number): string
```

Handles relative timestamps, Unix conversions, and duration parsing.

---

### 🧪 Markdown Processing

```ts
markdownToJson(markdown: string): Promise<Root>
jsonToMarkdown(ast: Root): Promise<string>
markdownToHtml(markdown: string): Promise<string>
extractMarkdownTitle(markdown: string): string | null
```

Transforms Markdown to JSON AST, HTML, or extracts headers.

---

### 🌿 Environment File Handling

```ts
parseEnvToJsonString(content: string): Record<string, string>
parseEnvFile(file?: Express.Multer.File, filepath?: string): Promise<{ filepath: string; data: Record<string, string> }>
```

Safely parses `.env` files from file uploads or file paths.

---

### 🔁 Array Utilities

```ts
uniqueArray<T>(arr: T[]): T[]
```

Returns an array with duplicate entries removed.

---

## 📌 Notes

* Ensure `svg-outputs` directory is writable, or adjust `outputDir` as needed.
* SQL parsing is limited to simple queries and not meant for full SQL grammar.
* This service is intended for internal utility use within your NestJS application.

---

# UtilsController API Documentation

Base route: `/api/utils`

The `UtilsController` offers utilities for file conversion, SQL parsing, and content transformation. It supports multipart form-data and JSON payloads and produces outputs in SVG, JSON, Markdown, and HTML formats.

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

#### Example Request (multipart/form-data):

```
file: [image.png]
color: "#ff0000"
width: "256"
height: "256"
```

#### Example Response (200):

```json
{
  "message": "SVG conversion successful",
  "color": "#ff0000",
  "width": "256",
  "height": "256",
  "svg": "<svg ...>...</svg>",
  "savedPath": "./uploads/image.svg"
}
```

---

### 2. Convert JSON to .env

* **POST** `/json-to-env`
* **Description:** Converts a JSON input (uploaded file or JSON body) into `.env` formatted text, optionally triggering file download.
* **Consumes:** `multipart/form-data` or `application/json`
* **Request Body:**

  * `file` (binary, optional): JSON file to convert.
  * `json` (object, optional): JSON key-value pairs.
  * `download` (boolean, optional, default `false`): Return `.env` as downloadable file if `true`.

#### Example Request (JSON body):

```json
{
  "json": {
    "DB_HOST": "localhost",
    "DB_USER": "admin"
  },
  "download": false
}
```

#### Example Response (200, Content-Type: text/plain):

```
DB_HOST=localhost
DB_USER=admin
```

---

### 3. Convert .env to JSON

* **POST** `/env-to-json`
* **Description:** Parses a `.env` file (uploaded or specified by filepath) and returns its contents as JSON.
* **Consumes:** `multipart/form-data`
* **Request Body:**

  * `file` (binary, optional): `.env` file to parse.
  * `filepath` (string, optional): Path to `.env` file on server.

#### Example Request (multipart/form-data with file upload):

```
file: [.env file content]
```

#### Example Response (200):

```json
{
  "filepath": ".env.local",
  "data": {
    "DB_HOST": "localhost",
    "DB_USER": "root"
  }
}
```

---

### 4. Extract Title from Markdown

* **POST** `/extract-title`
* **Description:** Extract the first-level or second-level heading title from Markdown content.
* **Request Body:**

  * `content` (string, required): Markdown text.

#### Example Request:

```json
{
  "content": "# Hello World\n\nSome paragraph text."
}
```

#### Example Response (200):

```json
"Hello World"
```

---

### 5. Parse SELECT SQL to JSON

* **POST** `/parse-select`
* **Description:** Parses a simple SQL SELECT statement and returns a JSON representation.
* **Request Body:**

  * `sql` (string, required): SQL SELECT query string.

#### Example Request:

```json
{
  "sql": "SELECT id, name FROM users WHERE active = 1"
}
```

#### Example Response (200):

```json
{
  "select": ["id", "name"],
  "from": "users",
  "where": {
    "active": 1
  }
}
```

---

### 6. Parse INSERT SQL to JSON

* **POST** `/parse-insert`
* **Description:** Parses a simple SQL INSERT statement and returns a JSON representation.
* **Request Body:**

  * `sql` (string, required): SQL INSERT query string.

#### Example Request:

```json
{
  "sql": "INSERT INTO users (id, name) VALUES (1, 'Alice')"
}
```

#### Example Response (200):

```json
{
  "table": "users",
  "columns": ["id", "name"],
  "values": [1, "Alice"]
}
```

---

### 7. Convert JSON to INSERT SQL

* **POST** `/json-to-insert`
* **Description:** Generates an SQL INSERT statement string from provided JSON data.
* **Request Body:**

  * `table` (string, required): Target table name.
  * `data` (object, required): Key-value pairs representing column names and values.

#### Example Request:

```json
{
  "table": "users",
  "data": {
    "id": 1,
    "name": "Alice"
  }
}
```

#### Example Response (200):

```json
{
  "sql": "INSERT INTO users (id, name) VALUES (1, 'Alice');"
}
```

---

### 8. Convert Markdown to JSON AST

* **POST** `/to-json`
* **Description:** Converts Markdown text into a Markdown Abstract Syntax Tree (AST) JSON format.
* **Request Body:**

  * `markdown` (string, required): Markdown content.

#### Example Request:

```json
{
  "markdown": "# Hello\n\nThis is **bold**."
}
```

#### Example Response (201):

```json
{
  "type": "root",
  "children": [
    {
      "type": "heading",
      "depth": 1,
      "children": [{ "type": "text", "value": "Hello" }]
    },
    {
      "type": "paragraph",
      "children": [
        { "type": "text", "value": "This is " },
        { "type": "strong", "children": [{ "type": "text", "value": "bold" }] },
        { "type": "text", "value": "." }
      ]
    }
  ]
}
```

---

### 9. Convert JSON AST to Markdown

* **POST** `/to-markdown`
* **Description:** Converts Markdown AST JSON back to Markdown text.
* **Request Body:**

  * `ast` (object, required): Markdown AST JSON.

#### Example Request:

```json
{
  "ast": {
    "type": "root",
    "children": [
      {
        "type": "heading",
        "depth": 1,
        "children": [{ "type": "text", "value": "Hello" }]
      }
    ]
  }
}
```

#### Example Response (201):

```
# Hello
```

---

### 10. Convert Markdown to HTML

* **POST** `/to-html`
* **Description:** Converts Markdown content into HTML.
* **Request Body:**

  * `markdown` (string, required): Markdown content.

#### Example Request:

```json
{
  "markdown": "# Hello\n\nParagraph here."
}
```

#### Example Response (201):

```html
<h1>Hello</h1>
<p>Paragraph here.</p>
```

---

# Additional Notes

* File uploads are stored temporarily in `./uploads` and automatically removed after processing.
* SQL parsing supports simple SELECT and INSERT statements.
* Markdown conversions utilize the MDAST format for abstract syntax tree representations.
* Error handling returns HTTP 400 with descriptive messages for invalid inputs or parsing failures.




## 🧑‍💻 Author

Made with love by [Eddie Villanueva](https://github.com/evillan0315)  
💌 [evillan0315@gmail.com](mailto:evillan0315@gmail.com)



