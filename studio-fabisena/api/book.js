export default async function handler(req, res) {
    // ==========================================
    // SOMENTE POST
    // ==========================================

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Método não permitido."
        });
    }

    // ==========================================
    // VARIÁVEIS DE AMBIENTE
    // ==========================================

    const backendUrl = process.env.APPS_SCRIPT_URL;
    const backendToken = process.env.BACKEND_TOKEN;

    if (!backendUrl || !backendToken) {
        console.error("Variáveis de ambiente não configuradas.");

        return res.status(500).json({
            success: false,
            message: "Erro interno."
        });
    }

    // ==========================================
    // LER BODY
    // ==========================================

    let body;

    try {
        if (typeof req.body === "object" && req.body !== null) {
            body = req.body;
        } else {
            body = JSON.parse(req.body || "{}");
        }
    } catch (error) {
        console.error("Erro ao interpretar body:", error);

        return res.status(400).json({
            success: false,
            message: "Dados inválidos."
        });
    }

    // ==========================================
    // LIMPAR E LIMITAR DADOS
    // ==========================================

    const service =
        typeof body.service === "string"
            ? body.service.trim().slice(0, 100)
            : "";

    const date =
        typeof body.date === "string"
            ? body.date.trim()
            : "";

    const time =
        typeof body.time === "string"
            ? body.time.trim()
            : "";

    const name =
        typeof body.name === "string"
            ? body.name.trim().slice(0, 80)
            : "";

    const phone =
        typeof body.phone === "string"
            ? body.phone.trim().slice(0, 20)
            : "";

    const customTime =
        body.customTime === true;

    // ==========================================
    // CAMPOS OBRIGATÓRIOS
    // ==========================================

    if (!service || !date || !time || !name || !phone) {
        return res.status(400).json({
            success: false,
            message: "Preencha todos os campos."
        });
    }

    // ==========================================
    // VALIDAR DATA
    // ==========================================

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
            success: false,
            message: "Data inválida."
        });
    }

    // ==========================================
    // VALIDAR HORÁRIO
    // ==========================================

    if (!/^\d{2}:\d{2}$/.test(time)) {
        return res.status(400).json({
            success: false,
            message: "Horário inválido."
        });
    }

    // ==========================================
    // VALIDAR HORA REAL
    // Evita coisas como 99:99
    // ==========================================

    const [hours, minutes] = time.split(":").map(Number);

    if (
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
    ) {
        return res.status(400).json({
            success: false,
            message: "Horário inválido."
        });
    }

    // ==========================================
    // VALIDAR NOME
    // ==========================================

    if (/[\u0000-\u001F\u007F]/.test(name)) {
        return res.status(400).json({
            success: false,
            message: "Nome inválido."
        });
    }

    if (name.length < 2) {
        return res.status(400).json({
            success: false,
            message: "Nome inválido."
        });
    }

    // ==========================================
    // VALIDAR WHATSAPP
    // ==========================================

    const phoneDigits = phone.replace(/\D/g, "");

    if (
        phoneDigits.length < 10 ||
        phoneDigits.length > 13
    ) {
        return res.status(400).json({
            success: false,
            message: "WhatsApp inválido."
        });
    }

    // ==========================================
    // ENVIAR PARA GOOGLE APPS SCRIPT
    // ==========================================

    try {
        const payload = {
            action: "book",

            // Token fica SOMENTE no servidor
            token: backendToken,

            service,
            date,
            time,
            name,
            phone,
            customTime
        };

        console.log("Enviando agendamento para Apps Script:", {
            service,
            date,
            time,
            name,
            phoneLength: phoneDigits.length,
            customTime
        });

        const response = await fetch(backendUrl, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify(payload)
        });

        // ==========================================
        // LER RESPOSTA DO APPS SCRIPT
        // ==========================================

        const responseText = await response.text();

        console.log(
            "Resposta do Google Apps Script:",
            response.status,
            responseText
        );

        let data;

        try {
            data = JSON.parse(responseText);
        } catch (error) {
            console.error(
                "Apps Script não retornou JSON válido:",
                responseText
            );

            return res.status(502).json({
                success: false,
                message:
                    "O sistema de agendamento retornou uma resposta inválida."
            });
        }

        // ==========================================
        // ERRO RETORNADO PELO APPS SCRIPT
        // ==========================================

        if (!response.ok || !data.success) {
            console.error(
                "Erro retornado pelo Apps Script:",
                data
            );

            return res.status(400).json({
                success: false,
                message:
                    data.message ||
                    "Não foi possível realizar o agendamento."
            });
        }

        // ==========================================
        // SUCESSO
        // ==========================================

        return res.status(200).json({
            success: true,
            whatsappUrl:
                data.whatsappUrl || null
        });

    } catch (error) {
        console.error(
            "Erro ao comunicar com Apps Script:",
            error
        );

        return res.status(502).json({
            success: false,
            message:
                "Erro ao comunicar com o sistema de agendamento."
        });
    }
}
