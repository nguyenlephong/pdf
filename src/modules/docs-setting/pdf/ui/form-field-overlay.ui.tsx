import React, {useCallback, useMemo, useRef, useState} from "react";
import {useDraggable} from "@dnd-kit/core";
import {Resizable} from 're-resizable';
import {FormFieldSetting} from "../types/pdf-setting.type";

interface FormFieldOverlayProps {
  field: FormFieldSetting;
  scale: number;
  isSelected: boolean;
  isDragOver?: boolean;
  onClick: (event: React.MouseEvent) => void;
  onMove: (newX: number, newY: number) => void;
  onResize: (newWidth: number, newHeight: number) => void;
  onDelete: (event: React.MouseEvent) => void;
  allFields: FormFieldSetting[];
  snapToGrid: boolean;
  gridSize: number;
  position: number;
}

const FormFieldOverlayUi: React.FC<FormFieldOverlayProps> = (props) => {
  const {
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
  } = props;
  
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
  const currentWidth = localSize?.width ?? field.box.width;
  const currentHeight = localSize?.height ?? field.box.height;

  // Check if resize would cause overlap with other fields
  const checkResizeOverlap = useCallback(
    (width: number, height: number): boolean => {
      return allFields.some((otherField) => {
        if (
          otherField.id === field.id ||
          otherField.page_number !== field.page_number
        ) {
          return false;
        }

        // Check for ANY overlap - even partial overlap is not allowed
        const box = field.box;
        const otherBox = otherField.box;
        const hasOverlap = !(
          box.x >= otherBox.x + otherBox.width ||
          box.x + width <= otherBox.x ||
          box.y >= otherBox.y + otherBox.height ||
          box.y + height <= otherBox.y
        );

        if (hasOverlap) {
          console.log(`Resize would overlap with field ${otherField.id}:`, {
            current: { x: box.x, y: box.y, width, height },
            other: {
              x: otherBox.x,
              y: otherBox.y,
              width: otherBox.width,
              height: otherBox.height,
            },
          });
        }

        return hasOverlap;
      });
    },
    [allFields, field.page_number, field.id, field.box.x, field.box.y]
  );

  const handleResizeStart = useCallback(() => {
    isResizingRef.current = true;
    // Initialize local size from field
    setLocalSize({ width: field.box.width, height: field.box.height });
  }, [field.box.width, field.box.height]);

  // Handle resize - update local state only
  const handleResize = useCallback(
    (
      _event: MouseEvent | TouchEvent,
      _direction: string,
      _refToElement: HTMLElement,
      delta: { width: number; height: number }
    ) => {
      const newWidth = field.box.width + delta.width / scale;
      const newHeight = field.box.height + delta.height / scale;

      console.log("Resizing:", { newWidth, newHeight, delta });

      // Check overlap before updating local state
      if (!checkResizeOverlap(newWidth, newHeight)) {
        setLocalSize({ width: newWidth, height: newHeight });
      } else {
        console.log("Cannot resize - would cause overlap");
      }
    },
    [field.box.width, field.box.height, scale, checkResizeOverlap]
  );

  // Handle resize stop - commit to parent
  const handleResizeStop = useCallback(
    () => {
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
      left: `${field.box.x * scale}px`,
      top: `${field.box.y * scale}px`,
      zIndex: isSelected ? 1000 : 100,
      transform:
        !isResizingRef.current && transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
    }),
    [field.box.x, field.box.y, scale, isSelected, transform]
  );

  const resizableStyle: React.CSSProperties = useMemo(
    () => ({
      border: isSelected ? "2px solid #FF383C" : "1px solid #0088FF",
      backgroundColor: isDragOver
        ? "rgba(255, 193, 7, 0.3)"
        : "rgba(33, 150, 243, 0.1)",
      boxSizing: "border-box",
      display: "flex",
      alignItems: "flex-start",
      maxHeight: 24
    }),
    [isSelected, isDragOver]
  );

  const handleStyles = useMemo(
    () => ({
      right: {
        width: 5,
        height: 5,
        right: "-4.5px",
        top: 10,
        cursor: "ew-resize",
        backgroundColor: isSelected ? "#2196F3" : "transparent",
        border: isSelected ? "1px solid #2196F3" : "none",
        borderRadius: 5
      },
      bottomRight: {
        width: "6px",
        height: "6px",
        right: "-5px",
        bottom: "-5px",
        cursor: "nwse-resize",
        backgroundColor: isSelected ? "#2196F3" : "transparent",
        border: isSelected ? "1px solid white" : "none",
        borderRadius: 3
      },
    }),
    [isSelected]
  );

  const enableResize = isSelected
    ? {
      top: false,
      right: true,
      bottom: false,
      left: false,
      topRight: false,
      bottomRight: false,
      bottomLeft: false,
      topLeft: false,
    }
    : false
  
  
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
        enable={enableResize}
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
          className={'f-end'}
        >
          <div className={'pdf__txt-field--position'}>
            {field.position}
          </div>

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
                width: "16px",
                height: "16px",
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

const FormFieldWithMemo = React.memo(FormFieldOverlayUi);
export default FormFieldWithMemo;