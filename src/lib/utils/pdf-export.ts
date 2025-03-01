// src/lib/utils/pdf-export.ts
import { jsPDF } from 'jspdf';
import { fabric } from 'fabric';
import { Page, Project } from '@/lib/store/useStore';

/**
 * Convert a fabric canvas to a data URL
 */
const canvasToImage = (canvas: fabric.Canvas): string => {
  // Convert canvas to image
  return canvas.toDataURL({
    format: 'png',
    quality: 1
  });
};

/**
 * Render a page to a temporary canvas
 */
const renderPageToCanvas = (page: Page): Promise<string> => {
  return new Promise((resolve) => {
    // Create a temporary canvas element
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = page.size.width;
    tempCanvas.height = page.size.height;
    
    // Create a fabric canvas
    const fabricCanvas = new fabric.Canvas(tempCanvas, {
      backgroundColor: 'white',
      preserveObjectStacking: true
    });
    
    // Add elements to the canvas
    const elementsToAdd = page.elements.length;
    let elementsAdded = 0;
    
    if (elementsToAdd === 0) {
      // No elements to add, resolve with empty canvas
      const dataUrl = canvasToImage(fabricCanvas);
      fabricCanvas.dispose();
      resolve(dataUrl);
      return;
    }
    
    // Add each element
    page.elements.forEach((element) => {
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
        fabricCanvas.add(fabricObj);
        elementsAdded++;
        
        if (elementsAdded === elementsToAdd) {
          // All elements added, resolve with canvas data URL
          fabricCanvas.renderAll();
          const dataUrl = canvasToImage(fabricCanvas);
          fabricCanvas.dispose();
          resolve(dataUrl);
        }
      } else {
        elementsAdded++;
        
        if (elementsAdded === elementsToAdd) {
          // All elements processed, resolve with canvas data URL
          fabricCanvas.renderAll();
          const dataUrl = canvasToImage(fabricCanvas);
          fabricCanvas.dispose();
          resolve(dataUrl);
        }
      }
    });
  });
};

/**
 * Generate a PDF from a project
 */
export const generatePDF = async (project: Project): Promise<Blob> => {
  // Create PDF with the size of the first page
  const firstPage = project.pages[0];
  
  const pdf = new jsPDF({
    orientation: firstPage.size.width > firstPage.size.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [firstPage.size.width, firstPage.size.height],
    compress: true
  });
  
  // Add each page to the PDF
  for (let i = 0; i < project.pages.length; i++) {
    const page = project.pages[i];
    
    // If not the first page, add a new page to the PDF
    if (i > 0) {
      pdf.addPage([page.size.width, page.size.height]);
    }
    
    // Render the page to a canvas
    const pageImage = await renderPageToCanvas(page);
    
    // Add the image to the PDF
    pdf.addImage(
      pageImage,
      'PNG',
      0,
      0,
      page.size.width,
      page.size.height
    );
  }
  
  return pdf.output('blob');
};

/**
 * Export a project to PDF and trigger download
 */
export const exportProjectToPDF = async (project: Project): Promise<void> => {
  try {
    const pdfBlob = await generatePDF(project);
    
    // Create a download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name || 'untitled'}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
};