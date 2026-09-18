export interface ICreateGarage {
  name: string;
  address: string;
  description?: string;
  totalSlots?: number;
  availableSlots?: number;
  pricePerHour?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
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
  latitude?: number;
  longitude?: number;
  images?: string[];
}

export interface IGarageQueryFilter {
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyAvailable?: boolean | string;
  minRating?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface INearbyGarageQuery {
  latitude: number | string;
  longitude: number | string;
  radius?: number | string; // in kilometers, default 10
  minPrice?: number | string;
  maxPrice?: number | string;
  onlyAvailable?: boolean | string;
  minRating?: number | string;
  limit?: number | string;
}
