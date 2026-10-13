/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Endereços do site antigo (Joomla em /nfs/) passam a apontar para a página inicial.
      { source: '/nfs', destination: '/', permanent: true },
      { source: '/nfs/index.php', destination: '/', permanent: true },
      // Endereços antigos da loja com espaço/acento, renomeados no site novo.
      { source: '/loja/mapa%20do%20site', destination: '/loja/mapa-do-site', permanent: true },
      { source: '/loja/pre%C3%A7os-em-queda', destination: '/loja/precos-em-queda', permanent: true },
      { source: '/loja/index.php', destination: '/loja', permanent: true },
    ];
  },
};

export default nextConfig;
