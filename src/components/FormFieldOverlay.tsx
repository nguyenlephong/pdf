import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useDraggable } from "@dnd-kit/core";
import { FormField } from "../types/FormField";

interface FormFieldOverlayProps {
  field: FormField;
  scale: number;
  isSelected: boolean;
  isDragOver?: boolean;
  onClick: (event: React.MouseEvent) => void;
  onMove: (newX: number, newY: number) => void;
  onResize: (newWidth: number, newHeight: number) => void;
  onDelete: (event: React.MouseEvent) => void;
  allFields: FormField[];
  snapToGrid: boolean;
  gridSize: number;
}

const resizeHandleStyle = (cursor: string): React.CSSProperties => ({
  position: "absolute",
  width: "10px",
  height: "10px",
  backgroundColor: "#2196F3",
  border: "1px solid white",
  cursor,
  zIndex: 1001,
});

const FormFieldOverlay: React.FC<FormFieldOverlayProps> = ({
  field,
  scale,
  isSelected,
  isDragOver = false,
  onClick,
  onMove,
  onResize,
  onDelete,
  allFields,
  snapToGrid,
  gridSize,
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: field.id,
    data: {
      field,
      scale,
      snapToGrid,
      gridSize,
    },
  });

  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string>("");
  const resizeStartRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const isResizingRef = useRef(false);

  // Function to check if resize would cause overlap with other fields - STRICT CHECK
  const checkResizeOverlap = useCallback((x: number, y: number, width: number, height: number, excludeFieldId: string): boolean => {
    return allFields.some((otherField) => {
      if (otherField.id === excludeFieldId || otherField.pageNumber !== field.pageNumber) {
        return false;
      }

      // Check for ANY overlap - even partial overlap is not allowed
      const hasOverlap = !(
        x >= otherField.x + otherField.width ||
        x + width <= otherField.x ||
        y >= otherField.y + otherField.height ||
        y + height <= otherField.y
      );

      if (hasOverlap) {
        console.log(`Resize would overlap with field ${otherField.id}:`, {
          current: { x, y, width, height },
          other: { x: otherField.x, y: otherField.y, width: otherField.width, height: otherField.height }
        });
      }

      return hasOverlap;
    });
  }, [allFields, field.pageNumber]);

  // Memoized mouse move handler to prevent unnecessary re-renders
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeStartRef.current) return;
    
    const deltaX = (e.clientX - resizeStartRef.current.x) / scale;
    const deltaY = (e.clientY - resizeStartRef.current.y) / scale;
    
    let newWidth = resizeStartRef.current.width;
    let newHeight = resizeStartRef.current.height;
    
    // Chỉ mở rộng theo hướng kéo, giữ nguyên góc trái-trên
    if (resizeDirection.includes("right")) {
      newWidth = Math.max(50, resizeStartRef.current.width + deltaX);
    }
    if (resizeDirection.includes("bottom")) {
      newHeight = Math.max(20, resizeStartRef.current.height + deltaY);
    }
    
    // Kiểm tra overlap với các field khác trước khi resize - STRICT CHECK
    const hasOverlap = checkResizeOverlap(field.x, field.y, newWidth, newHeight, field.id);
    
    if (!hasOverlap) {
      console.log("handleMouseMove newWidth", newWidth, "newHeight", newHeight);
      onResize(newWidth, newHeight);
    } else {
      console.log("Cannot resize - would cause overlap with another field");
    }
  }, [resizeDirection, scale, field.x, field.y, field.id, checkResizeOverlap, onResize]);

  // Memoized mouse up handler
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    isResizingRef.current = false;
    setResizeDirection("");
    resizeStartRef.current = null;
    console.log("handleMouseUp called - resize completed");
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    isResizingRef.current = true;
    setResizeDirection(direction);
    resizeStartRef.current = {
      x: e.clientX,  // Lưu vị trí chuột, không phải field.x
      y: e.clientY,  // Lưu vị trí chuột, không phải field.y
      width: field.width,
      height: field.height,
    };
    console.log("handleResizeStart", resizeStartRef.current);
  };

  const style: React.CSSProperties = useMemo(() => {
    return {
      position: "absolute",
      left: `${field.x * scale}px`,
      top: `${field.y * scale}px`,
      width: `${field.width * scale}px`,
      height: `${field.height * scale}px`,
      border: isSelected ? "2px solid #2196F3" : "1px solid #999",
      backgroundColor: isDragOver 
        ? "rgba(255, 193, 7, 0.3)" 
        : "rgba(33, 150, 243, 0.1)",
      cursor: isResizing ? "nwse-resize" : "move",
      boxSizing: "border-box",
      zIndex: isSelected ? 1000 : 100,
      // Keep box fixed while resizing: ignore drag transform during resize using ref
      transform:
        !isResizingRef.current && transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
    }
  }, [field.x, field.y, field.width, field.height, scale, isSelected, isDragOver, isResizing, transform]);

  console.log("field", field.id, "isResizing:", isResizing, "isResizingRef:", isResizingRef.current);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      // Disable drag listeners while resizing using ref to prevent box movement
      {...(!isResizingRef.current ? listeners : {})}
      {...attributes}
    >
      {/* Field label */}
      <div
        style={{
          fontSize: `${Math.max(8, field.fontSize * scale * 0.8)}px`,
          color: field.color,
          padding: "2px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {field.label}
      </div>

      {/* Delete button */}
      {isSelected && (
        <button
          onClick={(e) => {
            console.log("FormFieldOverlay: Delete button clicked for field:", field.id);
            e.stopPropagation();
            e.preventDefault();
            onDelete(e);
          }}
          onPointerDown={(e) => {
            // Chặn drag bằng cách stop propagation
            e.stopPropagation();
          }}
          style={{
            position: "absolute",
            top: "-10px",
            right: "-10px",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1002,
            pointerEvents: "auto", // Ensure button can receive events
            touchAction: "none", // Prevent touch scrolling

          }}
        >
          ×
        </button>
      )}

      {/* Resize handles - only show when selected */}
      {isSelected && (
        <>
          {/* Right handle */}
          <div
            style={{
              ...resizeHandleStyle("ew-resize"),
              right: "-5px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
            onMouseDown={(e) => handleResizeStart(e, "right")}
          />

          {/* Bottom handle */}
          <div
            style={{
              ...resizeHandleStyle("ns-resize"),
              bottom: "-5px",
              left: "50%",
              transform: "translateX(-50%)",
            }}
            onMouseDown={(e) => handleResizeStart(e, "bottom")}
          />

          {/* Bottom-right corner handle */}
          <div
            style={{
              ...resizeHandleStyle("nwse-resize"),
              bottom: "-5px",
              right: "-5px",
            }}
            onMouseDown={(e) => handleResizeStart(e, "bottom-right")}
          />
        </>
      )}
    </div>
  );
};

export default React.memo(FormFieldOverlay);