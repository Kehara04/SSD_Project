import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import { authAPI } from "../api/axios";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await authAPI.get("/admin/users");
        setUsers(Array.isArray(response.data) ? response.data : response.data.users || []);
      } catch (err) {
        console.error("Admin users fetch failed", err.message || err);
        setError(err.response?.data?.message || "Unable to load users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (filterRole === "all") return true;
    return u.role === filterRole;
  });

  const detailRowStyle = {
    background: "var(--brand-50)",
    border: "1px solid var(--brand-100)",
    borderRadius: "var(--radius-md)",
    padding: "1rem 1.25rem",
    marginBottom: "0.75rem",
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="All Users Overview"
        subtitle="Review every registered user in the system from the admin panel."
      />

      {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", minWidth: "160px" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>Filter by role</span>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ width: "100%", padding: "0.7rem 0.9rem", borderRadius: "0.75rem", border: "1px solid var(--brand-100)", background: "#ffffff", color: "var(--text-primary)" }}
          >
            <option value="all">All Users</option>
            <option value="patient">Patients</option>
            <option value="doctor">Doctors</option>
            <option value="admin">Admins</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Loading user overview…</p>
      ) : filteredUsers.length === 0 ? (
        <EmptyState title="No users" description="No users found matching the filter." />
      ) : (
        <div>
          {filteredUsers.map((u) => (
            <div key={u._id || u.id} style={{ ...detailRowStyle, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--brand-800)" }}>{u.name || u.email || "Unnamed user"}</h3>
                <p style={{ marginTop: "0.15rem", fontSize: "0.78rem", color: "var(--text-secondary)" }}>{u.email || "No email"}</p>
                <div style={{ marginTop: "0.5rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  <span style={{ background: "var(--brand-100)", color: "var(--brand-700)", borderRadius: "999px", padding: "0.15rem 0.6rem", fontSize: "0.72rem", fontWeight: 500 }}>
                    {u.role || "user"}
                  </span>
                  <span style={{
                    background: u.isActive ? "#ecfdf5" : "#fef2f2",
                    color: u.isActive ? "#065f46" : "#991b1b",
                    borderRadius: "999px",
                    padding: "0.15rem 0.6rem",
                    fontSize: "0.72rem",
                    fontWeight: 500,
                  }}>
                    {u.isActive ? "active" : "inactive"}
                  </span>
                  {u.role === "doctor" && (
                    <span style={{ background: "#fffbeb", color: "#92400e", borderRadius: "999px", padding: "0.15rem 0.6rem", fontSize: "0.72rem", fontWeight: 500 }}>
                      {u.doctorVerificationStatus || "pending"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminUsers;
