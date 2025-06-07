export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
) => {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        return new Promise<ReturnType<T>>((resolve) => {
            timeout = setTimeout(() => {
                resolve(func(...args));
            }, wait);
        });
    };
}; 