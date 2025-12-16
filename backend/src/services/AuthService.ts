import jwt from 'jsonwebtoken';
import { UserModel } from '../models';
import { User, LoginRequest, LoginResponse, JwtPayload, CreateUserRequest, UpdateUserRequest, SetupPasswordRequest, ChangePasswordRequest, CanChangePasswordResponse } from '../types';
import { UnauthorizedError, NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import { config } from '../config';

// Token expiry: 7 days (good balance between security and convenience)
const TOKEN_EXPIRY = '7d';

export class AuthService {
  // Generate JWT token
  private static generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    
    return jwt.sign(payload, config.sessionSecret, { expiresIn: TOKEN_EXPIRY });
  }

  // Verify JWT token
  static verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, config.sessionSecret) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired. Please login again.');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token. Please login again.');
      }
      throw new UnauthorizedError('Authentication failed.');
    }
  }

  // Login with email and password
  static async login(credentials: LoginRequest): Promise<LoginResponse & { mustChangePassword?: boolean }> {
    const { email, password } = credentials;

    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new ForbiddenError('Account is deactivated. Contact admin.');
    }

    // Verify password
    const isValidPassword = await UserModel.verifyPassword(password, user.password!);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user);

    // Remove sensitive data from response
    const { password: _, security_pin: __, ...userWithoutSecrets } = user;

    return {
      success: true,
      message: user.must_change_password ? 'Please change your password' : 'Login successful',
      token,
      user: userWithoutSecrets,
      mustChangePassword: user.must_change_password,
    };
  }

  // Get user from token (for /me endpoint)
  static async getUserFromToken(token: string): Promise<User> {
    const payload = this.verifyToken(token);
    const user = await UserModel.findById(payload.userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    if (!user.is_active) {
      throw new ForbiddenError('Account is deactivated');
    }

    return user;
  }

  // ==========================================
  // Password Management
  // ==========================================

  // First-time password setup (self)
  static async setupPassword(userId: number, data: SetupPasswordRequest): Promise<void> {
    const user = await UserModel.findByEmail((await UserModel.findById(userId))?.email || '');
    if (!user) throw new NotFoundError('User not found');

    // Verify old password
    const isValidPassword = await UserModel.verifyPassword(data.oldPassword, user.password!);
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Verify passwords match
    if (data.newPassword !== data.confirmPassword) {
      throw new BadRequestError('Passwords do not match');
    }

    // Validate new password
    if (data.newPassword.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters');
    }

    // Validate PIN (6 digits)
    if (!/^\d{6}$/.test(data.securityPin)) {
      throw new BadRequestError('Security PIN must be exactly 6 digits');
    }

    await UserModel.setupPassword(userId, data.newPassword, data.securityPin);
  }

  // Self password change (one-time for residents/security)
  static async changePassword(userId: number, data: ChangePasswordRequest): Promise<void> {
    const user = await UserModel.findById(userId, true);
    if (!user) throw new NotFoundError('User not found');

    // Check if user can change password
    const canChange = UserModel.canChangePassword(user);
    if (!canChange.canChange) {
      throw new ForbiddenError(canChange.reason || 'You cannot change your password');
    }

    // Verify old password
    const isValidPassword = await UserModel.verifyPassword(data.oldPassword, user.password!);
    if (!isValidPassword) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Verify passwords match
    if (data.newPassword !== data.confirmPassword) {
      throw new BadRequestError('Passwords do not match');
    }

    // Validate new password
    if (data.newPassword.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters');
    }

    await UserModel.changePassword(userId, data.newPassword);
  }

  // Check if user can change password
  static async canChangePassword(userId: number): Promise<CanChangePasswordResponse> {
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    // If must change password (first time), they need to setup with PIN
    if (user.must_change_password) {
      return { canChange: true, mustSetupFirst: true };
    }

    const result = UserModel.canChangePassword(user);
    return { 
      canChange: result.canChange, 
      reason: result.reason,
      mustSetupFirst: false 
    };
  }

  // ==========================================
  // Admin Functions
  // ==========================================

  // Create new user (Admin only)
  static async createUser(userData: CreateUserRequest): Promise<User> {
    return UserModel.create(userData);
  }

  // Update user (Admin only)
  static async updateUser(userId: number, userData: UpdateUserRequest): Promise<User> {
    return UserModel.update(userId, userData);
  }

  // Simple password reset (Admin only - for legacy/simple reset without PIN)
  static async resetPassword(userId: number, newPassword: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (newPassword.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters');
    }

    await UserModel.resetPassword(userId, newPassword);
  }

  // Admin reset password with PIN verification
  static async adminResetPassword(userId: number, newPassword: string, securityPin: string): Promise<void> {
    const user = await UserModel.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    // Verify the user's security PIN
    const hasPin = await UserModel.hasSecurityPin(userId);
    if (!hasPin) {
      throw new BadRequestError('User has not set up their security PIN yet. They must complete first-time password setup first.');
    }

    const isPinValid = await UserModel.verifySecurityPin(userId, securityPin);
    if (!isPinValid) {
      throw new UnauthorizedError('Invalid security PIN. Please ask the user for their correct PIN.');
    }

    // Validate new password
    if (newPassword.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters');
    }

    await UserModel.resetPassword(userId, newPassword);
  }

  // Check if user has PIN (for admin UI)
  static async userHasPin(userId: number): Promise<boolean> {
    return UserModel.hasSecurityPin(userId);
  }

  // Deactivate user (Admin only)
  static async deactivateUser(userId: number): Promise<void> {
    return UserModel.deactivate(userId);
  }

  // Activate user (Admin only)
  static async activateUser(userId: number): Promise<void> {
    return UserModel.activate(userId);
  }

  // Get all users (Admin only)
  static async getAllUsers(): Promise<User[]> {
    return UserModel.getAll();
  }

  // Get all residents (for dropdowns)
  static async getResidents(): Promise<User[]> {
    return UserModel.getAllResidents();
  }
}

export default AuthService;
