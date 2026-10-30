# Thiết kế dữ liệu sơ bộ

## Đã triển khai

Schema thực tế tại `D:\Vibe coding\KT-SHOP\backend\prisma\schema.prisma`; migration init trong thư mục migrations cùng cấp. Có User, Category, Product, Review, CartItem, Order, OrderItem. CartItem dùng khóa duy nhất userId/productId; Review tương tự. Giá VNĐ lưu Int. OrderItem lưu snapshot name/price. Product.deleted phục vụ xóa mềm. Vai trò/trạng thái dùng String và kiểm tra whitelist trên server. Các mô tả sơ bộ dưới đây lưu để đối chiếu thiết kế ban đầu.

Trạng thái: đề xuất, chưa có Prisma schema hoặc migration.

| Thực thể | Trách nhiệm |
|---|---|
| User | Thông tin khách hàng, email duy nhất, hash mật khẩu, vai trò |
| Category | Danh mục sản phẩm |
| Product | Tên, mô tả, ảnh, giá bán/giá gốc, tồn kho, danh mục, xóa mềm |
| Review | Người đánh giá, sản phẩm, số sao, nội dung |
| Cart / CartItem | Giỏ hàng và số lượng từng sản phẩm; chốt chính sách khách vãng lai trước triển khai |
| Order | Người đặt, thông tin giao hàng, trạng thái, tổng tiền, thông tin thanh toán giả lập |
| OrderItem | Sản phẩm tham chiếu và bản chụp tên, đơn giá, số lượng |

Quan hệ dự kiến: Category 1–N Product; User 1–N Order; Order 1–N OrderItem; Product 1–N OrderItem; User và Product liên kết qua Review.

Ràng buộc cần kiểm thử: email duy nhất, giá không âm, số lượng dương, tồn kho không âm, khóa ngoại hợp lệ. Đặt hàng phải atomic; không lưu thông tin thẻ thanh toán thực.

Chi tiết trường, index, chính sách xóa và enum sẽ chốt sau khi đối chiếu phần yêu cầu bị thiếu.