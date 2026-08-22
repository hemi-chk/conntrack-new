import { useState } from "react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const externalRedirectMap = {
    operations: import.meta.env.VITE_OPERATIONS_URL || "http://127.0.0.1:5174",
    supplier: import.meta.env.VITE_SUPPLIER_URL || "http://127.0.0.1:5175",
    logistics: import.meta.env.VITE_LOGISTICS_URL || "http://127.0.0.1:5176",
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Invalid credentials")
        setLoading(false)
        return
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("refresh_token", data.refresh_token || '')
      localStorage.setItem("role", data.role)
      localStorage.setItem("user", JSON.stringify(data.user))

      if (data.role === "admin") {
        window.location.href = "/"
      } else if (externalRedirectMap[data.role]) {
        const redirectUrl = new URL(externalRedirectMap[data.role])
        redirectUrl.searchParams.set("token", data.token)
        redirectUrl.searchParams.set("role", data.role)
        redirectUrl.searchParams.set("user", JSON.stringify(data.user))
        window.location.href = redirectUrl.toString()
      } else {
        setError("Unknown role. Contact your administrator.")
      }
    } catch (err) {
      setError("Server error. Please try again.")
    }

    setLoading(false)
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;600;700&display=swap');
        .login-page * { box-sizing: border-box; }
        .login-input:focus {
          border-color: #1E40AF !important;
          box-shadow: 0 0 0 3px rgba(30,64,175,0.1);
          outline: none;
        }
        .submit-btn:hover:not(:disabled) { background: #1e3a8a !important; }
        .submit-btn:disabled { cursor: not-allowed; }
      `}</style>

      <div className="login-page" style={styles.page}>
        <div style={styles.card}>

          {/* Left Panel */}
          <div style={styles.left}>
            <img src="/logistics-bg.jpg" alt="" style={styles.bgImage} />
            <div style={styles.overlay} />
            <div style={styles.leftInner}>
              <div style={styles.logoRow}>
                <div style={styles.logoBox}>C</div>
                <span style={styles.logoText}>ConTrack</span>
              </div>
              <h1 style={styles.welcomeTitle}>WELCOME<br />BACK</h1>
              <p style={styles.welcomeSub}>
                Container Transport Management System for ports, freezones, and BOI operations.
              </p>
              <div style={styles.badge}>
                <span style={styles.badgeDot} />
                System Online
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div style={styles.right}>
            <div style={styles.formWrapper}>
              <h2 style={styles.signInTitle}>Sign In</h2>
              <p style={styles.signInSub}>Use your company credentials to access the system</p>

              <form onSubmit={handleLogin} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Email Address</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>📧</span>
                    <input
                      className="login-input"
                      type="email"
                      placeholder="you@contrack.lk"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Password</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>🔒</span>
                    <input
                      className="login-input"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ ...styles.input, paddingRight: "60px" }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.showBtn}>
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div style={styles.errorBox}>
                    <span style={{ marginRight: "6px" }}>⚠</span>
                    {error}
                  </div>
                )}

                <button type="submit" className="submit-btn" disabled={loading} style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>

                <p style={styles.helpText}>Forgot your credentials? Contact your system administrator.</p>
              </form>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#DBEAFE",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  card: {
    display: "flex",
    width: "100%",
    maxWidth: "900px",
    minHeight: "520px",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 20px 60px rgba(30,64,175,0.2)",
  },
  left: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    minHeight: "520px",
  },
  bgImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, rgba(10,20,80,0.92) 0%, rgba(10,20,80,0.5) 50%, rgba(10,20,80,0.2) 100%)",
    zIndex: 1,
  },
  leftInner: {
    position: "relative",
    zIndex: 2,
    padding: "40px",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "32px",
  },
  logoBox: {
    width: "36px",
    height: "36px",
    background: "white",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "18px",
    color: "#1E40AF",
    fontFamily: "'Barlow', sans-serif",
  },
  logoText: {
    color: "white",
    fontSize: "20px",
    fontWeight: "700",
    fontFamily: "'Barlow', sans-serif",
  },
  welcomeTitle: {
    color: "white",
    fontSize: "52px",
    fontWeight: "400",
    margin: "0 0 12px",
    lineHeight: 1.0,
    fontFamily: "'Bebas Neue', sans-serif",
    letterSpacing: "2px",
  },
  welcomeSub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "13px",
    lineHeight: 1.6,
    margin: "0 0 20px",
    maxWidth: "260px",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: "300",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "20px",
    padding: "5px 12px",
    color: "white",
    fontSize: "12px",
    fontFamily: "'Barlow', sans-serif",
    fontWeight: "600",
  },
  badgeDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#4ADE80",
    display: "inline-block",
  },
  right: {
    flex: 1,
    background: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "48px 40px",
  },
  formWrapper: {
    width: "100%",
    maxWidth: "340px",
    fontFamily: "'Barlow', sans-serif",
  },
  signInTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 6px",
    fontFamily: "'Barlow', sans-serif",
  },
  signInSub: {
    fontSize: "13px",
    color: "#6B7280",
    margin: "0 0 32px",
    lineHeight: 1.5,
    fontFamily: "'Barlow', sans-serif",
  },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151", fontFamily: "'Barlow', sans-serif" },
  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "12px", fontSize: "14px", color: "#9CA3AF", pointerEvents: "none" },
  input: {
    width: "100%",
    padding: "11px 12px 11px 36px",
    border: "1.5px solid #E5E7EB",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#111827",
    transition: "border-color 0.2s",
    fontFamily: "'Barlow', sans-serif",
  },
  showBtn: {
    position: "absolute",
    right: "12px",
    background: "none",
    border: "none",
    color: "#1E40AF",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    padding: "0",
    fontFamily: "'Barlow', sans-serif",
  },
  errorBox: {
    background: "#FEF2F2",
    border: "1px solid #FECACA",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "#DC2626",
    display: "flex",
    alignItems: "center",
    fontFamily: "'Barlow', sans-serif",
  },
  submitBtn: {
    background: "#1E40AF",
    color: "white",
    border: "none",
    borderRadius: "10px",
    padding: "13px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
    marginTop: "4px",
    fontFamily: "'Barlow', sans-serif",
  },
  helpText: {
    fontSize: "12px",
    color: "#9CA3AF",
    textAlign: "center",
    margin: "0",
    lineHeight: 1.5,
    fontFamily: "'Barlow', sans-serif",
  },
}