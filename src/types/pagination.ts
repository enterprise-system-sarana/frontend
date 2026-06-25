export interface Pagination {
    pageSize: number;
    pageNumber: number;
    totalPages: number;
    totalElements: number;
    numberOfElements: number;
    first: boolean;
    last: boolean;
    empty: boolean;
}

export interface PageResponse<T> {
    data: T[];
    pagination: Pagination;
}

export interface ApiResponse<T> {
    success: boolean;
    status: string;
    message: string;
    timestamp: string;
    payload: PageResponse<T>;
}



export interface PageFilter {
    page: number
    size: number
}