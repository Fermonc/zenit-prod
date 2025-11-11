/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuración de Servidor Dinámico (SSR/Cloud Run)
  // Esto es intencional y requerido por 'firebase deploy --only hosting'
  // con la característica 'frameworksBackend' habilitada.
};

module.exports = nextConfig;