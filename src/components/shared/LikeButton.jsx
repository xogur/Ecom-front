import { useEffect, useState } from "react";
import api from "../../api/api"; // axios 인스턴스

/**
 * props:
 *  - productId: number
 *  - initialCount?: number
 *  - initialLiked?: boolean
 *  - onChange?: (liked, count) => void
 */
export default function LikeButton({ productId, initialCount = 0, initialLiked = false, onChange }) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 서버에서 최신 liked & count를 가져오고 싶다면 여기서 호출
    const fetch = async () => {
      try {
        const [cRes, mRes] = await Promise.all([
          api.get(`/products/${productId}/like/count`),
          api.get(`/products/${productId}/like/me`).catch(() => ({ data: { liked: false } })) // 비로그인 등
        ]);
        setCount(Number(cRes?.data?.count ?? 0));
        setLiked(!!mRes?.data?.liked);
      } catch (e) {
        // 무시 또는 로깅
      }
    };
    fetch();
  }, [productId]);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post(`/products/${productId}/like/toggle`);
      const newLiked = !!res?.data?.liked;
      const newCount = Number(res?.data?.count ?? 0);
      setLiked(newLiked);
      setCount(newCount);
      onChange && onChange(newLiked, newCount);
    } catch (e) {
      // 로그인 필요/에러 처리
      // alert("로그인이 필요합니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 8,
        border: "1px solid #e5e7eb",
        background: liked ? "#fee2e2" : "#fff",
        color: liked ? "#dc2626" : "#111827",
        cursor: "pointer",
      }}
      aria-pressed={liked}
      title={liked ? "좋아요 취소" : "좋아요"}
    >
      {/* 심플한 하트 SVG (채움/빈하트 전환) */}
      {liked ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#dc2626" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 21s-6.716-4.692-9.428-7.404C1.343 12.366 1 11.209 1 10a6 6 0 0 1 10-4 6 6 0 0 1 10 4c0 1.209-.343 2.366-1.572 3.596C18.716 16.308 12 21 12 21z"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z"/>
        </svg>
      )}
      <span style={{ fontWeight: 600 }}>{count}</span>
    </button>
  );
}
