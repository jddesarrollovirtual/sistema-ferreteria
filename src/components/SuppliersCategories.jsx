import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Tag, Truck } from 'lucide-react';

export default function SuppliersCategories({ addNotification }) {
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loadingCat, setLoadingCat] = useState(false);
  const [loadingSup, setLoadingSup] = useState(false);
  const [dbError, setDbError] = useState(false);

  // Input states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch Categories
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (catError) throw catError;
      setCategories(catData || []);

      // Fetch Suppliers
      const { data: supData, error: supError } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      if (supError) throw supError;
      setSuppliers(supData || []);
      setDbError(false);
    } catch (error) {
      console.error('Error fetching categories/suppliers, fallback active:', error);
      setDbError(true);
      
      // Setup Mock Data
      setCategories([
        { id: 1, name: 'Herramientas Manuales' },
        { id: 2, name: 'Materiales Eléctricos' },
        { id: 3, name: 'Plomería' },
        { id: 4, name: 'Pinturas' },
      ]);
      setSuppliers([
        { id: 1, name: 'Ferretería Central S.A.', phone: '987654321', email: 'ventas@ferreteriacentral.com' },
        { id: 2, name: 'Distribuidora Eléctrica SAC', phone: '912345678', email: 'contacto@distrielectrica.com' },
      ]);
    }
  };

  // Categories CRUD
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoadingCat(true);
    try {
      if (dbError) throw new Error('Simulation Mode');

      const { error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName }]);
      if (error) throw error;

      addNotification('Categoría agregada con éxito.', 'success');
      setNewCategoryName('');
      fetchData();
    } catch (error) {
      console.warn('Agregar categoría (Simulado):', error.message);
      const newCat = { id: Date.now(), name: newCategoryName };
      setCategories([...categories, newCat]);
      setNewCategoryName('');
      addNotification('Categoría agregada (Simulado).', 'success');
    } finally {
      setLoadingCat(false);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!confirm(`¿Está seguro de eliminar la categoría "${name}"? Ello puede afectar los productos asociados.`)) return;

    setLoadingCat(true);
    try {
      if (dbError) throw new Error('Simulation Mode');

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;

      addNotification('Categoría eliminada.', 'success');
      fetchData();
    } catch (error) {
      console.warn('Eliminar categoría (Simulado):', error.message);
      setCategories(categories.filter((c) => c.id !== id));
      addNotification('Categoría eliminada (Simulado).', 'success');
    } finally {
      setLoadingCat(false);
    }
  };

  // Suppliers CRUD
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;

    setLoadingSup(true);
    const payload = {
      name: newSupplierName,
      phone: newSupplierPhone || null,
      email: newSupplierEmail || null,
    };

    try {
      if (dbError) throw new Error('Simulation Mode');

      const { error } = await supabase
        .from('suppliers')
        .insert([payload]);
      if (error) throw error;

      addNotification('Proveedor agregado con éxito.', 'success');
      setNewSupplierName('');
      setNewSupplierPhone('');
      setNewSupplierEmail('');
      fetchData();
    } catch (error) {
      console.warn('Agregar proveedor (Simulado):', error.message);
      const newSup = { id: Date.now(), ...payload };
      setSuppliers([...suppliers, newSup]);
      setNewSupplierName('');
      setNewSupplierPhone('');
      setNewSupplierEmail('');
      addNotification('Proveedor agregado (Simulado).', 'success');
    } finally {
      setLoadingSup(false);
    }
  };

  const handleDeleteSupplier = async (id, name) => {
    if (!confirm(`¿Está seguro de eliminar al proveedor "${name}"?`)) return;

    setLoadingSup(true);
    try {
      if (dbError) throw new Error('Simulation Mode');

      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);
      if (error) throw error;

      addNotification('Proveedor eliminado.', 'success');
      fetchData();
    } catch (error) {
      console.warn('Eliminar proveedor (Simulado):', error.message);
      setSuppliers(suppliers.filter((s) => s.id !== id));
      addNotification('Proveedor eliminado (Simulado).', 'success');
    } finally {
      setLoadingSup(false);
    }
  };

  return (
    <div className="suppliers-categories-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1>Proveedores y Categorías</h1>
          <p>Organice las familias de productos y gestione los contactos de sus distribuidores.</p>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Categories */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={20} className="text-primary" />
            Categorías
          </h2>

          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Nueva Categoría (Ej. Plomería)" 
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loadingCat}>
              <Plus size={16} />
            </button>
          </form>

          <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nombre de Categoría</th>
                  <th style={{ textAlign: 'right' }}>Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '0.4rem' }}
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        disabled={loadingCat}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem' }}>
                      No hay categorías registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Suppliers */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 750, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Truck size={20} className="text-primary" />
            Proveedores
          </h2>

          <form onSubmit={handleAddSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Nombre del Proveedor *" 
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                required
              />
            </div>
            <div className="grid-2">
              <input 
                type="text" 
                className="form-input" 
                placeholder="Teléfono (Opcional)" 
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
              />
              <input 
                type="email" 
                className="form-input" 
                placeholder="Email (Opcional)" 
                value={newSupplierEmail}
                onChange={(e) => setNewSupplierEmail(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loadingSup}>
              <Plus size={16} /> Registrar Proveedor
            </button>
          </form>

          <div className="table-container" style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Contacto</th>
                  <th style={{ textAlign: 'right' }}>Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      {s.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.email}</div>}
                    </td>
                    <td>{s.phone || 'Sin número'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '0.4rem' }}
                        onClick={() => handleDeleteSupplier(s.id, s.name)}
                        disabled={loadingSup}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1.5rem' }}>
                      No hay proveedores registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
