# My Classroom App (Frontend)

Đây là giao diện Frontend cho ứng dụng quản lý lớp học (Classroom). Dự án được xây dựng với các công nghệ hiện đại nhằm mang lại trải nghiệm học tập và quản lý mượt mà, giao diện đẹp mắt.

## 🚀 Công nghệ sử dụng (Tech Stack)

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: Tailwind CSS, SCSS, Styled Components
- **UI Components**: [HeroUI](https://heroui.com/), [Shadcn UI](https://ui.shadcn.com/)
- **Routing**: React Router DOM v7
- **Animations**: Framer Motion
- **Icons**: Lucide React, Phosphor React
- **Khác**: Recharts (vẽ biểu đồ), xlsx (xử lý file Excel)

## 📦 Cài đặt (Installation)

Yêu cầu máy tính của bạn đã cài đặt [Node.js](https://nodejs.org/).

1. Clone kho lưu trữ này về máy.
2. Mở terminal tại thư mục gốc của dự án (`frontend-classroom`).
3. Chạy lệnh sau để cài đặt các thư viện cần thiết:

```bash
npm install
```

## 🛠️ Chạy môi trường phát triển (Development)

Để khởi động server phát triển (Development Server), chạy lệnh:

```bash
npm run dev
```

Sau khi chạy xong, ứng dụng sẽ có mặt tại `http://localhost:5173` (hoặc port khác được chỉ định trên terminal).

## 🏗️ Build để triển khai (Production)

Khi muốn đóng gói ứng dụng để đưa lên server thực tế (production), bạn chạy lệnh:

```bash
npm run build
```

Sau khi build xong, bạn có thể xem thử kết quả build cục bộ bằng lệnh:

```bash
npm run preview
```

## 🧹 Code Quality

Để kiểm tra lỗi cú pháp (Linting) trong dự án, bạn có thể chạy:

```bash
npm run lint
```
