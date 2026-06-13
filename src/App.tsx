import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Editor from "@/pages/Editor";
import Header from "@/components/Header";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import ErrorToast from "@/components/ErrorToast";

export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center text-center pt-16">
              <div>
                <h1 className="text-6xl font-bold font-display text-accent-primary mb-4">404</h1>
                <p className="text-text-secondary text-lg">页面不存在</p>
              </div>
            </div>
          }
        />
      </Routes>
      <ProcessingOverlay />
      <ErrorToast />
    </Router>
  );
}
