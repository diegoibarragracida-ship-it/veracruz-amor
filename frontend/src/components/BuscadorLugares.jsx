import { useEffect, useRef } from "react";
import { MapPin } from "lucide-react";

const BuscadorLugares = ({ onSelect }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!window.google) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "mx" },
      fields: ["name", "geometry", "formatted_address", "photos", "rating"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      const lugar = {
        nombre: place.name,
        direccion: place.formatted_address,
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
        calificacion: place.rating,
        foto_portada: place.photos?.[0]?.getUrl({ maxWidth: 800 }),
        tipo: "atraccion",
        descripcion: "Información obtenida de Google",
      };

      onSelect(lugar);
    });
  }, []);

  return (
    <div className="relative mb-6">
      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
      <input
        ref={inputRef}
        placeholder="Buscar lugares reales en Veracruz..."
        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-700"
      />
    </div>
  );
};

export default BuscadorLugares;