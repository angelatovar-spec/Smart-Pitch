import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { usePitchStore } from '../../store/usePitchStore'

interface Props {
  contentRef: React.RefObject<HTMLDivElement>
}

export function ExportButton({ contentRef }: Props) {
  const [exporting, setExporting] = useState(false)
  const { brand, zoneData } = usePitchStore()

  async function handleExport() {
    if (!contentRef.current) return
    setExporting(true)

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      // Paginar si el contenido es muy largo
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yOffset = 0

      while (yOffset < pdfHeight) {
        if (yOffset > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfWidth, pdfHeight)
        yOffset += pageHeight
      }

      const fileName = `pitch-rappi-${brand.name || 'restaurante'}-${zoneData?.opsZone ?? 'zona'}.pdf`
        .toLowerCase()
        .replace(/\s+/g, '-')

      pdf.save(fileName)
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="btn-secondary flex items-center justify-center gap-2"
    >
      {exporting ? (
        <>
          <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar PDF
        </>
      )}
    </button>
  )
}
