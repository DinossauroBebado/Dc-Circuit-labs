/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    cliente: import('./db/schema').Cliente | null;
    admin: import('./db/schema').Admin | null;
    sessaoAdminId: number | null;
    ip: string;
    userAgent: string;
  }
}
