# Backend MVC - Pharmacy API

Backend dùng Express + SQLite, tổ chức theo mô hình MVC:

- `models/`: truy vấn database.
- `controllers/`: xử lý nghiệp vụ và response.
- `routes/`: khai báo endpoint REST.
- `database/schema.sql`: schema theo ERD bạn cung cấp.
- `database/seed.js`: dữ liệu mẫu cho frontend hiện tại.

## Chạy backend

```bash
npm run db:seed
npm run server
```

API chạy tại `http://localhost:5055`.

Tài khoản mẫu:

- Admin: `admin@gmail.com` / `123456`
- Staff: `staff@gmail.com` / `123456`

## Endpoint chính

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/medicines`
- `POST /api/medicines`
- `PATCH /api/medicines/:id/stock`
- `GET /api/medicines/categories`
- `GET /api/employees`
- `PATCH /api/employees/:id/role`
- `PATCH /api/employees/:id/status`
- `GET /api/customers`
- `GET /api/invoices`
- `POST /api/invoices`
- `PATCH /api/invoices/:id/status`
- `GET /api/invoices/reports/revenue`

## Ghi chú schema

SQLite không có kiểu `nvarchar`/`decimal` thực sự như SQL Server, nhưng schema vẫn giữ tên kiểu tương ứng để bám sát sơ đồ. Database file mặc định được tạo ở `backend/database/pharmacy.sqlite`.
