import userAxios from "../utils/userAxios";

/* ─── Get all users (paginated, with optional location) ─── */
export const getAllUsers = async ({
  pageNo = 0,
  pageSize = 10,
  lastId,
  lastCreatedAtMs,
  location = false,
} = {}) => {
  const params = { pageNo, pageSize };
  if (lastId) params.lastId = lastId;
  if (lastCreatedAtMs) params.lastCreatedAtMs = lastCreatedAtMs;
  if (location) params.location = true;

  const res = await userAxios.get("/api/v1/admin/get/all/user/details", {
    params,
  });
  return res.data.data; // { data: [...], lastId, lastCreatedAtMs }
};

/* ─── Get user profile by id (returns base64 photo) ─── */
export const getUserProfileById = async (userId) => {
  const res = await userAxios.get("/api/v1/user-profile/by-id", {
    params: { userId },
  });
  return res?.data?.data || null;
};

/* ─── Deactivate user ─── */
export const deactivateUser = async (userId) => {
  const res = await userAxios.put("/api/v1/admin/deActive/user", null, {
    params: { userId, active: false },
  });
  return res.data;
};

/* ─── Activate user ─── */
export const activateUser = async (userId) => {
  const res = await userAxios.put("/api/v1/admin/deActive/user", null, {
    params: { userId, active: true },
  });
  return res.data;
};
