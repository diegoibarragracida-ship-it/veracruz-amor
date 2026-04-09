import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#1B5E20] text-white" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-[#1B5E20]" />
              </div>
              <span className="font-bold text-xl" style={{ fontFamily: 'Playfair Display' }}>
                Veracruz Contigo
              </span>
            </div>
            <p className="text-white/80 text-sm mb-4">
              Plataforma oficial de turismo del Estado de Veracruz. Explora con seguridad, 
              descubre la magia de nuestros pueblos y vive experiencias únicas.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Explorar</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/explorar" className="text-white/80 hover:text-white transition-colors">
                  Municipios
                </Link>
              </li>
              <li>
                <Link to="/explorar?filter=pueblo_magico" className="text-white/80 hover:text-white transition-colors">
                  Pueblos Mágicos
                </Link>
              </li>
              <li>
                <Link to="/eventos" className="text-white/80 hover:text-white transition-colors">
                  Eventos
                </Link>
              </li>
              <li>
                <Link to="/prestadores" className="text-white/80 hover:text-white transition-colors">
                  Prestadores
                </Link>
              </li>
              <li>
                <Link to="/guia" className="text-white/80 hover:text-white transition-colors">
                  Guía Turística
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Información</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/80 hover:text-white transition-colors">
                  Aviso de privacidad
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition-colors">
                  Términos de uso
                </a>
              </li>
              <li>
                <a href="#" className="text-white/80 hover:text-white transition-colors">
                  Preguntas frecuentes
                </a>
              </li>
              <li>
                <Link to="/emergencia" className="text-white/80 hover:text-white transition-colors">
                  Emergencias
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-white/80 text-sm">
                  Palacio de Gobierno, Centro Histórico, Xalapa, Veracruz
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <span className="text-white/80 text-sm">800-903-9200</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <span className="text-white/80 text-sm">turismo@veracruz.gob.mx</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/60 text-sm text-center md:text-left">
              © 2026 Veracruz Contigo. Gobierno del Estado de Veracruz. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">Por Amor a Veracruz</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
