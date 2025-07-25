import { useState, useEffect } from 'react';
import { Solicitud, CreateSolicitudData, UpdateEstadoData } from '@/types';
import { SolicitudesService } from '@/services/solicitudes.service';
import { toast } from 'react-hot-toast';

export function useSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSolicitudes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SolicitudesService.getAll();
      // Ordena por id_solicitud descendente (más reciente primero)
      const sorted = [...data].sort((a, b) => b.id_solicitud - a.id_solicitud);
      setSolicitudes(sorted);
    } catch (err) {
      setError('Error al cargar las solicitudes');
      console.error('Error fetching solicitudes:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSolicitud = async (solicitudData: CreateSolicitudData): Promise<boolean> => {
    try {
      const newSolicitud = await SolicitudesService.create(solicitudData);
      setSolicitudes(prev => [newSolicitud, ...prev]);
      toast.success('Solicitud creada exitosamente');
      return true;
    } catch (error) {
      console.error('Error creating solicitud:', error);
      return false;
    }
  };

  const updateEstado = async (id: number, estadoData: UpdateEstadoData): Promise<boolean> => {
    try {
      const updatedSolicitud = await SolicitudesService.updateEstado(id, estadoData);
      setSolicitudes(prev => 
        prev.map(sol => sol.id_solicitud === id ? updatedSolicitud : sol)
      );
      toast.success(`Solicitud ${estadoData.estado} exitosamente`);
      return true;
    } catch (error) {
      console.error('Error updating solicitud estado:', error);
      return false;
    }
  };

  const deleteSolicitud = async (id: number): Promise<boolean> => {
    try {
      await SolicitudesService.delete(id);
      setSolicitudes(prev => prev.filter(sol => sol.id_solicitud !== id));
      toast.success('Solicitud eliminada exitosamente');
      return true;
    } catch (error) {
      console.error('Error deleting solicitud:', error);
      return false;
    }
  };

  const updateSolicitud = async (id: number, data: Partial<Solicitud>): Promise<boolean> => {
    try {
      const updated = await SolicitudesService.update(id, data);
      setSolicitudes(prev => prev.map(sol => sol.id_solicitud === id ? updated : sol));
      toast.success('Solicitud actualizada exitosamente');
      return true;
    } catch (error) {
      console.error('Error actualizando solicitud:', error);
      toast.error('Error al actualizar la solicitud');
      return false;
    }
  };

  useEffect(() => {
    fetchSolicitudes();
  }, []);

  return {
    solicitudes,
    loading,
    error,
    fetchSolicitudes,
    createSolicitud,
    updateEstado,
    deleteSolicitud,
    updateSolicitud,
  };
}
