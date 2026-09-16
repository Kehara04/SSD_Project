import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import EmptyState from "../components/EmptyState";
import { appointmentAPI } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import pageBackground from "../assets/hos-bg.png";

const defaultFilters = {
  specialization: "",
  name: "",
  hospitalOrClinic: "",
  minFee: "",
  maxFee: "",
  availableOnly: false,
  date: "",
  sortBy: "",
  order: "asc",
};

const defaultBookingForm = {
  doctorId: "",
  locationId: "",
  appointmentDate: "",
  appointmentTime: "",
  consultationType: "in_person",
  reason: "",
  notes: "",
};

const getLocations = (doctor) =>
  doctor?.profile?.activePracticeLocations || doctor?.profile?.practiceLocations || [];

const normalizeConsultationType = (type) => {
  if (!type) return "in_person";
  const normalized = String(type).trim().toLowerCase().replace(/[-\s]/g, "_");
  if (normalized === "inperson") return "in_person";
  return normalized;
};

const normalizeConsultationModes = (modes = []) => {
  if (!Array.isArray(modes)) return [];
  return modes.map((mode) => normalizeConsultationType(mode));
};

const getSlotFee = (slot, consultationType, doctor) => {
  const normalizedType = normalizeConsultationType(consultationType);

  const slotInPersonFee = Number(
    slot?.consultationFee ??
      slot?.inPersonFee ??
      slot?.in_person_fee ??
      0
  );

  const slotVideoFee = Number(
    slot?.videoConsultationFee ??
      slot?.videoFee ??
      slot?.video_fee ??
      0
  );

  const doctorInPersonFee = Number(
    doctor?.profile?.consultationFee ??
      doctor?.profile?.inPersonFee ??
      0
  );

  const doctorVideoFee = Number(
    doctor?.profile?.videoConsultationFee ??
      doctor?.profile?.videoFee ??
      0
  );

  if (normalizedType === "video") {
    return slotVideoFee || doctorVideoFee || doctorInPersonFee || slotInPersonFee || 0;
  }

  return slotInPersonFee || doctorInPersonFee || 0;
};

const getEffectiveFees = (doctor, consultationType) => {
  const normalizedType = normalizeConsultationType(consultationType);

  const baseInPerson = Number(
    doctor?.profile?.consultationFee ??
      doctor?.profile?.inPersonFee ??
      0
  );

  const baseVideo = Number(
    doctor?.profile?.videoConsultationFee ??
      doctor?.profile?.videoFee ??
      0
  );

  if (normalizedType === "video") {
    return baseVideo > 0 ? baseVideo : baseInPerson;
  }

  return baseInPerson;
};

const DoctorDirectory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const showFindDoctorBackground = !user || user?.role === "doctor" || user?.role === "patient";

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingForm, setBookingForm] = useState(defaultBookingForm);
  const [bookingLoading, setBookingLoading] = useState(false);

  const [slotData, setSlotData] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const fetchDoctors = async (customFilters = filters) => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      Object.entries(customFilters).forEach(([key, value]) => {
        if (value !== "" && value !== false) params[key] = value;
      });

      const { data } = await appointmentAPI.get("/appointments/doctors/search", { params });
      setDoctors(data);
    } catch (err) {
      setDoctors([]);
      setError(err.response?.data?.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (doctorId, appointmentDate, locationId) => {
    if (!doctorId || !appointmentDate || !locationId) {
      setSlotData(null);
      return;
    }

    setSlotsLoading(true);
    setError("");

    try {
      const { data } = await appointmentAPI.get(`/appointments/doctors/${doctorId}/slots`, {
        params: { date: appointmentDate, locationId },
      });

      const normalizedSlots = Array.isArray(data?.slots)
        ? data.slots.map((slot) => ({
            ...slot,
            consultationModes: normalizeConsultationModes(slot.consultationModes),
          }))
        : [];

      setSlotData({
        ...data,
        slots: normalizedSlots,
      });
    } catch (err) {
      setSlotData(null);
      setError(err.response?.data?.message || "Failed to load slots");
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const applyFilters = async (e) => {
    e.preventDefault();
    await fetchDoctors(filters);
  };

  const clearFilters = async () => {
    setFilters(defaultFilters);
    await fetchDoctors(defaultFilters);
  };

  const openLoginPopup = () => {
    setShowLoginPopup(true);
  };

  const closeLoginPopup = () => {
    setShowLoginPopup(false);
  };

  const handleLoginPopupOk = () => {
    closeLoginPopup();
    navigate("/login");
  };

  const openBooking = (doctor) => {
    if (!user) {
      setShowLoginPopup(true);
      return;
    }

    setSelectedDoctor(doctor);
    setBookingForm({
      ...defaultBookingForm,
      doctorId: doctor.id,
      locationId: getLocations(doctor)[0]?._id || getLocations(doctor)[0]?.id || "",
      consultationType: "in_person",
    });
    setSlotData(null);
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeBooking = () => {
    setSelectedDoctor(null);
    setBookingForm(defaultBookingForm);
    setSlotData(null);
  };

  const handleBookingChange = async (e) => {
    const { name, value } = e.target;
    const normalizedValue =
      name === "consultationType" ? normalizeConsultationType(value) : value;

    setBookingForm((prev) => {
      const next = { ...prev, [name]: normalizedValue };

      if (name === "locationId" || name === "appointmentDate" || name === "consultationType") {
        next.appointmentTime = "";
      }

      return next;
    });

    const nextDoctorId = selectedDoctor?.id;
    const nextDate = name === "appointmentDate" ? value : bookingForm.appointmentDate;
    const nextLocationId = name === "locationId" ? value : bookingForm.locationId;

    if (nextDoctorId && nextDate && nextLocationId && (name === "appointmentDate" || name === "locationId")) {
      await fetchSlots(nextDoctorId, nextDate, nextLocationId);
    }

    if ((name === "appointmentDate" && !value) || (name === "locationId" && !value)) {
      setSlotData(null);
    }
  };

  const selectSlot = (slot) => {
    const modeAllowed = normalizeConsultationModes(slot.consultationModes).includes(
      normalizeConsultationType(bookingForm.consultationType)
    );

    if (!slot.isAvailable || !modeAllowed) return;

    setBookingForm((prev) => ({
      ...prev,
      appointmentTime: slot.time,
      locationId: slot.locationId || prev.locationId,
    }));
  };

  const submitBooking = async (e) => {
    e.preventDefault();

    if (!user) {
      setShowLoginPopup(true);
      return;
    }

    setBookingLoading(true);
    setMessage("");
    setError("");

    try {
      await appointmentAPI.post("/appointments", {
        doctorId: bookingForm.doctorId,
        locationId: bookingForm.locationId,
        appointmentDate: bookingForm.appointmentDate,
        appointmentTime: bookingForm.appointmentTime,
        reason: bookingForm.reason,
        notes: bookingForm.notes,
        consultationType: normalizeConsultationType(bookingForm.consultationType) === "video"
          ? "video"
          : "in_person",
      });

      setMessage("Appointment booked successfully. Waiting for doctor approval.");
      closeBooking();
    } catch (err) {
      if (err.response?.status === 401) {
        setShowLoginPopup(true);
        return;
      }
      setError(err.response?.data?.message || "Failed to create appointment");
      if (selectedDoctor?.id && bookingForm.appointmentDate && bookingForm.locationId) {
        await fetchSlots(selectedDoctor.id, bookingForm.appointmentDate, bookingForm.locationId);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const countText = useMemo(() => {
    if (loading) return "Loading doctors...";
    return `${doctors.length} verified doctor${doctors.length !== 1 ? "s" : ""} found`;
  }, [loading, doctors.length]);

  const selectedSlot = useMemo(() => {
    if (!slotData?.slots?.length || !bookingForm.appointmentTime) return null;
    return slotData.slots.find((slot) => slot.time === bookingForm.appointmentTime) || null;
  }, [slotData, bookingForm.appointmentTime]);

  const estimatedFee = selectedSlot
    ? getSlotFee(selectedSlot, bookingForm.consultationType, selectedDoctor)
    : getEffectiveFees(selectedDoctor, bookingForm.consultationType);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--surface-page)",
        backgroundImage: showFindDoctorBackground
          ? `linear-gradient(rgba(243, 253, 246, 0.2), rgba(243, 253, 246, 0.2)), url(${pageBackground})`
          : "none",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <Navbar />

      <div
        style={{
          background: "linear-gradient(135deg, rgba(9, 95, 86, 0.88) 0%, rgba(13, 148, 136, 0.82) 100%)",
          padding: "2.5rem 0 2rem",
        }}
      >
        <div className="container-app">
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              background: "rgba(255,255,255,0.15)",
              color: "#a7f3d0",
              borderRadius: "999px",
              padding: "0.25rem 0.8rem",
              fontSize: "0.72rem",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Verified Professionals
          </span>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.2,
            }}
          >
            Find a Doctor
          </h1>

          <p style={{ marginTop: "0.4rem", color: "rgba(255,255,255,0.72)", fontSize: "0.9rem" }}>
            Search doctors by name, specialization, hospital or clinic, fee, and availability. Then choose the exact location, date, and slot.
          </p>
        </div>
      </div>

      <main
        style={{
          background: showFindDoctorBackground
            ? "linear-gradient(180deg, rgba(240, 250, 249, 0.42) 0%, rgba(232, 245, 243, 0.36) 100%)"
            : "linear-gradient(180deg, #f0faf9 0%, #e8f5f3 100%)",
          minHeight: "60vh",
        }}
      >
        <div className="container-app" style={{ padding: "2rem 1.5rem 2.5rem" }}>
          {message && <div className="alert-success" style={{ marginBottom: "1.25rem" }}>{message}</div>}
          {error && <div className="alert-error" style={{ marginBottom: "1.25rem" }}>{error}</div>}

          {selectedDoctor && (
            <div
              style={{
                background: "#ffffff",
                border: "1px solid var(--brand-100)",
                borderRadius: "var(--radius-lg)",
                padding: "1.5rem",
                boxShadow: "var(--shadow-sm)",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontFamily: "var(--font-display)", color: "var(--brand-800)" }}>
                    Book Appointment with {selectedDoctor.name}
                  </h2>
                  <p style={{ marginTop: "0.2rem", fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                    {selectedDoctor.profile?.specialization || "Specialist"}
                  </p>
                </div>
                <button className="btn-secondary" onClick={closeBooking}>Close</button>
              </div>

              <form onSubmit={submitBooking} style={{ display: "grid", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem" }}>
                  <div>
                    <label className="label">Hospital / Clinic</label>
                    <select className="input" name="locationId" value={bookingForm.locationId} onChange={handleBookingChange} required>
                      <option value="">Select location</option>
                      {getLocations(selectedDoctor).map((location) => (
                        <option key={location._id || location.id} value={location._id || location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Date</label>
                    <input
                      className="input"
                      type="date"
                      name="appointmentDate"
                      min={today}
                      value={bookingForm.appointmentDate}
                      onChange={handleBookingChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Consultation Type</label>
                    <select
                      className="input"
                      name="consultationType"
                      value={bookingForm.consultationType}
                      onChange={handleBookingChange}
                    >
                      <option value="in_person">In-person</option>
                      <option value="video">Video</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Available Slots</label>
                  {!bookingForm.locationId ? (
                    <p style={{ color: "var(--text-muted)" }}>Select a hospital or clinic first.</p>
                  ) : !bookingForm.appointmentDate ? (
                    <p style={{ color: "var(--text-muted)" }}>Select a date to load slots.</p>
                  ) : slotsLoading ? (
                    <p style={{ color: "var(--text-muted)" }}>Loading slots...</p>
                  ) : !slotData?.slots?.length ? (
                    <p style={{ color: "var(--text-muted)" }}>No slots available for the selected location and date.</p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
                      {slotData.slots.map((slot) => {
                        const normalizedSelectedType = normalizeConsultationType(bookingForm.consultationType);
                        const slotModes = normalizeConsultationModes(slot.consultationModes);
                        const modeAllowed = slotModes.includes(normalizedSelectedType);
                        const isDisabled = !slot.isAvailable || !modeAllowed;
                        const isSelected = bookingForm.appointmentTime === slot.time;
                        const fee = getSlotFee(slot, normalizedSelectedType, selectedDoctor);

                        return (
                          <button
                            key={`${slot.locationId || "loc"}-${slot.time}`}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => selectSlot(slot)}
                            style={{
                              padding: "0.85rem 1rem",
                              borderRadius: "var(--radius-md)",
                              border: isSelected ? "2px solid var(--brand-500)" : "1px solid var(--brand-200)",
                              background: isDisabled ? "#f3f4f6" : isSelected ? "var(--brand-50)" : "#ffffff",
                              color: isDisabled ? "var(--text-muted)" : "var(--brand-800)",
                              cursor: isDisabled ? "not-allowed" : "pointer",
                              textAlign: "left",
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>{slot.label}</div>
                            <div style={{ marginTop: "0.3rem", fontSize: "0.76rem" }}>{slot.locationName}</div>
                            <div style={{ marginTop: "0.2rem", fontSize: "0.76rem" }}>LKR {fee}</div>
                            {!modeAllowed && (
                              <div style={{ marginTop: "0.25rem", fontSize: "0.72rem" }}>
                                Not available for {normalizedSelectedType === "video" ? "video" : "in-person"}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem" }}>
                  <div>
                    <label className="label">Selected Time</label>
                    <input className="input" value={bookingForm.appointmentTime} readOnly placeholder="Choose a slot above" />
                  </div>
                  <div>
                    <label className="label">Estimated Fee</label>
                    <input className="input" readOnly value={`LKR ${estimatedFee}`} />
                  </div>
                </div>

                <div>
                  <label className="label">Reason</label>
                  <input className="input" name="reason" value={bookingForm.reason} onChange={handleBookingChange} required />
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea className="input" rows="4" name="notes" value={bookingForm.notes} onChange={handleBookingChange} />
                </div>

                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <button
                    className="btn-primary"
                    disabled={bookingLoading || !bookingForm.locationId || !bookingForm.appointmentDate || !bookingForm.appointmentTime}
                  >
                    {bookingLoading ? "Booking…" : "Confirm Booking"}
                  </button>
                  <button type="button" className="btn-secondary" onClick={closeBooking}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <form className="section-card" onSubmit={applyFilters} style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", color: "var(--brand-800)" }}>Search Filters</h2>
                <p style={{ marginTop: "0.2rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>{countText}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
              <div>
                <label className="label">Doctor Name</label>
                <input className="input" name="name" value={filters.name} onChange={handleFilterChange} />
              </div>
              <div>
                <label className="label">Specialization</label>
                <input className="input" name="specialization" value={filters.specialization} onChange={handleFilterChange} />
              </div>
              <div>
                <label className="label">Hospital / Clinic</label>
                <input className="input" name="hospitalOrClinic" value={filters.hospitalOrClinic} onChange={handleFilterChange} />
              </div>
              <div>
                <label className="label">Available On</label>
                <input className="input" type="date" name="date" min={today} value={filters.date} onChange={handleFilterChange} />
              </div>
              <div>
                <label className="label">Min Fee</label>
                <input className="input" type="number" name="minFee" value={filters.minFee} onChange={handleFilterChange} />
              </div>
              <div>
                <label className="label">Max Fee</label>
                <input className="input" type="number" name="maxFee" value={filters.maxFee} onChange={handleFilterChange} />
              </div>
              <div>
                <label className="label">Sort By</label>
                <select className="input" name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
                  <option value="">Default</option>
                  <option value="fee">Fee</option>
                  <option value="experience">Experience</option>
                </select>
              </div>
              <div>
                <label className="label">Order</label>
                <select className="input" name="order" value={filters.order} onChange={handleFilterChange}>
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", marginTop: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontSize: "0.9rem" }}>
                <input type="checkbox" name="availableOnly" checked={filters.availableOnly} onChange={handleFilterChange} />
                Show only doctors available on selected date
              </label>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
              <button className="btn-primary">Apply Filters</button>
              <button type="button" className="btn-secondary" onClick={clearFilters}>Clear</button>
            </div>
          </form>

          {loading ? (
            <div className="section-card"><p style={{ color: "var(--text-muted)" }}>Loading doctors...</p></div>
          ) : doctors.length === 0 ? (
            <div className="section-card">
              <EmptyState title="No doctors found" description="Try changing the filters and search again." />
            </div>
          ) : (
            <div className="grid-appointments">
              {doctors.map((doctor) => {
                const locations = getLocations(doctor);
                return (
                  <div key={doctor.id} className="appointment-card">
                    <div className="appointment-card-header">
                      <div>
                        <h3 className="appointment-card-title">Dr. {doctor.name}</h3>
                        <p className="appointment-card-subtitle">
                          {doctor.profile?.specialization || "Specialist"} • {locations.length} location{locations.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="meta-grid">
                      <div className="meta-item">
                        <div className="meta-label">Experience</div>
                        <div className="meta-value">{doctor.profile?.yearsOfExperience || 0} years</div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-label">In-person Fee</div>
                        <div className="meta-value">LKR {Number(doctor.profile?.consultationFee || 0)}</div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-label">Video Fee</div>
                        <div className="meta-value">LKR {Number(doctor.profile?.videoConsultationFee || 0)}</div>
                      </div>
                      <div className="meta-item">
                        <div className="meta-label">Phone</div>
                        <div className="meta-value">{doctor.phone || "—"}</div>
                      </div>
                    </div>

                  <div className="soft-panel">
  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
    <strong>Qualifications:</strong> {doctor.profile?.qualifications || "—"}
  </div>

  {/* 🔥 NEW: LOCATION + SLOTS */}
  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
    <strong>Availability:</strong>

    {locations.length === 0 ? (
      <div style={{ marginTop: "0.3rem" }}>No locations added</div>
    ) : (
      <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {locations.map((location) => {
          const locationId = location._id || location.id;

          const locationSlots =
            doctor.profile?.availability?.filter(
              (slot) => slot.locationId === locationId
            ) || [];

          return (
            <div
              key={locationId}
              style={{
                background: "#f9fafb",
                borderRadius: "8px",
                padding: "0.5rem 0.7rem",
                border: "1px solid #e5e7eb",
              }}
            >
              {/* Location Name */}
              <div style={{ fontWeight: 600, color: "var(--brand-700)" }}>
                {location.name}
              </div>

              {/* Slots */}
              {locationSlots.length === 0 ? (
                <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                  No availability
                </div>
              ) : (
                <div style={{ marginTop: "0.3rem", fontSize: "0.75rem" }}>
                  {locationSlots.map((slot, i) => (
                    <div key={i}>
                      {slot.day}: {slot.startTime} – {slot.endTime}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
  </div>
</div>

                    {!!doctor.profile?.bio && (
                      <p style={{ marginTop: "0.85rem", fontSize: "0.84rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                        {doctor.profile.bio}
                      </p>
                    )}

                    <div className="actions-row" style={{ marginTop: "1rem" }}>
                      <button className="btn-primary" onClick={() => openBooking(doctor)}>Book Appointment</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showLoginPopup && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontFamily: "var(--font-display)", color: "var(--brand-800)" }}>Login Required</h3>
            <p style={{ marginTop: "0.5rem", color: "var(--text-secondary)" }}>
              Please log in as a patient to book an appointment.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
              <button className="btn-primary" onClick={() => navigate("/login")}>Go to Login</button>
              <button className="btn-secondary" onClick={() => setShowLoginPopup(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDirectory;
