import mongoose from 'mongoose';
const ContaPagarSchema = new mongoose.Schema({
  fornecedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Fornecedor' },
  documento: { type: String, trim: true },
  valor: { type: Number, required: true, min: 0 },
  emissao: { type: Date },
  vencimento: { type: Date, required: true },
  pagamento: { type: Date },
  status: { type: String, enum: ['aberta', 'paga', 'vencida', 'cancelada'], default: 'aberta' },
  forma: { type: String, trim: true },
  categoria: { type: String, trim: true },
  centroCusto: { type: String, trim: true },
  numeroDoc: { type: String, trim: true },
  qtdParcelas: { type: Number, default: 1, min: 1 },
  parcelaAtual: { type: Number, default: 1, min: 1 },
  observacoes: { type: String, trim: true },
}, { timestamps: true });
export default mongoose.model('ContaPagar', ContaPagarSchema);
