import React from "react";

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

export default DraggableInput;