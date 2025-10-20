export class ObjectUtils {
    static isEmpty(value: any): boolean {
        if (value == null) return true;
        if (typeof value === 'string' || Array.isArray(value))
            return value.length === 0;
        if (value instanceof Map || value instanceof Set)
            return value.size === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    static isNotEmpty(value: any): boolean {
        return !this.isEmpty(value);
    }

    static ifEmptyReturnNull(value: any): any {
        return this.isEmpty(value) ? null : value;
    }
    static ifEmptyReturn(value: any, defaultValue: any): any {
        return this.isEmpty(value) ? defaultValue : value;
    }
    static isUUID(value: any): boolean {
        const uuidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return typeof value === 'string' && uuidRegex.test(value);
    }
}
