import { Router } from 'express';
import { AuthController } from '../controllers';
import { authMiddleware, adminOnly } from '../middlewares/auth';

const router = Router();

// Public routes
router.post('/login', AuthController.login);

// Protected routes (any authenticated user)
router.get('/me', authMiddleware, AuthController.getCurrentUser);
router.get('/residents', authMiddleware, AuthController.getResidents);

// Password management routes (any authenticated user)
router.post('/setup-password', authMiddleware, AuthController.setupPassword);
router.post('/change-password', authMiddleware, AuthController.changePassword);
router.get('/can-change-password', authMiddleware, AuthController.canChangePassword);

// Admin only routes - User Management
router.get('/users', authMiddleware, adminOnly, AuthController.getUsers);
router.post('/users', authMiddleware, adminOnly, AuthController.createUser);
router.put('/users/:id', authMiddleware, adminOnly, AuthController.updateUser);
router.post('/users/:id/reset-password', authMiddleware, adminOnly, AuthController.resetPassword);
router.post('/users/:id/admin-reset-password', authMiddleware, adminOnly, AuthController.adminResetPassword);
router.get('/users/:id/has-pin', authMiddleware, adminOnly, AuthController.userHasPin);
router.post('/users/:id/deactivate', authMiddleware, adminOnly, AuthController.deactivateUser);
router.post('/users/:id/activate', authMiddleware, adminOnly, AuthController.activateUser);

export default router;
