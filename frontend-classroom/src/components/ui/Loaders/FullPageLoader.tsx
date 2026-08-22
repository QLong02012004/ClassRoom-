import React from 'react';
import styled, { keyframes } from 'styled-components';

interface FullPageLoaderProps {
  text?: string;
  subtext?: string;
}

export const FullPageLoader: React.FC<FullPageLoaderProps> = ({
  text = "Đang tải dữ liệu...",
  subtext = "Vui lòng chờ trong giây lát"
}) => {
  return (
    <OverlayContainer>
      <BackgroundPattern />
      <GlowingOrb1 />
      <GlowingOrb2 />
      <LoaderCard>
        <StyledWrapper>
          <svg xmlns="http://www.w3.org/2000/svg" height="200px" width="200px" viewBox="0 0 200 200" className="pencil">
            <defs>
              <clipPath id="pencil-eraser">
                <rect height={30} width={30} ry={5} rx={5} />
              </clipPath>
            </defs>
            <circle transform="rotate(-113,100,100)" strokeLinecap="round" strokeDashoffset="439.82" strokeDasharray="439.82 439.82" strokeWidth={2} stroke="currentColor" fill="none" r={70} className="pencil__stroke" />
            <g transform="translate(100,100)" className="pencil__rotate">
              <g fill="none">
                <circle transform="rotate(-90)" strokeDashoffset={402} strokeDasharray="402.12 402.12" strokeWidth={30} stroke="#f47c20" r={64} className="pencil__body1" />
                <circle transform="rotate(-90)" strokeDashoffset={465} strokeDasharray="464.96 464.96" strokeWidth={10} stroke="#ff9442" r={74} className="pencil__body2" />
                <circle transform="rotate(-90)" strokeDashoffset={339} strokeDasharray="339.29 339.29" strokeWidth={10} stroke="#2f8fa3" r={54} className="pencil__body3" />
              </g>
              <g transform="rotate(-90) translate(49,0)" className="pencil__eraser">
                <g className="pencil__eraser-skew">
                  <rect height={30} width={30} ry={5} rx={5} fill="#fca5a5" />
                  <rect clipPath="url(#pencil-eraser)" height={30} width={5} fill="#ef4444" />
                  <rect height={20} width={30} fill="#f1f5f9" />
                  <rect height={20} width={15} fill="#cbd5e1" />
                  <rect height={20} width={5} fill="#94a3b8" />
                  <rect height={2} width={30} y={6} fill="rgba(15, 23, 42, 0.2)" />
                  <rect height={2} width={30} y={13} fill="rgba(15, 23, 42, 0.2)" />
                </g>
              </g>
              <g transform="rotate(-90) translate(49,-30)" className="pencil__point">
                <polygon points="15 0,30 30,0 30" fill="#fde047" />
                <polygon points="15 0,6 30,0 30" fill="#eab308" />
                <polygon points="15 0,20 10,10 10" fill="#0f172a" />
              </g>
            </g>
          </svg>
        </StyledWrapper>
        <LoadingText>{text}</LoadingText>
        {subtext && <LoadingSubtext>{subtext}</LoadingSubtext>}
      </LoaderCard>
    </OverlayContainer>
  );
};

const floatAnimation1 = keyframes`
  0%, 100% {
    transform: translate(0px, 0px) scale(1);
  }
  50% {
    transform: translate(-30px, 20px) scale(1.1);
  }
`;

const floatAnimation2 = keyframes`
  0%, 100% {
    transform: translate(0px, 0px) scale(1);
  }
  50% {
    transform: translate(30px, -20px) scale(1.15);
  }
`;

const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e0f2fe 100%);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  animation: fadeInLoader 0.35s ease-out forwards;

  @keyframes fadeInLoader {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const BackgroundPattern = styled.div`
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px);
  background-size: 24px 24px;
  pointer-events: none;
`;

const GlowingOrb1 = styled.div`
  position: absolute;
  top: 25%;
  left: 30%;
  width: 380px;
  height: 380px;
  background: radial-gradient(circle, rgba(244, 124, 32, 0.22) 0%, rgba(244, 124, 32, 0) 70%);
  filter: blur(50px);
  border-radius: 50%;
  pointer-events: none;
  animation: ${floatAnimation1} 8s ease-in-out infinite;
`;

const GlowingOrb2 = styled.div`
  position: absolute;
  bottom: 25%;
  right: 30%;
  width: 420px;
  height: 420px;
  background: radial-gradient(circle, rgba(47, 143, 163, 0.22) 0%, rgba(47, 143, 163, 0) 70%);
  filter: blur(60px);
  border-radius: 50%;
  pointer-events: none;
  animation: ${floatAnimation2} 10s ease-in-out infinite;
`;

const LoaderCard = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 36px 52px;
  background: rgba(255, 255, 255, 0.88);
  border: 1.5px solid rgba(255, 255, 255, 0.95);
  border-radius: 28px;
  box-shadow: 0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(244, 124, 32, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  text-align: center;
  max-width: 90vw;
`;

const LoadingText = styled.h3`
  margin-top: 18px;
  margin-bottom: 6px;
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.2px;
`;

const LoadingSubtext = styled.p`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #64748b;
`;

const StyledWrapper = styled.div`
  color: #cbd5e1;

  .pencil {
    display: block;
    width: 9.5em;
    height: 9.5em;
  }

  .pencil__body1,
  .pencil__body2,
  .pencil__body3,
  .pencil__eraser,
  .pencil__eraser-skew,
  .pencil__point,
  .pencil__rotate,
  .pencil__stroke {
    animation-duration: 3s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }

  .pencil__body1,
  .pencil__body2,
  .pencil__body3 {
    transform: rotate(-90deg);
  }

  .pencil__body1 {
    animation-name: pencilBody1;
  }

  .pencil__body2 {
    animation-name: pencilBody2;
  }

  .pencil__body3 {
    animation-name: pencilBody3;
  }

  .pencil__eraser {
    animation-name: pencilEraser;
    transform: rotate(-90deg) translate(49px, 0);
  }

  .pencil__eraser-skew {
    animation-name: pencilEraserSkew;
    animation-timing-function: ease-in-out;
  }

  .pencil__point {
    animation-name: pencilPoint;
    transform: rotate(-90deg) translate(49px, -30px);
  }

  .pencil__rotate {
    animation-name: pencilRotate;
  }

  .pencil__stroke {
    animation-name: pencilStroke;
    transform: translate(100px, 100px) rotate(-113deg);
  }

  /* Animations */
  @keyframes pencilBody1 {
    from,
    to {
      stroke-dashoffset: 351.86;
      transform: rotate(-90deg);
    }
    50% {
      stroke-dashoffset: 150.8;
      transform: rotate(-225deg);
    }
  }

  @keyframes pencilBody2 {
    from,
    to {
      stroke-dashoffset: 406.84;
      transform: rotate(-90deg);
    }
    50% {
      stroke-dashoffset: 174.36;
      transform: rotate(-225deg);
    }
  }

  @keyframes pencilBody3 {
    from,
    to {
      stroke-dashoffset: 296.88;
      transform: rotate(-90deg);
    }
    50% {
      stroke-dashoffset: 127.23;
      transform: rotate(-225deg);
    }
  }

  @keyframes pencilEraser {
    from,
    to {
      transform: rotate(-45deg) translate(49px, 0);
    }
    50% {
      transform: rotate(0deg) translate(49px, 0);
    }
  }

  @keyframes pencilEraserSkew {
    from,
    32.5%,
    67.5%,
    to {
      transform: skewX(0);
    }
    35%,
    65% {
      transform: skewX(-4deg);
    }
    37.5%,
    62.5% {
      transform: skewX(8deg);
    }
    40%,
    45%,
    50%,
    55%,
    60% {
      transform: skewX(-15deg);
    }
    42.5%,
    47.5%,
    52.5%,
    57.5% {
      transform: skewX(15deg);
    }
  }

  @keyframes pencilPoint {
    from,
    to {
      transform: rotate(-90deg) translate(49px, -30px);
    }
    50% {
      transform: rotate(-225deg) translate(49px, -30px);
    }
  }

  @keyframes pencilRotate {
    from {
      transform: translate(100px, 100px) rotate(0);
    }
    to {
      transform: translate(100px, 100px) rotate(720deg);
    }
  }

  @keyframes pencilStroke {
    from {
      stroke-dashoffset: 439.82;
      transform: translate(100px, 100px) rotate(-113deg);
    }
    50% {
      stroke-dashoffset: 164.93;
      transform: translate(100px, 100px) rotate(-113deg);
    }
    75%,
    to {
      stroke-dashoffset: 439.82;
      transform: translate(100px, 100px) rotate(112deg);
    }
  }
`;

export default FullPageLoader;
