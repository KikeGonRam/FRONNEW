'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PagadorLayout } from '@/components/layout/PagadorLayout';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { AdvancedFilters } from '@/components/ui/AdvancedFilters';
import { FileText, Eye, CreditCard, AlertCircle } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { toast } from 'react-hot-toast';
import { exportSolicitudesToCSV, exportSolicitudesToExcel, exportSolicitudesToPDF } from '@/utils/exportUtils';
import { ExportOptionsModal } from '@/components/solicitudes/ExportOptionsModal';
import { getPagosPendientes, marcarPagoComoPagado, subirComprobante } from '@/services/pagosService';
import type { Solicitud } from '../../../../../types/index';
import { PagoDetailModal } from '@/components/pagos/PagoDetailModal';
import { SubirComprobanteModal } from '@/components/pagos/SubirComprobanteModal';

export default function PagosPendientesPage() {
  const [selectedPago, setSelectedPago] = useState<Solicitud | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [procesandoPago, setProcesandoPago] = useState<number | null>(null);
  const [pagosPendientes, setPagosPendientes] = useState<Solicitud[]>([]);
  const [loadingPagos, setLoadingPagos] = useState(true);
  const [errorPagos, setErrorPagos] = useState<string | null>(null);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [comprobantePagoId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pagoAConfirmar, setPagoAConfirmar] = useState<Solicitud | null>(null);

  const {
    filters,
    filteredData: filteredPagos,
    resetFilters,
    updateFilters
  } = useAdvancedFilters(pagosPendientes, 'solicitudes');

  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedData: paginatedPagos,
    goToPage,
    changeItemsPerPage,
  } = usePagination({ data: filteredPagos, initialItemsPerPage: 10 });

  useEffect(() => {
    setLoadingPagos(true);
    getPagosPendientes()
      .then((data) => {
        setPagosPendientes(data);
        setErrorPagos(null);
      })
      .catch(() => {
        setErrorPagos('Error al cargar pagos pendientes');
      })
      .finally(() => setLoadingPagos(false));
  }, []);

  const handleViewDetail = (pago: Solicitud) => {
    setSelectedPago(pago);
    setShowDetailModal(true);
  };

  const handleProcesarPago = async (pago: Solicitud) => {
    setPagoAConfirmar(pago);
    setShowConfirmModal(true);
  };

  const confirmarProcesarPago = async () => {
    if (!pagoAConfirmar) return;
    setProcesandoPago(pagoAConfirmar.id_solicitud);
    setShowConfirmModal(false);
    try {
      const res = await marcarPagoComoPagado(pagoAConfirmar.id_solicitud);
      if (res && res.error) {
        toast.error(res.error || 'No se pudo marcar como pagada.');
      } else {
        toast.success(`Pago #${pagoAConfirmar.id_solicitud} procesado correctamente`);
        toast((t) => (
          <div>
            <strong>¡Advertencia!</strong>
            <div>Tiene un límite de <span className="text-red-600 font-bold">3 días</span> para subir el comprobante de pago.</div>
            <Button onClick={() => toast.dismiss(t.id)} className="mt-2 bg-blue-600 text-white">Entendido</Button>
          </div>
        ), { duration: 8000 });
        setPagosPendientes((prev) => prev.filter((p) => p.id_solicitud !== pagoAConfirmar.id_solicitud));
      }
    } catch {
      toast.error('Error al procesar el pago');
    }
    setProcesandoPago(null);
    setPagoAConfirmar(null);
  };

  const handleExport = (format: string) => {
    switch(format) {
      case 'csv':
        exportSolicitudesToCSV(filteredPagos as Solicitud[]);
        toast.success(`${filteredPagos.length} pagos exportados a CSV`);
        break;
      case 'excel':
        exportSolicitudesToExcel(filteredPagos as Solicitud[]);
        toast.success(`${filteredPagos.length} pagos exportados a Excel`);
        break;
      case 'pdf':
        exportSolicitudesToPDF(filteredPagos as Solicitud[]);
        toast.success(`${filteredPagos.length} pagos exportados a PDF`);
        break;
    }
  };

  const getDepartmentColorClass = (departamento: string) => {
    const departamentosColores: Record<string, string> = {
      'Finanzas': 'px-3 py-1 text-sm font-medium rounded-lg bg-blue-100 text-blue-800',
      'Recursos Humanos': 'px-3 py-1 text-sm font-medium rounded-lg bg-purple-100 text-purple-800',
      'Marketing': 'px-3 py-1 text-sm font-medium rounded-lg bg-green-100 text-green-800',
      'Ventas': 'px-3 py-1 text-sm font-medium rounded-lg bg-orange-100 text-orange-800',
      'Operaciones': 'px-3 py-1 text-sm font-medium rounded-lg bg-teal-100 text-teal-800',
      'Tecnología': 'px-3 py-1 text-sm font-medium rounded-lg bg-indigo-100 text-indigo-800',
      'Administración': 'px-3 py-1 text-sm font-medium rounded-lg bg-pink-100 text-pink-800',
      'Logística': 'px-3 py-1 text-sm font-medium rounded-lg bg-amber-100 text-amber-800',
      'Proyectos': 'px-3 py-1 text-sm font-medium rounded-lg bg-cyan-100 text-cyan-800',
      'Legal': 'px-3 py-1 text-sm font-medium rounded-lg bg-red-100 text-red-800'
    };
    return departamentosColores[departamento] || 'px-3 py-1 text-sm font-medium rounded-lg bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const openExportModal = () => {
    setShowExportModal(true);
  };

  const handleSubirComprobante = async (file: File) => {
    if (!comprobantePagoId) return;
    await subirComprobante(comprobantePagoId, file);
    toast.success('Comprobante subido correctamente');
  };

  return (
    <ProtectedRoute requiredRoles={['pagador_banca']}>
      <PagadorLayout>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white font-sans">
                  Pagos Pendientes
                </h2>
                <p className="text-white/80">
                  {filteredPagos.length} pagos pendientes de procesamiento
                </p>
              </div>
              <Button
                onClick={openExportModal}
                className="bg-white/15 backdrop-blur-sm text-white border border-white/30 hover:bg-white/25"
              >
                <FileText className="w-4 h-4 mr-2" /> Exportar
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-500/20">
                  <CreditCard className="w-8 h-8 text-blue-300" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-white/80">Total Pendiente</p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(pagosPendientes.reduce((sum: number, p: Solicitud) => sum + (p.monto || 0), 0))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white/15 rounded-xl p-4 mb-6">              
            <AdvancedFilters
              filters={filters}
              onFiltersChange={updateFilters}
              onExport={() => openExportModal()}
              onReset={resetFilters}
              type="pagos"
            />
          </div>

          {/* Pagos Table */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6 font-sans">
                Pagos Pendientes de Procesamiento
              </h3>
              
              <div className="bg-white rounded-xl overflow-hidden">
                {loadingPagos ? (
                  <div className="py-12 text-center">
                    <div className="w-8 h-8 border-4 border-blue-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 text-lg">Cargando pagos pendientes...</p>
                  </div>
                ) : errorPagos ? (
                  <div className="py-12 text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <p className="text-red-500 text-lg">{errorPagos}</p>
                  </div>
                ) : paginatedPagos.length === 0 ? (
                  <div className="py-12 text-center">
                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No hay pagos pendientes</p>
                    <p className="text-gray-400">Todos los pagos han sido procesados</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead style={{backgroundColor: '#F0F4FC'}}>
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Solicitante
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Departamento
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Monto
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha Límite Pago
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Estado
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Cuenta/Tarjeta</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banco Destino</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aprobador</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {paginatedPagos.map((pago: Solicitud) => (
                            <tr key={pago.id_solicitud} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                #{pago.id_solicitud}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {typeof pago.nombre_usuario === 'string' && pago.nombre_usuario
                                  ? pago.nombre_usuario
                                  : typeof pago.usuario_nombre === 'string' && pago.usuario_nombre
                                  ? pago.usuario_nombre
                                  : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getDepartmentColorClass(pago.departamento)}>
                                  {pago.departamento}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(pago.monto)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(pago.fecha_limite_pago || pago.fecha_creacion).toLocaleDateString('es-CO')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  Autorizada
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pago.tipo_cuenta_destino ? pago.tipo_cuenta_destino : ''}
                                {pago.tipo_tarjeta ? ` / ${pago.tipo_tarjeta}` : ''}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {pago.banco_destino || ''}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {typeof pago.aprobador_nombre === 'string' && pago.aprobador_nombre
                                  ? pago.aprobador_nombre
                                  : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleViewDetail(pago)}
                                    style={{color: '#3B82F6', borderColor: '#3B82F6'}}
                                    className="hover:bg-blue-50"
                                  >
                                    <Eye className="w-4 h-4 mr-1" /> Ver
                                  </Button>
                                  <Button 
                                    variant="primary" 
                                    size="sm"
                                    onClick={() => handleProcesarPago(pago)}
                                    disabled={procesandoPago === pago.id_solicitud}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {procesandoPago === pago.id_solicitud ? (
                                      <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Procesando...
                                      </>
                                    ) : (
                                      <>
                                        <CreditCard className="w-4 h-4 mr-1" /> Procesar
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{backgroundColor: '#F0F4FC'}} className="px-6 py-4">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={goToPage}
                        onItemsPerPageChange={changeItemsPerPage}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Export Options Modal */}
        <ExportOptionsModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
          itemCount={filteredPagos.length}
        />

        {/* Pago Detail Modal */}
        <PagoDetailModal 
          isOpen={showDetailModal} 
          pago={selectedPago} 
          onClose={() => setShowDetailModal(false)} 
        />
        <SubirComprobanteModal 
          isOpen={showComprobanteModal} 
          onClose={() => setShowComprobanteModal(false)} 
          onSubmit={handleSubirComprobante}
        />

        {/* Modal de confirmación para procesar pago */}
        {showConfirmModal && pagoAConfirmar && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md text-black">
              <h3 className="text-xl font-bold mb-3">¿Confirmar procesamiento?</h3>
              <p className="mb-4">¿Estás seguro que deseas procesar el pago #{pagoAConfirmar.id_solicitud}? Esta acción marcará la solicitud como pagada y deberás subir el comprobante en máximo <span className="text-red-600 font-bold">3 días</span>.</p>
              <div className="flex space-x-2 justify-end">
                <Button variant="outline" className="bg-blue-600 text-white" onClick={() => { setShowConfirmModal(false); setPagoAConfirmar(null); }}>Cancelar</Button>
                <Button variant="primary" className="bg-green-600 text-white" onClick={confirmarProcesarPago}>Confirmar</Button>
              </div>
            </div>
          </div>
        )}
      </PagadorLayout>
    </ProtectedRoute>
  );
}
