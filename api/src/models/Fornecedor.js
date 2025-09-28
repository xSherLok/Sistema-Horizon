import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  rua: String,
  numero: String,
  bairro: String,
  cidade: String,
  uf: { type: String, uppercase: true, maxlength: 2 },
  cep: String,
}, { _id: false });

const fornecedorSchema = new mongoose.Schema({
  razaoSocial: { type: String, required: true, trim: true },  // equivalente a "nome"
  nomeFantasia: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true, index: true },
  telefone: { type: String, trim: true },
  cnpj: { type: String, trim: true, index: true },
  inscricaoEstadual: { type: String, trim: true },
  endereco: addressSchema,
  observacoes: { type: String, trim: true },
  status: { type: String, enum: ['ativo', 'inativo'], default: 'ativo', index: true },
}, { timestamps: true });

fornecedorSchema.index({ razaoSocial: 'text', nomeFantasia: 'text', email: 'text', cnpj: 'text' });

export default mongoose.model('Fornecedor', fornecedorSchema);
