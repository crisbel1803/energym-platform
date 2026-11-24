/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import GymCalendar from '../components/GymCalendar';
import api from '../services/api';
import {
  X,
  Clock,
  MapPin,
  DollarSign,
  CheckCircle,
  CreditCard,
  Upload,
  ArrowLeft,
  Users,
  AlertCircle,
} from 'lucide-react';

interface ClassEventProps {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    instructor: string;
    description: string;
    capacity: number;
    availableSlots?: number;
    price: number;
    room: string;
  };
}

type PaymentMethodOption = 'PayPal' | 'Transferencia' | 'Pago Móvil';

function canBookClassNow(startStr: string, now: Date = new Date()): boolean {
  const startDate = new Date(startStr);
  if (Number.isNaN(startDate.getTime())) return false;
  return startDate.getTime() >= now.getTime();
}

export default function ClasesSchedule() {
  const [events, setEvents] = useState<ClassEventProps[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<ClassEventProps | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 'details' -> muestra información de la clase | 'payment' -> selecciona método y paga el cupo
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodOption>('Pago Móvil');
  const [paymentReference, setPaymentReference] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [reserveMessage, setReserveMessage] = useState<string | null>(null);
  const [paypalError, setPaypalError] = useState<string | null>(null);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/classes');
      if (res.data.ok && res.data.events.length > 0) {
        setEvents(res.data.events);
      }
    } catch (error) {
      console.error('Error al cargar clases en horarios:', error);
    }
  }, []);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const resetPaymentState = () => {
    setStep('details');
    setPaymentMethod('Pago Móvil');
    setPaymentReference('');
    setReceiptFile(null);
    setReserveMessage(null);
    setPaypalError(null);
    setSubmitting(false);
  };

  const handleEventClick = (info: {
    event: {
      id: string;
      title: string;
      startStr: string;
      endStr: string;
      extendedProps: Record<string, unknown>;
    };
  }) => {
    setSelectedEvent({
      id: info.event.id,
      title: info.event.title,
      start: info.event.startStr,
      end: info.event.endStr,
      extendedProps: info.event.extendedProps as ClassEventProps['extendedProps'],
    });
    resetPaymentState();
    setIsModalOpen(true);
  };

  const handleBookingSuccess = async (message: string, availableSlots?: number) => {
    setReserveMessage(message);
    await fetchClasses();

    if (typeof availableSlots === 'number') {
      setSelectedEvent((prev) =>
        prev
          ? {
              ...prev,
              extendedProps: {
                ...prev.extendedProps,
                availableSlots,
              },
            }
          : null
      );
    }

    setTimeout(() => {
      setIsModalOpen(false);
      resetPaymentState();
    }, 2000);
  };

  // Flujo manual para Pago Móvil y Transferencia
  const handleConfirmManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    if (!canBookClassNow(selectedEvent.start)) {
      alert('Solo puedes reservar clases cuya fecha y hora sean a partir del momento actual.');
      return;
    }

    if (!receiptFile && !paymentReference.trim()) {
      alert('Sube la captura del comprobante o ingresa el número de referencia.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('gymClassId', selectedEvent.id);
      formData.append('paymentMethod', paymentMethod);

      if (paymentReference.trim()) {
        formData.append('paymentReference', paymentReference.trim());
      }
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const res = await api.post('/bookings', formData);

      if (res.data.ok) {
        await handleBookingSuccess(
          res.data.message || '¡Reserva procesada con éxito!',
          res.data.availableSlots
        );
      }
    } catch (error: any) {
      console.error('Error al reservar:', error);
      alert(error?.response?.data?.message || 'Error al procesar la reserva');
    } finally {
      setSubmitting(false);
    }
  };

  const slotsLeft =
    selectedEvent?.extendedProps.availableSlots ?? selectedEvent?.extendedProps.capacity ?? 0;

  const isClassBookable = selectedEvent ? canBookClassNow(selectedEvent.start) : false;
  const canProceed = slotsLeft > 0 && isClassBookable;
  const hasPayPalClientId = Boolean(import.meta.env.VITE_PAYPAL_CLIENT_ID);

  return (
    <div className="min-h-screen bg-black text-white fuenteTilt flex flex-col justify-between">
      <Navbar />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 grow">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold fuenteStar text-white mb-4">
            Horario <span className="text-verde">Semanal</span>
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">
            Consulta nuestra programación, elige la clase de tu gusto y reserva tu espacio al instante.
          </p>
        </div>

        <GymCalendar events={events} onEventClick={handleEventClick} />
      </main>

      {/* Modal de Detalles y Pago de Reserva */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-gris border border-verde rounded-3xl max-w-lg w-full p-6 md:p-8 relative text-white shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetPaymentState();
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-verde cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold fuenteStar text-center text-verde uppercase mb-1">
              {selectedEvent.title}
            </h2>
            <p className="text-center text-gray-300 text-sm mb-5">
              Instructor:{' '}
              <span className="text-white font-semibold">
                {selectedEvent.extendedProps.instructor}
              </span>
            </p>

            {reserveMessage ? (
              <div className="bg-verde/20 border border-verde text-verde p-4 rounded-2xl text-center font-bold flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{reserveMessage}</span>
              </div>
            ) : step === 'details' ? (
              <>
                <div className="space-y-3 mb-6 bg-black/40 p-4 rounded-2xl border border-gray-800 text-sm">
                  <p className="text-gray-300">{selectedEvent.extendedProps.description}</p>
                  <div className="flex items-center gap-2 text-gray-300 pt-2 border-t border-gray-700">
                    <Clock className="w-4 h-4 text-verde" />
                    <span>
                      {new Date(selectedEvent.start).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      -{' '}
                      {new Date(selectedEvent.end).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="w-4 h-4 text-verde" />
                    <span>Salón: {selectedEvent.extendedProps.room}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="w-4 h-4 text-verde" />
                    <span>
                      Cupos disponibles: <strong>{slotsLeft}</strong> /{' '}
                      {selectedEvent.extendedProps.capacity}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-verde font-bold">
                    <DollarSign className="w-4 h-4" />
                    <span>${selectedEvent.extendedProps.price} USD</span>
                  </div>
                </div>

                {!isClassBookable && (
                  <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>
                      Solo puedes reservar clases programadas a partir del momento exacto actual.
                    </span>
                  </div>
                )}

                <button
                  onClick={() => setStep('payment')}
                  disabled={!canProceed}
                  className={`w-full font-bold py-3 px-6 rounded-2xl transition uppercase tracking-wider flex items-center justify-center gap-2 ${
                    !canProceed
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-verde hover:bg-verde/80 text-black cursor-pointer'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  {slotsLeft <= 0
                    ? 'Sin cupos disponibles'
                    : !isClassBookable
                    ? 'Reserva no disponible para este horario'
                    : 'Continuar a pagar cupo'}
                </button>
              </>
            ) : (
              <div className="space-y-4 text-sm">
                <button
                  type="button"
                  onClick={() => setStep('details')}
                  className="text-xs text-gray-300 hover:text-verde inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver a detalles de la clase
                </button>

                <div className="bg-black/50 border border-gray-800 rounded-2xl p-3 flex justify-between items-center">
                  <span className="text-gray-300">Monto a pagar:</span>
                  <span className="text-lg font-bold text-verde">
                    ${selectedEvent.extendedProps.price} USD
                  </span>
                </div>

                {/* Selector de método de pago */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                    Método de pago
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Pago Móvil', 'Transferencia', 'PayPal'] as PaymentMethodOption[]).map(
                      (method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => {
                            setPaymentMethod(method);
                            setPaypalError(null);
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            paymentMethod === method
                              ? 'bg-verde text-black border-verde'
                              : 'bg-black/40 text-gray-300 border-gray-700 hover:border-verde/60'
                          }`}
                        >
                          {method}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {paymentMethod === 'PayPal' ? (
                  <div className="space-y-3 bg-black/40 border border-gray-800 p-4 rounded-2xl">
                    <p className="text-xs text-gray-300">
                      Completa tu pago en PayPal Sandbox para confirmar tu cupo al instante.
                    </p>

                    {paypalError && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs text-amber-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                        <span>{paypalError}</span>
                      </div>
                    )}

                    {!hasPayPalClientId ? (
                      <p className="text-xs text-amber-300">
                        Configura VITE_PAYPAL_CLIENT_ID en el .env del frontend para mostrar el botón de PayPal.
                      </p>
                    ) : (
                      <div className="pt-1">
                        <PayPalButtons
                          disabled={!isClassBookable || submitting}
                          forceReRender={[selectedEvent.id, selectedEvent.extendedProps.price]}
                          style={{ layout: 'vertical', shape: 'pill' }}
                          createOrder={async () => {
                            setPaypalError(null);
                            try {
                              const res = await api.post('/bookings/paypal/create-order', {
                                gymClassId: selectedEvent.id,
                              });
                              if (!res.data?.ok || !res.data?.orderId) {
                                const msg = res.data?.message || 'No se pudo crear la orden de PayPal';
                                setPaypalError(msg);
                                throw new Error(msg);
                              }
                              return res.data.orderId;
                            } catch (err: any) {
                              const backendMsg =
                                err?.response?.data?.message ||
                                err?.message ||
                                'No se pudo iniciar el pago con PayPal.';
                              setPaypalError(backendMsg);
                              throw new Error(backendMsg);
                            }
                          }}
                          onApprove={async (data) => {
                            setSubmitting(true);
                            setPaypalError(null);
                            try {
                              const res = await api.post('/bookings/paypal/capture-order', {
                                orderId: data.orderID,
                                gymClassId: selectedEvent.id,
                              });
                              if (res.data.ok) {
                                await handleBookingSuccess(
                                  res.data.message || '¡Pago con PayPal verificado y reserva confirmada!',
                                  res.data.availableSlots
                                );
                              }
                            } catch (err: any) {
                              const msg =
                                err?.response?.data?.message ||
                                'No se pudo completar la captura del pago en PayPal.';
                              setPaypalError(msg);
                              alert(msg);
                            } finally {
                              setSubmitting(false);
                            }
                          }}
                          onError={(err) => {
                            console.error('Error en PayPalButtons:', err);
                            setPaypalError((prev) => prev || 'No se pudo iniciar el pago con PayPal.');
                          }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleConfirmManualBooking} className="space-y-3 bg-black/40 border border-gray-800 p-4 rounded-2xl">
                    <div className="text-xs text-gray-300 space-y-1 border-b border-gray-800 pb-3">
                      <p className="font-bold text-verde uppercase">Datos de Energym</p>
                      <p>Banco / Pago Móvil: Banesco / Mercantil — Tel: 0414-0000000</p>
                      <p>Titular / RIF: Energym Fitness — J-00000000-0</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1">
                        Número de Referencia:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. 00129485"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        className="bg-gris border border-gray-700 focus:border-verde rounded-2xl w-full py-2 px-4 text-sm text-white"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-semibold mb-1">
                        <Upload className="w-3.5 h-3.5 text-verde" /> Comprobante de Pago (Imagen):
                      </label>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setReceiptFile(e.target.files[0]);
                          }
                        }}
                        className="bg-gris border border-verde rounded-2xl w-full py-2 px-3 text-xs text-white file:mr-3 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-verde file:text-black cursor-pointer"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !isClassBookable}
                      className="w-full bg-verde hover:bg-verde/80 disabled:opacity-60 text-black font-bold py-3 px-6 rounded-2xl transition uppercase tracking-wider cursor-pointer"
                    >
                      {submitting ? 'Procesando reserva...' : 'Confirmar y pagar cupo'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}