import express from 'express';
import * as AuthController from '../controllers/AuthController';

const router = express.Router();

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/login (handler defined in AuthController, implemented in TODO 06)
router.post('/login', AuthController.login);

export default router;