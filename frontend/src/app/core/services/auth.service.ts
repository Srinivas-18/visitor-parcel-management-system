import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '@env/environment';
import { User, ApiResponse, LoginRequest, LoginResponse, CreateUserRequest, UpdateUserRequest, ResetPasswordRequest, SetupPasswordRequest, ChangePasswordRequest, CanChangePasswordResponse } from '../models';

const TOKEN_STORAGE_KEY = 'vpm_token';
const USER_STORAGE_KEY = 'vpm_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;
        this.tokenSubject.next(token);
        this.currentUserSubject.next(user);
      } catch {
        this.clearStorage();
      }
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get token(): string | null {
    return this.tokenSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.token && !!this.currentUser;
  }

  get userRole(): string | null {
    return this.currentUser?.role || null;
  }

  // Login with email and password
  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<ApiResponse<LoginResponse>>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        map(response => {
          if (!response.success || !response.data) {
            throw new Error(response.message || 'Login failed');
          }
          return response.data;
        }),
        tap(data => {
          // Store token and user
          localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
          this.tokenSubject.next(data.token);
          this.currentUserSubject.next(data.user);
        }),
        map(data => data.user)
      );
  }

  logout(): void {
    this.clearStorage();
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
  }

  // Get authorization headers for API calls
  getAuthHeaders(): { [key: string]: string } {
    const token = this.token;
    if (token) {
      return {
        'Authorization': `Bearer ${token}`
      };
    }
    return {};
  }

  hasRole(...roles: string[]): boolean {
    return this.currentUser ? roles.includes(this.currentUser.role) : false;
  }

  // ==========================================
  // API calls for authenticated users
  // ==========================================

  getResidents(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${environment.apiUrl}/auth/residents`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data || [])
    );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error('Failed to get user');
        }
        return response.data;
      })
    );
  }

  // ==========================================
  // Admin only - User Management
  // ==========================================

  getAllUsers(): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${environment.apiUrl}/auth/users`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => response.data || [])
    );
  }

  createUser(userData: CreateUserRequest): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${environment.apiUrl}/auth/users`, userData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to create user');
        }
        return response.data;
      })
    );
  }

  updateUser(userId: number, userData: UpdateUserRequest): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${environment.apiUrl}/auth/users/${userId}`, userData, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to update user');
        }
        return response.data;
      })
    );
  }

  resetPassword(userId: number, newPassword: string): Observable<void> {
    const body: ResetPasswordRequest = { newPassword };
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/auth/users/${userId}/reset-password`, body, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to reset password');
        }
      })
    );
  }

  deactivateUser(userId: number): Observable<void> {
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/auth/users/${userId}/deactivate`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to deactivate user');
        }
      })
    );
  }

  activateUser(userId: number): Observable<void> {
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/auth/users/${userId}/activate`, {}, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to activate user');
        }
      })
    );
  }

  // ==========================================
  // Password Management
  // ==========================================

  // First-time password setup with PIN
  setupPassword(data: SetupPasswordRequest): Observable<void> {
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/auth/setup-password`, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        // Update user in storage to reflect password has been set
        if (this.currentUser) {
          const updatedUser = { ...this.currentUser, mustChangePassword: false };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        }
      }),
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to setup password');
        }
      })
    );
  }

  // Change own password (with restrictions for non-admins)
  changePassword(data: ChangePasswordRequest): Observable<void> {
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/auth/change-password`, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to change password');
        }
      })
    );
  }

  // Check if user can change password
  canChangePassword(): Observable<CanChangePasswordResponse> {
    return this.http.get<ApiResponse<CanChangePasswordResponse>>(`${environment.apiUrl}/auth/can-change-password`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to check password change eligibility');
        }
        return response.data;
      })
    );
  }

  // Admin: Reset user password with PIN verification
  adminResetPassword(userId: number, securityPin: string, newPassword: string): Observable<void> {
    const body: ResetPasswordRequest = { securityPin, newPassword };
    return this.http.post<ApiResponse<null>>(`${environment.apiUrl}/auth/users/${userId}/admin-reset-password`, body, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to reset password');
        }
      })
    );
  }

  // Admin: Check if user has PIN set up
  userHasPin(userId: number): Observable<{ hasPin: boolean }> {
    return this.http.get<ApiResponse<{ hasPin: boolean }>>(`${environment.apiUrl}/auth/users/${userId}/has-pin`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error(response.message || 'Failed to check user PIN status');
        }
        return response.data;
      })
    );
  }
}
