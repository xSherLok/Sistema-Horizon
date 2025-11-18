import mongoose from 'mongoose';
const ItemSchema = new mongoose.Schema({
  produto: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto', required: true },
  nomeProduto: { type: String, required: true },
  qtd: { type: Number, required: true, min: 1 },
  precoUnit: { type: Number, required: true, min: 0 },
  subtotal: { type: Number, required: true, min: 0 },
}, { _id: false });
const PagamentoSchema = new mongoose.Schema({
  forma: { type: String, enum: ['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'outro'], default: 'dinheiro' },
  status: { type: String, enum: ['pendente', 'pago', 'parcial'], default: 'pendente' },
  desconto: { type: Number, default: 0, min: 0 },
  acrescimo: { type: Number, default: 0, min: 0 },
  valorPago: { type: Number, default: 0, min: 0 },
}, { _id: false });
const VendaSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
  itens: { type: [ItemSchema], default: [] },
  observacoes: { type: String, trim: true },
  totais: {
    qtdItens: { type: Number, default: 0 },
    bruto: { type: Number, default: 0 },
    desconto: { type: Number, default: 0 },
    liquido: { type: Number, default: 0 },
  },
  pagamento: { type: PagamentoSchema, default: () => ({}) },
  status: { type: String, enum: ['rascunho', 'finalizada', 'cancelada'], default: 'rascunho' },
  dataFinalizacao: { type: Date },
}, { timestamps: true });
export default mongoose.model('Venda', VendaSchema);
