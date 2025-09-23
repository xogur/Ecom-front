// src/components/shared/LikeButton.jsx
import { useEffect, useRef, useState } from "react";
import api from "../../api/api";

export default function LikeButton({
  productId,
  initialCount,
  initialLiked,
  onChange,
  autoFetch = true,
}) {
  const [count, setCount] = useState(
    typeof initialCount === "number" ? initialCount : 0
  );
  const [liked, setLiked] = useState(!!initialLiked);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  // ✅ 부모가 내려준 배치 결과가 바뀌면 내부 state도 즉시 동기화
  useEffect(() => {
    setCount(typeof initialCount === "number" ? initialCount : 0);
  }, [initialCount]);

  useEffect(() => {
    setLiked(!!initialLiked);
  }, [initialLiked]);

  useEffect(() => {
    mountedRef.current = true;
    // 부모가 둘 다 내려줬으면(fetch 생략) 자동조회 하지 않음
    const hasHydrated =
      typeof initialCount === "number" && typeof initialLiked === "boolean";
    if (!autoFetch || hasHydrated) return;

    const controller = new AbortController();

    (async () => {
      try {
        const [cRes, mRes] = await Promise.all([
          api.get(`/products/${productId}/like/count`, {
            withCredentials: true,
            signal: controller.signal,
          }),
          api
            .get(`/products/${productId}/like/me`, {
              withCredentials: true,
              signal: controller.signal,
            })
            .catch(() => ({ data: { liked: false } })),
        ]);
        if (!mountedRef.current) return;
        setCount(Number(cRes?.data?.count ?? 0));
        setLiked(!!mRes?.data?.liked);
      } catch {
        // ignore
      }
    })();

    return () => {
      mountedRef.current = false;
      controller.abort();
    };
  }, [productId, autoFetch, initialCount, initialLiked]);

  const toggle = async () => {
    if (loading) return;

    const prevLiked = liked;
    const prevCount = count;
    const optimisticLiked = !liked;
    const optimisticCount = liked ? Math.max(0, count - 1) : count + 1;

    setLiked(optimisticLiked);
    setCount(optimisticCount);
    setLoading(true);

    try {
      const res = await api.post(
        `/products/${productId}/like/toggle`,
        null,
        { withCredentials: true }
      );
      const newLiked = !!res?.data?.liked;
      const newCount = Number(res?.data?.count ?? optimisticCount);

      if (!mountedRef.current) return;
      setLiked(newLiked);
      setCount(newCount);
      onChange && onChange(newLiked, newCount);
    } catch (e) {
      if (!mountedRef.current) return;
      setLiked(prevLiked);
      setCount(prevCount);

      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        const from = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        window.location.assign(`/login?from=${from}`);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <button
      type="button"
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
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.75 : 1,
      }}
      aria-pressed={liked}
      aria-busy={loading}
      title={liked ? "좋아요 취소" : "좋아요"}
    >
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
