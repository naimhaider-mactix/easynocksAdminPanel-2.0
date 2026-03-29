import marketplaceAxios from "../utils/marketplaceAxios";

/* ================= GET ALL ADS ================= */
export const getAdminAds = async ({ lastCreatedAtMs, lastAdId } = {}) => {
  const params = {
    statuses: "ACTIVE,SOLD,EXPIRED,DELETED",
    limit: 10,
  };
  if (lastCreatedAtMs) params.lastCreatedAtMs = lastCreatedAtMs;
  if (lastAdId) params.lastAdId = lastAdId;

  const response = await marketplaceAxios.get("/api/v1/admin/ads", { params });
  return response.data.data;
};

/* ================= DELETE AD ================= */
export const deleteAd = async (adId) => {
  const response = await marketplaceAxios.delete(`/api/v1/admin/ads/${adId}`);
  return response.data;
};
