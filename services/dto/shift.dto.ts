export interface DoctorShift {
    shift_id: string;
    weekday: string;
    start_time: string;
    end_time: string;
    duration_min: number;
}

export interface CreateShiftRequest {
    weekday: string;
    start_time: string;
    end_time: string;
    duration_min: number;
}

export interface DeleteShiftRequest {
    shift_id: string;
}
