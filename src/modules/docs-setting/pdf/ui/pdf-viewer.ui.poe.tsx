import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useDropzone } from "react-dropzone";
import { FormFieldBox, FormFieldSetting, ToolSettingConfig } from "../types/pdf-setting.type";
import FormFieldOverlay from "./form-field-overlay.ui";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import debounce from "lodash.debounce";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PDFViewerProps {
  config?: ToolSettingConfig;
  pdfFile: File | null;
  setPageActive: (page: number) => void;
  formFields: FormFieldSetting[];
  onAddField: (field: FormFieldSetting) => void;
  onSelectField: (field: FormFieldSetting | null) => void;
  selectedField: FormFieldSetting | null;
  onPDFLoad: (file: File) => void;
  onUpdateBoxField: (fieldId: string, updates: Partial<FormFieldBox>) => void;
  onDeleteField: (fieldId: string) => void;
}

type DragOverlapBehavior = "snap" | "return";

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
    config,
  } = props;
  
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  
  // Kích thước "tự nhiên" (viewport scale=1) của trang PDF
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);
  
  // Width dùng để render canvas (tăng thì re-render, giảm dùng CSS scale để mượt)
  const [renderWidth, setRenderWidth] = useState<number>(0);
  // CSS scale để khớp với targetWidth hiện tại
  const [cssScale, setCssScale] = useState<number>(1);
  
  // Width thực tế của container (theo layout) đo bằng ResizeObserver
  const [targetWidth, setTargetWidth] = useState<number>(0);
  
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [gridSize, setGridSize] = useState<number>(10);
  const [_fieldCounter, setFieldCounter] = useState<number>(0);
  const [dragOverlapBehavior, setDragOverlapBehavior] = useState<"snap" | "return">("return");
  const [dragOverField, setDragOverField] = useState<string | null>(null);
  
  const pageContainerRef = useRef<HTMLDivElement>(null);
  
  // Scale hiệu dụng hiện tại (pixel trên mỗi "đơn vị tọa độ PDF" mà bạn đang dùng cho box)
  const effectiveScale = useMemo(() => {
    if (!naturalWidth || !renderWidth) return 1;
    return (renderWidth * cssScale) / naturalWidth;
  }, [naturalWidth, renderWidth, cssScale]);
  
  // Chiều cao hiển thị (container) sau khi scale
  const baseHeight = useMemo(() => {
    if (!naturalWidth || !naturalHeight || !renderWidth) return 0;
    return (naturalHeight / naturalWidth) * renderWidth;
  }, [naturalWidth, naturalHeight, renderWidth]);
  
  const displayHeight = useMemo(() => baseHeight * cssScale, [baseHeight, cssScale]);
  
  // Quan sát width của container để tính targetWidth
  useEffect(() => {
    const el = pageContainerRef.current;
    if (!el) return;
    
    let rafId: number | null = null;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      const next = Math.floor(entry.contentRect.width);
      if (next <= 0) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setTargetWidth(next));
    });
    ro.observe(el);
    
    // Set ban đầu
    setTargetWidth(Math.floor(el.clientWidth));
    
    return () => {
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);
  
  // Tối ưu re-render khi resize:
  // - Luôn cập nhật cssScale để khớp targetWidth
  // - Khi phóng to, chỉ re-render canvas (setRenderWidth) sau 180ms không đổi, giúp mượt và nét
  const growTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!naturalWidth || !targetWidth) return;
    
    if (!renderWidth) {
      setRenderWidth(targetWidth);
      setCssScale(1);
      return;
    }
    
    // Cập nhật cssScale theo ratio giữa targetWidth và renderWidth
    // (kể cả khi lớn hơn để canvas blur một chút trong lúc kéo resize)
    const nextCssScale = targetWidth / renderWidth;
    if (nextCssScale !== cssScale) {
      setCssScale(nextCssScale);
    }
    
    // Nếu đang phóng to (targetWidth > renderWidth), debounce re-render canvas
    if (targetWidth > renderWidth) {
      if (growTimerRef.current) window.clearTimeout(growTimerRef.current);
      growTimerRef.current = window.setTimeout(() => {
        setRenderWidth(targetWidth);
        setCssScale(1);
        growTimerRef.current = null;
      }, 180);
    } else {
      // Khi thu nhỏ thì không cần re-render canvas, hủy hẹn nếu có
      if (growTimerRef.current) {
        window.clearTimeout(growTimerRef.current);
        growTimerRef.current = null;
      }
    }
  }, [targetWidth, naturalWidth, renderWidth, cssScale]);
  
  useEffect(() => {
    const wrappers = document.querySelectorAll("#pdf-page-thumbnails .pdf-thumbnail-wrapper");
    wrappers.forEach((el, index) => {
      if (index + 1 === pageNumber) el.classList.add("active");
      else el.classList.remove("active");
    });
  }, [pageNumber]);
  
  useEffect(() => {
    if (pdfFile) renderThumbnails(pdfFile).then();
  }, [pdfFile]);
  
  // Lấy kích thước tự nhiên của Page (scale=1)
  const handlePageLoad = useCallback((pageProxy: any) => {
    try {
      const viewport = pageProxy.getViewport({ scale: 1 });
      setNaturalWidth(viewport.width);
      setNaturalHeight(viewport.height);
      // Reset renderWidth theo targetWidth hiện tại để khi đổi trang vẫn sắc nét
      if (targetWidth > 0) {
        setRenderWidth(targetWidth);
        setCssScale(1);
      }
    } catch {
      // Fallback nếu lỗi
      if (!naturalWidth) setNaturalWidth(pageProxy?.viewport?.width || 0);
      if (!naturalHeight) setNaturalHeight(pageProxy?.viewport?.height || 0);
    }
  }, [targetWidth, naturalWidth, naturalHeight]);
  
  const handleDragStart = (event: any) => {
    const field = formFields.find((f) => f.id === event.active.id);
    if (field) {
      onSelectField(field);
    }
  };
  
  const handleDragMove = (event: any) => {
    if (event.delta) {
      const field = formFields.find((f) => f.id === event.active.id);
      if (field) {
        const fieldScale = event.active.data.current?.scale || effectiveScale;
        const newX = field.box.x + event.delta.x / fieldScale;
        const newY = field.box.y + event.delta.y / fieldScale;
        
        const overlappedFieldId = getFieldUnderDrag(newX, newY, field.id);
        setDragOverField(overlappedFieldId);
      }
    }
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    const fieldData = active.data.current;
    if (fieldData && delta) {
      const field = fieldData.field;
      const fieldScale = fieldData.scale;
      const fieldSnapToGrid = fieldData.snapToGrid;
      const fieldGridSize = fieldData.gridSize;
      
      let newX = field.box.x + delta.x / fieldScale;
      let newY = field.box.y + delta.y / fieldScale;
      
      if (fieldSnapToGrid) {
        newX = Math.round(newX / fieldGridSize) * fieldGridSize;
        newY = Math.round(newY / fieldGridSize) * fieldGridSize;
      }
      
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      
      const hasOverlap = checkForOverlap(newX, newY, field.box.width, field.box.height, field.id);
      
      if (!hasOverlap) {
        onUpdateBoxField(field.id, { x: newX, y: newY });
      } else {
        if (dragOverlapBehavior === "snap") {
          const { x: finalX, y: finalY } = findNonOverlappingPosition(
            newX,
            newY,
            field.box.width,
            field.box.height
          );
          onUpdateBoxField(field.id, { x: finalX, y: finalY });
          console.log("Field snapped to avoid overlap");
        } else {
          console.log("Cannot move field - would cause overlap, returning to original position");
        }
      }
    }
    
    setDragOverField(null);
  };
  
  const handleDragCancel = () => {
    setDragOverField(null);
  };
  
  const getFieldUnderDrag = useCallback(
    (x: number, y: number, excludeFieldId?: string): string | null => {
      const currentField = { x, y, width: 0, height: 0, pageNumber };
      
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
  
  const checkForOverlap = useCallback(
    (x: number, y: number, width: number, height: number, excludeFieldId?: string): boolean => {
      const currentField = { x, y, width, height, pageNumber };
      
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
  
  const findNonOverlappingPosition = useCallback(
    (x: number, y: number, width: number, height: number): { x: number; y: number } => {
      if (!checkForOverlap(x, y, width, height)) {
        return { x, y };
      }
      
      const step = 20;
      for (let radius = step; radius <= 200; radius += step) {
        for (let angle = 0; angle < 360; angle += 45) {
          const radians = (angle * Math.PI) / 180;
          const newX = x + radius * Math.cos(radians);
          const newY = y + radius * Math.sin(radians);
          
          if (newX >= 0 && newY >= 0) {
            if (!checkForOverlap(newX, newY, width, height)) {
              return { x: newX, y: newY };
            }
          }
        }
      }
      
      return { x, y };
    },
    [checkForOverlap]
  );
  
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };
  
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        if (file.type === "application/pdf") {
          onPDFLoad(file);
          setFieldCounter(0);
          renderThumbnails(file).then();
        }
      }
    },
    [onPDFLoad]
  );
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
  });
  
  const handlePageClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains("react-pdf__Page") || target.classList.contains("pdf-page")) {
      onSelectField(null);
    }
  };
  
  const handlePageDragOver = (event: React.DragEvent<HTMLDivElement>) => {
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
    
    // Chuyển vị trí screen px -> tọa độ PDF unit
    let dropX = x / effectiveScale;
    let dropY = y / effectiveScale;
    
    if (snapToGrid) {
      dropX = Math.round(dropX / gridSize) * gridSize;
      dropY = Math.round(dropY / gridSize) * gridSize;
    }
    
    const { x: finalX, y: finalY } = findNonOverlappingPosition(dropX, dropY, baseWidth, baseHeight);
    
    const allowedTypes: Array<FormFieldSetting["type"]> = ["text", "date", "number", "email"];
    const fieldType: FormFieldSetting["type"] = allowedTypes.includes(rawType as any)
      ? (rawType as FormFieldSetting["type"])
      : "text";
    
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
    setFieldCounter((prev) => prev + 1);
  };
  
  const handleFieldSelect = (field: FormFieldSetting, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    onSelectField(field);
  };
  
  const handleFieldResize = (fieldId: string, newWidth: number, newHeight: number) => {
    const field = formFields.find((f) => f.id === fieldId);
    if (!field) return;
    
    const hasOverlap = checkForOverlap(field.box.x, field.box.y, newWidth, newHeight, fieldId);
    
    if (!hasOverlap) {
      onUpdateBoxField(fieldId, { width: newWidth, height: newHeight });
    } else {
      console.log("Cannot resize field - would cause overlap");
    }
  };
  
  const handleFieldMove = (fieldId: string, newX: number, newY: number) => {
    const field = formFields.find((f) => f.id === fieldId);
    if (!field) return;
    
    const hasOverlap = checkForOverlap(newX, newY, field.box.width, field.box.height, fieldId);
    
    if (!hasOverlap) {
      onUpdateBoxField(fieldId, { x: newX, y: newY });
    }
  };
  
  const handleFieldDelete = (fieldId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    console.log("PDFViewer: Deleting field:", fieldId);
    onDeleteField(fieldId);
    if (selectedField?.id === fieldId) {
      onSelectField(null);
    }
  };
  
  const renderThumbnails = async (file: File) => {
    const container = document.getElementById("pdf-page-thumbnails");
    if (!container) return;
    container.innerHTML = "";
    
    let url: string | null = null;
    try {
      url = URL.createObjectURL(file);
    } catch (e) {
      // @ts-ignore
      url = file?.["url"]! || "";
    }
    const pdf = await pdfjs.getDocument(url as any).promise;
    
    const scale = 0.2;
    
    const fragment = document.createDocumentFragment();
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      
      const wrapper = document.createElement("div");
      wrapper.className = "pdf-thumbnail-wrapper";
      if (pageNumber === i) wrapper.classList.add("active");
      
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      // @ts-ignore
      await page.render({ canvasContext: context, viewport }).promise;
      
      canvas.addEventListener("click", () => {
        document
          .querySelectorAll("#pdf-page-thumbnails .pdf-thumbnail-wrapper")
          .forEach((el) => el.classList.remove("active"));
        
        wrapper.classList.add("active");
        wrapper.scrollIntoView({ behavior: "smooth", inline: "center" });
        setPageNumber(i);
        setPageActive(i);
      });
      
      wrapper.appendChild(canvas);
      fragment.appendChild(wrapper);
    }
    
    container.appendChild(fragment);
    
    URL.revokeObjectURL(url);
  };
  
  if (!pdfFile) {
    return (
      <div className="file-upload" {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the PDF file here...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <p>Drag & drop a PDF file here, or click to select</p>
            <Button
              variant={"outlined"}
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
    <Stack className="pdf-viewer" spacing={0}>
      {config?.enablePDFViewerToolBar && (
        <Box>
          <div className="pdf-controls-bar">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                role="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-field-type", "text");
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
                  setTimeout(() => document.body.removeChild(img), 0);
                }}
                className="pdf-drag-box"
                style={{ cursor: "grab" }}
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
            
            {selectedField && (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Button
                  variant={"contained"}
                  className="button danger"
                  onClick={() => {
                    console.log("Debug: Deleting selected field:", selectedField.id);
                    handleFieldDelete(selectedField.id, new MouseEvent("click") as any);
                  }}
                  style={{ fontSize: "12px", padding: "5px 10px" }}
                >
                  Debug Delete Field
                </Button>
                <span style={{ fontSize: "12px", color: "#666" }}>Selected: {selectedField.label}</span>
              </div>
            )}
            
            <div className="page-controls">
              <span>Page {pageNumber} of {numPages}</span>
              <span style={{ marginLeft: "10px", fontSize: "12px", color: "#666" }}>
                ({formFields.filter((f) => f.page_number === pageNumber).length} fields)
              </span>
            </div>
          </div>
        </Box>
      )}
      
      <Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            p: 2,
            borderRadius: 2,
          }}
        >
          <IconButton
            color="primary"
            onClick={() => {
              setPageNumber(Math.max(1, pageNumber - 1));
              setPageActive(Math.max(1, pageNumber - 1));
            }}
            disabled={pageNumber <= 1}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <KeyboardArrowLeft fontSize="small" />
          </IconButton>
          
          <Box sx={{ flex: 1 }}>
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
                <DraggableInput />
              </Box>
            </Box>
            
            {/* Container đo width và set chiều cao hiển thị theo scale */}
            <Box ref={pageContainerRef}>
              <DndContext
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
              >
                <div
                  className="pdf-page"
                  onClick={handlePageClick}
                  onDragOver={handlePageDragOver}
                  onDrop={handlePageDrop}
                  style={{
                    cursor: "default",
                    position: "relative",
                    width: "100%",
                    height: displayHeight || undefined, // Chiều cao khớp với scale để tránh nhảy layout
                  }}
                >
                  {/* Lớp phóng to/thu nhỏ bằng CSS để mượt */}
                  <div
                    className="pdf-zoom-layer"
                    style={{
                      position: "absolute",
                      inset: 0,
                      transform: `scale(${cssScale})`,
                      transformOrigin: "top left",
                      width: renderWidth, // width gốc để render canvas
                      height: baseHeight, // height gốc tương ứng
                    }}
                  >
                    <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
                      <Page
                        pageNumber={pageNumber}
                        width={renderWidth}
                        scale={1}
                        onLoadSuccess={handlePageLoad}
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
                          backgroundSize: `${gridSize * effectiveScale}px ${gridSize * effectiveScale}px`,
                          zIndex: 1,
                        }}
                      />
                    )}
                    
                    {formFields
                      .filter((field) => field.page_number === pageNumber)
                      .map((field) => (
                        <FormFieldOverlay
                          key={field.id}
                          position={field.position}
                          field={field}
                          scale={effectiveScale}
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
                    
                    <Button variant={"outlined"} className={"pdf-page-label-btn"}>
                      {pageNumber} / {numPages}
                    </Button>
                  </div>
                </div>
              </DndContext>
            </Box>
          </Box>
          
          <IconButton
            color="primary"
            onClick={() => {
              setPageNumber(Math.min(numPages, pageNumber + 1));
              setPageActive(Math.min(numPages, pageNumber + 1));
            }}
            disabled={pageNumber >= numPages}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            <KeyboardArrowRight fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <Box sx={{ mt: 0 }}>
        <div id="pdf-page-thumbnails" className={"pdf-pagination-list"}></div>
      </Box>
    </Stack>
  );
};

export default PdfViewerUi;

interface OverlapControlProps {
  dragOverlapBehavior: DragOverlapBehavior;
  setDragOverlapBehavior: (value: DragOverlapBehavior) => void;
}

const OverlapControl: React.FC<OverlapControlProps> = (props) => {
  const { dragOverlapBehavior, setDragOverlapBehavior } = props;
  const handleChange = (e: SelectChangeEvent<DragOverlapBehavior>) => {
    setDragOverlapBehavior(e.target.value as DragOverlapBehavior);
  };
  
  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      <Typography variant="body2">On Overlap:</Typography>
      
      <FormControl size="small" sx={{ minWidth: 180 }}>
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
  const { snapToGrid, setSnapToGrid, gridSize, setGridSize } = props;
  return (
    <Box display="flex" alignItems="center" gap={1.5}>
      <FormControlLabel
        control={
          <Checkbox checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)} size="small" />
        }
        label={<Typography variant="body2">Snap to Grid</Typography>}
      />
      
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
              style: { textAlign: "center", fontSize: 12 },
            }}
            size="small"
            sx={{ width: 70 }}
          />
        </Box>
      )}
    </Box>
  );
};

const DraggableInput: React.FC = () => {
  const handleDragStart = (e: React.DragEvent<HTMLInputElement>) => {
    e.dataTransfer.setData("application/x-field-type", "text");
    
    const img = document.createElement("div");
    img.style.width = "120px";
    img.style.height = "24px";
    img.style.background = "#1976d2";
    img.style.color = "white";
    img.style.display = "flex";
    img.style.alignItems = "center";
    img.style.justifyContent = "center";
    img.style.fontSize = "12px";
    img.style.borderRadius = "4px";
    img.textContent = "Text Field";
    document.body.appendChild(img);
    
    e.dataTransfer.setDragImage(img, 60, 12);
    setTimeout(() => document.body.removeChild(img), 0);
  };
  
  return (
    <TextField
      fullWidth
      size="small"
      variant="outlined"
      placeholder=""
      role="button"
      draggable
      onDragStart={handleDragStart}
      InputProps={{
        sx: {
          cursor: "grab",
          height: 20,
        },
      }}
    />
  );
};