// src/components/ui/PageSizeConfig.tsx
'use client';

import { useState } from 'react';
import useStore, { PageSize } from '@/lib/store/useStore';

// Common page sizes in pixels (96 DPI)
const COMMON_PAGE_SIZES: { [key: string]: PageSize } = {
  'A4': { width: 794, height: 1123, name: 'A4' },
  'Letter': { width: 816, height: 1056, name: 'Letter' },
  'Legal': { width: 816, height: 1344, name: 'Legal' },
  'Tabloid': { width: 1056, height: 1632, name: 'Tabloid' },
  'Custom': { width: 800, height: 600, name: 'Custom' }
};

interface PageSizeConfigProps {
  onClose: () => void;
}

export default function PageSizeConfig({ onClose }: PageSizeConfigProps) {
  const { getCurrentPage, updatePageSize } = useStore();
  const currentPage = getCurrentPage();
  
  const [selectedSize, setSelectedSize] = useState<string>(
    currentPage?.size.name || 'A4'
  );
  
  const [customWidth, setCustomWidth] = useState<number>(
    currentPage?.size.width || 800
  );
  
  const [customHeight, setCustomHeight] = useState<number>(
    currentPage?.size.height || 600
  );
  
  const handleSizeChange = (sizeName: string) => {
    setSelectedSize(sizeName);
  };
  
  const handleApply = () => {
    if (selectedSize === 'Custom') {
      updatePageSize({
        width: customWidth,
        height: customHeight,
        name: 'Custom'
      });
    } else {
      updatePageSize(COMMON_PAGE_SIZES[selectedSize]);
    }
    
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Page Size</h2>
        
        <div className="mb-4">
          <label className="block mb-2">Page Size</label>
          <select
            value={selectedSize}
            onChange={(e) => handleSizeChange(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {Object.keys(COMMON_PAGE_SIZES).map((sizeName) => (
              <option key={sizeName} value={sizeName}>
                {sizeName}
              </option>
            ))}
          </select>
        </div>
        
        {selectedSize === 'Custom' && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-2">Width (px)</label>
              <input
                type="number"
                value={customWidth}
                onChange={(e) => setCustomWidth(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
                min="100"
                max="2000"
              />
            </div>
            <div>
              <label className="block mb-2">Height (px)</label>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => setCustomHeight(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
                min="100"
                max="2000"
              />
            </div>
          </div>
        )}
        
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}