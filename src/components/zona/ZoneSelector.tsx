import { useDataContext } from '../../data/dataContext'
import { usePitchStore } from '../../store/usePitchStore'

export function ZoneSelector() {
  const { getZones, getZoneData, getCategoryData } = useDataContext()
  const {
    selectedZone, selectedCategory,
    setSelectedZone, setSelectedCategory, setZoneData,
  } = usePitchStore()

  const zones = getZones()

  const categoriesForZone = selectedZone
    ? (getZoneData(selectedZone)?.categories.map((c) => c.category) ?? [])
    : []

  function handleZoneChange(zone: string) {
    setSelectedZone(zone)
  }

  function handleCategoryChange(category: string) {
    setSelectedCategory(category)
    if (selectedZone) {
      const zoneData = getZoneData(selectedZone)
      const catData = getCategoryData(selectedZone, category)
      if (zoneData && catData) setZoneData(zoneData, catData)
    }
  }

  return (
    <div className="card space-y-4">
      <h2 className="section-title">Zona operativa</h2>

      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          Zona
        </label>
        <select
          value={selectedZone ?? ''}
          onChange={(e) => handleZoneChange(e.target.value)}
          className="input-field"
        >
          <option value="">Selecciona una zona...</option>
          {zones.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>

      {selectedZone && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Categoría del restaurante
          </label>
          <select
            value={selectedCategory ?? ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="input-field"
          >
            <option value="">Selecciona una categoría...</option>
            {categoriesForZone.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
