import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const authClient = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest?._retry) {
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;
        const { data, error: refreshError } = await authClient.auth.refreshSession({
            refresh_token: refreshToken,
        });

        if (refreshError || !data.session) {
            return Promise.reject(error);
        }

        localStorage.setItem("token", data.session.access_token);
        localStorage.setItem("refresh_token", data.session.refresh_token);
        originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`;

        return api(originalRequest);
    }
);

export default api;
