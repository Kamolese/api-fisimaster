const mongoose = require('mongoose');

const procedimentoSchema = mongoose.Schema(
  {
    nome: {
      type: String,
    },
    descricao: {
      type: String,
    },
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paciente',
      required: true,
    },
    fisioterapeuta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dataRealizacao: {
      type: Date,
      default: Date.now,
      required: true,
    },
    evolucao: {
      type: String,
    },
    valor: {
      type: Number,
      default: 5,
      required: true,
    },
    planoSaude: {
      type: String,
      enum: ['SUS', 'APAS', 'UNIMED', 'Particular', 'Outros'],
      required: true,
    },
    valorPlano: {
      type: Number,
      required: [true, 'Por favor adicione o valor que o plano paga'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Procedimento', procedimentoSchema);