# Backend MVC - Pharmacy API

Backend Express + SQLite — toàn bộ API và database nằm trong thư mục **`backend/`** này.

- `models/`, `controllers/`, `routes/`, `middleware/`, `config/`, `utils/`
- **`database/`** — `pharmacy.sqlite`, `schema.sql`, `init.js`, `seed.js`

## Chạy backend

Từ thư mục gốc project (cùng cấp `package.json`):

```bash
npm run server
```

File `database/pharmacy.sqlite` (trong cùng thư mục `backend/`) đã có trong repo — **không bắt buộc** chạy `db:seed` sau khi clone. Chỉ chạy seed khi muốn reset về dữ liệu mẫu:

```bash
npm run db:seed
npm run server
```

API chạy tại `http://localhost:5055`. Chạy full stack (API + React): `npm start` ở thư mục gốc.

Tài khoản mẫu:

- Admin: `admin@gmail.com` / `123456`
- Staff: `staff@gmail.com` / `123456`

## Endpoint chính

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password` — body `{ "email": "..." }`: tạo mật khẩu mới và gửi qua email (cấu hình SMTP trong `.env`, xem `.env.example`). Hoặc `FORGOT_PASSWORD_DEV_LOG=true` khi dev để in mật khẩu ra console API.
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

## Cấu hình SMTP (quên mật khẩu gửi email)

1. Ở **thư mục gốc** project (nơi có `package.json`), tạo hoặc sửa file **`.env`** (mẫu: **`.env.example`**).
2. Điền `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`. `SMTP_FROM` **tùy chọn** — để trống thì dùng cùng địa chỉ `SMTP_USER`.
   - **Gmail:** `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`. Cần **mật khẩu ứng dụng** (App Password), không dùng mật khẩu đăng nhập web. Có thể dán cả chuỗi có dấu cách (hệ thống tự bỏ khoảng trắng).
   - **Outlook:** `SMTP_HOST=smtp-mail.outlook.com`, cổng `587`, `SMTP_SECURE=false`.
3. Khởi động lại API: `npm run server`.
4. Gỡ lỗi: thêm `SMTP_DEBUG=true` trong `.env` để xem log chi tiết của nodemailer trên console.

Khi SMTP đã có host + user + pass, chức năng quên mật khẩu sẽ **gửi email thật**. Nếu chưa cấu hình, ở môi trường dev mặc định vẫn đổi mật khẩu và in mật khẩu mới ra console API (xem `FORGOT_PASSWORD_DEV_LOG` trong `.env.example`).

## Ghi chú schema

SQLite không có kiểu `nvarchar`/`decimal` thực sự như SQL Server, nhưng schema vẫn giữ tên kiểu tương ứng để bám sát sơ đồ. Database file mặc định: `backend/database/pharmacy.sqlite` tính từ gốc repo (có thể commit để clone chạy ngay).
