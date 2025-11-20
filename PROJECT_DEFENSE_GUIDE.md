# 🛡️ PROJECT DEFENSE GUIDE: Carbon Credit Marketplace (CCM)

Tài liệu tổng hợp chi tiết kiến thức, kiến trúc và kỹ thuật để chuẩn bị cho buổi vấn đáp đồ án.

---

## 1. 🏗️ TỔNG QUAN KIẾN TRÚC HỆ THỐNG (System Architecture)

### Mô hình: Microservices Architecture
Hệ thống được chia nhỏ thành các dịch vụ độc lập, mỗi dịch vụ đảm nhận một chức năng nghiệp vụ cụ thể (Single Responsibility Principle).
- **Giao tiếp đồng bộ (Synchronous):** Client ↔ Gateway ↔ Services (REST API).
- **Giao tiếp bất đồng bộ (Asynchronous):** Service ↔ Service (RabbitMQ).

### Kiến trúc bảo mật & Gateway (Nginx)
Hệ thống sử dụng **Nginx** làm Reverse Proxy và API Gateway, đóng vai trò "người gác cổng":
- **Centralized Authentication:** Nginx sử dụng cơ chế `auth_request` để xác thực JWT token tập trung.
  1. Request từ Client gửi đến Nginx.
  2. Nginx gửi sub-request đến `User Service` (`/internal/auth/verify`) để kiểm tra Token.
  3. Nếu hợp lệ, Nginx forward request đến service đích kèm theo thông tin user (`X-User-Id`, `X-User-Role`) trong Header.
  4. Nếu không hợp lệ, Nginx trả về 401 ngay lập tức, giảm tải cho các service phía sau.
- **Rate Limiting:** Giới hạn số lượng request để chống DDoS (cấu hình `limit_req_zone`).
- **Internal Network:** Các service backend (`User`, `Wallet`, `Credit`...) chạy trong mạng nội bộ Docker (`ccm_net`), không public port ra ngoài internet, chỉ nhận request từ Nginx.

### Hạ tầng (Infrastructure)
- **Containerization:** Docker & Docker Compose.
- **Service Discovery:** (Hiện tại dùng Docker DNS resolution) Các service gọi nhau qua tên container (ví dụ: `http://user-service:3001`).

---

## 2. 🛠️ CÔNG NGHỆ SỬ DỤNG (Tech Stack)

### A. Backend (Core - NestJS)
Sử dụng cho: `User Service`, `Wallet Service`, `Payment Service`, `Admin Service`, `Notification Service`.
- **Framework:** NestJS (Node.js) - Kiến trúc module hóa, dễ mở rộng.
- **Language:** TypeScript - Tường minh, giảm lỗi runtime nhờ Static Typing.
- **ORM:** TypeORM - Tương tác Database qua Object, hỗ trợ Migration.
- **Validation:** `class-validator` (Validate DTO), `class-transformer`.
- **Security:** `Passport` (Authentication), `Bcrypt` (Hash password), `Helmet` (HTTP Headers).
- **Documentation:** Swagger (OpenAPI) - Tự động sinh tài liệu API.

### B. Backend (Java Spring Boot)
Sử dụng cho: `Credit Service`, `Trip Service`, `Listing Service`.
- **Framework:** Spring Boot 3.x.
- **Build Tool:** Maven.
- **Data:** Spring Data JPA (Hibernate).
- **Messaging:** Spring AMQP (RabbitMQ).
- **Lý do sử dụng:** Xử lý giao dịch tài chính (`Credit`) cần độ chính xác cao, tính nhất quán (ACID) và thread-safety mà Java hỗ trợ rất tốt.

### C. Backend (Python FastAPI)
Sử dụng cho: `Verification Service`, `Certificate Service`.
- **Framework:** FastAPI (High performance).
- **Libraries:**
  - `SQLAlchemy`: ORM.
  - `Pydantic`: Data validation.
  - `ReportLab` / `WeasyPrint`: Sinh file PDF chứng chỉ.
  - `Pandas` / `NumPy`: (Tiềm năng) Xử lý dữ liệu chuyến đi để xác thực.
- **Lý do sử dụng:** Hệ sinh thái Python mạnh về xử lý dữ liệu và tính toán khoa học.

### D. Database & Storage
- **MySQL 8.0:** Database chính.
  - Sử dụng **Foreign Keys** để đảm bảo toàn vẹn dữ liệu.
  - **Indexing:** Đánh index các trường hay query (`email`, `user_id`, `status`).
- **Redis 7.2:** In-memory Data Store.
  - **Caching:** Lưu User Profile, Config.
  - **Distributed Locking:** (Tiềm năng) Đảm bảo không có 2 giao dịch xử lý cùng lúc trên 1 ví.
  - **JWT Blacklist:** Lưu các token đã logout nhưng chưa hết hạn.

### E. Message Broker
- **RabbitMQ:**
  - **Exchange Type:** `Topic Exchange` (`ccm.events`) - Cho phép routing linh hoạt dựa trên pattern (ví dụ: `trip.*`, `*.created`).
  - **Durability:** Queue và Message được lưu xuống đĩa để tránh mất dữ liệu khi broker restart.

---

## 3. 🎨 KỸ THUẬT & DESIGN PATTERNS (Chi tiết)

### 1. Dependency Injection (DI) & Inversion of Control (IoC)
- **NestJS:** Container IoC của NestJS tự động quản lý vòng đời của các object.
  - `@Injectable()`: Đánh dấu class là một Provider.
  - `constructor(private userService: UserService) {}`: Inject service vào controller.
- **Spring Boot:** `@Service`, `@Autowired` (hoặc constructor injection).

### 2. Repository Pattern
- **Mục đích:** Ẩn giấu logic truy cập dữ liệu, giúp code business (Service) không phụ thuộc vào loại Database cụ thể.
- **Triển khai:**
  - NestJS: `InjectRepository(User) private userRepo: Repository<User>`.
  - Java: `public interface CreditRepository extends JpaRepository<Credit, UUID>`.

### 3. Strategy Pattern (Authentication)
- **Mục đích:** Dễ dàng chuyển đổi hoặc hỗ trợ nhiều phương thức xác thực.
- **Triển khai:**
  - `JwtStrategy`: Xác thực qua Bearer Token.
  - `LocalStrategy`: Xác thực qua Username/Password.
  - `GoogleStrategy`: (Mở rộng) Xác thực qua Google OAuth2.

### 4. Data Transfer Object (DTO)
- **Mục đích:** Kiểm soát dữ liệu gửi/nhận giữa Client và Server.
- **Triển khai:** Class `CreateUserDto` sử dụng decorators `@IsEmail()`, `@MinLength(6)` để validate dữ liệu đầu vào *trước khi* nó chạm vào logic xử lý.

### 5. Decorator Pattern
- **Mục đích:** Thêm metadata hoặc hành vi cho class/method.
- **Triển khai:** `@Controller('users')`, `@Get(':id')`, `@UseGuards(JwtAuthGuard)`.

### 6. Observer Pattern (Event-Driven)
- **Mục đích:** Giảm sự phụ thuộc giữa các service.
- **Triển khai:**
  - Publisher (`Trip Service`) bắn event `trip.verified`.
  - Subscriber (`Notification Service`) lắng nghe và phản ứng.
  - Nếu thêm chức năng mới (ví dụ: `Analytics Service`), chỉ cần subscribe event đó mà không cần sửa code của `Trip Service`.

---

## 4. 🧬 CƠ SỞ DỮ LIỆU & OOP (Database & OOP)

### Các thực thể chính (Entities) & Quan hệ (Associations)

1.  **User (User Service)**
    *   `OneToOne` với `UserProfile`: Tách thông tin đăng nhập (email/pass) khỏi thông tin cá nhân (tên, sđt).
    *   `OneToOne` với `Wallet` (logic): Mỗi user có 1 ví (liên kết qua `user_id`).
2.  **Wallet (Wallet Service)**
    *   `OneToMany` với `WalletTransaction`: Một ví có lịch sử nhiều giao dịch.
3.  **Certificate (Certificate Service)**
    *   `ManyToOne` với `CertificateTemplate`: Nhiều chứng chỉ dùng chung 1 mẫu template.
    *   `ManyToOne` với `User` (logic): Chứng chỉ thuộc về 1 user.
4.  **Credit (Credit Service)**
    *   `OneToOne` với `User` (logic): Tài khoản tín chỉ của user.

### Lập trình hướng đối tượng (OOP)

1.  **Encapsulation (Đóng gói):**
    *   Dữ liệu (`balance`) được ẩn trong Entity.
    *   Muốn thay đổi phải qua method public (`deposit()`, `withdraw()`) có kiểm tra điều kiện (ví dụ: số dư > 0).
2.  **Inheritance (Kế thừa):**
    *   `BaseEntity`: Chứa các trường chung `id`, `created_at`, `updated_at`. Các entity khác (`User`, `Wallet`) kế thừa từ đây để tái sử dụng code.
    *   `HttpException`: Các lỗi custom (`UserNotFoundException`) kế thừa từ class lỗi chuẩn của framework.
3.  **Polymorphism (Đa hình):**
    *   **Interfaces:** Trong Java, `CreditService` là interface, `CreditServiceImpl` là class thực thi. Code controller chỉ gọi interface, giúp dễ dàng thay thế implementation (ví dụ: mock test).
    *   **Overriding:** Ghi đè phương thức `validate()` trong `JwtStrategy`.

---

## 5. 🔄 LUỒNG HOẠT ĐỘNG CHI TIẾT (Detailed Flows)

### 1. Luồng Xác Thực & Cấp Chứng Chỉ (Core Flow)
1.  **Trip Service:** User hoàn thành chuyến đi → API `POST /trips/{id}/complete`.
    *   Update DB: Status `COMPLETED`.
    *   **Publish:** `trip.verified` (Routing Key) → Exchange `ccm.events`.
2.  **Verification Service:**
    *   **Consume:** Queue `verification_service_events`.
    *   Logic: Kiểm tra dữ liệu GPS, tốc độ, quãng đường (giả lập logic xác thực).
    *   **Publish:** `TripVerified` (nếu hợp lệ).
3.  **Certificate Service:**
    *   **Consume:** Queue `certificate_service_events`.
    *   Logic: Load Template HTML → Fill data → Convert to PDF → Upload Storage (hoặc lưu local) → Hash nội dung (SHA256) để chống làm giả.
    *   **Publish:** `certificate.generated`.
4.  **Notification Service:**
    *   **Consume:** Queue `notification_service_certificate.generated`.
    *   Logic: Gửi Email/Push Notification chúc mừng user.

### 2. Luồng Nạp Tiền (Payment Flow)
1.  **Client:** Gọi `POST /api/payment/deposit`.
2.  **Payment Service:** Tạo record `Payment` (status `PENDING`) → Gọi API VNPAY → Trả về URL thanh toán.
3.  **Client:** Redirect sang VNPAY → Thanh toán → VNPAY gọi lại (Callback/IPN) về `Payment Service`.
4.  **Payment Service:**
    *   Verify chữ ký số (Checksum) của VNPAY.
    *   Update `Payment` status `COMPLETED`.
    *   **Publish:** `payment.completed`.
5.  **Wallet Service:**
    *   **Consume:** Queue `wallet_service_payment_events`.
    *   Logic: Tìm ví theo `user_id` → `wallet.balance += amount` → Tạo `WalletTransaction` (Type `DEPOSIT`).
    *   Sử dụng **Database Transaction** (ACID) để đảm bảo tiền chỉ được cộng khi log giao dịch được tạo thành công.

---

---

## 6. 📋 CHI TIẾT CÁC SERVICE CHÍNH

### A. User Service (NestJS)
**Port:** 3001 | **Database:** MySQL (Port 3306)

**Chức năng chính:**
- **Authentication & Authorization:** Đăng ký, đăng nhập, quên mật khẩu, refresh token.
- **User Management:** CRUD thông tin user, cập nhật profile.
- **KYC (Know Your Customer):** Upload giấy tờ định danh, xác minh danh tính.

**Kỹ thuật đặc biệt:**
- **JWT Strategy:** Xác thực token bằng Passport.
- **Redis Cache:** Cache User Profile để giảm query DB (TTL: 1 giờ).
- **JWT Blacklist:** Khi logout, token bị đưa vào blacklist (Redis) đến khi hết hạn tự nhiên.
- **Event Publisher:** Bắn event `user.created`, `user.updated`, `kyc.submitted` cho các service khác đồng bộ.

**Code Example - JWT Strategy:**
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, userType: payload.userType };
  }
}
```

---

### B. Wallet Service (NestJS)
**Port:** 3007 | **Database:** MySQL (Port 3309)

**Chức năng chính:**
- **Wallet Management:** Tạo ví tự động khi user đăng ký.
- **Transactions:** Nạp tiền, rút tiền, chuyển tiền giữa các user.
- **Reserve & Settle:** Khóa tiền tạm thời khi đặt hàng, settle sau khi giao dịch hoàn tất.

**Kỹ thuật đặc biệt:**
- **Database Transaction (ACID):** Mỗi giao dịch tài chính sử dụng `@Transactional()` để đảm bảo tính nhất quán.
- **Pessimistic Locking:** Khi cộng/trừ tiền, lock row trong DB để tránh race condition.
- **Audit Trail:** Mỗi thay đổi số dư đều ghi vào `WalletTransaction` để tra cứu.

**Code Example - Deposit với Transaction:**
```typescript
@Transactional()
async deposit(userId: string, amount: number) {
  const wallet = await this.walletRepo.findOne({ 
    where: { userId }, 
    lock: { mode: 'pessimistic_write' } // Khóa row khi đang xử lý
  });
  
  wallet.balance += amount;
  await this.walletRepo.save(wallet);
  
  await this.transactionRepo.save({
    walletId: wallet.id,
    type: 'DEPOSIT',
    amount,
    balanceAfter: wallet.balance
  });
}
```

---

### C. Payment Service (NestJS)
**Port:** 3005 | **Database:** MySQL (Port 3307)

**Chức năng chính:**
- **Payment Gateway Integration:** VNPAY, Momo (hỗ trợ nhiều cổng).
- **Idempotency:** Chống duplicate payment (cùng 1 giao dịch gọi 2 lần).
- **Webhook/IPN:** Nhận callback từ cổng thanh toán.

**Kỹ thuật đặc biệt:**
- **Factory Pattern:** `PaymentProviderFactory` tạo instance VNPay/Momo dựa trên config.
- **Outbox Pattern:** Lưu event `payment.completed` vào bảng `outbox_event` trước, sau đó một job định kỳ (Cron) đẩy lên RabbitMQ. Đảm bảo không mất event khi RabbitMQ tạm thời lỗi.
- **Checksum Verification:** Verify chữ ký từ Gateway để chống giả mạo.

**Code Example - Idempotency Check:**
```typescript
const idempotencyKey = generateKey(userId, transactionId, amount);
const existing = await paymentRepo.findOne({ where: { idempotencyKey } });

if (existing && existing.status === 'PENDING') {
  return existing; // Trả về payment cũ nếu chưa hoàn thành
}
```

---

### D. Credit Service (Java Spring Boot)
**Port:** 8093 | **Database:** MySQL (Port 3324)

**Chức năng chính:**
- **Credit Account Management:** Quản lý tài khoản tín chỉ carbon của user.
- **Issue Credit:** Cộng tín chỉ sau khi chuyến đi được xác thực.
- **Transfer Credit:** Chuyển tín chỉ giữa các user hoặc bán trên marketplace.

**Kỹ thuật đặc biệt:**
- **Spring Cache (Redis):** Cache số dư tín chỉ để giảm tải DB (`@Cacheable`, `@CacheEvict`).
- **Domain Logic trong Entity:** Method `addBalance()`, `deductBalance()` được đặt trong Entity để encapsulate logic nghiệp vụ.
- **JPA Repository:** Kế thừa từ `JpaRepository` hỗ trợ CRUD tự động.

**Code Example - Encapsulation trong Entity:**
```java
public class Credit {
  private Double balance;
  
  public void addBalance(Double amount) {
    if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
    this.balance += amount;
    this.totalEarned += amount;
  }
  
  public void deductBalance(Double amount) {
    if (this.balance < amount) throw new InsufficientCreditException();
    this.balance -= amount;
    this.totalSpent += amount;
  }
}
```

---

### E. Notification Service (NestJS)
**Port:** 3010 | **Database:** MySQL (Port 3320)

**Chức năng chính:**
- **Multi-channel:** Email (SendGrid), Push Notification (FCM), In-App Notification.
- **Template System:** Quản lý template thông báo (hỗ trợ biến động `{{username}}`, `{{amount}}`).
- **Event-Driven:** Lắng nghe tất cả các event quan trọng từ RabbitMQ.

**Kỹ thuật đặc biệt:**
- **Queue-based Processing:** Mỗi loại event có 1 queue riêng (ví dụ: `notification_service_payment.completed`).
- **Retry Mechanism:** Nếu gửi email thất bại, retry tối đa 3 lần với exponential backoff.
- **Notification Preferences:** User có thể tắt/bật từng loại thông báo.

---

### F. Certificate Service (Python FastAPI)
**Port:** 3011 | **Database:** MySQL (Port 3327)

**Chức năng chính:**
- **Generate Certificate:** Tạo chứng chỉ PDF từ template khi chuyến đi được xác thực.
- **Certificate Verification:** Kiểm tra tính hợp lệ của chứng chỉ qua hash.
- **Download History:** Ghi lại lịch sử tải chứng chỉ.

**Kỹ thuật đặc biệt:**
- **Template Rendering:** Dùng Jinja2 để fill dữ liệu vào HTML template, sau đó convert sang PDF (WeasyPrint).
- **Blockchain-inspired Hash:** Lưu SHA256 hash của nội dung PDF để chống giả mạo.
- **Async Processing:** Dùng `async/await` của FastAPI để xử lý nhiều request đồng thời.

---

## 7. 🎯 KỸ THUẬT NÂNG CAO & BEST PRACTICES

### 1. Caching Strategy (Redis)
**Cache-Aside Pattern:**
1. Kiểm tra cache trước.
2. Nếu có (cache hit) → trả về ngay.
3. Nếu không (cache miss) → query DB → lưu vào cache → trả về.

**Cache Invalidation:**
- Khi update user profile → Xóa cache (`cacheService.invalidateUserProfile(userId)`).
- Sử dụng TTL (Time-To-Live) để tự động hết hạn cache.

---

### 2. Outbox Pattern (Đảm bảo Event không mất)
**Vấn đề:** Nếu DB commit thành công nhưng RabbitMQ bị lỗi thì event bị mất.
**Giải pháp:**
1. Lưu event vào bảng `outbox_event` cùng transaction với business logic.
2. Một Cron job chạy định kỳ (5s/lần) quét bảng `outbox_event`.
3. Publish các event chưa gửi lên RabbitMQ.
4. Đánh dấu `published = true` sau khi gửi thành công.

---

### 3. API Versioning
Các endpoint được version để tương thích ngược:
- `/api/v1/users` - Version 1
- `/api/v2/users` - Version 2 (có thể thêm field mới)

---

### 4. Error Handling (Global Exception Filter)
Sử dụng `@Catch()` trong NestJS để bắt lỗi toàn cục:
```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      timestamp: new Date().toISOString()
    });
  }
}
```

---

### 5. Database Migration (TypeORM)
Sử dụng Migration để quản lý thay đổi schema:
```bash
npm run migration:generate -- -n CreateUserTable
npm run migration:run
```

---

## 8. 🚀 CÂU HỎI VẤN ĐÁP THƯỜNG GẶP (Q&A)

### Q1: Làm sao đảm bảo tính toàn vẹn dữ liệu giữa các service (Distributed Transaction)?
**A:** Hệ thống sử dụng mô hình **Eventual Consistency** (Nhất quán cuối cùng).
- Thay vì dùng 2PC (Two-Phase Commit) gây chậm hệ thống, ta dùng **Saga Pattern** (dạng Choreography - dựa trên sự kiện).
- Nếu bước sau thất bại (ví dụ: cộng tiền lỗi), service đó sẽ bắn event `payment.failed`. Service trước đó nghe event này để thực hiện **Compensating Transaction** (Giao dịch bù trừ - ví dụ: hoàn lại trạng thái Payment về `FAILED`, user có thể thử lại).

**Ví dụ cụ thể:**
1. Payment Service: `payment.completed` → Wallet Service cộng tiền.
2. Nếu Wallet Service lỗi → Bắn `wallet.deposit.failed`.
3. Payment Service lắng nghe event này → Update payment status về `FAILED` → User được thông báo thử lại.

---

### Q2: Tại sao dùng Nginx làm Gateway mà không dùng Spring Cloud Gateway hay Kong?
**A:**
- **Hiệu năng:** Nginx viết bằng C, xử lý request tĩnh và proxy cực nhanh (~10,000 req/s), tốn ít RAM (~10MB).
- **Đơn giản:** Cấu hình file `.conf` dễ đọc, dễ debug. Không cần setup JVM hay Lua runtime.
- **Tính năng đủ dùng:** Auth request, Rate limit, Load balancing, CORS, SSL/TLS đều có sẵn.
- **Phù hợp quy mô:** Đồ án không cần Service Discovery phức tạp (Eureka, Consul).

---

### Q3: Nếu User Service chết thì hệ thống còn chạy không?
**A:**
- **Ngừng hoạt động:** Login, Register, lấy User Profile, KYC.
- **Vẫn chạy:** Các luồng xử lý ngầm (Background jobs) như `Verification` → `Certificate` vẫn tiếp tục nếu event đã nằm trong RabbitMQ (Queue persistent). Đây là ưu điểm của **Loose Coupling**.
- **Khôi phục:** Khi User Service khởi động lại, nó sẽ tiếp tục consume event từ queue.

---

### Q4: Bảo mật password user như thế nào?
**A:**
- **Hash:** Sử dụng **Bcrypt** (cost factor = 10) để hash password. Bcrypt tự động generate salt ngẫu nhiên cho mỗi password.
- **Không lưu plain-text:** Database chỉ lưu `passwordHash`, không bao giờ lưu password gốc.
- **Verify:** Khi login, hash password nhập vào và so sánh với hash trong DB bằng `bcrypt.compare()`.
- **Thêm lớp bảo mật:** Rate limit endpoint `/login` để chống brute-force attack (10 req/phút/IP).

---

### Q5: Làm sao để mở rộng (Scale) hệ thống?
**A:**
**Horizontal Scaling (Scale Out):**
- Chạy nhiều container của cùng một service (ví dụ: 3 instance `User Service`).
- Nginx tự động Load Balance (Round Robin hoặc Least Connection).
- Lợi ích: Tăng throughput, High Availability (1 container chết, 2 container còn lại vẫn phục vụ).

**Database Scaling:**
- **Master-Slave Replication:** Master ghi, Slave đọc (giảm tải read query).
- **Sharding:** Chia dữ liệu theo user_id (ví dụ: user_id 1-10000 vào DB1, 10001-20000 vào DB2).

**Cache Layer (Redis):**
- Thêm Redis Cluster (nhiều node) để chịu tải lớn hơn.

---

### Q6: Làm sao biết hệ thống có vấn đề? (Monitoring)
**A:**
- **Health Check:** Mỗi service có endpoint `/health` để kiểm tra trạng thái.
- **Logging:** Ghi log tập trung (có thể dùng ELK Stack: Elasticsearch, Logstash, Kibana).
- **Metrics:** Prometheus + Grafana để theo dõi CPU, RAM, Request Count, Latency.
- **Alerting:** Cấu hình cảnh báo khi service down hoặc lỗi tăng đột biến.

---

### Q7: OOP được áp dụng ở đâu trong Java/Spring Boot?
**A:**
**1. Encapsulation:**
- Field `balance` trong `Credit` entity là private. Muốn thay đổi phải qua method `addBalance()` có validate logic.

**2. Inheritance:**
- `RuntimeException` ← `CreditNotFoundException` (Custom exception kế thừa exception chuẩn).
- `JpaRepository` ← `CreditRepository` (Kế thừa để có sẵn CRUD methods).

**3. Polymorphism:**
- Interface `CreditService` → Implement `CreditServiceImpl`. Controller chỉ phụ thuộc vào interface, dễ thay đổi implementation (Mock service cho test).

**4. Abstraction:**
- `PaymentProvider` interface → `VNPayProvider`, `MomoProvider` implement. Service gọi interface chung, không quan tâm chi tiết từng cổng thanh toán.

---

### Q8: Nếu muốn thêm tính năng Analytics (thống kê) thì làm sao?
**A:**
1. Tạo service mới: `Analytics Service`.
2. Service này subscribe tất cả các event quan trọng (`trip.verified`, `payment.completed`, `credit.issued`).
3. Lưu dữ liệu vào **Time-Series Database** (InfluxDB) hoặc **Data Warehouse** (BigQuery).
4. Build Dashboard với Grafana hoặc Metabase.
5. **Không cần sửa code** service cũ vì dùng Event-Driven Architecture.
