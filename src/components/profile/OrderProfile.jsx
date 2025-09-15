import React, { useEffect, useState } from "react";
import api from "../../api/api";

const OrderProfile = () => {
  const [value, setValue] = useState("");   // 서버가 반환한 String 저장
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const fetchValue = async () => {
      try {
        setLoading(true);
        setErr("");

        // 서버: @GetMapping("/order/users/orders") -> String 반환
        const res = await api.get("/order/users/orders", {
          // 혹시 JSON이 아닌 순수 문자열이라면 명시해도 됨(선택)
          responseType: "text",
          transformResponse: [(data) => data], // axios가 자동 JSON 파싱 시도하지 않도록
        });

        setValue(typeof res.data === "string" ? res.data : String(res.data ?? ""));
      } catch (e) {
        setErr("값을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchValue();
  }, []); // ✅ 불필요한 URL 의존성 제거

  if (loading) return <div>불러오는 중…</div>;
  if (err) return <div style={{ color: "red" }}>{err}</div>;

  return (
    <div>
      <h2>테스트: 서버에서 받은 문자열</h2>
      <pre style={{ background: "#f6f8fa", padding: "8px", borderRadius: 6 }}>
        {value || "(빈 문자열)"}
      </pre>
    </div>
  );
};

export default OrderProfile;
