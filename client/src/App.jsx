import { useEffect, useMemo, useState } from "react";
import {
  analyzePost,
  generatePost,
  improvePost,
  loginUser,
  registerUser,
  getStoredUser,
  logoutUser
} from "./api";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ email: "", password: "" });

  const [language, setLanguage] = useState("he");
  const [tab, setTab] = useState("build");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isHebrew = language === "he";

  const t = useMemo(() => ({
    login: isHebrew ? "התחברות" : "Login",
    register: isHebrew ? "הרשמה" : "Register",
    email: isHebrew ? "אימייל" : "Email",
    password: isHebrew ? "סיסמה" : "Password",
    logout: isHebrew ? "התנתק" : "Logout",

    build: isHebrew ? "יצירה" : "Build",
    improve: isHebrew ? "שיפור" : "Improve",
    analyze: isHebrew ? "ניתוח" : "Analyze",

    generate: isHebrew ? "צור פוסט" : "Generate",
    improveBtn: isHebrew ? "שפר" : "Improve",
    analyzeBtn: isHebrew ? "נתח" : "Analyze",

    topic: isHebrew ? "נושא" : "Topic",
    post: isHebrew ? "פוסט" : "Post"
  }), [isHebrew]);

  /* ================= AUTH ================= */

  async function handleAuth() {
    try {
      const fn = isLogin ? loginUser : registerUser;
      const res = await fn(authForm);
      setUser(res.user);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    logoutUser();
    setUser(null);
  }

  /* ================= BUILD ================= */

  const [topic, setTopic] = useState("");

  async function handleBuild() {
    setLoading(true);
    try {
      const res = await generatePost({ topic, language });
      setResult(res.data);
    } catch (e) {
      setError("Error");
    } finally {
      setLoading(false);
    }
  }

  /* ================= UI ================= */

  if (!user) {
    return (
      <div className="auth-screen">
        <h2>{isLogin ? t.login : t.register}</h2>

        <input
          placeholder={t.email}
          onChange={(e) =>
            setAuthForm((p) => ({ ...p, email: e.target.value }))
          }
        />

        <input
          type="password"
          placeholder={t.password}
          onChange={(e) =>
            setAuthForm((p) => ({ ...p, password: e.target.value }))
          }
        />

        <button onClick={handleAuth}>
          {isLogin ? t.login : t.register}
        </button>

        <p onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "אין חשבון? הירשם" : "יש חשבון? התחבר"}
        </p>

        {error && <div>{error}</div>}
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>PostPulse</h1>

        <button onClick={() => setLanguage(language === "he" ? "en" : "he")}>
          🌐
        </button>

        <button onClick={handleLogout}>{t.logout}</button>
      </header>

      <div>
        <button onClick={() => setTab("build")}>{t.build}</button>
        <button onClick={() => setTab("improve")}>{t.improve}</button>
        <button onClick={() => setTab("analyze")}>{t.analyze}</button>
      </div>

      {tab === "build" && (
        <>
          <input
            placeholder={t.topic}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <button onClick={handleBuild}>{t.generate}</button>
        </>
      )}

      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
