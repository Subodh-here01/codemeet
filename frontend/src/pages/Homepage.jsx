import React from "react";
import { useContext } from "react";
import { DataContext } from "../context/DataProvider";
import heroGif from "../assets/job-interview.gif";
import textEditorImg from "../assets/Text Editor.png";
import codeEditorImg from "../assets/code editor.png";
import { useNavigate } from "react-router-dom";
import { FaLinkedin } from "react-icons/fa";
import { FaSquareGithub } from "react-icons/fa6";
import InputModal from "../components/InputModal";
import PopupModal from "../components/PopupModal";

function Homepage() {
  const { setUser, user } = useContext(DataContext);

  const navigate = useNavigate();

  const handleLogout = async () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      console.log(data);
    } catch (error) {
      console.log("Logout backend call failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <nav className="flex px-12 py-5 justify-between items-center bg-slate-950/50 border-b border-slate-850 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src="/codemeet_logo.svg" alt="CodeMeet Logo" className="h-8 w-8 rounded-lg shadow-sm object-contain" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">codemeet</span>
        </div>

        <div className="flex items-center gap-8">
          <a href="#features" className="text-sm font-semibold text-slate-400 hover:text-white transition-all uppercase tracking-wider">Features</a>
          <a href="#how-it-works" className="text-sm font-semibold text-slate-400 hover:text-white transition-all uppercase tracking-wider">How it works</a>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 font-semibold bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">Logged in as {user}</span>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900/50 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-900/50 px-4 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/login")}
                className="text-xs font-bold text-slate-300 hover:text-white px-4 py-2.5 rounded-xl transition-all"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 transition-all active:scale-95"
              >
                Signup
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row max-w-7xl mx-auto px-12 py-20 lg:py-28 justify-between items-center gap-16 w-full">
        <div className="lg:w-1/2 flex flex-col justify-center gap-6">
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
            Ace Your Interviews <br />
            <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">With Confidence</span>
          </h1>
          <p className="text-lg text-slate-400 font-medium leading-relaxed">
            Collaborate in real-time, share audio/video streams, type in shared notes, and run code instantly in an environment designed for technical interviews.
          </p>
          {user ? (
            <div className="flex flex-wrap gap-4 mt-4">
              <PopupModal />
              <InputModal />
            </div>
          ) : (
            <div className="flex gap-4 mt-4">
              <button
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-blue-500/10 transition-all active:scale-95 text-sm"
                onClick={() => navigate("/login")}
              >
                Start an Interview
              </button>
              <button
                className="bg-transparent hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 font-semibold px-6 py-3 rounded-xl transition-all active:scale-95 text-sm"
                onClick={() => navigate("/signup")}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
        <div className="lg:w-5/12 flex justify-center">
          <div className="relative p-2 bg-gradient-to-tr from-slate-800/80 to-slate-900/80 border border-slate-850 rounded-3xl shadow-2xl shadow-blue-500/5 max-w-sm lg:max-w-md overflow-hidden">
            <img src={heroGif} alt="Interview Collaboration" className="rounded-2xl opacity-90 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-12 py-20 w-full border-t border-slate-900">
        <div className="text-center mb-20">
          <h2 className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-3">Capabilities</h2>
          <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Powerful Collaboration Features</p>
        </div>

        <div className="space-y-24">
          {/* Feature 1 */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
            <div className="lg:w-1/2 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Audio & Video Calls</h3>
              <p className="text-slate-400 leading-relaxed">
                Connect face-to-face with candidates or peers in real-time. Built-in high-quality peer-to-peer webRTC technology ensures seamless connection with zero latency.
              </p>
            </div>
            <div className="lg:w-5/12 bg-slate-900/50 border border-slate-800/80 p-2.5 rounded-2xl shadow-xl overflow-hidden">
              <img
                src="https://miro.medium.com/v2/resize:fit:828/format:webp/1*NLSe2SyjfxdbEqFsOWHhlg.png"
                className="w-full rounded-xl opacity-85 hover:opacity-100 transition-opacity"
                alt="Audio & Video Calls"
              />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col lg:flex-row-reverse items-center justify-between gap-12 lg:gap-20">
            <div className="lg:w-1/2 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Collaborative Code Editor</h3>
              <p className="text-slate-400 leading-relaxed">
                Write, review, and debug code collaboratively using our high-fidelity, synchronized editor. Features real-time typing indicators, multi-language support, and console output logs.
              </p>
            </div>
            <div className="lg:w-5/12 bg-slate-900/50 border border-slate-800/80 p-2.5 rounded-2xl shadow-xl overflow-hidden">
              <img
                src={codeEditorImg}
                className="w-full rounded-xl opacity-85 hover:opacity-100 transition-opacity"
                alt="Code Editor"
              />
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
            <div className="lg:w-1/2 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Shared Rich-Text Notepad</h3>
              <p className="text-slate-400 leading-relaxed">
                Take organized notes, write down problem definitions, and plan algorithms collaboratively with your interviewer or interviewee in a real-time Rich Text editor.
              </p>
            </div>
            <div className="lg:w-5/12 bg-slate-900/50 border border-slate-800/80 p-2.5 rounded-2xl shadow-xl overflow-hidden">
              <img
                src={textEditorImg}
                className="w-full rounded-xl opacity-85 hover:opacity-100 transition-opacity"
                alt="Rich Text Notepad"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-12 py-20 w-full border-t border-slate-900 bg-slate-950/20">
        <div className="text-center mb-16">
          <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">Workflow</h2>
          <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">How CodeMeet Works</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/30 border border-slate-850 p-8 rounded-2xl relative shadow-md">
            <div className="text-5xl font-extrabold text-blue-500/20 absolute top-4 right-6">01</div>
            <h3 className="text-lg font-bold text-white mb-3 mt-4">Create Account</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Register quickly with your email and username to set up your profile for interviewing.
            </p>
          </div>
          <div className="bg-slate-900/30 border border-slate-850 p-8 rounded-2xl relative shadow-md">
            <div className="text-5xl font-extrabold text-indigo-500/20 absolute top-4 right-6">02</div>
            <h3 className="text-lg font-bold text-white mb-3 mt-4">Start or Join Room</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Generate a unique Room ID to start an interview session, or paste an existing ID to join as a candidate.
            </p>
          </div>
          <div className="bg-slate-900/30 border border-slate-850 p-8 rounded-2xl relative shadow-md">
            <div className="text-5xl font-extrabold text-emerald-500/20 absolute top-4 right-6">03</div>
            <h3 className="text-lg font-bold text-white mb-3 mt-4">Practice & Collaborate</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Code side-by-side, talk over crystal clear video/audio, and collaborate on a shared notepad instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-16 px-12 text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-10">
          <div className="w-full sm:w-1/4 mb-6 sm:mb-0 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/codemeet_logo.svg" alt="CodeMeet Logo" className="h-6 w-6 rounded-md shadow-sm object-contain" />
              <span className="text-base font-bold text-white tracking-wider">codemeet</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ace your developer technical interviews with real-time editing, note-taking, and calling capabilities.
            </p>
            <p className="text-xs text-slate-500 pt-2">
              &copy; 2026 codemeet. All rights reserved.
            </p>
          </div>

          <div className="w-full sm:w-1/5 mb-6 sm:mb-0 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#terms" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
              <li><a href="#contact" className="hover:text-blue-400 transition-colors">Contact Support</a></li>
            </ul>
          </div>

          <div className="w-full sm:w-1/5 mb-6 sm:mb-0 space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">Connect</h3>
            <div className="flex space-x-3 text-2xl">
              <a
                href="https://www.linkedin.com/in/subodh2106/"
                className="hover:text-blue-400 hover:scale-110 transition-all"
                target="_blank"
                rel="noreferrer"
              >
                <FaLinkedin />
              </a>
              <a
                href="https://github.com/Subodh-here01"
                className="hover:text-white hover:scale-110 transition-all"
                target="_blank"
                rel="noreferrer"
              >
                <FaSquareGithub />
              </a>
            </div>
          </div>

          <div className="w-full sm:w-1/4 space-y-3 text-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">Contact</h3>
            <p>Email: userisanalienhunter@gmail.com</p>
            <p>Phone: +123 456 7890</p>
            <p>Address: 123 Main Street, Bengaluru, India</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Homepage;
