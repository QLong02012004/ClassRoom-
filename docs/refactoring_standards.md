<!--
============================================================================
TÊN TÀI LIỆU: refactoring_standards.md
ĐƯỜNG DẪN: docs/refactoring_standards.md
MỤC ĐÍCH:
  Bộ Quy Tắc Chuẩn Tái Cấu Trúc Page & Bóc Tách Logic (Refactoring Standards & Architecture Guidelines).

CÁCH THỨC SỬ DỤNG:
  - Định nghĩa 12 nguyên tắc chuẩn mực tái cấu trúc giao diện: Container-Presenter Pattern, Domain-Based Packing, Callback Stabilization, Domain Sub-folders, Dialog Manager tập trung, Tách Service API thuần túy, và Tránh Anti-pattern "God Hook".
============================================================================
-->

# 📐 BỘ QUY TẮC CHUẨN TÁI CẤU TRÚC PAGE & BÓC TÁCH LOGIC (REFACTORING STANDARDS)

Bộ quy tắc này tổng hợp toàn bộ các chuẩn mực kiến trúc đã áp dụng thành công để bóc tách file `TeacherClassroomDetail.tsx` (từ **2.006 dòng xuống còn 135 dòng**), dùng làm kim chỉ nam để tái cấu trúc tất cả các trang khác trong dự án.

---

## 1. 🏗️ Mô Hình Kiến Trúc Container / Component (Container-Presenter Pattern)
* **File Container (Page chính)**: Chỉ chịu trách nhiệm:
  1. Đọc params/query từ Router (`useParams`, `useSearchParams`).
  2. Khởi tạo các Custom Hooks (`useClassroomStream`, `useQuizBuilder`, `useAssignmentGrading`...).
  3. Phân phối luồng view (`switch view / tab routing`).
* **Tiêu chuẩn kích thước (Guideline)**: Ưu tiên duy trì dưới **150 – 200 dòng code**. Đây là định hướng thiết kế (guideline), không phải quy tắc cứng:
  - Nếu page ~210 dòng nhưng chỉ chứa khai báo routing & hooks rõ ràng, dễ đọc thì **không bắt buộc phải tách**.
  - Ngược lại, nếu page chỉ 120 dòng nhưng chứa nhiều business logic xử lý trực tiếp thì **vẫn tính là code chưa sạch**.
  - Khi vượt ngưỡng 200 dòng, cần xem xét lại phân định trách nhiệm và khả năng bóc tách, **không ép tách chỉ thuần túy vì số dòng**.
* **Phân định State hợp lý (Business State vs UI State)**:
  - **Business State & Handlers (Bắt buộc vào Hook)**: Tất cả state liên quan đến nghiệp vụ dữ liệu (`selectedAssignment`, `gradingData`, `quizQuestions`, `activities`...) và các hàm gọi API phải được bóc tách hoàn toàn vào Custom Hooks.
  - **Simple UI/Transient State (Có thể ở lại Page)**: Các state giao diện đơn giản (như `isSidebarOpen`, `isMobileMenuOpen`, `activeDropdownId`...) được phép khai báo tại chỗ ở Page nếu việc bóc tách ra Hook riêng không mang lại giá trị thực tế.

---

## 2. 📦 Đóng Gói Hook Props Theo Miền Nghiệp Vụ (Domain-Based Object Packing)
* **Quy tắc**: Đóng gói theo Domain khi component tiêu thụ nhiều state/action cùng một miền nghiệp vụ:
  ```tsx
  {/* ❌ SAI: Truyền lẻ tẻ 15-20 props làm phình code & vỡ signature khi nâng cấp hook */}
  <ClassroomActivitiesTab
    quizzes={activities.quizzes}
    loadQuizzes={activities.loadQuizzes}
    searchQuery={activities.searchQuery}
    ...
  />

  {/* ✅ ĐÚNG: Truyền trọn gói Hook Object cho Section / View Component lớn */}
  <ClassroomActivitiesTab
    activities={activities}
    quizBuilder={quizBuilder}
    assignmentGrading={assignmentGrading}
  />
  ```
* **Lưu ý tránh lạm dụng**: Đừng truyền cả object khổng lồ nếu component con chỉ là **Atomic / UI Component nhỏ** dùng 1–2 thuộc tính đơn giản.
  - **Ví dụ**: `<UserAvatar user={user} />` hoặc `<UserAvatar avatarUrl={user.avatar} />` thay vì bắt component avatar phải nhận toàn bộ `auth={auth}` hook object.
  - **Triết lý**: Component lớn/phức tạp -> Đóng gói Domain Object Hook; Component nhỏ/dùng lại -> Chỉ truyền thuộc tính cần thiết để giữ tính độc lập (Low Coupling).

---

## 3. 🔄 Ổn Định Tham Chiếu Callback (Callback Reference Stabilization)
* **Quy tắc 1**: Không sử dụng inline arrow function khi truyền callback vào hook con nếu hàm đó đã được memoize:
  ```tsx
  // ❌ SAI: Tạo reference mới mỗi lần render gây re-render vô tận trong useEffect con
  const assignmentGrading = useAssignmentGrading({
    loadAllActivities: () => activities.loadAllActivities()
  });

  // ✅ ĐÚNG: Truyền trực tiếp hàm đã memoize với useCallback
  const assignmentGrading = useAssignmentGrading({
    loadAllActivities: activities.loadAllActivities
  });
  ```
* **Quy tắc 2**: Khi đưa function vào dependency array của `useEffect`, phải đảm bảo function đó:
  1. Đã được bọc bằng `useCallback`.
  2. Hoặc là setter function của `useState` (được React đảm bảo ổn định 100%).

---

## 4. 🗂️ Tổ Chức Thư Mục Theo Miền Nghiệp Vụ (Domain-Driven Sub-folders)
Tránh để 15–20 file nằm "phẳng" (flat) chung một thư mục. Hãy nhóm theo Feature / Domain:

```text
src/pages/[FeatureName]/
├── types/                           # 🟢 1. Chỉ chứa file *.types.ts định nghĩa Type thuần túy
│   └── feature.types.ts
├── utils/                           # 🔵 2. Chỉ chứa helper functions xử lý dữ liệu runtime
│   └── featureUtils.ts
├── hooks/                           # 🟡 3. Chứa các custom hooks quản lý logic
│   ├── useFeatureData.ts
│   └── useFeatureAction.ts
└── components/                      # 🔴 4. Chứa các component giao diện chia nhóm
    ├── stream/                      # Nhóm Bảng tin
    ├── schedule/                    # Nhóm Lịch trình
    ├── activities/                  # Nhóm Dựng & danh sách bài tập
    ├── grading/                     # Nhóm Chấm điểm & phân tích kết quả
    └── dialogs/                     # Nhóm Quản lý Modals & Dialogs
```

---

## 5. 🛡️ Quản Lý Modals / Dialogs Tập Trung (Centralized Dialog Manager)
* **Quy tắc**: Không để 5–10 Confirm Dialogs hay Modals nằm rải rác làm rối cây JSX của file chính.
* **Giải pháp**: Tạo 1 component `[Feature]DialogsManager.tsx` nhận các object hook để tập trung quản lý tất cả các popup, modal xác nhận xóa/sửa/giao bài.

---

## 6. 🔐 Quản Lý Thông Tin Người Dùng Trung Tâm (AuthContext Single Source of Truth)
* **Quy tắc**: Không lặp lại đoạn code fallback `userRole = user?.role || localStorage.getItem('userRole')` ở từng page.
* **Giải pháp**: Cung cấp `userRole`, `username`, `userAvatar` trực tiếp từ `AuthContext`. Các page chỉ việc dùng:
  ```tsx
  const { user, userRole, username, userAvatar } = useAuth();
  ```

---

## 7. 🏷️ Cấu Trúc Type Thuần Túy & Type-only Import (`verbatimModuleSyntax`)
* **Quy tắc**: Đưa toàn bộ `type` và `interface` dùng chung vào file `*.types.ts`.
* Khi import Type vào file component / page, bắt buộc dùng cú pháp `import type`:
  ```tsx
  import type { ClassroomActiveTab } from "./types/classroom.types";
  ```

---

## 8. 🧠 Business Logic Không Nằm Trong Component (Strict Logic Separation)
* **Phân định 3 tầng trách nhiệm**:
  1. **Tầng Service (`*.service.ts`)**: Chịu trách nhiệm tương tác trực tiếp với API backend, xử lý biến đổi dữ liệu thô.
  2. **Tầng Custom Hook (`use*.ts`)**: Chịu trách nhiệm quản lý state nghiệp vụ, chứa các tính toán logic (`filter`, `sort`, `calculate`, `validate`) và quản lý side-effects.
  3. **Tầng Component (JSX/TSX)**: Thuần túy làm nhiệm vụ hiển thị giao diện (Presentational) và chuyển tiếp sự kiện tương tác của người dùng (`onClick`, `onSubmit`) về cho Hook / Service.
* **Quy tắc cốt lõi**: Trong JSX/Component **không được viết trực tiếp** các thuật toán tính toán điểm phức tạp hay thao tác biến đổi mảng nặng nề.

---

## 9. 🌐 API Call Không Nằm Trực Tiếp Trong Component (API Call Isolation)
* **Quy tắc**: Tuyệt đối không gọi API trực tiếp trong Component.
  - ❌ **Không được viết**: `axios.get('/api/v1/...')` hay `fetch(...)` trực tiếp trong file Component/JSX.
  - ✅ **Bắt buộc**: Mọi thao tác I/O API phải nằm ở **Service Layer (`*.service.ts`)** và được gọi thông qua **Custom Hooks**.
* **3 Lợi ích lớn nhất**:
  1. **Dễ Unit Test / Mocking**: Component giao diện có thể dễ dàng test với dữ liệu giả lập mà không bị dính API thực tế.
  2. **Quản lý lỗi tập trung**: Xử lý `try/catch`, thông báo `toast.error()`, và retry token tại Service/Hook.
  3. **Bảo trì dễ dàng**: Khi Backend đổi cấu trúc API DTO hoặc URL Endpoint, chỉ cần sửa ở Service file duy nhất mà không làm vỡ các JSX Component.

---

## 10. 📦 Service Chỉ Xử Lý API, Không Xử Lý UI (Service Layer Purity)
* **Quy tắc**: Service layer (`*.service.ts`) là module TypeScript thuần túy (Pure TS Module).
  - ❌ **Không được import**: Các thư viện hiển thị UI (như `useToast`, `react-toastify`, `alert`), hay React Hooks/JSX vào Service file.
  - ✅ **Bắt buộc**: Service chỉ gửi HTTP Request, nhận Response, biến đổi DTO và trả về Data hoặc `throw Error`.
* **Lợi ích**: Giữ cho Service hoàn toàn độc lập với giao diện, có thể tái sử dụng mượt mà ở mọi môi trường (Web Worker, CLI, Node.js, hay Unit Test mà không phụ thuộc vào React DOM).

---

## 11. 🔄 Hook Chịu Trách Nhiệm State + Business Flow (Hook as Controller)
* **Quy tắc**: Custom Hook đóng vai trò là "Bộ điều phối" (Controller / Mediator) duy nhất của tính năng:
  - **Quản lý State**: Lưu trữ `loading`, `data`, `selectedItem`, `filterOptions`...
  - **Điều phối Business Flow**: Phối hợp gọi Service API, quản lý side-effects (`useEffect`), xử lý thông báo thành công/thất bại (`toast`), và điều khiển luồng dữ liệu khi người dùng tương tác.
* **Lợi ích**: Giúp toàn bộ quy trình nghiệp vụ được gói gọn trong Hook, Component bên ngoài chỉ cần gọi hàm (ví dụ: `quizBuilder.handleSaveQuiz()`) mà không cần bận tâm bên trong lưu dữ liệu như thế nào.

---

## 12. 🧹 Không Tạo "God Hook" (Avoid God Hook Anti-pattern)
* **Cảnh báo**: Tránh việc lôi toàn bộ logic của cả một trang lớn vào duy nhất 1 Custom Hook khổng lồ (ví dụ: `useClassroomAllLogic.ts` chứa 600 dòng code, 30 states, 40 handlers).
* **Tác hại**:
  1. Khi bất kỳ state nhỏ nào trong God Hook thay đổi, **tất cả mọi component** tiêu thụ God Hook đó sẽ bị re-render không cần thiết.
  2. Vi phạm nguyên lý Single Responsibility (Đơn trách nhiệm), làm cho Hook bị phình to, cực kỳ khó đọc và khó bảo trì.
* **Giải pháp**: Chia nhỏ thành nhiều Custom Hooks độc lập theo đúng từng miền nghiệp vụ (`useClassroomStream`, `useQuizBuilder`, `useAssignmentGrading`, `useBankAssign`, `useFocusGrading`).
