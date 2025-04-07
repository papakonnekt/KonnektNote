import React, { useRef, useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

interface ImageUploaderProps {
  onFileSelect: (file: File) => void; // Callback when a file is selected
  buttonText?: string;
  buttonVariant?: 'text' | 'outlined' | 'contained';
  buttonSize?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  // Optional props for showing upload status if handled by parent
  isUploading?: boolean;
  uploadError?: string | null;
}

function ImageUploader({
  onFileSelect,
  buttonText = 'Attach Image',
  buttonVariant = 'outlined',
  buttonSize = 'small',
  disabled = false,
  isUploading = false,
  uploadError = null,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInternalError(null); // Clear previous internal errors
    const file = event.target.files?.[0];
    if (file) {
       // Basic validation (can add more checks here if needed)
       if (!file.type.startsWith('image/')) {
           setInternalError('Invalid file type. Please select an image.');
           setSelectedFileName(null);
           if(fileInputRef.current) fileInputRef.current.value = ""; // Clear input
           return;
       }
       // Consider adding size check here too if desired before calling parent

      setSelectedFileName(file.name);
      onFileSelect(file); // Pass the selected file to the parent
    } else {
      setSelectedFileName(null);
    }
     // Clear the input value so the same file can be selected again if needed
     if(fileInputRef.current) fileInputRef.current.value = "";
  }, [onFileSelect]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: 1 }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*" // Accept common image types
        disabled={disabled || isUploading}
      />
      <Button
        variant={buttonVariant}
        size={buttonSize}
        onClick={handleButtonClick}
        disabled={disabled || isUploading}
        startIcon={isUploading ? <CircularProgress size={16} /> : null}
      >
        {isUploading ? 'Uploading...' : buttonText}
      </Button>
      {/* Display selected file name or errors */}
      {selectedFileName && !isUploading && !uploadError && !internalError && (
        <Typography variant="caption" color="text.secondary">
          Selected: {selectedFileName}
        </Typography>
      )}
       {internalError && (
           <Alert severity="warning" sx={{ fontSize: '0.8rem', p: '0 8px' }}>{internalError}</Alert>
       )}
       {uploadError && (
           <Alert severity="error" sx={{ fontSize: '0.8rem', p: '0 8px' }}>{uploadError}</Alert>
       )}
    </Box>
  );
}

export default ImageUploader;