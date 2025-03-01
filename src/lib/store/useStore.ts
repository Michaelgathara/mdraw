// src/lib/store/useStore.ts
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { devtools, persist } from 'zustand/middleware';

// Define types for our application
export type ElementType = 'rectangle' | 'circle' | 'line' | 'arrow' | 'text' | 'freehand';

export interface PageSize {
  width: number;
  height: number;
  name: string; // e.g., 'A4', 'Letter', 'Custom'
}

export interface Element {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  points?: Array<{ x: number; y: number }>;
}

export interface Page {
  id: string;
  name: string;
  elements: Element[];
  size: PageSize;
}

export interface Project {
  id: string;
  name: string;
  pages: Page[];
  currentPageIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DrawingState {
  // Project state
  projects: Project[];
  currentProjectId: string | null;
  
  // Tool state
  currentTool: ElementType | 'select';
  selectedElementIds: string[];
  
  // Style state
  currentFill: string;
  currentStroke: string;
  currentStrokeWidth: number;
  currentFontSize: number;
  currentFontFamily: string;
  
  // History
  history: any[];
  historyIndex: number;
  
  // Methods
  createNewProject: (name: string) => void;
  openProject: (projectId: string) => void;
  getCurrentProject: () => Project | null;
  getCurrentPage: () => Page | null;
  addPage: () => void;
  removePage: (pageId: string) => void;
  setCurrentPage: (pageIndex: number) => void;
  addElement: (element: Omit<Element, 'id'>) => void;
  updateElement: (elementId: string, changes: Partial<Element>) => void;
  removeElement: (elementId: string) => void;
  selectElement: (elementId: string, addToSelection?: boolean) => void;
  clearSelection: () => void;
  setCurrentTool: (tool: ElementType | 'select') => void;
  setElementStyle: (style: Partial<Pick<Element, 'fill' | 'stroke' | 'strokeWidth' | 'opacity'>>) => void;
  updatePageSize: (size: PageSize) => void;
  renameProject: (name: string) => void;
  renamePage: (pageId: string, name: string) => void;
  undo: () => void;
  redo: () => void;
  exportToPDF: () => void;
}

const DEFAULT_PAGE_SIZE: PageSize = {
  width: 794, // A4 width in pixels at 96 DPI
  height: 1123, // A4 height in pixels at 96 DPI
  name: 'A4'
};

// Create the store
const useStore = create<DrawingState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        projects: [],
        currentProjectId: null,
        currentTool: 'select',
        selectedElementIds: [],
        currentFill: '#ffffff',
        currentStroke: '#000000',
        currentStrokeWidth: 2,
        currentFontSize: 16,
        currentFontFamily: 'Arial',
        history: [],
        historyIndex: -1,
        
        // Methods
        createNewProject: (name: string) => {
          const newProject: Project = {
            id: uuidv4(),
            name,
            pages: [
              {
                id: uuidv4(),
                name: 'Page 1',
                elements: [],
                size: DEFAULT_PAGE_SIZE
              }
            ],
            currentPageIndex: 0,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          set((state) => ({
            projects: [...state.projects, newProject],
            currentProjectId: newProject.id
          }));
        },
        
        openProject: (projectId: string) => {
          set({ currentProjectId: projectId });
        },
        
        getCurrentProject: () => {
          const { projects, currentProjectId } = get();
          if (!currentProjectId) return null;
          return projects.find(p => p.id === currentProjectId) || null;
        },
        
        getCurrentPage: () => {
          const currentProject = get().getCurrentProject();
          if (!currentProject) return null;
          return currentProject.pages[currentProject.currentPageIndex] || null;
        },
        
        addPage: () => {
          set((state) => {
            const currentProject = state.getCurrentProject();
            if (!currentProject) return state;
            
            const newPage: Page = {
              id: uuidv4(),
              name: `Page ${currentProject.pages.length + 1}`,
              elements: [],
              size: DEFAULT_PAGE_SIZE
            };
            
            const updatedProject = {
              ...currentProject,
              pages: [...currentProject.pages, newPage],
              updatedAt: new Date()
            };
            
            return {
              projects: state.projects.map(p => 
                p.id === currentProject.id ? updatedProject : p
              )
            };
          });
        },
        
        removePage: (pageId: string) => {
          set((state) => {
            const currentProject = state.getCurrentProject();
            if (!currentProject || currentProject.pages.length <= 1) return state;
            
            const pageIndex = currentProject.pages.findIndex(p => p.id === pageId);
            if (pageIndex === -1) return state;
            
            const updatedPages = currentProject.pages.filter(p => p.id !== pageId);
            const newCurrentPageIndex = currentProject.currentPageIndex >= pageIndex 
              ? Math.max(0, currentProject.currentPageIndex - 1)
              : currentProject.currentPageIndex;
            
            const updatedProject = {
              ...currentProject,
              pages: updatedPages,
              currentPageIndex: newCurrentPageIndex,
              updatedAt: new Date()
            };
            
            return {
              projects: state.projects.map(p => 
                p.id === currentProject.id ? updatedProject : p
              )
            };
          });
        },
        
        setCurrentPage: (pageIndex: number) => {
          set((state) => {
            const currentProject = state.getCurrentProject();
            if (!currentProject) return state;
            
            if (pageIndex < 0 || pageIndex >= currentProject.pages.length) {
              return state;
            }
            
            const updatedProject = {
              ...currentProject,
              currentPageIndex: pageIndex
            };
            
            return {
              projects: state.projects.map(p => 
                p.id === currentProject.id ? updatedProject : p
              ),
              selectedElementIds: []
            };
          });
        },
        
        addElement: (element) => {
          set((state) => {
            const currentPage = state.getCurrentPage();
            const currentProject = state.getCurrentProject();
            if (!currentPage || !currentProject) return state;
            
            const newElement: Element = {
              id: uuidv4(),
              ...element
            };
            
            const updatedPage = {
              ...currentPage,
              elements: [...currentPage.elements, newElement]
            };
            
            const updatedPages = currentProject.pages.map(p => 
              p.id === currentPage.id ? updatedPage : p
            );
            
            const updatedProject = {
              ...currentProject,
              pages: updatedPages,
              updatedAt: new Date()
            };
            
            // Add to history here
            
            return {
              projects: state.projects.map(p => 
                p.id === currentProject.id ? updatedProject : p
              ),
              selectedElementIds: [newElement.id]
            };
          });
        },
        
        updateElement: (elementId: string, changes: Partial<Element>) => {
          set((state) => {
            const currentPage = state.getCurrentPage();
            const currentProject = state.getCurrentProject();
            if (!currentPage || !currentProject) return state;
            
            const elementIndex = currentPage.elements.findIndex(e => e.id === elementId);
            if (elementIndex === -1) return state;
            
            const updatedElements = [...currentPage.elements];
            updatedElements[elementIndex] = {
              ...updatedElements[elementIndex],
              ...changes
            };
            
            const updatedPage = {
              ...currentPage,
              elements: updatedElements
            };
            
            const updatedPages = currentProject.pages.map(p => 
              p.id === currentPage.id ? updatedPage : p
            );
            
            const updatedProject = {
              ...currentProject,
              pages: updatedPages,
              updatedAt: new Date()
            };
            
            // Add to history here
            
            return {
              projects: state.projects.map(p => 
                p.id === currentProject.id ? updatedProject : p
              )
            };
          });
        },
        
        removeElement: (elementId: string) => {
          set((state) => {
            const currentPage = state.getCurrentPage();
            const currentProject = state.getCurrentProject();
            if (!currentPage || !currentProject) return state;
            
            const updatedElements = currentPage.elements.filter(e => e.id !== elementId);
            
            const updatedPage = {
              ...currentPage,
              elements: updatedElements
            };
            
            const updatedPages = currentProject.pages.map(p => 
              p.id === currentPage.id ? updatedPage : p
            );
            
            const updatedProject = {
              ...currentProject,
              pages: updatedPages,
              updatedAt: new Date()
            };
            
            // Add to history here
            
            return {
              projects: state.projects.map(p => 
                p.id === currentProject.id ? updatedProject : p
              ),
              selectedElementIds: state.selectedElementIds.filter(id => id !== elementId)
            };
          });
        },
        
        selectElement: (elementId: string, addToSelection = false) => {
          set((state) => {
            if (addToSelection) {
              return {
                selectedElementIds: [...state.selectedElementIds, elementId]
              };
            } else {
              return {
                selectedElementIds: [elementId]
              };
            }
          });
        },
        
        clearSelection: () => {
          set({ selectedElementIds: [] });
        },
        
        setCurrentTool: (tool) => {
          set({ currentTool: tool });
        },
        
        setElementStyle: (style) => {
          set((state) => ({
            currentFill: style.fill ?? state.currentFill,
            currentStroke: style.stroke ?? state.currentStroke,
            currentStrokeWidth: style.strokeWidth ?? state.currentStrokeWidth,
          }));
          
          // Apply style to selected elements
          const { selectedElementIds, updateElement } = get();
          selectedElementIds.forEach((id) => {
            updateElement(id, style);
          });
        },
        
        updatePageSize: (size) => {
          set((state) => {
            const currentPage = state.getCurrentPage();
            const currentProject = state.getCurrentProject();
            if (!currentPage || !currentProject) return state;
            
            const updatedPage = {
              ...currentPage,
              size
            };
            
            const updatedPages = currentProject.pages.map(p => 
              p.id === currentPage.id ? updatedPage : p
            );
            
            const updatedProject = {
              ...currentProject,
              pages: updatedPages,
              updatedAt: new Date()
            };
            
            return {
              projects: state.projects.map(p => 
                p.id === currentProject.id ? updatedProject : p
              )
            };
          });
        },
        
        renameProject: (name) => {
          set((state) => {
            const currentProject = state.getCurrentProject();
            if (!currentProject) return state;
            
            const updatedProject = {
              ...currentProject,
              name,
              updatedAt: new Date()
            };
            
            return {
              projects: state.projects.map(p => 
                p.id === currentProject.id ? updatedProject : p
              )
            };
          });
        },
        
        renamePage: (pageId, name) => {
          set((state) => {
            const currentProject = state.getCurrentProject();
            if (!currentProject) return state;
            
            const updatedPages = currentProject.pages.map(p => 
              p.id === pageId ? { ...p, name } : p
            );
            
            const updatedProject = {
              ...currentProject,
              pages: updatedPages,
              updatedAt: new Date()
            };
            
            return {
              projects: state.projects.map(p => 
                p.id === currentProject.id ? updatedProject : p
              )
            };
          });
        },
        
        undo: () => {
          // Implement undo logic
          // In a full implementation, we would maintain a history stack
          // and revert to the previous state
          console.log('Undo not implemented yet');
        },
        
        redo: () => {
          // Implement redo logic
          // In a full implementation, we would maintain a history stack
          // and apply the next state
          console.log('Redo not implemented yet');
        },
        
        exportToPDF: () => {
          // Implement PDF export logic (will be handled separately)
          // See pdf-export.ts
        }
      }),
      {
        name: 'pagedraw-storage',
        partialize: (state) => ({ 
          projects: state.projects,
          currentProjectId: state.currentProjectId 
        })
      }
    )
  )
);

export default useStore;