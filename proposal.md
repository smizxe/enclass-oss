# Educhill Project Proposal

## 1. Hiện trạng dự án (Current State)
Dự án hiện tại là một nền tảng học tập trực tuyến (Online Study Platform) cung cấp giải pháp toàn diện cho Giáo viên và Học viên.
- **Quản lý học tập**: Tạo và quản lý lớp học, bài giảng, và bài tập. Theo dõi chi tiết tiến độ học tập và lịch sử làm bài của học sinh.
- **Hỗ trợ đa dạng câu hỏi**: Trắc nghiệm (MCQ), Điền khuyết (Gap Fill), Tự luận (Essay), Bài đọc (Reading/Passage), v.v.
- **Hệ thống AI tích hợp**: Hỗ trợ tạo đề thi tự động từ AI (Import Exam by AI).
- **Cộng đồng học tập**: Tính năng Community cho phép học sinh hỏi đáp, thảo luận, và chia sẻ tài liệu.
- **Chấm điểm & Feedback**: Hệ thống chấm bài tự động cho trắc nghiệm/điền khuyết. Hỗ trợ lưu cài đặt hiển thị đáp án sau thi, cùng giao diện giáo viên chấm điểm thủ công/feedback cho các format tự luận, speaking, writing.
- **Tính tiện dụng**: Tính năng sao chép bài học/nhân bản bài tập linh hoạt giữa các lớp học.

## 2. Tiềm năng và Khả năng (Capabilities)
- Sẵn sàng để áp dụng AI sâu hơn vào việc tự động hóa chấm điểm và cá nhân hóa lộ trình học cho từng học sinh.
- Cấu trúc hệ thống tốt, sẵn sàng mở rộng (scale) để hỗ trợ phân quyền và quản lý theo cấp bậc cao hơn.
- Phân tích và thống kê dữ liệu học tập chuyên sâu để tìm ra điểm mạnh/điểm yếu của từng nhóm học viên.

## 3. Đề xuất tính năng cho giai đoạn cuối (Final Steps & Recommendations)
Dựa trên trạng thái hiện tại, dự án nên mở rộng theo mô hình SaaS B2B và B2C với các phát triển sau:

### 3.1. Quản lý Trung tâm (Center Management)
- Bổ sung thêm Role **Center** (Trung tâm/Tổ chức giáo dục).
- **Chức năng chính**: Quản trị tài khoản cấp trung tâm có quyền tạo và quản lý nhiều Giáo viên (Teachers).
- Phân bổ tài nguyên, thống kê hiệu suất giảng dạy và theo dõi số lượng học viên đăng ký trên quy mô toàn trung tâm.

### 3.2. Hệ thống tính phí dựa trên Credit & AI (Credit-based Pricing)
Xây dựng mô hình thu phí (Monetization) bằng hình thức gói cước kết hợp với Credit tiêu hao khi sử dụng AI.

**Các gói dịch vụ (Public Packages):**
- **Gói Teacher ($10 / tháng)**:
  - Cho phép hệ thống và quản lý lớp học tiêu chuẩn.
  - Sử dụng AI để Import đề thi (Dựa trên Credit hoặc giới hạn hàng tháng).
  - **Không bao gồm** tính năng AI tự động chấm bài Speaking và Writing (Giáo viên ở gói này sẽ phải tự chấm thủ công).
  
- **Gói Teacher Pro**:
  - Tích hợp cấu hình nâng cao.
  - Hỗ trợ Full tính năng AI: Bao gồm AI tự động nhắc điểm và chấm bài Speaking, Writing theo bộ tiêu chí (Rubric) được định sẵn.

**📝 Vấn đề cần làm rõ (TBD - To Be Determined):**
- *Cách tính và quy đổi Credit*: Cần chốt phương án tính Credit tiêu hao:
  - Quy đổi ra *Token* (theo hàng nghìn/hàng triệu token, tương tự OpenAI).
  - Hoặc quy đổi trực tiếp ra đơn vị Credit mua bằng Tiền ($/VND).
