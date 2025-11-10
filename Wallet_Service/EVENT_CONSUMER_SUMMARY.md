# Tóm tắt kiến trúc event-driven Wallet Service

- Sử dụng RabbitMQ để nhận event từ các service khác.
- Consumer lắng nghe các event: transaction.created, transaction.completed, transaction.cancelled.
- Khi nhận event, gọi ReservesService để xử lý logic ví và reserve.
- Đã có script kiểm thử gửi event: test/rabbitmq-event-test.ts.
- Đảm bảo kiến trúc tách biệt, dễ mở rộng, tích hợp với các service Payment/Transaction.
- Tài liệu chi tiết: EVENT_CONSUMER_README.md
