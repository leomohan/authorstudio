import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          editor: [
            "@tiptap/react",
            "@tiptap/starter-kit",
            "@tiptap/extension-image",
            "@tiptap/extension-subscript",
            "@tiptap/extension-superscript",
            "@tiptap/extension-underline",
          ],
        },
      },
    },
  },
  server: {
    port: 4173,
  },
});
