export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Método não permitido."
        });
    }

    const backendUrl = process.env.APPS_SCRIPT_URL;

    if (!backendUrl) {
        console.error("APPS_SCRIPT_URL não configurada.");

        return res.status(500).json({
            success: false,
            message: "Erro interno."
        });
    }

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

    // =========================
    // VALIDAÇÕES
    // =========================

    if (!service || !date || !time || !name || !phone) {
        return res.status(400).json({
            success: false,
            message: "Preencha todos os campos."
        });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
            success: false,
            message: "Data inválida."
        });
    }

    if (!/^\d{2}:\d{2}$/.test(time)) {
        return res.status(400).json({
            success: false,
            message: "Horário inválido."
        });
    }

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

    // =========================
    // ENVIO PARA APPS SCRIPT
    // =========================

    try {
        const payload = {
            action: "book",
            service,
            date,
            time,
            name,
            phone,
            customTime
        };

        console.log(
            "Enviando agendamento para Apps Script:",
            {
                service,
                date,
                time,
                name,
                phoneLength: phoneDigits.length,
                customTime
            }
        );

        const response = await fetch(backendUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(payload)
        });

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

        if (!response.ok || data.success === false) {
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
