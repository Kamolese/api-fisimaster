const mongoose = require('mongoose');

const pacienteSchema = mongoose.Schema(
  {
    nome: {
      type: String,
      required: [true, 'Por favor adicione um nome'],
    },
    dataNascimento: {
      type: Date,
      required: [true, 'Por favor adicione uma data de nascimento'],
    },
    telefone: {
      type: String,
    },
    email: {
      type: String,
    },
    endereco: {
      rua: String,
      numero: String,
      complemento: String,
      bairro: String,
      cidade: String,
      estado: String,
      cep: String,
    },
    planoSaude: {
      type: String,
      enum: ['SUS', 'APAS', 'UNIMED', 'Particular', 'Outros'],
      required: [true, 'Por favor selecione um plano de saúde'],
    },
    numeroCarteirinha: {
      type: String,
    },
    observacoes: {
      type: String,
    },
    fisioterapeuta: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Paciente', pacienteSchema);