import mongoose from 'mongoose';
const ContaReceberSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' },
  documento: { type: String, trim: true },
  valor: { type: Number, required: true, min: 0 },
  emissao: { type: Date },
  vencimento: { type: Date, required: true },
  recebimento: { type: Date },
  status: { type: String, enum: ['aberta', 'recebida', 'vencida', 'cancelada'], default: 'aberta' },
  forma: { type: String, trim: true },
  categoria: { type: String, trim: true },
  centroCusto: { type: String, trim: true },
  numeroDoc: { type: String, trim: true },
  qtdParcelas: { type: Number, default: 1, min: 1 },
  parcelaAtual: { type: Number, default: 1, min: 1 },
  observacoes: { type: String, trim: true },
}, { timestamps: true });
export default mongoose.model('ContaReceber', ContaReceberSchema);
