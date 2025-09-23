import { useEffect, useMemo, useState } from "react";
import api from "../api/api";

/**
 * productIds: number[]
 * 반환: { counts: Record<number, number>, liked: Record<number, boolean>, loading, error, refresh }
 */
export default function useBatchProductLikes(productIds = []) {
  const [counts, setCounts] = useState({});
  const [liked, setLiked] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // join한 문자열을 의존성으로 써서 불필요한 재호출 방지
  const key = useMemo(() => productIds.slice().sort((a,b)=>a-b).join(","), [productIds]);

  useEffect(() => {
    if (!productIds || productIds.length === 0) {
      setCounts({});
      setLiked({});
      return;
    }

    const controller = new AbortController();
    const fetchBatch = async () => {
      setLoading(true);
      setError(null);
      try {
        // Spring @RequestParam("ids") List<Long>는 "ids=1,2,3" 형태가 가장 안전
        const url = `/products/likes?ids=${key}`;
        const { data } = await api.get(url, {
          withCredentials: true,
          signal: controller.signal,
        });
        // data: { counts: { [id]: number }, liked: { [id]: boolean } }
        setCounts(data?.counts || {});
        setLiked(data?.liked || {});
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
    return () => controller.abort();
  }, [key]);

  // 토글 이후, 부모/목록 쪽에서도 즉시 반영하고 싶을 때 쓰는 헬퍼
  const mutateOne = (id, nextLiked, nextCount) => {
    setLiked(prev => ({ ...prev, [id]: !!nextLiked }));
    setCounts(prev => ({ ...prev, [id]: Number(nextCount || 0) }));
  };

  const refresh = () => {
    // 간단히 key를 바꾸지 않고 다시 호출하려면 위 로직을 함수로 빼서 재호출하게 만들거나,
    // 여기선 counts/liked를 초기화하고 effect를 재실행하게끔 productIds를 바꾸는 방식 사용.
    // 필요하면 별도 fetch 함수 분리해서 여기서 호출해도 됨.
  };

  return { counts, liked, loading, error, mutateOne, refresh };
}