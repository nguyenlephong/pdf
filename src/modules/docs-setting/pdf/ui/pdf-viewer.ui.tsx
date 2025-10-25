import React, {useCallback, useRef, useState} from "react";
import {Document, Page, pdfjs} from "react-pdf";
import {useDropzone} from "react-dropzone";
import {FormFieldBox, FormFieldSetting, ToolSettingConfig} from "../types/pdf-setting.type";
import FormFieldOverlay from "./form-field-overlay.ui";
import {DndContext, DragEndEvent} from "@dnd-kit/core";
import {KeyboardArrowLeft, KeyboardArrowRight} from '@mui/icons-material';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography
} from '@mui/material';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PDFViewerProps {
  config?: ToolSettingConfig;
  pdfFile: File | null;
  setPageActive: (page: number) => void;
  onUpdateLoading: (isLoading: boolean) => void;
  formFields: FormFieldSetting[];
  onAddField: (field: FormFieldSetting) => void;
  onSelectField: (field: FormFieldSetting | null) => void;
  selectedField: FormFieldSetting | null;
  onPDFLoad: (file: File) => void;
  onUpdateBoxField: (fieldId: string, updates: Partial<FormFieldBox>) => void;
  onDeleteField: (fieldId: string) => void;
}

const PdfViewerUi: React.FC<PDFViewerProps> = (props) => {
  const {
    pdfFile,
    formFields,
    onAddField,
    setPageActive,
    onSelectField,
    selectedField,
    onPDFLoad,
    onUpdateBoxField,
    onDeleteField,
    onUpdateLoading,
    config,
  } = props;
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [isFirstRender, setIsFirstRender] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(1);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [gridSize, setGridSize] = useState<number>(10);
  const [dragOverlapBehavior, setDragOverlapBehavior] = useState<'snap' | 'return'>('return');
  const [dragOverField, setDragOverField] = useState<string | null>(null);
  const [pageOriginalWidth, setPageOriginalWidth] = React.useState<number>(0);
  const [pageOriginalHeight, setPageOriginalHeight] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(true);
  
  
  const pageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    
    const handleResize = () => {
      // ✅ Lấy chiều rộng hiển thị thực tế, bỏ padding & scrollbar
      const availableWidth = el.clientWidth || el.offsetWidth || window.innerWidth;
      
      // ✅ Khi đã có kích thước PDF gốc → tính tỉ lệ hiển thị
      if (pageOriginalWidth > 0 && availableWidth > 0) {
        // ⚙️ Trừ khoảng padding hoặc margin
        const padding = 16; // hoặc 24 nếu có khoảng cách hai bên
        const fitWidth = Math.max(availableWidth - padding, 100);
        const newScale = fitWidth / pageOriginalWidth;
        
        // ✅ Giới hạn scale tối đa = 1.0 (để không phóng to quá khổ)
        setScale(Math.min(newScale, 1.0));
      }
    };
    
    handleResize();
    
    const observer = new ResizeObserver(handleResize);
    observer.observe(el);
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [pageOriginalWidth]);
  
  React.useEffect(() => {
    const wrappers = document.querySelectorAll('#pdf-page-thumbnails .pdf-thumbnail-canvas');
    wrappers.forEach((el, index) => {
      if (index + 1 === pageNumber) el.classList.add('active');
      else el.classList.remove('active');
    });
    setLoading(true);
  }, [pageNumber]);
  
  React.useEffect(() => {
    if (pdfFile && !loading && isFirstRender) {
      renderThumbnails(pdfFile).then();
      setIsFirstRender(false);
      onUpdateLoading(false);
    }
  }, [pdfFile, loading, isFirstRender, onUpdateLoading])
  
  const handlePageRenderSuccess = React.useCallback((page: any) => {
    if (!pageOriginalWidth) {
      const originalWidth = page.originalWidth || page.viewport.width;
      setPageOriginalWidth(originalWidth);
    }
    
    if (!pageOriginalHeight) {
      const originalHeight = page.originalHeight || page.viewport.height;
      setPageOriginalHeight(originalHeight);
    }
    setLoading(false)
  }, [pageOriginalWidth, pageOriginalHeight]);
  
  
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
        const newX = field.box.x + event.delta.x / fieldScale;
        const newY = field.box.y + event.delta.y / fieldScale;
        
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
      
      let newX = field.box.x + delta.x / fieldScale;
      let newY = field.box.y + delta.y / fieldScale;
      
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
        field.box.width,
        field.box.height,
        field.id
      );
      
      if (!hasOverlap) {
        onUpdateBoxField(field.id, {x: newX, y: newY});
      } else {
        if (dragOverlapBehavior === 'snap') {
          // Find a non-overlapping position near the target
          const {x: finalX, y: finalY} = findNonOverlappingPosition(
            newX,
            newY,
            field.box.width,
            field.box.height
          );
          onUpdateBoxField(field.id, {x: finalX, y: finalY});
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
        if (field.id === excludeFieldId || field.page_number !== pageNumber) {
          continue;
        }
        
        const isOverlapping = !(
          currentField.x >= field.box.x + field.box.width ||
          currentField.x + currentField.width <= field.box.x ||
          currentField.y >= field.box.y + field.box.height ||
          currentField.y + currentField.height <= field.box.y
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
        if (field.id === excludeFieldId || field.page_number !== pageNumber) {
          return false;
        }
        
        return !(
          currentField.x >= field.box.x + field.box.width ||
          currentField.x + currentField.width <= field.box.x ||
          currentField.y >= field.box.y + field.box.height ||
          currentField.y + currentField.height <= field.box.y
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
    const allowedTypes: Array<FormFieldSetting['type']> = ["text", "date", "number", "email"];
    const fieldType: FormFieldSetting['type'] = (allowedTypes.includes(rawType as any)
      ? (rawType as FormFieldSetting['type'])
      : "text");
    
    const newField: FormFieldSetting = {
      id: `field_${Date.now()}`,
      font_size: 16,
      color: "#000000",
      
      box: {
        
        x: finalX,
        y: finalY,
        width: baseWidth,
        height: baseHeight,
      },
      meta: {
        type: fieldType,
        label: "",
        name: "",
        required: false,
        placeholder: "",
        ts: Date.now(),
      },
      
      position: -1,
      
      page_number: pageNumber,
    };
    
    onAddField(newField);
  };
  
  const handleFieldSelect = (field: FormFieldSetting, event?: React.MouseEvent) => {
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
      field.box.x,
      field.box.y,
      newWidth,
      newHeight,
      fieldId
    );
    
    // Only update if there's no overlap
    if (!hasOverlap) {
      onUpdateBoxField(fieldId, {width: newWidth, height: newHeight});
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
      field.box.width,
      field.box.height,
      fieldId
    );
    
    // Only update if there's no overlap
    if (!hasOverlap) {
      onUpdateBoxField(fieldId, {x: newX, y: newY});
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
    
    let url = null;
    try {
      url = URL.createObjectURL(file)
    } catch (e) {
      // @ts-ignore
      url = file?.['url']! || '';
    }
    const pdf = await pdfjs.getDocument(url).promise;
    
    const scale = 0.2;
    
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({scale});
      
      const wrapper = document.createElement('div');
      wrapper.className = 'pdf-thumbnail-wrapper';
      
      const pageNumberText = document.createElement('div');
      pageNumberText.className = 'pdf-thumbnail-page-number';
      pageNumberText.textContent = i.toString();
      wrapper.appendChild(pageNumberText);
      
      const canvasWrapper = document.createElement('div');
      canvasWrapper.className = 'pdf-thumbnail-canvas';
      if (pageNumber === i) canvasWrapper.classList.add('active');
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      //@ts-ignore
      await page.render({canvasContext: context, viewport}).promise;
      
      canvas.addEventListener('click', () => {
        document
          .querySelectorAll('#pdf-page-thumbnails .pdf-thumbnail-canvas')
          .forEach((el) => el.classList.remove('active'));
        
        canvasWrapper.classList.add('active');
        setPageNumber(i);
        setPageActive(i);
      });
      
      canvasWrapper.appendChild(canvas);
      wrapper.appendChild(canvasWrapper);
      fragment.appendChild(wrapper);
    }
    
    container.appendChild(fragment);
    
    URL.revokeObjectURL(url);
  }
  
  const handleNextPage = () => {
    const nextPage = Math.min(numPages, pageNumber + 1)
    setPageNumber(nextPage);
    setPageActive(nextPage);
  }
  
  const handlePrevPage = () => {
    const prevPage = Math.max(1, pageNumber - 1)
    setPageNumber(prevPage);
    setPageActive(prevPage);
  }
  
  if (!pdfFile && !loading) {
    return (
      <div className="file-upload" {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the PDF file here...</p>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'}}>
            <p>Drag & drop a PDF file here, or click to select</p>
            <Button
              variant={'outlined'}
              onClick={(e) => {
                e.stopPropagation();
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf";
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
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  return (
    <Stack 
      className="pdf-viewer"
      spacing={0} 
      style={{
        visibility: loading && isFirstRender ? 'hidden' : 'visible'
      }}
    >
      {config?.enablePDFViewerToolBar && (
        <Box>
          <div className="pdf-controls-bar">
            
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
                className="pdf-drag-box"
                style={{cursor: "grab"}}
              >
                Drag: Text Field
              </div>
            </div>
            
            
            <GridControls
              snapToGrid={snapToGrid}
              setGridSize={setGridSize}
              gridSize={gridSize}
              setSnapToGrid={setSnapToGrid}
            />
            
            <OverlapControl
              dragOverlapBehavior={dragOverlapBehavior}
              setDragOverlapBehavior={setDragOverlapBehavior}
            />
            
            {/* Debug delete button */}
            {selectedField && (
              <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                <Button
                  variant={'contained'}
                  className="button danger"
                  onClick={() => {
                    console.log("Debug: Deleting selected field:", selectedField.id);
                    handleFieldDelete(selectedField.id, new MouseEvent('click') as any);
                  }}
                  style={{fontSize: "12px", padding: "5px 10px"}}
                >
                  Debug Delete Field
                </Button>
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
            ({formFields.filter((f) => f.page_number === pageNumber).length}{" "}
                fields)
          </span>
            
            </div>
          
          </div>
        </Box>
      )}
      
      <Box>
        
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 2,
            borderRadius: 2,
          }}
        >
          
          <IconButton
            color="primary"
            onClick={handlePrevPage}
            disabled={pageNumber <= 1}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#000000B2',
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#AAA9BE'
              },
            }}
          >
            <KeyboardArrowLeft fontSize="small"/>
          </IconButton>
          
          <Box sx={{flex: 1,}}>
            
            <Box
              className="pdf-toolbox"
              sx={{
                p: 2,
                borderRadius: 2,
                gap: 1.5,
                mb: 2,
              }}
            >
              <Box>
                <Typography variant="h6" textAlign="left">
                  Hình dạng
                </Typography>
                <Typography variant="body2" color="text.secondary" textAlign="left">
                  Kéo thả hình vào tài liệu
                </Typography>
              </Box>
              
              <Box flex={1}>
                <DraggableInput/>
              </Box>
            </Box>
            
            
            <Box>
              <div
                ref={containerRef}
                style={{height: pageOriginalHeight}}
              >
                {(pageOriginalHeight && loading) ? (
                  <div className={'f-center w-full'} style={{position: "absolute", height: '60%'}}>
                    <CircularProgress
                      size={48}
                      sx={{position: "absolute", color: "#1976d2", zIndex: 2}}
                    />
                  </div>
                ) : null}
                
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
                    <Document
                      file={pdfFile}
                      loading={''}
                      noData={''}
                      onLoadSuccess={onDocumentLoadSuccess}
                    >
                      <Page
                        loading={''}
                        noData={''}
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onRenderSuccess={handlePageRenderSuccess}
                      />
                    </Document>
                    
                    {!loading && snapToGrid && (
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
                    
                    {!loading && formFields
                      .filter((field) => field.page_number === pageNumber)
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
                    
                    {!loading && (
                      <div className={'pdf-page-label-btn'}>
                        {pageNumber} / {numPages}
                      </div>
                    )}
                  
                  </div>
                </DndContext>
              </div>
            </Box>
          </Box>
          
          <IconButton
            color="primary"
            onClick={handleNextPage}
            disabled={pageNumber >= numPages}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#000000B2',
              color: '#FFFFFF',
              '&:hover': {
                backgroundColor: '#AAA9BE'
              },
            }}
          >
            <KeyboardArrowRight fontSize="small"/>
          </IconButton>
        </Box>
      </Box>
      
      <Box sx={{mt: 0, pl: 4, pr: 4,}} className={'f-center'}>
        <div id="pdf-page-thumbnails" className={'pdf-pagination-list'}></div>
      </Box>
    </Stack>
  );
};

export default PdfViewerUi;


type DragOverlapBehavior = 'snap' | 'return';

interface OverlapControlProps {
  dragOverlapBehavior: DragOverlapBehavior;
  setDragOverlapBehavior: (value: DragOverlapBehavior) => void;
}

const OverlapControl: React.FC<OverlapControlProps> = (props) => {
  const {
    dragOverlapBehavior,
    setDragOverlapBehavior,
  } = props
  const handleChange = (e: SelectChangeEvent<DragOverlapBehavior>) => {
    setDragOverlapBehavior(e.target.value as DragOverlapBehavior);
  };
  
  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      <Typography variant="body2">On Overlap:</Typography>
      
      <FormControl size="small" sx={{minWidth: 180}}>
        <InputLabel id="overlap-select-label">Behavior</InputLabel>
        <Select
          labelId="overlap-select-label"
          value={dragOverlapBehavior}
          label="Behavior"
          onChange={handleChange}
        >
          <MenuItem value="snap">Snap to Side</MenuItem>
          <MenuItem value="return">Return to Original</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

interface GridControlsProps {
  snapToGrid: boolean;
  setSnapToGrid: (checked: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
}

const GridControls: React.FC<GridControlsProps> = (props) => {
  const {
    snapToGrid,
    setSnapToGrid,
    gridSize,
    setGridSize,
  } = props
  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      {/* Checkbox for Snap to Grid */}
      <FormControlLabel
        control={
          <Checkbox
            checked={snapToGrid}
            onChange={(e) => setSnapToGrid(e.target.checked)}
            size="small"
          />
        }
        label={<Typography variant="body2">Snap to Grid</Typography>}
      />
      
      {/* Grid Size input, visible only when snapToGrid is true */}
      {snapToGrid && (
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="body2">Size:</Typography>
          <TextField
            type="number"
            value={gridSize}
            onChange={(e) => setGridSize(Math.max(5, parseInt(e.target.value) || 10))}
            inputProps={{
              min: 5,
              max: 50,
              style: {textAlign: 'center', fontSize: 12},
            }}
            size="small"
            sx={{width: 70}}
          />
        </Box>
      )}
    </Box>
  );
};


const DraggableInput: React.FC = () => {
  const handleDragStart = (e: React.DragEvent<HTMLInputElement>) => {
    e.dataTransfer.setData('application/x-field-type', 'text');
    
    // Create custom drag preview
    const img = document.createElement('div');
    img.style.width = '120px';
    img.style.height = '24px';
    img.style.background = '#1976d2'; // MUI primary color
    img.style.color = 'white';
    img.style.display = 'flex';
    img.style.alignItems = 'center';
    img.style.justifyContent = 'center';
    img.style.fontSize = '12px';
    img.style.borderRadius = '4px';
    img.textContent = 'Text Field';
    document.body.appendChild(img);
    
    e.dataTransfer.setDragImage(img, 60, 12);
    setTimeout(() => document.body.removeChild(img), 0);
  };
  
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      style={{
        border: '1px solid #d6d6d7',
        borderRadius: 4,
        height: 20,
        cursor: 'grab'
      }}
    >
    
    </div>
  )
};

