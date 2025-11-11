// ==========================================================
// ARCHIVO: app/admin/layout.tsx
// (Define la estructura visual del panel admin y aplica el Guardián)
// ==========================================================
import AdminGuard from "@/components/admin/AdminGuard"; // Archivo 30
import Link from "next/link";
import { FaChartLine, FaTicketAlt, FaUsers, FaHome } from "react-icons/fa";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Protegemos TODA la ruta /admin con el Guardián
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-900 text-gray-100">
        
        {/* --- Sidebar (Menú Lateral) --- */}
        <aside className="w-64 bg-zenit-dark flex-shrink-0 border-r border-gray-800 hidden md:block">
          <div className="p-6">
            <h2 className="text-2xl font-extrabold text-zenit-primary tracking-wider">
              ZENIT <span className="text-white text-base font-normal">Admin</span>
            </h2>
          </div>
          <nav className="mt-6 px-4 space-y-2">
            <AdminNavLink href="/admin" icon={<FaChartLine />} text="Dashboard" />
            <AdminNavLink href="/admin/sorteos" icon={<FaTicketAlt />} text="Sorteos" />
            <AdminNavLink href="/admin/usuarios" icon={<FaUsers />} text="Usuarios" />
            
            <div className="pt-6 mt-6 border-t border-gray-800">
              <AdminNavLink href="/" icon={<FaHome />} text="Volver a la App" />
            </div>
          </nav>
        </aside>

        {/* --- Contenido Principal --- */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}

// Componente auxiliar para los enlaces del menú
const AdminNavLink = ({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) => (
  <Link 
    href={href}
    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
  >
    {icon}
    <span className="font-medium">{text}</span>
  </Link>
);