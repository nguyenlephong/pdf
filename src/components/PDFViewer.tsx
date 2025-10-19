import React, { useState, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useDropzone } from 'react-dropzone';
import { FormField } from '../types/FormField';
import FormFieldOverlay from './FormFieldOverlay';
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
// import 'react-pdf/dist/esm/Page/TextLayer.css';

// Setup PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface PDFViewerProps {
  pdfFile: File | null;
  formFields: FormField[];
  onAddField: (field: FormField) => void;
  onSelectField: (field: FormField | null) => void;
  selectedField: FormField | null;
  onPDFLoad: (file: File) => void;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  onDeleteField: (fieldId: string) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfFile,
  formFields,
  onAddField,
  onSelectField,
  selectedField,
  onPDFLoad,
  onUpdateField,
  onDeleteField
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{x: number, y: number} | null>(null);
  const [isAddingField, setIsAddingField] = useState<boolean>(false);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [gridSize, setGridSize] = useState<number>(10);
  const pageRef = useRef<HTMLDivElement>(null);

  // Function to check if a position would cause overlap with existing fields
  const checkForOverlap = useCallback((x: number, y: number, width: number, height: number, excludeFieldId?: string): boolean => {
    const currentField = { x, y, width, height, pageNumber };
    
    return formFields.some(field => {
      if (field.id === excludeFieldId || field.pageNumber !== pageNumber) {
        return false;
      }
      
      return !(
        currentField.x >= field.x + field.width ||
        currentField.x + currentField.width <= field.x ||
        currentField.y >= field.y + field.height ||
        currentField.y + currentField.height <= field.y
      );
    });
  }, [formFields, pageNumber]);

  // Function to find a non-overlapping position near the clicked position
  const findNonOverlappingPosition = useCallback((x: number, y: number, width: number, height: number): { x: number, y: number } => {
    if (!checkForOverlap(x, y, width, height)) {
      return { x, y };
    }

    // Try positions in a spiral pattern around the clicked point
    const step = 20;
    for (let radius = step; radius <= 200; radius += step) {
      for (let angle = 0; angle < 360; angle += 45) {
        const radians = (angle * Math.PI) / 180;
        const newX = x + radius * Math.cos(radians);
        const newY = y + radius * Math.sin(radians);
        
        // Ensure position is within reasonable bounds
        if (newX >= 0 && newY >= 0) {
          if (!checkForOverlap(newX, newY, width, height)) {
            return { x: newX, y: newY };
          }
        }
      }
    }
    
    // If no position found, return original position with warning
    return { x, y };
  }, [checkForOverlap]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'application/pdf') {
        onPDFLoad(file);
      }
    }
  }, [onPDFLoad]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingField) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const fieldWidth = 150;
    const fieldHeight = 30;
    const clickX = x / scale;
    const clickY = y / scale;

    // Find a non-overlapping position
    const { x: finalX, y: finalY } = findNonOverlappingPosition(clickX, clickY, fieldWidth, fieldHeight);

    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      name: `field_${Date.now()}`,
      x: finalX,
      y: finalY,
      width: fieldWidth,
      height: fieldHeight,
      fontSize: 12,
      color: '#000000',
      required: false,
      placeholder: 'Enter text...',
      pageNumber: pageNumber
    };

    onAddField(newField);
    setIsAddingField(false);
    
    // Show message if position was adjusted
    if (finalX !== clickX || finalY !== clickY) {
      console.log('Field position adjusted to avoid overlap');
    }
  };

  const handleFieldSelect = (field: FormField) => {
    onSelectField(field);
  };

  const handleFieldMove = (fieldId: string, newX: number, newY: number, isValidPosition?: boolean) => {
    // Only update position if it's valid (no overlap) or if we want to allow overlaps
    if (isValidPosition !== false) {
      onUpdateField(fieldId, { x: newX, y: newY });
    }
  };

  const handleFieldResize = (fieldId: string, newWidth: number, newHeight: number) => {
    onUpdateField(fieldId, { width: newWidth, height: newHeight });
  };

  if (!pdfFile) {
    return (
      <div className="file-upload" {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the PDF file here...</p>
        ) : (
          <div>
            <p>Drag & drop a PDF file here, or click to select</p>
            <button 
              className="button" 
              onClick={(e) => {
                e.stopPropagation();
                // Trigger file input
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.pdf';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    onPDFLoad(file);
                  }
                };
                input.click();
              }}
            >
              Choose PDF File
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        <button 
          className="button"
          onClick={() => setIsAddingField(!isAddingField)}
        >
          {isAddingField ? 'Cancel Adding Field' : 'Add Text Field'}
        </button>
        
        <div className="grid-controls" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '12px' }}>
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              style={{ marginRight: '5px' }}
            />
            Snap to Grid
          </label>
          {snapToGrid && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '12px' }}>Size:</span>
              <input
                type="number"
                value={gridSize}
                onChange={(e) => setGridSize(Math.max(5, parseInt(e.target.value) || 10))}
                min="5"
                max="50"
                style={{ width: '50px', fontSize: '12px' }}
              />
            </div>
          )}
        </div>
        
        <div className="page-controls">
          <button 
            className="button"
            onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
            disabled={pageNumber <= 1}
          >
            Previous
          </button>
          <span>Page {pageNumber} of {numPages}</span>
          <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
            ({formFields.filter(f => f.pageNumber === pageNumber).length} fields)
          </span>
          <button 
            className="button"
            onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
            disabled={pageNumber >= numPages}
          >
            Next
          </button>
        </div>

        <div className="scale-controls">
          <button 
            className="button"
            onClick={() => setScale(Math.max(0.5, scale - 0.1))}
          >
            Zoom Out
          </button>
          <span>{Math.round(scale * 100)}%</span>
          <button 
            className="button"
            onClick={() => setScale(Math.min(2.0, scale + 0.1))}
          >
            Zoom In
          </button>
        </div>
      </div>

      <div 
        ref={pageRef}
        className="pdf-page" 
        onClick={handlePageClick}
        style={{ cursor: isAddingField ? 'crosshair' : 'default' }}
      >
        <Document
          file={pdfFile}
          onLoadSuccess={onDocumentLoadSuccess}
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>

        {/* Grid overlay when snap to grid is enabled */}
        {snapToGrid && (
          <div 
            className="grid-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              backgroundImage: `
                linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${gridSize * scale}px ${gridSize * scale}px`,
              zIndex: 1
            }}
          />
        )}

        {/* Render form field overlays for current page */}
        {formFields
          .filter(field => field.pageNumber === pageNumber)
          .map(field => (
            <FormFieldOverlay
              key={field.id}
              field={field}
              scale={scale}
              isSelected={selectedField?.id === field.id}
              onClick={() => handleFieldSelect(field)}
              onMove={(newX, newY, isValidPosition) => handleFieldMove(field.id, newX, newY, isValidPosition)}
              onResize={(newWidth, newHeight) => handleFieldResize(field.id, newWidth, newHeight)}
              onDelete={() => onDeleteField(field.id)}
              allFields={formFields}
              snapToGrid={snapToGrid}
              gridSize={gridSize}
            />
          ))}
      </div>

      {isAddingField && (
        <div className="adding-field-hint">
          <p>Click on the PDF to add a text field</p>
          <p style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>
            Fields will be positioned to avoid overlaps
          </p>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
