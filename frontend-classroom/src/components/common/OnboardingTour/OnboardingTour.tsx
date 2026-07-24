import React, { useState, useEffect } from 'react';
import { Joyride, type EventData, STATUS, type Step } from 'react-joyride';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const OnboardingTour: React.FC = () => {
  const { user } = useAuth();
  const [run, setRun] = useState(false);
  const location = useLocation();
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (user?.role !== 'student') return;
    // Determine the base path
    const path = location.pathname;
    let pageKey = 'dashboard';
    if (path.startsWith('/assignments')) pageKey = 'assignments';
    else if (path.startsWith('/classrooms')) pageKey = 'classrooms';
    else if (path.startsWith('/grades')) pageKey = 'grades';
    else if (path.startsWith('/materials')) pageKey = 'materials';
    
    // Check if tour is completed for this specific page
    const storageKey = `tour_completed_${pageKey}`;
    const isTourCompleted = localStorage.getItem(storageKey);
    
    if (!isTourCompleted) {
      setSteps(getStepsForPage(pageKey));
      // Đợi một chút để giao diện render xong
      const timer = setTimeout(() => setRun(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setRun(false);
    }
  }, [location.pathname]);

  const getStepsForPage = (pageKey: string): Step[] => {
    if (pageKey === 'dashboard') {
      return [
        {
          target: 'body',
          placement: 'center',
          title: '👋 Chào mừng đến với ClassRoom!',
          content: 'Chào mừng bạn đến với Hệ thống quản lý học tập. Hãy dành 1 phút để khám phá các tính năng chính nhé!',
          skipBeacon: true,
        },
        {
          target: '.tour-step-classrooms',
          title: 'Lớp học của bạn 🏫',
          content: 'Nơi hiển thị tất cả các lớp học mà bạn đang tham gia. Hãy nhấp vào đây để xem chi tiết bài giảng.',
          placement: 'right',
        },
        {
          target: '.tour-step-assignments',
          title: 'Bài tập cần làm 📝',
          content: 'Quản lý bài tập về nhà, xem hạn chộp bài và theo dõi các bài tập đã hoàn thành.',
          placement: 'right',
        },
        {
          target: '.tour-step-grades',
          title: 'Bảng điểm 📊',
          content: 'Theo dõi điểm số các bài kiểm tra và đánh giá thành tích học tập của bản thân.',
          placement: 'right',
        },
        {
          target: '.tour-step-materials',
          title: 'Kho Tài Liệu 📚',
          content: 'Mọi tài liệu, bài giảng giáo viên tải lên sẽ nằm ở đây. Bạn có thể xem trực tiếp hoặc tải về.',
          placement: 'right',
        },
        {
          target: '.tour-step-chat',
          title: 'Trợ lý Học tập AI ✨',
          content: 'Gặp bài tập khó? Hãy hỏi ngay Trợ lý ảo AI hoạt động 24/7 của chúng tôi để được giải đáp lập tức!',
          placement: 'right',
        },
        {
          target: '.tour-step-stats',
          title: 'Chỉ số Học tập 🔥',
          content: 'Theo dõi điểm XP, chuỗi ngày học liên tiếp và tỉ lệ chuyên cần để có thêm động lực học tập.',
          placement: 'bottom',
        },
        {
          target: '.tour-step-quick-actions',
          title: 'Thao tác Nhanh ⚡',
          content: 'Truy cập nhanh vào Bài tập, Bảng điểm, Tài liệu và Chat với giáo viên chỉ bằng 1 cú click.',
          placement: 'bottom',
        },
        {
          target: '.tour-step-todo',
          title: 'Nhiệm vụ trong ngày 📝',
          content: 'Danh sách các bài tập bạn cần hoàn thành gấp trong ngày hôm nay sẽ xuất hiện ở đây.',
          placement: 'right',
        },
        {
          target: '.tour-step-adaptive',
          title: 'Phân tích & Lỗ hổng 🧠',
          content: 'AI sẽ tự động tìm ra điểm yếu của bạn và đề xuất các bài tập bù đắp kiến thức bị hổng.',
          placement: 'top',
        },
        {
          target: '.tour-step-leaderboard',
          title: 'Bảng xếp hạng 🏆',
          content: 'Cùng đua top XP với các bạn trong lớp để xem ai là người chăm chỉ nhất nhé!',
          placement: 'left',
        },
        {
          target: '.tour-step-profile',
          title: 'Hồ Sơ Cá Nhân 👤',
          content: 'Tại đây bạn có thể xem thông tin cá nhân của mình hoặc đăng xuất khỏi hệ thống.',
          placement: 'bottom-end',
        }
      ];
    }
    
    if (pageKey === 'assignments') {
      return [
        {
          target: '.tour-step-search',
          title: 'Tìm kiếm nhanh 🔍',
          content: 'Bạn có thể gõ tên bài tập vào đây để tìm kiếm bài tập mong muốn một cách nhanh chóng.',
          placement: 'bottom',
          skipBeacon: true,
        },
        {
          target: '.tour-step-filters',
          title: 'Bộ lọc trạng thái 📌',
          content: 'Lọc bài tập theo các trạng thái như Sắp đến hạn, Quá hạn, Đã nộp...',
          placement: 'bottom',
        },
        {
          target: '.tour-step-assign-card',
          title: 'Thẻ bài tập 📋',
          content: 'Bấm vào thẻ này để bắt đầu làm bài hoặc xem chi tiết kết quả bài làm.',
          placement: 'right',
        }
      ];
    }

    if (pageKey === 'classrooms') {
      return [
        {
          target: '.tour-step-join-class',
          title: 'Tham gia lớp học ➕',
          content: 'Nhập mã gồm 6 ký tự do giáo viên cung cấp để xin vào lớp học mới.',
          placement: 'bottom',
          skipBeacon: true,
        },
        {
          target: '.tour-step-class-list',
          title: 'Danh sách Lớp học 🏫',
          content: 'Tất cả các lớp học bạn đang tham gia sẽ được liệt kê ở đây. Bấm vào lớp để vào học.',
          placement: 'top',
        }
      ];
    }
    
    if (pageKey === 'grades') {
      return [
        {
          target: '.tour-step-grade-hero',
          title: 'Tổng quan Điểm số 🏆',
          content: 'Khu vực này tóm tắt các chỉ số quan trọng nhất: ĐTB môn, Tỉ lệ nộp bài, và Vị trí xếp hạng của bạn.',
          placement: 'bottom',
          skipBeacon: true,
        },
        {
          target: '.tour-step-grade-ai',
          title: 'Phân tích từ AI 🧠',
          content: 'Trợ lý AI sẽ chỉ ra những điểm mạnh và cảnh báo các lỗ hổng kiến thức dựa trên kết quả bài làm của bạn.',
          placement: 'top',
        },
        {
          target: '.tour-step-grade-table',
          title: 'Bảng điểm Chi tiết 📊',
          content: 'Xem chi tiết điểm số từng bài, nhận xét của giáo viên và lọc bài tập theo trạng thái tại đây.',
          placement: 'right',
        }
      ];
    }

    if (pageKey === 'materials') {
      return [
        {
          target: '.tour-step-material-filters',
          title: 'Bộ lọc Tài liệu 🔎',
          content: 'Sử dụng bộ lọc để nhanh chóng tìm kiếm các tài liệu, video bài giảng hoặc đề cương ôn tập.',
          placement: 'bottom',
          skipBeacon: true,
        },
        {
          target: '.tour-step-material-card',
          title: 'Tải xuống Tài liệu 📥',
          content: 'Nhấn vào nút tải xuống để lưu tài liệu về máy, hoặc click vào thẻ để xem trực tiếp trên hệ thống.',
          placement: 'right',
        }
      ];
    }

    return [];
  };

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      
      const path = location.pathname;
      let pageKey = 'dashboard';
      if (path.startsWith('/assignments')) pageKey = 'assignments';
      else if (path.startsWith('/classrooms')) pageKey = 'classrooms';
      else if (path.startsWith('/grades')) pageKey = 'grades';
      else if (path.startsWith('/materials')) pageKey = 'materials';
      
      localStorage.setItem(`tour_completed_${pageKey}`, 'true');
    }
  };

  // Nếu không có step nào thì không render Joyride để tránh lỗi
  if (steps.length === 0) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleJoyrideCallback}
      options={{
        zIndex: 10000,
        primaryColor: '#f47c20', // Màu cam hệ thống
        textColor: '#0F172A',
        backgroundColor: '#ffffff',
        overlayColor: 'rgba(15, 23, 42, 0.5)',
        showProgress: true,
        width: 500, // Tăng chiều rộng của form
        buttons: ['back', 'close', 'primary', 'skip'],
      }}
      styles={{
        buttonPrimary: {
          backgroundColor: '#f47c20',
          borderRadius: '8px',
          fontWeight: 600,
        },
        buttonBack: {
          color: '#2d8cf0', // Màu xanh hệ thống
          fontWeight: 600,
        },
        buttonSkip: {
          color: '#64748B',
          fontWeight: 500,
        },
        buttonClose: {
          marginTop: '12px',
          marginRight: '12px',
          transform: 'scale(1.2)', // Cho nút X to lên một xíu để dễ bấm
        },
        tooltip: {
          padding: '24px',
          borderRadius: '12px',
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipContent: {
          padding: '12px 0',
          fontSize: '15px',
          lineHeight: '1.6',
        },
        tooltipTitle: {
          fontSize: '18px',
          fontWeight: 700,
          color: '#f47c20',
        },
      }}
      locale={{
        back: 'Quay lại',
        close: 'Đóng',
        last: 'Hoàn thành',
        next: 'Tiếp theo',
        skip: 'Bỏ qua',
      }}
    />
  );
};

export default OnboardingTour;
