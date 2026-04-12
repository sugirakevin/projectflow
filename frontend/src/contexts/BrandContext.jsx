import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../api/axios';

const BrandContext = createContext(null);

const darkenHex = (hex, percent = 20) => {
  if (!hex || typeof hex !== 'string' || hex.length !== 7 || hex[0] !== '#') return hex || '#7c3aed';
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return hex;
  r = Math.floor(r * (100 - percent) / 100);
  g = Math.floor(g * (100 - percent) / 100);
  b = Math.floor(b * (100 - percent) / 100);
  return `#${Math.max(0, r).toString(16).padStart(2,'0')}${Math.max(0, g).toString(16).padStart(2,'0')}${Math.max(0, b).toString(16).padStart(2,'0')}`;
};

const getContrastColor = (hex) => {
  if (!hex || typeof hex !== 'string' || hex.length !== 7 || hex[0] !== '#') return '#ffffff';
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '#ffffff';
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? '#000000' : '#ffffff';
};

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState({ themeColor: '#7c3aed', bgUrl: null, logoUrl: null });
  const [loading, setLoading] = useState(true);

  const fetchBrand = async () => {
    try {
      const res = await axios.get('/settings');
      setBrand(res.data);
    } catch {
      // Fallback silently to defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrand();
  }, []);

  useEffect(() => {
    if (brand.themeColor) {
      document.documentElement.style.setProperty('--brand-color', brand.themeColor);
      document.documentElement.style.setProperty('--brand-dark-color', darkenHex(brand.themeColor, 15));
      document.documentElement.style.setProperty('--brand-text-color', getContrastColor(brand.themeColor));
    }
    
    if (brand.bgUrl) {
      document.body.style.backgroundImage = `url(${brand.bgUrl})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = '#030712'; // default gray-950
    }
  }, [brand]);

  // Expose a way to refresh it if updated via Settings
  const applyParams = async (params) => {
    try {
      const res = await axios.put('/settings', params);
      setBrand(res.data);
      return res.data;
    } catch (e) {
      throw e;
    }
  };

  return (
    <BrandContext.Provider value={{ brand, applyParams }}>
      {children}
    </BrandContext.Provider>
  );
}

export const useBrand = () => useContext(BrandContext);
