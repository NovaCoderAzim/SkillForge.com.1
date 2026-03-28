import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AdminLogin from "./AdminLogin";
import Login from "./Login";
import LandingPage from "./LandingPage";
import DashboardLayout from "./DashboardLayout";
import CreateCourse from "./CreateCourse";
import CourseBuilder from "./CourseBuilder";
import AssignmentManager from "./AssignmentManager";
import StudentDashboard from "./StudentDashboard";
import CoursePlayer from "./CoursePlayer";
import AddAdmits from "./AddAdmits";
import CoursePreview from "./CoursePreview";
import CodeArena from "./CodeArena";
import Dashboard from "./Dashboard";
import InstructorSettings from "./InstructorSettings";
import StudentManagement from "./StudentManagement";
import CourseList from "./CourseList";
import MeetingManager from "./MeetingManager";

// CourseList is now imported from ./CourseList

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        <Route path="/dashboard" element={<ProtectedRoute requiredRole="instructor"><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="create-course" element={<CreateCourse />} />
          <Route path="course/:courseId/builder" element={<CourseBuilder />} />
          <Route path="assignments" element={<AssignmentManager />} />
          <Route path="meetings" element={<MeetingManager />} />
          <Route path="add-admits" element={<AddAdmits />} />
          <Route path="course/:courseId/preview" element={<CoursePreview />} />
          <Route path="code-arena" element={<CodeArena />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="settings" element={<InstructorSettings />} />
        </Route>

        <Route path="/student-dashboard" element={<ProtectedRoute requiredRole="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="/course/:courseId/player" element={<ProtectedRoute requiredRole="student"><CoursePlayer /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

const ProtectedRoute = ({ children, requiredRole }: { children: any, requiredRole?: string }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  if (!token) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) { return role === "instructor" ? <Navigate to="/dashboard" /> : <Navigate to="/student-dashboard" />; }
  return children;
};

export default App;