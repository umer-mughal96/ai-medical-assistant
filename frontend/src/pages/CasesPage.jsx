 
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";

function CaseRow({ caseData, patientId, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(caseData.title);
  const [editStatus, setEditStatus] = useState(caseData.status || "open");

  const handleSave = () => {
    onUpdate(caseData.id, editTitle, editStatus);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(caseData.title);
    setEditStatus(caseData.status || "open");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <tr>
        <td>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={{ width: "100%", padding: "4px" }}
          />
        </td>
        <td>
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            style={{ width: "100%", padding: "4px" }}
          >
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </td>
        <td>
          {caseData.treatmentPlan ? (
            <span style={{ fontStyle: "italic" }}>Saved</span>
          ) : (
            <span style={{ color: "#9ca3af" }}>Not generated</span>
          )}
        </td>
        <td>
          <div className="table-actions">
            <button type="button" onClick={handleSave} style={{ marginRight: "4px" }}>
              Save
            </button>
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{caseData.title}</td>
      <td>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: "4px",
            fontSize: "0.85rem",
            backgroundColor: caseData.status === "closed" ? "#d1d5db" : "#dbeafe",
            color: caseData.status === "closed" ? "#374151" : "#1e40af",
          }}
        >
          {caseData.status || "open"}
        </span>
      </td>
      <td>
        {caseData.treatmentPlan ? (
          <span style={{ fontStyle: "italic" }}>Saved</span>
        ) : (
          <span style={{ color: "#9ca3af" }}>Not generated</span>
        )}
      </td>
      <td>
        <div className="table-actions">
          <Link
            to={`/cases/${caseData.id}/chat`}
            state={{ caseData: caseData, patientId: patientId }}
          >
            Open Chat
          </Link>
          <button type="button" onClick={() => setIsEditing(true)}>
            Edit
          </button>
          <button type="button" onClick={() => onDelete(caseData.id)}>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function CasesPage() {
  const { patientId } = useParams();
  const [cases, setCases] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [patient, setPatient] = useState(null);

  const loadCases = async () => {
    if (!patientId) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/cases/${patientId}`);
      setCases(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load cases");
    } finally {
      setLoading(false);
    }
  };

  const loadPatient = async () => {
    try {
      const res = await api.get("/patients");
      const p = res.data.find((pt) => pt.id === Number(patientId));
      setPatient(p || null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCases();
    loadPatient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/cases/${patientId}`, { title });
      setTitle("");
      loadCases();
    } catch (err) {
      console.error(err);
      setError("Failed to create case");
    }
  };

  const handleDelete = async (caseId) => {
    if (!window.confirm("Delete this case? This will also delete all associated messages and treatment plans.")) return;
    try {
      await api.delete(`/cases/${caseId}`);
      loadCases();
    } catch (err) {
      console.error(err);
      setError("Failed to delete case");
    }
  };

  const handleUpdate = async (caseId, newTitle, newStatus) => {
    try {
      await api.patch(`/cases/${caseId}`, {
        title: newTitle,
        status: newStatus,
      });
      loadCases();
    } catch (err) {
      console.error(err);
      setError("Failed to update case");
    }
  };

  return (
    <div className="page-card">
      <h2 style={{ marginTop: 0, marginBottom: "0.35rem" }}>Cases</h2>
      {patient && (
        <p
          style={{
            marginTop: 0,
            marginBottom: "0.75rem",
            fontSize: "0.9rem",
            color: "#4b5563",
          }}
        >
          Patient: <strong>{patient.name}</strong>{" "}
          {patient.age != null && <>| Age: {patient.age} </>}
          {patient.gender && <>| Gender: {patient.gender}</>}
        </p>
      )}
      <p style={{ marginTop: 0, marginBottom: "1.25rem", color: "#6b7280", fontSize: "0.9rem" }}>
        Create and review cases for this patient. Each case can have an AI-generated treatment plan.
      </p>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleCreate} style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Create Case</h3>
        <div className="form-group">
          <label htmlFor="case-title">Title</label>
          <input
            id="case-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <button type="submit">
          Add Case
        </button>
      </form>

      <h3 style={{ marginTop: 0 }}>Case List</h3>
      {loading && <p>Loading...</p>}
      {!loading && cases.length === 0 && <p>No cases yet.</p>}

      {cases.length > 0 && (
        <>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Treatment Plan</th>
                  <th style={{ width: "280px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <CaseRow
                    key={c.id}
                    caseData={c}
                    patientId={patientId}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination-row">
            Page 1 • Pagination controls can be added here later.
          </div>
        </>
      )}

      <div style={{ marginTop: "1.25rem" }}>
        <Link to="/patients">Back to Patients</Link>
      </div>
    </div>
  );
}
