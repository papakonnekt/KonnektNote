import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Connection,
  BackgroundVariant,
  XYPosition,
  useReactFlow,
  NodeMouseHandler,
  EdgeMouseHandler,
  ReactFlowProvider,
  MarkerType,
  NodeChange,
  EdgeChange,
  isNode,
  isEdge
} from 'reactflow';
import { debounce } from 'lodash';
import Alert from '@mui/material/Alert'; // Import Alert
import Box from '@mui/material/Box';
import Button from '@mui/material/Button'; // Import Button
import CircularProgress from '@mui/material/CircularProgress';

// Import custom components
import GraphTabs from '@/components/GraphTabs';
import BubbleNode, { NodeInteractionContext } from '@/components/BubbleNode';
// Import API services
import * as graphService from '@/services/graphService';
import * as nodeService from '@/services/nodeService';
import * as edgeService from '@/services/edgeService';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

// Import React Flow styles
import 'reactflow/dist/style.css';

// --- Data Structure Interfaces ---
interface NodeData {
    label: string;
    graphId: number; // Pass graphId down to node for updates
    content?: string;
    image_url?: string | null; // Use image_url
    style?: React.CSSProperties;
    usedHandleIds?: Set<string>;
}

// Type expected by GraphTabs
interface GraphInfo {
  id: string;
  title: string;
}

let idCounter = 0;

// Define custom node types OUTSIDE the component
const nodeTypes = {
    bubble: BubbleNode,
};

// --- GraphView Component ---
const GraphViewInternal: React.FC = () => {
  // State for API data
  const [graphList, setGraphList] = useState<graphService.Graph[]>([]);
  const [activeGraphId, setActiveGraphId] = useState<number | null>(null);
  const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoadingGraphs, setIsLoadingGraphs] = useState(false); // Initialize to false
  const [isLoadingNodesEdges, setIsLoadingNodesEdges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<Node<NodeData> | Edge | null>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const navigate = useNavigate(); // Get navigate function
  const { token, isLoading: isAuthLoading } = useAuth(); // Get token and loading state

  useEffect(() => {
      idCounter = nodes.reduce((maxId: number, node: Node) => Math.max(maxId, parseInt(node.id, 10) || 0), 0) + 1;
  }, [nodes]);

  // --- Data Fetching Helpers ---
  const loadGraphs = useCallback(async () => { // Renamed from loadChecklists
    // Prevent concurrent loads using a local variable instead of state dependency
    if (isLoadingGraphs) {
        console.log("Graph load already in progress, skipping.");
        return;
    }
    console.log("Attempting to load graphs...");
    setIsLoadingGraphs(true); // Set loading true *before* try block
    setError(null); // Clear previous errors before attempting
    try {
      const fetchedGraphs = await graphService.getGraphs();
      setGraphList(fetchedGraphs);
      if (fetchedGraphs.length > 0 && activeGraphId === null) { // Only set initial active if not already set
        setActiveGraphId(fetchedGraphs[0].id);
      } else if (fetchedGraphs.length === 0) {
        setActiveGraphId(null);
        setNodes([]);
        setEdges([]);
      }
    } catch (err: any) {
      console.error("🔴 Failed to fetch graphs:", err);
      // Log the actual error status if available
      if (err.response) {
        console.error("🔴 Graph fetch error status:", err.response.status);
      }
      setError(`Failed to load graphs: ${err.message || 'Unknown error'}`);
      setGraphList([]);
      setActiveGraphId(null);
    } finally {
      setIsLoadingGraphs(false);
    }
  }, [activeGraphId]); // Only depend on activeGraphId

  const fetchNodesAndEdges = useCallback(async (graphId: number) => {
    if (!graphId) return;

    // Prevent fetching if already loading
    if (isLoadingNodesEdges) {
      console.log(`Already loading nodes/edges for a graph, skipping fetch for ${graphId}`);
      return;
    }

    console.log(`Attempting to fetch nodes/edges for graph ${graphId}...`);
    setIsLoadingNodesEdges(true);
    setError(null);

    try {
      const [fetchedNodes, fetchedEdges] = await Promise.all([
        nodeService.getNodes(graphId),
        edgeService.getEdges(graphId),
      ]);

      const flowNodes = fetchedNodes.map(dbNode => ({
          id: dbNode.id,
          type: dbNode.type || 'bubble',
          position: { x: dbNode.position_x, y: dbNode.position_y },
          data: {
              label: dbNode.data_label || 'Untitled',
              graphId: dbNode.graph_id,
              content: dbNode.data_content || '',
              image_url: dbNode.image_url || null,
              usedHandleIds: new Set<string>(),
          },
          ...(dbNode.style_width != null || dbNode.style_height != null
             ? { style: {
                 width: dbNode.style_width ?? undefined,
                 height: dbNode.style_height ?? undefined,
               }}
             : {}),
      }));

       const flowEdges = fetchedEdges.map(dbEdge => ({
          id: dbEdge.id,
          source: dbEdge.source_node_id,
          target: dbEdge.target_node_id,
          sourceHandle: dbEdge.source_handle,
          targetHandle: dbEdge.target_handle,
          markerStart: dbEdge.marker_start ? { type: dbEdge.marker_start as MarkerType } : undefined,
          markerEnd: dbEdge.marker_end ? { type: dbEdge.marker_end as MarkerType } : undefined,
       }));

      setNodes(flowNodes);
      setEdges(flowEdges);

      // Use requestAnimationFrame for smoother rendering
      requestAnimationFrame(() => {
        fitView({ padding: 0.1 });
      });

    } catch (err: any) {
      console.error(`🔴 Failed to fetch nodes/edges for graph ${graphId}:`, err);
      if (err.response) {
        console.error(`🔴 Nodes/edges fetch error status for graph ${graphId}:`, err.response.status);
      }
      setError(`Failed to load graph data for ${graphId}: ${err.message || 'Unknown error'}`);
      setNodes([]);
      setEdges([]);
    } finally {
      setIsLoadingNodesEdges(false);
    }
  }, []); // Empty dependency array to prevent re-creation

  // --- Effects ---

  // Load graphs list only when authentication is resolved and token is available
  useEffect(() => {
    // Wait until auth state is determined
    if (isAuthLoading) {
        console.log("⏳ Auth Effect: Auth loading, waiting...");
        return;
    }
    // If auth is resolved but no token, redirect
    if (!token) {
      console.log("⛔ Auth Effect: Not authenticated, redirect should happen via interceptor.");
      // Avoid calling navigate if component might unmount immediately
      // navigate('/login');
      return;
    }

    // If auth is resolved and token exists, load graphs once
    console.log("✅ Auth Effect: Token present, auth resolved. Calling loadGraphs.");
    loadGraphs();

    // Only run when auth state settles or token changes
  }, [token, isAuthLoading, loadGraphs]); // Removed problematic dependencies

  // Fetch nodes and edges when activeGraphId changes
  useEffect(() => {
    console.log(`🔄 ActiveGraph Effect: Triggered. ActiveGraphId = ${activeGraphId}`);
    if (activeGraphId !== null) {
      console.log(`🔄 ActiveGraph Effect: Fetching nodes/edges for ${activeGraphId}.`);
      fetchNodesAndEdges(activeGraphId);
    } else {
      console.log("🔄 ActiveGraph Effect: Active graph ID is null. Clearing nodes/edges.");
      setNodes([]);
      setEdges([]);
    }
    // We're using fetchNodesAndEdges with an empty dependency array, so it's stable
  }, [activeGraphId]);


  // Debounced function to update node position via API
  const debouncedUpdateNodePosition = useMemo(
    () =>
      debounce(async (nodeId: string, position: XYPosition) => {
        if (!activeGraphId) return;
        console.log(`Debounced update for node ${nodeId}:`, position);
        setError(null);
        try {
          const updateData: nodeService.UpdateNodeInput = { position };
          await nodeService.updateNode(activeGraphId, nodeId, updateData);
        } catch (err) {
          console.error(`Failed to update position for node ${nodeId}:`, err);
          setError(`Failed to save position for node ${nodeId}.`);
          fetchNodesAndEdges(activeGraphId); // Refetch on error
        }
      }, 750),
    [activeGraphId, fetchNodesAndEdges]
  );

  useEffect(() => {
    return () => {
      debouncedUpdateNodePosition.cancel();
    };
  }, [debouncedUpdateNodePosition]);


  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
      changes.forEach((change) => {
        if (change.type === 'position' && change.position && !change.dragging) {
          debouncedUpdateNodePosition(change.id, change.position);
        }
      });
    },
    [debouncedUpdateNodePosition]
  );

  const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onConnect: OnConnect = useCallback(async (connection: Connection) => {
      if (!activeGraphId || !connection.source || !connection.target) return;
      setError(null);
      const newEdgeData: edgeService.NewEdgeInput = {
          id: `e${connection.source}-${connection.target}-${Date.now()}`,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
      };
      const { markerStart, markerEnd, ...restOfEdgeData } = newEdgeData;
      const newEdgeForFlow: Edge = { ...restOfEdgeData };
      setEdges((eds) => addEdge(newEdgeForFlow, eds));
      try {
          await edgeService.createEdge(activeGraphId, newEdgeData);
      } catch (err) {
          console.error("Failed to create edge:", err);
          setError("Failed to save new connection.");
          setEdges((eds) => eds.filter((e) => e.id !== newEdgeData.id));
      }
    }, [activeGraphId]);

  const addNode = useCallback(async () => {
    if (!activeGraphId) return;
    setError(null);
    const newNodeId = `${idCounter++}`;
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 3 });
    const newNodeData: nodeService.NewNodeInput = {
        id: newNodeId,
        type: 'bubble',
        position,
        data: { label: `New Bubble ${newNodeId}` },
    };
    const newNodeForFlow: Node<NodeData> = {
        id: newNodeId,
        type: 'bubble',
        position,
        data: { label: newNodeData.data.label || '', graphId: activeGraphId, usedHandleIds: new Set() }
    };
    setNodes((nds) => nds.concat(newNodeForFlow));
    try {
        await nodeService.createNode(activeGraphId, newNodeData);
    } catch (err) {
        console.error("[addNode] API call failed:", err);
        setError("Failed to save new node. Please try again.");
        setNodes((nds) => nds.filter((n) => n.id !== newNodeId));
    }
  }, [screenToFlowPosition, activeGraphId]);

  const onNodeClick: NodeMouseHandler = useCallback((event: React.MouseEvent, node: Node<NodeData>) => setSelectedElement(node), []);

  const onEdgeClick: EdgeMouseHandler = useCallback(async (event, clickedEdge) => {
    event.stopPropagation();
    setSelectedElement(clickedEdge);
    if (!activeGraphId) return;
    setError(null);
    const currentMarkerEnd = clickedEdge.markerEnd;
    const currentMarkerStart = clickedEdge.markerStart;
    let nextMarkerStartType: MarkerType | undefined | null = undefined;
    let nextMarkerEndType: MarkerType | undefined | null = undefined;
    if (!currentMarkerStart && !currentMarkerEnd) {
        nextMarkerEndType = MarkerType.ArrowClosed;
    } else if (!currentMarkerStart && currentMarkerEnd) {
        nextMarkerStartType = MarkerType.ArrowClosed;
    }
    const updateData: edgeService.UpdateEdgeInput = {
        markerStart: nextMarkerStartType,
        markerEnd: nextMarkerEndType,
    };
    const updatedEdgeForFlow = {
        ...clickedEdge,
        markerStart: nextMarkerStartType ? { type: nextMarkerStartType } : undefined,
        markerEnd: nextMarkerEndType ? { type: nextMarkerEndType } : undefined,
    };
    setEdges((eds) => eds.map((e) => e.id === clickedEdge.id ? updatedEdgeForFlow : e));
    try {
        await edgeService.updateEdge(activeGraphId, clickedEdge.id, updateData);
    } catch (err) {
        console.error("Failed to update edge markers:", err);
        setError("Failed to update connection style.");
        setEdges((eds) => eds.map((e) => e.id === clickedEdge.id ? clickedEdge : e));
    }
  }, [activeGraphId]);

  const onPaneClick = useCallback(() => setSelectedElement(null), []);

  const handleNodeLabelChange = useCallback(async (nodeId: string, newLabel: string) => {
      if (!activeGraphId) return;
      setError(null);
      // Use functional update for reverting
      let originalNodeData: NodeData | undefined;
      setNodes((nds) => {
          const updatedNodes = nds.map((n) => {
              if (n.id === nodeId) {
                  originalNodeData = n.data; // Capture original data before update
                  return { ...n, data: { ...n.data, label: newLabel } };
              }
              return n;
          });
          return updatedNodes;
      });
      setSelectedElement(prev => {
          if (prev && prev.id === nodeId && 'data' in prev) {
              return { ...prev, data: { ...(prev as Node<NodeData>).data, label: newLabel } };
          }
          return prev;
      });
      try {
          const updateData: nodeService.UpdateNodeInput = { data: { label: newLabel } };
          await nodeService.updateNode(activeGraphId, nodeId, updateData);
      } catch (err) {
          console.error("Failed to update node label:", err);
          setError("Failed to save label change.");
          // Revert using functional update and captured original data
          setNodes((nds) =>
              nds.map((n) =>
                  n.id === nodeId && originalNodeData
                      ? { ...n, data: originalNodeData }
                      : n
              )
          );
           setSelectedElement(prev => {
              if (prev && prev.id === nodeId && 'data' in prev && originalNodeData) {
                  return { ...prev, data: { ...(prev as Node<NodeData>).data, label: originalNodeData.label } };
              }
              return prev;
          });
      }
  }, [activeGraphId, nodeService]); // Removed 'nodes' dependency

  useEffect(() => {
    const handleKeyDown = async (event: KeyboardEvent) => {
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedElement && activeGraphId) {
        event.preventDefault();
        setError(null);
        const elementToDelete = selectedElement;
        setSelectedElement(null);
        console.log(`[Delete Key] Attempting to delete ${isNode(elementToDelete) ? 'node' : 'edge'}:`, elementToDelete.id);
        try {
          if (isNode(elementToDelete)) {
            setNodes((nds) => nds.filter((n) => n.id !== elementToDelete.id));
            setEdges((eds) => eds.filter((e) => e.source !== elementToDelete.id && e.target !== elementToDelete.id));
            await nodeService.deleteNode(activeGraphId, elementToDelete.id);
            console.log(`[Delete Key] Node ${elementToDelete.id} deleted successfully via API.`);
          } else if (isEdge(elementToDelete)) {
            setEdges((eds) => eds.filter((e) => e.id !== elementToDelete.id));
            await edgeService.deleteEdge(activeGraphId, elementToDelete.id);
             console.log(`[Delete Key] Edge ${elementToDelete.id} deleted successfully via API.`);
          }
        } catch (err) {
          console.error(`[Delete Key] Failed to delete element ${elementToDelete.id}:`, err);
          setError(`Failed to delete selected element.`);
          fetchNodesAndEdges(activeGraphId); // Refetch on error
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement, activeGraphId, nodes, edges, fetchNodesAndEdges]);

  const handleNodeSizeChange = useCallback(async (nodeId: string, width: number, height: number) => {
      if (!activeGraphId) return;
       setError(null);
       // Use functional update for revert
       let originalStyle: React.CSSProperties | undefined;
       setNodes((nds) =>
           nds.map((n) => {
               if (n.id === nodeId) {
                   originalStyle = n.style; // Capture original style
                   return { ...n, style: { ...(n.style || {}), width, height } };
               }
               return n;
           })
       );
       try {
           const updateData: nodeService.UpdateNodeInput = { style: { width, height } };
           await nodeService.updateNode(activeGraphId, nodeId, updateData);
       } catch (err) {
           console.error("Failed to update node size:", err);
           setError("Failed to save size change.");
           // Revert using functional update
           setNodes((nds) =>
               nds.map((n) =>
                   n.id === nodeId
                       ? { ...n, style: originalStyle } // Revert to original style
                       : n
               )
           );
       }
  }, [activeGraphId, nodeService]); // Removed 'nodes' dependency

  const handleNodeImageLink = useCallback(async (nodeId: string, imageUrl: string | null) => {
      if (!activeGraphId) return;
      const updateNodes = (nds: Node<NodeData>[]) => nds.map(n =>
          n.id === nodeId ? { ...n, data: { ...n.data, image_url: imageUrl } } : n
      );
      setNodes(updateNodes);
      setSelectedElement(prev => {
          if (prev && prev.id === nodeId && 'data' in prev) {
              return { ...prev, data: { ...(prev as Node<NodeData>).data, image_url: imageUrl } };
          }
          return prev;
      });
      // API call is handled within BubbleNode
  }, [activeGraphId]);

  const handleCreateGraph = useCallback(async (title: string) => {
      setError(null);
      try {
          const newGraph = await graphService.createGraph({ title });
          setGraphList(prevList => [...prevList, newGraph]);
          setActiveGraphId(newGraph.id);
          setSelectedElement(null);
      } catch (err) {
          console.error("Failed to create graph:", err);
          setError("Failed to create new graph.");
      }
  }, []);

  const handleSwitchGraph = useCallback((idInput: number | string) => {
      const id = Number(idInput);
      if (activeGraphId !== id) {
          console.log(`Switching to graph ${id}`);
          setActiveGraphId(id);
          setSelectedElement(null);
          setError(null);
      }
  }, [activeGraphId]);

  const handleDeleteGraph = useCallback(async (idToDeleteInput: number | string) => {
      const idToDelete = Number(idToDeleteInput);
      if (!window.confirm(`Delete graph "${graphList.find(g => g.id === idToDelete)?.title || idToDelete}" and all its content?`)) {
          return;
      }
      setError(null);
      try {
          await graphService.deleteGraph(idToDelete);
          const remainingGraphs = graphList.filter(g => g.id !== idToDelete);
          setGraphList(remainingGraphs);
          if (activeGraphId === idToDelete) {
              setActiveGraphId(remainingGraphs.length > 0 ? remainingGraphs[0].id : null);
              setSelectedElement(null);
          }
      } catch (err) {
          console.error("Failed to delete graph:", err);
          setError("Failed to delete graph.");
      }
  }, [activeGraphId, graphList]);

  const nodeInteractionContextValue = React.useMemo(() => ({
      onNodeLabelChange: handleNodeLabelChange,
      onNodeSizeChange: handleNodeSizeChange,
      onNodeImageLink: handleNodeImageLink,
  }), [handleNodeLabelChange, handleNodeSizeChange, handleNodeImageLink]);

  const nodesWithConnectionInfo = React.useMemo(() => {
      // Skip processing if no nodes or edges
      if (nodes.length === 0) return [];

      const handleUsage = new Map<string, Set<string>>();

      // Process edges to track handle usage
      edges.forEach((edge) => {
          if (edge.sourceHandle) {
              if (!handleUsage.has(edge.source)) handleUsage.set(edge.source, new Set());
              handleUsage.get(edge.source)!.add(edge.sourceHandle);
          }
          if (edge.targetHandle) {
              if (!handleUsage.has(edge.target)) handleUsage.set(edge.target, new Set());
              handleUsage.get(edge.target)!.add(edge.targetHandle);
          }
      });

      // Create new nodes with updated handle information
      return nodes.map((node) => ({
          ...node,
          data: {
              ...node.data,
              usedHandleIds: handleUsage.get(node.id) || new Set<string>(),
          },
      }));
  }, [nodes, edges]);

  // Prepare graphs for GraphTabs (convert ID to string)
  const graphTabsData: GraphInfo[] = useMemo(() => graphList.map(g => ({
      id: String(g.id),
      title: g.title
  })), [graphList]);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden' }}>
        <GraphTabs
            graphs={graphTabsData}
            activeGraphId={String(activeGraphId ?? '')} // Ensure string, handle null case
            onCreateGraph={handleCreateGraph}
            onSwitchGraph={handleSwitchGraph}
            onDeleteGraph={handleDeleteGraph}
            // isLoading prop removed
        />
        {error && <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>}
        {/* Add button to trigger addNode */}
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Button onClick={addNode} size="small" variant="outlined" disabled={!activeGraphId}>Add Bubble</Button>
        </Box>
        <div style={{ display: 'flex', flexGrow: 1, height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
            {isLoadingGraphs || (isLoadingNodesEdges && activeGraphId !== null) ? ( // Show loading if loading graphs OR loading nodes/edges for an active graph
                 <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}><CircularProgress /></Box>
            ) : (
                <div className="react-flow-container" style={{ flexGrow: 1, height: '100%', width: '100%', position: 'relative', overflow: 'hidden' }}>
                    <NodeInteractionContext.Provider value={nodeInteractionContextValue}>
                        <ReactFlow
                            nodes={nodesWithConnectionInfo}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            onEdgeClick={onEdgeClick}
                            onPaneClick={onPaneClick}
                            nodeTypes={nodeTypes}
                            fitView
                            fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
                            minZoom={0.1}
                            maxZoom={2}
                            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                            className="react-flow-subflows-example"
                        >
                            <Controls />
                            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                        </ReactFlow>
                    </NodeInteractionContext.Provider>
                </div>
            )}
        </div>
    </div>
  );
};

const GraphView: React.FC = () => {
  return (
    <ReactFlowProvider>
      <GraphViewInternal />
    </ReactFlowProvider>
  );
};


export default GraphView;