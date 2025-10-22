import React, { useState, useMemo, useCallback, useRef } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Resizable } from 're-resizable';
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

const FormFieldOverlay: React.FC<FormFieldOverlayProps> = ({
  field,
  scale,
  isSelected,
  isDragOver = false,
  onClick,
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

  // Local state for resize preview
  const [localSize, setLocalSize] = useState<{ width: number; height: number } | null>(null);
  const isResizingRef = useRef(false);

  // Get current size (local state if resizing, otherwise from field)
  const currentWidth = localSize?.width ?? field.width;
  const currentHeight = localSize?.height ?? field.height;

  // Check if resize would cause overlap with other fields
  const checkResizeOverlap = useCallback(
    (width: number, height: number): boolean => {
      return allFields.some((otherField) => {
        if (
          otherField.id === field.id ||
          otherField.pageNumber !== field.pageNumber
        ) {
          return false;
        }

        // Check for ANY overlap - even partial overlap is not allowed
        const hasOverlap = !(
          field.x >= otherField.x + otherField.width ||
          field.x + width <= otherField.x ||
          field.y >= otherField.y + otherField.height ||
          field.y + height <= otherField.y
        );

        if (hasOverlap) {
          console.log(`Resize would overlap with field ${otherField.id}:`, {
            current: { x: field.x, y: field.y, width, height },
            other: {
              x: otherField.x,
              y: otherField.y,
              width: otherField.width,
              height: otherField.height,
            },
          });
        }

        return hasOverlap;
      });
    },
    [allFields, field.pageNumber, field.id, field.x, field.y]
  );

  const handleResizeStart = useCallback(() => {
    console.log("Resize start");
    isResizingRef.current = true;
    // Initialize local size from field
    setLocalSize({ width: field.width, height: field.height });
  }, [field.width, field.height]);

  // Handle resize - update local state only
  const handleResize = useCallback(
    (
      _event: MouseEvent | TouchEvent,
      _direction: string,
      _refToElement: HTMLElement,
      delta: { width: number; height: number }
    ) => {
      const newWidth = field.width + delta.width / scale;
      const newHeight = field.height + delta.height / scale;

      console.log("Resizing:", { newWidth, newHeight, delta });

      // Check overlap before updating local state
      if (!checkResizeOverlap(newWidth, newHeight)) {
        setLocalSize({ width: newWidth, height: newHeight });
      } else {
        console.log("Cannot resize - would cause overlap");
      }
    },
    [field.width, field.height, scale, checkResizeOverlap]
  );

  // Handle resize stop - commit to parent
  const handleResizeStop = useCallback(
    (
      _event: MouseEvent | TouchEvent,
      _direction: string,
      _refToElement: HTMLElement,
      _delta: { width: number; height: number }
    ) => {
      console.log("Resize stop");
      isResizingRef.current = false;

      if (localSize) {
        // Final check before committing
        if (!checkResizeOverlap(localSize.width, localSize.height)) {
          console.log("Committing resize to parent:", localSize);
          onResize(localSize.width, localSize.height);
        } else {
          console.log("Cannot commit resize - overlap detected");
        }
      }

      // Clear local state
      setLocalSize(null);
    },
    [localSize, checkResizeOverlap, onResize]
  );

  const containerStyle: React.CSSProperties = useMemo(
    () => ({
      position: "absolute",
      left: `${field.x * scale}px`,
      top: `${field.y * scale}px`,
      zIndex: isSelected ? 1000 : 100,
      transform:
        !isResizingRef.current && transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
    }),
    [field.x, field.y, scale, isSelected, transform]
  );

  const resizableStyle: React.CSSProperties = useMemo(
    () => ({
      border: isSelected ? "2px solid #2196F3" : "1px solid #999",
      backgroundColor: isDragOver
        ? "rgba(255, 193, 7, 0.3)"
        : "rgba(33, 150, 243, 0.1)",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "flex-start",
      padding: "2px",
    }),
    [isSelected, isDragOver]
  );

  const handleStyles = useMemo(
    () => ({
      right: {
        width: "10px",
        height: "100%",
        right: "-5px",
        top: "0",
        cursor: "ew-resize",
        backgroundColor: isSelected ? "#2196F3" : "transparent",
        border: isSelected ? "1px solid white" : "none",
      },
      bottom: {
        width: "100%",
        height: "10px",
        bottom: "-5px",
        left: "0",
        cursor: "ns-resize",
        backgroundColor: isSelected ? "#2196F3" : "transparent",
        border: isSelected ? "1px solid white" : "none",
      },
      bottomRight: {
        width: "10px",
        height: "10px",
        right: "-5px",
        bottom: "-5px",
        cursor: "nwse-resize",
        backgroundColor: isSelected ? "#2196F3" : "transparent",
        border: isSelected ? "1px solid white" : "none",
      },
    }),
    [isSelected]
  );

  return (
    <div
      ref={setNodeRef}
      style={containerStyle}
      {...attributes}
    >
      <Resizable
        size={{
          width: currentWidth * scale,
          height: currentHeight * scale,
        }}
        minWidth={50 * scale}
        minHeight={20 * scale}
        enable={
          isSelected
            ? {
                top: false,
                right: false,
                bottom: false,
                left: false,
                topRight: false,
                bottomRight: true,
                bottomLeft: false,
                topLeft: false,
              }
            : false
        }
        onResizeStart={handleResizeStart}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
        handleStyles={handleStyles}
        style={resizableStyle}
        scale={scale}
      >
        <div
          {...(!isResizingRef.current ? listeners : {})}
          onClick={onClick}
          style={{
            width: "100%",
            height: "100%",
            cursor: "move",
            position: "relative",
          }}
        >
          {/* Field label */}
          <div
            style={{
              fontSize: `${Math.max(8, field.fontSize * scale * 0.8)}px`,
              color: field.color,
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
                e.stopPropagation();
                onDelete(e);
              }}
              onPointerDown={(e) => {
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
              }}
            >
              ×
            </button>
          )}
        </div>
      </Resizable>
    </div>
  );
};

export default React.memo(FormFieldOverlay);