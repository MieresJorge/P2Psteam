// src/components/layout/Footer.tsx
export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="text-center py-8 border-t border-gray-800 text-gray-500">
      <p>&copy; {currentYear} SteamP2P. Todos los derechos reservados.</p>
    </footer>
  );
}