// src/components/ui/ProjectSettings.tsx
'use client';

import { useState } from 'react';
import useStore from '@/lib/store/useStore';
import PageSizeConfig from './PageSizeConfig';

interface ProjectSettingsProps {
  onClose: () => void;
}

export default function ProjectSettings({ onClose }: ProjectSettingsProps) {
  const { getCurrentProject, renameProject } = useStore();
  const currentProject = getCurrentProject();
  
  const [projectName, setProjectName] = useState<string>(
    currentProject?.name || 'Untitled Project'
  );
  
  const [showPageSizeConfig, setShowPageSizeConfig] = useState(false);
  
  const handleSave = () => {
    if (currentProject && projectName.trim()) {
      renameProject(projectName.trim());
    }
    onClose();
  };
  
  if (!currentProject) {
    return null;
  }
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Project Settings</h2>
          
          <div className="mb-4">
            <label className="block mb-2">Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          
          <div className="mb-4">
            <button
              onClick={() => setShowPageSizeConfig(true)}
              className="text-blue-600 hover:underline"
            >
              Configure Page Size
            </button>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500">
              Created: {new Date(currentProject.createdAt).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              Last Updated: {new Date(currentProject.updatedAt).toLocaleString()}
            </p>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
      
      {showPageSizeConfig && (
        <PageSizeConfig onClose={() => setShowPageSizeConfig(false)} />
      )}
    </>
  );
}