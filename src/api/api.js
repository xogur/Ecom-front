// import axios from "axios";

// const api = axios.create({
//     baseURL: `${import.meta.env.VITE_BACK_END_URL}/api`,
//     withCredentials: true,
// });

// export default api;

import axios from "axios";

const api = axios.create({
  baseURL: "/api",       // 절대 URL( http://IP:8080 ) 절대 금지!
  withCredentials: true, // 쿠키 인증이면 true
  timeout: 15000,
});

export default api;