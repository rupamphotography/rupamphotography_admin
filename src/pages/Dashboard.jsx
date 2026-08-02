import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import SmartUploader from '../components/SmartUploader';
import MediaManager from '../components/MediaManager';
import { Camera } from 'lucide-react';

const Dashboard = () => {
  const { logout, user } = useAuth();
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
  const isCloudinaryConfigured = cloudName !== 'demo' && Boolean(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Camera className="w-4 h-4 text-emerald-500" />
            </div>
            <h1 className="text-sm font-semibold tracking-widest text-zinc-300">
              STUDIO WORKSPACE <span className="text-zinc-600 mx-2">//</span> ADMIN
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isCloudinaryConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-xs text-zinc-400 font-medium">
                {isCloudinaryConfigured ? 'Cloudinary Connected' : 'Cloudinary Disconnected'}
              </span>
            </div>
            
            <div className="flex items-center gap-3 pl-6 border-l border-zinc-800">
              <span className="text-sm text-zinc-400 hidden md:block">{user?.email}</span>
              <button 
                onClick={logout}
                className="text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg border border-zinc-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 flex flex-col gap-8">
        
        {/* Upper Zone: Action Hub */}
        <section>
          <SmartUploader onUploadSuccess={handleUploadSuccess} />
        </section>
        
        {/* Lower Zone: Live Asset Management */}
        <section className="flex-1">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-zinc-100">Live Portfolio Assets</h2>
            <p className="text-sm text-zinc-500">Manage photos currently visible on the public site.</p>
          </div>
          
          <MediaManager key={refreshKey} cloudName={cloudName} />
        </section>

      </main>
    </div>
  );
};

export default Dashboard;
