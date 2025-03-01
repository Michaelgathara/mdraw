// src/app/editor/page.tsx
'use client';

import { useEffect } from 'react';
import EditorToolbar from '@/components/ui/EditorToolbar';
import PageCanvas from '@/components/canvas/PageCanvas';
import PageNavigation from '@/components/ui/PageNavigation';
import useStore from '@/lib/store/useStore';

export default function EditorPage() {
  const { createNewProject, getCurrentProject } = useStore();
  
  useEffect(() => {
    // Check if there's an active project, if not create one
    const currentProject = getCurrentProject();
    if (!currentProject) {
      createNewProject('Untitled Project');
    }
  }, [createNewProject, getCurrentProject]);
  
  return (
    <>
      <EditorToolbar />
      <div className="flex flex-1 overflow-hidden">
        <PageNavigation />
        <main className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center p-4">
          <PageCanvas />
        </main>
      </div>
    </>
  );
}