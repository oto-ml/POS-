import React from 'react';

export const OrdersView: React.FC = () => {
  return (
    <main className="flex-1 p-6 lg:p-8 bg-background-dark text-white overflow-y-auto">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="text-secondary mt-1">Aquí se listan todos los pedidos (vista temporal).</p>
      </header>

      <div className="rounded-xl bg-[#102316] p-6 border border-white/10">
        <p className="text-secondary">No hay contenido implementado aún — componente creado para resolver import faltante.</p>
      </div>
    </main>
  );
};

export default OrdersView;
