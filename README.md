# Quản lý nhà thuốc (React + Vite + Express + SQLite)

Monorepo: giao diện React (`FrontEnd/`) và API Express (`backend/`) dùng chung `package.json`. File database `backend/database/pharmacy.sqlite` đã được đưa vào repo — clone xong **không cần seed** trừ khi bạn muốn reset dữ liệu mẫu.

## Cấu trúc thư mục

- **`FrontEnd/`** — Vite + React (`src/`: `models`, `views`, `controllers`, `components`, `context`).
- **`backend/`** — Express MVC (`models`, `controllers`, `routes`, `middleware`, `config`, `utils`); **`backend/database/`** — SQLite (`pharmacy.sqlite`), `schema.sql`, `init.js`, `seed.js`; entry `backend/server.js`.
- **`scripts/`** — tiện ích tùy chọn.

Chi tiết API: [backend/README.md](backend/README.md).

## Yêu cầu

- [Node.js](https://nodejs.org/) **18+** (khuyến nghị bản LTS)

## Clone và chạy nhanh

```bash
git clone <url-repo-của-bạn>.git
cd FontEndHQTCS-main
npm install
npm start
```

- **Web:** http://localhost:5173  
- **API:** http://localhost:5055  

`npm start` chạy đồng thời API và Vite (Ctrl+C dừng cả hai).

### Biến môi trường (tùy chọn)

Mặc định backend đã có fallback phù hợp cho máy local. Nếu muốn chỉnh JWT/CORS/đường dẫn DB:

```bash
copy .env.example .env
```

Trên macOS/Linux dùng `cp .env.example .env`. Sửa `JWT_SECRET` trước khi deploy.

### Chạy tách hai terminal (nếu cần)

```bash
npm run server
npm run dev
```

### Reset / làm mới database mẫu

```bash
npm run db:seed
```

Xem thêm cấu trúc API trong [backend/README.md](backend/README.md).

## Tài khoản mẫu

| Vai trò | Email           | Mật khẩu |
|---------|-----------------|----------|
| Admin   | admin@gmail.com | 123456   |
| Staff   | staff@gmail.com | 123456   |

## Script npm

| Lệnh | Mô tả |
|------|--------|
| `npm start` | API + frontend dev |
| `npm run dev` | Chỉ Vite |
| `npm run server` | Chỉ API |
| `npm run build` | Build production frontend vào `FrontEnd/dist/` |
| `npm run preview` | Xem thử bản build |
| `npm run db:seed` | Ghi lại dữ liệu mẫu vào SQLite |

## Ghi chú khi clone sang máy khác

- `sqlite3` là native module: sau `npm install`, nếu lỗi load DLL/so, chạy lại `npm install` hoặc `npm rebuild sqlite3` trên đúng OS đó.
- Database trong repo là SQLite một file (`backend/database/pharmacy.sqlite`); backup định kỳ nếu dùng thật cho nghiệp vụ.
