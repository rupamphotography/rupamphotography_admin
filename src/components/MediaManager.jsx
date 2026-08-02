import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, ExternalLink, RefreshCw, AlertTriangle, X, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = ['all', 'wedding', 'bridal', 'fashion', 'portrait', 'nature', 'street'];

const MediaManager = ({ cloudName }) => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: '' }
  const [deleteConfirm, setDeleteConfirm] = useState(null); // public_id of image to delete
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchImages = useCallback(async () => {
    if (!cloudName) return;
    setIsLoading(true);
    try {
      let tagToFetch = activeCategory === 'all' ? 'portfolio' : activeCategory;
      const res = await fetch(`/api/get-images?category=${tagToFetch}`);
      if (!res.ok) {
        throw new Error('Failed to fetch images');
      }
      const data = await res.json();
      setImages(data.resources || []);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to fetch media list.');
    } finally {
      setIsLoading(false);
    }
  }, [cloudName, activeCategory]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleDelete = async (publicId) => {
    try {
      setIsDeleting(true);
      const idToken = user.token;
      
      const res = await fetch('/api/delete-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ publicId })
      });

      if (!res.ok) {
        throw new Error('Deletion failed');
      }
      
      // Update local state without fetching again
      setImages(prev => prev.filter(img => img.public_id !== publicId));
      window.dispatchEvent(new Event('mediaUpdated'));
      showToast('success', 'Image deleted successfully');
    } catch (err) {
      console.error(err);
      showToast('error', 'Delete failed: Network or server error.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="bg-zinc-950 min-h-screen pb-12">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat 
                  ? 'bg-zinc-100 text-zinc-900' 
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        
        <button 
          onClick={fetchImages}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Sync
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <p className="text-zinc-500">No assets found in this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.public_id} className="group relative aspect-[4/5] bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
              <img 
                src={`https://res.cloudinary.com/${cloudName}/image/upload/c_fill,w_400,h_500,q_auto/${img.public_id}.${img.format}`}
                alt={img.public_id}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-zinc-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-zinc-200 text-xs font-mono truncate">{img.public_id}</p>
                  <p className="text-zinc-400 text-xs mt-1">{img.width} × {img.height}</p>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <a 
                    href={`https://res.cloudinary.com/${cloudName}/image/upload/${img.public_id}.${img.format}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  
                  <button
                    onClick={() => setDeleteConfirm(img.public_id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Delete Confirmation Modal */}
              {deleteConfirm === img.public_id && (
                <div className="absolute inset-0 bg-zinc-950/95 p-4 flex flex-col justify-center items-center text-center z-10 backdrop-blur-sm">
                  <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
                  <p className="text-zinc-200 text-sm font-medium mb-4">Permanently remove from public portfolio?</p>
                  <div className="flex gap-2 w-full">
                    <button 
                      onClick={() => setDeleteConfirm(null)}
                      disabled={isDeleting}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleDelete(img.public_id)}
                      disabled={isDeleting}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-2 rounded-lg font-medium"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-sm z-50 border backdrop-blur-xl ${
          toast.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200' 
            : 'bg-red-950/80 border-red-500/30 text-red-200'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
          )}
          <p className="text-sm font-medium">{toast.message}</p>
          <button onClick={() => setToast(null)} className="ml-auto opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaManager;
