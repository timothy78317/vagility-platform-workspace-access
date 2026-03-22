import { ShieldCheck, Key, Lock } from "lucide-react";

/**
 * Navigation items for the Workspace Access module.
 * Exposes routes to the Host application.
 */
export const navigation = [
    { 
        title: "Workspace Identity", 
        icon: ShieldCheck, 
        path: "/app/access/identity" 
    },
    { 
        title: "Session Control", 
        icon: Key, 
        path: "/app/access/sessions" 
    },
    { 
        title: "Device Management", 
        icon: Lock, 
        path: "/app/access/devices" 
    }
];
