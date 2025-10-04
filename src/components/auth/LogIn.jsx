import { useState } from "react";
import { useForm } from "react-hook-form";
import { AiOutlineLogin } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate } from "react-router-dom";
import InputField from "../shared/InputField";
import { useDispatch } from "react-redux";
import { authenticateSignInUser } from "../../store/actions";
import toast from "react-hot-toast";
import Spinners from "../shared/Spinners";

const API_BASE = import.meta.env.VITE_BACK_END_URL;

const LogIn = () => {
  const navigate = useNavigate();
  const [loader, setLoader] = useState(false);
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    mode: "onTouched",
  });

  const loginHandler = async (data) => {
    console.log("Login Click");
    dispatch(authenticateSignInUser(data, toast, reset, navigate, setLoader));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex justify-center items-center">
      <form
        onSubmit={handleSubmit(loginHandler)}
        className="sm:w-[450px] w-[360px] shadow-custom py-8 sm:px-8 px-4 rounded-md"
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <AiOutlineLogin className="text-slate-800 text-5xl" />
          <h1 className="text-slate-800 text-center font-montserrat lg:text-3xl text-2xl font-bold">
            Login Here
          </h1>
        </div>

        <hr className="mt-2 mb-5" />

        <div className="flex flex-col gap-3">
          <InputField
            label="UserName"
            required
            id="username"
            type="text"
            message="*UserName is required"
            placeholder="Enter your username"
            register={register}
            errors={errors}
          />

          <InputField
            label="Password"
            required
            id="password"
            type="password"
            message="*Password is required"
            placeholder="Enter your password"
            register={register}
            errors={errors}
          />
        </div>

        {/* 기본 로그인 버튼 */}
        <button
          disabled={loader}
          className="bg-button-gradient flex gap-2 items-center justify-center font-semibold text-white w-full py-2 hover:text-slate-400 transition-colors duration-100 rounded-sm my-3"
          type="submit"
        >
          {loader ? (
            <>
              <Spinners /> Loading...
            </>
          ) : (
            <>Login</>
          )}
        </button>

        {/* 구분선 */}
        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="px-3 text-xs text-slate-500">또는</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* ✅ 구글 로그인 버튼 (백엔드 OAuth2 엔드포인트로 이동) */}
        <a
          href={`/oauth2/authorization/google`}
          className={`w-full flex items-center justify-center gap-2 border border-slate-300 rounded-sm py-2 font-semibold ${
            loader
              ? "opacity-60 cursor-not-allowed"
              : "hover:bg-slate-50 transition-colors"
          }`}
          aria-disabled={loader}
          onClick={(e) => {
            if (loader) e.preventDefault();
          }}
        >
          <FcGoogle className="text-xl" />
          구글로 로그인
        </a>

        <p className="text-center text-sm text-slate-700 mt-6">
          Don't have an account?{" "}
          <Link className="font-semibold underline hover:text-black" to="/register">
            <span>SignUp</span>
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LogIn;
