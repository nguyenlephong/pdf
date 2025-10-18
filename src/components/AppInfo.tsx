import React, { useState } from 'react';

const AppInfo: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        className="button"
        onClick={() => setIsOpen(true)}
        style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1000 }}
      >
        ℹ️ Info
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid #007bff',
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '400px',
      zIndex: 1000,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: '#007bff' }}>PDF Form Builder</h3>
        <button 
          onClick={() => setIsOpen(false)}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '20px', 
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
        <p><strong>Cách sử dụng:</strong></p>
        <ol>
          <li>Load một file PDF hoặc tạo PDF mẫu</li>
          <li>Click "Add Text Field" để thêm trường nhập liệu</li>
          <li>Click vào PDF để đặt vị trí trường</li>
          <li>Kéo thả để di chuyển hoặc resize trường</li>
          <li>Cấu hình trường ở panel bên phải</li>
          <li>Generate PDF để tạo form template</li>
          <li>Fill dữ liệu và tạo PDF hoàn chỉnh</li>
        </ol>
        
        <p><strong>Tính năng:</strong></p>
        <ul>
          <li>✅ Drag & drop PDF files</li>
          <li>✅ Thêm text fields với kéo thả</li>
          <li>✅ Cấu hình field properties</li>
          <li>✅ Generate PDF với form fields</li>
          <li>✅ Fill dữ liệu vào PDF</li>
          <li>✅ Export/Import configuration</li>
        </ul>
        
        <p style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
          Built with React + pdf-lib + react-pdf
        </p>
      </div>
    </div>
  );
};

export default AppInfo;
