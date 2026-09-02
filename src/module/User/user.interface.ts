export interface IRegisterUser {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'DRIVER' | 'MANAGER' | 'ADMIN';
}

export interface IUserQueryFilter {
  searchTerm?: string;
  role?: 'DRIVER' | 'MANAGER' | 'ADMIN';
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
