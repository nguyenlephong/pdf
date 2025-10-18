import React from 'react';
import { FormField } from '../types/FormField';
import { createSamplePDF } from '../utils/samplePDF';

interface FormConfigPanelProps {
  selectedField: FormField | null;
  formFields: FormField[];
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  onDeleteField: (fieldId: string) => void;
  onGeneratePDF: () => void;
  onSelectField: (field: FormField) => void;
  onLoadSamplePDF: (pdfBytes: Uint8Array) => void;
  onImportConfig: (fields: FormField[]) => void;
}

const FormConfigPanel: React.FC<FormConfigPanelProps> = ({
  selectedField,
  formFields,
  onUpdateField,
  onDeleteField,
  onGeneratePDF,
  onSelectField,
  onLoadSamplePDF,
  onImportConfig
}) => {
  const handleFieldUpdate = (field: string, value: any) => {
    if (!selectedField) return;
    onUpdateField(selectedField.id, { [field]: value });
  };

  const handleDeleteSelected = () => {
    if (selectedField) {
      onDeleteField(selectedField.id);
    }
  };

  return (
    <div className="config-panel">
      <div className="config-section">
        <h3>Form Fields ({formFields.length})</h3>
        
        {formFields.length === 0 ? (
          <p>No form fields added yet. Click "Add Text Field" in the PDF viewer to get started.</p>
        ) : (
          <div className="fields-list">
            {formFields.map(field => (
              <div 
                key={field.id} 
                className={`field-item ${selectedField?.id === field.id ? 'selected' : ''}`}
                onClick={() => onSelectField(field)}
              >
                <strong>{field.label}</strong>
                <br />
                <small>{field.name} ({field.type}) - Page {field.pageNumber}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedField && (
        <div className="config-section">
          <h3>Field Configuration</h3>
          
          <div className="form-group">
            <label>Field Label:</label>
            <input
              type="text"
              value={selectedField.label}
              onChange={(e) => handleFieldUpdate('label', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Field Name:</label>
            <input
              type="text"
              value={selectedField.name}
              onChange={(e) => handleFieldUpdate('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Field Type:</label>
            <select
              value={selectedField.type}
              onChange={(e) => handleFieldUpdate('type', e.target.value)}
            >
              <option value="text">Text</option>
              <option value="date">Date</option>
              <option value="number">Number</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div className="form-group">
            <label>Placeholder:</label>
            <input
              type="text"
              value={selectedField.placeholder || ''}
              onChange={(e) => handleFieldUpdate('placeholder', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Page Number:</label>
            <input
              type="number"
              value={selectedField.pageNumber}
              onChange={(e) => handleFieldUpdate('pageNumber', parseInt(e.target.value))}
              min="1"
              max="999"
            />
          </div>

          <div className="form-group">
            <label>Position & Size:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div>
                <label>X:</label>
                <input
                  type="number"
                  value={Math.round(selectedField.x)}
                  onChange={(e) => handleFieldUpdate('x', parseInt(e.target.value))}
                  style={{ width: '60px' }}
                />
              </div>
              <div>
                <label>Y:</label>
                <input
                  type="number"
                  value={Math.round(selectedField.y)}
                  onChange={(e) => handleFieldUpdate('y', parseInt(e.target.value))}
                  style={{ width: '60px' }}
                />
              </div>
              <div>
                <label>Width:</label>
                <input
                  type="number"
                  value={Math.round(selectedField.width)}
                  onChange={(e) => handleFieldUpdate('width', parseInt(e.target.value))}
                  style={{ width: '60px' }}
                />
              </div>
              <div>
                <label>Height:</label>
                <input
                  type="number"
                  value={Math.round(selectedField.height)}
                  onChange={(e) => handleFieldUpdate('height', parseInt(e.target.value))}
                  style={{ width: '60px' }}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Font Size:</label>
            <input
              type="number"
              value={selectedField.fontSize}
              onChange={(e) => handleFieldUpdate('fontSize', parseInt(e.target.value))}
              min="8"
              max="24"
            />
          </div>

          <div className="form-group">
            <label>Text Color:</label>
            <input
              type="color"
              value={selectedField.color}
              onChange={(e) => handleFieldUpdate('color', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={selectedField.required}
                onChange={(e) => handleFieldUpdate('required', e.target.checked)}
              />
              Required Field
            </label>
          </div>

          <button 
            className="button danger"
            onClick={handleDeleteSelected}
          >
            Delete Field
          </button>
        </div>
      )}

      <div className="config-section">
        <h3>PDF Actions</h3>
        
        <button 
          className="button success"
          onClick={onGeneratePDF}
          disabled={formFields.length === 0}
        >
          Generate PDF with Form Fields
        </button>
        
        <button 
          className="button"
          onClick={async () => {
            try {
              const samplePdfBytes = await createSamplePDF();
              onLoadSamplePDF(samplePdfBytes);
            } catch (error) {
              console.error('Error creating sample PDF:', error);
              alert('Error creating sample PDF');
            }
          }}
        >
          Load Sample PDF
        </button>
        
        <button 
          className="button"
          onClick={() => {
            // TODO: Implement export configuration
            const config = {
              fields: formFields,
              timestamp: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'pdf-form-config.json';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export Configuration
        </button>
        
        <button 
          className="button"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  try {
                    const config = JSON.parse(e.target?.result as string);
                    console.log('Import configuration:', config);
                    
                    // Validate and import configuration
                    if (config.fields && Array.isArray(config.fields)) {
                      // Ensure all fields have required properties
                      const validatedFields = config.fields.map((field: any) => ({
                        id: field.id || `field_${Date.now()}_${Math.random()}`,
                        type: field.type || 'text',
                        label: field.label || 'Imported Field',
                        name: field.name || `field_${Date.now()}`,
                        x: field.x || 0,
                        y: field.y || 0,
                        width: field.width || 150,
                        height: field.height || 30,
                        fontSize: field.fontSize || 12,
                        color: field.color || '#000000',
                        required: field.required || false,
                        placeholder: field.placeholder || '',
                        pageNumber: field.pageNumber || 1
                      }));
                      
                      onImportConfig(validatedFields);
                      alert(`Successfully imported ${validatedFields.length} form fields`);
                    } else {
                      alert('Invalid configuration format');
                    }
                  } catch (error) {
                    alert('Invalid configuration file');
                    console.error('Import error:', error);
                  }
                };
                reader.readAsText(file);
              }
            };
            input.click();
          }}
        >
          Import Configuration
        </button>
      </div>
    </div>
  );
};

export default FormConfigPanel;
