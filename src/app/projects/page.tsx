// src/app/projects/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useStore from '@/lib/store/useStore';

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, openProject } = useStore();
  
  const handleOpenProject = (projectId: string) => {
    openProject(projectId);
    router.push('/editor');
  };
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Your Projects</h1>
      
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You don't have any projects yet.</p>
          <Link
            href="/editor"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create New Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div 
              key={project.id}
              className="border rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenProject(project.id)}
            >
              <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
              <p className="text-gray-500 text-sm mb-4">
                {project.pages.length} page{project.pages.length !== 1 ? 's' : ''}
              </p>
              <p className="text-gray-500 text-sm">
                Last updated: {new Date(project.updatedAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}