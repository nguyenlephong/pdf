import React, {useCallback, useRef, useState} from "react";
import {Document, Page, pdfjs} from "react-pdf";
import {useDropzone} from "react-dropzone";
import {FormField} from "../types/FormField";
import FormFieldOverlay from "./FormFieldOverlay";
import {DndContext, DragEndEvent} from "@dnd-kit/core";
import {Button, Col, Input, Row} from "antd";
import {LeftOutlined, RightOutlined} from "@ant-design/icons";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PDFViewerProps {
  pdfFile: File | null;
  setPageActive: (page: number) => void;
  formFields: FormField[];
  onAddField: (field: FormField) => void;
  onSelectField: (field: FormField | null) => void;
  selectedField: FormField | null;
  onPDFLoad: (file: File) => void;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  onDeleteField: (fieldId: string) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = (props) => {
  const {
    pdfFile,
    formFields,
    onAddField,
    setPageActive,
    onSelectField,
    selectedField,
    onPDFLoad,
    onUpdateField,
    onDeleteField,
  } = props;
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, _setScale] = useState<number>(1.0);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [gridSize, setGridSize] = useState<number>(10);
  const [fieldCounter, setFieldCounter] = useState<number>(0);
  const [dragOverlapBehavior, setDragOverlapBehavior] = useState<'snap' | 'return'>('return');
  const [dragOverField, setDragOverField] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const wrappers = document.querySelectorAll('#pdf-page-thumbnails .pdf-thumbnail-wrapper');
    wrappers.forEach((el, index) => {
      if (index + 1 === pageNumber) el.classList.add('active');
      else el.classList.remove('active');
    });
  }, [pageNumber]);
  
  React.useEffect(() => {
    if (pdfFile) renderThumbnails(pdfFile).then();
  }, [pdfFile])
  
  const handleDragStart = (event: any) => {
    // Select the field when starting to drag
    const field = formFields.find((f) => f.id === event.active.id);
    if (field) {
      onSelectField(field);
    }
  };
  
  const handleDragMove = (event: any) => {
    // Detect which field is being dragged over
    if (event.delta) {
      const field = formFields.find((f) => f.id === event.active.id);
      if (field) {
        const fieldScale = event.active.data.current?.scale || scale;
        const newX = field.x + event.delta.x / fieldScale;
        const newY = field.y + event.delta.y / fieldScale;
        
        const overlappedFieldId = getFieldUnderDrag(newX, newY, field.id);
        setDragOverField(overlappedFieldId);
      }
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const {active, delta} = event;
    const fieldData = active.data.current;
    
    if (fieldData && delta) {
      const field = fieldData.field;
      const fieldScale = fieldData.scale;
      const fieldSnapToGrid = fieldData.snapToGrid;
      const fieldGridSize = fieldData.gridSize;
      
      let newX = field.x + delta.x / fieldScale;
      let newY = field.y + delta.y / fieldScale;
      
      // Apply snap to grid if needed
      if (fieldSnapToGrid) {
        newX = Math.round(newX / fieldGridSize) * fieldGridSize;
        newY = Math.round(newY / fieldGridSize) * fieldGridSize;
      }
      
      // Ensure position is not negative
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      
      // Check for overlap at new position
      const hasOverlap = checkForOverlap(
        newX,
        newY,
        field.width,
        field.height,
        field.id
      );
      
      if (!hasOverlap) {
        onUpdateField(field.id, {x: newX, y: newY});
      } else {
        if (dragOverlapBehavior === 'snap') {
          // Find a non-overlapping position near the target
          const {x: finalX, y: finalY} = findNonOverlappingPosition(
            newX,
            newY,
            field.width,
            field.height
          );
          onUpdateField(field.id, {x: finalX, y: finalY});
          console.log("Field snapped to avoid overlap");
        } else {
          // Return to original position
          console.log("Cannot move field - would cause overlap, returning to original position");
        }
      }
    }
    
    setDragOverField(null);
  };
  
  const handleDragCancel = () => {
    setDragOverField(null);
  };
  
  // Function to detect which field is being dragged over
  const getFieldUnderDrag = useCallback(
    (x: number, y: number, excludeFieldId?: string): string | null => {
      const currentField = {x, y, width: 0, height: 0, pageNumber};
      
      for (const field of formFields) {
        if (field.id === excludeFieldId || field.pageNumber !== pageNumber) {
          continue;
        }
        
        const isOverlapping = !(
          currentField.x >= field.x + field.width ||
          currentField.x + currentField.width <= field.x ||
          currentField.y >= field.y + field.height ||
          currentField.y + currentField.height <= field.y
        );
        
        if (isOverlapping) {
          return field.id;
        }
      }
      return null;
    },
    [formFields, pageNumber]
  );
  
  // Function to check if a position would cause overlap with existing fields
  const checkForOverlap = useCallback(
    (
      x: number,
      y: number,
      width: number,
      height: number,
      excludeFieldId?: string
    ): boolean => {
      const currentField = {x, y, width, height, pageNumber};
      
      return formFields.some((field) => {
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
    },
    [formFields, pageNumber]
  );
  
  // Function to find a non-overlapping position near the clicked position
  const findNonOverlappingPosition = useCallback(
    (
      x: number,
      y: number,
      width: number,
      height: number
    ): { x: number; y: number } => {
      if (!checkForOverlap(x, y, width, height)) {
        return {x, y};
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
              return {x: newX, y: newY};
            }
          }
        }
      }
      
      // If no position found, return original position with warning
      return {x, y};
    },
    [checkForOverlap]
  );
  
  const onDocumentLoadSuccess = ({numPages}: { numPages: number }) => {
    setNumPages(numPages);
  };
  
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file.type === "application/pdf") {
          onPDFLoad(file);
          setFieldCounter(0); // Reset counter when new PDF is loaded
          renderThumbnails(file).then();
        }
      }
    },
    [onPDFLoad]
  );
  
  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });
  
  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Deselect field when clicking on empty area
    const target = event.target as HTMLElement;
    if (
      target.classList.contains("react-pdf__Page") ||
      target.classList.contains("pdf-page")
    ) {
      onSelectField(null);
    }
  };
  
  // HTML5 drag and drop: drop a toolbox item onto the page to create a field
  const handlePageDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    // Allow drop when dragging our toolbox items
    if (event.dataTransfer.types.includes("application/x-field-type")) {
      event.preventDefault();
    }
  };
  
  const handlePageDrop = (event: React.DragEvent<HTMLDivElement>) => {
    const rawType = event.dataTransfer.getData("application/x-field-type");
    if (!rawType) return;
    
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const baseWidth = 150;
    const baseHeight = 30;
    
    let dropX = x / scale;
    let dropY = y / scale;
    
    // Snap to grid if enabled
    if (snapToGrid) {
      dropX = Math.round(dropX / gridSize) * gridSize;
      dropY = Math.round(dropY / gridSize) * gridSize;
    }
    
    const {x: finalX, y: finalY} = findNonOverlappingPosition(
      dropX,
      dropY,
      baseWidth,
      baseHeight
    );
    
    // Narrow allowed types
    const allowedTypes: Array<FormField['type']> = ["text", "date", "number", "email"];
    const fieldType: FormField['type'] = (allowedTypes.includes(rawType as any)
      ? (rawType as FormField['type'])
      : "text");
    
    const newField: FormField = {
      id: `field_${Date.now()}`,
      ts: Date.now(),
      type: fieldType,
      label: `Field ${fieldCounter}`,
      name: `field_${fieldCounter}`,
      x: finalX,
      y: finalY,
      width: baseWidth,
      height: baseHeight,
      fontSize: 12,
      color: "#000000",
      required: false,
      placeholder: "Enter text...",
      pageNumber: pageNumber,
      position: -1
    };
    
    onAddField(newField);
    setFieldCounter((prev) => prev + 1);
  };
  
  const handleFieldSelect = (field: FormField, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    onSelectField(field);
  };
  
  const handleFieldResize = (
    fieldId: string,
    newWidth: number,
    newHeight: number
  ) => {
    const field = formFields.find((f) => f.id === fieldId);
    if (!field) return;
    
    // Check for overlap at new size
    const hasOverlap = checkForOverlap(
      field.x,
      field.y,
      newWidth,
      newHeight,
      fieldId
    );
    
    // Only update if there's no overlap
    if (!hasOverlap) {
      onUpdateField(fieldId, {width: newWidth, height: newHeight});
    } else {
      console.log("Cannot resize field - would cause overlap");
    }
  };
  
  const handleFieldMove = (fieldId: string, newX: number, newY: number) => {
    const field = formFields.find((f) => f.id === fieldId);
    if (!field) return;
    
    // Check for overlap at new position
    const hasOverlap = checkForOverlap(
      newX,
      newY,
      field.width,
      field.height,
      fieldId
    );
    
    // Only update if there's no overlap
    if (!hasOverlap) {
      onUpdateField(fieldId, {x: newX, y: newY});
    }
  };
  
  const handleFieldDelete = (fieldId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    console.log("PDFViewer: Deleting field:", fieldId); // For debugging
    onDeleteField(fieldId);
    if (selectedField?.id === fieldId) {
      onSelectField(null);
    }
  };
  
  const renderThumbnails = async (file: File) => {
    
    const container = document.getElementById('pdf-page-thumbnails');
    if (!container) return;
    container.innerHTML = '';
    
    const url = URL.createObjectURL(file);
    const pdf = await pdfjs.getDocument(url).promise;
    
    const scale = 0.2;
    
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({scale});
      
      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-thumbnail-wrapper';
      if (pageNumber === i) wrapper.classList.add('active');
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      //@ts-ignore
      await page.render({canvasContext: context, viewport}).promise;
      
      canvas.addEventListener('click', () => {
        document
          .querySelectorAll('#pdf-page-thumbnails .pdf-thumbnail-wrapper')
          .forEach((el) => el.classList.remove('active'));
        
        wrapper.classList.add('active');
        wrapper.scrollIntoView({behavior: 'smooth', inline: 'center'});
        setPageNumber(i);
        setPageActive(i);
      });
      
      wrapper.appendChild(canvas);
      fragment.appendChild(wrapper);
    }
    
    container.appendChild(fragment);
    
    URL.revokeObjectURL(url);
  }
  
  if (!pdfFile) {
    return (
      <div className="file-upload" {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the PDF file here...</p>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'}}>
            <p>Drag & drop a PDF file here, or click to select</p>
            <Button
              type={'primary'}
              onClick={(e) => {
                e.stopPropagation();
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf";
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    onPDFLoad(file);
                    setFieldCounter(0);
                  }
                };
                input.click();
              }}
            >
              Choose PDF File
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <Row className="pdf-viewer" gutter={[12, 12]}>
      {1 < 0 && (
        <Col xs={24}>
          <div className="pdf-controls">
            
            <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
              <div
                role="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-field-type", "text");
                  // Optional: set drag image
                  const img = document.createElement("div");
                  img.style.width = "120px";
                  img.style.height = "24px";
                  img.style.background = "#2196F3";
                  img.style.color = "white";
                  img.style.display = "flex";
                  img.style.alignItems = "center";
                  img.style.justifyContent = "center";
                  img.style.fontSize = "12px";
                  img.style.borderRadius = "4px";
                  img.textContent = "Text Field";
                  document.body.appendChild(img);
                  e.dataTransfer.setDragImage(img, 60, 12);
                  // Remove after a tick
                  setTimeout(() => document.body.removeChild(img), 0);
                }}
                className="button"
                style={{cursor: "grab"}}
              >
                Drag: Text Field
              </div>
            </div>
            
            
            <div
              className="grid-controls"
              style={{display: "flex", alignItems: "center", gap: "12px"}}
            >
              <label style={{fontSize: "12px"}}>
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  style={{marginRight: "5px"}}
                />
                Snap to Grid
              </label>
              {snapToGrid && (
                <div style={{display: "flex", alignItems: "center", gap: "5px"}}>
                  <span style={{fontSize: "12px"}}>Size:</span>
                  <input
                    type="number"
                    value={gridSize}
                    onChange={(e) =>
                      setGridSize(Math.max(5, parseInt(e.target.value) || 10))
                    }
                    min="5"
                    max="50"
                    style={{width: "50px", fontSize: "12px"}}
                  />
                </div>
              )}
            </div>
            
            <div
              className="drag-overlap-controls"
              style={{display: "flex", alignItems: "center", gap: "12px"}}
            >
              <label style={{fontSize: "12px"}}>
                <span style={{marginRight: "5px"}}>On Overlap:</span>
                <select
                  value={dragOverlapBehavior}
                  onChange={(e) => setDragOverlapBehavior(e.target.value as 'snap' | 'return')}
                  style={{fontSize: "12px"}}
                >
                  <option value="snap">Snap to Side</option>
                  <option value="return">Return to Original</option>
                </select>
              </label>
            </div>
            
            {/* Debug delete button */}
            {selectedField && (
              <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                <button
                  className="button danger"
                  onClick={() => {
                    console.log("Debug: Deleting selected field:", selectedField.id);
                    handleFieldDelete(selectedField.id, new MouseEvent('click') as any);
                  }}
                  style={{fontSize: "12px", padding: "5px 10px"}}
                >
                  Debug Delete Field
                </button>
                <span style={{fontSize: "12px", color: "#666"}}>
              Selected: {selectedField.label}
            </span>
              </div>
            )}
            
            <div className="page-controls">
            
            <span>
            Page {pageNumber} of {numPages}
          </span>
              <span style={{marginLeft: "10px", fontSize: "12px", color: "#666"}}>
            ({formFields.filter((f) => f.pageNumber === pageNumber).length}{" "}
                fields)
          </span>
            
            </div>
          
          </div>
        </Col>
      )}
      
      <Col xs={24} className={"w-full"}>
        
        <Row className={"w-full f-center"} gutter={[12, 12]}>
          
          <Col xs={4} lg={3} xxl={2}>
            <div className={'f-center h-full'}>
              <Button
                type="primary" shape="circle" icon={<LeftOutlined/>}
                onClick={() => {
                  setPageNumber(Math.max(1, pageNumber - 1))
                  setPageActive(Math.max(1, pageNumber - 1));
                }}
                disabled={pageNumber <= 1}
              >
              </Button>
            </div>
          </Col>
          
          <Col xs={16} lg={18} xxl={20}>
            <Row gutter={[12, 12]} className={'w-full'}>
              <Col xs={24}>
                <div className={"pdf-toolbox"}>
                  <div>
                    <h3 className={'pdf-t3 t-left'}>Hình dạng</h3>
                    <p className={'pdf-txt-body t-left pdf-mt-12'}>Kéo thả hình vào tài liệu</p>
                  </div>
                  <Input
                    role="button"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/x-field-type", "text");
                      // Optional: set drag image
                      const img = document.createElement("div");
                      img.style.width = "120px";
                      img.style.height = "24px";
                      img.style.background = "#2196F3";
                      img.style.color = "white";
                      img.style.display = "flex";
                      img.style.alignItems = "center";
                      img.style.justifyContent = "center";
                      img.style.fontSize = "12px";
                      img.style.borderRadius = "4px";
                      img.textContent = "Text Field";
                      document.body.appendChild(img);
                      e.dataTransfer.setDragImage(img, 60, 12);
                      // Remove after a tick
                      setTimeout(() => document.body.removeChild(img), 0);
                    }}
                    style={{cursor: "grab", flex: 1}}
                  />
                </div>
              </Col>
              
              <Col xs={24}>
                <DndContext
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                >
                  <div
                    ref={pageRef}
                    className="pdf-page"
                    onClick={handlePageClick}
                    onDragOver={handlePageDragOver}
                    onDrop={handlePageDrop}
                    style={{
                      cursor: "default",
                      position: "relative",
                    }}
                  >
                    <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
                      <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                    
                    {snapToGrid && (
                      <div
                        className="grid-overlay"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          pointerEvents: "none",
                          backgroundImage: `
                  linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
                `,
                          backgroundSize: `${gridSize * scale}px ${gridSize * scale}px`,
                          zIndex: 1,
                        }}
                      />
                    )}
                    
                    {formFields
                      .filter((field) => field.pageNumber === pageNumber)
                      .map((field) => (
                        <FormFieldOverlay
                          key={field.id}
                          position={field.position}
                          field={field}
                          scale={scale}
                          isSelected={selectedField?.id === field.id}
                          isDragOver={dragOverField === field.id}
                          onClick={(e) => handleFieldSelect(field, e)}
                          onMove={(newX, newY) => handleFieldMove(field.id, newX, newY)}
                          onResize={(newWidth, newHeight) =>
                            handleFieldResize(field.id, newWidth, newHeight)
                          }
                          onDelete={(e) => handleFieldDelete(field.id, e)}
                          allFields={formFields}
                          snapToGrid={snapToGrid}
                          gridSize={gridSize}
                        />
                      ))}
                    
                    <Button className={'pdf-page-label-btn'}>{pageNumber} / {numPages}</Button>
                  </div>
                </DndContext>
              
              </Col>
            </Row>
          
          </Col>
          
          <Col xs={4} lg={3} xxl={2}>
            <div className={'f-center h-full'}>
              <Button
                type="primary" shape="circle" icon={<RightOutlined/>}
                onClick={() => {
                  setPageNumber(Math.min(numPages, pageNumber + 1))
                  setPageActive(Math.min(numPages, pageNumber + 1))
                }}
                disabled={pageNumber >= numPages}
              >
              </Button>
            </div>
          </Col>
        
        </Row>
      
      </Col>
      
      <Col xs={24} className={'pdf-pagination-section'}>
        <div id="pdf-page-thumbnails" className={'pdf-pagination-list'}></div>
      </Col>
    </Row>
  );
};

export default PDFViewer;
