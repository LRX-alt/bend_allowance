<template>
  <div class="calcolatore">
    <!-- Intestazione -->
    <header>
      <h1>Calcolatore Sviluppo Lamiera</h1>
    </header>

    <!-- Sezione Parametri Generali -->
    <section class="parametri">
      <h2>Parametri Generali</h2>
      <div class="form-row">
        <label>Spessore lamiera (mm):</label>
        <input v-model.number="spessore" type="number" step="0.1" min="0.1" required @input="validaSpessore" />
        <p v-if="errors.spessore" class="error-message">Il valore dello spessore deve essere maggiore di 0.</p>
      </div>
      <div class="form-row">
        <label>Raggio di piega (mm):</label>
        <input v-model.number="raggioPiega" type="number" step="0.1" min="0" required @input="validaRaggioPiega" />
        <p v-if="errors.raggioPiega" class="error-message">Il raggio di piega non può essere negativo.</p>
      </div>
      <div class="form-row">
        <label>Materiale:</label>
        <select v-model="materialeSelezionato" @change="aggiornaFattoreK" required>
          <option disabled value="">Seleziona un materiale</option>
          <option v-for="(fattoreK, materiale) in fattoriKMateriali" :key="materiale" :value="materiale">
            {{ materiale }} (K = {{ fattoreK }})
          </option>
        </select>
      </div>
      <div class="form-row">
        <label>Aggiungi nuovo materiale:</label>
        <input v-model="nuovoMateriale.nome" type="text" placeholder="Nome materiale" />
        <input v-model.number="nuovoMateriale.fattoreK" type="number" step="0.01" min="0" placeholder="Fattore K" />
        <button type="button" @click="aggiungiMateriale" class="btn-add-materiale">Aggiungi Materiale</button>
      </div>
    </section>

    <!-- Sezione Segmenti -->
    <section class="segmenti">
      <h2>Segmenti</h2>
      <div v-for="(segment, index) in segments" :key="index" class="segmento">
        <div class="form-row">
          <label>Lunghezza segmento {{ index + 1 }} (mm):</label>
          <input v-model.number="segment.length" type="number" step="0.1" min="0.1" required @input="validaLunghezza(segment); calcolaSviluppo()" />
          <p v-if="segment.errorLength" class="error-message">La lunghezza deve essere maggiore di 0.</p>
        </div>
        <div class="form-row">
          <label>Angolo piega (°):</label>
          <input
            v-model.number="segment.angle"
            type="number"
            step="1"
            min="-180"
            max="180"
            @input="validaAngolo(segment); calcolaSviluppo()"
            required
          />
          <p v-if="segment.errorAngle" class="error-message">Angolo non valido! Deve essere tra -180° e 180°.</p>
        </div>
        <div class="form-row">
          <label>Tipologia di piega:</label>
          <select v-model="segment.tipoPiega" @change="calcolaSviluppo()">
            <option value="su">In su</option>
            <option value="giu">In giù</option>
          </select>
        </div>
        <div class="form-actions">
          <button type="button" @click="rimuoviLato(index)" class="btn-remove">
            Rimuovi Segmento
          </button>
        </div>
      </div>
      <button type="button" @click="aggiungiLato" class="btn-add">Aggiungi Segmento</button>
    </section>

    <!-- Pulsante Esporta Disegno -->
    <section class="esporta">
      <button type="button" @click="esportaPDF" class="btn-export">Esporta come PDF</button>
      <button type="button" @click="esportaDXF" class="btn-export">Esporta come DXF</button>
    </section>

    <!-- Sezione Anteprima Grafica -->
    <section class="anteprima">
      <h2>Anteprima Grafica</h2>
      <div class="canvas-wrapper">
        <canvas ref="canvas" width="1500" height="500"></canvas>
      </div>
      <div class="zoom-controls">
        <label>Zoom:</label>
        <input type="range" min="0.5" max="5" step="0.1" v-model.number="scale" @input="disegnaAnteprima" />
      </div>
    </section>

    <!-- Sezione Risultati -->
    <section class="risultati" v-if="risultato !== null">
      <h2>Risultati</h2>
      <p><strong>Lunghezza totale di taglio:</strong> {{ risultato.toFixed(2) }} mm</p>
      <ul>
        <li v-for="(dettaglio, index) in dettagli" :key="index">
          Segmento {{ dettaglio.segmento }}: Lunghezza Effettiva: {{ dettaglio.lunghezzaEffettiva.toFixed(2) }} mm,
          Bend Allowance: {{ dettaglio.bendAllowance.toFixed(2) }} mm
        </li>
      </ul>
    </section>

    <!-- Sezione Riepilogo Visivo delle Dimensioni -->
    <section class="riepilogo-dimensioni" v-if="segments.length > 0">
      <h2>Riepilogo Visivo delle Dimensioni</h2>
      <div class="riepilogo">
        <ul>
          <li v-for="(segment, index) in segments" :key="index">
            <strong>Segmento {{ index + 1 }}:</strong> Lunghezza: {{ segment.length }} mm, Angolo: {{ segment.angle }}°, Tipo di Piega: {{ segment.tipoPiega }}
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script>
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

export default {
  data() {
    return {
      spessore: 2.0,
      raggioPiega: 1.0,
      materialeSelezionato: '',
      fattoreK: 0.33,
      fattoriKMateriali: {
        acciaio: 0.33,
        alluminio: 0.40,
        rame: 0.45,
      },
      nuovoMateriale: {
        nome: '',
        fattoreK: 0,
      },
      segments: [], // Nessun segmento predefinito
      risultato: null,
      dettagli: [],
      scale: 1,
      panX: 0,
      panY: 0,
      isPanning: false,
      startPan: { x: 0, y: 0 },
      errors: {
        spessore: false,
        raggioPiega: false,
      },
    };
  },
  methods: {
    aggiornaFattoreK() {
      this.fattoreK = this.fattoriKMateriali[this.materialeSelezionato] || 0.33;
      this.calcolaSviluppo();
    },
    aggiungiMateriale() {
      if (this.nuovoMateriale.nome && this.nuovoMateriale.fattoreK > 0) {
        this.$set(this.fattoriKMateriali, this.nuovoMateriale.nome, this.nuovoMateriale.fattoreK);
        this.nuovoMateriale.nome = '';
        this.nuovoMateriale.fattoreK = 0;
      }
    },
    aggiungiLato() {
      this.segments = [...this.segments, { length: 50, angle: 90, tipoPiega: 'su', errorLength: false, errorAngle: false }];
      this.disegnaAnteprima();
      this.calcolaSviluppo();
    },
    rimuoviLato(index) {
      this.segments.splice(index, 1);
      this.disegnaAnteprima();
      this.calcolaSviluppo();
    },
    validaSpessore() {
      this.errors.spessore = this.spessore <= 0;
      this.calcolaSviluppo();
    },
    validaRaggioPiega() {
      this.errors.raggioPiega = this.raggioPiega < 0;
      this.calcolaSviluppo();
    },
    validaLunghezza(segment) {
      segment.errorLength = segment.length <= 0;
    },
    validaAngolo(segment) {
      segment.errorAngle = segment.angle < -180 || segment.angle > 180;
    },
    disegnaAnteprima() {
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.scale, this.scale);

      const xStart = canvas.width / 2 / this.scale; // Punto iniziale x centrato
      const yStart = canvas.height / 2 / this.scale; // Punto iniziale y centrato verticalmente
      let x = xStart;
      let y = yStart;
      let angoloCorrente = 0; // Inizia orizzontalmente

      // Disegna ogni segmento
      for (let i = 0; i < this.segments.length; i++) {
        const segmento = this.segments[i];
        const lunghezza = segmento.length;

        // Calcola il punto finale
        const x2 = x + lunghezza * Math.cos((angoloCorrente * Math.PI) / 180);
        const y2 = y - lunghezza * Math.sin((angoloCorrente * Math.PI) / 180);

        // Disegna la linea
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = '#007bff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Disegna un cerchio per i punti di piega (ogni piega tra segmenti)
        if (i > 0) {
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = '#dc3545';
          ctx.fill();
        }

        // Aggiorna il punto iniziale
        x = x2;
        y = y2;

        // Aggiorna l'angolo corrente
        if (segmento.angle) {
          angoloCorrente += segmento.angle * (segmento.tipoPiega === 'su' ? 1 : -1);
        }
      }
      ctx.restore();
    },
    calcolaSviluppo() {
      let sviluppoTotale = 0;
      this.dettagli = [];

      for (let i = 0; i < this.segments.length; i++) {
        const segmento = this.segments[i];
        let lunghezzaEffettiva = segmento.length;

        if (i > 0 && segmento.angle >= 0 && segmento.angle <= 80) {
          lunghezzaEffettiva = segmento.length;
        } else if (i === 0 || i === this.segments.length - 1) {
          lunghezzaEffettiva -= this.spessore;
        } else {
          lunghezzaEffettiva -= 2 * this.spessore;
        }

        let bendAllowance = 0;
        if (i > 0) {
          const angolo = segmento.angle;
          bendAllowance = this.calcolaBendAllowance(
            angolo,
            this.fattoreK,
            this.spessore,
            this.raggioPiega
          );
        }

        sviluppoTotale += lunghezzaEffettiva + bendAllowance;

        this.dettagli.push({
          segmento: i + 1,
          lunghezzaEffettiva,
          bendAllowance,
        });
      }

      this.risultato = sviluppoTotale;
    },
    calcolaBendAllowance(angolo, fattoreK, spessore, raggioPiega) {
      return ((Math.PI / 180) * angolo) * (raggioPiega + fattoreK * spessore);
    },
    esportaPDF() {
      const doc = new jsPDF();
      doc.text("Calcolatore Sviluppo Lamiera - Risultati", 10, 10);
      doc.text(`Spessore: ${this.spessore} mm`, 10, 20);
      doc.text(`Raggio di piega: ${this.raggioPiega} mm`, 10, 30);
      doc.text("Segmenti:", 10, 40);

      this.segments.forEach((segment, index) => {
        doc.text(
          `Segmento ${index + 1}: Lunghezza: ${segment.length} mm, Angolo: ${segment.angle}°, Tipo di Piega: ${segment.tipoPiega}`,
          10,
          50 + index * 10
        );
      });

      doc.text(`Lunghezza totale di taglio: ${this.risultato.toFixed(2)} mm`, 10, 60 + this.segments.length * 10);

      doc.save("sviluppo_lamiera.pdf");
    },
    esportaDXF() {
      let dxfContent = "0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nSECTION\n2\nTABLES\n0\nENDSEC\n0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n0\nSECTION\n2\nENTITIES\n";
      let x = 0;
      let y = 0;
      let angoloCorrente = 0;

      for (let i = 0; i < this.segments.length; i++) {
        const segmento = this.segments[i];
        const lunghezza = segmento.length;
        const x2 = x + lunghezza * Math.cos((angoloCorrente * Math.PI) / 180);
        const y2 = y + lunghezza * Math.sin((angoloCorrente * Math.PI) / 180);

        dxfContent += `0\nLINE\n8\n0\n10\n${x}\n20\n${y}\n11\n${x2}\n21\n${y2}\n0\n`;

        x = x2;
        y = y2;

        if (segmento.angle) {
                   angoloCorrente += segmento.angle * (segmento.tipoPiega === 'su' ? 1 : -1);
        }
      }

      dxfContent += "0\nENDSEC\n0\nSECTION\n2\nEOF\n";

      const blob = new Blob([dxfContent], { type: "application/dxf" });
      saveAs(blob, "sviluppo_lamiera.dxf");
    },
    handleWheel(event) {
      event.preventDefault();
      const scaleAmount = -event.deltaY * 0.001;
      this.scale = Math.min(Math.max(this.scale + scaleAmount, 0.5), 5);
      this.disegnaAnteprima();
    },
    handleMouseDown(event) {
      this.isPanning = true;
      this.startPan = { x: event.clientX - this.panX, y: event.clientY - this.panY };
    },
    handleMouseMove(event) {
      if (!this.isPanning) return;
      this.panX = event.clientX - this.startPan.x;
      this.panY = event.clientY - this.startPan.y;
      this.disegnaAnteprima();
    },
    handleMouseUp() {
      this.isPanning = false;
    },
  },
  watch: {
    segments: {
      handler() {
        this.disegnaAnteprima();
        this.calcolaSviluppo();
      },
      deep: true,
    },
  },
  mounted() {
    const canvas = this.$refs.canvas;
    canvas.addEventListener("wheel", this.handleWheel);
    canvas.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mouseup", this.handleMouseUp);
    this.disegnaAnteprima();
  },
  beforeUnmount() {
    const canvas = this.$refs.canvas;
    canvas.removeEventListener("wheel", this.handleWheel);
    canvas.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mouseup", this.handleMouseUp);
  },
};
</script>

<style scoped>
.calcolatore {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #f9f9f9;
  border: 1px solid #ccc;
  border-radius: 8px;
}

header h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

section {
  margin-bottom: 20px;
  padding: 15px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.canvas-wrapper {
  overflow: hidden;
  border: 1px solid #ddd;
  background: #fff;
  display: block;
  margin: 0 auto;
  cursor: grab;
}

canvas {
  display: block;
}

.zoom-controls {
  text-align: center;
  margin-top: 10px;
}

.btn-add,
.btn-remove,
.btn-calculate,
.btn-add-materiale,
.btn-export {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.btn-remove {
  background: #dc3545;
  margin-top: 5px;
}

.btn-add:hover,
.btn-remove:hover,
.btn-calculate:hover,
.btn-add-materiale:hover,
.btn-export:hover {
  background: #0056b3;
}

.error-message {
  color: red;
  font-size: 0.9em;
  margin-top: 5px;
}

.riepilogo {
  background: #f1f1f1;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
}
</style>
