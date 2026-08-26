import {
    defineManifest,
} from "@crxjs/vite-plugin";

export default defineManifest({
    manifest_version: 3,

    name:
        "Contextual Reading Assistant",

    version: "0.1.0",

    description:
        "Understand unfamiliar words without leaving what you are reading.",

    host_permissions: [
        "https://api.dictionaryapi.dev/*",
        "https://api.datamuse.com/*",
    ],

    background: {
        service_worker:
            "src/background/serviceWorker.ts",

        type: "module",
    },

    content_scripts: [
        {
            matches: [
                "http://*/*",
                "https://*/*",
            ],

            js: [
                "src/content/main.ts",
            ],

            run_at:
                "document_idle",
        },
    ],
});