// ARQUITECTURA: Componente de Servidor (Estático).
// Simplemente renderiza el pie de página.

export default function Footer() {
    return (
      <footer className="bg-zenit-light mt-12 py-6">
        <div className="container mx-auto text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Zenit. Todos los derechos reservados.</p>
        </div>
      </footer>
    );
  }