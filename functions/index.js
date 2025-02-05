const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { MercadoPagoConfig, Payment } = require("mercadopago");

// Inicializa Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Inicializa Mercado Pago
const mpClient = new MercadoPagoConfig({
  accessToken: "TEST-3466688062744653-012209-b4f5a7a99134d2dbfbbabfbf07b4317f-321577763",
});
const payment = new Payment(mpClient);

// 🔹 Processar Pagamento
exports.processPayment = functions.https.onRequest(async (req, res) => {
  try {
    const { formData, userId } = req.body;

    if (!formData || !formData.token || !formData.transaction_amount) {
      return res.status(400).json({ success: false, message: "Dados inválidos." });
    }

    const paymentRequest = {
      transaction_amount: formData.transaction_amount,
      token: formData.token,
      description: "Recarga de Créditos",
      installments: formData.installments || 1,
      payment_method_id: formData.payment_method_id,
      payer: {
        email: formData.payer.email,
        identification: {
          type: formData.payer.identification.type,
          number: formData.payer.identification.number,
        },
      },
      metadata: { userId: userId || "guest_user" },
    };

    const response = await payment.create({ body: paymentRequest });

    if (response.status === "approved") {
      await db.collection("transactions").doc(response.id).set({
        userId,
        amount: response.transaction_amount,
        status: "approved",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      await updateBalance(userId, response.transaction_amount);

      return res.status(200).json({ success: true, message: "Pagamento aprovado", payment: response.body });
    } else {
      return res.status(400).json({ success: false, message: "Pagamento rejeitado", detail: response.status_detail });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro no pagamento", error: error.message });
  }
});

// 🔹 Obter Saldo
exports.getBalance = functions.https.onRequest(async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, message: "ID do usuário inválido." });

    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      await userRef.set({ balance: 0 });
      return res.status(200).json({ success: true, balance: 0 });
    }

    return res.status(200).json({ success: true, balance: userSnap.data().balance });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro ao obter saldo", error: error.message });
  }
});

// 🔹 Atualizar Saldo
exports.updateBalance = functions.https.onRequest(async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || amount <= 0) return res.status(400).json({ success: false, message: "Parâmetros inválidos." });

    await updateBalance(userId, amount);
    return res.status(200).json({ success: true, message: "Saldo atualizado." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro ao atualizar saldo", error: error.message });
  }
});

// 🔹 Diminuir Saldo
exports.decreaseBalance = functions.https.onRequest(async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || amount <= 0) return res.status(400).json({ success: false, message: "Parâmetros inválidos." });

    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists || userSnap.data().balance < amount) {
      return res.status(400).json({ success: false, message: "Saldo insuficiente." });
    }

    await userRef.update({ balance: admin.firestore.FieldValue.increment(-amount) });
    return res.status(200).json({ success: true, message: "Saldo reduzido." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro ao diminuir saldo", error: error.message });
  }
});

// 🔹 Adicionar ao Histórico
exports.addToHistory = functions.https.onRequest(async (req, res) => {
  try {
    const { serviceId, driverId, userId, amount, finalizedAt } = req.body;
    if (!serviceId || !driverId || !userId || !amount || !finalizedAt) {
      return res.status(400).json({ success: false, message: "Parâmetros inválidos." });
    }

    await db.collection("order_history").add({
      serviceId,
      driverId,
      userId,
      amount,
      finalizedAt,
      status: "Finalizado",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ success: true, message: "Histórico salvo." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro ao salvar histórico", error: error.message });
  }
});

// 🔹 Solicitar Retirada
exports.requestWithdrawal = functions.https.onRequest(async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (!userId || amount <= 0) return res.status(400).json({ success: false, message: "Parâmetros inválidos." });

    const userRef = db.collection("users").doc(userId);
    const userSnap = await userRef.get();
    if (!userSnap.exists || userSnap.data().balance < amount) {
      return res.status(400).json({ success: false, message: "Saldo insuficiente." });
    }

    await userRef.update({ balance: admin.firestore.FieldValue.increment(-amount) });

    await db.collection("withdrawals").add({
      userId,
      amount: amount * 0.97,
      staking: amount * 0.03,
      status: "processing",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ success: true, message: "Saque solicitado." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erro ao solicitar saque", error: error.message });
  }
});

// 🔹 Atualizar Saldo do Usuário (Função Auxiliar)
async function updateBalance(userId, amount) {
  const userRef = db.collection("users").doc(userId);
  await userRef.set({ balance: admin.firestore.FieldValue.increment(amount) }, { merge: true });
}
