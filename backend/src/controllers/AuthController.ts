import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services';
import { UserModel } from '../models';
import { successResponse } from '../utils/helpers';
import { LoginRequest, CreateUserRequest, UpdateUserRequest, ResetPasswordRequest, SetupPasswordRequest, ChangePasswordRequest } from '../types';
import { BadRequestError } from '../utils/errors';

export class AuthController {
  // POST /api/auth/login
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const credentials: LoginRequest = req.body;
      
      if (!credentials.email || !credentials.password) {
        throw new BadRequestError('Email and password are required');
      }

      const result = await AuthService.login(credentials);
      
      res.json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
          token: result.token,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/me - Get current authenticated user
  static async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const user = await UserModel.findById(req.user.id);
      res.json(successResponse(user, 'User retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/residents (for dropdowns - authenticated users only)
  static async getResidents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const residents = await AuthService.getResidents();
      res.json(successResponse(residents, 'Residents retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // ADMIN ONLY ROUTES - User Management
  // ==========================================

  // GET /api/auth/users - Get all users (Admin only)
  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await AuthService.getAllUsers();
      res.json(successResponse(users, 'Users retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/users - Create new user (Admin only)
  static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData: CreateUserRequest = req.body;
      
      if (!userData.name || !userData.email || !userData.password || !userData.role) {
        throw new BadRequestError('Name, email, password and role are required');
      }

      const user = await AuthService.createUser(userData);
      res.status(201).json(successResponse(user, 'User created successfully'));
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/auth/users/:id - Update user (Admin only)
  static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      const userData: UpdateUserRequest = req.body;
      
      const user = await AuthService.updateUser(userId, userData);
      res.json(successResponse(user, 'User updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/users/:id/reset-password - Reset user password (Admin only)
  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      const { newPassword }: ResetPasswordRequest = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        throw new BadRequestError('Password must be at least 6 characters');
      }

      await AuthService.resetPassword(userId, newPassword);
      res.json(successResponse(null, 'Password reset successfully'));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/users/:id/deactivate - Deactivate user (Admin only)
  static async deactivateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      
      // Prevent self-deactivation
      if (req.user && req.user.id === userId) {
        throw new BadRequestError('Cannot deactivate your own account');
      }

      await AuthService.deactivateUser(userId);
      res.json(successResponse(null, 'User deactivated successfully'));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/users/:id/activate - Activate user (Admin only)
  static async activateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      await AuthService.activateUser(userId);
      res.json(successResponse(null, 'User activated successfully'));
    } catch (error) {
      next(error);
    }
  }

  // ==========================================
  // PASSWORD MANAGEMENT ROUTES
  // ==========================================

  // POST /api/auth/setup-password - First time password setup with PIN (for new users)
  static async setupPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const { oldPassword, newPassword, confirmPassword, securityPin }: SetupPasswordRequest = req.body;

      // Validate required fields
      if (!oldPassword || !newPassword || !confirmPassword || !securityPin) {
        throw new BadRequestError('Old password, new password, confirm password and security PIN are required');
      }

      // Validate password match
      if (newPassword !== confirmPassword) {
        throw new BadRequestError('New password and confirm password do not match');
      }

      // Validate password length
      if (newPassword.length < 6) {
        throw new BadRequestError('Password must be at least 6 characters');
      }

      // Validate PIN format (6 digits)
      if (!/^\d{6}$/.test(securityPin)) {
        throw new BadRequestError('Security PIN must be exactly 6 digits');
      }

      await AuthService.setupPassword(req.user.id, { oldPassword, newPassword, confirmPassword, securityPin });
      res.json(successResponse(null, 'Password setup completed successfully'));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/change-password - Change own password (with restrictions for non-admins)
  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const { oldPassword, newPassword, confirmPassword }: ChangePasswordRequest = req.body;

      // Validate required fields
      if (!oldPassword || !newPassword || !confirmPassword) {
        throw new BadRequestError('Old password, new password and confirm password are required');
      }

      // Validate password match
      if (newPassword !== confirmPassword) {
        throw new BadRequestError('New password and confirm password do not match');
      }

      // Validate password length
      if (newPassword.length < 6) {
        throw new BadRequestError('Password must be at least 6 characters');
      }

      await AuthService.changePassword(req.user.id, { oldPassword, newPassword, confirmPassword });
      res.json(successResponse(null, 'Password changed successfully'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/can-change-password - Check if current user can change password
  static async canChangePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Not authenticated' });
        return;
      }

      const result = await AuthService.canChangePassword(req.user.id);
      res.json(successResponse(result, 'Password change eligibility checked'));
    } catch (error) {
      next(error);
    }
  }

  // POST /api/auth/users/:id/admin-reset-password - Admin reset password with PIN verification
  static async adminResetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      const { securityPin, newPassword }: ResetPasswordRequest = req.body;

      if (!securityPin) {
        throw new BadRequestError('User security PIN is required for verification');
      }

      if (!newPassword || newPassword.length < 6) {
        throw new BadRequestError('New password must be at least 6 characters');
      }

      // Prevent resetting own password through this route
      if (req.user && req.user.id === userId) {
        throw new BadRequestError('Use change-password route to change your own password');
      }

      await AuthService.adminResetPassword(userId, securityPin, newPassword);
      res.json(successResponse(null, 'Password reset successfully'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/auth/users/:id/has-pin - Check if user has set up their PIN (Admin only)
  static async userHasPin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = parseInt(req.params.id, 10);
      const hasPin = await AuthService.userHasPin(userId);
      res.json(successResponse({ hasPin }, hasPin ? 'User has PIN set up' : 'User has not set up PIN yet'));
    } catch (error) {
      next(error);
    }
  }
}

export default AuthController;
