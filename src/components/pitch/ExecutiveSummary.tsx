import { usePitchStore } from '../../store/usePitchStore'
import { formatLocalCurrencyCompact } from '../../utils/formatters'

export function ExecutiveSummary() {
  const { brand, zoneData, categoryData, pl, zoneCountry } = usePitchStore()
  const result = pl.result

  if (!result || !zoneData || !categoryData) return null

  const items = [
    { label: 'Restaurante', value: brand.name || '—' },
    { label: 'Zona', value: zoneData.opsZone },
    { label: 'Categoría', value: categoryData.category },
    { label: 'Comisión acordada', value: `${pl.commission}%` },
    { label: 'Ventas adicionales / mes', value: formatLocalCurrencyCompact(result.additionalSales, zoneCountry) },
    { label: 'Utilidad adicional / mes', value: formatLocalCurrencyCompact(result.additionalProfit, zoneCountry) },
    { label: 'ROI sobre comisión', value: `${result.roi.toFixed(0)}%` },
    { label: 'Usuarios en la zona', value: zoneData.totalUsers.toLocaleString('es-CO') },
  ]

  return (
    <div className="card space-y-4">
      <h2 className="section-title">Resumen ejecutivo</h2>
      <p className="text-xs text-gray-500">Para dejar al cliente después de la visita</p>

      <ul className="divide-y divide-gray-50">
        {items.map(({ label, value }) => (
          <li key={label} className="flex justify-between items-center py-2.5 text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-semibold text-gray-900">{value}</span>
          </li>
        ))}
      </ul>

      <div className="bg-rappi-orange/5 border border-rappi-orange/20 rounded-xl p-3 text-xs text-gray-600">
        <strong>Próximos pasos:</strong> Completar KYC, subir fotos del menú y configurar horario
        de operación en la plataforma. Tu ejecutivo de cuenta te contactará en menos de 24 horas.
      </div>
    </div>
  )
}
