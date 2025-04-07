{/* src/pages/NotesPage.jsx */}
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'; // Add useCallback
import { useNavigate } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
// import ReactQuill from 'react-quill'; // REMOVED
// import 'react-quill/dist/quill.snow.css'; // REMOVED
import LinearProgress from '@mui/material/LinearProgress'; // Import LinearProgress
import IconButton from '@mui/material/IconButton'; // Import IconButton
import ViewListIcon from '@mui/icons-material/ViewList'; // Icon for list toggle
import ViewModuleIcon from '@mui/icons-material/ViewModule'; // Icon when list is hidden
// Import uploadAttachment API function - WILL BE REPLACED
// import { fetchNotes, fetchNoteById, createNote, updateNote, deleteNote, setAuthToken, uploadAttachment } from '../services/api';
// Import OUR services and context
import * as noteService from '@/services/noteService'; // Use absolute path alias
import * as imageService from '@/services/imageService'; // Use absolute path alias
import { useAuth } from '../context/AuthContext'; // Use OUR AuthContext
import NoteToolbar from '../components/NoteToolbar'; // Import the toolbar
import ReadOnlyLexicalViewer from '../components/ReadOnlyLexicalViewer'; // Import the read-only viewer
import { debounce } from 'lodash'; // Import debounce
import ImageUploader from '../components/ImageUploader'; // Import the new uploader

// Define type for selected note state
interface NoteDetails extends noteService.Note {
  // Add any additional client-side properties if needed later
}
// Lexical Imports
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'; // Use named import
import { EditorState } from 'lexical';
// TODO: Import necessary nodes (HeadingNode, ListNode, ListItemNode, LinkNode, ImageNode etc.)
// import { HeadingNode, QuoteNode } from "@lexical/rich-text";
// import { ListItemNode, ListNode } from "@lexical/list";
// import { CodeHighlightNode, CodeNode } from "@lexical/code";
// import { AutoLinkNode, LinkNode } from "@lexical/link";

// Lexical Theme (basic example, customize later)
const editorTheme = {
  // theme example
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-paragraph',
  // ... other theme classes
};

// Lexical Error Handler
function onError(error: Error) {
  console.error("Lexical Error:", error);
}

// Placeholder for initial editor state (empty)
const initialJsonString = '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

const listWidth = 300; // Define a fixed width for the list section
const collapsedListWidth = 72; // Use the same collapsed width as the main sidebar

// TODO: Add TypeScript types for state and props
function NotesView() { // Renamed from NotesPage
  const [notes, setNotes] = useState<noteService.Note[]>([]); // Use specific type
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null); // Add type
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null); // Add type
  const [selectedNote, setSelectedNote] = useState<NoteDetails | null>(null); // Use defined type
  const [isEditing, setIsEditing] = useState(false);
  const [isNewNote, setIsNewNote] = useState(false);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState<string>(initialJsonString); // Store serialized JSON state
  const editorStateRef = useRef<EditorState | null>(null); // Initialize with null
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null); // Add type
  // const [saveLoading, setSaveLoading] = useState(false); // Replaced by autosave
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Ref for status timeout
  const [uploadingImage, setUploadingImage] = useState(false); // State for image upload loading
  const [isListCollapsed, setIsListCollapsed] = useState(false); // State for list collapse
  const [isHoveringList, setIsHoveringList] = useState(false); // Hover state for list
  const navigate = useNavigate();
  const { user, token } = useAuth(); // Get user/token from OUR context
  // const fileInputRef = useRef<HTMLInputElement | null>(null); // No longer needed
  const editorRef = useRef<any>(null); // Initialize with null

  // --- Lexical Editor Config ---
  const initialConfig = {
    namespace: 'MyEditor',
    theme: editorTheme,
    onError,
    // TODO: Add nodes needed (e.g., HeadingNode, ListNode, LinkNode, ImageNode)
    nodes: [],
    // Set initial state from string
    editorState: editorContent,
  };

  // --- Effects ---

  // Load notes list - Adapt to use our context/service
  useEffect(() => {
    // Use token from our useAuth hook
    if (!token) {
      console.log("Not authenticated, redirecting to login.");
      navigate('/login');
      return;
    }
    loadNotes();
  }, [token, navigate]); // Depend on our token

  // Load selected note detail - Adapt to use our service
  useEffect(() => {
    if (!selectedNoteId) {
      if (!isNewNote) {
          setSelectedNote(null);
          setIsEditing(false);
          setEditorTitle(''); // Clear title when deselecting
          setEditorContent(initialJsonString); // Clear content
      }
      return;
    }
    if (isEditing) return; // Don't reload if already editing

    setIsNewNote(false);
    const loadNoteDetail = async () => {
      try {
        setLoadingDetail(true);
        setDetailError(null);
        // Use our noteService
        const fetchedNote = await noteService.getNote(selectedNoteId);
        setSelectedNote(fetchedNote);
        setEditorTitle(fetchedNote.title || ''); // Handle potential null title
        // Load content - Assuming fetchedNote.content is a JSON string from Lexical
        setEditorContent(fetchedNote.content || initialJsonString);
        // The LexicalComposer will use this string in its initialConfig when the key changes
        setIsEditing(false);
      } catch (err: any) { // Add type
        console.error(`Failed to fetch note ${selectedNoteId}:`, err);
        setDetailError('Failed to load note details.');
        setSelectedNote(null);
        setEditorTitle('');
        setEditorContent(initialJsonString);
      } finally {
        setLoadingDetail(false);
      }
    };

    loadNoteDetail();
  }, [selectedNoteId, isEditing]); // Removed navigate dependency

  // --- Data Fetching ---
  const loadNotes = useCallback(async () => { // Wrap in useCallback
      try {
        setLoadingList(true);
        setListError(null);
        // Use our noteService
        const fetchedNotes = await noteService.getNotes();
        setNotes(fetchedNotes);
      } catch (err: any) { // Add type
        console.error("Failed to fetch notes:", err);
        setListError('Failed to load notes. Please try again later.');
      } finally {
        setLoadingList(false);
      }
    }, []); // Empty dependency array

  // --- Handlers ---
  const handleNoteSelect = (id: number) => { // Add type
    if (isEditing) {
        // TODO: Prompt user if they want to discard changes?
        console.log("Discarding changes to select new note");
    }
    setSelectedNoteId(id);
    setIsEditing(false); // Exit edit mode when selecting
    setIsNewNote(false);
    setDetailError(null); // Clear errors on selection change
  };

  const handleNewNote = () => {
    if (isEditing) {
        // TODO: Prompt user if they want to discard changes?
        console.log("Discarding changes to create new note");
    }
    setSelectedNoteId(null);
    setSelectedNote(null);
    setEditorTitle('');
    // Reset Lexical editor state string to empty
    setEditorContent(initialJsonString);
    setIsNewNote(true);
    setIsEditing(true);
    setDetailError(null);
  };

  const handleEdit = () => {
      if (!selectedNote) return;
      setIsEditing(true);
      setIsNewNote(false);
      setEditorTitle(selectedNote.title || '');
      // Set editor state string from selectedNote.content
      setEditorContent(selectedNote.content || initialJsonString);
      setDetailError(null);
  };

  const handleCancel = () => {
      setIsEditing(false);
      setIsNewNote(false);
      setDetailError(null);
      setAutosaveStatus('idle'); // Reset autosave status on cancel
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current); // Clear any pending status reset

      if (selectedNote) {
          setEditorTitle(selectedNote.title || '');
          // Reset editor state string from selectedNote.content
          setEditorContent(selectedNote.content || initialJsonString);
      } else {
          setEditorTitle('');
          // Reset editor state string to empty
          setEditorContent(initialJsonString);
      }
  };

  // --- Autosave Logic ---
  const debouncedUpdateNote = useCallback(
    debounce(async (noteId: number, title: string, content: string, imageUrl: string | null | undefined) => {
      if (!noteId) return;
      setAutosaveStatus('saving');
      if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);

      try {
        console.log(`Autosaving Note ${noteId}...`);
        // Include image_url in the update data if it's defined (even if null)
        const updateData: noteService.UpdateNoteData = { title, content };
        if (imageUrl !== undefined) {
            updateData.image_url = imageUrl;
        }
        await noteService.updateNote(noteId, updateData);
        setAutosaveStatus('saved');
        autosaveTimeoutRef.current = setTimeout(() => setAutosaveStatus('idle'), 2000);
        // Update list if title changed
        if (title !== selectedNote?.title) {
             setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title: title } : n));
        }
      } catch (error) {
        console.error("Autosave failed:", error);
        setAutosaveStatus('error');
        autosaveTimeoutRef.current = setTimeout(() => setAutosaveStatus('idle'), 5000);
      }
    }, 1500),
    [selectedNote] // Add selectedNote as dependency to get latest title for comparison
  );

  // handleSaveNote is removed, replaced by autosave and explicit create
  const handleCreateNote = async () => {
    setAutosaveStatus('saving');
    setDetailError(null);
    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);

    const currentContent = editorContent;
    const noteData = { title: editorTitle || 'Untitled Note', content: currentContent };

    try {
        const savedNote = await noteService.createNote(noteData);
        console.log("Note created:", savedNote);
        setIsNewNote(false);
        setIsEditing(false);
        setAutosaveStatus('saved');
        autosaveTimeoutRef.current = setTimeout(() => setAutosaveStatus('idle'), 2000);
        await loadNotes();
        setSelectedNoteId(savedNote.id);
    } catch (err: any) {
        console.error("Failed to create note:", err);
        setDetailError('Failed to create note. Please try again.');
        setAutosaveStatus('error');
        autosaveTimeoutRef.current = setTimeout(() => setAutosaveStatus('idle'), 5000);
    }
  };

  const handleDeleteNote = async () => {
       if (!selectedNoteId) return;
       if (!window.confirm(`Are you sure you want to delete note "${selectedNote?.title || 'this note'}"?`)) {
           return;
       }
       setDetailError(null);
       try {
           await noteService.deleteNote(selectedNoteId);
           console.log("Note deleted:", selectedNoteId);
           setSelectedNoteId(null); // This will trigger useEffect to clear state
           await loadNotes(); // Reload list
       } catch (err: any) {
           console.error("Failed to delete note:", err);
           setDetailError('Failed to delete note. Please try again.');
       }
   };

   // Handler for when an image is selected via the uploader
   const handleImageSelectAndUpload = async (file: File) => {
        const noteIdToAttach = selectedNoteId;

        if (!noteIdToAttach) {
            setDetailError("Please save the note before adding images.");
            return;
        }

        setUploadingImage(true);
        setDetailError(null);

        try {
            // Use our imageService for upload
            const uploadedImage = await imageService.uploadImage(file);
            console.log('Image uploaded:', uploadedImage);

            // Link image to note via noteService update
            // Use the relative URL path returned by the upload service
            await noteService.updateNote(noteIdToAttach, { image_url: uploadedImage.url });

            // TODO: Insert image into Lexical editor
            // This requires access to the Lexical editor instance and commands
            // Example placeholder:
            // const fullImageUrl = imageService.getImageUrl(uploadedImage.url);
            // console.log("Need to insert image into Lexical:", fullImageUrl);
            // lexicalEditor.dispatchCommand(INSERT_IMAGE_COMMAND, { src: fullImageUrl, altText: 'Uploaded image' });

            // Update selectedNote state locally
             if (selectedNote) {
                // Store the relative URL path in the local state
                setSelectedNote({ ...selectedNote, image_url: uploadedImage.url });
             }


        } catch (err: any) { // Add type
            console.error("Image upload or linking failed:", err);
            setDetailError('Image upload or linking failed. Please try again.');
        } finally {
            setUploadingImage(false);
        }
   };

   // Handler to remove (unlink) an image from a note
   const handleRemoveNoteImage = async () => {
       if (!selectedNoteId || !selectedNote?.image_url) return;

       // Optional: Confirmation
       // if (!window.confirm("Remove attached image from this note?")) return;

       setDetailError(null); // Clear previous errors
       // Consider adding a temporary "removing" state if needed

       try {
           // Call updateNote to set image_url to null
           await noteService.updateNote(selectedNoteId, { image_url: null });

           // Update local state
           setSelectedNote((prev: NoteDetails | null) => prev ? { ...prev, image_url: null } : null); // Add type

           // Optional: Delete image file if no longer needed (requires more logic)
           console.log(`Image unlinked from note ${selectedNoteId}`);

       } catch (err: any) {
           console.error("Failed to remove image link for note:", err);
           setDetailError('Failed to remove image.');
       }
   };

   const handleListMouseEnter = () => {
    if (isListCollapsed) {
        setIsHoveringList(true);
    }
  };

  const handleListMouseLeave = () => {
    setIsHoveringList(false);
  };


  // --- Render Logic ---
  const renderNoteDetail = () => {
    if (loadingDetail && !isEditing) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress /></Box>;
    if (detailError && !isEditing) return <Alert severity="error" sx={{ m: 1 }}>{detailError}</Alert>;

    if (!selectedNoteId && !isNewNote) {
        return <Typography sx={{ p: 2 }}>Select a note from the list or create a new one.</Typography>;
    }

    if (isEditing || isNewNote) {
        return (
            <Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                {uploadingImage && <LinearProgress sx={{ mb: 1 }} />}
                {detailError && isEditing && <Alert severity="error" sx={{ mb: 1 }}>{detailError}</Alert>}
                <TextField
                    label="Title"
                    fullWidth
                    variant="outlined"
                    value={editorTitle}
                    onChange={(e) => {
                        setEditorTitle(e.target.value);
                        // Trigger autosave if editing an existing note
                        if (!isNewNote && selectedNoteId) {
                            // Pass current image_url to prevent unlinking during title/content autosave
                            debouncedUpdateNote(selectedNoteId, e.target.value, editorContent, selectedNote?.image_url);
                        }
                    }}
                    sx={{ mb: 2 }}
                    disabled={uploadingImage || autosaveStatus === 'saving'} // Disable during upload or saving
                />
                {/* Removed hidden file input */}
                {/* --- Lexical Editor --- */}
                <Box sx={{ flexGrow: 1, position: 'relative', border: '1px solid #ccc', borderRadius: '4px', minHeight: 350 }}>
                  <LexicalComposer initialConfig={{...initialConfig, editorState: editorContent }}>
                     <NoteToolbar /> {/* Add the toolbar here */}
                     <RichTextPlugin
                        contentEditable={<ContentEditable style={{ height: '100%', padding: '8px', paddingTop: '48px', outline: 'none', overflowY: 'auto' }} />}
                        placeholder={<div style={{ position: 'absolute', top: '48px', left: '8px', color: '#aaa', pointerEvents: 'none' }}>Enter your note...</div>}
                        ErrorBoundary={LexicalErrorBoundary}
                     />
                     <HistoryPlugin />
                     <OnChangePlugin onChange={(state) => {
                        // Store the raw EditorState object in a ref
                        editorStateRef.current = state;
                        // Store the serialized JSON string in component state for saving
                        const newContent = JSON.stringify(state.toJSON());
                        setEditorContent(newContent);
                        // Trigger autosave if editing an existing note
                        if (!isNewNote && selectedNoteId) {
                            // Pass current image_url to prevent unlinking during title/content autosave
                            debouncedUpdateNote(selectedNoteId, editorTitle, newContent, selectedNote?.image_url);
                        }
                     }} />
                     {/* TODO: Add other plugins (e.g., LinkPlugin, ListPlugin, ImagePlugin) */}
                     {/* Removed old IMG button */}
                  </LexicalComposer>
                </Box>
                <Box sx={{ mt: 1, mb: 1 }}> {/* Add uploader below editor, before buttons */}
                     <ImageUploader
                        onFileSelect={handleImageSelectAndUpload}
                        disabled={!selectedNoteId || isNewNote || uploadingImage || autosaveStatus === 'saving'} // Disable if no note selected, new, or busy
                        isUploading={uploadingImage}
                        uploadError={detailError?.includes('Image upload') || detailError?.includes('linking') ? detailError : null} // Pass relevant errors
                     />
                </Box>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                     {/* Autosave Status Indicator */}
                     <Typography variant="caption" sx={{ color: autosaveStatus === 'error' ? 'error.main' : 'text.secondary', minHeight: '1.2em' }}>
                        {autosaveStatus === 'saving' && 'Saving...'}
                        {autosaveStatus === 'saved' && 'Saved'}
                        {autosaveStatus === 'error' && 'Save Error!'}
                     </Typography>
                     <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button onClick={handleCancel} disabled={uploadingImage || autosaveStatus === 'saving'}>Cancel</Button>
                        {/* Show Create button only for new notes */}
                        {isNewNote && (
                            <Button variant="contained" onClick={handleCreateNote} disabled={uploadingImage || autosaveStatus === 'saving'}>
                                {autosaveStatus === 'saving' ? <CircularProgress size={24} /> : 'Create Note'}
                            </Button>
                        )}
                     </Box>
                </Box>
            </Paper>
        );
    }

    if (selectedNote) {
         return (
            <Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6">{selectedNote.title}</Typography>
                    <Box>
                        <Button size="small" onClick={handleEdit} sx={{ mr: 1 }}>Edit</Button>
                        <Button size="small" color="error" onClick={handleDeleteNote} disabled={autosaveStatus === 'saving'}>Delete</Button>
                    </Box>
                </Box>
                <Divider sx={{ mb: 2 }} />
                 <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0, border: '1px solid #eee', p: 1 }}> {/* Placeholder Box for Read-only Lexical/HTML */}
                     {/* Render read-only Lexical state using the viewer component */}
                     {selectedNote.content ? (
                       <ReadOnlyLexicalViewer editorStateString={selectedNote.content} />
                     ) : (
                       <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>No content.</Typography>
                     )}
                     {/* Display linked image using image_url */}
                     {(() => {
                         // Use image_url from the note data
                         const imageUrl = imageService.getImageUrl(selectedNote.image_url);
                         // Only render img tag if imageUrl is not null
                         return imageUrl ? (
                            <Box sx={{ mt: 1, position: 'relative', display: 'inline-block' }}>
                                <img
                                    src={imageUrl} // Use the constructed full URL
                                    alt="Attached"
                                    style={{ maxWidth: '100%', maxHeight: '200px', display: 'block' }}
                                />
                                {/* Add Remove button overlay */}
                                <Button
                                    size="small"
                                    color="error"
                                    onClick={handleRemoveNoteImage}
                                    sx={{ position: 'absolute', top: 0, right: 0, p: 0.2, minWidth: 'auto', lineHeight: 1, background: 'rgba(255,255,255,0.7)' }}
                                    title="Remove Image"
                                >
                                    X
                                </Button>
                            </Box>
                         ) : null;
                     })()}
                 </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption">
                    Created: {new Date(selectedNote.created_at).toLocaleString()} |
                    Updated: {new Date(selectedNote.updated_at).toLocaleString()}
                    {/* Version info might not be available initially */}
                    {/* | Version: {selectedNote.version} */}
                </Typography>
            </Paper>
        );
    }

    return null; // Fallback
  };


  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}> {/* Adjust height */}
      {/* Notes List Section */}
       <Box
            onMouseEnter={handleListMouseEnter}
            onMouseLeave={handleListMouseLeave}
            sx={{
            width: isListCollapsed && !isHoveringList ? collapsedListWidth : listWidth,
            minWidth: isListCollapsed && !isHoveringList ? collapsedListWidth : listWidth,
            borderRight: 1,
            borderColor: 'divider',
            overflow: 'hidden',
            transition: (theme) => theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
            display: 'flex',
            flexDirection: 'column',
         }}>
        {/* Header */}
         <Box sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1,
            borderBottom: 1,
            borderColor: 'divider',
            flexShrink: 0,
            minHeight: '48px',
            overflow: 'hidden',
            '& > :not(:last-child)': {
                 opacity: isListCollapsed && !isHoveringList ? 0 : 1,
                 transition: (theme) => theme.transitions.create('opacity', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                 }),
            },
            '& > div:last-of-type > button:first-of-type': {
                 opacity: isListCollapsed && !isHoveringList ? 0 : 1,
                 transition: (theme) => theme.transitions.create('opacity', {
                    easing: theme.transitions.easing.sharp,
                    duration: theme.transitions.duration.enteringScreen,
                 }),
            },
            justifyContent: isListCollapsed && !isHoveringList ? 'center' : 'space-between',
            transition: (theme) => theme.transitions.create('justify-content', {
                 easing: theme.transitions.easing.sharp,
                 duration: theme.transitions.duration.enteringScreen,
                }),
                }}>
            {(!isListCollapsed || isHoveringList) &&
                <Typography variant="h6" component="h2" noWrap>
                    Notes
                </Typography>
            }
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                 {(!isListCollapsed || isHoveringList) &&
                    <Button variant="contained" size="small" onClick={handleNewNote} sx={{ mr: 1 }}>New</Button>
                 }
                 <IconButton onClick={() => setIsListCollapsed(!isListCollapsed)} size="small">
                    {isListCollapsed ? <ViewModuleIcon /> : <ViewListIcon />}
                 </IconButton>
                </Box>
            </Box>

            {/* List Content */}
             <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
                {loadingList && <Box sx={{ display: 'flex', justifyContent: 'center', p: 2}}><CircularProgress /></Box>}
                {listError && <Alert severity="error" sx={{ m: 1 }}>{listError}</Alert>}
                {(!isListCollapsed || isHoveringList) && !loadingList && !listError && (
                    <List dense>
                    {notes.length === 0 ? (
                         <ListItem>
                            <ListItemText primary="No notes found. Create one!" />
                         </ListItem>
                    ) : (
                        notes.map((note) => (
                        <ListItem key={note.id} disablePadding>
                            <ListItemButton
                                selected={selectedNoteId === note.id}
                                onClick={() => handleNoteSelect(note.id)}
                            >
                            <ListItemText primary={note.title || 'Untitled Note'} secondary={`Updated: ${new Date(note.updated_at).toLocaleDateString()}`} />
                            </ListItemButton>
                        </ListItem>
                        ))
                    )}
                    </List>
                )}
             </Box>
        </Box>

      {/* Note Detail Section */}
      <Box component="main" sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
        {renderNoteDetail()}
      </Box>
    </Box>
  );
}

export default NotesView;