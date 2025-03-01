// src/app/editor/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import useStore from '@/lib/store/useStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Import components with SSR disabled to prevent hydration errors
const EditorToolbar = dynamic(() => import('@/components/ui/EditorToolbar'), { 
  ssr: false,
  loading: () => <div className="h-12 bg-white border-b"></div>
});

const PageCanvas = dynamic(() => import('@/components/canvas/PageCanvas'), { 
  ssr: false,
  loading: () => <div className="flex-1 bg-gray-100 flex items-center justify-center"><LoadingSpinner /></div>
});

const PageNavigation = dynamic(() => import('@/components/ui/PageNavigation'), { 
  ssr: false,
  loading: () => <div className="w-64 bg-gray-50 border-r"></div>
});

export default function EditorPage() {
  const router = useRouter();
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
