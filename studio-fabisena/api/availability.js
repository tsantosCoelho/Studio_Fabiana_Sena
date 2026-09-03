export default async function handler(req, res) {

    if (req.method !== "GET") {

        return res.status(405).json({
            message: "Método não permitido."
        });
    }


    const date =
        typeof req.query.date === "string"
            ? req.query.date
            : "";


    /*
     * Validação rigorosa de data
     */
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {

        return res.status(400).json({
            message: "Data inválida."
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


    try {

        const url =
            `${backendUrl}?action=availability` +
            `&date=${encodeURIComponent(date)}` +
            `&token=${encodeURIComponent(backendToken)}`;


        const response =
            await fetch(url, {
                method: "GET",
                cache: "no-store"
            });


        if (!response.ok) {

            throw new Error(
                "Backend indisponível."
            );
        }


        const data =
            await response.json();


        /*
         * Retornamos somente horários ocupados.
         *
         * NUNCA:
         * nome
         * telefone
         * observações
         * dados da cliente
         */
        return res.status(200).json({
            occupied:
                Array.isArray(data.occupied)
                    ? data.occupied
                    : []
        });


    } catch (error) {

        console.error(error);

        return res.status(502).json({
            message:
                "Não foi possível consultar os horários."
        });
    }
}