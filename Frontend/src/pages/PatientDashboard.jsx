import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { patientAPI } from "../api/axios";
import { useAuth } from "../context/AuthContext";

const DetailItem = ({ label, value }) => (
  <div
    style={{
      background: "var(--brand-50)",
      border: "1px solid var(--brand-100)",
      borderRadius: "var(--radius-md)",
      padding: "0.9rem 1rem",
      borderLeft: "3px solid var(--brand-300)",
    }}
  >
    <p
      style={{
        fontSize: "0.72rem",
        fontWeight: 500,
        color: "var(--text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {label}
    </p>
    <p
      style={{
        marginTop: "0.4rem",
        fontSize: "0.9rem",
        fontWeight: 600,
        color: "var(--brand-800)",
      }}
    >
      {value && String(value).trim() !== "" ? value : "—"}
    </p>
  </div>
);

const sectionCard = {
  background: "#ffffff",
  border: "1px solid var(--brand-100)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-sm)",
  padding: "1.5rem",
};

const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
};

const formatDateTime = (value) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const PatientDashboard = () => {
  const { user } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [form, setForm] = useState({
    name: "",
    nic: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    bloodGroup: "",
    allergies: "",
    medicalHistorySummary: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportForm, setReportForm] = useState({
    title: "",
    description: "",
    category: "general",
    reportFile: null,
  });

  const loadFormFromData = (data) => {
    setForm({
      name: data.user?.name || "",
      nic: data.user?.nic || "",
      phone: data.user?.phone || "",
      dateOfBirth: data.profile?.dateOfBirth || "",
      gender: data.profile?.gender || "",
      address: data.profile?.address || "",
      bloodGroup: data.profile?.bloodGroup || "",
      allergies: (data.profile?.allergies || []).join(", "),
      medicalHistorySummary: data.profile?.medicalHistorySummary || "",
      emergencyContactName: data.profile?.emergencyContactName || "",
      emergencyContactPhone: data.profile?.emergencyContactPhone || "",
    });
  };

  const fetchProfile = async () => {
    try {
      const { data } = await patientAPI.get("/patients/me");
      setProfileData(data);
      loadFormFromData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load patient profile");
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const { data } = await patientAPI.get("/reports/patient/my");
      setReports(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load reports");
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchReports();
  }, []);

  const reportCount = useMemo(() => reports.length, [reports]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setMessage("");
    setError("");
    setForm((prev) => ({
      ...prev,
      [name]: name === "nic" ? value.toUpperCase() : value,
    }));
  };

  const handleEditOpen = () => {
    if (profileData) loadFormFromData(profileData);
    setEditing(true);
    setMessage("");
    setError("");
  };

  const handleCancelEdit = () => {
    if (profileData) loadFormFromData(profileData);
    setEditing(false);
    setMessage("");
    setError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        allergies: form.allergies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      };

      const { data } = await patientAPI.put("/patients/me", payload);
      setProfileData(data);
      loadFormFromData(data);
      setEditing(false);
      setMessage("Patient profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleReportInputChange = (e) => {
    const { name, value } = e.target;
    setMessage("");
    setError("");
    setReportForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReportFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setMessage("");
    setError("");
    setReportForm((prev) => ({ ...prev, reportFile: file }));
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!reportForm.reportFile) {
      setError("Please choose a report file to upload.");
      return;
    }

    setReportSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("title", reportForm.title);
      payload.append("description", reportForm.description);
      payload.append("category", reportForm.category);
      payload.append("reportFile", reportForm.reportFile);

      await patientAPI.post("/reports/patient/my", payload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setReportForm({
        title: "",
        description: "",
        category: "general",
        reportFile: null,
      });

      const fileInput = document.getElementById("patient-report-file");
      if (fileInput) fileInput.value = "";

      setMessage("Medical report uploaded successfully.");
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload report");
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleOpenReport = async (id) => {
    try {
      const { data } = await patientAPI.get(`/reports/patient/my/${id}`);
      if (data?.cloudinarySecureUrl) {
        window.open(data.cloudinarySecureUrl, "_blank", "noopener,noreferrer");
      } else {
        setError("Report URL not found.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to open report");
    }
  };

  const handleDeleteReport = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this report?");
    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await patientAPI.delete(`/reports/patient/my/${id}`);
      setMessage("Medical report deleted successfully.");
      fetchReports();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete report");
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Patient Dashboard"
        subtitle="View and manage your healthcare profile information."
      />

      <div className="grid-stats" style={{ marginBottom: "1.75rem" }}>
        <StatCard title="Role" value={user?.role || "—"} />
        <StatCard title="Email" value={profileData?.user?.email || "—"} />
        <StatCard title="NIC" value={profileData?.user?.nic || "—"} />
        <StatCard title="Reports" value={reportCount} />
      </div>

      {message && (
        <div className="alert-success" style={{ marginBottom: "1.25rem" }}>
          {message}
        </div>
      )}

      {error && (
        <div className="alert-error" style={{ marginBottom: "1.25rem" }}>
          {error}
        </div>
      )}

      <div
        style={{
          ...sectionCard,
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.05rem",
              color: "var(--brand-800)",
            }}
          >
            Appointment Actions
          </h2>
          <p
            style={{
              marginTop: "0.2rem",
              fontSize: "0.84rem",
              color: "var(--text-secondary)",
            }}
          >
            Search doctors, book appointments, and track your bookings.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <Link
            to="/doctors"
            className="btn-primary"
            style={{ textDecoration: "none" }}
          >
            Find Doctors
          </Link>
          <Link
            to="/patient/appointments"
            className="btn-secondary"
            style={{ textDecoration: "none" }}
          >
            My Appointments
          </Link>
        </div>
      </div>

      <div style={sectionCard}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "1.75rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--brand-800)",
              }}
            >
              My Patient Profile
            </h2>
            <p
              style={{
                marginTop: "0.2rem",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
              }}
            >
              Review your personal and medical details here.
            </p>
          </div>

          {!editing ? (
            <button
              className="btn-primary"
              style={{ whiteSpace: "nowrap", flexShrink: 0 }}
              onClick={handleEditOpen}
            >
              Edit Profile
            </button>
          ) : (
            <button
              className="btn-secondary"
              style={{ whiteSpace: "nowrap", flexShrink: 0 }}
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          )}
        </div>

        {!editing ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "3px",
                    height: "18px",
                    background: "var(--brand-400)",
                    borderRadius: "2px",
                  }}
                />
                <h3
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "var(--brand-700)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Basic Details
                </h3>
              </div>

              <div className="grid-profile">
                <DetailItem label="Full Name" value={profileData?.user?.name} />
                <DetailItem label="NIC" value={profileData?.user?.nic} />
                <DetailItem label="Phone" value={profileData?.user?.phone} />
                <DetailItem label="Date of Birth" value={profileData?.profile?.dateOfBirth} />
                <DetailItem label="Gender" value={profileData?.profile?.gender} />
                <DetailItem label="Address" value={profileData?.profile?.address} />
                <DetailItem label="Blood Group" value={profileData?.profile?.bloodGroup} />
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "3px",
                    height: "18px",
                    background: "var(--brand-400)",
                    borderRadius: "2px",
                  }}
                />
                <h3
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    color: "var(--brand-700)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Medical Information
                </h3>
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                  marginBottom: "0.75rem",
                }}
                className="grid-profile"
              >
                <DetailItem
                  label="Allergies"
                  value={(profileData?.profile?.allergies || []).join(", ") || "—"}
                />
                <DetailItem
                  label="Emergency Contact Name"
                  value={profileData?.profile?.emergencyContactName}
                />
                <DetailItem
                  label="Emergency Contact Phone"
                  value={profileData?.profile?.emergencyContactPhone}
                />
              </div>

              <div
                style={{
                  background: "var(--brand-50)",
                  border: "1px solid var(--brand-100)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  borderLeft: "3px solid var(--brand-300)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Medical History Summary
                </p>
                <p
                  style={{
                    marginTop: "0.4rem",
                    fontSize: "0.9rem",
                    color: "var(--brand-800)",
                    lineHeight: 1.65,
                    whiteSpace: "pre-line",
                  }}
                >
                  {profileData?.profile?.medicalHistorySummary || "—"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="grid-2col"
            style={{ gap: "0.85rem" }}
          >
            <div>
              <label className="label">Full Name</label>
              <input
                name="name"
                className="input"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">NIC</label>
              <input
                name="nic"
                className="input"
                value={form.nic}
                onChange={handleChange}
                placeholder="200012345678 or 991234567V"
              />
            </div>

            <div>
              <label className="label">Phone</label>
              <input
                name="phone"
                className="input"
                value={form.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Date of Birth</label>
              <input
                name="dateOfBirth"
                type="text"
                className="input"
                value={form.dateOfBirth}
                onChange={handleChange}
                placeholder="2001-05-10"
              />
            </div>

            <div>
              <label className="label">Gender</label>
              <input
                name="gender"
                className="input"
                value={form.gender}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Address</label>
              <input
                name="address"
                className="input"
                value={form.address}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Blood Group</label>
              <input
                name="bloodGroup"
                className="input"
                value={form.bloodGroup}
                onChange={handleChange}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Allergies (comma separated)</label>
              <input
                name="allergies"
                className="input"
                value={form.allergies}
                onChange={handleChange}
                placeholder="Dust, Penicillin"
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Medical History Summary</label>
              <textarea
                name="medicalHistorySummary"
                rows="4"
                className="input"
                value={form.medicalHistorySummary}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Emergency Contact Name</label>
              <input
                name="emergencyContactName"
                className="input"
                value={form.emergencyContactName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="label">Emergency Contact Phone</label>
              <input
                name="emergencyContactPhone"
                className="input"
                value={form.emergencyContactPhone}
                onChange={handleChange}
              />
            </div>

            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
              }}
            >
              <button className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save Patient Profile"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div style={{ ...sectionCard, marginTop: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--brand-800)",
              }}
            >
              Medical Reports
            </h2>
            <p
              style={{
                marginTop: "0.2rem",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
              }}
            >
              Upload and manage your lab reports, prescriptions, and medical documents.
            </p>
          </div>
          <span
            className="badge"
            style={{
              background: "var(--brand-100)",
              color: "var(--brand-700)",
              fontWeight: 600,
            }}
          >
            {reportCount} file{reportCount !== 1 ? "s" : ""}
          </span>
        </div>

        <form
          onSubmit={handleReportSubmit}
          className="grid-2col"
          style={{
            gap: "0.85rem",
            marginBottom: "1.75rem",
            background: "var(--brand-50)",
            border: "1px solid var(--brand-100)",
            borderRadius: "var(--radius-lg)",
            padding: "1rem",
          }}
        >
          <div>
            <label className="label">Report Title</label>
            <input
              name="title"
              className="input"
              value={reportForm.title}
              onChange={handleReportInputChange}
              placeholder="Blood Test Report"
              required
            />
          </div>

          <div>
            <label className="label">Category</label>
            <select
              name="category"
              className="input"
              value={reportForm.category}
              onChange={handleReportInputChange}
            >
              <option value="general">General</option>
              <option value="lab">Lab</option>
              <option value="scan">Scan</option>
              <option value="prescription">Prescription</option>
              <option value="discharge">Discharge</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Description</label>
            <textarea
              name="description"
              rows="3"
              className="input"
              value={reportForm.description}
              onChange={handleReportInputChange}
              placeholder="Add any notes about this medical document"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Choose File</label>
            <input
              id="patient-report-file"
              type="file"
              className="input"
              accept=".pdf,image/png,image/jpeg,image/webp"
              onChange={handleReportFileChange}
            />
            <p style={{ marginTop: "0.35rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Supported: PDF, JPEG, PNG, WEBP • Max 10 MB
            </p>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <button className="btn-primary" disabled={reportSubmitting}>
              {reportSubmitting ? "Uploading…" : "Upload Report"}
            </button>
          </div>
        </form>

        {reportsLoading ? (
          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Loading reports…
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            title="No medical reports yet"
            description="Upload your first report to keep your records organized and accessible."
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {reports.map((report) => (
              <div
                key={report._id}
                style={{
                  background: "#ffffff",
                  border: "1px solid var(--brand-100)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1rem",
                  boxShadow: "var(--shadow-sm)",
                  borderTop: "3px solid var(--brand-400)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 600,
                        color: "var(--brand-800)",
                        lineHeight: 1.3,
                      }}
                    >
                      {report.title}
                    </h3>
                    <p
                      style={{
                        marginTop: "0.25rem",
                        fontSize: "0.78rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {report.originalFileName}
                    </p>
                  </div>

                  <span
                    className="badge"
                    style={{
                      background: "var(--brand-50)",
                      color: "var(--brand-700)",
                      border: "1px solid var(--brand-200)",
                      flexShrink: 0,
                    }}
                  >
                    {report.category || "general"}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <strong style={{ color: "var(--brand-700)" }}>Report ID:</strong> {report.reportId}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <strong style={{ color: "var(--brand-700)" }}>Size:</strong> {formatBytes(report.fileSize)}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    <strong style={{ color: "var(--brand-700)" }}>Uploaded:</strong>{" "}
                    {formatDateTime(report.createdAt)}
                  </p>
                  {report.description ? (
                    <p
                      style={{
                        marginTop: "0.35rem",
                        fontSize: "0.82rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.55,
                      }}
                    >
                      {report.description}
                    </p>
                  ) : null}
                </div>

                <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: "0.8rem", padding: "0.45rem 0.85rem" }}
                    onClick={() => handleOpenReport(report._id)}
                  >
                    View Report
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    style={{ fontSize: "0.8rem", padding: "0.45rem 0.85rem" }}
                    onClick={() => handleDeleteReport(report._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;