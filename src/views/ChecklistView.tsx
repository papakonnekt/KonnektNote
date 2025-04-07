{/* src/pages/ChecklistsPage.jsx */}
import React, { useState, useEffect, useCallback } from 'react';
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
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AttachFileIcon from '@mui/icons-material/AttachFile'; // Icon for attaching files
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
// Import OUR services and context
import * as checklistService from '@/services/checklistService';
import * as checklistItemService from '@/services/checklistItemService';
import * as imageService from '@/services/imageService'; // Import image service
import { useAuth } from '@/context/AuthContext'; // Use OUR AuthContext
import ImageUploader from '@/components/ImageUploader'; // Import the uploader

// Define combined type for selected checklist state
interface SelectedChecklistDetails extends checklistService.Checklist {
  items: checklistItemService.ChecklistItem[];
}
const listWidth = 300; // Define a fixed width for the list section
const collapsedListWidth = 72; // Use the same collapsed width as the main sidebar

function ChecklistView() {
  const [checklists, setChecklists] = useState<checklistService.Checklist[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedChecklistId, setSelectedChecklistId] = useState<number | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<SelectedChecklistDetails | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewChecklist, setIsNewChecklist] = useState(false);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorItems, setEditorItems] = useState<checklistItemService.ChecklistItem[]>([]);
  const [newItemContent, setNewItemContent] = useState('');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemContent, setEditingItemContent] = useState('');
  const [attachingImageToItemId, setAttachingImageToItemId] = useState<number | null>(null); // Track which item to attach image to
  const [uploadingImage, setUploadingImage] = useState(false); // Track image upload status
  const [saveLoading, setSaveLoading] = useState(false);
  const [isListCollapsed, setIsListCollapsed] = useState(false);
  const [isHoveringList, setIsHoveringList] = useState(false);
  const navigate = useNavigate();
  const { token } = useAuth();

  // --- Data Fetching Helpers ---
  const loadChecklists = useCallback(async () => {
    try {
      setLoadingList(true);
      setListError(null);
      const fetchedChecklists = await checklistService.getChecklists();
      setChecklists(fetchedChecklists);
    } catch (err: any) {
      console.error("Failed to fetch checklists:", err);
      setListError('Failed to load checklists. Please try again later.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadChecklistItems = useCallback(async (id: number) => {
    if (!id) return;
    try {
        const items = await checklistItemService.getItems(id);
        setEditorItems(items); // Keep editorItems in sync when loading/refetching
        setSelectedChecklist((prev: SelectedChecklistDetails | null) =>
            prev && prev.id === id ? { ...prev, items: items } : prev
        );
        setDetailError(null);
    } catch (itemErr: any) {
        console.error(`Failed to fetch items for checklist ${id}:`, itemErr);
        setDetailError('Failed to load checklist items.');
        setEditorItems([]);
        setSelectedChecklist((prev: SelectedChecklistDetails | null) =>
            prev && prev.id === id ? { ...prev, items: [] } : prev
        );
    }
  }, [setEditorItems, setSelectedChecklist, setDetailError]);


  // --- Effects ---

  // Load checklists list
  useEffect(() => {
    if (!token) {
      console.log("Not authenticated, redirecting to login.");
      navigate('/login');
      return;
    }
    loadChecklists();
  }, [token, navigate, loadChecklists]);

  // Effect to load selected checklist detail (including items)
  useEffect(() => {
    if (!selectedChecklistId) {
      setSelectedChecklist(null);
      setEditorItems([]);
      setEditorTitle('');
      setIsEditing(false);
      setIsNewChecklist(false);
      return;
    }

    const loadChecklistDetail = async () => {
      try {
        setLoadingDetail(true);
        setDetailError(null);
        const fetchedChecklist = await checklistService.getChecklist(selectedChecklistId);
        setSelectedChecklist({ ...fetchedChecklist, items: [] }); // Initialize with empty items

        if (!isEditing) {
            setEditorTitle(fetchedChecklist.title || '');
        }
        await loadChecklistItems(selectedChecklistId); // Fetch items

      } catch (err: any) {
        console.error(`Failed to fetch checklist ${selectedChecklistId}:`, err);
        setDetailError('Failed to load checklist details.');
        setSelectedChecklist(null);
        setEditorItems([]);
        setEditorTitle('');
      } finally {
        setLoadingDetail(false);
      }
    };

    loadChecklistDetail();
  }, [selectedChecklistId, loadChecklistItems]); // Removed isEditing, navigate


  // --- Handlers ---
  const handleChecklistSelect = (id: number) => {
    if (isEditing) {
        console.log("Discarding changes to select new checklist");
    }
    setSelectedChecklistId(id);
    setIsEditing(false);
    setIsNewChecklist(false);
    setDetailError(null);
  };

  const handleNewChecklist = async () => {
    setSaveLoading(true);
    setDetailError(null);
    try {
        const newChecklist = await checklistService.createChecklist({ title: 'New Checklist' });
        await loadChecklists();
        setSelectedChecklistId(newChecklist.id);
        setIsNewChecklist(false);
        setIsEditing(false);
    } catch (err: any) {
        console.error("Failed to create checklist:", err);
        setDetailError('Failed to create checklist. Please try again.');
    } finally {
        setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsNewChecklist(false);
    setDetailError(null);
    if (selectedChecklist) {
        setEditorTitle(selectedChecklist.title || '');
        setEditorItems(selectedChecklist.items || []); // Reset items from the potentially updated selectedChecklist
    } else {
        setEditorTitle('');
        setEditorItems([]);
    }
    setEditingItemId(null);
    setNewItemContent('');
    setAttachingImageToItemId(null);
  };

  const handleEdit = () => {
    if (!selectedChecklist) return;
    setIsEditing(true);
    setIsNewChecklist(false);
    setEditorTitle(selectedChecklist.title || '');
    // Use items from selectedChecklist for editing
    setEditorItems(selectedChecklist.items ? JSON.parse(JSON.stringify(selectedChecklist.items)) : []);
    setDetailError(null);
    setEditingItemId(null);
    setNewItemContent('');
    setAttachingImageToItemId(null);
  };

  const handleUpdateChecklistTitle = async () => {
      if (!selectedChecklistId || isNewChecklist) return;
      setSaveLoading(true);
      setDetailError(null);
      try {
          const updatedChecklist = await checklistService.updateChecklist(selectedChecklistId, { title: editorTitle });
          setSelectedChecklist((prev) => prev ? { ...prev, title: updatedChecklist.title } : null);
          setChecklists(prev => prev.map(cl => cl.id === selectedChecklistId ? { ...cl, title: updatedChecklist.title } : cl));
          console.log("Checklist title updated:", updatedChecklist);
      } catch (err: any) {
          console.error("Failed to update checklist title:", err);
          setDetailError('Failed to update checklist title. Please try again.');
      } finally {
          setSaveLoading(false);
      }
  };

  const handleDeleteChecklist = async () => {
    if (!selectedChecklistId) return;
    if (!window.confirm(`Are you sure you want to delete checklist "${selectedChecklist?.title || 'this checklist'}"?`)) {
        return;
    }
    setSaveLoading(true);
    setDetailError(null);
    try {
        await checklistService.deleteChecklist(selectedChecklistId);
        setSelectedChecklistId(null);
        setIsEditing(false);
        setIsNewChecklist(false);
        await loadChecklists();
    } catch (err: any) {
        console.error("Failed to delete checklist:", err);
        setDetailError('Failed to delete checklist. Please try again.');
    } finally {
        setSaveLoading(false);
    }
  };

  // --- Item Handlers ---
  const handleAddItem = async () => {
    if (!newItemContent.trim() || !selectedChecklistId) return;
    const currentNewItemContent = newItemContent;
    setNewItemContent('');
    try {
        await checklistItemService.createItem(selectedChecklistId, { content: currentNewItemContent });
        await loadChecklistItems(selectedChecklistId); // Refetch items
    } catch (err: any) {
        console.error("Failed to add item:", err);
        setDetailError('Failed to add item. Please try again.');
        setNewItemContent(currentNewItemContent);
    }
  };

  const handleToggleItem = async (itemId: number, currentStatus: boolean) => {
    if (!selectedChecklistId) return;
    const optimisticItems = editorItems.map(item =>
        item.id === itemId ? { ...item, is_completed: !currentStatus } : item
    );
    // Update both states optimistically
    setEditorItems(optimisticItems);
    setSelectedChecklist((prev) => prev ? { ...prev, items: optimisticItems } : null);

    try {
        await checklistItemService.updateItem(selectedChecklistId, itemId, { is_completed: !currentStatus });
    } catch (err: any) {
        console.error("Failed to toggle item completion:", err);
        setDetailError('Failed to update item status.');
        // Revert optimistic update in both states
        const revertItems = (items: checklistItemService.ChecklistItem[]) =>
            items.map(item =>
                item.id === itemId ? { ...item, is_completed: currentStatus } : item
            );
        setEditorItems(revertItems);
        setSelectedChecklist((prev) => prev ? { ...prev, items: revertItems(prev.items) } : null);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!selectedChecklistId) return;
    if (!window.confirm("Are you sure you want to delete this item?")) {
        return;
    }
    const originalItems = [...editorItems];
    const optimisticItems = editorItems.filter(item => item.id !== itemId);
    // Update both states optimistically
    setEditorItems(optimisticItems);
    setSelectedChecklist((prev) => prev ? { ...prev, items: optimisticItems } : null);

    try {
        await checklistItemService.deleteItem(selectedChecklistId, itemId);
    } catch (err: any) {
        console.error("Failed to delete item:", err);
        setDetailError('Failed to delete item.');
        // Revert optimistic update in both states
        setEditorItems(originalItems);
        setSelectedChecklist((prev) => prev ? { ...prev, items: originalItems } : null);
    }
  };

  const handleEditItemStart = (itemId: number, currentContent: string) => {
    setEditingItemId(itemId);
    setEditingItemContent(currentContent);
  };

  const handleUpdateItemContent = async (itemId: number) => {
    if (!selectedChecklistId || editingItemId !== itemId) return;
    const originalItem = editorItems.find(item => item.id === itemId);
    if (!originalItem) return;

    const newContent = editingItemContent;
    const optimisticItems = editorItems.map(item =>
        item.id === itemId ? { ...item, content: newContent } : item
    );
    // Update both states optimistically
    setEditorItems(optimisticItems);
    setSelectedChecklist((prev) => prev ? { ...prev, items: optimisticItems } : null);

    setEditingItemId(null);
    setEditingItemContent('');

    try {
        await checklistItemService.updateItem(selectedChecklistId, itemId, { content: newContent });
    } catch (err: any) {
        console.error("Failed to update item content:", err);
        setDetailError('Failed to update item content.');
        // Revert optimistic update in both states
        const revertItems = (items: checklistItemService.ChecklistItem[]) =>
            items.map(item =>
                item.id === itemId ? { ...item, content: originalItem.content } : item
            );
        setEditorItems(revertItems);
        setSelectedChecklist((prev) => prev ? { ...prev, items: revertItems(prev.items) } : null);
    }
  };

  // Handler for when an image is selected via the uploader
  const handleChecklistItemImageSelect = async (file: File) => {
      if (!attachingImageToItemId || !selectedChecklistId) return;

      console.log(`File selected for item ${attachingImageToItemId}:`, file.name);
      setUploadingImage(true);
      setDetailError(null);

      try {
        // 1. Upload image
        const uploadedImage = await imageService.uploadImage(file);
        console.log('Image uploaded:', uploadedImage);

        // 2. Link image to checklist item using the returned relative URL
        await checklistItemService.updateItem(selectedChecklistId, attachingImageToItemId, { image_url: uploadedImage.url });

        // 3. Update local state (both editor and selectedChecklist)
        const updateItemsState = (items: checklistItemService.ChecklistItem[]) =>
          items.map(item =>
            item.id === attachingImageToItemId ? { ...item, image_url: uploadedImage.url } : item
          );

        setEditorItems(updateItemsState);
        setSelectedChecklist((prev) => prev ? { ...prev, items: updateItemsState(prev.items) } : null);

        console.log(`Image linked to item ${attachingImageToItemId}`);

      } catch (err: any) {
        // 4. Handle errors
        console.error("Image upload or linking failed for checklist item:", err);
        setDetailError('Image upload or linking failed. Please try again.');
      }

      setUploadingImage(false);
      setAttachingImageToItemId(null); // Reset attachment target
  };

  // Handler to remove (unlink) an image from a checklist item
  const handleRemoveChecklistItemImage = async (itemId: number) => {
      if (!selectedChecklistId) return;

      // Optional: Confirmation
      // if (!window.confirm("Remove attached image from this item?")) return;

      setDetailError(null); // Clear previous errors
      const originalItems = [...editorItems]; // Store for potential revert

      // Optimistic UI Update
      const updateItemsState = (items: checklistItemService.ChecklistItem[]) =>
          items.map(item =>
              item.id === itemId ? { ...item, image_url: null } : item
          );
      setEditorItems(updateItemsState);
      setSelectedChecklist((prev) => prev ? { ...prev, items: updateItemsState(prev.items) } : null);


      try {
          // Call updateItem to set image_url to null
          await checklistItemService.updateItem(selectedChecklistId, itemId, { image_url: null });

          console.log(`Image unlinked from item ${itemId}`);

          // Optional: Delete image file if no longer needed (requires more logic)

      } catch (err: any) {
          console.error("Failed to remove image link for item:", err);
          setDetailError('Failed to remove image.');
          // Revert optimistic update
          setEditorItems(originalItems);
          setSelectedChecklist((prev) => prev ? { ...prev, items: originalItems } : null);
      }
  };


  const handleCancelEditItem = () => {
    setEditingItemId(null);
    setEditingItemContent('');
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
  const renderChecklistDetail = () => {
    if (loadingDetail) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress /></Box>;
    if (detailError && !isEditing && !selectedChecklistId) return <Alert severity="error" sx={{ m: 1 }}>{detailError}</Alert>; // Show list error if no selection

    // Case 1: Editing (Existing Checklist Only)
    if (isEditing && selectedChecklistId) {
      return (
        <Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {detailError && <Alert severity="error" sx={{ mb: 1 }}>{detailError}</Alert>}
          <TextField
              label="Checklist Title"
              fullWidth
              variant="outlined"
              value={editorTitle}
              onChange={(e) => setEditorTitle(e.target.value)}
              onBlur={handleUpdateChecklistTitle}
              sx={{ mb: 2, flexShrink: 0 }}
              disabled={saveLoading}
            />
          <Typography variant="subtitle1" sx={{ mb: 1, flexShrink: 0 }}>Items:</Typography>
          <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, border: '1px solid #eee', p: 1 }}>
              <List dense>
                  {editorItems.map((item) => (
                      <ListItem
                          key={item.id}
                          secondaryAction={
                              <>
                                  <IconButton edge="end" aria-label="attach" sx={{ mr: 0.5 }} onClick={() => setAttachingImageToItemId(item.id)} disabled={saveLoading || editingItemId !== null || uploadingImage}>
                                      <AttachFileIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton edge="end" aria-label="edit" sx={{ mr: 0.5 }} onClick={() => handleEditItemStart(item.id, item.content)} disabled={saveLoading || editingItemId !== null || uploadingImage}>
                                      <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteItem(item.id)} disabled={saveLoading || editingItemId !== null || uploadingImage}>
                                      <DeleteIcon fontSize="small" />
                                  </IconButton>
                              </>
                          }
                          disablePadding
                      >
                          <Checkbox
                              edge="start"
                              checked={!!item.is_completed}
                              tabIndex={-1}
                              disableRipple
                              onChange={() => handleToggleItem(item.id, item.is_completed)}
                              disabled={saveLoading || editingItemId !== null}
                          />
                          {editingItemId === item.id ? (
                              <TextField
                                  variant="standard"
                                  fullWidth
                                  value={editingItemContent}
                                  onChange={(e) => setEditingItemContent(e.target.value)}
                                  onBlur={() => handleUpdateItemContent(item.id)}
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter') { e.preventDefault(); handleUpdateItemContent(item.id); }
                                      else if (e.key === 'Escape') { e.preventDefault(); handleCancelEditItem(); }
                                  }}
                                  autoFocus
                                  sx={{ ml: 1 }}
                              />
                          ) : (
                              <ListItemText
                                  primary={item.content || '...'}
                                  sx={{ textDecoration: item.is_completed ? 'line-through' : 'none', ml: 1 }}
                               />
                          )}
                      </ListItem>
                  ))}
               </List>
           </Box>
           {/* Conditionally render ImageUploader */}
           {attachingImageToItemId !== null && (
                <Box sx={{ my: 2, p: 1, border: '1px dashed grey' }}>
                    <Typography variant="caption" display="block" gutterBottom>
                        Attaching image to item: {editorItems.find(i => i.id === attachingImageToItemId)?.content || '...'}
                    </Typography>
                    <ImageUploader
                        onFileSelect={handleChecklistItemImageSelect}
                        isUploading={uploadingImage}
                        uploadError={detailError?.includes('Image upload') || detailError?.includes('linking') ? detailError : null}
                        disabled={uploadingImage}
                        buttonText="Select Image"
                    />
                    <Button size="small" onClick={() => setAttachingImageToItemId(null)} sx={{mt: 1}} disabled={uploadingImage}>Cancel Attach</Button>
                </Box>
           )}
           {/* Add Item Input/Button */}
           <Box sx={{ display: 'flex', mt: 'auto', gap: 1, pt: 1, flexShrink: 0 }}>
               <TextField
                  label="New Item"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={newItemContent}
                  onChange={(e) => setNewItemContent(e.target.value)}
                  disabled={saveLoading || editingItemId !== null}
                  onKeyPress={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAddItem(); }
                  }}
               />
               <Button onClick={handleAddItem} disabled={saveLoading || !newItemContent.trim() || editingItemId !== null}>Add</Button>
           </Box>

           <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1, flexShrink: 0 }}>
              <Button onClick={handleCancel} disabled={saveLoading}>Done Editing</Button>
              {/* Title saves on blur, no explicit save needed */}
          </Box>
        </Paper>
      );
    }

    // Case 2: Display selected checklist (Read-only)
    if (selectedChecklist) {
      return (
        <Paper elevation={2} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 }}>
            <Typography variant="h6">{selectedChecklist.title}</Typography>
            <Box>
              <Button size="small" sx={{ mr: 1 }} onClick={handleEdit}>Edit</Button>
              <Button size="small" color="error" onClick={handleDeleteChecklist} disabled={saveLoading}>Delete</Button>
            </Box>
          </Box>
          {/* Show detail error here as well if it occurred during item loading */}
          {detailError && <Alert severity="error" sx={{ mb: 1 }}>{detailError}</Alert>}
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <List dense>
                {selectedChecklist.items && selectedChecklist.items.length > 0 ? (
                  selectedChecklist.items.map((item: checklistItemService.ChecklistItem) => (
                    <ListItem key={item.id} disablePadding>
                      <Checkbox
                        edge="start"
                        checked={!!item.is_completed}
                        tabIndex={-1}
                        disableRipple
                        onChange={() => handleToggleItem(item.id, item.is_completed)} // Allow toggle from read-only
                      />
                      <ListItemText
                        primary={item.content}
                        sx={{ textDecoration: item.is_completed ? 'line-through' : 'none', ml: 1 }}
                      />
                      {/* Display icon and remove button if image_url exists */}
                      {item.image_url && (
                          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', ml: 1 }}>
                              <AttachFileIcon fontSize="inherit" sx={{ color: 'text.secondary', verticalAlign: 'middle' }} />
                              {/* Add Remove button only in read-only view for simplicity, or disable in edit? */}
                              {!isEditing && (
                                  <Button
                                      size="small"
                                      color="error"
                                      onClick={() => handleRemoveChecklistItemImage(item.id)}
                                      sx={{ fontSize: '0.6rem', p: 0.1, ml: 0.5, minWidth: 'auto', lineHeight: 1 }}
                                      title="Remove Image"
                                  >
                                      X
                                  </Button>
                              )}
                          </Box>
                      )}
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText primary="No items in this checklist." />
                  </ListItem>
                )}
              </List>
          </Box>
        </Paper>
      );
    }

    // Case 3: No checklist selected
    return <Typography sx={{ p: 2 }}>Select a checklist from the list or create a new one.</Typography>;
  };


  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}> {/* Adjust height */}
      {/* Checklists List Section */}
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
                    Checklists
                </Typography>
            }
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                 {(!isListCollapsed || isHoveringList) &&
                    <Button variant="contained" size="small" onClick={handleNewChecklist} sx={{ mr: 1 }}>New</Button>
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
                    {checklists.length === 0 ? (
                         <ListItem>
                            <ListItemText primary="No checklists found. Create one!" />
                         </ListItem>
                    ) : (
                        checklists.map((checklist) => (
                        <ListItem key={checklist.id} disablePadding>
                            <ListItemButton
                                selected={selectedChecklistId === checklist.id}
                                onClick={() => handleChecklistSelect(checklist.id)}
                            >
                            <ListItemText primary={checklist.title || 'Untitled'} />
                            </ListItemButton>
                        </ListItem>
                        ))
                    )}
                    </List>
                )}
             </Box>
        </Box>

      {/* Checklist Detail Section */}
      <Box component="main" sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
        {renderChecklistDetail()}
      </Box>
    </Box>
  );
}

export default ChecklistView;