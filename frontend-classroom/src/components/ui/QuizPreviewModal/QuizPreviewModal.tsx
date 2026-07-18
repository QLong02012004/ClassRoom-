import React, { useState, useEffect } from "react";
import { X, CaretLeft, CaretRight } from "phosphor-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export interface QuizPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  quizTitle: string;
  quizQuestions: {
    questionText: string;
    imageUrl?: string;
    options: string[];
    correctOptionIndex?: number;
    points?: number;
  }[];
}

export default function QuizPreviewModal({
  isOpen,
  onClose,
  quizTitle,
  quizQuestions
}: QuizPreviewModalProps) {
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentPreviewIndex(0);
    }
  }, [isOpen]);

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 1000
        }} />
        <DialogPrimitive.Content 
          onPointerDownOutside={(e) => e.preventDefault()}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "white",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "800px",
            display: "flex",
            flexDirection: "column",
            maxHeight: "90vh",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            zIndex: 1001,
            outline: "none"
        }}>
          {/* Header modal */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 24px",
            borderBottom: "1px solid #e2e8f0"
          }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fe6747", textTransform: "uppercase" }}>Chế độ Xem trước</span>
              <h4 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#1e293b" }}>{quizTitle || "Chưa có tiêu đề"}</h4>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                padding: "4px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Nội dung đề thi */}
          <div style={{
            padding: "24px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}>
            {quizQuestions.length > 0 ? (
              <>
                <div style={{
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "20px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fe6747" }}>
                      CÂU HỎI {currentPreviewIndex + 1} / {quizQuestions.length}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      Điểm: {quizQuestions[currentPreviewIndex].points || 1}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "1.05rem", fontWeight: 500, color: "#1e293b" }}>
                    {quizQuestions[currentPreviewIndex].questionText || "(Chưa có nội dung câu hỏi)"}
                  </p>
                  {quizQuestions[currentPreviewIndex].imageUrl && (
                    <img
                      src={quizQuestions[currentPreviewIndex].imageUrl}
                      alt="Hình ảnh minh họa"
                      style={{ marginTop: "12px", maxWidth: "100%", maxHeight: "250px", borderRadius: "8px", objectFit: "contain" }}
                    />
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                  {quizQuestions[currentPreviewIndex].options?.map((opt, oIdx) => {
                    const isCorrect = quizQuestions[currentPreviewIndex].correctOptionIndex === oIdx;
                    return (
                      <div
                        key={oIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "14px 16px",
                          borderRadius: "10px",
                          border: isCorrect ? "2px solid #fe6747" : "1.5px solid #e2e8f0",
                          backgroundColor: isCorrect ? "#fff7f5" : "white",
                          fontSize: "0.95rem"
                        }}
                      >
                        <span style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: isCorrect ? "#fe6747" : "#f1f5f9",
                          color: isCorrect ? "white" : "#64748b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.8rem"
                        }}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span style={{ flex: 1, color: "#334155" }}>{opt || "(Trống)"}</span>
                        {isCorrect && (
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fe6747" }}>ĐÁP ÁN ĐÚNG</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                Đề thi chưa có câu hỏi nào.
              </div>
            )}
          </div>

          {/* Footer modal xem trước */}
          {quizQuestions.length > 0 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 24px",
              borderTop: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              borderBottomLeftRadius: "16px",
              borderBottomRightRadius: "16px"
            }}>
              <button
                type="button"
                disabled={currentPreviewIndex === 0}
                onClick={() => setCurrentPreviewIndex(p => p - 1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  border: "1.5px solid #cbd5e1",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  opacity: currentPreviewIndex === 0 ? 0.5 : 1
                }}
              >
                <CaretLeft size={16} weight="bold" />
                Câu trước
              </button>

              <div style={{
                display: "flex",
                gap: "4px",
                flexWrap: "wrap",
                justifyContent: "center",
                maxWidth: "300px"
              }}>
                {quizQuestions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPreviewIndex(idx)}
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      padding: 0,
                      border: "none",
                      backgroundColor: currentPreviewIndex === idx ? "#fe6747" : "#cbd5e1",
                      cursor: "pointer"
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                disabled={currentPreviewIndex === quizQuestions.length - 1}
                onClick={() => setCurrentPreviewIndex(p => p + 1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  border: "1.5px solid #cbd5e1",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  opacity: currentPreviewIndex === quizQuestions.length - 1 ? 0.5 : 1
                }}
              >
                Câu sau
                <CaretRight size={16} weight="bold" />
              </button>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
