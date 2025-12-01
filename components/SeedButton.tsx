import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { MENU_ITEMS } from '../constants';

export const SeedButton: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleSeed = async () => {
    setLoading(true);
    try {
      const productsCollection = collection(db, "products");
      // Subimos cada item del constants.ts
      for (const item of MENU_ITEMS) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...dataWithoutId } = item; // Quitamos el ID numérico viejo
        await addDoc(productsCollection, dataWithoutId);
      }
      alert('¡Menú subido a la base de datos con éxito!');
    } catch (error) {
      console.error(error);
      alert('Error al subir datos');
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handleSeed} 
      disabled={loading}
      className="bg-yellow-600 text-white px-4 py-2 rounded font-bold m-4"
    >
      {loading ? 'Subiendo...' : '⚡ Cargar Menú Inicial a BD'}
    </button>
  );
};