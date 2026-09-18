export interface ICreateGarage {
  name: string;
  address: string;
  description?: string;
  totalSlots?: number;
  availableSlots?: number;
  pricePerHour?: number;
  location?: string;
  images?: string[];
}

export interface IUpdateGarage {
  name?: string;
  address?: string;
  description?: string;
  totalSlots?: number;
  availableSlots?: number;
  pricePerHour?: number;
  location?: string;
  images?: string[];
}

export interface IGarageQueryFilter {
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyAvailable?: boolean | string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
