import { Request, Response, NextFunction } from 'express';
import * as EdgeService from '../services/EdgeService';
// Assuming types like NewEdgeInput, UpdateEdgeInput are defined in EdgeService or a shared types file

/**
 * Create a new edge within a specific graph.
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const graphId = parseInt(req.params.graphId, 10);
    // TODO: Add validation for edgeInput using Zod/Joi
    const edgeInput = req.body; // Assuming body matches NewEdgeInput

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (isNaN(graphId)) {
      res.status(400).json({ message: 'Invalid graph ID' });
      return;
    }
    // Add more validation for edgeInput fields (id, source, target etc.)
     if (!edgeInput || !edgeInput.id || !edgeInput.source || !edgeInput.target) {
        res.status(400).json({ message: 'Invalid edge data provided' });
        return;
    }

    const newEdge = await EdgeService.createEdge(graphId, userId, edgeInput);
    res.status(201).json(newEdge);
  } catch (error: any) {
     if (error.statusCode === 404 || error.statusCode === 403 || error.statusCode === 400) {
        res.status(error.statusCode).json({ message: error.message });
     } else {
        next(error);
     }
  }
};

/**
 * Get all edges for a specific graph.
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

    const edges = await EdgeService.getEdgesByGraphId(graphId, userId);
    res.status(200).json(edges);
  } catch (error: any) {
     if (error.statusCode === 404 || error.statusCode === 403) {
        res.status(error.statusCode).json({ message: error.message });
     } else {
        next(error);
     }
  }
};

/**
 * Update a specific edge.
 */
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { graphId, edgeId } = req.params;
    const graphIdNum = parseInt(graphId, 10);
    // TODO: Add validation for updateData
    const updateData = req.body; // Assuming body matches UpdateEdgeInput

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (isNaN(graphIdNum)) {
      res.status(400).json({ message: 'Invalid graph ID' });
      return;
    }
     if (!edgeId) {
      res.status(400).json({ message: 'Edge ID is required' });
      return;
    }
     if (Object.keys(updateData).length === 0) {
        res.status(400).json({ message: 'No update data provided' });
        return;
    }

    const updatedEdge = await EdgeService.updateEdge(edgeId, graphIdNum, userId, updateData);
    res.status(200).json(updatedEdge);
  } catch (error: any) {
     if (error.statusCode === 404 || error.statusCode === 403) {
        res.status(error.statusCode).json({ message: error.message });
     } else {
        next(error);
     }
  }
};

/**
 * Delete a specific edge.
 */
export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { graphId, edgeId } = req.params;
    const graphIdNum = parseInt(graphId, 10);

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (isNaN(graphIdNum)) {
      res.status(400).json({ message: 'Invalid graph ID' });
      return;
    }
    if (!edgeId) {
      res.status(400).json({ message: 'Edge ID is required' });
      return;
    }

    const deletedCount = await EdgeService.deleteEdge(edgeId, graphIdNum, userId);

    if (deletedCount === 0) {
      res.status(404).json({ message: 'Edge not found in the specified graph' });
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