import React, { useState, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useDropzone } from 'react-dropzone';
import { FormField } from '../types/FormField';
import FormFieldOverlay from './FormFieldOverlay';
// import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
// import 'react-pdf/dist/esm/Page/TextLayer.css';

// Setup PDF.js worker
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
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
  const pageRef = useRef<HTMLDivElement>(null);

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

    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      name: `field_${Date.now()}`,
      x: x / scale,
      y: y / scale,
      width: 150,
      height: 30,
      fontSize: 12,
      color: '#000000',
      required: false,
      placeholder: 'Enter text...',
      pageNumber: pageNumber
    };

    onAddField(newField);
    setIsAddingField(false);
  };

  const handleFieldSelect = (field: FormField) => {
    onSelectField(field);
  };

  const handleFieldMove = (fieldId: string, newX: number, newY: number) => {
    onUpdateField(fieldId, { x: newX, y: newY });
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
              onMove={(newX, newY) => handleFieldMove(field.id, newX, newY)}
              onResize={(newWidth, newHeight) => handleFieldResize(field.id, newWidth, newHeight)}
              onDelete={() => onDeleteField(field.id)}
            />
          ))}
      </div>

      {isAddingField && (
        <div className="adding-field-hint">
          <p>Click on the PDF to add a text field</p>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
