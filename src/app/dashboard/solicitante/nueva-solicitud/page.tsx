'use client';

import { useState, useReducer } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SolicitanteLayout } from '@/components/layout/SolicitanteLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, FileText, Upload, Calendar, DollarSign, Building, CreditCard, MessageSquare, CheckCircle } from 'lucide-react';
import { SolicitudesService } from '@/services/solicitudes.service';
import { toast } from 'react-hot-toast';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale/es';
import { NumericFormat } from 'react-number-format';

// Reducer para manejar el formulario
const initialState = {
  departamento: '',
  monto: '',
  cuenta_destino: '',
  concepto: '',
  tipo_pago: 'transferencia',
  fecha_limite_pago: '',
  factura_file: null as File | null
};

const formReducer = (state: any, action: any) => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
};

export default function NuevaSolicitudPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, dispatch] = useReducer(formReducer, initialState);
  const [fechaLimitePago, setFechaLimitePago] = useState<Date | null>(null);
  const [cuentaValida, setCuentaValida] = useState<null | boolean>(null);
  const [checkingCuenta, setCheckingCuenta] = useState(false);

  const departamentoOptions = [
    { value: 'contabilidad', label: 'Contabilidad' },
    { value: 'facturacion', label: 'Facturación' },
    { value: 'cobranza', label: 'Cobranza' },
    { value: 'vinculacion', label: 'Vinculación' },
    { value: 'administracion', label: 'Administración' },
    { value: 'ti', label: 'TI' },
    { value: 'automatizaciones', label: 'Automatizaciones' },
    { value: 'comercial', label: 'Comercial' },
    { value: 'atencion a clientes', label: 'Atención a Clientes' },
    { value: 'tesoreria', label: 'Tesorería' },
    { value: 'nomina', label: 'Nómina' }
  ];

  const tipoPagoOptions = [
    { value: 'viaticos', label: 'Viáticos' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'factura', label: 'Factura' },
    { value: 'nominas', label: 'Nóminas' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'proveedores', label: 'Proveedores' },
    { value: 'administrativos', label: 'Administrativos' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    dispatch({ type: 'SET_FIELD', field: name, value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'factura_file') => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      const valid = validateFile(file);
      if (!valid) return;

      dispatch({ type: 'SET_FIELD', field: fieldName, value: file });
    }
  };

  const validateFile = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.ms-excel', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no permitido. Solo se permiten archivos PDF, Excel, JPG y PNG.');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo 5MB.');
      return false;
    }

    return true;
  };

  // Simulación de verificación de cuenta (reemplaza por tu API real si existe)
  const verificarCuentaDestino = async (cuenta: string) => {
    setCheckingCuenta(true);
    setCuentaValida(null);
    try {
      // Aquí deberías hacer una petición real a tu backend para validar la cuenta
      // Por ejemplo: const res = await fetch(`/api/cuentas/validar?cuenta=${cuenta}`);
      // const data = await res.json();
      // setCuentaValida(data.valida);
      await new Promise(r => setTimeout(r, 700)); // Simula delay
      setCuentaValida(cuenta.length >= 8); // Ejemplo: válida si tiene 8+ caracteres
    } catch {
      setCuentaValida(false);
    } finally {
      setCheckingCuenta(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validar cuenta antes de enviar
    if (cuentaValida === false) {
      toast.error('La cuenta destino no es válida o no existe.');
      setLoading(false);
      return;
    }
    if (checkingCuenta) {
      toast.error('Espera a que termine la verificación de la cuenta destino.');
      setLoading(false);
      return;
    }

    try {
      // Validaciones básicas
      const requiredFields = ['departamento', 'monto', 'cuenta_destino', 'concepto', 'fecha_limite_pago'];
      for (let field of requiredFields) {
        if (!formData[field]) {
          toast.error(`Por favor completa el campo: ${field}`);
          setLoading(false);
          return;
        }
      }

      if (!formData.factura_file) {
        toast.error('Por favor adjunta la factura');
        setLoading(false);
        return;
      }

      const solicitudData = {
        departamento: formData.departamento,
        monto: formData.monto,
        cuenta_destino: formData.cuenta_destino,
        concepto: formData.concepto,
        tipo_pago: formData.tipo_pago,
        fecha_limite_pago: formData.fecha_limite_pago,
        factura: formData.factura_file
      };

      const response = await SolicitudesService.createWithFiles(solicitudData);
      toast.success(response.message || 'Solicitud creada exitosamente');
      router.push('/dashboard/solicitante/mis-solicitudes');
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear la solicitud';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requiredRoles={['solicitante']}>
      <SolicitanteLayout>
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
          {/* Header */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div>
                  <h1 className="text-3xl font-bold text-white font-montserrat mb-1">Nueva Solicitud de Pago</h1>
                  <p className="text-white/80 text-lg">Completa el formulario para crear una nueva solicitud</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-10 md:p-14">
            <div className="flex items-center space-x-4 mb-12">
              <div className="p-4 rounded-full bg-white/20">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Solicitud de Pago</h2>
                <p className="text-white/80 text-base">Completa todos los campos para crear tu solicitud</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    <Building className="w-4 h-4 inline mr-2" />
                    Departamento *
                  </label>
                  <select
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleInputChange}
                    required
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                  >
                    <option value="" className="text-gray-900">Seleccionar departamento</option>
                    {departamentoOptions.map(dept => (
                      <option key={dept.value} value={dept.value} className="text-gray-900">
                        {dept.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    <DollarSign className="w-4 h-4 inline mr-2" />
                    Monto *
                  </label>
                  {/* Campo de Monto mejorado */}
                  <NumericFormat
                    value={formData.monto}
                    name="monto"
                    thousandSeparator="," 
                    decimalSeparator="."
                    allowNegative={false}
                    allowLeadingZeros={false}
                    decimalScale={2}
                    fixedDecimalScale
                    placeholder="0.00"
                    required
                    onValueChange={({ value }) => dispatch({ type: 'SET_FIELD', field: 'monto', value })}
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                  />  
                </div>

                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Cuenta Destino *
                  </label>
                  <input
                    type="text"
                    name="cuenta_destino"
                    value={formData.cuenta_destino}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 18);
                      dispatch({ type: 'SET_FIELD', field: 'cuenta_destino', value });
                      setCuentaValida(null);
                    }}
                    onBlur={e => verificarCuentaDestino(e.target.value)}
                    placeholder="Número de cuenta (máx. 18 dígitos)"
                    required
                    maxLength={18}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                  />
                  {checkingCuenta && (
                    <span className="text-blue-300 text-sm ml-2">Verificando cuenta...</span>
                  )}
                  {cuentaValida === false && !checkingCuenta && (
                    <span className="text-red-400 text-sm ml-2">Cuenta no válida o no existe</span>
                  )}
                  {cuentaValida === true && !checkingCuenta && (
                    <span className="text-green-400 text-sm ml-2">Cuenta válida</span>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    Tipo de Pago
                  </label>
                  <select
                    name="tipo_pago"
                    value={formData.tipo_pago}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                  >
                    {tipoPagoOptions.map(tipo => (
                      <option key={tipo.value} value={tipo.value} className="text-gray-900">
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-base font-medium text-white/90 mb-3">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Fecha Límite de Pago *
                  </label>
                  <div className="relative">
                    <DatePicker
                      selected={fechaLimitePago}
                      onChange={(date: Date | null) => {
                        setFechaLimitePago(date);
                        dispatch({ type: 'SET_FIELD', field: 'fecha_limite_pago', value: date ? date.toISOString().split('T')[0] : '' });
                      }}
                      dateFormat="yyyy-MM-dd"
                      minDate={new Date()}
                      placeholderText="Selecciona la fecha"
                      className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 text-base"
                      calendarClassName="bg-white text-gray-900 rounded-lg shadow-lg"
                      locale={es}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <Calendar className="w-5 h-5 text-white/70" />
                    </span>
                  </div>
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-base font-medium text-white/90 mb-3">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Concepto *
                </label>
                <textarea
                  name="concepto"
                  value={formData.concepto}
                  onChange={handleInputChange}
                  placeholder="Describe el concepto del pago..."
                  required
                  rows={5}
                  className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 resize-none text-base"
                />
              </div>

              {/* Archivos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div>
                  <label className="block text-base font-medium text-white/90 mb-3">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Factura * (PDF, Excel, JPG, PNG - Máx. 5MB)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, 'factura_file')}
                    required
                    className="w-full px-5 py-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-white/30 file:text-white hover:file:bg-white/40 text-base"
                  />
                  {formData.factura_file && (
                    <div className="flex items-center mt-3 p-3 bg-white/10 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
                      <p className="text-white/80 text-sm">
                        {formData.factura_file.name} ({(formData.factura_file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-6 pt-10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="bg-gray-600 text-white border-gray-500 hover:bg-gray-700 px-8 py-4 text-base"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white hover:bg-green-700 shadow-lg border-0 px-8 py-4 font-medium text-base"
                >
                  {loading ? 'Creando solicitud...' : 'Crear Solicitud'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </SolicitanteLayout>
    </ProtectedRoute>
  );
}
