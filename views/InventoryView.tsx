import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc, query, where } from 'firebase/firestore';
import { MenuItem, UserRole } from '../types';
import { MENU_ITEMS } from '../constants';

interface InventoryViewProps {
  userRole?: UserRole;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ userRole }) => {
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

    // Estado del formulario
    const [formData, setFormData] = useState<Partial<MenuItem>>({
        name: '',
        price: 0,
        category: MENU_ITEMS[0]?.category || 'Platos Fuertes',
        image: '',
        sku: '',
        stock: 0
    });

    // Obtener categorías únicas desde el menú principal
    const menuCategories = Array.from(new Set(MENU_ITEMS.map(i => i.category)));
    const categories = menuCategories.length ? menuCategories : ['Platos Fuertes', 'Entradas', 'Bebidas', 'Postres', 'Panadería'];

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
    if (stock === 0) return { label: 'Agotado', color: 'bg-red-500/20 text-red-400 border-red-500/50', barColor: 'bg-red-500' };
    if (stock < 20) return { label: 'Poco Stock', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', barColor: 'bg-yellow-500' };
    return { label: 'En Stock', color: 'bg-green-500/20 text-green-400 border-green-500/50', barColor: 'bg-green-500' };
  };

  const getStockWidth = (stock: number = 0) => {
      const percentage = Math.min(stock, 100);
      return `${percentage}%`;
  };

  // --- NUEVO: AJUSTE RÁPIDO DE STOCK (+/-) ---
  const handleStockChange = async (item: MenuItem, delta: number) => {
      if (userRole !== 'admin') return;
      
      const currentStock = item.stock || 0;
      const newStock = currentStock + delta;
      
      if (newStock < 0) return; // No permitir stock negativo

      // 1. Actualización Optimista (Visual inmediata)
      setProducts(prev => prev.map(p => p.id === item.id ? { ...p, stock: newStock } : p));

      try {
          // 2. Actualización en Firebase
          const ref = doc(db, "products", item.id);
          await updateDoc(ref, { stock: newStock });
      } catch (error) {
          console.error("Error actualizando stock:", error);
          fetchProducts(); // Revertir si falla
          alert("No se pudo actualizar el stock");
      }
  };

  // --- NUEVO: IMPRIMIR REPORTE ---
  const handlePrintSummary = () => {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return alert("Por favor habilita las ventanas emergentes");

      const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const totalValue = products.reduce((acc, curr) => acc + (curr.price * (curr.stock || 0)), 0);
      const totalItems = products.reduce((acc, curr) => acc + (curr.stock || 0), 0);

      const htmlContent = `
        <html>
        <head>
            <title>Reporte de Inventario</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #333; }
                .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 20px; margin-bottom: 20px; }
                h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
                .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th { border-bottom: 1px solid #333; text-align: left; padding: 8px 4px; text-transform: uppercase; }
                td { border-bottom: 1px solid #ddd; padding: 8px 4px; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .total-section { margin-top: 30px; border-top: 2px dashed #333; padding-top: 15px; text-align: right; font-size: 16px; font-weight: bold; }
                .low-stock { color: red; font-weight: bold; }
                @media print { button { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Reporte de Inventario General</h1>
                <p>Restaurante POS</p>
            </div>
            
            <div class="meta">
                <span>Fecha: ${today}</span>
                <span>Items Totales: ${totalItems}</span>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>SKU</th>
                        <th>Categoría</th>
                        <th class="text-right">Costo Unit.</th>
                        <th class="text-center">Existencias</th>
                        <th class="text-right">Valor Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(p => `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.sku || '-'}</td>
                            <td>${p.category}</td>
                            <td class="text-right">$${p.price.toFixed(2)}</td>
                            <td class="text-center ${p.stock && p.stock < 10 ? 'low-stock' : ''}">${p.stock || 0}</td>
                            <td class="text-right">$${((p.stock || 0) * p.price).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="total-section">
                VALOR TOTAL DEL INVENTARIO: $${totalValue.toFixed(2)}
            </div>

            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  // --- ACCIONES CRUD ---
  const handleDelete = async (id: string, name: string) => {
    if (userRole !== 'admin') return;
    if (!confirm(`¿Eliminar "${name}" del menú?`)) return;

    try {
      // 1. Eliminar el producto de la colección de productos
      await deleteDoc(doc(db, "products", id));
      
      // 2. Limpiar referencias del producto en órdenes pendientes (items array)
      const ordersQuery = query(collection(db, "orders"));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      for (const orderDoc of ordersSnapshot.docs) {
        const orderData = orderDoc.data();
        if (orderData.items && Array.isArray(orderData.items)) {
          // Filtrar los items para remover el producto eliminado
          const updatedItems = orderData.items.filter((item: any) => item.id !== id);
          
          // Si hay cambios, actualizar la orden
          if (updatedItems.length !== orderData.items.length) {
            if (updatedItems.length === 0) {
              // Si no quedan items, eliminar la orden completa
              await deleteDoc(doc(db, "orders", orderDoc.id));
            } else {
              // Si aún hay items, actualizar con los items restantes
              await updateDoc(doc(db, "orders", orderDoc.id), { items: updatedItems });
            }
          }
        }
      }
      
      // 3. Registrar en auditoría
      await addDoc(collection(db, "audit_logs"), {
        action: "delete_product",
        productId: id,
        productName: name,
        timestamp: new Date(),
        details: "Producto eliminado del sistema"
      });
      
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
    const randomSku = `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData({ name: '', price: 0, category: 'Platos Fuertes', image: '', sku: randomSku, stock: 50 });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return alert("Datos incompletos");

    try {
      const productData = {
          ...formData,
          image: formData.image || 'https://placehold.co/200x200/102316/FFF?text=IMG',
          stock: Number(formData.stock),
          price: Number(formData.price)
      };

      if (isEditing && formData.id) {
        const ref = doc(db, "products", formData.id);
        await updateDoc(ref, productData);
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

  // Filtrado
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="flex-1 p-6 lg:p-8 bg-[#0d1c12] overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        
        {/* Encabezado */}
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-white text-4xl font-black tracking-tight mb-2">Inventario</h1>
                <p className="text-gray-400">Control de existencias y catálogo de productos.</p>
            </div>
            
            {userRole === 'admin' && (
                <button 
                    onClick={handleAddNew}
                    className="bg-[#25f46a] text-[#0d1c12] font-bold px-6 py-3 rounded-lg hover:bg-[#1ee360] transition-colors flex items-center gap-2 shadow-lg shadow-green-500/20"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    Añadir Producto
                </button>
            )}
        </div>

        {/* Toolbar */}
        <div className="bg-[#14261a] p-4 rounded-xl border border-white/5 mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                        <span className="material-symbols-outlined">search</span>
                    </span>
                    <input 
                        type="text"
                        placeholder="Buscar por nombre o SKU..."
                        className="w-full bg-[#0d1c12] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#25f46a] transition-colors placeholder-gray-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                <button 
                    onClick={handlePrintSummary}
                    className="flex items-center gap-2 bg-[#1f3627] text-[#25f46a] px-4 py-2.5 rounded-lg border border-[#25f46a]/30 hover:bg-[#25f46a]/10 transition-colors font-bold text-sm"
                >
                    <span className="material-symbols-outlined text-lg">print</span>
                    Imprimir Resumen
                </button>
            </div>
        </div>

        {/* Tabla */}
        <div className="bg-[#14261a] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0f1f15] text-gray-500 text-xs uppercase font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-5">Producto</th>
                            <th className="px-6 py-5">SKU</th>
                            <th className="px-6 py-5">Categoría</th>
                            <th className="px-6 py-5">Precio</th>
                            <th className="px-6 py-5 w-64">Stock / Acciones</th>
                            <th className="px-6 py-5 text-center">Estado</th>
                            {userRole === 'admin' && <th className="px-6 py-5 text-center">Editar</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {loading ? (
                            <tr><td colSpan={7} className="text-center py-10 text-gray-500">Cargando datos...</td></tr>
                        ) : filteredProducts.map(item => {
                            const stockInfo = getStockStatus(item.stock);
                            return (
                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div 
                                                className="size-10 rounded-md bg-white/5 bg-cover bg-center border border-white/10"
                                                style={{ backgroundImage: `url('${item.image}')` }}
                                            />
                                            <span className="text-white font-bold text-base">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-400">{item.sku || '---'}</td>
                                    <td className="px-6 py-4 text-gray-300">{item.category}</td>
                                    <td className="px-6 py-4 text-white font-medium">${item.price.toFixed(2)}</td>
                                    
                                    {/* Columna de Stock con Botones */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {/* Botón Restar */}
                                            {userRole === 'admin' && (
                                                <button 
                                                    onClick={() => handleStockChange(item, -1)}
                                                    className="size-7 flex items-center justify-center rounded bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                                    title="-1 Unidad"
                                                >
                                                    <span className="material-symbols-outlined text-sm">remove</span>
                                                </button>
                                            )}
                                            
                                            {/* Barra Visual */}
                                            <div className="flex-1 flex flex-col gap-1 min-w-[80px]">
                                                <div className="flex justify-between text-xs font-bold px-1">
                                                    <span className="text-white">{item.stock || 0}</span>
                                                </div>
                                                <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-500 ${stockInfo.barColor}`} 
                                                        style={{ width: getStockWidth(item.stock) }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Botón Sumar */}
                                            {userRole === 'admin' && (
                                                <button 
                                                    onClick={() => handleStockChange(item, 1)}
                                                    className="size-7 flex items-center justify-center rounded bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white transition-all border border-green-500/20"
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
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(item)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                    className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
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
            
            {/* Paginación */}
            <div className="bg-[#0f1f15] px-6 py-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-gray-500 text-sm">Mostrando <span className="text-white font-bold">{filteredProducts.length}</span> resultados</span>
                <div className="flex gap-2">
                    {/* Placeholder para paginación futura */}
                    <button className="size-8 flex items-center justify-center rounded bg-[#25f46a] text-[#0d1c12] font-bold text-sm">1</button>
                </div>
            </div>
        </div>
      </div>

      {/* Modal de Edición (Igual que antes pero necesario para que el archivo esté completo) */}
      {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
              <div className="bg-[#14261a] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0f1f15]">
                      <h3 className="text-white text-xl font-bold">
                          {isEditing ? 'Editar Producto' : 'Añadir Nuevo Producto'}
                      </h3>
                      <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                          <span className="material-symbols-outlined">close</span>
                      </button>
                  </div>
                  
                  <form onSubmit={handleSave} className="p-6 space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                          <div className="col-span-2">
                              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Nombre del Producto</label>
                              <input 
                                  type="text" required
                                  className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-[#25f46a] focus:ring-1 focus:ring-[#25f46a] outline-none"
                                  value={formData.name}
                                  onChange={e => setFormData({...formData, name: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">SKU</label>
                              <input type="text" className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-[#25f46a] outline-none font-mono" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Categoría</label>
                              <select className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-[#25f46a] outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Precio ($)</label>
                              <input type="number" step="0.01" required className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-[#25f46a] outline-none" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                          </div>
                          <div>
                              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">Stock Inicial</label>
                              <input type="number" required className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-[#25f46a] outline-none" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                          </div>
                          <div className="col-span-2">
                              <label className="block text-gray-400 text-xs font-bold uppercase mb-2">URL Imagen</label>
                              <input type="text" className="w-full bg-[#0d1c12] text-white rounded-lg p-3 border border-white/10 focus:border-[#25f46a] outline-none" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
                          </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                          <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-transparent border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/5">Cancelar</button>
                          <button type="submit" className="flex-1 bg-[#25f46a] text-[#0d1c12] font-bold py-3 rounded-xl hover:bg-[#1ee360] shadow-lg shadow-green-500/20">Guardar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </main>
  );
};