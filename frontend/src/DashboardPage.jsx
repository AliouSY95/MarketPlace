import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingBag, Users, User, Settings, LogOut, 
  Wallet, Bell, Shield, ChevronRight, Copy, AlertCircle, 
  CreditCard, Store, Plus, ArrowUpRight, Gift, Search, Filter,
  MapPin, Lock, Smartphone, Mail, Camera, Package, X, Download, FileText, Check,
  Clock
} from 'lucide-react';

function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [wallet, setWallet] = useState({ disponible: 0, en_attente: 0, bonus: 0 });
  const [myOrders, setMyOrders] = useState([]);
  
  // Etats pour la modale de commande et les filtres
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('Toutes');
  const [searchQuery, setSearchQuery] = useState('');

  // Etats pour la Vue d'ensemble (Activités & Retrait)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [activities, setActivities] = useState([
    { id: 1, type: 'welcome', text: 'Bienvenue sur MarketSénégal !', time: "À l'instant", isRead: false },
    { id: 2, type: 'validation', text: 'Votre compte a été validé.', time: "Il y a 5 minutes", isRead: false }
  ]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedWallet = localStorage.getItem('wallet');
    const storedOrders = localStorage.getItem('my_orders');

    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
      if (storedWallet) setWallet(JSON.parse(storedWallet));
      if (storedOrders) setMyOrders(JSON.parse(storedOrders));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('wallet');
    navigate('/login');
  };

  const downloadInvoice = (orderId) => {
    alert(`Téléchargement de la facture #${orderId} en cours...`);
  };

  // --- LOGIQUE DASHBOARD ---
  const markAllAsRead = () => {
    const updated = activities.map(act => ({ ...act, isRead: true }));
    setActivities(updated);
  };

  const loadMoreActivities = () => {
    const more = [
      { id: Date.now(), type: 'info', text: 'Nouveau badge débloqué : Vendeur Bronze.', time: "Il y a 2 heures", isRead: true },
      { id: Date.now() + 1, type: 'promo', text: 'Promo flash : -20% sur les iPhones.', time: "Il y a 1 jour", isRead: true }
    ];
    setActivities([...activities, ...more]);
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    alert("Demande de retrait envoyée avec succès !");
    setShowWithdrawModal(false);
  };

  // --- LOGIQUE COMMANDES ---
  const getFilteredOrders = () => {
    let filtered = [...myOrders];

    // 1. Filtrage par statut
    if (filterStatus !== 'Toutes') {
      filtered = filtered.filter(o => o.status === filterStatus);
    }

    // 2. Recherche par ID
    if (searchQuery) {
      filtered = filtered.filter(o => o.id.toString().includes(searchQuery));
    }

    // Tri par défaut (Date décroissante)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return filtered;
  };

  // Fonction utilitaire pour calculer le temps restant (72h)
  const getReturnTimeLeft = (deliveryDate) => {
    if (!deliveryDate) return null;
    const delivery = new Date(deliveryDate);
    const deadline = new Date(delivery.getTime() + 72 * 60 * 60 * 1000);
    const now = new Date();
    const diff = deadline - now;

    if (diff <= 0) return null; // Délai dépassé

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };


  if (!user) return <div className="p-10 text-center">Chargement...</div>;

  // --- 1. VUE D'ENSEMBLE (INTACTE) ---
  const DashboardHome = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-blue-800 mb-1">Sécurisez votre compte</h4>
          <p className="text-sm text-blue-600 mb-2">Ajoutez une photo et un email pour compléter votre profil à 100%.</p>
          <div className="w-full max-w-xs h-2 bg-blue-200 rounded-full overflow-hidden">
            <div className="w-[40%] h-full bg-blue-600 rounded-full"></div>
          </div>
        </div>
        <button onClick={() => setActiveTab('profile')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 whitespace-nowrap">
          Compléter mon profil
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-emerald-600 text-white p-6 rounded-xl shadow-md relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition"><Wallet size={60} /></div>
          <div className="text-emerald-100 text-sm font-medium mb-1">Solde Disponible</div>
          <div className="text-3xl font-bold mb-4">{new Intl.NumberFormat('fr-SN').format(wallet.disponible)} FCFA</div>
          <button 
            onClick={() => setShowWithdrawModal(true)}
            className="bg-white/20 hover:bg-white/30 text-white text-sm py-2 px-4 rounded-lg transition w-full flex items-center justify-center gap-2 font-bold"
          >
            Retirer <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="bg-orange-500 text-white p-6 rounded-xl shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10"><Shield size={60} /></div>
          <div className="text-orange-100 text-sm font-medium mb-1">En attente (72h)</div>
          <div className="text-3xl font-bold mb-4">{new Intl.NumberFormat('fr-SN').format(wallet.en_attente)} FCFA</div>
          <div className="text-xs text-orange-100 flex items-center gap-1 bg-orange-600/30 p-2 rounded">
            <AlertCircle size={14} /> Sécurisé jusqu'à la livraison
          </div>
        </div>

        <div className="bg-blue-600 text-white p-6 rounded-xl shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10"><CreditCard size={60} /></div>
          <div className="text-blue-100 text-sm font-medium mb-1">Bonus & Cartes Cadeaux</div>
          <div className="text-3xl font-bold mb-4">{new Intl.NumberFormat('fr-SN').format(wallet.bonus)} FCFA</div>
          <button onClick={() => setActiveTab('wallet')} className="bg-white/20 hover:bg-white/30 text-white text-sm py-2 px-4 rounded-lg transition w-full flex items-center justify-center gap-2 font-bold">
            <Plus size={16} /> Recharger
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-800">Activités Récentes</h3>
          <button onClick={markAllAsRead} className="text-blue-600 text-sm font-medium hover:underline">Tout marquer comme lu</button>
        </div>
        
        <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {activities.map((act) => (
            <div key={act.id} className={`flex items-start gap-3 p-3 rounded-lg border transition ${act.isRead ? 'bg-white border-white' : 'bg-blue-50 border-blue-100'}`}>
              <div className={`p-2 rounded-full shrink-0 ${act.isRead ? 'bg-gray-100 text-gray-500' : 'bg-blue-200 text-blue-700'}`}>
                {act.type === 'welcome' ? <Store size={16} /> : <Bell size={16} />}
              </div>
              <div>
                <p className={`text-sm ${act.isRead ? 'text-gray-600' : 'text-gray-800 font-medium'}`}>{act.text}</p>
                <p className="text-xs text-gray-500 mt-1">{act.time}</p>
              </div>
            </div>
          ))}
        </div>
        
        <button onClick={loadMoreActivities} className="w-full mt-4 text-center text-gray-500 text-sm font-medium hover:text-blue-600 transition py-2 border-t border-gray-100">
          Voir plus d'activités
        </button>
      </div>
    </div>
  );

  // --- 2. MES COMMANDES (MODIFIÉE : Annulation/Retour + Recherche + Filtre) ---
  const OrderDetailsModal = ({ order, onClose }) => {
    // États locaux pour le formulaire d'annulation/retour
    const [actionType, setActionType] = useState(null); // 'cancel' ou 'return' ou null
    const [reason, setReason] = useState('');
    const [files, setFiles] = useState([]);

    if (!order) return null;

    const timeLeft = order.status === 'Livrée' ? getReturnTimeLeft(order.date) : null; // Pour simplifier, on utilise date commande comme date livraison pour le test

    // Gestion de la soumission du formulaire
    const handleSubmitRequest = (e) => {
      e.preventDefault();
      if (actionType === 'cancel') {
        alert(`Demande d'annulation envoyée pour la commande #${order.id}.\nMotif : ${reason}`);
      } else if (actionType === 'return') {
        alert(`Demande de retour envoyée pour la commande #${order.id}.\nMotif : ${reason}\nFichiers : ${files.length} photo(s)`);
      }
      setActionType(null); // Retour à la vue détails
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
          
          {/* En-tête */}
          <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {actionType === 'cancel' ? 'Annuler la commande' : actionType === 'return' ? 'Retourner le colis' : `Commande #${order.id}`}
              </h2>
              {actionType === null && <p className="text-sm text-gray-500">Passée le {new Date(order.date).toLocaleString()}</p>}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
          </div>

          {/* Contenu (Scrollable) */}
          <div className="p-6 overflow-y-auto">
            
            {/* VUE DÉTAILS (Par défaut) */}
            {actionType === null && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold 
                    ${order.status === 'Livrée' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {order.status}
                  </span>
                  <button onClick={() => downloadInvoice(order.id)} className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline">
                    <FileText size={16} /> Télécharger la facture
                  </button>
                </div>

                {/* Boutons d'action contextuels */}
                <div className="mb-6 flex gap-3">
                  {(order.status === 'En cours de traitement' || order.status === "En cours d'expédition" || order.status === 'Prête pour Expédition') && (
                    <button 
                      onClick={() => setActionType('cancel')}
                      className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition border border-red-200 w-full"
                    >
                      Annuler ma commande
                    </button>
                  )}
                  
                  {order.status === 'Livrée' && timeLeft && (
                    <button 
                      onClick={() => setActionType('return')}
                      className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-orange-100 transition border border-orange-200 w-full flex items-center justify-center gap-2"
                    >
                       Retourner mon colis (<Clock size={14}/> {timeLeft} restants)
                    </button>
                  )}
                   {order.status === 'Livrée' && !timeLeft && (
                    <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg text-sm font-bold border border-gray-200 w-full text-center">
                      Délai de retour expiré
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-gray-700 mb-3 uppercase text-xs tracking-wide">Articles commandés</h3>
                <div className="space-y-3 mb-6">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border p-3 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 w-10 h-10 flex items-center justify-center rounded font-bold text-gray-500">{item.quantity}x</div>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <span className="font-bold text-gray-700">{new Intl.NumberFormat('fr-SN').format(item.price * item.quantity)} F</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-700 mb-2 text-xs uppercase">Adresse de livraison</h3>
                    {order.shipping_address ? (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        <span className="font-bold text-gray-800">{order.shipping_address.fullName}</span><br/>
                        {order.shipping_address.addressLine}<br/>
                        {order.shipping_address.city}<br/>
                        Tél: {order.shipping_address.phone}
                      </p>
                    ) : <p className="text-sm text-gray-400">Non renseignée</p>}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-700 mb-2 text-xs uppercase">Paiement</h3>
                    <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Méthode</span><span className="font-medium">{order.payment_method}</span></div>
                    <div className="flex justify-between text-sm mb-1"><span className="text-gray-500">Livraison</span><span className="font-medium">{order.shipping_fee ? order.shipping_fee : '--'} F</span></div>
                    <div className="flex justify-between text-lg font-bold text-blue-800 mt-2 pt-2 border-t border-gray-200"><span>Total payé</span><span>{new Intl.NumberFormat('fr-SN').format(order.total)} F</span></div>
                  </div>
                </div>
              </>
            )}

            {/* FORMULAIRE ANNULATION */}
            {actionType === 'cancel' && (
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800 flex gap-2 items-start">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <strong>Attention :</strong> Si votre commande est déjà en cours d'expédition, les frais de livraison ne seront pas remboursés.
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Pourquoi souhaitez-vous annuler ?</label>
                  <textarea 
                    required
                    className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-32"
                    placeholder="Expliquez la raison..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setActionType(null)} className="flex-1 py-3 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">Retour</button>
                  <button type="submit" className="flex-1 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700">Confirmer l'annulation</button>
                </div>
              </form>
            )}

            {/* FORMULAIRE RETOUR */}
            {actionType === 'return' && (
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                   Vous avez 72h pour retourner cet article. Le remboursement sera effectué après vérification au Hub.
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Motif du retour</label>
                  <select 
                    className="w-full p-3 border rounded-lg outline-none bg-white mb-3"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  >
                    <option value="">-- Choisir un motif --</option>
                    <option value="Defective">Produit défectueux / Cassé</option>
                    <option value="WrongItem">Mauvais article reçu</option>
                    <option value="ChangedMind">J'ai changé d'avis</option>
                    <option value="Other">Autre</option>
                  </select>
                  <textarea 
                    required
                    className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24"
                    placeholder="Détails supplémentaires..."
                    value={reason === 'Other' ? '' : undefined} // Reset si pas 'Other', logic simplifiée ici
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Preuves (Photos/Vidéos)</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition cursor-pointer relative">
                    <input 
                      type="file" 
                      multiple 
                      accept="image/*,video/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setFiles([...e.target.files])}
                    />
                    <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Cliquez pour ajouter des fichiers (Max 3)</p>
                    {files.length > 0 && (
                      <div className="mt-2 text-sm text-green-600 font-bold">{files.length} fichier(s) sélectionné(s)</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setActionType(null)} className="flex-1 py-3 border border-gray-300 rounded-lg font-bold text-gray-600 hover:bg-gray-50">Retour</button>
                  <button type="submit" className="flex-1 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700">Confirmer le retour</button>
                </div>
              </form>
            )}

          </div>

          {/* Pied de page (Uniquement si pas en mode action) */}
          {actionType === null && (
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-100">Fermer</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const OrdersTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        {/* Liste des statuts mise à jour avec "Retournée" */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {['Toutes', 'En cours de traitement', 'Prête pour Expédition', "En cours d'expédition", 'Livrée', 'Annulée', 'Retournée'].map(status => (
            <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filterStatus === status ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{status}</button>
          ))}
        </div>
        
        {/* Barre de recherche par ID à la place du tri */}
        <div className="flex items-center gap-2 min-w-fit w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher par N° de commande..." 
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {myOrders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center"><div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"><ShoppingBag size={30} /></div><h3 className="text-lg font-bold text-gray-800 mb-2">Aucune commande</h3><p className="text-gray-500 mb-6">Vous n'avez pas encore acheté de produits.</p><button onClick={() => navigate('/')} className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-800">Commencer mes achats</button></div>
      ) : (
        <div className="space-y-4">
          {getFilteredOrders().map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col md:flex-row gap-6 justify-between items-start md:items-center group">
              <div className="flex items-center gap-4"><div className="bg-blue-100 text-blue-600 p-3 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition"><Package size={24} /></div><div><div className="flex items-center gap-2 mb-1"><h3 className="font-bold text-gray-800">Commande #{order.id}</h3><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{order.status}</span></div><p className="text-sm text-gray-500">{new Date(order.date).toLocaleDateString()} • {order.items.length} articles</p></div></div>
              <div className="text-right w-full md:w-auto flex flex-row md:flex-col justify-between items-center md:items-end"><div className="font-bold text-lg text-gray-900 mb-1">{new Intl.NumberFormat('fr-SN').format(order.total)} FCFA</div><button onClick={() => setSelectedOrder(order)} className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-50 transition">Voir détails</button></div>
            </div>
          ))}
          {getFilteredOrders().length === 0 && (<div className="text-center py-10 text-gray-500">Aucune commande ne correspond à votre recherche.</div>)}
        </div>
      )}
      {selectedOrder && (<OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />)}
    </div>
  );

  // --- AUTRES ONGLETS (Simplifiés) ---
  const WalletTab = () => (<div className="bg-white p-6 rounded-xl border"><h3 className="font-bold mb-4">Recharger mon compte</h3><p className="text-sm text-gray-500">Module de dépôt et cartes cadeaux.</p></div>);
  const AffiliateTab = () => (<div className="space-y-6"><div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-6 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center gap-4"><div><h3 className="font-bold text-lg">Invitez vos amis</h3><p className="text-emerald-100 text-sm">Gagnez 1.5% sur chaque achat.</p></div><div className="flex gap-2 bg-white/10 p-1 rounded-lg"><input type="text" readOnly value={user.referral_code || "Chargement"} className="bg-transparent border-none text-white px-3 outline-none font-mono font-bold" /><button onClick={() => {navigator.clipboard.writeText(`https://market.com?ref=${user.referral_code}`); alert("Copié")}} className="bg-white text-emerald-800 px-4 py-2 rounded font-bold text-sm">Copier</button></div></div><div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">Votre arbre est vide.</div></div>);
  const SellerTab = () => (<div className="bg-white p-8 rounded-xl border text-center"><h3 className="text-2xl font-bold mb-4">Devenir Vendeur</h3><p className="mb-6">Ouvrez votre boutique.</p><button className="bg-blue-700 text-white px-8 py-3 rounded-full font-bold">Commencer</button></div>);
  const ProfileTab = () => (<div className="bg-white p-8 rounded-xl border"><h3 className="font-bold mb-6">Mon Profil</h3><div className="space-y-4"><input type="text" value={user.full_name} className="w-full p-2 border rounded bg-gray-50" readOnly /><input type="text" value={user.phone} className="w-full p-2 border rounded bg-gray-50" readOnly /><button className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold">Enregistrer</button></div></div>);
  const SettingsTab = () => (<div className="bg-white p-6 rounded-xl border"><h3 className="font-bold mb-4">Paramètres</h3><p>Sécurité & Notifications.</p></div>);

  // --- MODALE DE RETRAIT (INTACTE) ---
  const WithdrawModal = () => {
    if (!showWithdrawModal) return null;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-bold text-lg text-gray-800">Effectuer un retrait</h3>
            <button onClick={() => setShowWithdrawModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20}/></button>
          </div>
          <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant (Min: 2000 F)</label>
              <input type="number" className="w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ex: 10000" min="2000" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Moyen de réception</label>
              <select className="w-full p-3 border rounded-lg outline-none bg-white">
                <option>Wave</option>
                <option>Orange Money</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de téléphone</label>
              <input type="text" className="w-full p-3 border rounded-lg outline-none" defaultValue={user.phone} />
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition">Confirmer le retrait</button>
          </form>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return <DashboardHome />;
      case 'wallet': return <WalletTab />;
      case 'orders': return <OrdersTab />;
      case 'affiliate': return <AffiliateTab />;
      case 'seller': return <SellerTab />;
      case 'profile': return <ProfileTab />;
      case 'settings': return <SettingsTab />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans text-slate-800">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="p-6 border-b border-gray-100"><a href="/" className="text-2xl font-bold tracking-tight">Market<span className="text-yellow-400">Sénégal</span></a></div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><LayoutDashboard size={20} /> Vue d'ensemble</button>
          <button onClick={() => setActiveTab('wallet')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'wallet' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><CreditCard size={20} /> Portefeuille</button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'orders' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><ShoppingBag size={20} /> Mes Commandes</button>
          <button onClick={() => setActiveTab('affiliate')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'affiliate' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Users size={20} /> Partenaire</button>
          <button onClick={() => setActiveTab('seller')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'seller' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><Store size={20} /> Vendeur</button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}><User size={20} /> Profil</button>
        </nav>
        <div className="p-4 border-t border-gray-100 space-y-1">
          <button onClick={() => setActiveTab('settings')} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"><Settings size={20} /> Paramètres</button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"><LogOut size={20} /> Déconnexion</button>
        </div>
      </aside>
      <main className="flex-1 md:ml-64">
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
          <div><h1 className="text-xl font-bold text-gray-800">Mon Espace</h1><p className="text-xs text-gray-500">Bienvenue, {user.full_name}</p></div>
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center"><User size={20} /></div>
        </header>
        <div className="p-8 pb-20">
          {renderContent()}
        </div>
        {/* MODALE RETRAIT GLOBALE */}
        <WithdrawModal />
      </main>
    </div>
  );
}

export default DashboardPage;