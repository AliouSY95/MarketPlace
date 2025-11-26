import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, Share2, ArrowLeft, ShieldCheck, Star } from 'lucide-react';

function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3000/products')
      .then(res => {
        const found = res.data.find(p => p.variant_id == id || p.id == id);
        setProduct(found);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur:", err);
        setLoading(false);
      });
  }, [id]);

  // --- FONCTION D'AJOUT AU PANIER (C'est la nouveauté) ---
  const addToCart = () => {
    if (!product) return;

    // 1. Lire le panier actuel depuis la mémoire
    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');

    // 2. Vérifier si le produit y est déjà
    const existingItem = currentCart.find(item => item.variant_id === product.variant_id);

    let newCart;
    if (existingItem) {
      // Si oui, on augmente la quantité
      newCart = currentCart.map(item => 
        item.variant_id === product.variant_id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      );
    } else {
      // Si non, on l'ajoute (avec quantité 1)
      newCart = [...currentCart, { ...product, quantity: 1 }];
    }

    // 3. Sauvegarder le nouveau panier
    localStorage.setItem('cart', JSON.stringify(newCart));

    // 4. Petit événement pour dire à tout le site que le panier a changé
    window.dispatchEvent(new Event("storage"));

    // 5. Redirection vers le panier
    navigate('/cart');
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Chargement...</div>;
  if (!product) return <div className="p-10 text-center text-red-500">Produit introuvable.</div>;

  return (
    <div className="container mx-auto px-4 py-6 font-sans text-slate-800">
      
      <Link to="/" className="inline-flex items-center text-blue-700 hover:underline mb-6 text-sm">
        <ArrowLeft size={16} className="mr-1" /> Retour à l'accueil
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-8">
          
          {/* IMAGE */}
          <div className="bg-gray-100 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-200">
            <img 
              src="https://via.placeholder.com/600x600?text=Produit" 
              alt={product.title} 
              className="max-w-full h-auto rounded-lg shadow-md hover:scale-105 transition-transform duration-300" 
            />
          </div>

          {/* DÉTAILS */}
          <div className="p-6 md:p-8 flex flex-col">
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
              {product.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 border-b border-gray-100 pb-4">
              <span className="flex items-center gap-1 text-yellow-500 font-medium">
                <Star size={16} fill="currentColor" /> 4.8 (Avis vérifiés)
              </span>
              <span>•</span>
              <span className="text-blue-700 font-medium">En stock</span>
            </div>

            <div className="mb-8 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="text-3xl font-bold text-blue-700 mb-1">
                {new Intl.NumberFormat('fr-SN').format(product.price)} FCFA
              </div>
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                <ShieldCheck size={18} />
                Stocké & Vérifié au Hub Liberté 6
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-bold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Ce produit est disponible immédiatement dans nos entrepôts. Commandez maintenant pour une livraison rapide sous 24h à Dakar et 48h en région.
              </p>
            </div>

            <div className="mt-auto space-y-3">
              {/* BOUTON ACHETER ACTIF */}
              <button 
                onClick={addToCart}
                className="w-full bg-blue-700 text-white text-lg font-bold py-3.5 rounded-full hover:bg-blue-800 transition shadow-lg flex items-center justify-center gap-2"
              >
                <ShoppingCart size={22} />
                Ajouter au Panier
              </button>

              <div className="border-2 border-dashed border-emerald-400 bg-emerald-50 rounded-xl p-4 mt-6">
                <div className="flex items-center gap-2 text-emerald-800 font-bold mb-2">
                   <Share2 size={18} /> Programme Partenaire
                </div>
                <p className="text-xs text-emerald-700 mb-3">
                  Gagnez <strong>1.5% à vie</strong> sur les achats de vos filleuls.
                </p>
                <button 
                  onClick={() => alert("Lien copié !")}
                  className="w-full bg-white border border-emerald-500 text-emerald-700 font-bold py-2 rounded-lg hover:bg-emerald-100 transition flex items-center justify-center gap-2"
                >
                  Copier mon lien de promotion
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;