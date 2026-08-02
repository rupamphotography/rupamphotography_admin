import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UploadCloud, CheckCircle, XCircle, FileImage, Loader } from 'lucide-react';
import { compressImage } from '../utils/compressImage';
import { useAuth } from '../hooks/useAuth';

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
const CATEGORIES = ['wedding', 'bridal', 'fashion', 'portrait', 'nature', 'street'];

const SmartUploader = ({ onUploadSuccess }) => {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [isDragging, setIsDragging] = useState(false);
  
  // Upload states: idle, compressing, signing, uploading, success, error
  const [uploadState, setUploadState] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Limit tracking
  const [categoryStats, setCategoryStats] = useState({ count: 0, limit: 10, loading: true });
  
  const fileInputRef = useRef(null);

  const fetchCategoryStats = useCallback(async (force = false) => {
    const cacheKey = `cloudinary_stats_${category}`;
    
    if (!force) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setCategoryStats(JSON.parse(cached));
        return;
      }
    }

    setCategoryStats(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch(`/api/get-counts?category=${category}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const newStats = { count: data.count, limit: data.limit, loading: false };
        setCategoryStats(newStats);
        sessionStorage.setItem(cacheKey, JSON.stringify(newStats));
      }
    } catch (err) {
      console.error("Failed to fetch category limits", err);
      setCategoryStats(prev => ({ ...prev, loading: false }));
    }
  }, [category]);

  // Initial fetch and cross-component updates
  useEffect(() => {
    if (uploadState === 'idle') {
      fetchCategoryStats();
    }
    
    const handleUpdate = () => fetchCategoryStats(true); // force refresh on change
    window.addEventListener('mediaUpdated', handleUpdate);
    return () => window.removeEventListener('mediaUpdated', handleUpdate);
  }, [fetchCategoryStats, uploadState]);

  // Prevent accidental close during active upload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (uploadState === 'compressing' || uploadState === 'signing' || uploadState === 'uploading') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [uploadState]);

  const validateAndSetFile = (selectedFile) => {
    setErrorMsg('');
    if (!selectedFile) return;
    
    if (categoryStats.count >= categoryStats.limit) {
      setErrorMsg(`Limit reached for ${category.charAt(0).toUpperCase() + category.slice(1)}. Max ${categoryStats.limit} images allowed.`);
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      setErrorMsg('Strictly image types are allowed.');
      return;
    }
    
    if (selectedFile.size > MAX_FILE_SIZE) {
      setErrorMsg('File exceeds 15MB maximum size limit.');
      return;
    }
    
    setFile(selectedFile);
    setUploadState('idle');
  };

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploadState !== 'idle' && uploadState !== 'success' && uploadState !== 'error') return;
    
    const droppedFile = e.dataTransfer.files[0];
    validateAndSetFile(droppedFile);
  }, [uploadState]);

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploadState('compressing');
      setProgress(10);
      const compressedBlob = await compressImage(file);
      
      setUploadState('signing');
      setProgress(40);
      
      // Get auth token
      const idToken = user.token;
      
      // Fetch signature from our serverless function
      const signRes = await fetch('/api/sign-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ category })
      });
      
      if (!signRes.ok) {
        throw new Error('Failed to get upload signature');
      }
      
      const { timestamp, signature, apiKey, cloudName } = await signRes.json();
      
      setUploadState('uploading');
      setProgress(60);
      
      const formData = new FormData();
      formData.append('file', compressedBlob, file.name.replace(/\.[^/.]+$/, ".webp"));
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', 'portfolio');
      formData.append('tags', `portfolio,${category}`);
      
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
        
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = 60 + Math.round((e.loaded / e.total) * 40);
            setProgress(percentComplete);
          }
        };
        
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Cloudinary upload failed'));
          }
        };
        
        xhr.onerror = () => reject(new Error('Network error during upload'));
        
        xhr.send(formData);
      });
      
      setUploadState('success');
      setProgress(100);
      setFile(null);
      
      setCategoryStats(prev => {
        const newStats = { ...prev, count: prev.count + 1 };
        sessionStorage.setItem(`cloudinary_stats_${category}`, JSON.stringify(newStats));
        return newStats;
      });
      
      if (onUploadSuccess) onUploadSuccess(category);
      
      setTimeout(() => {
        setUploadState('idle');
        setProgress(0);
      }, 3000);
      
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during upload.');
      setUploadState('error');
      setProgress(0);
    }
  };

  const isActive = uploadState === 'compressing' || uploadState === 'signing' || uploadState === 'uploading';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-medium text-zinc-100 mb-4">Smart Uploader</h2>
      
      <div 
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 flex flex-col items-center justify-center text-center
          ${isDragging ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800 hover:border-zinc-600 bg-zinc-950/50'}
          ${isActive ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isActive && !file && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={(e) => validateAndSetFile(e.target.files[0])}
        />
        
        {file ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center mb-3 relative overflow-hidden">
              <FileImage className="w-8 h-8 text-indigo-400 z-10" />
            </div>
            <p className="text-zinc-200 font-medium max-w-[200px] truncate">{file.name}</p>
            <p className="text-zinc-500 text-sm mt-1">
              Raw size: {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            {!isActive && (
              <button 
                onClick={(e) => { e.stopPropagation(); setFile(null); setUploadState('idle'); }}
                className="mt-3 text-xs text-zinc-400 hover:text-red-400 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        ) : (
          <>
            <div className={`w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 transition-transform duration-200 ${isDragging ? 'scale-110' : ''}`}>
              <UploadCloud className={`w-6 h-6 ${isDragging ? 'text-emerald-500' : 'text-zinc-400'}`} />
            </div>
            <p className="text-zinc-200 font-medium">Drag & Drop Master File or Browse</p>
            <span className="inline-block mt-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400">
              Max 15MB • WebP, JPEG, PNG
            </span>
          </>
        )}
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center text-red-400 text-sm">
          <XCircle className="w-4 h-4 mr-2" />
          {errorMsg}
        </div>
      )}
      
      {uploadState === 'success' && (
        <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 mr-2" />
          Asset successfully compressed and uploaded to portfolio.
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-full sm:w-auto flex flex-col gap-1">
          <div className="flex items-center justify-between px-1">
            <label className="text-sm text-zinc-400 whitespace-nowrap">Category:</label>
            <span className={`text-xs font-medium ${categoryStats.count >= categoryStats.limit ? 'text-red-400' : 'text-zinc-500'}`}>
              {categoryStats.loading ? '...' : `${categoryStats.count}/${categoryStats.limit}`}
            </span>
          </div>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isActive}
            className="w-full sm:w-40 bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={handleUpload}
          disabled={!file || isActive || categoryStats.count >= categoryStats.limit}
          className="w-full sm:flex-1 relative overflow-hidden bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-medium py-2 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {isActive && (
            <div 
              className="absolute top-0 left-0 h-full bg-emerald-400/20 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          )}
          <div className="relative z-10 flex items-center justify-center">
            {isActive ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                {uploadState === 'compressing' && 'Compressing (Canvas)...'}
                {uploadState === 'signing' && 'Signing Request...'}
                {uploadState === 'uploading' && `Uploading to CDN (${progress}%)...`}
              </>
            ) : (
              'Compress & Publish to Portfolio'
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default SmartUploader;
