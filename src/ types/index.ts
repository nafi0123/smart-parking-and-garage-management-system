export const USER_ROLE = {
    driver: "DRIVER",
    manager: "MANAGER",
    admin: "ADMIN",
} as const;

export type ROLES = "driver" | "manager" | "admin";