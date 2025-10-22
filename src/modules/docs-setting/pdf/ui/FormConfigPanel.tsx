import React from 'react';
import { FormField } from '../types/FormField';
import { ConfigPDFService } from '../services/ConfigPDFService';

interface FormConfigPanelProps {
  selectedField: FormField | null;
  formFields: FormField[];
  pdfFile: File | null;
  onUpdateField: (fieldId: string, updates: Partial<FormField>) => void;
  onDeleteField: (fieldId: string) => void;
  onSelectField: (field: FormField) => void;
  onImportConfig: (fields: FormField[]) => void;
  onLoadPDFWithConfig: (pdfFile: File, formFields: FormField[]) => void;
}

const FormConfigPanel: React.FC<FormConfigPanelProps> = ({
  selectedField,
  formFields,
  pdfFile,
  onUpdateField,
  onDeleteField,
  onSelectField,
  onImportConfig,
  onLoadPDFWithConfig
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
        <h1>Chọn vị trí và cấu hình điền</h1>
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
          onClick={async () => {
            if (!pdfFile || formFields.length === 0) {
              alert('Please load a PDF and add form fields first');
              return;
            }
            try {
              await ConfigPDFService.exportPDFWithConfig(pdfFile, formFields);
              alert('PDF and config files exported successfully!');
            } catch (error) {
              console.error('Export error:', error);
              alert('Error exporting files');
            }
          }}
          disabled={formFields.length === 0 || !pdfFile}
        >
          Export PDF + Config
        </button>
        
        
          <button 
            className="button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.json';
              input.multiple = true;
              input.onchange = async (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (!files || files.length < 1) {
                  alert('Please select at least one file');
                  return;
                }

                let pdfFile: File | null = null;
                let configFile: File | null = null;

                // Identify PDF and JSON files
                for (let i = 0; i < files.length; i++) {
                  if (files[i].type === 'application/pdf') {
                    pdfFile = files[i];
                  } else if (files[i].type === 'application/json' || files[i].name.endsWith('.json')) {
                    configFile = files[i];
                  }
                }

                if (files.length === 1) {
                  // Single file selected
                  if (pdfFile) {
                    alert('PDF file selected. Please also select a JSON config file, or create new form fields.');
                    onLoadPDFWithConfig(pdfFile, []);
                  } else if (configFile) {
                    alert('Config file selected. Please also select the corresponding PDF file.');
                  }
                } else if (files.length === 2) {
                  // Both files selected
                  if (!pdfFile || !configFile) {
                    alert('Please select one PDF file and one JSON config file');
                    return;
                  }

                  try {
                    const { pdfFile: loadedPDF, formFields: loadedFields } = 
                      await ConfigPDFService.importPDFWithConfig(pdfFile, configFile);
                    onLoadPDFWithConfig(loadedPDF, loadedFields);
                    alert(`Successfully loaded PDF with ${loadedFields.length} form fields`);
                  } catch (error) {
                    console.error('Import error:', error);
                    alert('Error importing files');
                  }
                } else {
                  alert('Please select maximum 2 files (one PDF and one JSON config)');
                }
              };
              input.click();
            }}
          >
            Import PDF + Config
          </button>

          <button 
            className="button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf';
              input.onchange = async (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (!files || files.length !== 1) {
                  alert('Please select one PDF file');
                  return;
                }

                const pdfFile = files[0];
                if (pdfFile.type !== 'application/pdf') {
                  alert('Please select a valid PDF file');
                  return;
                }

                onLoadPDFWithConfig(pdfFile, []);
                alert('PDF file loaded. You can now add form fields or import a config file.');
              };
              input.click();
            }}
          >
            Import PDF Only
          </button>

          <button 
            className="button"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (!files || files.length !== 1) {
                  alert('Please select one JSON config file');
                  return;
                }

                const configFile = files[0];
                if (!configFile.name.endsWith('.json') && configFile.type !== 'application/json') {
                  alert('Please select a valid JSON config file');
                  return;
                }

                // Read and parse config
                try {
                  const configText = await configFile.text();
                  const config = JSON.parse(configText);
                  
                  if (!config.formFields || !Array.isArray(config.formFields)) {
                    alert('Invalid config format. Config must contain formFields array.');
                    return;
                  }

                  // Validate and clean form fields
                  const validatedFields = config.formFields.map((field: any) => ({
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
                  alert(`Successfully imported ${validatedFields.length} form fields from config. Please load the corresponding PDF file.`);
                } catch (error) {
                  console.error('Config import error:', error);
                  alert('Error importing config file');
                }
              };
              input.click();
            }}
          >
            Import Config Only
          </button>
        
        {1 < 0 && <button 
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
        </button>}
      </div>
    </div>
  );
};

export default FormConfigPanel;
