import React from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import Box from '@mui/material/Box';

// Basic theme and error handler (can be shared or simplified)
const editorTheme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
  // Add other styles if needed based on saved content
};

function onError(error: Error) {
  console.error("Read-only Lexical Error:", error);
}

interface ReadOnlyLexicalViewerProps {
  editorStateString: string; // The JSON string from the database
}

function ReadOnlyLexicalViewer({ editorStateString }: ReadOnlyLexicalViewerProps) {
  const initialConfig = {
    namespace: 'ReadOnlyViewer',
    theme: editorTheme,
    onError,
    editable: false, // Key difference: set editor to non-editable
    // Ensure necessary nodes are registered here if they were used during editing
    // e.g., HeadingNode, ListNode, ListItemNode, LinkNode, ImageNode etc.
    // If nodes are missing, rendering might fail or look incorrect.
    nodes: [], // Add required nodes here
    editorState: editorStateString, // Set initial state from the saved string
  };

  // Prevent errors if the string is invalid JSON or not a valid Lexical state
  try {
    // Attempt to parse to ensure it's valid JSON before passing to Lexical
    JSON.parse(editorStateString);
  } catch (e) {
    console.error("Invalid JSON string passed to ReadOnlyLexicalViewer:", editorStateString);
    // Render fallback content or an error message
    return <Box sx={{ p: 1, color: 'error.main' }}>Error loading note content.</Box>;
  }


  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable
            style={{
              outline: 'none', // No focus outline needed
              padding: '8px', // Match editor padding if desired
              userSelect: 'text', // Allow text selection
            }}
          />
        }
        // No placeholder needed for read-only view
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      {/* No HistoryPlugin or OnChangePlugin needed for read-only */}
    </LexicalComposer>
  );
}

export default ReadOnlyLexicalViewer;