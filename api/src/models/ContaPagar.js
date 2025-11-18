import mongoose from 'mongoose';

const ContaPagarSchema = new mongoose.Schema(
  {
    descricao: {
      type: String,
      required: true, // se quiser deixar opcional, pode tirar o required
      trim: true,
    },

    valor: {
      type: Number,
      required: true,
      min: 0,
    },

    vencimento: {
      type: Date,
      required: true,
    },

    pagamento: {
      type: Date,
    },

    status: {
      type: String,
      enum: ['aberta', 'paga', 'vencida', 'cancelada'],
      default: 'aberta',
    },

    formaPgto: {
      type: String,
      trim: true,
    },

    centroCusto: {
      type: String,
      trim: true,
    },

    observacoes: {
      type: String,
      trim: true,
    },

    // 🔴 IMPORTANTE: relação com Fornecedor
    fornecedor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fornecedor',
      required: true, // se quiser poder salvar sem fornecedor, pode tirar o required
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('ContaPagar', ContaPagarSchema);
