import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  FORMAT_TEXT_COMMAND,
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import { $isLinkNode } from '@lexical/link'; // Import if link functionality is added later
import { $isAtNodeEnd } from '@lexical/selection'; // Import if needed for more complex logic
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import Divider from '@mui/material/Divider';

const LowPriority = 1;

function NoteToolbar() {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  // Add more states for other formats if needed (e.g., isLink)

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format states
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));

      // TODO: Add checks for other formats like links, lists etc. if implemented
      // const node = getSelectedNode(selection);
      // const parent = node.getParent();
      // setIsLink($isLinkNode(parent) || $isLinkNode(node));
    }
  }, [activeEditor]); // Depend on activeEditor if it changes

  useEffect(() => {
    // Register listeners for toolbar updates
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        setActiveEditor(newEditor); // Update active editor reference if needed
        updateToolbar();
        return false;
      },
      LowPriority,
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    // Register listeners for undo/redo state
    return editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        setCanUndo(payload);
        return false;
      },
      LowPriority,
    );
  }, [editor]);

   useEffect(() => {
    return editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        setCanRedo(payload);
        return false;
      },
      LowPriority,
    );
  }, [editor]);


  return (
    <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider', p: 0.5, flexWrap: 'wrap' }}>
       <Tooltip title="Undo (Ctrl+Z)">
        <span> {/* Span needed for disabled button tooltip */}
            <IconButton
                disabled={!canUndo}
                onClick={() => activeEditor.dispatchCommand(UNDO_COMMAND, undefined)}
                aria-label="Undo"
                size="small"
            >
                <UndoIcon />
            </IconButton>
        </span>
       </Tooltip>
       <Tooltip title="Redo (Ctrl+Y)">
         <span>
            <IconButton
                disabled={!canRedo}
                onClick={() => activeEditor.dispatchCommand(REDO_COMMAND, undefined)}
                aria-label="Redo"
                size="small"
            >
                <RedoIcon />
            </IconButton>
         </span>
       </Tooltip>
       <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
       <Tooltip title="Bold (Ctrl+B)">
            <IconButton
                onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
                color={isBold ? 'primary' : 'default'}
                aria-label="Format Bold"
                size="small"
            >
                <FormatBoldIcon />
            </IconButton>
       </Tooltip>
       <Tooltip title="Italic (Ctrl+I)">
            <IconButton
                onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
                color={isItalic ? 'primary' : 'default'}
                aria-label="Format Italic"
                size="small"
            >
                <FormatItalicIcon />
            </IconButton>
       </Tooltip>
       <Tooltip title="Underline (Ctrl+U)">
            <IconButton
                onClick={() => activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
                color={isUnderline ? 'primary' : 'default'}
                aria-label="Format Underline"
                size="small"
            >
                <FormatUnderlinedIcon />
            </IconButton>
       </Tooltip>
       {/* Add more buttons for other formats (Link, Lists, Code, etc.) here */}
    </Box>
  );
}

export default NoteToolbar;