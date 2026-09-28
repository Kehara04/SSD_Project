import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import EmptyState from "../components/EmptyState";
import { doctorAPI, patientAPI } from "../api/axios";
import { useAuth } from "../context/AuthContext";

const emptyLocation = {
  name: "",
  type: "clinic",
  address: "",
  city: "",
  contactNumber: "",
  isActive: true,
};

const emptySlot = {
  day: "",
  locationId: "",
  startTime: "",
  endTime: "",
  slotDuration: 15,
  consultationModes: ["in_person", "video"],
  consultationFee: "",
  videoConsultationFee: "",
  isAvailable: true,
};

const sectionCard = {
  background: "#ffffff",
  border: "1px solid var(--brand-100)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-sm)",
  padding: "1.5rem",
};

const dayOptions = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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
        whiteSpace: "pre-line",
      }}
    >
      {value && String(value).trim() !== "" ? value : "—"}
    </p>
  </div>
);

const DoctorDashboard = () => {
  const { user } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    specialization: "",
    qualifications: "",
    consultationFee: "",
    videoConsultationFee: "",
    yearsOfExperience: "",
    licenseNumber: "",
    bio: "",
  });

  const [locationForm, setLocationForm] = useState({ ...emptyLocation });
  const [editingLocationId, setEditingLocationId] = useState("");
  const [availability, setAvailability] = useState([{ ...emptySlot }]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [savingAvailability, setSavingAvailability] = useState(false);

  const [patientLookupNic, setPatientLookupNic] = useState("");
  const [patientReportsData, setPatientReportsData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const activeLocations = useMemo(
    () =>
      (profileData?.profile?.practiceLocations || []).filter(
        (location) => location.isActive !== false
      ),
    [profileData]
  );

  const patientReportCount = patientReportsData?.reports?.length || 0;

  const loadProfileFormFromData = (data) => {
    setProfileForm({
      name: data?.user?.name || "",
      phone: data?.user?.phone || "",
      specialization: data?.profile?.specialization || "",
      qualifications: data?.profile?.qualifications || "",
      consultationFee: data?.profile?.consultationFee || "",
      videoConsultationFee: data?.profile?.videoConsultationFee || "",
      yearsOfExperience: data?.profile?.yearsOfExperience || "",
      licenseNumber: data?.profile?.licenseNumber || "",
      bio: data?.profile?.bio || "",
    });

    if (data?.profile?.availability?.length) {
      setAvailability(
        data.profile.availability.map((slot) => ({
          day: slot.day || "",
          locationId: slot.locationId || "",
          startTime: slot.startTime || "",
          endTime: slot.endTime || "",
          slotDuration: Number(slot.slotDuration || 15),
          consultationModes: Array.isArray(slot.consultationModes)
            ? slot.consultationModes
            : ["in_person", "video"],
          consultationFee: slot.consultationFee ?? "",
          videoConsultationFee: slot.videoConsultationFee ?? "",
          isAvailable: slot.isAvailable !== false,
        }))
      );
    } else {
      setAvailability([{ ...emptySlot }]);
    }
  };

  const resetLocationForm = () => {
    setLocationForm({ ...emptyLocation });
    setEditingLocationId("");
  };

  const fetchProfile = async () => {
    try {
      const { data } = await doctorAPI.get("/doctors/me/profile");
      setProfileData(data);
      loadProfileFormFromData(data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load doctor profile");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    setMessage("");
    setError("");
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setMessage("");
    setError("");

    try {
      const { data } = await doctorAPI.put("/doctors/me/profile", {
        ...profileForm,
        consultationFee: Number(profileForm.consultationFee || 0),
        videoConsultationFee: Number(profileForm.videoConsultationFee || 0),
        yearsOfExperience: Number(profileForm.yearsOfExperience || 0),
      });

      setProfileData(data);
      loadProfileFormFromData(data);
      setEditingProfile(false);
      setMessage("Doctor profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save doctor profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLocationFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLocationForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditLocation = (location) => {
    setEditingLocationId(location._id || location.id);
    setLocationForm({
      name: location.name || "",
      type: location.type || "clinic",
      address: location.address || "",
      city: location.city || "",
      contactNumber: location.contactNumber || "",
      isActive: location.isActive !== false,
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveLocation = async (e) => {
    e.preventDefault();
    setSavingLocation(true);
    setMessage("");
    setError("");

    try {
      if (editingLocationId) {
        await doctorAPI.patch(`/doctors/me/locations/${editingLocationId}`, locationForm);
        setMessage("Practice location updated successfully.");
      } else {
        await doctorAPI.post("/doctors/me/locations", locationForm);
        setMessage("Practice location added successfully.");
      }

      resetLocationForm();
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save practice location");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    const confirmed = window.confirm(
      "Delete this practice location? Remove related availability first if the system blocks deletion."
    );
    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      await doctorAPI.delete(`/doctors/me/locations/${locationId}`);
      if (editingLocationId === locationId) resetLocationForm();
      await fetchProfile();
      setMessage("Practice location deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete practice location");
    }
  };

  const handleAvailabilityChange = (index, field, value) => {
    setAvailability((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const toggleConsultationMode = (index, mode) => {
    setAvailability((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const alreadySelected = item.consultationModes.includes(mode);
        const nextModes = alreadySelected
          ? item.consultationModes.filter((m) => m !== mode)
          : [...item.consultationModes, mode];

        return {
          ...item,
          consultationModes: nextModes.length ? nextModes : ["in_person"],
        };
      })
    );
  };

  const addSlot = () => setAvailability((prev) => [...prev, { ...emptySlot }]);

  const removeSlot = (index) =>
    setAvailability((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [{ ...emptySlot }];
    });

  const saveAvailability = async () => {
    setSavingAvailability(true);
    setMessage("");
    setError("");

    try {
      const cleanedAvailability = availability
        .filter((slot) => slot.day && slot.locationId && slot.startTime && slot.endTime)
        .map((slot) => ({
          day: slot.day,
          locationId: slot.locationId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          slotDuration: Number(slot.slotDuration || 15),
          consultationModes: slot.consultationModes,
          consultationFee: Number(slot.consultationFee || 0),
          videoConsultationFee: Number(slot.videoConsultationFee || 0),
          isAvailable: slot.isAvailable !== false,
        }));

      await doctorAPI.put("/doctors/me/availability", {
        availability: cleanedAvailability,
      });

      await fetchProfile();
      setEditingAvailability(false);
      setMessage("Availability updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update availability");
    } finally {
      setSavingAvailability(false);
    }
  };

  // Keep report-specific errors within the Patient Reports section.
  const getReportErrorMessage = (err) => {
    const status = err.response?.status;

    if (status === 401) {
      return "Your session is invalid or has expired. Please log in again to access medical reports.";
    }
    if (status === 403) {
      return "You can only view medical reports for patients who have an approved or completed appointment with you. Please check the patient's NIC or appointment details and try again.";
    }
    if (status === 404) {
      return "The requested patient or medical report could not be found.";
    }
    if (status >= 500) {
      return "Medical reports are temporarily unavailable. Please try again later.";
    }
    if (!err.response) {
      return "Unable to connect to the medical report service. Please check your connection and try again.";
    }
    return "Unable to retrieve medical reports. Please try again.";
  };

  const handleSearchPatientReports = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setReportError("");
    setPatientReportsData(null);

    const normalizedNic = patientLookupNic.trim().toUpperCase();
    if (!normalizedNic) {
      setReportError("Please enter a patient NIC.");
      return;
    }

    setReportsLoading(true);
    try {
      const { data } = await patientAPI.get(
        `/reports/doctor/patient/nic/${encodeURIComponent(normalizedNic)}`
      );
      setPatientReportsData(data);
      setReportError("");
    } catch (err) {
      setPatientReportsData(null);
      setReportError(getReportErrorMessage(err));
    } finally {
      setReportsLoading(false);
    }
  };

  const handleOpenDoctorReport = async (id) => {
    setReportError("");
    setError("");

    try {
      // The backend must authorize the doctor for this report before returning its URL.
      const { data } = await patientAPI.get(
        `/reports/doctor/${encodeURIComponent(id)}`
      );
      if (!data?.cloudinarySecureUrl) {
        setReportError("The requested medical report file is unavailable.");
        return;
      }
      window.open(data.cloudinarySecureUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      if (err.response?.status === 403) {
        setPatientReportsData(null);
      }
      setReportError(getReportErrorMessage(err));
    }
  };

  const statCards = [
    {
      title: "Practice Locations",
      value: String(profileData?.profile?.practiceLocations?.length || 0),
      helper: `${activeLocations.length} active`,
    },
    {
      title: "Availability Blocks",
      value: String(profileData?.profile?.availability?.length || 0),
      helper: "Weekly schedule entries",
    },
    {
      title: "In-person Fee",
      value: `LKR ${Number(profileData?.profile?.consultationFee || 0)}`,
      helper: "Default base fee",
    },
    {
      title: "Video Fee",
      value: `LKR ${Number(profileData?.profile?.videoConsultationFee || 0)}`,
      helper: "Default video fee",
    },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome back${user?.name ? `, Dr. ${user.name}` : ""}`}
        subtitle="Manage your doctor profile, practice locations, location-based availability, and patient reports."
      />

      {message && <div className="alert-success" style={{ marginBottom: "1.25rem" }}>{message}</div>}
      {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}

      <div className="grid-stats" style={{ marginBottom: "1.5rem" }}>
        {statCards.map((item) => (
          <StatCard key={item.title} title={item.title} value={item.value} helper={item.helper} />
        ))}
      </div>

      <div
        style={{
          ...sectionCard,
          marginBottom: "1.5rem",
          display: "flex",
          flexWrap: "wrap",
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
            Appointment Requests
          </h2>
          <p
            style={{
              marginTop: "0.2rem",
              fontSize: "0.84rem",
              color: "var(--text-secondary)",
            }}
          >
            View and manage patient appointment requests.
          </p>
        </div>

        <Link
          to="/doctor/appointments"
          className="btn-primary"
          style={{ textDecoration: "none" }}
        >
          View Appointments
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        <div style={sectionCard}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--brand-800)" }}>
                Doctor Profile
              </h2>
              <p style={{ marginTop: "0.2rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                Hospital or clinic is now managed through practice locations and availability.
              </p>
            </div>
            {!editingProfile ? (
              <button className="btn-primary" onClick={() => setEditingProfile(true)}>Edit</button>
            ) : (
              <button
                className="btn-secondary"
                onClick={() => {
                  if (profileData) loadProfileFormFromData(profileData);
                  setEditingProfile(false);
                }}
              >
                Cancel
              </button>
            )}
          </div>

          {!editingProfile ? (
            <div className="grid-profile">
              <DetailItem label="Full Name" value={profileData?.user?.name} />
              <DetailItem label="Phone" value={profileData?.user?.phone} />
              <DetailItem label="Specialization" value={profileData?.profile?.specialization} />
              <DetailItem label="Qualifications" value={profileData?.profile?.qualifications} />
              <DetailItem label="Consultation Fee" value={`LKR ${Number(profileData?.profile?.consultationFee || 0)}`} />
              <DetailItem label="Video Consultation Fee" value={`LKR ${Number(profileData?.profile?.videoConsultationFee || 0)}`} />
              <DetailItem label="Experience" value={`${Number(profileData?.profile?.yearsOfExperience || 0)} years`} />
              <DetailItem label="License Number" value={profileData?.profile?.licenseNumber} />
              <div style={{ gridColumn: "1 / -1" }}>
                <DetailItem label="Bio" value={profileData?.profile?.bio} />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="grid-2col" style={{ gap: "0.85rem" }}>
              {[
                ["Full Name", "name"],
                ["Phone", "phone"],
                ["Specialization", "specialization"],
                ["Qualifications", "qualifications"],
                ["Consultation Fee", "consultationFee", "number"],
                ["Video Consultation Fee", "videoConsultationFee", "number"],
                ["Years of Experience", "yearsOfExperience", "number"],
                ["License Number", "licenseNumber"],
              ].map(([label, name, type]) => (
                <div key={name}>
                  <label className="label">{label}</label>
                  <input
                    name={name}
                    type={type || "text"}
                    className="input"
                    value={profileForm[name]}
                    onChange={handleProfileChange}
                  />
                </div>
              ))}

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="label">Bio</label>
                <textarea
                  name="bio"
                  rows="4"
                  className="input"
                  value={profileForm.bio}
                  onChange={handleProfileChange}
                />
              </div>

              <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button className="btn-primary" disabled={savingProfile}>
                  {savingProfile ? "Saving…" : "Save Profile"}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    if (profileData) loadProfileFormFromData(profileData);
                    setEditingProfile(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div style={sectionCard}>
          <div style={{ marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--brand-800)" }}>
              Practice Locations
            </h2>
            <p style={{ marginTop: "0.2rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Add hospitals or clinics first, then attach availability slots to each location.
            </p>
          </div>

          <form onSubmit={handleSaveLocation} className="grid-2col" style={{ gap: "0.75rem", marginBottom: "1rem" }}>
            <div>
              <label className="label">Location Name</label>
              <input className="input" name="name" value={locationForm.name} onChange={handleLocationFieldChange} required />
            </div>

            <div>
              <label className="label">Type</label>
              <select className="input" name="type" value={locationForm.type} onChange={handleLocationFieldChange}>
                <option value="hospital">Hospital</option>
                <option value="clinic">Clinic</option>
                <option value="center">Center</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Address</label>
              <input className="input" name="address" value={locationForm.address} onChange={handleLocationFieldChange} />
            </div>

            <div>
              <label className="label">City</label>
              <input className="input" name="city" value={locationForm.city} onChange={handleLocationFieldChange} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label className="label">Contact Number</label>
              <input className="input" name="contactNumber" value={locationForm.contactNumber} onChange={handleLocationFieldChange} />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.88rem" }}>
              <input type="checkbox" name="isActive" checked={locationForm.isActive} onChange={handleLocationFieldChange} />
              Active location
            </label>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button className="btn-primary" disabled={savingLocation}>
                {savingLocation
                  ? "Saving…"
                  : editingLocationId
                    ? "Update Location"
                    : "Add Location"}
              </button>
              {editingLocationId && (
                <button type="button" className="btn-secondary" onClick={resetLocationForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          {!profileData?.profile?.practiceLocations?.length ? (
            <EmptyState
              title="No practice locations yet"
              description="Add at least one hospital or clinic before creating availability blocks."
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {profileData.profile.practiceLocations.map((location) => {
                const locationId = location._id || location.id;
                return (
                  <div
                    key={locationId}
                    style={{
                      background: "var(--brand-50)",
                      border: "1px solid var(--brand-100)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.9rem 1rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <p style={{ fontWeight: 700, color: "var(--brand-800)" }}>{location.name}</p>
                          <span className="badge" style={{ background: "var(--brand-100)", color: "var(--brand-700)" }}>
                            {location.type || "clinic"}
                          </span>
                          {location.isActive === false && (
                            <span className="badge" style={{ background: "#fee2e2", color: "#b91c1c" }}>
                              Inactive
                            </span>
                          )}
                        </div>
                        <p style={{ marginTop: "0.35rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                          {[location.address, location.city].filter(Boolean).join(", ") || "No address added"}
                        </p>
                        <p style={{ marginTop: "0.2rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                          {location.contactNumber || "No contact number added"}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <button className="btn-secondary" onClick={() => handleEditLocation(location)}>Edit</button>
                        <button className="btn-danger" onClick={() => handleDeleteLocation(locationId)}>Delete</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ ...sectionCard, marginTop: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: "var(--brand-800)" }}>
              Location-Based Availability
            </h2>
            <p style={{ marginTop: "0.2rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Each schedule block belongs to one hospital or clinic.
            </p>
          </div>
          {!editingAvailability ? (
            <button className="btn-primary" onClick={() => setEditingAvailability(true)}>Edit</button>
          ) : (
            <button
              className="btn-secondary"
              onClick={() => {
                if (profileData) loadProfileFormFromData(profileData);
                setEditingAvailability(false);
              }}
            >
              Cancel
            </button>
          )}
        </div>

        {!editingAvailability ? (
          !profileData?.profile?.availability?.length ? (
            <EmptyState
              title="No availability added yet"
              description="Create location-based time blocks so patients can book by doctor, hospital, date, and slot."
            />
          ) : (
            <div className="grid-3col">
              {profileData.profile.availability.map((slot, index) => (
                <div
                  key={`${slot.locationId || "no-location"}-${slot.day}-${slot.startTime}-${index}`}
                  style={{
                    background: "var(--brand-50)",
                    border: "1px solid var(--brand-100)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.9rem 1rem",
                    borderLeft: "3px solid var(--brand-400)",
                  }}
                >
                  <p style={{ fontWeight: 700, color: "var(--brand-800)" }}>{slot.locationName || "Location not linked"}</p>
                  <p style={{ marginTop: "0.3rem", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                    {slot.day} • {slot.startTime} - {slot.endTime}
                  </p>
                  <p style={{ marginTop: "0.3rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {Array.isArray(slot.consultationModes) ? slot.consultationModes.join(", ") : "in_person, video"}
                  </p>
                  <p style={{ marginTop: "0.3rem", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    Slot duration: {Number(slot.slotDuration || 15)} mins
                  </p>
                </div>
              ))}
            </div>
          )
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {!activeLocations.length && (
              <div className="alert-error">
                Add an active practice location first. Availability now requires a hospital or clinic.
              </div>
            )}

            {availability.map((slot, index) => (
              <div
                key={index}
                style={{
                  background: "var(--brand-50)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--brand-100)",
                  padding: "1rem",
                }}
              >
                <div className="grid-profile">
                  <div>
                    <label className="label">Location</label>
                    <select
                      className="input"
                      value={slot.locationId}
                      onChange={(e) => handleAvailabilityChange(index, "locationId", e.target.value)}
                    >
                      <option value="">Select location</option>
                      {activeLocations.map((location) => (
                        <option key={location._id || location.id} value={location._id || location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Day</label>
                    <select
                      className="input"
                      value={slot.day}
                      onChange={(e) => handleAvailabilityChange(index, "day", e.target.value)}
                    >
                      <option value="">Select day</option>
                      {dayOptions.map((day) => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Start Time</label>
                    <input
                      type="time"
                      className="input"
                      value={slot.startTime}
                      onChange={(e) => handleAvailabilityChange(index, "startTime", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label">End Time</label>
                    <input
                      type="time"
                      className="input"
                      value={slot.endTime}
                      onChange={(e) => handleAvailabilityChange(index, "endTime", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label">Slot Duration (mins)</label>
                    <input
                      type="number"
                      min="5"
                      className="input"
                      value={slot.slotDuration}
                      onChange={(e) => handleAvailabilityChange(index, "slotDuration", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label">In-person Fee</label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={slot.consultationFee}
                      onChange={(e) => handleAvailabilityChange(index, "consultationFee", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="label">Video Fee</label>
                    <input
                      type="number"
                      min="0"
                      className="input"
                      value={slot.videoConsultationFee}
                      onChange={(e) => handleAvailabilityChange(index, "videoConsultationFee", e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "0.85rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <input
                      type="checkbox"
                      checked={slot.consultationModes.includes("in_person")}
                      onChange={() => toggleConsultationMode(index, "in_person")}
                    />
                    In-person
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <input
                      type="checkbox"
                      checked={slot.consultationModes.includes("video")}
                      onChange={() => toggleConsultationMode(index, "video")}
                    />
                    Video
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                    <input
                      type="checkbox"
                      checked={slot.isAvailable !== false}
                      onChange={(e) => handleAvailabilityChange(index, "isAvailable", e.target.checked)}
                    />
                    Active block
                  </label>
                </div>

                <div style={{ marginTop: "0.85rem" }}>
                  <button type="button" className="btn-danger" onClick={() => removeSlot(index)}>
                    Remove Block
                  </button>
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button type="button" className="btn-secondary" onClick={addSlot}>
                + Add Availability Block
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={saveAvailability}
                disabled={savingAvailability || !activeLocations.length}
              >
                {savingAvailability ? "Saving…" : "Save Availability"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ ...sectionCard, marginTop: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
            marginBottom: "1.25rem",
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
              Patient Reports
            </h2>
            <p
              style={{
                marginTop: "0.2rem",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
              }}
            >
              Access patient-uploaded reports using the patient&apos;s NIC.
            </p>
          </div>

          {patientReportsData?.patient ? (
            <span className="badge" style={{ background: "var(--brand-100)", color: "var(--brand-700)", fontWeight: 600 }}>
              {patientReportCount} report{patientReportCount !== 1 ? "s" : ""}
            </span>
          ) : null}
        </div>

        <form onSubmit={handleSearchPatientReports} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", marginBottom: "1rem" }}>
          <div>
            <label className="label">Patient NIC</label>
            <input
              className="input"
              value={patientLookupNic}
              onChange={(e) => setPatientLookupNic(e.target.value)}
              placeholder="Enter NIC and search"
            />
          </div>
          <button className="btn-primary" style={{ alignSelf: "end" }} disabled={reportsLoading}>
            {reportsLoading ? "Searching…" : "Search Reports"}
          </button>
        </form>

        {/* Medical-report authorization and request errors */}
        {reportError && (
          <div
            role="alert"
            aria-live="assertive"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "14px 16px",
              marginBottom: "18px",
              background: "#FFF5F5",
              border: "1px solid #FECACA",
              borderLeft: "4px solid #DC2626",
              borderRadius: "10px",
              color: "#991B1B",
              fontSize: "13px",
              lineHeight: 1.6,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0, marginTop: "1px" }}
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              <path d="M12 8v5" />
              <path d="M12 17h.01" />
            </svg>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", marginBottom: "3px", fontSize: "14px" }}>
                {reportError.includes("approved or completed appointment")
                  ? "You cannot view this patient's reports"
                  : "Medical Report Notice"}
              </strong>
              <span>{reportError}</span>
            </div>
            <button
              type="button"
              onClick={() => setReportError("")}
              aria-label="Dismiss report error"
              style={{
                border: "none",
                background: "transparent",
                color: "#991B1B",
                cursor: "pointer",
                fontSize: "20px",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}

        {!patientReportsData ? (
          <EmptyState
            title="Search for a patient"
            description="Enter the patient NIC to view uploaded medical reports."
          />
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem", marginBottom: "1rem" }}>
              <DetailItem label="Patient Name" value={patientReportsData?.patient?.name} />
              <DetailItem label="Patient NIC" value={patientReportsData?.patient?.nic} />
              <DetailItem label="Email" value={patientReportsData?.patient?.email} />
              <DetailItem label="Phone" value={patientReportsData?.patient?.phone} />
            </div>

            {!patientReportsData?.reports?.length ? (
              <EmptyState title="No reports found" description="This patient has not uploaded any reports yet." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {patientReportsData.reports.map((report) => (
                  <div
                    key={report._id}
                    style={{
                      background: "var(--brand-50)",
                      border: "1px solid var(--brand-100)",
                      borderRadius: "var(--radius-md)",
                      padding: "1rem",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                      <div>
                        <p style={{ fontWeight: 700, color: "var(--brand-800)" }}>{report.title || report.originalName || "Medical Report"}</p>
                        <p style={{ marginTop: "0.3rem", fontSize: "0.83rem", color: "var(--text-secondary)" }}>
                          {report.description || "No description added"}
                        </p>
                        <p style={{ marginTop: "0.3rem", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          Uploaded: {report.createdAt ? new Date(report.createdAt).toLocaleString() : "—"}
                        </p>
                      </div>
                      <button className="btn-secondary" onClick={() => handleOpenDoctorReport(report._id)}>
                        Open Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;