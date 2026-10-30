# Câu hỏi bảo vệ — bản thiết kế

Các câu trả lời dưới đây mô tả kiến trúc dự kiến, không khẳng định code đã triển khai. Cần bổ sung đường dẫn và ví dụ thực tế ở giai đoạn 10.

## Client/Server là gì?
Frontend hiển thị giao diện và nhận thao tác. Backend xác thực, xử lý nghiệp vụ và truy cập database. Tách biệt giúp kiểm soát quyền ở server thay vì tin trình duyệt.

## React giao tiếp với Express thế nào?
React gọi HTTP API qua Axios; Express nhận request, validate, xử lý và trả JSON. Giao diện hiển thị trạng thái tải, kết quả hoặc lỗi.

## JWT hoạt động ra sao?
Sau khi xác minh mật khẩu, server ký token có thời hạn. Request được bảo vệ phải có token hợp lệ; server xác minh chữ ký, hạn dùng và quyền. JWT không phải cơ chế mã hóa mật khẩu và không nên chứa dữ liệu bí mật.

## Prisma kết nối SQLite thế nào?
Prisma dùng schema để mô tả dữ liệu và client để truy vấn file SQLite. Migration quản lý cấu trúc; seed tạo dữ liệu phục vụ demo và kiểm thử.

## Luồng đặt hàng?
Client gửi sản phẩm, số lượng và thông tin giao hàng. Server đọc lại giá và tồn kho, tính tổng, tạo đơn cùng các dòng đơn và trừ tồn kho trong transaction. Chỉ trả thành công khi giao dịch được lưu đầy đủ.

## Phân quyền USER/ADMIN?
Middleware xác thực danh tính trước, sau đó kiểm tra quyền truy cập. USER chỉ được đọc đơn của chính mình. Ẩn menu admin trên frontend không thay thế bảo vệ API.

## Tính doanh thu thế nào?
Cần chốt trạng thái nào được ghi nhận doanh thu và cách xử lý hủy/hoàn tiền. Sau khi thống nhất, backend tổng hợp từ đơn hợp lệ; frontend chỉ hiển thị số liệu, không tự giả lập.

## Chatbot lấy thông tin sản phẩm thế nào?
Backend lấy dữ liệu phù hợp từ database, giới hạn dữ liệu và hội thoại rồi gửi provider AI. Key nằm trên server. Kết quả AI không có quyền tự thay đổi giá, tồn kho hoặc đơn hàng.

## Vai trò của AI Agent?
Agent đề xuất thiết kế, sinh mã, chạy kiểm thử và ghi nhận lỗi. Product Manager xác nhận yêu cầu và nghiệm thu. Sinh được mã không đồng nghĩa hệ thống đã hoạt động; cần bằng chứng kiểm thử thực tế.