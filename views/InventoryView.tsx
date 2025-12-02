import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, query } from 'firebase/firestore';
import { MenuItem, UserRole } from '../types';
import { MENU_ITEMS } from '../constants';

interface InventoryViewProps { userRole?: UserRole; }

export const InventoryView: React.FC<InventoryViewProps> = ({ userRole }) => {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<MenuItem>>({ name: '', price: 0, category: 'Platos Fuertes', image: '', sku: '', stock: 0 });

  const categories = ['Platos Fuertes', 'Entradas', 'Bebidas', 'Postres', 'Panadería'];

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[]);
    } catch (error) { console.error("Error:", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleStockChange = async (item: MenuItem, delta: number) => {
      if (userRole !== 'admin') return;
      const newStock = (item.stock || 0) + delta;
      if (newStock < 0) return;
      setProducts(prev => prev.map(p => p.id === item.id ? { ...p, stock: newStock } : p));
      await updateDoc(doc(db, "products", item.id), { stock: newStock });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = { ...formData, image: formData.image || 'https://placehold.co/200x200/36454F/FFF?text=IMG', stock: Number(formData.stock), price: Number(formData.price) };
      if (isEditing && formData.id) await updateDoc(doc(db, "products", formData.id), productData);
      else await addDoc(collection(db, "products"), productData);
      setShowModal(false);
      fetchProducts();
    } catch (error) { alert("Error al guardar"); }
  };

  const handleDelete = async (id: string) => {
      if (userRole !== 'admin' || !confirm("¿Eliminar?")) return;
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <main className="flex-1 p-6 lg:p-8 bg-background-dark overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-white text-4xl font-black tracking-tight mb-2">Inventario</h1>
                <p className="text-secondary">Control de existencias y catálogo.</p>
            </div>
            {userRole === 'admin' && (
                <button onClick={() => { setFormData({name:'', price:0, category:'Platos Fuertes', sku:'', stock:0}); setIsEditing(false); setShowModal(true); }} 
                    className="bg-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-xl">add</span> Añadir Producto
                </button>
            )}
        </div>

        <div className="bg-surface-dark p-4 rounded-xl border border-white/5 mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary">
                        <span className="material-symbols-outlined">search</span>
                    </span>
                    <input type="text" placeholder="Buscar..." className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>
        </div>

        <div className="bg-surface-dark border border-white/5 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black/20 text-secondary text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-5">Producto</th>
                            <th className="px-6 py-5">SKU</th>
                            <th className="px-6 py-5">Categoría</th>
                            <th className="px-6 py-5">Precio</th>
                            <th className="px-6 py-5 w-64">Stock</th>
                            <th className="px-6 py-5 text-center">Estado</th>
                            {userRole === 'admin' && <th className="px-6 py-5 text-center">Editar</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {loading ? <tr><td colSpan={7} className="text-center py-10 text-secondary">Cargando...</td></tr> : filteredProducts.map(item => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4 flex items-center gap-4">
                                    <div className="size-10 rounded-md bg-white/5 bg-cover bg-center" style={{ backgroundImage: `url('${item.image}')` }} />
                                    <span className="text-white font-bold">{item.name}</span>
                                </td>
                                <td className="px-6 py-4 font-mono text-secondary">{item.sku || '---'}</td>
                                <td className="px-6 py-4 text-secondary">{item.category}</td>
                                <td className="px-6 py-4 text-white font-medium">${item.price.toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {userRole === 'admin' && <button onClick={() => handleStockChange(item, -1)} className="size-7 rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 flex items-center justify-center">-</button>}
                                        <div className="flex-1 text-center font-bold text-white">{item.stock || 0}</div>
                                        {userRole === 'admin' && <button onClick={() => handleStockChange(item, 1)} className="size-7 rounded bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white border border-green-500/20 flex items-center justify-center">+</button>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${(item.stock||0)===0 ? 'bg-red-500/20 text-red-400 border-red-500/30' : (item.stock||0)<20 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-green-500/20 text-green-400 border-green-500/30'}`}>
                                        {(item.stock||0)===0 ? 'Agotado' : (item.stock||0)<20 ? 'Bajo' : 'OK'}
                                    </span>
                                </td>
                                {userRole === 'admin' && (
                                    <td className="px-6 py-4 text-center">
                                        <button onClick={() => { setFormData(item); setIsEditing(true); setShowModal(true); }} className="text-primary hover:bg-primary/10 p-2 rounded"><span className="material-symbols-outlined">edit</span></button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:bg-red-500/10 p-2 rounded"><span className="material-symbols-outlined">delete</span></button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-surface-dark w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                      <h3 className="text-white text-xl font-bold">{isEditing ? 'Editar' : 'Nuevo'} Producto</h3>
                      <button onClick={() => setShowModal(false)} className="text-secondary hover:text-white"><span className="material-symbols-outlined">close</span></button>
                  </div>
                  <form onSubmit={handleSave} className="p-6 space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                          <div className="col-span-2">
                              <label className="block text-secondary text-xs font-bold uppercase mb-2">Nombre</label>
                              <input type="text" required className="w-full bg-background-dark text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-secondary text-xs font-bold uppercase mb-2">Precio</label>
                              <input type="number" required className="w-full bg-background-dark text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                          </div>
                          <div>
                              <label className="block text-secondary text-xs font-bold uppercase mb-2">Stock</label>
                              <input type="number" required className="w-full bg-background-dark text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                          </div>
                          <div className="col-span-2">
                              <label className="block text-secondary text-xs font-bold uppercase mb-2">Categoría</label>
                              <select className="w-full bg-background-dark text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                          </div>
                      </div>
                      <div className="pt-4 flex gap-3">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-transparent border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/5">Cancelar</button>
                          <button type="submit" className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-hover shadow-lg">Guardar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </main>
  );
};