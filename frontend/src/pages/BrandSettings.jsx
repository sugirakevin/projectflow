import React, { useState, useEffect } from 'react';
import { useBrand } from '../contexts/BrandContext';
import axios from '../api/axios';

export default function BrandSettings() {
  const { brand, applyParams } = useBrand();
  const [form, setForm] = useState({ themeColor: '#7c3aed', bgUrl: '', logoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingBg(true);

    try {
      const res = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(p => ({ ...p, [type === 'logo' ? 'logoUrl' : 'bgUrl']: res.data.url }));
      setMsg({ type: 'success', text: `${type === 'logo' ? 'Logo' : 'Background'} uploaded successfully!` });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || `Failed to upload ${type}` });
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBg(false);
      e.target.value = null; // reset file input
    }
  };

  useEffect(() => {
    if (brand) {
      setForm({
        themeColor: brand.themeColor || '#7c3aed',
        bgUrl: brand.bgUrl || '',
        logoUrl: brand.logoUrl || ''
      });
    }
  }, [brand]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await applyParams({
        themeColor: form.themeColor,
        bgUrl: (form.bgUrl || '').trim() || null,
        logoUrl: (form.logoUrl || '').trim() || null
      });
      setMsg({ type: 'success', text: 'Brand settings updated globally.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update brand' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <span className="text-2xl">✨</span> App Branding
        </h1>
        <p className="text-sm text-gray-400">Customize the global interface color, background wallpaper, and workspace logo.</p>
      </div>

      <div className="card p-6 border border-gray-800">
        <form onSubmit={handleSubmit} className="space-y-6">
          {msg && (
            <div className={`p-4 rounded-lg text-sm font-medium ${msg.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
              {msg.text}
            </div>
          )}

          <div>
            <label className="label text-base">Primary Theme Color</label>
            <p className="text-sm text-gray-500 mb-3">Used for buttons, links, and active navigation states.</p>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                value={form.themeColor?.length === 7 ? form.themeColor : '#7c3aed'} 
                onChange={e => setForm(p => ({ ...p, themeColor: e.target.value }))}
                className="w-16 h-16 rounded cursor-pointer bg-gray-950 border-0 outline-none p-1"
              />
              <input 
                type="text" 
                value={form.themeColor} 
                onChange={e => setForm(p => ({ ...p, themeColor: e.target.value }))}
                className="input w-32 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="label text-base">Workspace Logo</label>
            <p className="text-sm text-gray-500 mb-3">Provide a direct link or upload an image (PNG, SVG, JPG). Transparent backgrounds look best.</p>
            <div className="flex items-center gap-4 flex-wrap">
              <input 
                type="url" 
                placeholder="https://example.com/logo.png" 
                value={form.logoUrl} 
                onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))}
                className="input max-w-xl"
              />
              <span className="text-gray-500 text-sm font-medium">OR</span>
              <label className={`btn-secondary whitespace-nowrap relative overflow-hidden ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                {uploadingLogo ? 'Uploading...' : 'Upload File'}
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} disabled={uploadingLogo} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed" />
              </label>
            </div>
          </div>

          <div>
            <label className="label text-base">Application Background</label>
            <p className="text-sm text-gray-500 mb-3">Provide a link or upload a high-resolution wallpaper. The application layout automatically uses frosted glass effects over it.</p>
            <div className="flex items-center gap-4 flex-wrap">
              <input 
                type="url" 
                placeholder="https://images.unsplash.com/your-image-url" 
                value={form.bgUrl} 
                onChange={e => setForm(p => ({ ...p, bgUrl: e.target.value }))}
                className="input max-w-xl"
              />
              <span className="text-gray-500 text-sm font-medium">OR</span>
              <label className={`btn-secondary whitespace-nowrap relative overflow-hidden ${uploadingBg ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                {uploadingBg ? 'Uploading...' : 'Upload File'}
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'bg')} disabled={uploadingBg} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed" />
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800 flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary text-base px-6 shadow-lg shadow-brand/20">
              {saving ? 'Publishing...' : 'Publish Global Theme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
