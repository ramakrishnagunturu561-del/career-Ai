import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import CareerRoadmap from "./pages/CareerRoadmap";
import Jobs from "./pages/Jobs";
import Internships from "./pages/Internships";
import Applications from "./pages/Applications";
import AIInterview from "./pages/AIInterview";

import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />

        <main className="main">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
            <Route path="/roadmap" element={<CareerRoadmap />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/ai-interview" element={<AIInterview />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;