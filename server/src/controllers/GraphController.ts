import { Request, Response, NextFunction } from 'express';
import * as GraphService from '../services/GraphService';

/**
 * Create a new graph.
 */
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id; // From authMiddleware
    const { title } = req.body;

    if (!userId) {
      // Should be caught by authMiddleware, but good practice to check
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (!title) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }

    const newGraph = await GraphService.createGraph(userId, { title });
    res.status(201).json(newGraph);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all graphs for the authenticated user.
 */
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const graphs = await GraphService.getGraphsByUserId(userId);
    res.status(200).json(graphs);
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single graph by ID.
 */
export const getOne = async (
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

    const graph = await GraphService.getGraphById(graphId, userId);
    if (!graph) {
      // Could be not found or not owned by user - return 404 either way
      res.status(404).json({ message: 'Graph not found' });
      return;
    }
    res.status(200).json(graph);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a graph's title.
 */
export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const graphId = parseInt(req.params.graphId, 10);
    const { title } = req.body;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (isNaN(graphId)) {
      res.status(400).json({ message: 'Invalid graph ID' });
      return;
    }
    if (title === undefined) {
      // Only allowing title update for now
      res.status(400).json({ message: 'Title is required for update' });
      return;
    }

    const updatedCount = await GraphService.updateGraph(graphId, userId, { title });

    if (updatedCount === 0) {
      // Could be not found or not owned by user
      res.status(404).json({ message: 'Graph not found or not updated' });
      return;
    }
    // Fetch the updated graph to return it
    const updatedGraph = await GraphService.getGraphById(graphId, userId);
    res.status(200).json(updatedGraph);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a graph.
 */
export const remove = async (
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

    const deletedCount = await GraphService.deleteGraph(graphId, userId);

    if (deletedCount === 0) {
      // Could be not found or not owned by user
      res.status(404).json({ message: 'Graph not found' });
      return;
    }
    res.status(204).send(); // No content on successful deletion
  } catch (error) {
    next(error);
  }
};