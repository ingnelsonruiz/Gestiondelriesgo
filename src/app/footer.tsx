
import { Phone, MapPin, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center md:items-start">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image src="/imagenes/logo.jpg" alt="Dusakawi EPSI Logo" width={48} height={48} className="bg-white rounded-full p-1" />
              <span className="text-xl font-bold">DUSAKAWI EPSI</span>
            </Link>
            <p className="text-center md:text-left text-gray-400">
              ¡Trabajamos por la salud de los pueblos indígenas!
            </p>
          </div>

          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4">Contáctanos</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center justify-center md:justify-start gap-3">
                <MapPin size={16} />
                <span>Calle 8 N° 17-17 barrio Pontevedra</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3">
                <Phone size={16} />
                <span>Call Center: (601) 917 1117</span>
              </li>
              <li className="flex items-center justify-center md:justify-start gap-3">
                <Mail size={16} />
                <span>Línea Gratuita: 018000 160 020</span>
              </li>
            </ul>
          </div>
          
          <div className="text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="/" className="hover:text-primary transition-colors">Inicio</Link></li>
              <li><Link href="/informes-fenix" className="hover:text-primary transition-colors">Informes Fenix</Link></li>
              <li><Link href="/validador-pym" className="hover:text-primary transition-colors">Validador P Y M</Link></li>
              <li><Link href="/ayuda" className="hover:text-primary transition-colors">Ayuda</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Dusakawi EPSI. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
