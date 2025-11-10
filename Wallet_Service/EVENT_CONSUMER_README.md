# EVENT-DRIVEN WALLET SERVICE - DOCUMENTATION

## 1. Kiến trúc event-driven
- Wallet Service sử dụng RabbitMQ để nhận các sự kiện từ các service khác (Transaction, Payment).
- Các consumer lắng nghe các routing key:
  - `transaction.created`: Đặt trước số dư (reserve) cho giao dịch.
  - `transaction.completed`: Thanh toán, chuyển tiền từ buyer sang seller.
  - `transaction.cancelled`: Hủy giao dịch, giải phóng số dư đã đặt trước.

## 2. File consumer
- `src/consumers/transaction-event.consumer.ts`: Xử lý các sự kiện giao dịch, gọi ReservesService để cập nhật số dư, trạng thái reserve.

## 3. Luồng xử lý
- Khi nhận event:
  - `transaction.created`:
    - Kiểm tra số dư ví.
    - Đặt trước số dư (reserve), cập nhật lockedBalance.
    - Tạo bản ghi transaction (loại RESERVE).
  - `transaction.completed`:
    - Trừ số dư buyer, cộng số dư seller.
    - Cập nhật trạng thái reserve thành SETTLED.
    - Tạo bản ghi transaction (SETTLE_OUT, SETTLE_IN).
  - `transaction.cancelled`:
    - Giải phóng số dư đã đặt trước.
    - Cập nhật trạng thái reserve thành RELEASED.
    - Tạo bản ghi transaction (RELEASE).

## 4. Kiểm thử
- Sử dụng script `test/rabbitmq-event-test.ts` để gửi event kiểm thử.
- Kiểm tra kết quả qua API hoặc database:
  - Số dư ví, trạng thái reserve, lịch sử transaction.

## 5. Tích hợp với các service khác
- Transaction Service: Gửi event khi tạo, hoàn thành, hủy giao dịch.
- Payment Service: Gửi event khi thanh toán thành công.
- Wallet Service: Lắng nghe event, cập nhật số dư tự động.

## 6. Đảm bảo kiến trúc
- Tách biệt logic xử lý event (consumer) và business logic (service).
- Dễ mở rộng, tích hợp thêm event mới.
- Đảm bảo tính nhất quán dữ liệu qua event.

---
Mọi thắc mắc hoặc cần mở rộng event, bổ sung thêm consumer, chỉ cần thêm file mới và đăng ký vào module.
