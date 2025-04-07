import React, { memo, useState, useEffect, useRef, useCallback, useContext } from 'react'; // Ensure React is imported for JSX
import { Handle, Position, NodeProps, useUpdateNodeInternals, useReactFlow } from 'reactflow';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button'; // Import Button
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageUploader from './ImageUploader'; // Import the uploader
import Box from '@mui/material/Box'; // For layout
import CircularProgress from '@mui/material/CircularProgress'; // For loading
import * as imageService from '@/services/imageService'; // Import image service
import * as nodeService from '@/services/nodeService'; // Import node service
// Forward declaration for context - will be defined in GraphView or a shared file
// For now, assume it provides: { onNodeLabelChange: (nodeId: string, newLabel: string) => void }
// Define the shape of the context
interface NodeInteractionContextType {
    onNodeLabelChange: (nodeId: string, newLabel: string) => void;
    onNodeSizeChange: (nodeId: string, width: number, height: number) => void;
    // Callback to update image URL in GraphView state after linking/unlinking
    onNodeImageLink: (nodeId: string, imageUrl: string | null) => void;
}
const NodeInteractionContext = React.createContext<NodeInteractionContextType | null>(null);

// Define a type for handle configuration
interface HandleConfig {
  id: string;
  position: Position;
  style?: React.CSSProperties; // Optional specific style per handle
}

// Define the sequence of potential handles
// Define the sequence of potential handles, expanding beyond the initial ones
const handleSequence: HandleConfig[] = [
  // Cardinal directions first - we now use separate IDs for source and target
  { id: 'a-source', position: Position.Right, style: { right: '-4px' } }, // Right-Center (source)
  { id: 'a-target', position: Position.Right, style: { right: '-4px' } }, // Right-Center (target)
  { id: 'b-source', position: Position.Left, style: { left: '-4px' } },   // Left-Center (source)
  { id: 'b-target', position: Position.Left, style: { left: '-4px' } },   // Left-Center (target)
  { id: 'c-source', position: Position.Top, style: { top: '-4px' } },    // Top-Center (source)
  { id: 'c-target', position: Position.Top, style: { top: '-4px' } },    // Top-Center (target)
  { id: 'd-source', position: Position.Bottom, style: { bottom: '-4px' } }, // Bottom-Center (source)
  { id: 'd-target', position: Position.Bottom, style: { bottom: '-4px' } }, // Bottom-Center (target)
  // Intermediate points (using percentages for positioning)
  { id: 'e-source', position: Position.Top, style: { top: '-4px', left: '25%' } }, // Top-Leftish (source)
  { id: 'e-target', position: Position.Top, style: { top: '-4px', left: '25%' } }, // Top-Leftish (target)
  { id: 'f-source', position: Position.Top, style: { top: '-4px', left: '75%' } }, // Top-Rightish (source)
  { id: 'f-target', position: Position.Top, style: { top: '-4px', left: '75%' } }, // Top-Rightish (target)
  { id: 'g-source', position: Position.Bottom, style: { bottom: '-4px', left: '25%' } }, // Bottom-Leftish (source)
  { id: 'g-target', position: Position.Bottom, style: { bottom: '-4px', left: '25%' } }, // Bottom-Leftish (target)
  { id: 'h-source', position: Position.Bottom, style: { bottom: '-4px', left: '75%' } }, // Bottom-Rightish (source)
  { id: 'h-target', position: Position.Bottom, style: { bottom: '-4px', left: '75%' } }, // Bottom-Rightish (target)
  { id: 'i-source', position: Position.Left, style: { left: '-4px', top: '25%' } }, // Left-Topish (source)
  { id: 'i-target', position: Position.Left, style: { left: '-4px', top: '25%' } }, // Left-Topish (target)
  { id: 'j-source', position: Position.Left, style: { left: '-4px', top: '75%' } }, // Left-Bottomish (source)
  { id: 'j-target', position: Position.Left, style: { left: '-4px', top: '75%' } }, // Left-Bottomish (target)
  { id: 'k-source', position: Position.Right, style: { right: '-4px', top: '25%' } }, // Right-Topish (source)
  { id: 'k-target', position: Position.Right, style: { right: '-4px', top: '25%' } }, // Right-Topish (target)
  { id: 'l-source', position: Position.Right, style: { right: '-4px', top: '75%' } }, // Right-Bottomish (source)
  { id: 'l-target', position: Position.Right, style: { right: '-4px', top: '75%' } }, // Right-Bottomish (target)
  // Add more if needed...
];

// Define the expected data structure for the node
interface BubbleNodeData {
  label: string;
  graphId: number; // Need graphId to update the correct node
  content?: string; // Optional content
  image_url?: string | null; // Use image_url (relative path)
  style?: React.CSSProperties; // Allow style overrides for width/height
  // Pass down the set of used handle IDs
  usedHandleIds?: Set<string>; // Set of IDs ('a', 'b', 'c', 'd', ...) currently connected
}

// Define the props specifically for BubbleNode, extending NodeProps
interface BubbleNodeProps extends NodeProps<BubbleNodeData> {
  // No longer need onLabelChange here, will get from context
}

const BubbleNode: React.FC<BubbleNodeProps> = ({ id, data, selected, isConnectable }) => {
  const context = useContext(NodeInteractionContext);
  const { onNodeLabelChange, onNodeSizeChange, onNodeImageLink } = context ?? {}; // Get callbacks from context
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(data.label);
  const inputRef = useRef<HTMLTextAreaElement>(null); // Use textarea for potential multiline later
  const [isAttaching, setIsAttaching] = useState(false); // State to show/hide uploader
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const updateNodeInternals = useUpdateNodeInternals();
  const { project } = useReactFlow(); // Get projection function for screen to flow coordinates

  // State for resizing
  const [resizing, setResizing] = useState<{ handle: string; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const nodeRef = useRef<HTMLDivElement>(null); // Ref for the main node div to get dimensions

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select(); // Select text for easy replacement
    }
  }, [isEditing]);

  // Update node data and exit editing mode
  const finishEditing = useCallback(() => {
    if (inputValue !== data.label && onNodeLabelChange) {
        // Basic validation: Trim whitespace, prevent empty label? (optional)
        const finalValue = inputValue.trim() || "Bubble"; // Default if empty
        onNodeLabelChange(id, finalValue);
        // Optional: Trigger internal update if size might change significantly
        // updateNodeInternals(id);
    }
    setIsEditing(false);
  }, [id, inputValue, data.label, onNodeLabelChange]);

  const handleDoubleClick = useCallback(() => {
    setInputValue(data.label); // Reset input value to current label
    setIsEditing(true);
  }, [data.label]);

  // Constants for padding
  const PADDING_X = 25; // Horizontal padding inside the bubble
  const PADDING_Y = 15; // Vertical padding inside the bubble
  const BORDER_WIDTH = 2; // Border width

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    setInputValue(textarea.value);

    // Auto-resize textarea height
    textarea.style.height = 'auto'; // Reset height to calculate scrollHeight correctly
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${scrollHeight}px`;

    // Calculate required node dimensions based on textarea content
    if (onNodeSizeChange) {
        // Use scrollWidth for width calculation
        const scrollWidth = textarea.scrollWidth;

        // Calculate desired node dimensions (textarea + padding + border)
        const newWidth = scrollWidth + (PADDING_X * 2) + (BORDER_WIDTH * 2);
        const newHeight = scrollHeight + (PADDING_Y * 2) + (BORDER_WIDTH * 2);

        // Call context function to update node size in GraphView state
        onNodeSizeChange(id, newWidth, newHeight);
        updateNodeInternals(id); // Notify React Flow about potential size change
    }
  };

  const handleBlur = () => {
    finishEditing();
  };

  // Finish editing on Enter, allow Shift+Enter for newline in textarea
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default Enter behavior (newline)
      finishEditing();
    } else if (event.key === 'Escape') {
        setInputValue(data.label); // Revert changes on Escape
        setIsEditing(false);
    }
  };

  // --- Resizing Logic ---
  const handleResizeStart = useCallback((event: React.MouseEvent<HTMLDivElement>, handle: string) => {
    event.stopPropagation(); // Prevent node drag
    event.preventDefault();

    if (!nodeRef.current) return;

    const nodeRect = nodeRef.current.getBoundingClientRect();
    setResizing({
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: nodeRect.width,
      startHeight: nodeRect.height,
    });

    // Add global listeners
    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  }, []); // Removed project dependency for now, calculate in move

  const handleResizeMove = useCallback((event: MouseEvent) => {
    if (!resizing || !onNodeSizeChange) return;

    const dx = event.clientX - resizing.startX;
    const dy = event.clientY - resizing.startY;

    let newWidth = resizing.startWidth;
    let newHeight = resizing.startHeight;

    // Adjust dimensions based on the handle being dragged
    if (resizing.handle.includes('R')) {
      newWidth = resizing.startWidth + dx;
    } else if (resizing.handle.includes('L')) {
      newWidth = resizing.startWidth - dx;
      // Note: Position adjustment for left handles is complex with React Flow's origin
      // We'll only adjust size for now, position updates might need onNodesChange handling
    }

    if (resizing.handle.includes('B')) {
      newHeight = resizing.startHeight + dy;
    } else if (resizing.handle.includes('T')) {
      newHeight = resizing.startHeight - dy;
      // Note: Position adjustment for top handles is complex
    }

    // Apply minimum size constraints
    const minWidth = 50; // Example minimum
    const minHeight = 50;
    newWidth = Math.max(newWidth, minWidth);
    newHeight = Math.max(newHeight, minHeight);

    // Call the callback to update the node size in GraphView
    onNodeSizeChange(id, newWidth, newHeight);
    updateNodeInternals(id); // Important to update handles/internals

  }, [resizing, id, onNodeSizeChange, updateNodeInternals]);

  const handleResizeEnd = useCallback(() => {
    setResizing(null);
    // Remove global listeners
    window.removeEventListener('mousemove', handleResizeMove);
    window.removeEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]); // handleResizeMove dependency is important

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [handleResizeMove, handleResizeEnd]);

  // Handler for image selection from uploader
  // Handler for image selection from uploader - now includes API calls
  const handleImageSelect = async (file: File) => {
      if (!onNodeImageLink) {
          console.error("onNodeImageLink callback is missing from context");
          setUploadError("Cannot link image: Context setup error.");
          return;
      }
      if (!data.graphId) {
          console.error("graphId is missing from node data");
          setUploadError("Cannot link image: Missing graph ID.");
          return;
      }

      console.log("Image selected for node:", id, file.name);
      setUploadingImage(true);
      setUploadError(null);
      setIsAttaching(false); // Hide uploader after selection

      try {
          // 1. Upload image
          const uploadedImage = await imageService.uploadImage(file);
          console.log('Image uploaded:', uploadedImage);

          // 2. Link image to node via nodeService using the returned relative URL
          await nodeService.updateNode(data.graphId, id, { image_url: uploadedImage.url });

          // 3. Update local node data state via context callback
          onNodeImageLink(id, uploadedImage.url);
          console.log(`Image linked to node ${id}`);

      } catch (err: any) {
          // 4. Handle errors
          console.error("Image upload or linking failed for node:", err);
          setUploadError('Image upload or linking failed.');
          // Revert state if needed (though onNodeImageLink wasn't called on error)
      } finally {
          setUploadingImage(false);
      }
  };

  // Handler to remove (unlink) an image
  const handleRemoveImage = async () => {
      if (!onNodeImageLink || !data.graphId || !data.image_url) return;

      // Optional: Confirmation dialog
      // if (!window.confirm("Remove attached image?")) return;

      setUploadError(null); // Clear previous errors
      // Maybe add a temporary "removing" state if needed

      try {
          // Call updateNode to set image_url to null
          // Call updateNode to set image_url to null
          await nodeService.updateNode(data.graphId, id, { image_url: null });

          // Update local state via context
          onNodeImageLink(id, null);

          // Optional: Delete image file from server if no longer needed
          // This requires more complex logic involving fetching image metadata first
          // or modifying the backend delete endpoint. For now, just unlink.
          console.log(`Image unlinked from node ${id}`);

      } catch (err: any) {
          console.error("Failed to remove image link for node:", err);
          setUploadError('Failed to remove image.');
          // Revert state? (onNodeImageLink wasn't called on error)
      }
  };

  // Basic styling for the bubble
  const bubbleStyle: React.CSSProperties = {
    padding: '15px 25px',
    borderRadius: '50%', // Make it circular/oval initially
    background: '#ffcc00', // Example background color
    border: `2px solid ${selected ? '#000' : '#aaa'}`,
    textAlign: 'center',
    minWidth: '50px', // Ensure a minimum size
    minHeight: '50px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '12px',
    width: data.style?.width ?? 'auto', // Use width from data.style if available
    height: data.style?.height ?? 'auto', // Use height from data.style if available
    boxSizing: 'border-box', // Ensure padding and border are included in width/height
    position: 'relative', // Needed for absolute positioning of handles
  };

  return (
    <div ref={nodeRef} style={bubbleStyle} onDoubleClick={handleDoubleClick}>
      {/* Connection handles - both sides can be source or target */}
      <Handle
        type="source"
        position={Position.Right}
        id="a-source"
        isConnectable={isConnectable}
        style={{ background: '#555', width: '8px', height: '8px', borderRadius: '4px', right: '-4px' }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="a-target"
        isConnectable={isConnectable}
        style={{ background: '#555', width: '8px', height: '8px', borderRadius: '4px', right: '-4px' }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="b-source"
        isConnectable={isConnectable}
        style={{ background: '#555', width: '8px', height: '8px', borderRadius: '4px', left: '-4px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="b-target"
        isConnectable={isConnectable}
        style={{ background: '#555', width: '8px', height: '8px', borderRadius: '4px', left: '-4px' }}
      />

      {/* Dynamic Handle Rendering */}
      {(() => {
        const handlesToRender: React.ReactNode[] = [];
        const renderedHandleIds = new Set<string>(); // Track IDs added in the loop
        let foundUnused = false;
        const usedIds = data.usedHandleIds || new Set<string>();

        handleSequence.forEach((handleConfig) => {
          const isUsed = usedIds.has(handleConfig.id);
          // Determine if this is a source or target handle based on the ID
          const isSourceHandle = handleConfig.id.endsWith('-source');
          const isTargetHandle = handleConfig.id.endsWith('-target');
          const handleType = isSourceHandle ? 'source' : isTargetHandle ? 'target' : 'source';

          if (isUsed) {
            // Render used handles
            handlesToRender.push(
              <Handle
                key={handleConfig.id}
                type={handleType}
                position={handleConfig.position}
                id={handleConfig.id}
                isConnectable={isConnectable}
                style={{ ...styles.dynamicHandle, ...handleConfig.style }}
              />
            );
            renderedHandleIds.add(handleConfig.id); // Mark as rendered
          } else if (!foundUnused) {
            // Render the *first* unused handle
            handlesToRender.push(
              <Handle
                key={handleConfig.id}
                type={handleType}
                position={handleConfig.position}
                id={handleConfig.id}
                isConnectable={isConnectable}
                style={{ ...styles.dynamicHandle, ...handleConfig.style }}
              />
            );
            renderedHandleIds.add(handleConfig.id); // Mark as rendered
            foundUnused = true; // Stop rendering more unused handles
          }
        });

        // We no longer need to ensure default handles are present since we've added them explicitly above
        // The dynamic handles below are for additional connection points beyond the default left and right

        return handlesToRender;
      })()}

      {/* Display label or input */}
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          style={{
            ...styles.input,
            // Apply dynamic height to textarea itself for auto-resizing effect
            height: inputRef.current ? `${inputRef.current.scrollHeight}px` : 'auto',
          }}
          rows={1} // Start with single row, it will expand
        />
      ) : (
        <div style={styles.label}>{data.label}</div>
      )}

      {/* Resize Handles (visible only when selected) */}
      {selected && (
        <>
          {/* Attach resize handlers */}
          <div style={{ ...styles.handle, ...styles.handleTL }} onMouseDown={(e) => handleResizeStart(e, 'TL')}></div>
          <div style={{ ...styles.handle, ...styles.handleTR }} onMouseDown={(e) => handleResizeStart(e, 'TR')}></div>
          <div style={{ ...styles.handle, ...styles.handleBL }} onMouseDown={(e) => handleResizeStart(e, 'BL')}></div>
          <div style={{ ...styles.handle, ...styles.handleBR }} onMouseDown={(e) => handleResizeStart(e, 'BR')}></div>
        </>
      )}

      {/* Display Attached Image or Indicator */}
      {data.image_url && !isEditing && (
          <Box sx={{ mt: 1, textAlign: 'center' }}>
              {/* Use imageService helper to get full URL */}
              <img
                  src={imageService.getImageUrl(data.image_url) || ''}
                  alt="Attached"
                  style={{ maxWidth: '80%', maxHeight: '60px', display: 'block', margin: 'auto' }}
              />
              {/* Ensure handleRemoveImage is called */}
              <Button size="small" color="error" onClick={handleRemoveImage} sx={{fontSize: '0.6rem', p: 0.2}}>
                  Remove Image
              </Button>
          </Box>
      )}

      {/* Image Uploader (conditionally rendered) */}
      {isAttaching && (
          <Box sx={{ mt: 1 }}>
              <ImageUploader
                  onFileSelect={handleImageSelect}
                  isUploading={uploadingImage}
                  uploadError={uploadError}
                  disabled={uploadingImage}
                  buttonText="Select Image File"
              />
              <Button size="small" onClick={() => setIsAttaching(false)} sx={{mt: 0.5}} disabled={uploadingImage}>Cancel Attach</Button>
          </Box>
      )}

      {/* Attach Button (visible when selected and not editing/attaching) */}
      {/* Show attach button only if no image is currently attached */}
      {selected && !isEditing && !isAttaching && !data.image_url && (
          <IconButton
              size="small"
              onClick={() => setIsAttaching(true)}
              disabled={uploadingImage}
              sx={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(255,255,255,0.7)' }}
              title="Attach Image"
          >
              {uploadingImage ? <CircularProgress size={14} /> : <AttachFileIcon fontSize="inherit" />}
          </IconButton>
      )}
    </div>
  );
};

// Use memo for performance optimization, prevents re-renders if props haven't changed
// Add styles for the input
const styles = {
    input: {
        // Width is determined by content now, remove fixed percentage
        padding: '5px',
        border: '1px solid #ccc',
        borderRadius: '3px',
        textAlign: 'center' as 'center',
        fontSize: '12px',
        boxSizing: 'border-box' as 'border-box',
        resize: 'none' as 'none',
        overflow: 'hidden', // Hide scrollbar
        minHeight: '20px',
        fontFamily: 'inherit', // Use the same font as the node
        lineHeight: 'normal', // Default line height
    },
    label: {
        maxWidth: '150px', // Prevent label from making bubble too wide initially
        wordWrap: 'break-word' as 'break-word',
        // pointerEvents: 'none' removed, label should not block interaction
    },
    // borderHandleStyle removed
    // Styles for resize handles
    handle: {
        position: 'absolute' as 'absolute',
        width: '8px',
        height: '8px',
        background: 'blue',
        border: '1px solid white',
        cursor: 'nwse-resize', // Default cursor, will adjust per handle
        zIndex: 10,
    },
    handleTL: {
        top: '-5px',
        left: '-5px',
        cursor: 'nwse-resize',
    },
    dynamicHandle: { // Base style for all connection handles
        background: '#00ccff', // Different color to distinguish
        width: '8px',
        height: '8px',
        borderRadius: '4px',
    },
    handleTR: {
        top: '-5px',
        right: '-5px',
        cursor: 'nesw-resize',
    },
    handleBL: {
        bottom: '-5px',
        left: '-5px',
        cursor: 'nesw-resize',
    },
    handleBR: {
        bottom: '-5px',
        right: '-5px',
        cursor: 'nwse-resize',
    },
};


// Export the context along with the node for GraphView to use
export { NodeInteractionContext };
export default memo(BubbleNode);