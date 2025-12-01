import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { MenuItem, UserRole } from '../types';

interface InventoryViewProps {
  userRole?: UserRole;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ userRole }) => {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    name: '',
    price: 0,
    category: 'Platos Fuertes',
    image: ''
  });

  const categories = ['Platos Fuertes', 'Entradas', 'Bebidas', 'Postres', 'Extras'];

  // --- CARGAR PRODUCTOS ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
      setProducts(items);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // --- ACCIONES DE ADMINISTRADOR ---
  const handleDelete = async (id: string, name: string) => {
    if (userRole !== 'admin') return;
    if (!confirm(`¿Eliminar "${name}" del menú permanentemente?`)) return;

    try {
      await deleteDoc(doc(db, "products", id));
      alert("Producto eliminado.");
      fetchProducts();
    } catch (error) {
      console.error("Error eliminando:", error);
    }
  };

  const handleEdit = (item: MenuItem) => {
    if (userRole !== 'admin') return;
    setFormData(item);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setFormData({ name: '', price: 0, category: 'Platos Fuertes', image: '' });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return alert("Nombre y precio son obligatorios");

    try {
      if (isEditing && formData.id) {
        // Actualizar existente
        const ref = doc(db, "products", formData.id);
        await updateDoc(ref, { ...formData });
        alert("Producto actualizado");
      } else {
        // Crear nuevo
        await addDoc(collection(db, "products"), {
            ...formData,
            image: formData.image || 'https://placehold.co/200x200/22492f/FFF?text=Sin+Imagen'
        });
        alert("Producto agregado al menú");
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error("Error guardando:", error);
      alert("Error al guardar cambios");
    }
  };

  return (
    <main className="flex-1 p-6 lg:p-8 bg-background-dark overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-white text-3xl font-black">Inventario y Menú</h1>
                <p className="text-secondary text-sm">Gestiona los productos disponibles para la venta.</p>
            </div>
            
            {userRole === 'admin' && (
                <button 
                    onClick={handleAddNew}
                    className="bg-primary text-background-dark font-bold px-6 py-3 rounded-xl hover:bg-primary-hover flex items-center gap-2 shadow-lg shadow-primary/20 transition-transform hover:scale-105"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    Nuevo Producto
                </button>
            )}
        </div>

        {/* Tabla de Productos */}
        <div className="bg-[#102316] border border-white/10 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#183422] text-secondary text-xs uppercase font-bold border-b border-white/10">
                        <tr>
                            <th className="px-6 py-4">Producto</th>
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4 text-right">Precio</th>
                            {userRole === 'admin' && <th className="px-6 py-4 text-center">Acciones</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr><td colSpan={4} className="text-center py-8 text-white">Cargando inventario...</td></tr>
                        ) : products.map(item => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-3">
                                    <div className="flex items-center gap-4">
                                        <div 
                                            className="size-10 rounded-lg bg-cover bg-center bg-gray-800"
                                            style={{ backgroundImage: `url('${item.image}')` }}
                                        />
                                        <span className="text-white font-bold">{item.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-3">
                                    <span className="px-3 py-1 rounded-full bg-white/5 text-secondary text-xs border border-white/10">
                                        {item.category}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    <span className="text-primary font-mono font-bold text-lg">${item.price.toFixed(2)}</span>
                                </td>
                                {userRole === 'admin' && (
                                    <td className="px-6 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleEdit(item)}
                                                className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"
                                                title="Editar"
                                            >
                                                <span className="material-symbols-outlined text-xl">edit</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(item.id, item.name)}
                                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                                                title="Eliminar"
                                            >
                                                <span className="material-symbols-outlined text-xl">delete</span>
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Modal de Edición/Creación */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-[#183422] w-full max-w-md rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center">
                      <h3 className="text-white text-xl font-bold">
                          {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                      </h3>
                      <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  
                  <form onSubmit={handleSave} className="p-6 space-y-4">
                      <div>
                          <label className="block text-secondary text-xs font-bold uppercase mb-2">Nombre del Platillo</label>
                          <input 
                              type="text" 
                              required
                              className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none"
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                          />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-secondary text-xs font-bold uppercase mb-2">Precio ($)</label>
                              <input 
                                  type="number" 
                                  required
                                  step="0.01"
                                  className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none"
                                  value={formData.price}
                                  onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                              />
                          </div>
                          <div>
                              <label className="block text-secondary text-xs font-bold uppercase mb-2">Categoría</label>
                              <select 
                                  className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none"
                                  value={formData.category}
                                  onChange={e => setFormData({...formData, category: e.target.value})}
                              >
                                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="block text-secondary text-xs font-bold uppercase mb-2">URL de Imagen</label>
                          <input 
                              type="text" 
                              className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none"
                              placeholder="https://..."
                              value={formData.image}
                              onChange={e => setFormData({...formData, image: e.target.value})}
                          />
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button 
                              type="button"
                              onClick={() => setShowModal(false)}
                              className="flex-1 bg-transparent border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/5"
                          >
                              Cancelar
                          </button>
                          <button 
                              type="submit"
                              className="flex-1 bg-primary text-background-dark font-bold py-3 rounded-xl hover:bg-primary-hover"
                          >
                              Guardar
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </main>
  );
};