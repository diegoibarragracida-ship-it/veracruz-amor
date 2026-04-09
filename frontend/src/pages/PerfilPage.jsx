import { useState, useEffect } from "react";
import axios from "axios";
import { API, useAuth } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { User, Heart, MapPin, Calendar, Users, Star, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const PerfilPage = () => {
  const { user, logout } = useAuth();
  const [favoritos, setFavoritos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoritos = async () => {
      try {
        const response = await axios.get(`${API}/favoritos`);
        setFavoritos(response.data || []);
      } catch (error) {
        console.error("Error fetching favoritos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoritos();
  }, []);

  const handleRemoveFavorito = async (favoritoId) => {
    try {
      await axios.delete(`${API}/favoritos/${favoritoId}`);
      setFavoritos(favoritos.filter(f => f.id !== favoritoId));
      toast.success("Eliminado de favoritos");
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const municipioFavoritos = favoritos.filter(f => f.tipo === "municipio");
  const eventoFavoritos = favoritos.filter(f => f.tipo === "evento");
  const prestadorFavoritos = favoritos.filter(f => f.tipo === "prestador");

  return (
    <div className="min-h-screen bg-[#F5F5F5]" data-testid="perfil-page">
      <Header />
      
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-[#1B5E20] to-[#0D3311]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {user?.foto_url ? (
              <img 
                src={user.foto_url} 
                alt={user.nombre}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display' }}>
                {user?.nombre || "Usuario"}
              </h1>
              <p className="text-white/80">{user?.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-white text-sm capitalize">
                {user?.rol}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="favoritos" className="space-y-6">
            <TabsList className="bg-white p-1 rounded-xl shadow-sm">
              <TabsTrigger value="favoritos" className="rounded-lg">
                <Heart className="w-4 h-4 mr-2" />
                Favoritos
              </TabsTrigger>
              <TabsTrigger value="cuenta" className="rounded-lg">
                <User className="w-4 h-4 mr-2" />
                Mi cuenta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="favoritos">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1B5E20]" />
                </div>
              ) : favoritos.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Sin favoritos aún</h3>
                  <p className="text-gray-500 mb-6">
                    Explora municipios, eventos y prestadores para guardarlos aquí
                  </p>
                  <Link to="/explorar">
                    <Button className="bg-[#1B5E20] hover:bg-[#145218]">
                      Explorar Veracruz
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Municipios */}
                  {municipioFavoritos.length > 0 && (
                    <div className="bg-white rounded-2xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#1B5E20]" />
                        Municipios guardados
                      </h3>
                      <div className="space-y-3">
                        {municipioFavoritos.map((fav) => (
                          <div key={fav.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-700">{fav.referencia_id}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFavorito(fav.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Eventos */}
                  {eventoFavoritos.length > 0 && (
                    <div className="bg-white rounded-2xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#0277BD]" />
                        Eventos guardados
                      </h3>
                      <div className="space-y-3">
                        {eventoFavoritos.map((fav) => (
                          <div key={fav.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-700">{fav.referencia_id}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFavorito(fav.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prestadores */}
                  {prestadorFavoritos.length > 0 && (
                    <div className="bg-white rounded-2xl p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#F9A825]" />
                        Prestadores guardados
                      </h3>
                      <div className="space-y-3">
                        {prestadorFavoritos.map((fav) => (
                          <div key={fav.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-700">{fav.referencia_id}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFavorito(fav.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cuenta">
              <div className="bg-white rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Información de la cuenta</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-500">Nombre</span>
                    <span className="font-medium">{user?.nombre}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-500">Tipo de cuenta</span>
                    <span className="font-medium capitalize">{user?.rol}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-gray-500">Miembro desde</span>
                    <span className="font-medium">
                      {user?.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString('es-MX') : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={logout}
                    data-testid="logout-btn"
                  >
                    Cerrar sesión
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PerfilPage;
