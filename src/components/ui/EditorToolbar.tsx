// src/components/ui/EditorToolbar.tsx
'use client';

import { useState } from 'react';
import useStore, { ElementType } from '@/lib/store/useStore';
import PageSizeConfig from './PageSizeConfig';
import ProjectSettings from './ProjectSettings';

export default function EditorToolbar() {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [showPageSizeConfig, setShowPageSizeConfig] = useState(false);
  
  const {
    currentTool,
    setCurrentTool,
    currentFill,
    currentStroke,
    currentStrokeWidth,
    setElementStyle,
    getCurrentProject,
    getCurrentPage
  } = useStore();
  
  const tools = [
    { id: 'select', label: 'Select' },
    { id: 'rectangle', label: 'Rectangle' },
    { id: 'circle', label: 'Circle' },
    { id: 'line', label: 'Line' },
    { id: 'arrow', label: 'Arrow' },
    { id: 'text', label: 'Text' },
    { id: 'freehand', label: 'Draw' },
  ];
  
  const strokeWidths = [1, 2, 4, 6, 8];
  
  const handleToolClick = (tool: string) => {
    setCurrentTool(tool as ElementType | 'select');
  };
  
  const handleStrokeWidthChange = (width: number) => {
    setElementStyle({ strokeWidth: width });
  };
  
  const handleFillChange = (color: string) => {
    setElementStyle({ fill: color });
  };
  
  const handleStrokeChange = (color: string) => {
    setElementStyle({ stroke: color });
  };
  
  const exportToPDF = async () => {
    const currentProject = getCurrentProject();
    
    if (!currentProject) return;
    
    try {
      // Import the PDF export utility
      const { exportProjectToPDF } = await import('@/lib/utils/pdf-export');
      
      // Export the project to PDF
      await exportProjectToPDF(currentProject);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };
  
  return (
    <div className="bg-white border-b p-2 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button
            className="px-4 py-1 border rounded hover:bg-gray-100"
            onClick={() => setShowProjectMenu(!showProjectMenu)}
          >
            File
          </button>
          
          {showProjectMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-10">
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setShowProjectMenu(false);
                  setShowProjectSettings(true);
                }}
              >
                Project Settings
              </button>
              
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setShowProjectMenu(false);
                  setShowPageSizeConfig(true);
                }}
              >
                Page Size
              </button>
              
              <hr className="my-1" />
              
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setShowProjectMenu(false);
                  exportToPDF();
                }}
              >
                Export PDF
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              className={`p-2 rounded ${
                currentTool === tool.id
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => handleToolClick(tool.id)}
            >
              {tool.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span>Fill:</span>
          <div
            className="w-6 h-6 border border-gray-300 cursor-pointer"
            style={{ backgroundColor: currentFill }}
            onClick={() => setShowColorPicker(true)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span>Stroke:</span>
          <div
            className="w-6 h-6 border border-gray-300 cursor-pointer"
            style={{ backgroundColor: currentStroke }}
            onClick={() => setShowColorPicker(true)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span>Width:</span>
          <select
            value={currentStrokeWidth}
            onChange={(e) => handleStrokeWidthChange(Number(e.target.value))}
            className="border rounded p-1"
          >
            {strokeWidths.map((width) => (
              <option key={width} value={width}>
                {width}px
              </option>
            ))}
          </select>
        </div>
        
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={exportToPDF}
        >
          Export PDF
        </button>
      </div>
      
      {/* This is a simplified color picker; in a real app, you'd use a proper color picker component */}
      {showColorPicker && (
        <div className="absolute top-16 right-4 bg-white border shadow-lg p-4 rounded">
          <div className="grid grid-cols-6 gap-2">
            {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', 
              '#000000', '#ffffff', '#888888', '#f5f5f5', '#ffa500', '#800080'].map((color) => (
              <div
                key={color}
                className="w-6 h-6 border border-gray-300 cursor-pointer"
                style={{ backgroundColor: color }}
                onClick={() => {
                  handleFillChange(color);
                  setShowColorPicker(false);
                }}
              />
            ))}
          </div>
          <button
            className="mt-2 w-full text-center text-sm text-gray-500"
            onClick={() => setShowColorPicker(false)}
          >
            Close
          </button>
        </div>
      )}
      
      {/* Modals */}
      {showProjectSettings && (
        <ProjectSettings onClose={() => setShowProjectSettings(false)} />
      )}
      
      {showPageSizeConfig && (
        <PageSizeConfig onClose={() => setShowPageSizeConfig(false)} />
      )}
    </div>
  );
}

