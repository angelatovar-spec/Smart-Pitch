import { usePitchStore } from '../../store/usePitchStore'

export function BrandForm() {
  const { brand, setBrand, categoryData } = usePitchStore()

  const totalCostPct =
    brand.costs.rawMaterial +
    brand.costs.payroll +
    brand.costs.rent +
    brand.costs.services +
    brand.costs.others

  const currentMargin = Math.max(0, 100 - totalCostPct)

  return (
    <div className="card space-y-4">
      <h2 className="section-title">Datos del restaurante</h2>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          Nombre del restaurante
        </label>
        <input
          type="text"
          placeholder="Ej: Hamburguesas El Corral"
          value={brand.name}
          onChange={(e) => setBrand({ name: e.target.value })}
          className="input-field"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Ticket promedio (COP)
          </label>
          <input
            type="number"
            placeholder={categoryData ? String(categoryData.avgTicket) : '0'}
            value={brand.avgTicket || ''}
            onChange={(e) => setBrand({ avgTicket: Number(e.target.value) })}
            className="input-field"
          />
          {categoryData && (
            <p className="text-[10px] text-gray-400 mt-1">
              Promedio zona: {categoryData.avgTicket.toLocaleString('es-CO')}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Sedes en la zona
          </label>
          <input
            type="number"
            min={1}
            value={brand.branches}
            onChange={(e) => setBrand({ branches: Number(e.target.value) })}
            className="input-field"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          Ventas mensuales actuales (COP)
        </label>
        <input
          type="number"
          placeholder="Ej: 50000000"
          value={brand.monthlyRevenue || ''}
          onChange={(e) => setBrand({ monthlyRevenue: Number(e.target.value) })}
          className="input-field"
        />
        <p className="text-[10px] text-gray-400 mt-1">Ventas totales del canal propio por mes</p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          Horario de operación
        </label>
        <input
          type="text"
          placeholder="Ej: 11:00 - 22:00"
          value={brand.schedule}
          onChange={(e) => setBrand({ schedule: e.target.value })}
          className="input-field"
        />
      </div>

      {/* Margen actual */}
      <div className={[
        'rounded-xl p-3 text-center transition-colors',
        currentMargin >= 15 ? 'bg-green-50' : 'bg-yellow-50',
      ].join(' ')}>
        <p className="text-xs text-gray-500">Margen estimado actual</p>
        <p className={[
          'text-3xl font-black',
          currentMargin >= 15 ? 'text-green-600' : 'text-yellow-600',
        ].join(' ')}>
          {currentMargin.toFixed(0)}%
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          Estructura de costos: {totalCostPct.toFixed(0)}%
        </p>
      </div>
    </div>
  )
}
