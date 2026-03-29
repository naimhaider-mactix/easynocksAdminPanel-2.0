import authAxios from "../utils/authAxios";

/* ───────────────── LOGIN ───────────────── */
export const loginAdmin = async (payload) => {
  const response = await authAxios.post(
    "/api/v1/auth/admin/user/login/email-password",
    payload,
  );
  return response.data;
};

/* ───────────────── REGISTER USER ───────────────── */
export const registerUser = async (payload, coords) => {
  const response = await authAxios.post("/api/v1/auth/user/register", payload, {
    headers: {
      "X-Latitude": coords.lat,
      "X-Longitude": coords.lng,
    },
  });
  return response.data;
};

/* ───────────────── VERIFY OTP ───────────────── */
export const verifyRegisterOtp = async (payload, coords) => {
  const response = await authAxios.post(
    "/api/v1/auth/user/register/verify/otp",
    payload,
    {
      headers: {
        "X-Latitude": coords.lat,
        "X-Longitude": coords.lng,
      },
    },
  );
  return response.data;
};

/* ───────────────── GET SKILLS ───────────────── */
export const getAllSkills = async () => {
  const response = await authAxios.get("/api/v1/skill/get/all");
  return response.data;
};
