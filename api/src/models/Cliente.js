import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  rua: String,
  numero: String,
  bairro: String,
  cidade: String,
  uf: { type: String, uppercase: true, maxlength: 2 },
  cep: String,
}, { _id: false });

const clienteSchema = new mongoose.Schema({
  nome: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, index: true },
  telefone: { type: String, trim: true },
  cpfCnpj: { type: String, trim: true, index: true },
  endereco: addressSchema,
  observacoes: { type: String, trim: true },
  status: { type: String, enum: ['ativo', 'inativo'], default: 'ativo', index: true },
}, { timestamps: true });

clienteSchema.index({ nome: 'text', email: 'text', cpfCnpj: 'text' });

export default mongoose.model('Cliente', clienteSchema);
