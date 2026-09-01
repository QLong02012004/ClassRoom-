<!--
============================================================================
TÊN TÀI LIỆU: STUDENT_TESTING_GUIDE.md
ĐƯỜNG DẪN: docs/STUDENT_TESTING_GUIDE.md
MỤC ĐÍCH:
  Bộ Kịch Bản Kiểm Thử Chi Tiết Dành Cho Học Sinh (Student Test Cases).

CÁCH THỨC SỬ DỤNG:
  - Cung cấp danh sách các Test Cases đầy đủ cho các chức năng Học sinh: Đăng ký & OTP, Tham gia lớp bằng mã code, Nộp bài tự luận, Làm đề thi trắc nghiệm AI đếm ngược, Tích lũy Gamification XP/Streak/Leaderboard, Trợ lý Gemini AI và Kiểm thử di động / Accessibility.
============================================================================
-->

# BỘ KỊCH BẢN KIỂM THỬ CHI TIẾT DÀNH CHO HỌC SINH (STUDENT DETAILED TEST CASES)

---

## 📌 THÔNG TIN TÀI KHOẢN HỌC SINH MẶC ĐỊNH
- **Đường dẫn đăng nhập:** `http://localhost:5173/login`
- **Email Học sinh thử nghiệm:** `student@gmail.com`
- **Mật khẩu Học sinh:** `123456`
- **Email Giáo viên thử nghiệm:** `teacher@gmail.com` / `123456`
- **Email Admin thử nghiệm:** `admin@gmail.com` / `admin123`

---

## 🛠️ CHI TIẾT CÁC KỊCH BẢN KIỂM THỬ (TEST CASES & SUB‑CASES)

### MODULE 1: XÁC THỰC, ĐĂNG KÝ & THAM GIA LỚP (`/login`, `/register`, `/dashboard`)
| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub‑Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-STU-01** | **Đăng nhập Học sinh** | **01.1 (Positive)**: Đăng nhập hợp lệ | 1. Mở `/login`<br>2. Nhập Email & Mật khẩu Học sinh<br>3. Bấm "Đăng nhập" | Email: `student@gmail.com`<br>Pass: `123456` | - Đăng nhập thành công, xuất hiện Toast chào mừng.<br>- Chuyển hướng vào `/dashboard`. | `[ ] Pass`<br>`[ ] Fail` |
| | | **01.2 (Negative – Sai mật khẩu)** | 1. Nhập Email đúng, mật khẩu sai | Email: `student@gmail.com`<br>Pass: `wrong` | - Hiển thị Toast lỗi "Sai mật khẩu".<br>- Không chuyển trang. | `[ ] Pass`<br>`[ ] Fail` |
| | | **01.3 (Security – XSS trong email)** | Nhập `<script>alert(1)</script>` vào trường Email | Email: `<script>alert(1)</script>` | - Toast lỗi "Email không hợp lệ".<br>- Không thực thi script. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-02** | **Đăng ký Học sinh & OTP 6 số** | **02.1 (Positive)**: Đăng ký thủ công → OTP | 1. Mở `/register`, chọn vai trò Học sinh<br>2. Nhập thông tin hợp lệ<br>3. Gửi đăng ký<br>4. Nhập OTP 6 số từ email | Email: `newstudent@gmail.com`<br>OTP: `123456` | - OTP hợp lệ, tài khoản chuyển sang `Active`.<br>- Chuyển sang `/dashboard`. | `[ ] Pass`<br>`[ ] Fail` |
| | | **02.2 (UI/UX – Đếm ngược 30s) **| Mở modal OTP, quan sát bộ đếm | - | - Bộ đếm giảm từ 30s → 0s, nút "Gửi lại" bật khi hết. | `[ ] Pass`<br>`[ ] Fail` |
| | | **02.3 (Security – Resend OTP giới hạn)**| Nhấn "Gửi lại OTP" nhanh liên tục | - | - Hệ thống chỉ cho phép tối đa 3 lần trong 5 phút, sau đó hiển thị lỗi. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-03** | **Tham gia Lớp học bằng Mã Code** | **03.1 (Positive)**: Mã hợp lệ | 1. Tại Dashboard, bấm "Tham gia lớp học"<br>2. Nhập `classCode` hợp lệ | `X8K9L2` | - Yêu cầu xin vào lớp thành công, hiển thị trong tab "Đang chờ duyệt". | `[ ] Pass`<br>`[ ] Fail` |
| | | **03.2 (Negative – Mã không tồn tại)** | Nhập mã ngẫu nhiên | `INVALID` | - Toast lỗi "Mã lớp học không tồn tại".<br>- Không gửi yêu cầu. | `[ ] Pass`<br>`[ ] Fail` |
| | | **03.3 (Boundary – Độ dài mã quá dài)** | Nhập chuỗi 20 ký tự | `ABCDEFGHIJKLMNOQRST` | - Toast lỗi "Mã lớp học không hợp lệ". | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-04** | **Truy cập Lớp đã được Phê duyệt** | **04.1 (Positive)**: Giáo viên duyệt → Học sinh truy cập | 1. Giáo viên duyệt yêu cầu<br>2. Học sinh click lớp trên Dashboard | Approved Class Card | - Chuyển tới chi tiết lớp, xem Bảng tin, Bài tập, Tài liệu, Đề thi. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 2: KIỂM THỬ BẢO MẬT & TRẠNG THÁI LỚP HỌC (`/dashboard`, `/classrooms`)
| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub‑Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-STU-05** | **Chặn truy cập Lớp Đã đóng (`Closed`)** | **05.1 (Security)**: Click lớp đóng | 1. Tìm lớp trạng thái `Closed`<br>2. Click vào thẻ lớp | Closed Class Card | - Thẻ mờ (`opacity:0.6`, `cursor:not-allowed`).<br>- Không cho vào lớp, toast "Lớp đã đóng". | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-06** | **Chặn truy cập Lớp Bị khóa (`Locked`)** | **06.1 (Security)**: Click lớp khóa | 1. Tìm lớp trạng thái `Locked`<br>2. Click vào thẻ lớp | Locked Class Card | - Thẻ mờ, toast "Lớp đã khóa bởi Admin". | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-07** | **Kiểm tra quyền truy cập sau khi bị xóa** | **07.1 (Negative)**: Truy cập lớp đã xóa | 1. Xóa lớp (Admin) <br>2. Học sinh cố gắng vào URL `/classrooms/:id` | URL của lớp đã xóa | - 404 Not Found, toast "Lớp không tồn tại". | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 3: HỌC TẬP, NỘP BÀI & THI TRẮC NGHIỆM (`/assignments`, `/exams`, `/chat`)
| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub‑Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-STU-08** | **Xem Bảng tin & Tải Tài liệu** | **08.1 (Interactive)**: Xem file PDF/Word & bình luận | 1. Vào Tab Bảng tin<br>2. Click tải file đính kèm<br>3. Nhập bình luận | Comment text | - File tải thành công.<br>- Bình luận hiển thị công khai. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-09** | **Nộp Bài tập Tự luận (AnimatedSendButton)** | **09.1 (Positive)**: Nộp file & ghi chú | 1. Mở `/assignments/:id`<br>2. Tải file `.pdf`/`.docx`<br>3. Nhập ghi chú<br>4. Click nút máy bay giấy | File + note | - Nút hoạt ảnh mượt, nộp thành công, trạng thái "Đã nộp (Chờ chấm)". | `[ ] Pass`<br>`[ ] Fail` |
| | | **09.2 (Negative – File quá lớn >10MB)** | Tải file 12MB | Large file | - Toast lỗi "Kích thước file vượt quá giới hạn 10MB".<br>- Không cho nộp. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-10** | **Chỉnh sửa bài nộp trước deadline** | **10.1 (Positive)**: Sửa file trước hạn | 1. Mở bài đã nộp trước deadline<br>2. Click "Chỉnh sửa"<br>3. Tải file mới | New file | - Thay thế file cũ, cập nhật thời gian nộp. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-11** | **Làm Đề thi Trắc nghiệm có Đếm ngược** | **11.1 (Exam Flow)**: Đoạn thời gian đồng hồ | 1. Mở `/exams/:id`<br>2. Chọn đáp án<br>3. Quan sát đồng hồ<br>4. Bấm "Nộp" hoặc để hết giờ | Answers | - Đồng hồ chạy chính xác, tự động nộp khi hết giờ.<br>- Hiển thị kết quả chi tiết. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-12** | **Trợ lý AI Gemini (Chat)** | **12.1 (AI Assistant)**: Hỏi đáp học tập | 1. Truy cập `/chat`<br>2. Nhập câu hỏi | Question text | - AI trả lời chi tiết, không lỗi. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 4: GAMIFICATION, XP & LEVEL (`/dashboard`)
| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub‑Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-STU-13** | **Tích lũy XP & Thăng cấp Level** | **13.1 (Gamification)**: Nhận XP sau chấm điểm | 1. Nhận điểm từ giáo viên<br>2. Mở Dashboard | Points | - XP = Điểm × 3 + 15 (nộp đúng hạn).<br>- Level tự động tăng khi đạt ngưỡng. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-14** | **Streak Counter** | **14.1 (Streak)**: Nộp liên tục 3 ngày | 1. Nộp bài đúng hạn 3 ngày liên tiếp | On‑time submissions | - Streak tăng lên 3.<br>- Reset khi có lần nộp trễ. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-15** | **Bảng xếp hạng Leaderboard** | **15.1 (Leaderboard)**: Xem vị trí trong lớp | 1. Mở Dashboard | - | - Leaderboard cập nhật theo XP, hiển thị vị trí. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 5: KHẢ NĂNG TRUY CẬP (Accessibility)
| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub‑Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-STU-16** | **Screen Reader Support** | **16.1 (Accessibility)**: Đọc nội dung Dashboard | 1. Bật screen reader (NVDA/VoiceOver)<br>2. Duyệt Dashboard | - | - Tất cả nội dung (button, link) có aria‑label phù hợp, đọc được. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-17** | **Focus Order** | **17.1 (UI/UX)**: Tab navigation | 1. Nhấn Tab liên tục từ đầu trang | - | - Focus di chuyển logic: Header → Sidebar → Main Content → Footer. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-18** | **Contrast Ratio** | **18.1 (UI/UX)**: Kiểm tra độ tương phản màu | 1. Sử dụng công cụ contrast checker | - | - Tất cả text/background có tỷ lệ >= 4.5:1 (WCAG AA). | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 6: HIỆU NĂNG & STRESS (Performance)
| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub‑Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-STU-19** | **Page Load Time** | **19.1 (Performance)**: Tải Dashboard dưới 2s | 1. Mở `/dashboard` trên mạng bình thường | - | - Thời gian tải < 2s, không lỗi. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-20** | **Large Data Set** | **20.1 (Stress)**: Dashboard với >200 lớp | 1. Tạo 200 lớp (admin)<br>2. Đăng nhập học sinh | - | - Dashboard vẫn phản hồi < 3s, scroll mượt. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-21** | **Concurrent Submissions** | **21.1 (Stress)**: 20 học sinh nộp bài cùng lúc | 1. Mỗi học sinh mở bài tập và nộp file | - | - Server xử lý không lỗi, thời gian phản hồi < 1s. | `[ ] Pass`<br>`[ ] Fail` |

---

### MODULE 7: ĐÁP ỨNG DI ĐỘNG (Mobile Responsiveness)
| Mã TC | Tên Kịch Bản | Trường Hợp Kiểm Thử (Sub‑Cases) | Các Bước Thực Hiện | Dữ Liệu Đầu Vào | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-STU-22** | **Responsive Layout** | **22.1 (UI/UX)**: Kiểm tra trên màn hình 375×667 (iPhone SE) | 1. Mở trang Dashboard trên thiết bị mô phỏng | - | - Header, Sidebar, Content hiển thị đúng, không overflow. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-23** | **Touch Interaction** | **23.1 (UI/UX)**: Swipe để mở/đóng Sidebar | 1. Vuốt từ trái sang phải | - | - Sidebar mở mượt, đóng khi vuốt ngược lại. | `[ ] Pass`<br>`[ ] Fail` |
| **TC-STU-24** | **Zoom & Font Scaling** | **24.1 (Accessibility)**: Phóng to 150% | 1. Thiết lập zoom trình duyệt 150% | - | - Nội dung vẫn đọc được, không bị cắt. | `[ ] Pass`<br>`[ ] Fail` |

---

## 🚀 QUY TRÌNH THỰC HIỆN KIỂM THỬ (STUDENT TEST STEPS)
1. **Bước 1 (Đăng ký & OTP)**: Thực hiện TC‑STU‑01 → TC‑STU‑02.
2. **Bước 2 (Tham gia lớp & Bảo mật)**: Thực hiện TC‑STU‑03 → TC‑STU‑07.
3. **Bước 3 (Học tập & Nộp bài)**: Thực hiện TC‑STU‑08 → TC‑STU‑12.
4. **Bước 4 (Gamification & Điểm thưởng)**: Thực hiện TC‑STU‑13 → TC‑STU‑15.
5. **Bước 5 (Khả năng truy cập)**: Thực hiện TC‑STU‑16 → TC‑STU‑18.
6. **Bước 6 (Hiệu năng & Stress)**: Thực hiện TC‑STU‑19 → TC‑STU‑21.
7. **Bước 7 (Đáp ứng di động)**: Thực hiện TC‑STU‑22 → TC‑STU‑24.

---

*Lưu ý:* Mỗi test case cần được thực hiện trên cả môi trường **desktop** và **mobile** để đảm bảo tính nhất quán.
