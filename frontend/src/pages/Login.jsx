import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DataContext } from "../context/DataProvider";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const { setUser } = useContext(DataContext);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        setUser(username);
        localStorage.setItem("token", data.data);
        localStorage.setItem("username", username);
        navigate("/");
      } else {
        const errorText = await res.text();
        setError(errorText || "Login failed");
      }
    } catch (error) {
      console.log(error);
      setError("Unable to connect to login server");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4 text-slate-100">
      <div className="w-full max-w-md bg-slate-900/50 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-md flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/25">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">CodeMeet</h1>
        </div>

        <h2 className="text-xl font-semibold text-slate-200 mb-6 uppercase tracking-wider text-center">Welcome Back</h2>
        
        {error && (
          <div className="w-full bg-rose-950/40 border border-rose-900/50 text-rose-300 px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider mb-4 text-center">
            {error}
          </div>
        )}

        <div className="w-full space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/60 focus:border-blue-500 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/60 focus:border-blue-500 rounded-xl pl-4 pr-12 py-3 text-slate-100 placeholder-slate-600 text-sm outline-none focus:ring-1 focus:ring-blue-500 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-all p-1"
              >
                {showPassword ? <FaEyeSlash className="h-4.5 w-4.5" /> : <FaEye className="h-4.5 w-4.5" />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all text-sm mt-6"
          >
            Login to Account
          </button>

          <p className="text-sm text-slate-400 font-light text-center mt-6">
            New User?{" "}
            <Link className="text-blue-400 font-semibold hover:underline" to="/signup">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
