# Hợp đồng API dự kiến

## API đã triển khai — bản thương mại điện tử

- GET `/api/health`: kiểm tra truy vấn DB, trả database=connected.
- GET `/api/categories`, `/api/products`, `/api/products/:id`. Query sản phẩm: q, category, min, max, sort=newest|price_asc|price_desc, page, limit.
- POST `/api/auth/register`: name,email,phone,password,confirmPassword; POST `/api/auth/login`: email,password; GET `/api/auth/me`.
- Bearer JWT cho GET/POST `/api/cart`, PATCH/DELETE `/api/cart/:id`; POST cart nhận productId,quantity.
- GET/POST `/api/orders`; GET `/api/orders/:id` giới hạn chủ đơn. POST nhận recipient,phone,address,confirmPayment=true.
- POST `/api/products/:id/reviews`: rating 1–5, comment; cần đăng nhập.
- ADMIN: GET `/api/admin/dashboard`; GET/POST `/api/admin/products`; PUT/DELETE `/api/admin/products/:id`.
- ADMIN: POST `/api/admin/categories`; PUT/DELETE `/api/admin/categories/:id`.
- ADMIN: GET `/api/admin/orders`; PATCH `/api/admin/orders/:id/status` với status SHIPPING hoặc COMPLETED theo đúng thứ tự.

Success response `{data: ...}`, error `{error:{code,message}}`. DELETE thành công trả 204. POST create trả 201. Các phần “dự kiến” bên dưới là lịch sử; chatbot chưa triển khai.

Trạng thái Giai đoạn 2: đã triển khai `GET /api/health`; các endpoint nghiệp vụ trong bảng dưới chưa triển khai.

## Health API đã chạy

`GET /api/health` trả HTTP 200 với `{ "data": { "status": "ok", "service": "kt-shop-api", "phase": 2, "database": "not_configured", "timestamp": "ISO timestamp" } }`.

Đây là liveness endpoint, không kiểm tra database. Header `Cache-Control: no-store`. API không tồn tại trả 404 JSON; JSON sai trả 400; request body quá 100 KB trả 413. CORS chỉ cấp quyền cho origin đã cấu hình, không phải cơ chế xác thực.

| Nhóm | Endpoint dự kiến | Quyền |
|---|---|---|
| Hệ thống | GET /api/health | Công khai |
| Xác thực | POST /api/auth/register, POST /api/auth/login | Công khai |
| Phiên | GET /api/auth/me | Đăng nhập |
| Danh mục | GET /api/categories | Công khai |
| Sản phẩm | GET /api/products, GET /api/products/:id | Công khai |
| Giỏ hàng | GET /api/cart; POST/PATCH/DELETE các dòng giỏ | Đăng nhập, chi tiết cần chốt |
| Đơn hàng | POST /api/orders, GET /api/orders, GET /api/orders/:id | Chủ đơn |
| Quản trị | CRUD /api/admin/products và /api/admin/categories | ADMIN |
| Đơn quản trị | GET /api/admin/orders, PATCH /api/admin/orders/:id/status | ADMIN |
| Thống kê | GET /api/admin/dashboard | ADMIN |
| Chatbot | POST /api/chat | Chính sách truy cập cần chốt, có rate limit |

Danh sách sản phẩm cần hỗ trợ từ khóa, danh mục, khoảng giá, sắp xếp và phân trang. Tên query/body, response và mã lỗi sẽ cập nhật cùng implementation và test, không xem bảng này là tài liệu API đã chạy.