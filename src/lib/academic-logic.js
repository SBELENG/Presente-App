
/**
 * Lógica académica compartida para el cálculo de estados (REGULAR, PROMOCIÓN, LIBRE)
 */

export function calculateAcademicStatus(catedra, grades, attendancePct) {
  if (!catedra) return { label: '-', color: 'text-slate-400' };
  
  // --- 1. ASISTENCIA ---
  const hasAttendance = (attendancePct ?? 100) >= (catedra.porcentaje_asistencia || 80);

  // --- 2. NOTAS (PARCIALES) ---
  const minReg = catedra.nota_regularizacion || 5;
  const minProm = catedra.nota_promocion_minima || 7;
  const cantParciales = catedra.cant_parciales || 2;
  const cantRecs = catedra.cant_recuperatorios || 1;

  const originalPartials = [];
  for (let i = 1; i <= cantParciales; i++) {
    const val = parseFloat(grades[`parcial_${i}`]);
    originalPartials.push(isNaN(val) ? null : val);
  }

  const recs = [];
  for (let i = 1; i <= cantRecs; i++) {
    const val = parseFloat(grades[`recuperatorio_${i}`]);
    if (!isNaN(val)) recs.push(val);
  }

  // Lógica de Regularización: Los recuperatorios reemplazan las notas más bajas
  const finalPartialsForReg = [...originalPartials];
  if (recs.length > 0) {
    const sortedRecs = [...recs].sort((a, b) => b - a);
    const needyIdxs = finalPartialsForReg
      .map((v, i) => ({ v, i }))
      .filter(item => item.v === null || item.v < minReg)
      .sort((a, b) => (a.v === null ? -1 : a.v) - (b.v === null ? -1 : b.v));

    for (let j = 0; j < Math.min(sortedRecs.length, needyIdxs.length); j++) {
      if (sortedRecs[j] > (needyIdxs[j].v || 0)) {
        finalPartialsForReg[needyIdxs[j].i] = sortedRecs[j];
      }
    }
  }

  // --- 3. TRABAJOS PRÁCTICOS (Se promedian según pedido del usuario) ---
  let tpsPassed = true;
  const tpGrades = [];
  const cantTps = (catedra.cant_tps_separados || 0) + (catedra.cant_tps_con_parciales || 0) || (catedra.cant_tps || 0);
  
  if (catedra.tiene_tp_evaluable || cantTps > 0) {
    for (let i = 1; i <= cantTps; i++) {
      const val = parseFloat(grades[`tp_${i}`]);
      if (!isNaN(val)) tpGrades.push(val);
    }
    
    if (tpGrades.length > 0) {
      const tpAverage = tpGrades.reduce((a, b) => a + b, 0) / tpGrades.length;
      tpsPassed = tpAverage >= minReg;
    } else if (cantTps > 0) {
      tpsPassed = false; // Si hay TPs definidos pero ninguno cargado
    }
  }

  // --- 4. DETERMINACIÓN DE ESTADO ---
  const allExamsTaken = originalPartials.every(p => p !== null);
  const partialsOkReg = finalPartialsForReg.every(p => p !== null && p >= minReg);
  
  const isRegular = partialsOkReg && hasAttendance && tpsPassed;

  let canPromote = false;
  if (catedra.es_promocional && isRegular) {
    const partialsForProm = catedra.permite_recuperatorio_promocion ? finalPartialsForReg : originalPartials;
    const matchPromGrades = partialsForProm.every(p => p !== null && p >= minProm);
    
    const avg = partialsForProm.length > 0 ? partialsForProm.reduce((a,b) => a+(b||0), 0) / partialsForProm.length : 0;
    const matchAvg = catedra.nota_promocion_promedio ? avg >= catedra.nota_promocion_promedio : true;
    
    canPromote = matchPromGrades && matchAvg;
  }

  if (canPromote) return { label: 'PROMOCIÓN', color: 'text-primary bg-primary/10 border-primary/20', key: 'PROMOCION' };
  if (isRegular) return { label: 'REGULAR', color: 'text-success bg-success/10 border-success/20', key: 'REGULAR' };
  
  // Si no es ninguna de las anteriores, pero todavía está cursando (faltan notas o clases)
  if (!allExamsTaken || (tpGrades.length < cantTps)) {
       return { label: 'EN CURSO', color: 'text-slate-400 bg-slate-100 border-slate-200', key: 'EN_CURSO' };
  }

  return { label: 'LIBRE', color: 'text-danger bg-danger/10 border-danger/20', key: 'LIBRE' };
}
