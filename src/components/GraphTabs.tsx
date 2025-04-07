import React from 'react';

interface GraphInfo {
  id: string;
  title: string;
}

interface GraphTabsProps {
  graphs: GraphInfo[];
  activeGraphId: string;
  onCreateGraph: (title: string) => void;
  onSwitchGraph: (id: string) => void;
  onDeleteGraph: (id: string) => void;
}

const GraphTabs: React.FC<GraphTabsProps> = ({
  graphs,
  activeGraphId,
  onCreateGraph,
  onSwitchGraph,
  onDeleteGraph,
}) => {
  const handleCreate = () => {
    const title = prompt("Enter title for new graph:", `Graph ${graphs.length + 1}`);
    if (title) {
      onCreateGraph(title);
    }
  };

  const handleDelete = (event: React.MouseEvent, id: string) => {
    event.stopPropagation(); // Prevent switching to the tab when clicking delete
    // Confirmation is handled in GraphView's handleDeleteGraph
    onDeleteGraph(id);
  };

  return (
    <div style={styles.tabsContainer}>
      {graphs.map((graph) => (
        <div
          key={graph.id}
          onClick={() => onSwitchGraph(graph.id)}
          style={
            graph.id === activeGraphId
              ? { ...styles.tab, ...styles.activeTab }
              : styles.tab
          }
          title={graph.title} // Show full title on hover
        >
          <span style={styles.tabTitle}>{graph.title}</span>
          {graphs.length > 1 && ( // Only show delete if more than one graph exists
            <button
              onClick={(e) => handleDelete(e, graph.id)}
              style={styles.deleteButton}
              title="Delete Graph"
            >
              &times; {/* Multiplication sign as 'x' */}
            </button>
          )}
        </div>
      ))}
      <button onClick={handleCreate} style={styles.addButton} title="Create New Graph">
        +
      </button>
    </div>
  );
};

// Basic styles - consider moving to a CSS file
const styles = {
  tabsContainer: {
    display: 'flex',
    flexWrap: 'nowrap' as 'nowrap',
    overflowX: 'auto' as 'auto', // Allow horizontal scrolling if many tabs
    padding: '5px 5px 0 5px',
    backgroundColor: '#e0e0e0',
    borderBottom: '1px solid #ccc',
    minHeight: '40px', // Ensure container has some height
    alignItems: 'flex-end', // Align tabs to the bottom border
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    marginRight: '4px',
    border: '1px solid #ccc',
    borderBottom: 'none', // Remove bottom border for tab effect
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
    backgroundColor: '#f0f0f0',
    cursor: 'pointer',
    position: 'relative' as 'relative', // For positioning delete button
    maxWidth: '150px', // Limit tab width
    whiteSpace: 'nowrap' as 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  activeTab: {
    backgroundColor: 'white', // Active tab looks like part of the content area
    fontWeight: 'bold',
    borderBottom: '1px solid white', // Hide bottom border part connected to content
    marginBottom: '-1px', // Overlap the container border slightly
  },
  tabTitle: {
    marginRight: '15px', // Space before delete button
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  deleteButton: {
    position: 'absolute' as 'absolute',
    top: '2px',
    right: '2px',
    background: 'transparent',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0 3px',
    lineHeight: '1',
  },
  addButton: {
    padding: '5px 10px',
    marginLeft: '10px',
    marginBottom: '5px', // Align with bottom of tabs
    cursor: 'pointer',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#d0d0d0',
    fontWeight: 'bold',
  },
};

export default GraphTabs;