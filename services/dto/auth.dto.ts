export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    doctorId?: string;
    doctorName?: string;
    email?: string;
    token?: string;
    [key: string]: any;
}
