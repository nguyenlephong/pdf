import React, { useState, useRef, useCallback } from 'react';
import { FormField } from '../types/FormField';

interface FormFieldOverlayProps {
  field: FormField;
  scale: number;
  isSelected: boolean;
  onClick: () => void;
  onMove: (newX: number, newY: number, isValidPosition?: boolean) => void;
  onResize: (newWidth: number, newHeight: number) => void;
  onDelete: () => void;
  allFields?: FormField[]; // Add all fields to check for overlaps
  snapToGrid?: boolean;
  gridSize?: number;
}

const FormFieldOverlay: React.FC<FormFieldOverlayProps> = ({
  field,
  scale,
  isSelected,
  onClick,
  onMove,
  onResize,
  onDelete,
  allFields = [],
  snapToGrid = false,
  gridSize = 10
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isOverlapping, setIsOverlapping] = useState(false);
  const [dragPreview, setDragPreview] = useState({ x: 0, y: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Function to check if a position would cause overlap with other fields
  const checkForOverlap = useCallback((x: number, y: number, width: number, height: number): boolean => {
    const currentField = {
      x, y, width, height, pageNumber: field.pageNumber
    };
    
    return allFields.some(otherField => {
      if (otherField.id === field.id || otherField.pageNumber !== field.pageNumber) {
        return false;
      }
      
      return !(
        currentField.x >= otherField.x + otherField.width ||
        currentField.x + currentField.width <= otherField.x ||
        currentField.y >= otherField.y + otherField.height ||
        currentField.y + currentField.height <= otherField.y
      );
    });
  }, [field.id, field.pageNumber, allFields]);

  // Function to snap position to grid
  const snapToGridPosition = useCallback((x: number, y: number): { x: number, y: number } => {
    if (!snapToGrid) return { x, y };
    
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  }, [snapToGrid, gridSize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return;

    const isResizeHandle = e.target === e.currentTarget.querySelector('.resize-handle');
    
    if (isResizeHandle) {
      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: field.width,
        height: field.height
      });
    } else {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      let newX = (e.clientX - dragStart.x) / scale;
      let newY = (e.clientY - dragStart.y) / scale;
      
      // Apply snap to grid if enabled
      const snappedPosition = snapToGridPosition(newX, newY);
      newX = snappedPosition.x;
      newY = snappedPosition.y;
      
      // Update drag preview for visual feedback
      setDragPreview({ x: newX, y: newY });
      
      // Check for overlap
      const wouldOverlap = checkForOverlap(newX, newY, field.width, field.height);
      setIsOverlapping(wouldOverlap);
      
      // Move the field with overlap information
      onMove(newX, newY, !wouldOverlap);
    } else if (isResizing) {
      const deltaX = (e.clientX - resizeStart.x) / scale;
      const deltaY = (e.clientY - resizeStart.y) / scale;
      const newWidth = Math.max(50, resizeStart.width + deltaX);
      const newHeight = Math.max(20, resizeStart.height + deltaY);
      onResize(newWidth, newHeight);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsOverlapping(false);
  };

  React.useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, scale, handleMouseMove]);

  // Determine border color based on state
  const getBorderColor = () => {
    if (isOverlapping) return '#dc3545'; // Red for overlap
    if (isSelected) return '#007bff'; // Blue for selected
    return '#ddd'; // Default gray
  };

  // Determine background color based on state
  const getBackgroundColor = () => {
    if (isOverlapping) return 'rgba(220, 53, 69, 0.1)'; // Red tint for overlap
    if (isSelected) return 'rgba(0, 123, 255, 0.1)'; // Blue tint for selected
    return 'rgba(255, 255, 255, 0.8)'; // Default white
  };

  return (
    <div
      ref={overlayRef}
      className={`form-field-overlay ${isSelected ? 'selected' : ''} ${isOverlapping ? 'overlapping' : ''}`}
      style={{
        left: field.x * scale,
        top: field.y * scale,
        width: field.width * scale,
        height: field.height * scale,
        fontSize: field.fontSize * scale,
        color: field.color,
        border: `2px solid ${getBorderColor()}`,
        backgroundColor: getBackgroundColor(),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        transition: isDragging ? 'none' : 'all 0.2s ease',
        boxShadow: isOverlapping ? '0 0 10px rgba(220, 53, 69, 0.5)' : 
                   isSelected ? '0 0 5px rgba(0, 123, 255, 0.3)' : 'none',
        zIndex: isDragging ? 1000 : (isSelected ? 100 : 10),
      }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
    >
      <span style={{ 
        fontSize: '12px', 
        fontWeight: 'bold',
        color: isOverlapping ? '#dc3545' : field.color,
        textShadow: isOverlapping ? '1px 1px 2px rgba(255,255,255,0.8)' : 'none'
      }}>
        {field.label}
        {isOverlapping && <span style={{ fontSize: '10px', marginLeft: '4px' }}>⚠️</span>}
      </span>
      {isSelected && (
        <>
          <div 
            className="resize-handle"
            style={{
              position: 'absolute',
              bottom: -5,
              right: -5,
              width: 10,
              height: 10,
              backgroundColor: '#007bff',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: 'nw-resize'
            }}
          />
          <button
            className="delete-handle"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              position: 'absolute',
              top: -5,
              right: -5,
              width: 20,
              height: 20,
              backgroundColor: '#dc3545',
              border: '2px solid white',
              borderRadius: '50%',
              cursor: 'pointer',
              color: 'white',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </>
      )}
    </div>
  );
};

export default FormFieldOverlay;
