import { Routes, Route, Router, BrowserRouter } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import ActivityLog from './ActivityLog';

export default function App() {
    return (
      <BrowserRouter>
        <div>
          <h1>Workers Attendance</h1>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/activity-log" element={<ActivityLog />} />
          </Routes>
        </div>
      </BrowserRouter>
    );
  }