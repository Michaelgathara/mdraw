// src/components/canvas/PageCanvas.tsx
'use client';

import { useRef, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import useStore, { Element } from '@/lib/store/useStore';

// Declare this outside the component to prevent redefinition 
// in useEffect closures with each render
let isDrawing = false;
let startX = 0;
let startY = 0;
let currentObj: fabric.Object | null = null;
let freehandPoints: Array<{x: number, y: number}> = [];

export default function PageCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  // Add a client-side only flag
  const [isMounted, setIsMounted] = useState(false);
  
  const {
    getCurrentPage,
    currentTool,
    currentFill,
    currentStroke,
    currentStrokeWidth,
    addElement,
    updateElement,
    selectedElementIds,
    selectElement,
    clearSelection
  } = useStore();
  
  // Set mounted flag only on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Initialize the fabric.js canvas
  useEffect(() => {
    if (!isMounted || !canvasRef.current) return;
    
    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: 'white',
      preserveObjectStacking: true,
      selection: true, // Allow selection with drag
      defaultCursor: 'default'
    });
    
    setFabricCanvas(canvas);
    
    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, [isMounted]);
  
  // Sync canvas size with current page
  useEffect(() => {
    if (!fabricCanvas) return;
    
    const currentPage = getCurrentPage();
    if (!currentPage) return;
    
    fabricCanvas.setWidth(currentPage.size.width);
    fabricCanvas.setHeight(currentPage.size.height);
    
    // Set the viewport center
    fabricCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabricCanvas.renderAll();
  }, [fabricCanvas, getCurrentPage]);
  
  // Sync elements from state to canvas
  useEffect(() => {
    if (!fabricCanvas) return;
    
    // Clear the canvas but preserve active drawing object if any
    const tempObj = currentObj;
    
    // Remember the currently active object ID if there is one
    let activeObjectId = null;
    if (fabricCanvas.getActiveObject()) {
      activeObjectId = fabricCanvas.getActiveObject().elementId;
    }
    
    // Clear the canvas
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = 'white';
    
    const currentPage = getCurrentPage();
    if (!currentPage) return;
    
    // Add elements from state
    currentPage.elements.forEach((element) => {
      let fabricObj: fabric.Object | null = null;
      
      switch (element.type) {
        case 'rectangle':
          fabricObj = new fabric.Rect({
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            fill: element.fill,
            stroke: element.stroke,
            strokeWidth: element.strokeWidth,
            angle: element.angle,
            opacity: element.opacity
          });
          break;
          
        case 'circle':
          fabricObj = new fabric.Circle({
            left: element.x,
            top: element.y,
            radius: Math.min(element.width, element.height) / 2,
            fill: element.fill,
            stroke: element.stroke,
            strokeWidth: element.strokeWidth,
            angle: element.angle,
            opacity: element.opacity
          });
          break;
          
        case 'line':
          fabricObj = new fabric.Line([
            element.x, 
            element.y, 
            element.x + element.width, 
            element.y + element.height
          ], {
            stroke: element.stroke,
            strokeWidth: element.strokeWidth,
            angle: element.angle,
            opacity: element.opacity
          });
          break;
          
        case 'arrow':
          // For arrows, we'll use a line with an arrow head
          // This is a simplified implementation
          const line = new fabric.Line([
            element.x, 
            element.y, 
            element.x + element.width, 
            element.y + element.height
          ], {
            stroke: element.stroke,
            strokeWidth: element.strokeWidth,
            angle: element.angle,
            opacity: element.opacity
          });
          
          // In a real implementation, we would add an arrowhead
          fabricObj = line;
          break;
          
        case 'text':
          if (element.text) {
            fabricObj = new fabric.Text(element.text, {
              left: element.x,
              top: element.y,
              fill: element.fill,
              fontFamily: element.fontFamily || 'Arial',
              fontSize: element.fontSize || 16,
              angle: element.angle,
              opacity: element.opacity
            });
          }
          break;
          
        case 'freehand':
          if (element.points && element.points.length > 0) {
            const path = element.points.map((point, i) => 
              i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
            ).join(' ');
            
            fabricObj = new fabric.Path(path, {
              stroke: element.stroke,
              strokeWidth: element.strokeWidth,
              fill: 'transparent',
              opacity: element.opacity
            });
          }
          break;
      }
      
      if (fabricObj) {
        // Add custom property to track our element ID
        fabricObj.set('elementId', element.id);
        
        // Set selection state
        fabricObj.set('selectable', currentTool === 'select');
        fabricObj.set('selected', selectedElementIds.includes(element.id));
        
        // Set hover cursor
        fabricObj.hoverCursor = currentTool === 'select' ? 'move' : 'default';
        
        fabricCanvas.add(fabricObj);
        
        // If this was the active object, reselect it
        if (activeObjectId && activeObjectId === element.id && currentTool === 'select') {
          fabricCanvas.setActiveObject(fabricObj);
        }
      }
    });
    
    // Add back the temporary object if we're drawing
    if (isDrawing && tempObj) {
      fabricCanvas.add(tempObj);
      currentObj = tempObj;
    }
    
    // Force render
    fabricCanvas.requestRenderAll();
    
  }, [fabricCanvas, getCurrentPage, currentTool, selectedElementIds]);
  
  // Set up event handlers for the drawing tools
  useEffect(() => {
    if (!fabricCanvas) return;
    
    // Remove existing listeners
    fabricCanvas.off('mouse:down');
    fabricCanvas.off('mouse:move');
    fabricCanvas.off('mouse:up');
    fabricCanvas.off('selection:created');
    fabricCanvas.off('selection:updated');
    fabricCanvas.off('selection:cleared');
    
    // Set the mouse cursor
    switch (currentTool) {
      case 'select':
        fabricCanvas.defaultCursor = 'default';
        fabricCanvas.selection = true;
        break;
      default:
        fabricCanvas.defaultCursor = 'crosshair';
        fabricCanvas.selection = false;
        break;
    }
    
    // Set all objects selectable status
    fabricCanvas.forEachObject((obj) => {
      obj.selectable = currentTool === 'select';
      obj.hoverCursor = currentTool === 'select' ? 'move' : 'default';
    });
    
    // Reset drawing state when tool changes
    isDrawing = false;
    currentObj = null;
    freehandPoints = [];
    
    // Handle mouse down
    fabricCanvas.on('mouse:down', (opt) => {
      const pointer = fabricCanvas.getPointer(opt.e);
      startX = pointer.x;
      startY = pointer.y;
      isDrawing = true;
      
      if (currentTool === 'select') {
        // Selection is handled by Fabric.js
        return;
      }
      
      // If not select tool, clear selection
      clearSelection();
      
      switch (currentTool) {
        case 'rectangle':
          currentObj = new fabric.Rect({
            left: startX,
            top: startY,
            width: 1, // Start with small size instead of 0 to make visible immediately
            height: 1,
            fill: currentFill,
            stroke: currentStroke,
            strokeWidth: currentStrokeWidth,
            selectable: false, // Prevent selection during drawing
            hoverCursor: 'default'
          });
          break;
          
        case 'circle':
          currentObj = new fabric.Circle({
            left: startX,
            top: startY,
            radius: 1, // Start with small radius instead of 0
            fill: currentFill,
            stroke: currentStroke,
            strokeWidth: currentStrokeWidth,
            selectable: false,
            hoverCursor: 'default'
          });
          break;
          
        case 'line':
        case 'arrow':
          currentObj = new fabric.Line([startX, startY, startX + 1, startY + 1], { // Small line initially
            stroke: currentStroke,
            strokeWidth: currentStrokeWidth,
            selectable: false,
            hoverCursor: 'default'
          });
          break;
          
        case 'text':
          // For text, we'll create it on mouse up
          break;
          
        case 'freehand':
          freehandPoints = [{ x: startX, y: startY }];
          currentObj = new fabric.Path(`M ${startX} ${startY}`, {
            stroke: currentStroke,
            strokeWidth: currentStrokeWidth,
            fill: 'transparent',
            selectable: false,
            hoverCursor: 'default'
          });
          break;
      }
      
      if (currentObj) {
        // Ensure the object is rendered on top during drawing
        fabricCanvas.add(currentObj);
        currentObj.bringToFront();
        
        // Force immediate rendering to show the object
        fabricCanvas.requestRenderAll();
      }
    });
    
    // Handle mouse move
    fabricCanvas.on('mouse:move', (opt) => {
      if (!isDrawing || !currentObj) return;
      
      const pointer = fabricCanvas.getPointer(opt.e);
      
      switch (currentTool) {
        case 'rectangle':
          const rect = currentObj as fabric.Rect;
          const width = pointer.x - startX;
          const height = pointer.y - startY;
          
          // Handle negative dimensions
          if (width > 0) {
            rect.set({ width });
          } else {
            rect.set({ left: pointer.x, width: Math.abs(width) });
          }
          
          if (height > 0) {
            rect.set({ height });
          } else {
            rect.set({ top: pointer.y, height: Math.abs(height) });
          }
          break;
          
        case 'circle':
          const circle = currentObj as fabric.Circle;
          const radius = Math.sqrt(
            Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
          ) / 2;
          
          circle.set({
            radius,
            left: startX - radius,
            top: startY - radius
          });
          break;
          
        case 'line':
        case 'arrow':
          const line = currentObj as fabric.Line;
          line.set({
            x2: pointer.x,
            y2: pointer.y
          });
          break;
          
        case 'freehand':
          freehandPoints.push({ x: pointer.x, y: pointer.y });
          
          // Create a new path with the updated points
          const path = freehandPoints.map((point, i) => 
            i === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`
          ).join(' ');
          
          // For freehand, it's better to recreate the path object each time
          // to ensure smooth rendering of the ongoing drawing
          if (currentObj) {
            fabricCanvas.remove(currentObj);
          }
          
          currentObj = new fabric.Path(path, {
            stroke: currentStroke,
            strokeWidth: currentStrokeWidth,
            fill: 'transparent',
            selectable: false,
            hoverCursor: 'default'
          });
          
          fabricCanvas.add(currentObj);
          break;
      }
      
      // Force canvas to re-render immediately to show the shape being drawn
      fabricCanvas.requestRenderAll();
    });
    
    // Handle mouse up
    fabricCanvas.on('mouse:up', () => {
      if (!isDrawing) return;
      isDrawing = false;
      
      if (currentTool === 'select') {
        // Selection is handled by Fabric.js
        return;
      }
      
      if (currentTool === 'text' && !currentObj) {
        // Create text element at the click position
        currentObj = new fabric.IText('Text', {
          left: startX,
          top: startY,
          fill: currentFill,
          fontFamily: 'Arial',
          fontSize: 16,
          selectable: false
        });
        
        fabricCanvas.add(currentObj);
        fabricCanvas.requestRenderAll();
      }
      
      // Check if the object is too small (likely an accidental click)
      // This prevents creating tiny shapes when users just click without dragging
      let isTooSmall = false;
      
      if (currentObj) {
        if (currentTool === 'rectangle' || currentTool === 'circle') {
          const width = currentObj.width || 0;
          const height = currentObj.height || 0;
          if (width < 5 && height < 5) {
            isTooSmall = true;
          }
        } else if (currentTool === 'line' || currentTool === 'arrow') {
          const line = currentObj as fabric.Line;
          const dx = (line.x2 || 0) - (line.x1 || 0);
          const dy = (line.y2 || 0) - (line.y1 || 0);
          if (Math.sqrt(dx * dx + dy * dy) < 5) {
            isTooSmall = true;
          }
        } else if (currentTool === 'freehand') {
          if (freehandPoints.length < 3) {
            isTooSmall = true;
          }
        }
      }
      
      if (currentObj && !isTooSmall) {
        // Add the element to our state
        const fabricObject = currentObj;
        const elementType = currentTool;
        
        let elementData: Omit<Element, 'id'> = {
          type: elementType,
          x: fabricObject.left || 0,
          y: fabricObject.top || 0,
          width: fabricObject.width || 0,
          height: fabricObject.height || 0,
          angle: fabricObject.angle || 0,
          fill: currentFill,
          stroke: currentStroke,
          strokeWidth: currentStrokeWidth,
          opacity: fabricObject.opacity || 1
        };
        
        // Handle specific element types
        switch (elementType) {
          case 'circle':
            const circle = fabricObject as fabric.Circle;
            elementData.width = circle.radius ? circle.radius * 2 : 0;
            elementData.height = circle.radius ? circle.radius * 2 : 0;
            break;
            
          case 'line':
          case 'arrow':
            const line = fabricObject as fabric.Line;
            elementData.width = Math.abs((line.x2 || 0) - (line.x1 || 0));
            elementData.height = Math.abs((line.y2 || 0) - (line.y1 || 0));
            break;
            
          case 'text':
            const text = fabricObject as fabric.Text;
            elementData.text = text.text || '';
            elementData.fontSize = text.fontSize || 16;
            elementData.fontFamily = text.fontFamily || 'Arial';
            break;
            
          case 'freehand':
            elementData.points = freehandPoints;
            break;
        }
        
        // Remove the temporary object first
        fabricCanvas.remove(currentObj);
        
        // Then add the permanent element to the store
        // This order prevents flickering
        addElement(elementData);
      } else if (currentObj) {
        // Just remove the object if it's too small
        fabricCanvas.remove(currentObj);
      }
      
      // Reset drawing state
      currentObj = null;
      freehandPoints = [];
    });
    
    // Handle selection events
    fabricCanvas.on('selection:created', (opt) => {
      const selectedObjects = opt.selected || [];
      
      // Update our selection state
      const selectedIds = selectedObjects
        .map(obj => obj.elementId as string)
        .filter(Boolean);
      
      if (selectedIds.length > 0) {
        selectedIds.forEach(id => selectElement(id, true));
      }
    });
    
    fabricCanvas.on('selection:updated', (opt) => {
      const selectedObjects = opt.selected || [];
      
      // Update our selection state
      const selectedIds = selectedObjects
        .map(obj => obj.elementId as string)
        .filter(Boolean);
      
      if (selectedIds.length > 0) {
        clearSelection();
        selectedIds.forEach(id => selectElement(id, true));
      }
    });
    
    fabricCanvas.on('selection:cleared', () => {
      clearSelection();
    });
    
    // Handle object modification
    fabricCanvas.on('object:modified', (opt) => {
      const modifiedObj = opt.target;
      if (!modifiedObj || !modifiedObj.elementId) return;
      
      const elementId = modifiedObj.elementId as string;
      
      // Update the element in our state
      updateElement(elementId, {
        x: modifiedObj.left || 0,
        y: modifiedObj.top || 0,
        width: modifiedObj.width || 0,
        height: modifiedObj.height || 0,
        angle: modifiedObj.angle || 0
      });
    });
    
  }, [
    fabricCanvas,
    currentTool,
    currentFill,
    currentStroke,
    currentStrokeWidth,
    addElement,
    updateElement,
    selectElement,
    clearSelection
  ]);
  
  return (
    <div className="bg-white shadow-md overflow-hidden">
      <canvas ref={canvasRef} />
    </div>
  );
}