import dashboardAxios from "../utils/dashboardAxios";

export const getPlatformAnalytics = async () => {
  const response = await dashboardAxios.get("/api/v1/admin/platform/analytics");
  return response.data.data;
};
