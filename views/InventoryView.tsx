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
  
  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos'); // Nuevo estado para el filtro

  // Estado del formulario
  const [formData, setFormData] = useState<Partial<MenuItem>>({
      name: '',
      price: 0,
      category: 'Platos Fuertes',
      image: '',
      sku: '',
      stock: 0
  });

  const categories = ['Platos Fuertes', 'Entradas', 'Bebidas', 'Postres', 'Panadería'];
  const filterCategories = ['Todos', ...categories]; // Lista para el dropdown de filtro

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

  // --- LÓGICA VISUAL DE STOCK ---
  const getStockStatus = (stock: number = 0) => {
    if (stock === 0) return { 
        label: 'Agotado', 
        color: 'bg-red-500/10 text-red-400 border-red-500/20', 
        barColor: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]' 
    };
    if (stock < 20) return { 
        label: 'Bajo', 
        color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', 
        barColor: 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]' 
    };
    return { 
        label: 'OK', 
        color: 'bg-green-500/10 text-green-400 border-green-500/20', 
        barColor: 'bg-primary shadow-[0_0_10px_rgba(65,105,225,0.4)]' 
    };
  };

  const getStockWidth = (stock: number = 0) => {
      const percentage = Math.min(stock, 100);
      return `${percentage}%`;
  };

  // --- AJUSTE RÁPIDO DE STOCK ---
  const handleStockChange = async (item: MenuItem, delta: number) => {
      if (userRole !== 'admin') return;
      
      const currentStock = item.stock || 0;
      const newStock = currentStock + delta;
      
      if (newStock < 0) return;

      setProducts(prev => prev.map(p => p.id === item.id ? { ...p, stock: newStock } : p));

      try {
          await updateDoc(doc(db, "products", item.id), { stock: newStock });
      } catch (error) {
          console.error("Error actualizando stock:", error);
          fetchProducts();
      }
  };

  // --- GUARDAR PRODUCTO ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return alert("Datos incompletos");

    try {
      const productData = {
          ...formData,
          image: formData.image || 'https://placehold.co/200x200/36454F/FFF?text=IMG',
          stock: Number(formData.stock),
          price: Number(formData.price)
      };

      if (isEditing && formData.id) {
        await updateDoc(doc(db, "products", formData.id), productData);
      } else {
        await addDoc(collection(db, "products"), productData);
      }
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error("Error guardando:", error);
      alert("Error al guardar");
    }
  };

  // --- ELIMINAR PRODUCTO ---
  const handleDelete = async (id: string) => {
    if (userRole !== 'admin') return;
    if (!confirm(`¿Eliminar producto?`)) return;

    try {
      await deleteDoc(doc(db, "products", id));
      fetchProducts();
    } catch (error) {
      console.error("Error eliminando:", error);
    }
  };

  // --- IMPRIMIR RESUMEN ---
  const handlePrintSummary = () => {
      if (products.length === 0) return alert("No hay productos para generar el reporte.");
      const printWindow = window.open('', '_blank');
      if (!printWindow) return alert("Por favor habilita las ventanas emergentes.");

      const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      
      const totalValue = products.reduce((acc, curr) => acc + (curr.price * (curr.stock || 0)), 0);
      const totalItems = products.reduce((acc, curr) => acc + (curr.stock || 0), 0);
      const lowStockItems = products.filter(p => (p.stock || 0) < 20).length;

      const groupedProducts: { [key: string]: MenuItem[] } = {};
      products.forEach(p => {
          const cat = p.category || 'Sin Categoría';
          if (!groupedProducts[cat]) groupedProducts[cat] = [];
          groupedProducts[cat].push(p);
      });

      const htmlContent = `
        <html>
        <head>
            <title>Reporte de Inventario - Restaurante Upiicsa</title>
            <style>
                body { font-family: sans-serif; padding: 40px; color: #1a202c; max-width: 1000px; margin: 0 auto; }
                .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4169E1; padding-bottom: 20px; margin-bottom: 30px; }
                .brand h1 { margin: 0; font-size: 28px; color: #4169E1; }
                .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
                .card { background: #f7fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #4169E1; }
                .card p { margin: 0; font-size: 24px; font-weight: bold; }
                .category-title { font-size: 16px; font-weight: bold; background: #edf2f7; padding: 10px 15px; margin-top: 20px; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
                th { text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e0; }
                td { padding: 8px 10px; border-bottom: 1px solid #edf2f7; }
                .text-right { text-align: right; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="brand"><h1>Restaurante Upiicsa</h1><p>Reporte de Inventario</p></div>
                <div class="meta"><p>${today}</p></div>
            </div>
            <div class="summary-cards">
                <div class="card"><h3>Valor Total</h3><p>$${totalValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p></div>
                <div class="card"><h3>Unidades</h3><p>${totalItems}</p></div>
                <div class="card"><h3>Bajo Stock</h3><p>${lowStockItems}</p></div>
            </div>
            ${Object.keys(groupedProducts).map(category => `
                <div class="category-title">${category}</div>
                <table>
                    <thead><tr><th>Producto</th><th class="text-right">Costo</th><th class="text-center">Stock</th><th class="text-right">Total</th></tr></thead>
                    <tbody>
                        ${groupedProducts[category].map(p => `
                            <tr>
                                <td>${p.name}</td>
                                <td class="text-right">$${p.price.toFixed(2)}</td>
                                <td class="text-center">${p.stock || 0}</td>
                                <td class="text-right">$${((p.stock || 0) * p.price).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `).join('')}
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  // --- FILTRADO COMBINADO ---
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="flex-1 p-6 lg:p-8 bg-background-dark overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-white text-4xl font-black tracking-tight mb-2">Inventario</h1>
                <p className="text-secondary">Control de existencias y catálogo.</p>
            </div>
            
            {userRole === 'admin' && (
                <button 
                    onClick={() => {
                        setFormData({ name: '', price: 0, category: 'Platos Fuertes', image: '', sku: '', stock: 0 });
                        setIsEditing(false);
                        setShowModal(true);
                    }}
                    className="bg-primary text-white font-bold px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    Añadir Producto
                </button>
            )}
        </div>

        {/* Toolbar con Filtros */}
        <div className="bg-surface-dark p-4 rounded-xl border border-white/5 mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                {/* Buscador */}
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary">
                        <span className="material-symbols-outlined">search</span>
                    </span>
                    <input 
                        type="text"
                        placeholder="Buscar por nombre o SKU..."
                        className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-primary transition-colors placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* NUEVO: Filtro por Categoría */}
                <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="bg-black/20 border border-white/10 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 outline-none transition-colors cursor-pointer"
                >
                    {filterCategories.map(cat => (
                        <option key={cat} value={cat} className="bg-surface-dark text-white">
                            {cat}
                        </option>
                    ))}
                </select>
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={handlePrintSummary}
                    className="flex items-center gap-2 bg-white/5 text-secondary px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/10 hover:text-white transition-colors font-bold text-sm"
                >
                    <span className="material-symbols-outlined text-lg">print</span>
                    Imprimir
                </button>
            </div>
        </div>

        {/* Tabla */}
        <div className="bg-surface-dark border border-white/5 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-black/20 text-secondary text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-5">Producto</th>
                            <th className="px-6 py-5">SKU</th>
                            <th className="px-6 py-5">Categoría</th>
                            <th className="px-6 py-5">Precio</th>
                            <th className="px-6 py-5 w-72">Stock / Nivel</th>
                            <th className="px-6 py-5 text-center">Estado</th>
                            {userRole === 'admin' && <th className="px-6 py-5 text-center">Editar</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-10 text-secondary">Cargando datos...</td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-10 text-secondary">No se encontraron productos.</td></tr>
                        ) : filteredProducts.map(item => {
                            const stockInfo = getStockStatus(item.stock);
                            return (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div 
                                                className="size-10 rounded-md bg-white/5 bg-cover bg-center border border-white/5"
                                                style={{ backgroundImage: `url('${item.image}')` }}
                                            />
                                            <span className="text-white font-bold text-base">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-secondary">{item.sku || '---'}</td>
                                    <td className="px-6 py-4 text-secondary">{item.category}</td>
                                    <td className="px-6 py-4 text-white font-medium">${item.price.toFixed(2)}</td>
                                    
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {userRole === 'admin' && (
                                                <button 
                                                    onClick={() => handleStockChange(item, -1)}
                                                    className="size-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-sm"
                                                    title="-1 Unidad"
                                                >
                                                    <span className="material-symbols-outlined text-sm">remove</span>
                                                </button>
                                            )}
                                            
                                            <div className="flex-1 flex flex-col gap-1.5 min-w-[100px]">
                                                <div className="flex justify-between items-end px-1">
                                                    <span className="text-white font-bold text-sm">{item.stock || 0}</span>
                                                    <span className="text-[10px] text-secondary uppercase tracking-wider">Unidades</span>
                                                </div>
                                                <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${stockInfo.barColor}`} 
                                                        style={{ width: getStockWidth(item.stock) }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {userRole === 'admin' && (
                                                <button 
                                                    onClick={() => handleStockChange(item, 1)}
                                                    className="size-8 flex items-center justify-center rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all border border-green-500/20 shadow-sm"
                                                    title="+1 Unidad"
                                                >
                                                    <span className="material-symbols-outlined text-sm">add</span>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${stockInfo.color}`}>
                                            {stockInfo.label}
                                        </span>
                                    </td>
                                    
                                    {userRole === 'admin' && (
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => { setFormData(item); setIsEditing(true); setShowModal(true); }}
                                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            <div className="bg-black/20 px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-secondary text-sm">Mostrando <span className="text-white font-bold">{filteredProducts.length}</span> resultados</span>
            </div>
        </div>
      </div>

      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-surface-dark w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
                      <h3 className="text-white text-xl font-bold">
                          {isEditing ? 'Editar Producto' : 'Añadir Nuevo Producto'}
                      </h3>
                      <button onClick={() => setShowModal(false)} className="text-secondary hover:text-white transition-colors">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  
                  <form onSubmit={handleSave} className="p-6 space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                          <div className="col-span-2">
                              <label className="block text-secondary text-xs font-bold uppercase mb-2">Nombre</label>
                              <input 
                                  type="text" required
                                  className="w-full bg-background-dark text-white rounded-lg p-3 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                                  value={formData.name}
                                  onChange={e => setFormData({...formData, name: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-secondary text-xs font-bold uppercase mb-2">SKU</label>
                              <input type="text" className="w-full bg-background-dark text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none font-mono" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-secondary text-xs font-bold uppercase mb-2">Categoría</label>
                              <select className="w-full bg-background-dark text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-secondary text-xs font-bold uppercase mb-2">Precio ($)</label>
                              <input type="number" step="0.01" required className="w-full bg-background-dark text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                          </div>
                          <div>
                              <label className="block text-secondary text-xs font-bold uppercase mb-2">Stock Inicial</label>
                              <input type="number" required className="w-full bg-background-dark text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                          </div>
                          <div className="col-span-2">
                              <label className="block text-secondary text-xs font-bold uppercase mb-2">URL Imagen</label>
                              <input type="text" className="w-full bg-background-dark text-white rounded-lg p-3 border border-white/10 focus:border-primary outline-none" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                          </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-transparent border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/5 transition-colors">Cancelar</button>
                          <button type="submit" className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-colors">Guardar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </main>
  );
};