export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            message: "Método não permitido."
        });
    }


    const backendUrl =
        process.env.APPS_SCRIPT_URL;

    const backendToken =
        process.env.BACKEND_TOKEN;


    if (!backendUrl || !backendToken) {

        console.error(
            "Variáveis de ambiente não configuradas."
        );

        return res.status(500).json({
            message: "Erro interno."
        });
    }


    let body;


    try {

        body =
            typeof req.body === "object"
                ? req.body
                : JSON.parse(req.body || "{}");

    } catch {

        return res.status(400).json({
            message: "Dados inválidos."
        });
    }


    /*
     * Limites antes de enviar ao backend
     */
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


    if (!service || !date || !time || !name || !phone) {

        return res.status(400).json({
            message:
                "Preencha todos os campos."
        });
    }


    /*
     * Formato da data
     */
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {

        return res.status(400).json({
            message: "Data inválida."
        });
    }


    /*
     * Formato de horário
     */
    if (!/^\d{2}:\d{2}$/.test(time)) {

        return res.status(400).json({
            message: "Horário inválido."
        });
    }


    /*
     * Nome sem caracteres de controle
     */
    if (/[\u0000-\u001F\u007F]/.test(name)) {

        return res.status(400).json({
            message: "Nome inválido."
        });
    }


    /*
     * WhatsApp
     */
    const phoneDigits =
        phone.replace(/\D/g, "");


    if (
        phoneDigits.length < 10 ||
        phoneDigits.length > 13
    ) {

        return res.status(400).json({
            message: "WhatsApp inválido."
        });
    }


    try {

        const response =
            await fetch(
                backendUrl,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        action:
                            "book",

                        token:
                            backendToken,

                        service,
                        date,
                        time,
                        name,
                        phone,
                        customTime

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            return res.status(
                response.status >= 400
                    ? response.status
                    : 400
            ).json({
                message:
                    data.message ||
                    "Não foi possível realizar o agendamento."
            });
        }


        /*
         * O backend cria a URL do WhatsApp.
         */
        return res.status(200).json({

            success: true,

            whatsappUrl:
                data.whatsappUrl
        });


    } catch (error) {

        console.error(error);

        return res.status(502).json({
            message:
                "Erro ao comunicar com o sistema."
        });
    }
}