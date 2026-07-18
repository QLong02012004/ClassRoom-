import React from 'react';
import styled from 'styled-components';

// Giảm số lượng đốm lửa xuống còn khoảng 20-25 đốm để tinh tế hơn, không bị rối mắt
const nValues = [
  0.8865, 0.1355, 0.7449, 0.8842, 0.2639, 0.8008, 0.0349, 0.8160, 0.4397,
  0.7457, 0.0481, 0.4100, 0.1041, 0.3815, 0.4520, 0.2286, 0.8291, 0.9617,
  0.3374, 0.7277, 0.8969, 0.3096, 0.3860, 0.2347, 0.4591
];

const FireEffect = () => {
  return (
    <StyledWrapper>
      <div className="loader">
        <div className="fire">
          {nValues.map((n, i) => {
            const b = (n * 32.02135) % 1;
            const modN6 = (n * 6) % 1;
            return (
              <div
                key={i}
                className="ball"
                style={{
                  '--n': n,
                  '--b': b,
                  '--modN6': modN6
                } as React.CSSProperties}
              />
            );
          })}
        </div>
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <filter id="gooeyFire">
            {/* Tăng độ mờ stdDeviation để lửa mềm mại hơn */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="gooey" />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </svg>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  position: absolute;
  top: -25px; /* Chiều cao ngọn lửa nhô lên khỏi card (chỉ khoảng 25px) */
  left: 0;
  right: 0;
  height: 25px;
  z-index: -1; /* Nằm phía sau card */
  pointer-events: none;

  .loader {
    position: absolute;
    width: 100%;
    height: 100%;
    filter: url('#gooeyFire');
  }

  .fire {
    position: absolute;
    inset: 0;
  }

  .ball {
    position: absolute;
    bottom: -15px; /* Bắt đầu cháy từ tít bên dưới mép card để tạo cảm giác lửa mọc từ trong ra */
    --w: 20px; /* Kích thước đốm lửa to hơn một chút để mềm mại */
    --m: 4px;
    left: calc((100% - var(--w)) * var(--b));
    width: var(--w);
    height: var(--w);
    background: radial-gradient(closest-side, #fff, #fbbf24, #ef4444, transparent);
    border-radius: 0% 100%;
    translate: calc(-1 * var(--m)) 0;
    animation:
      ball-wee 3s calc(var(--n) * -3s) infinite linear, /* Tăng thời gian lên 3s để chuyển động chậm */
      ball-bf 2s calc(var(--modN6) * -2s) ease-in-out infinite; /* Đung đưa chậm hơn */
  }

  @keyframes ball-wee {
    from {
      scale: 0;
      opacity: 0;
      bottom: -15px;
    }
    20% {
      opacity: 0.8; /* Mờ nhẹ, không quá gắt */
    }
    40% {
      scale: 1;
    }
    to {
      left: calc((100% - var(--w)) * var(--b) + 20px * (var(--modN6) * 2 - 1));
      bottom: 150%; /* Lên không quá cao */
      scale: 0;
      rotate: 180deg;
    }
  }

  @keyframes ball-bf {
    50% {
      translate: var(--m) 0;
    }
  }
`;

export default FireEffect;
