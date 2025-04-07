import { Request, Response, NextFunction } from 'express';
import * as NodeService from '../services/NodeService';
// Assuming types like NewNodeInput, UpdateNodeInput are defined in NodeService or a shared types file

/**
 * Create a new node within a specific graph.
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const graphId = parseInt(req.params.graphId, 10);
    // TODO: Add validation for nodeInput using a library like Zod or Joi
    const nodeInput = req.body; // Assuming body matches NewNodeInput structure

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (isNaN(graphId)) {
      res.status(400).json({ message: 'Invalid graph ID' });
      return;
    }
    // Add more validation for nodeInput fields (id, position, data etc.)
    if (!nodeInput || !nodeInput.id || !nodeInput.position || !nodeInput.data) {
        res.status(400).json({ message: 'Invalid node data provided' });
        return;
    }

    const newNode = await NodeService.createNode(graphId, userId, nodeInput);
    res.status(201).json(newNode);
  } catch (error: any) {
     // Handle specific errors like graph not found/access denied from service
     if (error.statusCode === 404 || error.statusCode === 403) {
        res.status(error.statusCode).json({ message: error.message });
     } else {
        next(error); // Pass other errors to generic handler
     }
  }
};

/**
 * Get all nodes for a specific graph.
 */
export const getAllForGraph = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const graphId = parseInt(req.params.graphId, 10);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
     if (isNaN(graphId)) {
      res.status(400).json({ message: 'Invalid graph ID' });
      return;
    }

    const nodes = await NodeService.getNodesByGraphId(graphId, userId);
    res.status(200).json(nodes);
  } catch (error: any) {
     if (error.statusCode === 404 || error.statusCode === 403) {
        res.status(error.statusCode).json({ message: error.message });
     } else {
        next(error);
     }
  }
};

/**
 * Update a specific node.
 */
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { graphId, nodeId } = req.params;
    const graphIdNum = parseInt(graphId, 10);
    // TODO: Add validation for updateData
    const updateData = req.body; // Assuming body matches UpdateNodeInput structure

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (isNaN(graphIdNum)) {
      res.status(400).json({ message: 'Invalid graph ID' });
      return;
    }
     if (!nodeId) {
      res.status(400).json({ message: 'Node ID is required' });
      return;
    }
    // Validate image_url if present
    if (updateData.image_url !== undefined && typeof updateData.image_url !== 'string' && updateData.image_url !== null) {
        res.status(400).json({ message: 'Invalid image_url format' });
        return;
    }
    // Ensure at least one valid field is being updated
    const validKeys = ['position', 'data', 'style', 'image_url', 'type'];
    const hasUpdateData = Object.keys(updateData).some(key => validKeys.includes(key) && updateData[key] !== undefined);
    if (!hasUpdateData) {
        res.status(400).json({ message: 'No valid update data provided' });
        return;
    }


    const updatedNode = await NodeService.updateNode(nodeId, graphIdNum, userId, updateData);
    res.status(200).json(updatedNode);
  } catch (error: any) {
     if (error.statusCode === 404 || error.statusCode === 403) {
        res.status(error.statusCode).json({ message: error.message });
     } else {
        next(error);
     }
  }
};

/**
 * Delete a specific node.
 */
export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { graphId, nodeId } = req.params;
    const graphIdNum = parseInt(graphId, 10);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (isNaN(graphIdNum)) {
      res.status(400).json({ message: 'Invalid graph ID' });
      return;
    }
    if (!nodeId) {
      res.status(400).json({ message: 'Node ID is required' });
      return;
    }

    const deletedCount = await NodeService.deleteNode(nodeId, graphIdNum, userId);

    if (deletedCount === 0) {
      res.status(404).json({ message: 'Node not found in the specified graph' });
      return;
    }
    res.status(204).send(); // No content on successful deletion
  } catch (error: any) {
     if (error.statusCode === 404 || error.statusCode === 403) {
        res.status(error.statusCode).json({ message: error.message });
     } else {
        next(error);
     }
  }
};