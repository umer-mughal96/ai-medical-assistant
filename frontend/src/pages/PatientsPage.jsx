 
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ name: "", age: "", gender: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPatients = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/patients");
      setPatients(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/patients", {
        name: form.name,
        age: form.age ? Number(form.age) : null,
        gender: form.gender,
      });
      setForm({ name: "", age: "", gender: "" });
      loadPatients();
    } catch (err) {
      console.error(err);
      setError("Failed to create patient");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this patient?")) return;
    try {
      await api.delete(`/patients/${id}`);
      loadPatients();
    } catch (err) {
      console.error(err);
      setError("Failed to delete patient");
    }
  };

  return (
    <div className="page-card">
      <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Patients</h2>
      <p style={{ marginTop: 0, marginBottom: "1.25rem", color: "#6b7280", fontSize: "0.9rem" }}>
        Manage your patients. This view is structured to support tables and pagination.
      </p>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleCreate} style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Create Patient</h3>
        <div className="form-group">
          <label htmlFor="patient-name">Name</label>
          <input
            id="patient-name"
            name="name"
            value={form.name}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="patient-age">Age</label>
          <input
            id="patient-age"
            name="age"
            type="number"
            value={form.age}
            onChange={onChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="patient-gender">Gender</label>
          <select
            id="patient-gender"
            name="gender"
            value={form.gender}
            onChange={onChange}
          >
            <option value="">Select gender (optional)</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
        <button type="submit">
          Add Patient
        </button>
      </form>

      <h3 style={{ marginTop: 0 }}>Patient List</h3>
      {loading && <p>Loading...</p>}
      {!loading && patients.length === 0 && <p>No patients yet.</p>}

      {patients.length > 0 && (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th style={{ width: "220px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.age ?? "N/A"}</td>
                    <td>{p.gender ?? "N/A"}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/patients/${p.id}/cases`}>
                          View Cases
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-row">
            Page 1 • Pagination controls can be added here later.
          </div>
        </>
      )}
    </div>
  );
}
