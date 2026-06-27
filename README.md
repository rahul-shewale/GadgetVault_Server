# GadgetVault Backend API

Electronics catalog REST API built with Node.js, Express, MySQL (Sequelize ORM), and BullMQ.

## Tech Stack

- **Node.js 22** + Express
- **MySQL** via Sequelize ORM
- **BullMQ + Redis** for background job processing (bulk upload & reports)
- **JWT** for authentication
- **Multer** for file uploads

## Prerequisites

- Node.js 22+
- MySQL running locally
- Redis running locally (`redis-server`)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your MySQL password
cp .env.example .env

# 3. Create MySQL database
mysql -u root -p -e "CREATE DATABASE gadgetvault;"

# 4. Sync tables and seed data
npm run seed

# 5. Start the API server (Terminal 1)
npm run dev

# 6. Start the background worker (Terminal 2)
npm run worker
```

## API Endpoints

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | ❌ | Register user |
| POST | /api/auth/login | ❌ | Login, returns JWT |
| GET | /api/auth/me | ✅ | Get current user |

### Users
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/users | ✅ | List all users |
| GET | /api/users/:id | ✅ | Get user |
| POST | /api/users | ✅ | Create user |
| PUT | /api/users/:id | ✅ | Update user |
| DELETE | /api/users/:id | ✅ | Delete user |

### Categories
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/categories | ❌ | List all categories |
| GET | /api/categories/:uniqueId | ❌ | Get category |
| POST | /api/categories | ✅ | Create category |
| PUT | /api/categories/:uniqueId | ✅ | Update category |
| DELETE | /api/categories/:uniqueId | ✅ | Delete category |

### Products
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/products | ❌ | List products (paginated) |
| GET | /api/products/:uniqueId | ❌ | Get product |
| POST | /api/products | ✅ | Create product (form-data) |
| PUT | /api/products/:uniqueId | ✅ | Update product |
| DELETE | /api/products/:uniqueId | ✅ | Delete product |

#### Product list query params
```
GET /api/products?page=1&limit=10&sortBy=price&order=asc&search=iphone&category=Smartphones
```

### Jobs (Async)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/jobs/bulk-upload | ✅ | Upload CSV file |
| POST | /api/jobs/report | ✅ | Generate report |
| GET | /api/jobs/:id | ✅ | Poll job status |
| GET | /api/jobs/:id/download | ✅ | Download report |

## Bulk Upload CSV Format

```csv
name,price,category_name
iPhone 15,79999,Smartphones
MacBook Air M2,114900,Laptops
```

See `sample-bulk-upload.csv` for a full example.

## Default Credentials (after seed)

- Email: `admin@gadgetvault.com`
- Password: `admin123`
