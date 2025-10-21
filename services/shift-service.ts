import { http } from "@/libs/http";
import {
    CreateShiftRequest,
    DeleteShiftRequest,
    DoctorShift,
} from "./dto/shift.dto";

export const doctorShiftService = {
    getActiveShifts: async (signal?: AbortSignal): Promise<DoctorShift[]> => {
        const response = await http.get<DoctorShift[]>(
            "/appointment/v1/doctor/shift",
            { signal }
        );
        console.log("Fetched active shifts:", response.data);
        return response.data;
    },

    createShift: async (payload: CreateShiftRequest): Promise<DoctorShift> => {
        const response = await http.post<DoctorShift>(
            "/appointment/v1/doctor/shift",
            payload
        );
        return response.data;
    },

    deleteShift: async (payload: DeleteShiftRequest): Promise<void> => {
        await http.delete("/appointment/v1/doctor/shift", { data: payload });
    },
};
