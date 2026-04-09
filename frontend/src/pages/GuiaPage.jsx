import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PanicButton from "@/components/PanicButton";
import { BookOpen, Coffee, Mountain, Waves, Utensils, Leaf, Star } from "lucide-react";

const GuiaPage = () => {
  const gastronomia = [
    { name: "Huachinango a la Veracruzana", desc: "Pescado con salsa de jitomate, aceitunas y alcaparras", img: "https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=400" },
    { name: "Arroz a la Tumbada", desc: "Arroz caldoso con mariscos frescos del Golfo", img: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400" },
    { name: "Café Veracruzano", desc: "El mejor café de altura del país, desde Coatepec", img: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400" },
    { name: "Picadas", desc: "Tortillas gruesas con salsa, queso y frijoles", img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400" },
    { name: "Caldo de Mariscos", desc: "Caldo con camarón, jaiba, pescado y pulpo", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400" },
    { name: "Torito", desc: "Bebida de licor de cacahuate, tradicional de Veracruz", img: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400" },
  ];

  const regiones = [
    { name: "Norte", desc: "Huasteca veracruzana, cascadas y zonas arqueológicas", icon: Mountain, color: "bg-green-100 text-green-800" },
    { name: "Centro", desc: "Xalapa, café, cultura y el Pico de Orizaba", icon: Coffee, color: "bg-amber-100 text-amber-800" },
    { name: "Sur", desc: "Los Tuxtlas, selva y lagunas", icon: Leaf, color: "bg-emerald-100 text-emerald-800" },
    { name: "Costa", desc: "Playas, malecones y gastronomía del mar", icon: Waves, color: "bg-blue-100 text-blue-800" },
  ];

  const turismoResponsable = [
    { title: "Respeta la naturaleza", desc: "No tires basura, usa recipientes reutilizables" },
    { title: "Consume local", desc: "Apoya a pequeños comerciantes y artesanos" },
    { title: "Respeta las tradiciones", desc: "Observa con respeto ceremonias y festividades" },
    { title: "Cuida el agua", desc: "Veracruz tiene ríos sagrados, no los contamines" },
    { title: "Usa transporte compartido", desc: "Reduce tu huella de carbono" },
    { title: "Contrata guías locales", desc: "Genera empleo en las comunidades" },
  ];

  const pueblosMagicos = [
    { name: "Coatepec", desc: "Capital del café, arquitectura colonial", tag: "Café y cultura" },
    { name: "Xico", desc: "Cascadas, artesanías y mole", tag: "Naturaleza" },
    { name: "Papantla", desc: "Voladores, vainilla y zona arqueológica El Tajín", tag: "Cultura totonaca" },
    { name: "Tlacotalpan", desc: "Patrimonio de la Humanidad, río Papaloapan", tag: "Música y tradición" },
    { name: "Orizaba", desc: "Teleférico, Pico de Orizaba, Palacio de Hierro", tag: "Aventura" },
    { name: "Coscomatepec", desc: "Vista al volcán, floricultura", tag: "Montaña" },
    { name: "Naolinco", desc: "Calzado artesanal, niebla", tag: "Artesanías" },
    { name: "Zozocolco", desc: "Cultura totonaca, cascadas", tag: "Ecoturismo" },
    { name: "Los Tuxtlas", desc: "Reserva de la biosfera, selva", tag: "Naturaleza" },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F5]" data-testid="guia-page">
      <Header />
      
      {/* Hero */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-[#1B5E20] to-[#0D3311]">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display' }}>
            Guía Turística de Veracruz
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Todo lo que necesitas saber para disfrutar del estado más diverso de México.
          </p>
        </div>
      </section>

      {/* Regiones */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-6 h-6 text-[#1B5E20]" />
            <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
              Regiones de Veracruz
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {regiones.map((region) => (
              <div key={region.name} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow">
                <div className={`w-14 h-14 ${region.color} rounded-xl flex items-center justify-center mb-4`}>
                  <region.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{region.name}</h3>
                <p className="text-gray-600">{region.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gastronomía */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Utensils className="w-6 h-6 text-[#F9A825]" />
            <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
              Gastronomía Veracruzana
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gastronomia.map((plato) => (
              <div key={plato.name} className="group relative overflow-hidden rounded-2xl h-64">
                <img 
                  src={plato.img} 
                  alt={plato.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold text-white mb-1">{plato.name}</h3>
                  <p className="text-white/80 text-sm">{plato.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pueblos Mágicos */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Star className="w-6 h-6 text-[#F9A825]" />
            <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display' }}>
              Pueblos Mágicos
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pueblosMagicos.map((pueblo) => (
              <div 
                key={pueblo.name} 
                className="bg-white rounded-xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 pueblo-magico-badge rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{pueblo.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{pueblo.desc}</p>
                  <span className="text-xs px-2 py-1 bg-[#F9A825]/10 text-[#F57F17] rounded-full">
                    {pueblo.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Turismo Responsable */}
      <section className="py-16 px-4 bg-[#1B5E20]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Leaf className="w-12 h-12 mx-auto mb-4 text-white/80" />
            <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display' }}>
              Turismo Responsable
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto">
              Veracruz es un tesoro natural y cultural. Ayúdanos a preservarlo para las futuras generaciones.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {turismoResponsable.map((item, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-4">
                  <span className="text-xl">{["🌿", "🛍️", "🎭", "💧", "🚌", "👤"][index]}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-white/70 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <PanicButton />
    </div>
  );
};

export default GuiaPage;
