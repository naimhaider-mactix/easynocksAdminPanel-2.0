import jobAxios from "../utils/jobAxios";

/* ─── Get paginated admin jobs ─── */
export const getAdminJobs = async ({ lastCreatedAtMs, lastJobId } = {}) => {
  const params = {
    statuses: "OPEN,ASSIGNED,COMPLETED,CANCELLED,ONGOING",
    limit: 10,
  };
  if (lastCreatedAtMs) params.lastCreatedAtMs = lastCreatedAtMs;
  if (lastJobId) params.lastJobId = lastJobId;

  const res = await jobAxios.get("/api/v1/admin/jobs", { params });
  return (
    res?.data?.data || {
      jobs: [],
      nextLastCreatedAtMs: null,
      nextLastJobId: null,
    }
  );
};

/* ─── Delete job ─── */
export const deleteJob = async (jobId) => {
  const res = await jobAxios.delete(`/api/v1/admin/${jobId}`);
  return res.data;
};

/* ─── Cancel job ─── */
export const cancelJob = async (jobId) => {
  const res = await jobAxios.patch(`/api/v1/admin/${jobId}/cancel`);
  return res.data;
};

/* ─── Get assigned users for a job ─── */
export const getAssignedUsers = async (jobId) => {
  const res = await jobAxios.get("/api/v1/job/confirmed/user/details", {
    params: { jobId },
  });
  return res?.data?.data || [];
};

/* ─── Unassign user from job ─── */
export const unassignUserFromJob = async ({ jobId, providerId }) => {
  const res = await jobAxios.put(
    `/api/v1/admin/jobs/${jobId}/providers/${providerId}/unassign`,
  );
  return res.data;
};

/* ─── Get all proposals for a job ─── */
export const getJobProposals = async (jobId) => {
  const res = await jobAxios.get("/api/v1/job/proposal/get/all", {
    params: { jobId },
  });
  return res?.data?.data || [];
};

/* ─── Accept or deny a proposal ─── */
export const acceptOrDenyProposal = async ({ jobProposalId, accept }) => {
  const res = await jobAxios.put(
    "/api/v1/job/proposal/accept-or-denied/web",
    null,
    {
      params: { jobProposalId, accept },
    },
  );
  return res.data;
};

/* ─── Confirm booking after accept ─── */
export const confirmBooking = async (jobProposalId) => {
  const res = await jobAxios.post("/api/v1/job/confirm", null, {
    params: { jobProposalId },
  });
  return res.data;
};

/* ─── Create a job proposal (admin placing bid for a user) ─── */
export const createJobProposal = async ({
  jobId,
  userId,
  proposalText,
  proposedAmount,
  time,
  timeFormat,
}) => {
  const res = await jobAxios.post("/api/v1/job/proposal/create", {
    jobId,
    userId,
    proposalText,
    proposedAmount,
    time,
    timeFormat,
  });
  return res.data;
};
