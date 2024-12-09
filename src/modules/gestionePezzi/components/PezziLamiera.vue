<template>
  <div class="pezzi-lamiera">
    <h1>Gestione Pezzi di Lamiera</h1>
    <button @click="mostraFormInserimento = !mostraFormInserimento">
      {{ mostraFormInserimento ? 'Chiudi' : 'Aggiungi Nuovo Pezzo' }}
    </button>
    
    <div v-if="mostraFormInserimento" class="inserimento-form">
      <h2>Nuovo Pezzo di Lamiera</h2>
      <form @submit.prevent="aggiungiPezzo">
        <div>
          <label for="tipo">Tipo Lamiera:</label>
          <input type="text" v-model="nuovoPezzo.Tipo_Lamiera" required />
        </div>
        <div>
          <label for="spessore">Spessore (mm):</label>
          <input type="number" step="0.01" v-model="nuovoPezzo.Spessore" required />
        </div>
        <div>
          <label for="lunghezza">Lunghezza (mm):</label>
          <input type="number" step="0.01" v-model="nuovoPezzo.Lunghezza" required />
        </div>
        <div>
          <label for="larghezza">Larghezza (mm):</label>
          <input type="number" step="0.01" v-model="nuovoPezzo.Larghezza" required />
        </div>
        <div>
          <label for="quantita">Quantità:</label>
          <input type="number" v-model="nuovoPezzo.Quantità" required />
        </div>
        <div>
          <label for="note">Note:</label>
          <input type="text" v-model="nuovoPezzo.Note" />
        </div>
        <button type="submit">Aggiungi Pezzo</button>
      </form>
    </div>

    <div class="pezzi-table">
      <table>
        <thead>
          <tr>
            <th>Numero Collo</th>
            <th>Tipo Lamiera</th>
            <th>Spessore</th>
            <th>Lunghezza</th>
            <th>Larghezza</th>
            <th>Quantità</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pezzo in pezzi" :key="pezzo.ID">
            <td>{{ pezzo.Numero_Collo }}</td>
            <td>{{ pezzo.Tipo_Lamiera }}</td>
            <td>{{ pezzo.Spessore }}</td>
            <td>{{ pezzo.Lunghezza }}</td>
            <td>{{ pezzo.Larghezza }}</td>
            <td>{{ pezzo.Quantità }}</td>
            <td>{{ pezzo.Note }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      pezzi: [],
      mostraFormInserimento: false,
      nuovoPezzo: {
        Tipo_Lamiera: '',
        Spessore: '',
        Lunghezza: '',
        Larghezza: '',
        Quantità: '',
        Note: ''
      }
    };
  },
  created() {
    this.caricaPezzi();
  },
  methods: {
    caricaPezzi() {
      axios
        .get('http://localhost:3000/api/pezzi')
        .then((response) => {
          this.pezzi = response.data;
        })
        .catch((error) => {
          console.error('Errore durante il caricamento dei pezzi:', error);
        });
    },
    aggiungiPezzo() {
      axios
        .post('http://localhost:3000/api/pezzi', this.nuovoPezzo)
        .then(() => {
          this.caricaPezzi();
          this.mostraFormInserimento = false;
          this.nuovoPezzo = {
            Tipo_Lamiera: '',
            Spessore: '',
            Lunghezza: '',
            Larghezza: '',
            Quantità: '',
            Note: ''
          };
        })
        .catch((error) => {
          console.error('Errore durante l\'aggiunta del pezzo:', error);
        });
    }
  }
};
</script>

<style scoped>
.pezzi-lamiera {
  padding: 20px;
}
.inserimento-form {
  margin-bottom: 20px;
}
.pezzi-table table {
  width: 100%;
  border-collapse: collapse;
}
.pezzi-table th,
.pezzi-table td {
  border: 1px solid #ccc;
  padding: 10px;
  text-align: left;
}
</style>
