# Địa chỉ giao hàng thông minh — KT-SHOP

## Chức năng
- Mặc định hai cấp: tỉnh/thành → phường/xã/đặc khu → số nhà, tên đường/thôn xóm.
- Chế độ lịch sử riêng: tỉnh/thành → huyện → xã; có cảnh báo và checkbox xác nhận lịch sử.
- Combobox tìm kiếm không dấu (đ → d), highlight, danh sách cuộn, ArrowUp/ArrowDown/Enter/Escape, lỗi dưới trường, loading, empty state, retry.
- Đổi cấp trên hoặc chế độ xóa các mã cấp dưới. Hủy request cũ khi đổi nhanh để tránh kết quả sai khu vực.
- Backend chỉ nhận mã và addressLine; tên và fullAddress dựng lại từ snapshot, không tin tên do client gửi.
- Giao hàng lịch sử không được tự động ánh xạ hoặc coi là địa chỉ hiện hành. Một số huyện lịch sử không có xã trong nguồn sẽ hiển thị không có kết quả; không tự tạo xã để cho đặt hàng.

## Nguồn và giới hạn
Nguồn mã hóa: Vietnamese Provinces Database của thanglequoc, giấy phép MIT kèm tại `D:\Vibe coding\KT-SHOP\backend\data\addresses\LICENSE.upstream`.

Nguồn chính thức tham chiếu:
`https://chinhphu.vn/?classid=1&docid=214409&orggroupid=3&pageid=27160`
Quyết định 19/2025/QĐ-TTg ban hành danh mục mã hành chính từ 01/07/2025.

Snapshot hiện hành: `current-v5.2.0`, metadata ngày 20/09/2026, release 21/09/2026, 34 tỉnh/thành và 3.321 xã/phường/đặc khu.
Commit nguồn: `62b1abdfe39625289c37a58ef6678e9db3d37f84`.

Snapshot lịch sử: `historical-v2.4.1`, mốc 01/03/2025, 63 tỉnh/thành, 696 huyện, 10.035 xã. Đây không phải bản chốt ngày 30/06/2025.
Commit nguồn: `fc33b7411ec4e3697817fab8118718a8d39ef090`.

JSON nội bộ có URL release, URL file tại commit, SHA-256 của dữ liệu gốc, thời điểm nhập và số lượng. Không gọi API bên thứ ba khi checkout. Đây là nguồn cộng đồng có dẫn nguồn thống kê, không phải API chính phủ; chưa đối chiếu độc lập từng dòng với toàn bộ nghị quyết. Backend kiểm tra hợp lệ theo snapshot đã công bố, không xác minh sự tồn tại thực tế của số nhà/đường hay khả năng giao hàng.

## API
- `GET /api/addresses/meta`: metadata hai snapshot, không gửi toàn bộ cây.
- `GET /api/addresses?mode=current&level=provinces&q=Ha%20Noi`
- `GET /api/addresses?mode=current&level=wards&provinceCode=01`
- `GET /api/addresses?mode=historical&level=districts&provinceCode=01`
- `GET /api/addresses?mode=historical&level=wards&provinceCode=01&districtCode=001`
- q tùy chọn, tìm không dấu; code là chuỗi giữ số 0 đầu.

POST /api/orders giữ recipient, phone, payment, confirmPayment; bổ sung addressVersion, provinceCode, wardCode, addressLine; chế độ lịch sử thêm districtCode và historicalAcknowledged=true. Request chỉ gửi address tự do như trước sẽ bị từ chối. API trả error.fields để frontend gắn lỗi dưới trường.

## Database
Migration `20261024120000_shipping_address_snapshot` chỉ thêm cột nullable và addressVersion mặc định legacy-free-text. fullAddress của đơn cũ được sao chép nguyên văn từ address, không suy đoán địa phương. Trường address cũ giữ nguyên để tương thích. Đơn mới lưu cả mã, tên, bản dữ liệu và fullAddress tại checkout, không join động để đổi địa chỉ lịch sử.

Backup trước migration: `D:\Vibe coding\KT-SHOP\backups\pre-address-20261024.db`. Chứa dữ liệu riêng tư, không công khai.

## Vận hành
- Snapshot được đóng gói sẵn; không cần nhập lại để chạy checkout.
- Script nhập: `node scripts/import-addresses.mjs` tại `D:\Vibe coding\KT-SHOP`. Chỉ quản trị chạy sau khi kiểm tra nguồn, tag và commit; cần mạng. Không tự động chạy khi server khởi động.
- Khi đổi snapshot phải tăng addressVersion, kiểm thử lại và khởi động backend để thay cache. Client dùng version cũ bị yêu cầu chọn lại, không âm thầm chuyển mã.
- Chạy `npm run dev`; server đang chạy từ trước migration cần khởi động lại.

## Nghiệm thu
- npm test: 16 test; dữ liệu 34 tỉnh, lọc parent, không dấu, mã sai, mã trộn, version cũ, snapshot canonical, xác thực API, quyền Admin, tồn kho và thanh toán.
- npm run test:address:browser: Chrome Windows desktop/mobile, đăng nhập UI, chọn bằng Enter, reset tỉnh/huyện, no-result, lỗi mạng/retry, lỗi thiếu trường, xác nhận lịch sử, COD lịch sử và mô phỏng hiện hành, success page và địa chỉ trong Admin. Dùng fixture riêng và dọn trong finally.
- npm run build; npm run test:smoke.
- node scripts/audit-address.mjs: đối chiếu từng trường của tất cả bảng với backup, đảm bảo fixture đã xóa và đơn cũ giữ địa chỉ. Script này chỉ dùng nghiệm thu ngay sau nâng cấp: dữ liệu thực thay đổi về sau sẽ gây khác biệt hợp lệ.
- Ảnh: `D:\Vibe coding\KT-SHOP\docs\screenshots\desktop-address.png`, `D:\Vibe coding\KT-SHOP\docs\screenshots\mobile-address.png`.
- Chưa kiểm tra Safari/Firefox, trình đọc màn hình hoặc thiết bị di động vật lý. Không có định vị GPS, geocoding, xác minh số nhà hay ánh xạ địa chỉ cũ sang mới.

### Ghi nhận dữ liệu phát sinh trong nghiệm thu
Một dòng CartItem của tài khoản không phải fixture xuất hiện sau thời điểm backup. Audit thông báo bản ghi mới, không xóa nó và vẫn đối chiếu từng trường của các bản ghi cũ. Fixture browser được kiểm tra riêng theo tiền tố tài khoản/sản phẩm/danh mục kiểm thử.