import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Dashboard } from '../dashboard/Dashboard';
import { ScreenshotUpload } from '../scanner/ScreenshotUpload';
import { WebsiteScanner } from '../scanner/WebsiteScanner';
import { History } from '../history/History';
import { Profile } from '../profile/Profile';
import { Documentation } from '../docs/Documentation';
import { Contact } from '../contact/Contact';
import { AdminDashboard } from '../admin/AdminDashboard';
import { DetectionResult } from '../results/DetectionResult';

export function MainApp() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
        <Routes>
          <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<ScreenshotUpload />} />
          <Route path="/website" element={<WebsiteScanner />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/docs" element={<Documentation />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/results/:scanId" element={<DetectionResult />} />
        </Routes>
      </main>
    </div>
  );
}
