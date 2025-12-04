import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  // If already authenticated, do not show login/register again
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/patients", { replace: true });
    }
  }, [navigate]);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegister) {
        await api.post("/auth/register", {
          name: form.name,
          email: form.email,
          password: form.password,
        });
      }

      const res = await api.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/patients");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">
          {isRegister ? "Register as Doctor" : "Doctor Login"}
        </h2>
        <p className="auth-subtitle">
          {isRegister
            ? "Create your account to manage patients and AI-assisted cases."
            : "Sign in to access your patients, cases, and AI diagnosis chat."}
        </p>
        {error && <p style={{ color: "red", marginBottom: "0.75rem" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              required
            />
          </div>

          <button type="submit" style={{ width: "100%", marginTop: "0.25rem" }}>
            {isRegister ? "Register & Login" : "Login"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsRegister((r) => !r)}
          style={{
            width: "100%",
            marginTop: "0.75rem",
            backgroundColor: "#e5e7eb",
            color: "#111827",
          }}
        >
          {isRegister
            ? "Already have an account? Login"
            : "No account? Register"}
        </button>
      </div>
    </div>
  );
}

 

