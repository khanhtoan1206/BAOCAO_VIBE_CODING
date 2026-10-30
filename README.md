# KT-SHOP

Website bán điện thoại, laptop, máy tính bảng và phụ kiện công nghệ. Giao diện tiếng Việt, tiền tệ VNĐ.

## Trạng thái

Đã triển khai database SQLite, migration, seed, catalog, JWT, đánh giá, giỏ hàng, checkout giả lập, lịch sử đơn và quản trị. Frontend đọc API thật; dữ liệu nghiệp vụ nằm trong SQLite, không hardcode sản phẩm trong React. Build và 11 test tự động đã đạt, bao gồm HTTP integration nhiều bước. Chưa nghiệm thu trực quan trên trình duyệt/mobile; chatbot chưa triển khai.

## Khởi chạy bản thương mại điện tử

```powershell
Set-Location 'D:\Vibe coding\KT-SHOP'
npm ci
npm run setup
npm run db:setup
npm run admin:create --workspace backend
npm run dev
```

Truy cập `http://localhost:5173`. Database local hiện đã tạo ở `D:\Vibe coding\KT-SHOP\backend\prisma\dev.db` với 4 danh mục và 12 sản phẩm demo. Các ảnh SVG minh họa được phục vụ local, không cần dịch vụ ảnh bên ngoài.

Admin: email `admin@kt-shop.local`; mật khẩu ngẫu nhiên nằm trong `D:\Vibe coding\KT-SHOP\backend\.admin-credentials.txt`. File này bị loại khỏi Git. Lệnh tạo admin không thay đổi mật khẩu tài khoản đã tồn tại. Khách hàng tự đăng ký tại `/register`.

Các lệnh cài đặt không reset database. Seed chỉ thêm bản ghi chưa có và không cập nhật sản phẩm đang tồn tại. Dữ liệu seed là sản phẩm hư cấu phục vụ thực hành, không phải thông số hay giá thị trường.

### Quy tắc nghiệp vụ hiện tại

- Giỏ hàng lưu theo tài khoản trong SQLite; cần đăng nhập để thêm sản phẩm.
- Server tính lại giá và tổng tiền. Tạo đơn và trừ tồn kho trong cùng transaction; không nhận giá từ client.
- Đơn chuyển một chiều PROCESSING → SHIPPING → COMPLETED. Doanh thu chỉ tính COMPLETED; biểu đồ theo ngày tạo đơn UTC.
- Thanh toán chỉ giả lập, không thu tiền hoặc lưu thông tin thẻ.
- Mỗi tài khoản có một đánh giá/sản phẩm, có thể cập nhật; chưa yêu cầu xác minh đã mua.
- Xóa mềm sản phẩm; không xóa danh mục còn liên kết sản phẩm, kể cả sản phẩm xóa mềm.
- JWT có hạn 8 giờ, lưu sessionStorage. Đăng xuất xóa token ở trình duyệt; chưa có refresh token hoặc thu hồi token phía server.
- Test tạo dữ liệu có tên riêng rồi dọn dẹp; không reset dữ liệu demo. Nên chạy khi không thao tác cửa hàng để tránh thay đổi số liệu trong lúc test.

Các phần ghi “Giai đoạn 2” phía dưới là ghi chép lịch sử, không mô tả phạm vi hiện tại.

Website portfolio ở thư mục cha được giữ nguyên.

## Kiểm tra giai đoạn 1 trên Windows PowerShell

```powershell
Set-Location 'D:\Vibe coding\KT-SHOP'
npm run check:structure
```

Lệnh này chỉ cần Node.js, không cần cài dependencies. Môi trường đã kiểm tra ngày 24/10/2026: Node.js v22.23.2, npm 10.9.8, Git 2.53.0.

## Công nghệ đã chốt theo yêu cầu

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, Axios, Lucide React, Recharts.
- Backend: Node.js, Express, JWT, bcrypt, middleware xác thực và phân quyền.
- Database: SQLite và Prisma ORM.
- Cấu hình qua `.env`; không đưa khóa API, JWT secret hoặc database vào Git.
- Không yêu cầu Docker hoặc dịch vụ cloud cho chức năng bán hàng.

Dependencies đã cài và khóa phiên bản trong package.json cùng package-lock.json. Prisma CLI/client/adapter cùng phiên bản 7.10.1; driver SQLite đã kiểm thử bằng truy vấn trong bộ nhớ. Chưa generate Prisma Client vì schema thuộc giai đoạn 3.

## Chạy trên Windows — Giai đoạn 2

Yêu cầu môi trường đã kiểm thử: Node.js 22.23.2 và npm 10.9.8.

```powershell
Set-Location 'D:\Vibe coding\KT-SHOP'
npm ci
npm run setup
npm run dev
```

- Frontend: `http://localhost:5173`.
- Backend: `http://127.0.0.1:5000/api/health` (có thể truy cập qua localhost nếu máy phân giải IPv4).
- `setup` tạo `.env` từ `.env.example` nếu chưa tồn tại; không ghi đè cấu hình cũ. JWT secret được sinh ngẫu nhiên, chưa sử dụng để xác thực ở giai đoạn này.
- Chạy riêng bằng `npm run dev:frontend` và `npm run dev:backend` trong hai terminal tại thư mục gốc dự án.
- Frontend gọi `/api` qua Vite proxy. Đổi đích backend bằng `BACKEND_PROXY_TARGET` trong frontend/.env và khởi động lại Vite.
- Cổng frontend bị chiếm sẽ báo lỗi thay vì tự đổi cổng; dừng phiên cũ trước khi chạy phiên mới.
- Nếu PowerShell chặn npm.ps1, dùng `npm.cmd` thay cho `npm`; không cần nới chính sách thực thi hệ thống.
- Biến `VITE_*` có thể xuất hiện trong bundle trình duyệt: tuyệt đối không đặt JWT secret hoặc khóa AI ở frontend.

## Kiểm tra

```powershell
Set-Location 'D:\Vibe coding\KT-SHOP'
npm run check:structure
npm run build
npm test
npm run test:smoke
```

Smoke test tự mở cổng tạm, chạy frontend/backend thật, kiểm tra proxy và SPA routing rồi dừng các tiến trình do test tạo. Không dừng server bạn đang chạy. Test backend có kiểm tra SQLite in-memory và thư viện bcrypt/JWT, không thay thế test API xác thực.

Để xem bản build: chạy backend và `npm run preview --workspace frontend`, mở `http://localhost:4173`. Vite preview chỉ phục vụ kiểm tra local, chưa phải cấu hình triển khai production.

Chưa kiểm thử trực quan bằng trình duyệt/mobile; bố cục responsive đã viết nhưng cần nghiệm thu ở giai đoạn UI. Có cảnh báo dependency gián tiếp `prebuild-install` deprecated khi cài; cài đặt và test SQLite vẫn thành công.

## Lộ trình và điều kiện nghiệm thu

1. Kiểm tra workspace, tạo cấu trúc, tài liệu và kiểm tra cấu trúc.
2. Khởi tạo frontend/backend, dependencies, cấu hình và scripts; kiểm tra build và health endpoint.
3. Thiết kế Prisma schema, migration và seed; kiểm tra quan hệ, ràng buộc và dữ liệu.
4. API và xác thực; kiểm thử đăng ký, đăng nhập, quyền truy cập.
5. Giao diện khách hàng; kiểm tra tìm kiếm, lọc, phân trang, chi tiết sản phẩm.
6. Giỏ hàng, checkout và lịch sử; kiểm tra tính tiền và tồn kho.
7. Admin; kiểm tra CRUD, trạng thái đơn và số liệu dashboard.
8. Chatbot; kiểm tra cấu hình thiếu key, giới hạn yêu cầu và tích hợp thực khi có key.
9. Kiểm thử tổng thể, responsive và routing; sửa lỗi.
10. Hoàn thiện hướng dẫn chạy, dữ liệu demo và tài liệu bảo vệ theo mã nguồn thực tế.

Sau mỗi giai đoạn báo cáo kết quả thực tế và chờ xác nhận trước khi chuyển tiếp.

## Tài liệu

Xem thư mục `docs`: kiến trúc, database, hợp đồng API dự kiến, test cases, nhật ký và câu hỏi bảo vệ.

## Cần đối chiếu trước khi triển khai nghiệp vụ

Phản hồi chứa master prompt đã bị công cụ rút gọn ở giữa mục 5.3 và mục chatbot. Chưa nhận đủ nguyên văn chi tiết trong khoảng đó. Cần cung cấp lại đoạn bị thiếu để đối chiếu trước khi chốt schema và nghiệp vụ; không coi các giả định là yêu cầu đã xác nhận.

Migration, seed, tài khoản demo và cấu hình chatbot thực tế sẽ bổ sung ở các giai đoạn tương ứng. Không có tài khoản demo hoặc lệnh migration ở Giai đoạn 2.