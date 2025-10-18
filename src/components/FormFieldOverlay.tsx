import React, { useState, useRef } from 'react';
import { FormField } from '../types/FormField';

interface FormFieldOverlayProps {
  field: FormField;
  scale: number;
  isSelected: boolean;
  onClick: () => void;
  onMove: (newX: number, newY: number) => void;
  onResize: (newWidth: number, newHeight: number) => void;
  onDelete: () => void;
}

const FormFieldOverlay: React.FC<FormFieldOverlayProps> = ({
  field,
  scale,
  isSelected,
  onClick,
  onMove,
  onResize,
  onDelete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const overlayRef = useRef<HTMLDivElement>(null);

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
      const newX = (e.clientX - dragStart.x) / scale;
      const newY = (e.clientY - dragStart.y) / scale;
      onMove(newX, newY);
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
  }, [isDragging, isResizing, dragStart, resizeStart, scale]);

  return (
    <div
      ref={overlayRef}
      className={`form-field-overlay ${isSelected ? 'selected' : ''}`}
      style={{
        left: field.x * scale,
        top: field.y * scale,
        width: field.width * scale,
        height: field.height * scale,
        fontSize: field.fontSize * scale,
        color: field.color,
      }}
      onClick={onClick}
      onMouseDown={handleMouseDown}
    >
      <span>{field.label}</span>
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
