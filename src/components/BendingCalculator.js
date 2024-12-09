// BendingCalculator.js
// Qui spostiamo tutta la logica di calcolo delle pieghe della lamiera.
// In questo modo il componente rimane più pulito e testabile separatamente.

export function calcolaBendAllowance(angolo, fattoreK, spessore, raggioPiega) {
  // angolo in gradi
  // BA = (angolo in radianti) * (R + K*T)
  const angoloRad = (Math.PI / 180) * angolo;
  return angoloRad * (raggioPiega + fattoreK * spessore);
}

export function calcolaSetback(angolo, spessore, raggioPiega) {
  // SB = (R+T)*tan(angolo/2)
  const angoloRad = (Math.PI / 180) * angolo;
  return (raggioPiega + spessore) * Math.tan(angoloRad / 2);
}

export function calcolaDettagliSegmenti(segments, spessore, raggioPiega, fattoreK) {
  const dettagli = [];
  let sviluppoTotale = 0;

  for (let i = 0; i < segments.length; i++) {
    const segmento = segments[i];
    const angolo = segmento.angle;
    let lunghezzaEffettiva = segmento.length;

    // Logica semplice per modificare leggermente le lunghezze effettive
    // Queste sono scelte tecniche da adattare in base alle necessità reali.
    if (i > 0 && angolo >= 0 && angolo <= 80) {
      lunghezzaEffettiva = segmento.length;
    } else if (i === 0 || i === segments.length - 1) {
      lunghezzaEffettiva -= spessore;
    } else {
      lunghezzaEffettiva -= 2 * spessore;
    }

    let bendAllowance = 0;
    let setback = null;
    let bendDeduction = null;

    // Calcoliamo BA, SB, BD solo se abbiamo un angolo di piega, tipicamente su segmenti "interni".
    if (i > 0 && angolo !== 0) {
      bendAllowance = calcolaBendAllowance(angolo, fattoreK, spessore, raggioPiega);
      setback = calcolaSetback(angolo, spessore, raggioPiega);
      bendDeduction = 2 * setback - bendAllowance;
    }

    sviluppoTotale += lunghezzaEffettiva + (bendAllowance || 0);

    dettagli.push({
      segmento: i + 1,
      lunghezzaEffettiva,
      bendAllowance,
      setback,
      bendDeduction,
    });
  }

  return { sviluppoTotale, dettagli };
}
