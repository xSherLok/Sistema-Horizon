import mongoose from 'mongoose';
const ProdutoSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true, index: true },
  categoria: { type: String, trim: true },
  tamanho: { type: String, trim: true },
  cores: [{ type: String, trim: true }],
  status: { type: String, enum: ['ativo', 'inativo'], default: 'ativo' },
  estoque: { type: Number, default: 0, min: 0 },
  precoCusto: { type: Number, default: 0 },
  precoVenda: { type: Number, default: 0 },
  fornecedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Fornecedor' },
  ean: { type: String, trim: true },
  descricao: { type: String, trim: true },
  observacoes: { type: String, trim: true },
}, { timestamps: true });
ProdutoSchema.index({ nome: 'text', categoria: 'text', descricao: 'text' });
export default mongoose.model('Produto', ProdutoSchema);
