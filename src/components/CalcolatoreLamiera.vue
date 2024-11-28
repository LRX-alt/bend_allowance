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
  mounted() {
    const canvas = this.$refs.canvas;

    // Aggiungi eventi per il mouse
    canvas.addEventListener("wheel", this.handleWheel);
    canvas.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("mouseup", this.handleMouseUp);

    // Aggiungi eventi per il touch
    canvas.addEventListener("touchstart", this.handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", this.handleTouchMove, { passive: false });
    window.addEventListener("touchend", this.handleTouchEnd);

    this.disegnaAnteprima();
  },
  beforeUnmount() {
    const canvas = this.$refs.canvas;

    // Rimuovi eventi per il mouse
    canvas.removeEventListener("wheel", this.handleWheel);
    canvas.removeEventListener("mousedown", this.handleMouseDown);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mouseup", this.handleMouseUp);

    // Rimuovi eventi per il touch
    canvas.removeEventListener("touchstart", this.handleTouchStart);
    canvas.removeEventListener("touchmove", this.handleTouchMove);
    window.removeEventListener("touchend", this.handleTouchEnd);
  },
  methods: {
    handleTouchStart(event) {
      this.isPanning = true;
      const touch = event.touches[0];
      this.startPan = { x: touch.clientX - this.panX, y: touch.clientY - this.panY };
    },
    handleTouchMove(event) {
      if (!this.isPanning) return;
      event.preventDefault(); // Previene lo scroll della pagina durante il pan del disegno
      const touch = event.touches[0];
      this.panX = touch.clientX - this.startPan.x;
      this.panY = touch.clientY - this.startPan.y;
      this.disegnaAnteprima();
    },
    handleTouchEnd() {
      this.isPanning = false;
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
    handleWheel(event) {
      event.preventDefault();
      const scaleAmount = -event.deltaY * 0.001;
      this.scale = Math.min(Math.max(this.scale + scaleAmount, 0.5), 5);
      this.disegnaAnteprima();
    },
    disegnaAnteprima() {
      const canvas = this.$refs.canvas;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.scale, this.scale);

      // Calcola la posizione iniziale dinamicamente per centrare il disegno
      const xStart = canvas.width / 2 / this.scale;
      const yStart = canvas.height / 2 / this.scale;
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
    }
  }
};
</script>
