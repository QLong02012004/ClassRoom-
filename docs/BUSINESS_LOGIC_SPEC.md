<!--
============================================================================
TÊN TÀI LIỆU: BUSINESS_LOGIC_SPEC.md
ĐƯỜNG DẪN: docs/BUSINESS_LOGIC_SPEC.md
MỤC ĐÍCH:
  Tài Liệu Mô Tả Chi Tiết Logic Nghiệp Vụ Từng Chức Năng (Business Logic & Operation Rules).

CÁCH THỨC SỬ DỤNG:
  - Diễn giải các luồng nghiệp vụ thực tế của từng tính năng trên hệ thống ClassRoom bằng ngôn ngữ tự nhiên, đơn giản, dễ hiểu và dễ theo dõi.
============================================================================
-->

# TÀI LIỆU MÔ TẢ CHI TIẾT LOGIC NGHIỆP VỤ TỪNG CHỨC NĂNG (BUSINESS LOGIC SPECIFICATION)
## Hệ thống Quản lý Học tập LMS ClassRoom

> **Mục đích:** Tài liệu này mô tả toàn bộ logic nghiệp vụ hoạt động thực tế của từng chức năng trên hệ thống ClassRoom bằng ngôn ngữ tự nhiên, rõ ràng, giúp người phát triển, kiểm thử viên và người sử dụng dễ dàng nắm bắt cách thức vận hành của từng tính năng.

---

## 📚 PHẦN 1: BÀI TẬP, HẠN NỘP VÀ CHẤM ĐIỂM

### 1. Nghiệp vụ Hạn nộp Bài tập
- **Tạo và mở bài tập:** Khi giáo viên tạo bài tập, giáo viên thiết lập thời gian bắt đầu và hạn nộp cho bài tập. Trong khoảng thời gian cho phép, học sinh có thể vào làm bài, tải file đính kèm và nộp bài bình thường.
- **Hết hạn nộp bài:** Khi thời gian hạn nộp kết thúc, hệ thống tự động chuyển bài tập sang trạng thái đóng. Học sinh chưa nộp bài sẽ không thể tiếp tục nộp.
- **Gia hạn nộp bổ sung:** Nếu sau khi bài đã đóng, có học sinh chưa kịp nộp và giáo viên muốn cho phép nộp bổ sung, giáo viên có thể chỉnh sửa lại hạn nộp của chính bài tập đó sang một thời gian mới. Sau khi lưu, bài tập sẽ được mở lại và những học sinh chưa nộp có thể tiếp tục nộp.
- **Bảo toàn dữ liệu đã nộp:** Những học sinh đã nộp bài trước thời hạn cũ vẫn giữ nguyên bài nộp, không bị ảnh hưởng và không cần nộp lại.

---

### 2. Nghiệp vụ Nộp bài tập Tự luận của Học sinh
- **Nộp bài làm:** Trong hạn nộp quy định, học sinh tải file bài làm (PDF hoặc Word) hoặc nhập nội dung văn bản giải thích bài tập, sau đó bấm nút nộp bài. Hệ thống ghi nhận chính xác mốc thời gian nộp.
- **Chỉnh sửa bài nộp:** Khi chưa hết hạn nộp, học sinh có thể chỉnh sửa lại file đính kèm hoặc nội dung ghi chú bất cứ lúc nào. Bài làm mới nhất sẽ ghi đè lên bài cũ.
- **Trạng thái bài nộp:** Bài làm sau khi nộp sẽ hiển thị trạng thái *"Đã nộp (Chờ chấm)"*. Học sinh có thể theo dõi xem giáo viên đã chấm bài hay chưa ngay tại màn hình bài tập.

---

### 3. Nghiệp vụ Chấm bài tập & Viết Lời phê
- **Xem bài nộp:** Giáo viên mở danh sách bài tập, hệ thống hiển thị danh sách tất cả học sinh kèm trạng thái bài nộp (*Đã nộp, Chưa nộp, Nộp trễ*). Giáo viên có thể bấm trực tiếp để xem/tải file đính kèm của học sinh.
- **Nhập điểm & Lời phê:** Giáo viên nhập điểm số (thang điểm 0 - 10) và viết lời phê nhận xét chi tiết cho từng học sinh.
- **Đồng bộ tự động sang Sổ điểm:** Sau khi giáo viên lưu điểm bài tập, hệ thống tự động đẩy điểm số này sang đúng cột của học sinh đó trong Sổ điểm toàn lớp (`/gradebook`), đồng thời tự động cộng điểm thưởng XP cho học sinh.
- **Chỉnh sửa điểm đã chấm:** Giáo viên có thể sửa lại điểm số và lời phê bất kỳ lúc nào. Điểm số mới sẽ tự động cập nhật lại trong Sổ điểm.

---

## 🔐 PHẦN 2: XÁC THỰC, ĐĂNG KÝ VÀ QUẢN LÝ TÀI KHOẢN

### 4. Nghiệp vụ Đăng ký Tài khoản & Xác thực Email qua OTP 6 Số
- **Gửi mã OTP xác thực:** Khi người dùng (Học sinh hoặc Giáo viên) điền form đăng ký thủ công, hệ thống gửi một mã OTP gồm 6 chữ số đến Email đăng ký. Màn hình xuất hiện cửa sổ nhập mã 6 ô riêng biệt kèm bộ đếm ngược 30 giây.
- **Xác thực thành công:**
  - **Với Học sinh:** Sau khi nhập đúng 6 số OTP, tài khoản lập tức chuyển sang trạng thái kích hoạt (*Active*). Học sinh có thể đăng nhập vào hệ thống ngay.
  - **Với Giáo viên:** Sau khi xác thực đúng OTP, tài khoản được chuyển sang trạng thái *Chờ phê duyệt (Pending)* và chuyển tới luồng chờ Admin duyệt.
- **Xử lý đăng ký dở dang (Đăng ký lại mượt mà):** Nếu người dùng đăng ký nhưng lỡ tắt màn hình OTP (chưa xác thực), khi người dùng quay lại đăng ký lại bằng đúng Email đó, hệ thống tự động dọn dẹp dữ liệu dở dang cũ và phát mã OTP mới mà không báo lỗi trùng Email.
- **Tự động mở lại ô OTP khi Đăng nhập:** Nếu người dùng cố gắng đăng nhập bằng tài khoản chưa xác thực Email, hệ thống sẽ tự động bật lại cửa sổ nhập OTP 6 số ngay trên màn hình Đăng nhập để người dùng kích hoạt tại chỗ.

---

### 5. Nghiệp vụ Đăng nhập / Đăng ký qua Google OAuth 2.0 & Thiết lập Mật khẩu
- **Đăng nhập 1-Click bằng Google:** Người dùng có thể bấm nút *"Đăng nhập bằng Google"* để đăng nhập hoặc đăng ký tài khoản nhanh. Email từ Google được hệ thống xác thực 100%.
- **Thiết lập mật khẩu liên kết:** Do tài khoản Google ban đầu không có mật khẩu cục bộ, khi người dùng muốn đổi mật khẩu tại trang Hồ sơ cá nhân (`/profile`), hệ thống sẽ gửi một mã OTP về Email để xác nhận danh tính, sau đó cho phép người dùng tự tạo mật khẩu đăng nhập trực tiếp. Sau khi tạo, người dùng có thể linh hoạt đăng nhập bằng cả nút Google hoặc nhập Email/Mật khẩu truyền thống.

---

### 6. Nghiệp vụ Phê duyệt & Quản lý Tài khoản Giáo viên của Admin
- **Hàng đợi Chờ phê duyệt (Pending Queue):** Tài khoản Giáo viên mới đăng ký sau khi xác thực OTP sẽ nằm ở trạng thái *Chờ phê duyệt (Pending)*. Trên trang quản lý của Admin, các tài khoản này tự động được ưu tiên xếp ở **Top đầu Trang 1** và quả chuông thông báo nảy tín hiệu đỏ.
- **Duyệt tài khoản:** Admin bấm nút **[ Phê duyệt ]** 1-Click. Tài khoản Giáo viên lập tức chuyển sang *Hoạt động (Active)* và Giáo viên có thể bắt đầu đăng nhập tạo lớp học.
- **Khóa / Mở khóa tài khoản:** Admin có thể khóa tài khoản vi phạm bất cứ lúc nào. Khi bị khóa, tài khoản lập tức bị đăng xuất và không thể tiếp tục đăng nhập cho đến khi được Admin mở khóa lại.

---

### 7. Nghiệp vụ Ràng buộc Hồ sơ Giáo viên trước khi Tạo Lớp
- **Kiểm tra thông tin hồ sơ:** Để đảm bảo tính minh bạch và uy tín, trước khi Giáo viên tạo lớp học đầu tiên, hệ thống tự động kiểm tra xem Giáo viên đã cập nhật đầy đủ các thông tin cá nhân bắt buộc chưa (*Giới tính, Ngày sinh, Số điện thoại/Zalo, Bằng cấp/Trình độ chuyên môn, Môn học giảng dạy*).
- **Cảnh báo bổ sung hồ sơ:** Nếu còn thiếu thông tin, khi Giáo viên bấm *"Tạo lớp học mới"*, hệ thống sẽ hiển thị bảng thông báo liệt kê rõ ràng các mục còn thiếu và hướng dẫn Giáo viên bấm nút chuyển hướng sang trang Hồ sơ cá nhân để hoàn thiện trước khi tạo lớp.

---

## 🏫 PHẦN 3: QUẢN LÝ LỚP HỌC VÀ VÒNG ĐỜI LỚP HỌC

### 8. Nghiệp vụ Tạo Lớp học Mới & Tự động sinh Mã Lớp (`classCode`)
- **Tạo lớp mới:** Giáo viên điền tên lớp và môn học giảng dạy. Khi tạo thành công, hệ thống tự động sinh ra một **mã lớp ngẫu nhiên gồm 6 ký tự duy nhất** (ví dụ: `M8K9L2`).
- **Phê duyệt lớp mới:** Lớp học mới tạo sẽ ở trạng thái *Chờ duyệt (Pending)*. Giáo viên có thể xem lớp trên màn hình của mình nhưng chưa thể cho học sinh vào học cho đến khi Admin duyệt lớp. Sau khi Admin duyệt, lớp chuyển sang trạng thái *Hoạt động (Active)*.
- **Chia sẻ mã lớp:** Giáo viên có thể bấm nút sao chép 1 chạm bên cạnh mã lớp để gửi cho học sinh đăng ký xin vào lớp.

---

### 9. Nghiệp vụ Xin vào Lớp & Duyệt Học sinh
- **Học sinh xin vào lớp:** Học sinh nhập mã lớp 6 ký tự vào ô *"Tham gia lớp học"*. Yêu cầu xin vào lớp được gửi tới giáo viên phụ trách.
- **Giáo viên phê duyệt:** Giáo viên mở tab thành viên lớp, danh sách học sinh xin vào lớp hiển thị ở mục chờ duyệt. Giáo viên có thể duyệt từng học sinh hoặc bấm **[ Duyệt tất cả ]** để chấp nhận hàng loạt. Khi được duyệt, học sinh chính thức trở thành thành viên của lớp và có thể xem bài học.
- **Mời học sinh ra khỏi lớp:** Giáo viên có thể xóa học sinh ra khỏi lớp nếu học sinh chuyển lớp hoặc nghỉ học. Khi bị xóa, học sinh không còn thấy lớp đó trên màn hình của mình.

---

### 10. Nghiệp vụ Đóng Lớp và Mở lại Lớp (Chế độ kết thúc kỳ học)
- **Đóng lớp học (Closed):** Khi kết thúc học kỳ hoặc khóa học, giáo viên có thể chuyển trạng thái lớp sang *Đã đóng (Closed)*.
- **Ảnh hưởng khi đóng lớp:** Khi lớp bị đóng, thẻ lớp sẽ mờ đi. Cả giáo viên và học sinh khi bấm vào lớp đều bị chặn truy cập và hệ thống hiển thị thông báo: *"Lớp học đã bị đóng, không thể truy cập"*. Dữ liệu bài học và điểm số vẫn được lưu trữ an toàn.
- **Mở lại lớp:** Nếu cần mở lại lớp để cho học sinh ôn tập hoặc học tiếp, giáo viên có thể bấm nút *"Mở lại lớp"* trên màn hình quản lý. Lớp học sẽ quay lại trạng thái *Hoạt động (Active)* bình thường.

---

### 11. Nghiệp vụ Khóa Lớp học do Vi phạm (Admin Lock State)
- **Admin khóa lớp:** Nếu lớp học có dấu hiệu vi phạm quy định, Admin có quyền bấm khóa lớp học đó bất kỳ lúc nào.
- **Thông báo Real-time:** Ngay khi Admin khóa lớp, hệ thống gửi thông báo thời gian thực qua WebSocket đến Giáo viên phụ trách. Quả chuông trên màn hình Giáo viên nảy chấm đỏ thông báo lý do bị khóa, và thẻ lớp trên màn hình tự động chuyển sang trạng thái *Bị khóa (Locked)* mờ đi mà không cần F5.
- **Chặn truy cập hoàn toàn:** Cả Giáo viên và Học sinh đều không thể bấm vào lớp bị khóa. Chỉ khi Admin kiểm tra và bấm mở khóa thì lớp mới hoạt động trở lại.

---

## 📝 PHẦN 4: NGÂN HÀNG ĐỀ & THI TRẮC NGHIỆM AI GEMINI

### 12. Nghiệp vụ Tạo Đề thi Trắc nghiệm & Tự động Chia đều Điểm
- **Soạn đề thi thủ công:** Giáo viên nhập tiêu đề đề thi, chọn môn học, thời gian làm bài (ví dụ: 15 phút, 45 phút) và thêm từng câu hỏi kèm 4 phương án A, B, C, D cùng đáp án đúng.
- **Tự động chia đều điểm:** Giáo viên nhập thang điểm tối đa cho đề thi (mặc định là 10 điểm), sau đó bấm nút *"Chia điểm đều"*. Hệ thống sẽ lấy tổng điểm chia đều cho số lượng câu hỏi (ví dụ: 10 điểm cho 20 câu = 0.5 điểm/câu), giúp giáo viên không phải nhập điểm lẻ cho từng câu.

---

### 13. Nghiệp vụ Bóc tách Đề thi Tự động từ File Word (.docx) bằng AI Gemini
- **Tải file đề thi Word:** Giáo viên bấm nút *"Tạo đề bằng AI"* và tải lên tệp văn bản Word (`.docx`) chứa bộ câu hỏi bài giảng hoặc đề thi có sẵn.
- **AI đọc và trích xuất tự động:** Trợ lý AI Gemini tự động đọc hiểu toàn bộ nội dung file Word, phân tích và bóc tách từng câu hỏi, các phương án lựa chọn A/B/C/D, nhận diện đáp án đúng và phân loại chủ đề (tag) cho từng câu.
- **Xem trước & chỉnh sửa:** Toàn bộ bộ đề bóc tách bởi AI được hiển thị trên màn hình xem trước. Giáo viên có thể kiểm tra, chỉnh sửa lại nội dung hoặc đáp án trước khi bấm lưu chính thức vào Ngân hàng đề thi.

---

### 14. Nghiệp vụ Làm Bài thi Trắc nghiệm Online có Đồng hồ Đếm ngược
- **Bắt đầu làm bài:** Học sinh mở bài thi trắc nghiệm, màn hình chuyển sang giao diện thi tập trung. Đồng hồ đếm ngược bắt đầu chạy lùi theo đúng thời gian làm bài giáo viên đã quy định.
- **Tự động nộp bài khi hết giờ:** Học sinh tích chọn các đáp án A/B/C/D cho từng câu hỏi. Khi đồng hồ đếm ngược về 0, hệ thống tự động khóa giao diện và nộp bài làm của học sinh ngay lập tức.
- **Xem kết quả & Lời giải:** Sau khi nộp bài, hệ thống hiển thị ngay điểm số, số câu làm đúng/sai và đáp án chi tiết kèm lời giải thích cho từng câu.

---

### 15. Nghiệp vụ Cảnh báo Lỗ hổng Kiến thức & Ôn tập Tập trung
- **Tự động phân tích điểm yếu:** Mỗi khi học sinh hoàn thành các bài thi trắc nghiệm, hệ thống tự động nhóm các câu hỏi làm sai theo từng tag chủ đề (ví dụ: *Đạo hàm, Nguyên hàm, Từ vựng Thì quá khứ...*). Nếu một chủ đề có tỷ lệ làm sai từ 40% trở lên, chủ đề đó sẽ được coi là "Lỗ hổng kiến thức".
- **Widget cảnh báo trên Trang chủ:** Màn hình trang chủ của học sinh hiển thị card *"Cảnh báo Lỗ hổng Kiến thức"* liệt kê danh sách các chủ đề học sinh đang yếu nhất.
- **Luyện tập đúng điểm yếu:** Học sinh bấm nút **[ Luyện tập ngay ]**, hệ thống tự động tạo ra một phòng làm bài tập trắc nghiệm tập trung đúng các câu hỏi thuộc chủ đề bị yếu đó để học sinh khắc phục lỗ hổng kiến thức nhanh chóng.

---

## 📊 PHẦN 5: SỔ ĐIỂM, ĐIỂM DANH VÀ BẢNG TÍNH SPREADSHEET

### 16. Nghiệp vụ Sổ điểm Bảng tính & Tự động Tính Điểm Trung Bình
- **Giao diện bảng tính Spreadsheet:** Trang Sổ điểm (`/gradebook`) hiển thị ma trận danh sách tất cả học sinh trong lớp cùng các cột điểm (*Điểm Miệng, Điểm 15 phút, Điểm Giữa kỳ, Điểm Cuối kỳ*).
- **Nhập điểm trực tiếp:** Giáo viên chỉ cần nhấp chuột trực tiếp vào ô điểm tương ứng của học sinh trên bảng để nhập hoặc chỉnh sửa điểm.
- **Tự động tính Điểm Trung Bình (ĐTB):** Ngay khi nhập điểm, hệ thống tự động tính toán Điểm trung bình môn theo công thức hệ số quy định và tự động xếp loại học lực (*Giỏi, Khá, Trung bình, Yếu*) cho học sinh mà giáo viên không cần tính thủ công.
- **Xuất / Nhập file Excel:** Giáo viên có thể xuất toàn bộ Sổ điểm của lớp ra file Excel (`.xlsx`) để lưu trữ, hoặc nhập dữ liệu điểm từ file Excel có sẵn vào hệ thống.

---

### 17. Nghiệp vụ Điểm danh Hàng ngày & Thống kê Chuyên cần
- **Thực hiện điểm danh:** Mỗi buổi học, giáo viên mở trang Điểm danh (`/attendance`), chọn lớp và ngày điểm danh. Danh sách học sinh hiển thị kèm các nút chọn trạng thái: `Có mặt`, `Đi muộn`, `Vắng mặt` và ô nhập ghi chú lý do vắng.
- **Tích hợp cộng điểm thưởng chuyên cần:** Kết quả điểm danh tự động tác động đến điểm thưởng XP của học sinh:
  - Học sinh **Có mặt**: Thưởng **+5 XP**.
  - Học sinh **Đi muộn**: Thưởng **+2 XP**.
  - Học sinh **Vắng mặt**: Trừ **-5 XP**.
- **Đồng bộ tự động sang Google Sheets:** Dữ liệu điểm danh của lớp có thể được cấu hình tự động đồng bộ sang tệp Google Sheets trực tuyến của giáo viên để tiện theo dõi ngoài hệ thống.

---

## 🏆 PHẦN 6: GAMIFICATION, XP VÀ THĂNG CẤP LEVEL

### 18. Nghiệp vụ Tích lũy Điểm thưởng XP & Thăng cấp Level
- **Tích lũy XP từ điểm số:** Học sinh đạt điểm cao trong các bài tập/bài thi sẽ nhận được điểm thưởng XP tương ứng theo công thức: `XP nhận được = Điểm số × 3` (ví dụ: Đạt 10 điểm nhận 30 XP).
- **Thưởng nộp bài đúng hạn:** Học sinh nộp bài tập trước khi hết hạn Deadline được thưởng thêm **+15 XP**. Nếu nộp trễ hạn không được thưởng điểm nộp đúng hạn.
- **Công thức thăng cấp Level:** Khi tổng điểm XP tích lũy đạt các mốc quy định, cấp độ (Level) của học sinh tự động tăng lên. Mốc XP yêu cầu để thăng cấp sẽ tăng dần theo từng Level để duy trì động lực phấn đấu trong cả năm học.

---

### 19. Nghiệp vụ Chuỗi Nộp bài Liên tiếp (Streak Counter)
- **Tăng chuỗi Streak:** Mỗi khi học sinh nộp bài tập đúng hạn liên tiếp, chuỗi nộp bài `Streak` sẽ tự động tăng lên 1 (ví dụ: Nộp đúng hạn 5 bài liên tiếp $\rightarrow$ Streak = 5).
- **Reset chuỗi Streak:** Nếu học sinh có 1 bài tập nộp trễ hạn hoặc bỏ nộp, chuỗi `Streak` sẽ lập tức bị reset về 0, đòi hỏi học sinh phải xây dựng lại chuỗi nộp bài mới.

---

### 20. Nghiệp vụ Bảng Xếp Hạng (Leaderboard) theo Lớp
- **Xếp hạng công bằng theo lớp:** Tổng điểm XP và vị trí xếp hạng của học sinh được tính toán tách biệt theo từng Lớp học. Học sinh tham gia nhiều lớp sẽ có vị trí xếp hạng riêng tại mỗi lớp.
- **Theo dõi thứ hạng:** Màn hình trang chủ của học sinh có bộ lọc chọn lớp học để xem thứ hạng hiện tại của mình so với các bạn cùng lớp, tạo không khí thi đua học tập tích cực.

---

## 🔔 PHẦN 7: THÔNG BÁO REAL-TIME VÀ BẢO TRÌ HỆ THỐNG

### 21. Nghiệp vụ Thông báo Thời gian thực qua Chuông Header (Socket.io)
- **Nhận thông báo tức thì:** Khi có các sự kiện quan trọng phát sinh (như *Giáo viên nộp bài/chấm điểm, Admin duyệt tài khoản, Admin khóa/mở lớp, Bài tập mới được giao...*), hệ thống phát tín hiệu qua Socket.io.
- **Hiển thị quả chuông:** Quả chuông thông báo trên góc màn hình lập tức nảy chấm đỏ thời gian thực mà không cần người dùng phải bấm F5 nạp lại trang. Người dùng bấm vào quả chuông để xem danh sách chi tiết các thông báo mới nhất.

---

### 22. Nghiệp vụ Bật / Tắt Chế độ Bảo trì Hệ thống (Maintenance Mode)
- **Bật chế độ bảo trì:** Khi cần nâng cấp hoặc sửa chữa hệ thống, Admin có thể bật công tắc *Bảo trì hệ thống* tại trang Cài đặt (`/admin/settings`).
- **Khóa truy cập người dùng thường:** Khi chế độ bảo trì đang bật, tất cả Học sinh và Giáo viên khi đăng nhập sẽ được chuyển tới giao diện *"Hệ thống đang bảo trì"* và bị khóa các thao tác.
- **Quyền ưu tiên của Admin:** Duy nhất tài khoản Admin vẫn được phép truy cập và thực thi các thao tác quản trị bình thường trong suốt thời gian bảo trì. Khi Admin tắt bảo trì, hệ thống tự động quay lại trạng thái phục vụ bình thường cho tất cả người dùng.

---
*Tài liệu Mô tả Chi tiết Logic Nghiệp vụ Từng Chức năng đã được phê duyệt và lưu trữ chính thức.*
