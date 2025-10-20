import axios from "axios";

export const http = axios.create({
    baseURL: process.env.BASE_URL || "http://localhost:5000/api",
    withCredentials: true,
});

http.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

