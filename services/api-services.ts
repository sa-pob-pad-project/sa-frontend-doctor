import { http } from "@/libs/http";
import { LoginRequest, LoginResponse } from "./dto/auth.dto";

export const doctorLoginService = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const response = await http.post<LoginResponse>(
            "/user/v1/doctor/login",
            credentials
        );
        return response.data;
    },
};
