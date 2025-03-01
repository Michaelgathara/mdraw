// src/components/ui/PageNavigation.tsx
'use client';

import useStore from '@/lib/store/useStore';

export default function PageNavigation() {
  const {
    getCurrentProject,
    addPage,
    removePage,
    setCurrentPage
  } = useStore();

  const currentProject = getCurrentProject();
  
  if (!currentProject) {
    return null;
  }
  
  return (
    <div className="w-64 bg-gray-50 border-r overflow-auto p-3 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold">Pages</h2>
        <button
          className="p-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          onClick={addPage}
        >
          Add Page
        </button>
      </div>
      
      <div className="space-y-2">
        {currentProject.pages.map((page, index) => (
          <div
            key={page.id}
            className={`p-2 rounded flex justify-between items-center cursor-pointer ${
              index === currentProject.currentPageIndex
                ? 'bg-blue-100 text-blue-800'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => setCurrentPage(index)}
          >
            <span>{page.name}</span>
            {currentProject.pages.length > 1 && (
              <button
                className="text-gray-500 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  removePage(page.id);
                }}
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}