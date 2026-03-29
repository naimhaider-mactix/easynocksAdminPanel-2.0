import { useState } from "react";

export default function Disputes() {
  const [issues, setIssues] = useState([
    {
      id: "#ISS-201",
      type: "User Issue",
      reportedBy: "Rahul Sharma",
      details: "Abusive messages reported",
      status: "open",
    },
    {
      id: "#ISS-202",
      type: "Project Dispute",
      reportedBy: "Anita Verma",
      details: "Work not delivered as agreed",
      status: "open",
    },
    {
      id: "#ISS-203",
      type: "Payment Complaint",
      reportedBy: "Snehal Pandey",
      details: "Payment not released",
      status: "resolved",
    },
    {
      id: "#ISS-204",
      type: "Marketplace Issue",
      reportedBy: "DesignPro Agency",
      details: "Fake service listing reported",
      status: "open",
    },
  ]);

  /* ================= ACTIONS ================= */

  const viewIssue = (issue) => {
    alert(
      `Issue: ${issue.id}\n` +
        `Type: ${issue.type}\n` +
        `Reported By: ${issue.reportedBy}\n` +
        `Details: ${issue.details}\n` +
        `Status: ${issue.status}`
    );
  };

  const warnUser = (index) => {
    if (!confirm(`Warn ${issues[index].reportedBy}?`)) return;
    alert("⚠️ Warning issued");
  };

  const resolveIssue = (index) => {
    const updated = [...issues];
    updated[index].status = "resolved";
    setIssues(updated);
    alert("✅ Issue resolved");
  };

  const suspendAccount = (index) => {
    if (!confirm("Suspend this account?")) return;
    const updated = issues.filter((_, i) => i !== index);
    setIssues(updated);
    alert("🚫 Account suspended");
  };

  return (
    <div className="disputes-page">
      <section className="content">
        <div className="panel">
          <h2>Disputes Management</h2>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Issue ID</th>
                  <th>Type</th>
                  <th>Reported By</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Admin Actions</th>
                </tr>
              </thead>

              <tbody>
                {issues.map((i, index) => (
                  <tr key={index}>
                    <td>{i.id}</td>
                    <td>{i.type}</td>
                    <td>{i.reportedBy}</td>
                    <td>{i.details}</td>

                    <td className={`status ${i.status}`}>
                      {i.status === "open" && "Open"}
                      {i.status === "resolved" && "Resolved"}
                    </td>

                    <td className="actions">
                      <button className="btn" onClick={() => viewIssue(i)}>
                        View
                      </button>

                      {i.status === "open" && (
                        <>
                          <button
                            className="btn"
                            onClick={() => warnUser(index)}
                          >
                            Warn
                          </button>

                          <button
                            className="btn"
                            onClick={() => resolveIssue(index)}
                          >
                            Mark Resolved
                          </button>

                          <button
                            className="btn danger"
                            onClick={() => suspendAccount(index)}
                          >
                            Suspend
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}