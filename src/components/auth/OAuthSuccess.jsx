import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { authenticateOAuthUser } from "../../store/actions";

export default function OAuthSuccess() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    // 쿼리 유무와 상관 없이 동기화 시도
    dispatch(authenticateOAuthUser(toast, navigate));
  }, [dispatch, navigate, params]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <p className="text-slate-700">로그인 처리 중…</p>
    </div>
  );
}